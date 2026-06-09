"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useStore } from "@/stores/useStore"
import { SignatureCaptureModal } from "@/components/signature/signature-capture-modal"

/**
 * Mecanisme "ensureSignature" :
 *
 * Avant de declencher une action engageant la signature de l'utilisateur
 * (soumission de demande, validation, rejet...), on appelle :
 *
 *     const signature = await ensureSignature()
 *     if (!signature) return // l'utilisateur a annule -> action abandonnee
 *
 * - Si l'utilisateur a deja une signature dans son profil, la promesse se
 *   resout immediatement avec le data URL.
 * - Sinon, le SignatureCaptureModal s'ouvre en mode "first-time". A la
 *   sauvegarde, la promesse se resout avec la nouvelle signature. Si
 *   l'utilisateur ferme le modal sans sauver, la promesse se resout avec null
 *   et l'action en cours doit etre interrompue.
 *
 * Le provider doit etre monte une seule fois pres de la racine de l'app
 * (cf. components/layout/layout-wrapper.tsx).
 */

type EnsureFn = (contextLabel?: string) => Promise<string | null>

interface SignatureContextValue {
  ensureSignature: EnsureFn
  /** Force le rechargement de la signature depuis l'API (utile apres connexion). */
  refreshSignature: () => Promise<void>
}

const SignatureContext = createContext<SignatureContextValue | null>(null)

export function SignatureProvider({ children }: { children: ReactNode }) {
  const currentUser = useStore((s) => s.currentUser)
  const token = useStore((s) => s.token)

  const [modalOpen, setModalOpen] = useState(false)
  const [contextLabel, setContextLabel] = useState<string | undefined>(undefined)

  // Reference vers le resolver de la promesse en attente. Permet de resoudre
  // depuis les callbacks du modal sans creer une boucle de re-renders.
  const pendingResolver = useRef<((value: string | null) => void) | null>(null)

  // Au montage / changement d'utilisateur connecte, hydrater la signature
  // depuis l'API si elle n'est pas deja dans le store. Cela evite d'ouvrir
  // inutilement le modal pour un utilisateur qui a deja signe.
  const refreshSignature = useCallback(async () => {
    if (!token || !currentUser) return
    if (currentUser.signature) return // deja en cache
    try {
      const res = await fetch("/api/users/me/signature", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) return
      const json = await res.json()
      if (json?.success && json.data?.signature) {
        useStore.setState({
          currentUser: {
            ...currentUser,
            signature: json.data.signature,
            signatureUpdatedAt: json.data.signatureUpdatedAt,
          } as typeof currentUser,
        })
      }
    } catch {
      // silencieux : le hook tentera a nouveau a la prochaine action
    }
  }, [token, currentUser])

  useEffect(() => {
    refreshSignature()
  }, [refreshSignature])

  const ensureSignature: EnsureFn = useCallback(
    (label?: string) => {
      // Cas 1 : signature deja presente -> resoudre immediatement
      const existing = useStore.getState().currentUser?.signature
      if (existing) {
        return Promise.resolve(existing)
      }

      // Cas 2 : pas de signature -> ouvrir le modal et attendre
      setContextLabel(label)
      setModalOpen(true)

      return new Promise<string | null>((resolve) => {
        pendingResolver.current = resolve
      })
    },
    []
  )

  const handleSaved = (signature: string) => {
    setModalOpen(false)
    setContextLabel(undefined)
    const resolver = pendingResolver.current
    pendingResolver.current = null
    resolver?.(signature)
  }

  const handleCancel = () => {
    setModalOpen(false)
    setContextLabel(undefined)
    const resolver = pendingResolver.current
    pendingResolver.current = null
    // null -> l'appelant doit interrompre l'action en cours
    resolver?.(null)
  }

  return (
    <SignatureContext.Provider value={{ ensureSignature, refreshSignature }}>
      {children}
      <SignatureCaptureModal
        isOpen={modalOpen}
        mode="first-time"
        contextLabel={contextLabel}
        onSaved={handleSaved}
        onCancel={handleCancel}
      />
    </SignatureContext.Provider>
  )
}

/**
 * Hook a utiliser dans les composants pour gater une action sur la presence
 * d'une signature utilisateur. Voir doc en haut de fichier.
 */
export function useEnsureSignature(): SignatureContextValue {
  const ctx = useContext(SignatureContext)
  if (!ctx) {
    throw new Error(
      "useEnsureSignature doit etre utilise a l'interieur d'un <SignatureProvider>"
    )
  }
  return ctx
}

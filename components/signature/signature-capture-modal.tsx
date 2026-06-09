"use client"

import { useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { SignaturePad, SignaturePadRef } from "@/components/signature/signature-pad"
import { useStore } from "@/stores/useStore"
import { AlertTriangle, Loader2, CheckCircle2 } from "lucide-react"

interface SignatureCaptureModalProps {
  isOpen: boolean
  /**
   * Appele apres une sauvegarde reussie avec le data URL base64 PNG.
   */
  onSaved: (signature: string) => void
  /**
   * Appele si l'utilisateur ferme le modal sans sauvegarder.
   * Selon la specification, l'action en cours doit alors etre abandonnee.
   */
  onCancel: () => void
  /**
   * Mode :
   * - "first-time" : capture initiale avant une action (modal "bloquant")
   * - "edit"       : modification depuis le profil
   */
  mode?: "first-time" | "edit"
  /**
   * Texte d'introduction personnalisable (ex. "Pour valider cette demande...")
   */
  contextLabel?: string
}

/**
 * Modal de capture de signature manuscrite.
 *
 * Persistance : envoie le data URL base64 PNG a PATCH /api/users/me/signature.
 * En cas de succes, met aussi a jour le store (`currentUser.signature`) pour
 * que le hook `useEnsureSignature` puisse le lire immediatement sans refetch.
 */
export function SignatureCaptureModal({
  isOpen,
  onSaved,
  onCancel,
  mode = "first-time",
  contextLabel,
}: SignatureCaptureModalProps) {
  const padRef = useRef<SignaturePadRef>(null)
  const token = useStore((s) => s.token)
  const currentUser = useStore((s) => s.currentUser)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isFirstTime = mode === "first-time"

  const handleSave = async () => {
    setError(null)

    if (!padRef.current || padRef.current.isEmpty()) {
      setError("Veuillez dessiner votre signature avant de valider.")
      return
    }

    const signature = padRef.current.toDataURL()
    if (!signature.startsWith("data:image/png;base64,")) {
      setError("Format de signature inattendu. Reessayez.")
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch("/api/users/me/signature", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ signature }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Echec de l'enregistrement de la signature")
      }

      // Mettre a jour le store pour que ensureSignature retourne immediatement
      // la nouvelle valeur sans refetch.
      if (currentUser) {
        useStore.setState({
          currentUser: {
            ...currentUser,
            signature: json.data.signature,
            signatureUpdatedAt: json.data.signatureUpdatedAt,
          } as typeof currentUser,
        })
      }

      padRef.current?.clear()
      onSaved(json.data.signature)
    } catch (err: any) {
      setError(err?.message || "Erreur lors de l'enregistrement")
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    if (isSaving) return
    padRef.current?.clear()
    setError(null)
    onCancel()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isFirstTime ? (
              <>
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Signature requise
              </>
            ) : (
              <>
                <CheckCircle2 className="h-5 w-5 text-blue-500" />
                Modifier ma signature
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isFirstTime
              ? contextLabel ||
                "Pour poursuivre, vous devez enregistrer votre signature manuscrite. Elle sera conservee sur votre profil et reutilisee automatiquement sur tous les documents que vous signerez."
              : "Dessinez votre nouvelle signature ci-dessous. Elle remplacera la signature actuellement enregistree."}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <SignaturePad ref={padRef} width={650} height={200} />
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {isFirstTime && (
          <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
            <strong>Information :</strong> votre signature engagera votre
            responsabilite sur les documents que vous signez. Si vous annulez
            cette etape, l'action en cours (validation/soumission) sera
            interrompue et vous pourrez la reprendre plus tard.
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSaving}
          >
            {isFirstTime ? "Annuler l'action" : "Annuler"}
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Enregistrer ma signature"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

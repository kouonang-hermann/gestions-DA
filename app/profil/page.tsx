"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, FileSignature, Loader2, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from "@/stores/useStore"
import { SignaturePreview } from "@/components/signature/signature-preview"
import { SignatureCaptureModal } from "@/components/signature/signature-capture-modal"

interface SignatureData {
  signature: string | null
  signatureUpdatedAt: string | null
  hasSignature: boolean
}

export default function ProfilPage() {
  const router = useRouter()
  const currentUser = useStore((s) => s.currentUser)
  const token = useStore((s) => s.token)

  const [data, setData] = useState<SignatureData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [captureOpen, setCaptureOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Redirection si pas connecte
  useEffect(() => {
    if (!currentUser) {
      router.push("/")
    }
  }, [currentUser, router])

  const loadSignature = async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/users/me/signature", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Erreur de chargement")
      }
      setData(json.data)
    } catch (err: any) {
      setError(err?.message || "Erreur de chargement de la signature")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSignature()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  const handleDelete = async () => {
    if (!token) return
    if (
      !confirm(
        "Supprimer votre signature ? Vous devrez la redessiner lors de votre prochaine action de validation."
      )
    ) {
      return
    }
    setDeleting(true)
    try {
      const res = await fetch("/api/users/me/signature", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Echec de la suppression")
      }
      // Mettre a jour le store pour refleter l'absence de signature
      if (currentUser) {
        useStore.setState({
          currentUser: {
            ...currentUser,
            signature: null,
            signatureUpdatedAt: null,
          } as typeof currentUser,
        })
      }
      setData({
        signature: null,
        signatureUpdatedAt: null,
        hasSignature: false,
      })
    } catch (err: any) {
      setError(err?.message || "Erreur lors de la suppression")
    } finally {
      setDeleting(false)
    }
  }

  const handleSaved = (signature: string) => {
    setCaptureOpen(false)
    setData({
      signature,
      signatureUpdatedAt: new Date().toISOString(),
      hasSignature: true,
    })
  }

  const formatDate = (iso: string | null) => {
    if (!iso) return "—"
    try {
      return new Date(iso).toLocaleString("fr-FR", {
        dateStyle: "long",
        timeStyle: "short",
      })
    } catch {
      return iso
    }
  }

  if (!currentUser) return null

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Mon profil</h1>
        <div className="w-20" /> {/* spacer */}
      </div>

      {/* Informations utilisateur */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Informations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-gray-500">Nom complet</p>
              <p className="font-medium text-gray-900">
                {currentUser.prenom} {currentUser.nom}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium text-gray-900">
                {currentUser.email || "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Telephone</p>
              <p className="font-medium text-gray-900">
                {currentUser.phone || "—"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Role</p>
              <p className="font-medium capitalize text-gray-900">
                {currentUser.role?.replace(/_/g, " ")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Signature */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-blue-600" />
            Ma signature
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Votre signature est capturee une seule fois et reutilisee
            automatiquement sur tous les documents que vous signez : demandes de
            conges, demandes de materiel/outillage, bons de sortie, bons de
            livraison.
          </p>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Chargement...
            </div>
          ) : (
            <>
              <SignaturePreview signature={data?.signature ?? null} height={140} />

              {data?.hasSignature && (
                <p className="text-sm text-gray-500">
                  Derniere mise a jour :{" "}
                  <span className="font-medium text-gray-700">
                    {formatDate(data.signatureUpdatedAt)}
                  </span>
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setCaptureOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  {data?.hasSignature
                    ? "Modifier ma signature"
                    : "Creer ma signature"}
                </Button>
                {data?.hasSignature && (
                  <Button
                    variant="outline"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    {deleting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="mr-2 h-4 w-4" />
                    )}
                    Supprimer
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <SignatureCaptureModal
        isOpen={captureOpen}
        mode={data?.hasSignature ? "edit" : "first-time"}
        contextLabel={
          data?.hasSignature
            ? undefined
            : "Vous n'avez pas encore enregistre de signature. Dessinez-la ci-dessous pour qu'elle apparaisse automatiquement sur les documents que vous signerez."
        }
        onSaved={handleSaved}
        onCancel={() => setCaptureOpen(false)}
      />
    </div>
  )
}

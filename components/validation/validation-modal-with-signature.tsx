"use client"

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { SignaturePad, SignaturePadRef } from '@/components/signature/signature-pad'
import { Demande } from '@/types'

interface ValidationModalWithSignatureProps {
  isOpen: boolean
  onClose: () => void
  demande: Demande
  onValidate: (demandeId: string, commentaire: string, signatureImage: string) => Promise<void>
  title: string
  description?: string
}

export function ValidationModalWithSignature({
  isOpen,
  onClose,
  demande,
  onValidate,
  title,
  description
}: ValidationModalWithSignatureProps) {
  const [commentaire, setCommentaire] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const signaturePadRef = useRef<SignaturePadRef>(null)

  const handleValidate = async () => {
    try {
      setError(null)
      
      // Vérifier que la signature n'est pas vide
      if (signaturePadRef.current?.isEmpty()) {
        setError('Veuillez signer avant de valider')
        return
      }

      setIsSubmitting(true)

      // Récupérer la signature en base64
      const signatureImage = signaturePadRef.current?.toDataURL() || ''

      // Appeler la fonction de validation avec la signature
      await onValidate(demande.id, commentaire, signatureImage)

      // Réinitialiser et fermer
      setCommentaire('')
      signaturePadRef.current?.clear()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la validation')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    setCommentaire('')
    signaturePadRef.current?.clear()
    setError(null)
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <p className="text-sm text-gray-500 mt-2">{description}</p>
          )}
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Informations demande */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Numéro :</span>
              <span>{demande.numero}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Type :</span>
              <span className="capitalize">{demande.type}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Statut :</span>
              <span className="capitalize">{demande.status.replace(/_/g, ' ')}</span>
            </div>
          </div>

          {/* Commentaire */}
          <div className="space-y-2">
            <Label htmlFor="commentaire">
              Commentaire (optionnel)
            </Label>
            <Textarea
              id="commentaire"
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              placeholder="Ajoutez un commentaire sur cette validation..."
              rows={3}
            />
          </div>

          {/* Signature */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">
              Signature électronique *
            </Label>
            <p className="text-sm text-gray-600 mb-2">
              Votre signature certifie que vous avez vérifié et validé cette demande.
              Cette action est <strong>irréversible</strong>.
            </p>
            <SignaturePad ref={signaturePadRef} width={650} height={200} />
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Avertissement */}
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="font-semibold">Attention</p>
                <p className="text-sm">
                  Une fois validée, cette signature ne pourra plus être modifiée.
                  Votre adresse IP et un hash d'intégrité seront enregistrés pour garantir l'authenticité.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleValidate}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Validation en cours...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Valider et Signer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

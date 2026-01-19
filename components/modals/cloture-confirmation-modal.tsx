"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, CheckCircle, Package } from "lucide-react"
import type { Demande } from "@/types"

interface ClotureConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  demande: Demande | null
  onConfirm: (quantitesRecues: { [itemId: string]: number }, commentaire: string) => Promise<void>
  isLoading?: boolean
}

export default function ClotureConfirmationModal({
  isOpen,
  onClose,
  demande,
  onConfirm,
  isLoading = false
}: ClotureConfirmationModalProps) {
  const [quantitesRecues, setQuantitesRecues] = useState<{ [itemId: string]: number }>({})
  const [commentaire, setCommentaire] = useState("")
  const [errors, setErrors] = useState<{ [itemId: string]: string }>({})

  // Initialiser les quantités reçues avec les quantités livrées
  useEffect(() => {
    if (demande?.items) {
      const initialQuantites: { [itemId: string]: number } = {}
      demande.items.forEach(item => {
        // Par défaut, la quantité reçue = quantité sortie (ou validée si pas de sortie)
        initialQuantites[item.id] = item.quantiteSortie || item.quantiteValidee || item.quantiteDemandee
      })
      setQuantitesRecues(initialQuantites)
    }
  }, [demande])

  const handleQuantiteChange = (itemId: string, value: string) => {
    const numValue = parseInt(value) || 0
    const item = demande?.items?.find(i => i.id === itemId)
    
    if (!item) return

    const maxQuantite = item.quantiteSortie || item.quantiteValidee || item.quantiteDemandee

    // Validation
    if (numValue < 0) {
      setErrors(prev => ({ ...prev, [itemId]: "La quantité ne peut pas être négative" }))
    } else if (numValue > maxQuantite) {
      setErrors(prev => ({ ...prev, [itemId]: `Maximum: ${maxQuantite}` }))
    } else {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[itemId]
        return newErrors
      })
    }

    setQuantitesRecues(prev => ({ ...prev, [itemId]: numValue }))
  }

  const handleConfirm = async () => {
    // Vérifier qu'il n'y a pas d'erreurs
    if (Object.keys(errors).length > 0) {
      alert("Veuillez corriger les erreurs avant de confirmer")
      return
    }

    await onConfirm(quantitesRecues, commentaire)
  }

  const getSousDemandePrevision = () => {
    if (!demande?.items) return []
    
    return demande.items
      .map(item => {
        const quantiteSortie = item.quantiteSortie || item.quantiteValidee || item.quantiteDemandee
        const quantiteRecue = quantitesRecues[item.id] || 0
        const manquant = quantiteSortie - quantiteRecue
        
        return {
          article: item.article?.nom || "Article",
          quantiteSortie,
          quantiteRecue,
          manquant
        }
      })
      .filter(item => item.manquant > 0)
  }

  const sousDemandePrevision = getSousDemandePrevision()
  const hasSousDemande = sousDemandePrevision.length > 0

  if (!demande) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Clôture de la demande {demande.numero}
          </DialogTitle>
          <DialogDescription>
            Veuillez renseigner les quantités réellement reçues pour chaque article.
            Si des quantités sont manquantes, une sous-demande sera automatiquement créée.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Liste des articles avec saisie des quantités reçues */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Articles livrés
            </h3>
            
            {demande.items?.map(item => {
              const quantiteSortie = item.quantiteSortie || item.quantiteValidee || item.quantiteDemandee
              const quantiteRecue = quantitesRecues[item.id] || 0
              const hasError = !!errors[item.id]

              return (
                <div 
                  key={item.id} 
                  className={`p-4 rounded-lg border ${hasError ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.article?.nom}</p>
                      <p className="text-sm text-gray-600">
                        Référence: {item.article?.reference || "N/A"}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Quantité sortie: <span className="font-semibold">{item.quantiteSortie || item.quantiteValidee || item.quantiteDemandee}</span> {item.article?.unite}
                      </p>
                    </div>
                    
                    <div className="w-full sm:w-48">
                      <Label htmlFor={`qte-${item.id}`} className="text-sm">
                        Quantité reçue <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id={`qte-${item.id}`}
                        type="number"
                        min="0"
                        max={item.quantiteSortie || item.quantiteValidee || item.quantiteDemandee}
                        value={quantiteRecue}
                        onChange={(e) => handleQuantiteChange(item.id, e.target.value)}
                        className={hasError ? "border-red-500" : ""}
                      />
                      {hasError && (
                        <p className="text-xs text-red-600 mt-1">{errors[item.id]}</p>
                      )}
                      {!hasError && quantiteRecue < (item.quantiteSortie || item.quantiteValidee || item.quantiteDemandee) && (
                        <p className="text-xs text-orange-600 mt-1">
                          Manquant: {(item.quantiteSortie || item.quantiteValidee || item.quantiteDemandee) - quantiteRecue} {item.article?.unite}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Aperçu de la sous-demande si nécessaire */}
          {hasSousDemande && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-orange-900 mb-2">
                    Une sous-demande sera créée automatiquement
                  </h4>
                  <p className="text-sm text-orange-800 mb-3">
                    Les articles suivants ont des quantités manquantes :
                  </p>
                  <div className="space-y-2">
                    {sousDemandePrevision.map((item, index) => (
                      <div key={index} className="text-sm bg-white p-2 rounded border border-orange-200">
                        <span className="font-medium">{item.article}</span>
                        <span className="text-orange-700 ml-2">
                          • Manquant: {item.manquant} (Sorti: {item.quantiteSortie}, Reçu: {item.quantiteRecue})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Commentaire optionnel */}
          <div>
            <Label htmlFor="commentaire">Commentaire (optionnel)</Label>
            <Textarea
              id="commentaire"
              placeholder="Ajoutez un commentaire sur la réception..."
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={3}
            />
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading || Object.keys(errors).length > 0}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Clôture en cours...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirmer et clôturer
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

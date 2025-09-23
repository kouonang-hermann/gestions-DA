"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Trash2, Package } from "lucide-react"
import type { ItemDemande, Article } from "@/types"

interface ItemWithArticle extends ItemDemande {
  article: Article
}

interface RemoveItemConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  item: ItemWithArticle | null
  demandeNumero: string
  onConfirm: (justification: string) => Promise<void>
  isLoading?: boolean
}

export default function RemoveItemConfirmationModal({ 
  isOpen, 
  onClose, 
  item,
  demandeNumero,
  onConfirm,
  isLoading = false
}: RemoveItemConfirmationModalProps) {
  const [justification, setJustification] = useState("")
  const [error, setError] = useState("")

  const handleConfirm = async () => {
    if (!justification.trim()) {
      setError("Une justification est obligatoire pour supprimer un article")
      return
    }

    if (justification.trim().length < 10) {
      setError("La justification doit contenir au moins 10 caractères")
      return
    }

    try {
      await onConfirm(justification.trim())
      handleClose()
    } catch (error) {
      setError("Erreur lors de la suppression de l'article")
    }
  }

  const handleClose = () => {
    setJustification("")
    setError("")
    onClose()
  }

  if (!item) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <Trash2 className="h-5 w-5" />
            Supprimer un article de la demande
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Avertissement */}
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900">Action irréversible</h3>
              <p className="text-sm text-red-800 mt-1">
                Vous êtes sur le point de supprimer définitivement cet article de la demande. 
                Cette action ne peut pas être annulée.
              </p>
            </div>
          </div>

          {/* Informations de la demande */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Demande concernée</h4>
            <p className="text-sm text-gray-700">
              <strong>Numéro :</strong> {demandeNumero}
            </p>
          </div>

          {/* Informations de l'article */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Article à supprimer
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <strong className="text-blue-800">Nom :</strong>
                <span className="text-blue-700">{item.article.nom}</span>
              </div>
              <div className="flex items-center gap-2">
                <strong className="text-blue-800">Référence :</strong>
                <Badge variant="outline" className="text-blue-700 border-blue-300">
                  {item.article.reference}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <strong className="text-blue-800">Quantité demandée :</strong>
                <span className="text-blue-700">{item.quantiteDemandee}</span>
              </div>
              {item.article.description && (
                <div className="flex items-start gap-2">
                  <strong className="text-blue-800">Description :</strong>
                  <span className="text-blue-700 text-sm">{item.article.description}</span>
                </div>
              )}
              {item.article.prixUnitaire && (
                <div className="flex items-center gap-2">
                  <strong className="text-blue-800">Prix unitaire :</strong>
                  <span className="text-blue-700">{Number(item.article.prixUnitaire).toFixed(2)}€</span>
                </div>
              )}
            </div>
          </div>

          {/* Justification obligatoire */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Justification de la suppression <span className="text-red-500">*</span>
            </label>
            <Textarea
              value={justification}
              onChange={(e) => {
                setJustification(e.target.value)
                if (error) setError("")
              }}
              placeholder="Expliquez pourquoi vous supprimez cet article de la demande (minimum 10 caractères)..."
              className="min-h-[100px]"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Cette justification sera visible dans l'historique et envoyée au demandeur.
            </p>
            {error && (
              <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                {error}
              </p>
            )}
          </div>

          {/* Impact de la suppression */}
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h4 className="font-medium text-amber-900 mb-2">Impact de cette action</h4>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>• L'article sera définitivement retiré de la demande</li>
              <li>• Le demandeur recevra une notification avec votre justification</li>
              <li>• L'action sera enregistrée dans l'historique de la demande</li>
              <li>• La demande continuera son processus de validation avec les articles restants</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={isLoading || !justification.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Confirmer la suppression
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

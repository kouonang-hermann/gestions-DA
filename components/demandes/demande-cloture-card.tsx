"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { useStore } from "@/stores/useStore"
import { CheckCircle, Package, Calendar, Eye } from 'lucide-react'
import type { Demande } from "@/types"
import PurchaseRequestDetailsModal from "@/components/modals/purchase-request-details-modal"

interface DemandeClotureCardProps {
  demande: Demande
  onCloture: () => void
}

export default function DemandeClotureCard({ demande, onCloture }: DemandeClotureCardProps) {
  const { executeAction } = useStore()
  const [isLoading, setIsLoading] = useState(false)
  const [commentaire, setCommentaire] = useState("")
  const [showCommentaire, setShowCommentaire] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)

  const handleCloture = async () => {
    setIsLoading(true)
    try {
      // Utiliser "cloturer" au lieu de "validation_finale_demandeur" pour supporter tous les rôles
      const success = await executeAction(demande.id, "cloturer", { 
        commentaire: commentaire.trim() || "Demande clôturée par le demandeur" 
      })
      
      if (success) {
        alert("Demande clôturée avec succès !")
        onCloture()
        setShowCommentaire(false)
        setCommentaire("")
      } else {
        alert("Erreur lors de la clôture de la demande")
      }
    } catch (error) {
      console.error("Erreur lors de la clôture:", error)
      alert("Erreur lors de la clôture de la demande")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="bg-white p-4 rounded-lg border border-emerald-200 hover:shadow-sm transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-medium text-gray-800">{demande.numero}</h3>
              <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                Prêt à clôturer
              </Badge>
              <Badge variant="outline" className="text-xs">
                {demande.type === "materiel" ? "Matériel" : "Outillage"}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600 mb-3">
              <div className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                <span>{demande.items?.length || 0} article{(demande.items?.length || 0) > 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>Créée le {new Date(demande.dateCreation).toLocaleDateString('fr-FR')}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="font-medium">Projet:</span>
                <span>{demande.projet?.nom || 'N/A'}</span>
              </div>
            </div>

            <div className="bg-emerald-50 p-3 rounded border border-emerald-200 mb-3">
              <p className="text-sm text-emerald-800">
                ✅ <strong>Votre demande a été validée par tous les responsables et est prête à être livrée.</strong>
                <br />
                Vous pouvez maintenant la clôturer pour confirmer la réception.
              </p>
            </div>

            {showCommentaire && (
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commentaire de clôture (optionnel)
                </label>
                <Textarea
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  placeholder="Ajoutez un commentaire sur la réception de votre demande..."
                  className="min-h-[60px]"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDetailsModalOpen(true)}
            className="text-blue-600 hover:text-blue-700"
          >
            <Eye className="h-4 w-4 mr-1" />
            Voir détails
          </Button>

          <div className="flex gap-2">
            {!showCommentaire ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCommentaire(true)}
                  className="text-gray-600 hover:text-gray-700"
                >
                  Ajouter commentaire
                </Button>
                <Button
                  onClick={handleCloture}
                  disabled={isLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  size="sm"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Clôturer
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCommentaire(false)
                    setCommentaire("")
                  }}
                  disabled={isLoading}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleCloture}
                  disabled={isLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  size="sm"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Clôturer avec commentaire
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal des détails */}
      <PurchaseRequestDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        demande={demande}
      />
    </>
  )
}

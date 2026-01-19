"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useStore } from "@/stores/useStore"
import { CheckCircle, Eye, Package } from 'lucide-react'
import type { Demande } from "@/types"
import DemandeDetailsModal from "@/components/modals/demande-details-modal"
import ClotureConfirmationModal from "@/components/modals/cloture-confirmation-modal"

export default function ValidationFinaleList() {
  const { currentUser, demandes, loadDemandes, executeAction, isLoading, error } = useStore()
  const [demandesAValider, setDemandesAValider] = useState<Demande[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [clotureModalOpen, setClotureModalOpen] = useState(false)
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null)

  useEffect(() => {
    if (currentUser) {
      loadDemandes()
    }
  }, [currentUser]) // Supprimé loadDemandes des dépendances

  useEffect(() => {
    if (currentUser) {
      const filtered = demandes.filter(
        (d) => d.status === "en_attente_validation_finale_demandeur" && 
               d.technicienId === currentUser.id &&
               // Filtrer par projet si l'utilisateur a des projets assignés
               (!currentUser.projets || currentUser.projets.length === 0 || currentUser.projets.includes(d.projetId))
      )
      
      setDemandesAValider(filtered)
    }
  }, [currentUser, demandes])

  const handleOpenClotureModal = (demande: Demande) => {
    setSelectedDemande(demande)
    setClotureModalOpen(true)
  }

  const handleConfirmCloture = async (quantitesRecues: { [itemId: string]: number }, commentaire: string) => {
    if (!selectedDemande) return

    setActionLoading(selectedDemande.id)

    try {
      const success = await executeAction(selectedDemande.id, "cloturer", { 
        quantitesRecues,
        commentaire 
      })
      
      if (success) {
        await loadDemandes()
        setClotureModalOpen(false)
        setDetailsModalOpen(false)
        setSelectedDemande(null)
      } else {
        alert(error || "Erreur lors de la clôture")
      }
    } catch (err) {
      console.error("Erreur lors de la clôture:", err)
      alert("Erreur lors de la clôture")
    } finally {
      setActionLoading(null)
    }
  }

  const handleViewDetails = (demande: Demande) => {
    setSelectedDemande(demande)
    setDetailsModalOpen(true)
  }

  const handleModalClosure = async (action: "valider" | "rejeter" | "valider_sortie" | "cloturer", quantites?: { [itemId: string]: number }, commentaire?: string) => {
    if (selectedDemande) {
      // Ouvrir le modal de clôture au lieu de clôturer directement
      setDetailsModalOpen(false)
      setClotureModalOpen(true)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <Card className="bg-gray-50 border-gray-200">
      <CardHeader>
        <CardTitle className="text-gray-800">Demandes livrées - À clôturer</CardTitle>
      </CardHeader>
      <CardContent>
        {demandesAValider.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Aucune demande livrée en attente de clôture</p>
          </div>
        ) : (
          <div className="space-y-4">
            {demandesAValider.map((demande) => (
              <div  
                key={demande.id}
                className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-medium text-gray-800 text-sm sm:text-base">{demande.numero}</h3>
                      <Badge className="bg-emerald-500 text-white text-xs whitespace-normal break-words max-w-full">Livrée</Badge>
                      <Badge variant="outline" className="text-xs">
                        {demande.type === "materiel" ? "Matériel" : "Outillage"}
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">
                      Projet: {demande.projet?.nom} • {demande.items?.length || 0} article{(demande.items?.length || 0) > 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-gray-500">
                      Livrée par la logistique • Prête pour clôture
                    </p>
                    {demande.commentaires && (
                      <p className="text-xs sm:text-sm text-emerald-600 bg-emerald-50 p-2 rounded mt-2 truncate">
                        <strong>Commentaire:</strong> {demande.commentaires}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenClotureModal(demande)}
                      disabled={actionLoading === demande.id}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 flex-1 sm:flex-none min-h-[44px]"
                    >
                      {actionLoading === demande.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                      ) : (
                        <CheckCircle className="h-4 w-4 sm:mr-2" />
                      )}
                      <span className="hidden sm:inline">Clôturer</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewDetails(demande)}
                      className="flex-1 sm:flex-none min-h-[44px]"
                      title="Voir les détails"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Modal de détails */}
      <DemandeDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false)
          setSelectedDemande(null)
        }}
        demandeId={selectedDemande?.id || null}
        mode="view"
      />

      {/* Modal de confirmation de clôture avec saisie des quantités */}
      <ClotureConfirmationModal
        isOpen={clotureModalOpen}
        onClose={() => {
          setClotureModalOpen(false)
          setSelectedDemande(null)
        }}
        demande={selectedDemande}
        onConfirm={handleConfirmCloture}
        isLoading={!!actionLoading}
      />
    </Card>
  )
}

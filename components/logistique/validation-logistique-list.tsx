"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useStore } from "@/stores/useStore"
import { CheckCircle, XCircle, Eye, Package, Truck, Edit } from "lucide-react"
import type { Demande } from "@/types"
import DemandeDetailsModal from "@/components/modals/demande-details-modal"
import CreateDemandeModal from "@/components/demandes/create-demande-modal"

export default function ValidationLogistiqueList() {
  const { currentUser, demandes, loadDemandes, executeAction, isLoading, error } = useStore()
  const [demandesAValider, setDemandesAValider] = useState<Demande[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [demandeToEdit, setDemandeToEdit] = useState<Demande | null>(null)

  // OPTIMISÉ: Ne charger que si les demandes ne sont pas déjà en cache
  useEffect(() => {
    if (currentUser && demandes.length === 0) {
      loadDemandes()
    }
  }, [currentUser?.id, demandes.length]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (currentUser && demandes.length > 0) {
      // Filtrer les demandes en attente de validation logistique pour les projets du responsable
      const filtered = demandes.filter(
        (d) => d.status === "en_attente_validation_logistique" && 
               // Filtrer par projet si l'utilisateur a des projets assignés
               (!currentUser.projets || currentUser.projets.length === 0 || currentUser.projets.includes(d.projetId))
      )
      
      setDemandesAValider(filtered)
    }
  }, [currentUser, demandes])

  const handleValidation = async (demandeId: string, action: "valider" | "rejeter") => {
    setActionLoading(demandeId)

    try {
      let commentaire = ""
      if (action === "rejeter") {
        commentaire = prompt("Motif du rejet (obligatoire):") || ""
        if (!commentaire) {
          alert("Le motif du rejet est obligatoire")
          setActionLoading(null)
          return
        }
      } else {
        commentaire = prompt("Commentaire de validation (optionnel):") || ""
      }

      const success = await executeAction(demandeId, action, { commentaire })
      if (success) {
        await loadDemandes()
        setDetailsModalOpen(false)
        setSelectedDemande(null)
      } else {
        alert(error || "Erreur lors de l'action")
      }
    } catch (err) {
      console.error("Erreur lors de la validation:", err)
      alert("Erreur lors de l'action")
    } finally {
      setActionLoading(null)
    }
  }

  const handleViewDetails = (demande: Demande) => {
    setSelectedDemande(demande)
    setDetailsModalOpen(true)
  }

  const handleEdit = (demande: Demande) => {
    setDemandeToEdit(demande)
    setEditModalOpen(true)
  }

  const handleModalValidation = async (action: "valider" | "annuler" | "valider_sortie" | "rejeter" | "cloturer", quantites?: { [itemId: string]: number }, commentaire?: string) => {
    if (selectedDemande) {
      setActionLoading(selectedDemande.id)

      try {
        const payload: any = { commentaire: commentaire || "" }
        
        // L'action "annuler" n'est pas applicable ici (réservée au demandeur)
        if (action === "annuler") {
          setActionLoading(null)
          return
        }
        
        const apiAction = action === "valider" ? "valider" : action === "rejeter" ? "rejeter" : action === "cloturer" ? "cloturer" : "valider"
        const success = await executeAction(selectedDemande.id, apiAction, payload)
        
        if (success) {
          await loadDemandes()
          setDetailsModalOpen(false)
          setSelectedDemande(null)
        } else {
          alert(error || "Erreur lors de l'action")
        }
      } catch (err) {
        console.error("Erreur lors de la validation:", err)
        alert("Erreur lors de l'action")
      } finally {
        setActionLoading(null)
      }
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
        <CardTitle className="text-gray-800 flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Demandes à valider (Logistique)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {demandesAValider.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Aucune demande en attente de validation logistique</p>
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
                      <Badge className="bg-orange-500 text-white text-xs whitespace-normal break-words max-w-full">À valider</Badge>
                      <Badge variant="outline" className="text-xs">
                        {demande.type === "materiel" ? "Matériel" : "Outillage"}
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">
                      Projet: {demande.projet?.nom} • {demande.items?.length || 0} article{(demande.items?.length || 0) > 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-gray-500">
                      Créée le {new Date(demande.dateCreation).toLocaleDateString()}
                    </p>
                    {demande.commentaires && (
                      <p className="text-xs sm:text-sm text-blue-600 bg-blue-50 p-2 rounded mt-2 truncate">
                        <strong>Commentaire:</strong> {demande.commentaires}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleValidation(demande.id, "valider")}
                      disabled={actionLoading === demande.id}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 flex-1 sm:flex-none min-h-[44px]"
                    >
                      {actionLoading === demande.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                      ) : (
                        <CheckCircle className="h-4 w-4 sm:mr-2" />
                      )}
                      <span className="hidden sm:inline">Valider</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleValidation(demande.id, "rejeter")}
                      disabled={actionLoading === demande.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-1 sm:flex-none min-h-[44px]"
                    >
                      {actionLoading === demande.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <XCircle className="h-4 w-4 sm:mr-2" />
                      )}
                      <span className="hidden sm:inline">Rejeter</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEdit(demande)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 flex-1 sm:flex-none min-h-[44px]"
                      title="Modifier la demande"
                    >
                      <Edit className="h-4 w-4" />
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
        canValidate={true}
        onValidate={(demandeId) => handleValidation(demandeId, "valider")}
      />

      {/* Modal d'édition */}
      {demandeToEdit && (
        <CreateDemandeModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false)
            setDemandeToEdit(null)
          }}
          type={demandeToEdit.type}
          existingDemande={demandeToEdit}
        />
      )}
    </Card>
  )
}

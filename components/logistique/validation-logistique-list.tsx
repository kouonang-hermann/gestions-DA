"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useStore } from "@/stores/useStore"
import { CheckCircle, XCircle, Eye, Package, Truck } from "lucide-react"
import type { Demande } from "@/types"
import DemandeDetailsModal from "@/components/modals/demande-details-modal"

export default function ValidationLogistiqueList() {
  const { currentUser, demandes, loadDemandes, executeAction, isLoading, error } = useStore()
  const [demandesAValider, setDemandesAValider] = useState<Demande[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null)

  useEffect(() => {
    if (currentUser) {
      loadDemandes()
    }
  }, [currentUser]) // Supprimé loadDemandes des dépendances

  useEffect(() => {
    if (currentUser && demandes.length > 0) {
      // Filtrer les demandes en attente de validation logistique pour les projets du responsable
      const filtered = demandes.filter(
        (d) => d.status === "en_attente_validation_logistique" && 
               // Filtrer par projet si l'utilisateur a des projets assignés
               (!currentUser.projets || currentUser.projets.length === 0 || currentUser.projets.includes(d.projetId))
      )
      
      console.log(`🔍 [LOGISTIQUE] Filtrage pour ${currentUser.role}:`)
      console.log(`  - Status recherché: en_attente_validation_logistique`)
      console.log(`  - Projets utilisateur: [${currentUser.projets?.join(', ') || 'aucun'}]`)
      console.log(`  - Demandes trouvées: ${filtered.length}/${demandes.length}`)
      if (filtered.length > 0) {
        console.log(`  - IDs demandes: [${filtered.map(d => d.numero).join(', ')}]`)
      }
      
      setDemandesAValider(filtered)
    }
  }, [currentUser, demandes])

  const handleValidation = async (demandeId: string, action: "valider_sortie" | "rejeter") => {
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
        commentaire = prompt("Commentaire de livraison (optionnel):") || ""
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

  const handleModalValidation = async (action: "valider" | "valider_sortie" | "rejeter" | "cloturer", quantites?: { [itemId: string]: number }, commentaire?: string) => {
    if (selectedDemande) {
      setActionLoading(selectedDemande.id)

      try {
        const payload: any = { commentaire: commentaire || "" }
        
        const apiAction = action === "valider_sortie" ? "valider_sortie" : action === "rejeter" ? "rejeter" : action === "cloturer" ? "cloturer" : "valider_sortie"
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
                className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-gray-800">{demande.numero}</h3>
                      <Badge className="bg-orange-500 text-white text-xs">À valider (Logistique)</Badge>
                      <Badge variant="outline" className="text-xs">
                        {demande.type === "materiel" ? "Matériel" : "Outillage"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Projet: {demande.projet?.nom} • {demande.items?.length || 0} article{(demande.items?.length || 0) > 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-gray-500">
                      Créée le {new Date(demande.dateCreation).toLocaleDateString()}
                    </p>
                    {demande.commentaires && (
                      <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded mt-2">
                        <strong>Commentaire:</strong> {demande.commentaires}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleValidation(demande.id, "valider_sortie")}
                      disabled={actionLoading === demande.id}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      {actionLoading === demande.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                      ) : (
                        <Truck className="h-4 w-4 mr-2" />
                      )}
                      Livré
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleValidation(demande.id, "rejeter")}
                      disabled={actionLoading === demande.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {actionLoading === demande.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      Rejeter
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewDetails(demande)}
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
        demande={selectedDemande}
        onValidate={handleModalValidation}
        canValidate={true}
        validationLabel="Marquer comme livré"
        validationAction="valider_sortie"
        showDeliveryColumns={true}
      />
    </Card>
  )
}

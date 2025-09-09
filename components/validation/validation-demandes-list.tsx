"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useStore } from "@/stores/useStore"
import { CheckCircle, XCircle, Eye, Package } from "lucide-react"
import type { Demande, DemandeType } from "@/types"
import DemandeDetailsModal from "@/components/modals/demande-details-modal"

interface ValidationDemandesListProps {
  type: DemandeType
  title: string
}

export default function ValidationDemandesList({ type, title }: ValidationDemandesListProps) {
  const { currentUser, demandes, loadDemandes, executeAction, isLoading, error } = useStore()
  const [demandesAValider, setDemandesAValider] = useState<Demande[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null)

  useEffect(() => {
    if (currentUser) {
      loadDemandes({ type })
    }
  }, [currentUser, type, loadDemandes])

  useEffect(() => {
    if (currentUser) {
      let statusToFilter = ""
      
      // Déterminer le statut à filtrer selon le type et le rôle
      if (type === "materiel" && currentUser.role === "conducteur_travaux") {
        statusToFilter = "en_attente_validation_conducteur"
      } else if (type === "materiel" && currentUser.role === "responsable_travaux") {
        statusToFilter = "en_attente_validation_responsable_travaux"
      } else if (type === "outillage" && currentUser.role === "responsable_qhse") {
        statusToFilter = "en_attente_validation_qhse"
      } else if (currentUser.role === "responsable_appro") {
        statusToFilter = "en_attente_validation_appro"
      } else if (currentUser.role === "charge_affaire") {
        statusToFilter = "en_attente_validation_charge_affaire"
      } else if (currentUser.role === "responsable_logistique") {
        statusToFilter = "en_attente_validation_logistique"
      }
      
      const filtered = demandes.filter(
        (d) => d.type === type && d.status === statusToFilter
      )
      setDemandesAValider(filtered)
    }
  }, [currentUser, demandes, type])

  const handleValidation = async (demandeId: string, action: "valider" | "rejeter") => {
    setActionLoading(demandeId)

    try {
      const commentaire =
        action === "rejeter" ? prompt("Motif du rejet (obligatoire):") : prompt("Commentaire (optionnel):")

      if (action === "rejeter" && !commentaire) {
        alert("Le motif du rejet est obligatoire")
        setActionLoading(null)
        return
      }

      const apiAction = action === "valider" ? "valider" : "rejeter"

      const success = await executeAction(demandeId, apiAction, { commentaire })
      if (success) {
        // Recharger les demandes
        await loadDemandes({ type })
        // Fermer le modal si ouvert
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

  const handleModalValidation = async (action: "valider" | "rejeter", quantites?: { [itemId: string]: number }) => {
    if (selectedDemande) {
      await handleValidationWithQuantites(selectedDemande.id, action, quantites)
    }
  }

  const handleValidationWithQuantites = async (demandeId: string, action: "valider" | "rejeter", quantites?: { [itemId: string]: number }) => {
    setActionLoading(demandeId)

    try {
      const commentaire =
        action === "rejeter" ? prompt("Motif du rejet (obligatoire):") : prompt("Commentaire (optionnel):")

      if (action === "rejeter" && !commentaire) {
        alert("Le motif du rejet est obligatoire")
        setActionLoading(null)
        return
      }

      const apiAction = action === "valider" ? "valider" : "rejeter"
      const payload: any = { commentaire }
      
      // Ajouter les quantités validées si fournies
      if (quantites && action === "valider") {
        payload.quantites = quantites
      }

      const success = await executeAction(demandeId, apiAction, payload)
      if (success) {
        // Recharger les demandes
        await loadDemandes({ type })
        // Fermer le modal si ouvert
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
        <CardTitle className="text-gray-800">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {demandesAValider.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Aucune demande en attente de validation</p>
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
                      <Badge className="bg-blue-500 text-white text-xs">{demande.status}</Badge>
                      <Badge variant="outline" className="text-xs">
                        {demande.type === "materiel" ? "Matériel" : "Outillage"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {demande.items.length} article{demande.items.length > 1 ? "s" : ""} • Créée le{" "}
                      {new Date(demande.dateCreation).toLocaleDateString()}
                    </p>
                    {demande.commentaires && (
                      <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                        <strong>Commentaire:</strong> {demande.commentaires}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleValidation(demande.id, "valider")}
                      disabled={actionLoading === demande.id}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      {actionLoading === demande.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Valider
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
      />
    </Card>
  )
}

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
  }, [currentUser, type]) // Supprimé loadDemandes des dépendances pour éviter la boucle infinie

  useEffect(() => {
    if (currentUser) {
      let statusToFilter = ""
      
      // Déterminer le statut à filtrer selon le rôle
      if (currentUser.role === "conducteur_travaux") {
        statusToFilter = "en_attente_validation_conducteur"
      } else if (currentUser.role === "responsable_travaux") {
        statusToFilter = "en_attente_validation_responsable_travaux"
      } else if (currentUser.role === "responsable_qhse") {
        statusToFilter = "en_attente_validation_qhse"
      } else if (currentUser.role === "charge_affaire") {
        statusToFilter = "en_attente_validation_charge_affaire"
      } else if (currentUser.role === "responsable_logistique") {
        statusToFilter = "en_attente_validation_logistique"
      }
      
      const filtered = demandes.filter(
        (d) => d.type === type && 
               d.status === statusToFilter &&
               // Filtrer par projet si l'utilisateur a des projets assignés
               (!currentUser.projets || currentUser.projets.length === 0 || currentUser.projets.includes(d.projetId))
      )
      
      console.log(`🔍 [VALIDATION-${type.toUpperCase()}] Filtrage pour ${currentUser.role}:`)
      console.log(`  - Status recherché: ${statusToFilter}`)
      console.log(`  - Projets utilisateur: [${currentUser.projets?.join(', ') || 'aucun'}]`)
      console.log(`  - Demandes trouvées: ${filtered.length}/${demandes.length}`)
      if (filtered.length > 0) {
        console.log(`  - IDs demandes: [${filtered.map(d => d.numero).join(', ')}]`)
      }
      
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

  const handleModalValidation = async (action: "valider" | "rejeter" | "valider_sortie" | "cloturer", quantites?: { [itemId: string]: number }, commentaire?: string) => {
    if (!selectedDemande) return
    
    setActionLoading(selectedDemande.id)
    
    try {
      // Pour ce composant, on traite "valider_sortie" et "cloturer" comme "valider"
      const normalizedAction = (action === "valider_sortie" || action === "cloturer") ? "valider" : action

      await executeAction(selectedDemande.id, normalizedAction, { quantites, commentaire })
      setDetailsModalOpen(false)
      setSelectedDemande(null)
    } catch (error) {
      console.error("Erreur lors de la validation:", error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleItemRemoved = () => {
    // Recharger les demandes après suppression d'un article
    loadDemandes({ type })
    setDetailsModalOpen(false)
    setSelectedDemande(null)
  }

  // Vérifier si l'utilisateur peut supprimer des articles
  const canRemoveItems = () => {
    if (!currentUser) return false
    return ["conducteur_travaux", "responsable_travaux", "charge_affaire"].includes(currentUser.role)
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
                className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-medium text-gray-800 text-sm sm:text-base">{demande.numero}</h3>
                      <Badge className="bg-blue-500 text-white text-xs truncate max-w-[150px]">{demande.status}</Badge>
                      <Badge variant="outline" className="text-xs">
                        {demande.type === "materiel" ? "Matériel" : "Outillage"}
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">
                      {demande.items.length} article{demande.items.length > 1 ? "s" : ""} • Créée le{" "}
                      {new Date(demande.dateCreation).toLocaleDateString()}
                    </p>
                    {demande.commentaires && (
                      <p className="text-xs sm:text-sm text-blue-600 bg-blue-50 p-2 rounded truncate">
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
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 flex-1 sm:flex-none"
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
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-1 sm:flex-none"
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
                      onClick={() => handleViewDetails(demande)}
                      className="flex-1 sm:flex-none"
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
        onItemRemoved={handleItemRemoved}
        canRemoveItems={canRemoveItems()}
      />
    </Card>
  )
}

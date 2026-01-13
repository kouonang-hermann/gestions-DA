"use client"

import { useState, useEffect } from "react"
import { useStore } from "@/stores/useStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Clock,
  Package,
  AlertCircle
} from "lucide-react"
import type { Demande } from "@/types"
import DemandeDetailsModal from "@/components/modals/demande-details-modal"

export default function MobileValidationSection() {
  const { currentUser, demandes, executeAction, canUserValidateStep, error } = useStore()
  const [demandesAValider, setDemandesAValider] = useState<Demande[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null)

  useEffect(() => {
    if (currentUser && demandes) {
      const demandesFiltered = demandes.filter(d => {
        // Filtrer par projet si l'utilisateur a des projets assignés
        const isInProject = !currentUser.projets || currentUser.projets.length === 0 || 
                           currentUser.projets.includes(d.projetId)
        
        if (!isInProject) return false

        // Vérifier si l'utilisateur peut valider cette étape pour ce type de demande
        return canUserValidateStep(currentUser.role, d.type, d.status)
      })

      setDemandesAValider(demandesFiltered)
    }
  }, [currentUser, demandes, canUserValidateStep])

  const handleValider = async (demandeId: string) => {
    setActionLoading(demandeId)
    try {
      const success = await executeAction(demandeId, "valider", {
        commentaire: "Validation effectuée depuis mobile"
      })
      if (!success) {
        alert(error || "Erreur lors de la validation")
      }
    } catch (err) {
      console.error("Erreur lors de la validation:", err)
      alert("Erreur lors de la validation")
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejeter = async (demandeId: string) => {
    const motif = prompt("Motif du rejet :")
    if (!motif) return

    setActionLoading(demandeId)
    try {
      const success = await executeAction(demandeId, "rejeter", {
        commentaire: motif
      })
      if (!success) {
        alert(error || "Erreur lors du rejet")
      }
    } catch (err) {
      console.error("Erreur lors du rejet:", err)
      alert("Erreur lors du rejet")
    } finally {
      setActionLoading(null)
    }
  }

  const handleViewDetails = (demande: Demande) => {
    setSelectedDemande(demande)
    setDetailsModalOpen(true)
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      "en_attente_validation_conducteur": "En attente conducteur",
      "en_attente_validation_logistique": "En attente logistique",
      "en_attente_validation_responsable_travaux": "En attente resp. travaux",
      "en_attente_validation_charge_affaire": "En attente chargé affaire",
      "en_attente_preparation_appro": "En préparation appro",
      "en_attente_preparation_logistique": "En préparation logistique",
      "en_attente_reception_livreur": "En attente réception livreur",
      "en_attente_livraison": "En attente livraison"
    }
    return labels[status] || status
  }

  const isUrgent = (dateCreation: Date) => {
    return new Date().getTime() - new Date(dateCreation).getTime() > 3 * 24 * 60 * 60 * 1000
  }

  if (!currentUser || demandesAValider.length === 0) return null

  return (
    <>
      <Card className="border-orange-200 bg-orange-50/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-orange-900">Demandes à valider</CardTitle>
            </div>
            <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
              {demandesAValider.length} {demandesAValider.length > 1 ? "demandes" : "demande"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {demandesAValider.map((demande) => (
              <div
                key={demande.id}
                className="flex flex-col gap-3 p-4 bg-white rounded-lg border border-orange-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-sm font-semibold text-gray-900">
                        {demande.numero}
                      </span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          demande.type === "materiel" 
                            ? "bg-blue-50 text-blue-700 border-blue-200" 
                            : "bg-purple-50 text-purple-700 border-purple-200"
                        }`}
                      >
                        {demande.type === "materiel" ? "Matériel" : "Outillage"}
                      </Badge>
                      {isUrgent(demande.dateCreation) && (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Urgent
                        </Badge>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-600 mb-2">
                      {getStatusLabel(demande.status)}
                    </p>
                    
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {new Date(demande.dateCreation).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(demande)}
                    className="flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Détails
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={() => handleValider(demande.id)}
                    disabled={actionLoading === demande.id}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    {actionLoading === demande.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Validation...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Valider
                      </>
                    )}
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRejeter(demande.id)}
                    disabled={actionLoading === demande.id}
                    className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Rejeter
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedDemande && (
        <DemandeDetailsModal
          isOpen={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          demandeId={selectedDemande?.id || null}
          mode="view"
        />
      )}
    </>
  )
}

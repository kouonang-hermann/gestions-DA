"use client"

import { useState } from "react"
import { useStore } from "@/stores/useStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Package, 
  CheckCircle, 
  Eye, 
  Clock,
  Wrench
} from "lucide-react"
import type { Demande } from "@/types"
import DemandeDetailsModal from "@/components/modals/demande-details-modal"

export default function MobileApproSection() {
  const { currentUser, demandes, executeAction, error } = useStore()
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null)

  if (!currentUser || currentUser.role !== "responsable_appro") return null

  // Filtrer les demandes en attente de préparation appro
  const demandesAPreparer = demandes.filter((d) => 
    d.status === "en_attente_preparation_appro" &&
    (!currentUser.projets || currentUser.projets.length === 0 || currentUser.projets.includes(d.projetId))
  )

  const handlePreparerSortie = async (demandeId: string) => {
    setActionLoading(demandeId)
    try {
      const success = await executeAction(demandeId, "valider", {
        commentaire: "Préparation sortie validée depuis mobile"
      })
      if (!success) {
        alert(error || "Erreur lors de la préparation")
      }
    } catch (err) {
      console.error("Erreur lors de la préparation:", err)
      alert("Erreur lors de la préparation")
    } finally {
      setActionLoading(null)
    }
  }

  const handleViewDetails = (demande: Demande) => {
    setSelectedDemande(demande)
    setDetailsModalOpen(true)
  }

  if (demandesAPreparer.length === 0) return null

  return (
    <>
      <Card className="border-cyan-200 bg-cyan-50/30">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-cyan-600" />
              <CardTitle className="text-cyan-900 text-base">Sorties à préparer</CardTitle>
            </div>
            <Badge variant="outline" className="bg-cyan-100 text-cyan-800 border-cyan-300">
              {demandesAPreparer.length}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {demandesAPreparer.map((demande) => (
              <div
                key={demande.id}
                className="flex flex-col gap-2 p-3 bg-white rounded-lg border border-cyan-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-cyan-600" />
                    <span className="font-mono text-sm font-semibold">{demande.numero}</span>
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      Matériel
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  {new Date(demande.dateCreation).toLocaleDateString('fr-FR')}
                  {demande.items && (
                    <span className="ml-2">• {demande.items.length} article(s)</span>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(demande)}
                    className="flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-9"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Détails
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={() => handlePreparerSortie(demande.id)}
                    disabled={actionLoading === demande.id}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white h-9"
                  >
                    {actionLoading === demande.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Préparer
                      </>
                    )}
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

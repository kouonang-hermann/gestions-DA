"use client"

import { useState } from "react"
import { useStore } from "@/stores/useStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Truck, 
  Package, 
  CheckCircle, 
  Eye, 
  Clock,
  PackageCheck
} from "lucide-react"
import type { Demande } from "@/types"
import DemandeDetailsModal from "@/components/modals/demande-details-modal"

export default function MobileLivraisonsSection() {
  const { currentUser, demandes, executeAction, error } = useStore()
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null)

  if (!currentUser) return null

  // Filtrer les demandes pour le livreur
  const demandesARecevoir = demandes.filter((d) => 
    d.livreurAssigneId === currentUser.id &&
    d.status === "en_attente_reception_livreur"
  )

  const demandesALivrer = demandes.filter((d) => 
    d.livreurAssigneId === currentUser.id &&
    d.status === "en_attente_livraison"
  )

  const handleValiderReception = async (demandeId: string) => {
    setActionLoading(demandeId)
    try {
      const success = await executeAction(demandeId, "valider_reception", {
        commentaire: "Réception validée depuis mobile"
      })
      if (!success) {
        alert(error || "Erreur lors de la validation de la réception")
      }
    } catch (err) {
      alert("Erreur lors de la validation de la réception")
    } finally {
      setActionLoading(null)
    }
  }

  const handleValiderLivraison = async (demandeId: string) => {
    setActionLoading(demandeId)
    try {
      const success = await executeAction(demandeId, "valider_livraison", {
        commentaire: "Livraison validée depuis mobile"
      })
      if (!success) {
        alert(error || "Erreur lors de la validation de la livraison")
      }
    } catch (err) {
      alert("Erreur lors de la validation de la livraison")
    } finally {
      setActionLoading(null)
    }
  }

  const handleViewDetails = (demande: Demande) => {
    setSelectedDemande(demande)
    setDetailsModalOpen(true)
  }

  // Ne pas afficher si aucune livraison
  if (demandesARecevoir.length === 0 && demandesALivrer.length === 0) return null

  return (
    <>
      {/* Section Matériel à recevoir */}
      {demandesARecevoir.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PackageCheck className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-blue-900 text-base">Matériel à recevoir</CardTitle>
              </div>
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                {demandesARecevoir.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {demandesARecevoir.map((demande) => (
                <div
                  key={demande.id}
                  className="flex flex-col gap-2 p-3 bg-white rounded-lg border border-blue-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-blue-600" />
                      <span className="font-mono text-sm font-semibold">{demande.numero}</span>
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        {demande.type === "materiel" ? "Matériel" : "Outillage"}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {new Date(demande.dateCreation).toLocaleDateString('fr-FR')}
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
                      onClick={() => handleValiderReception(demande.id)}
                      disabled={actionLoading === demande.id}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-9"
                    >
                      {actionLoading === demande.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          J'ai reçu
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section Livraisons à effectuer */}
      {demandesALivrer.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-orange-600" />
                <CardTitle className="text-orange-900 text-base">Livraisons à effectuer</CardTitle>
              </div>
              <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                {demandesALivrer.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {demandesALivrer.map((demande) => (
                <div
                  key={demande.id}
                  className="flex flex-col gap-2 p-3 bg-white rounded-lg border border-orange-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-orange-600" />
                      <span className="font-mono text-sm font-semibold">{demande.numero}</span>
                      <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                        {demande.type === "materiel" ? "Matériel" : "Outillage"}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    {new Date(demande.dateCreation).toLocaleDateString('fr-FR')}
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
                      onClick={() => handleValiderLivraison(demande.id)}
                      disabled={actionLoading === demande.id}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white h-9"
                    >
                      {actionLoading === demande.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          J'ai livré
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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

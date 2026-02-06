"use client"

import { useState } from "react"
import { useStore } from "@/stores/useStore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Truck, Package, CheckCircle, Eye, AlertCircle, PackageCheck } from "lucide-react"
import type { Demande } from "@/types"
import DemandeDetailsModal from "@/components/modals/demande-details-modal"

export default function LivraisonsAEffectuer() {
  const { demandes, currentUser, executeAction, error } = useStore()
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null)

  if (!currentUser) return null

  // Filtrer les demandes où l'utilisateur est assigné comme livreur
  // Étape 1: Réception du matériel à livrer
  const demandesARecevoir = demandes.filter((d) => 
    d.livreurAssigneId === currentUser.id &&
    d.status === "en_attente_reception_livreur"
  )

  // Étape 2: Livraison effective au demandeur
  const demandesALivrer = demandes.filter((d) => 
    d.livreurAssigneId === currentUser.id &&
    d.status === "en_attente_livraison"
  )

  const handleValiderReception = async (demandeId: string) => {
    setActionLoading(demandeId)
    try {
      const success = await executeAction(demandeId, "valider_reception", {
        commentaire: "Réception du matériel validée par le livreur"
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
    if (!confirm("Confirmer la livraison de cette demande au demandeur ?")) return

    setActionLoading(demandeId)
    try {
      const success = await executeAction(demandeId, "valider_livraison", {
        commentaire: "Livraison effective validée par le livreur"
      })
      if (!success) {
        alert(error || "Erreur lors de la validation de la livraison")
      } else {
        alert("Livraison validée avec succès. Le demandeur doit maintenant valider la réception.")
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

  if (demandesARecevoir.length === 0 && demandesALivrer.length === 0) {
    return null // Ne rien afficher si aucune livraison à effectuer
  }

  return (
    <>
      {/* Section 1: Matériel à recevoir */}
      {demandesARecevoir.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PackageCheck className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-blue-900">Matériel à recevoir</CardTitle>
              </div>
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                {demandesARecevoir.length} {demandesARecevoir.length > 1 ? "demandes" : "demande"}
              </Badge>
            </div>
            <CardDescription>
              Matériel préparé par l'appro que vous devez récupérer avant de livrer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {demandesARecevoir.map((demande) => (
                <div
                  key={demande.id}
                  className="flex items-center justify-between p-4 bg-white rounded-lg border border-blue-200 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100">
                      <Package className="h-5 w-5 text-blue-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
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
                      </div>
                      
                      <p className="text-sm text-gray-600 truncate">
                        {demande.commentaires || "Aucun commentaire"}
                      </p>
                      
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          À récupérer auprès de l'appro
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(demande)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Détails
                    </Button>
                    
                    <Button
                      size="sm"
                      onClick={() => handleValiderReception(demande.id)}
                      disabled={actionLoading === demande.id}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {actionLoading === demande.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Validation...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          J'ai reçu le matériel
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

      {/* Section 2: Livraisons à effectuer */}
      {demandesALivrer.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-orange-600" />
                <CardTitle className="text-orange-900">Livraisons à effectuer</CardTitle>
              </div>
              <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                {demandesALivrer.length} {demandesALivrer.length > 1 ? "demandes" : "demande"}
              </Badge>
            </div>
            <CardDescription>
              Matériel reçu que vous devez livrer au demandeur
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {demandesALivrer.map((demande) => (
              <div
                key={demande.id}
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-orange-200 hover:border-orange-300 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100">
                    <Package className="h-5 w-5 text-orange-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
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
                    </div>
                    
                    <p className="text-sm text-gray-600 truncate">
                      {demande.commentaires || "Aucun commentaire"}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                        <Truck className="h-3 w-3 mr-1" />
                        Prêt à livrer
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(demande)}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Détails
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={() => handleValiderLivraison(demande.id)}
                    disabled={actionLoading === demande.id}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {actionLoading === demande.id ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Validation...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        J'ai livré le matériel
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

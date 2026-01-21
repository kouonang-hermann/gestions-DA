"use client"

import { useState } from "react"
import { useStore } from "@/stores/useStore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PackageX, Eye, AlertTriangle, Package } from "lucide-react"
import type { Demande, DemandeType } from "@/types"
import DemandeDetailsModal from "@/components/modals/demande-details-modal"

interface SousDemandesListProps {
  type?: DemandeType // "materiel" ou "outillage"
}

export default function SousDemandesList({ type }: SousDemandesListProps) {
  const { demandes, currentUser } = useStore()
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null)

  if (!currentUser) return null

  // Filtrer les sous-demandes selon le type spécifié
  // - Si type="materiel" : seulement les sous-demandes matériel (en_attente_preparation_appro)
  // - Si type="outillage" : seulement les sous-demandes outillage (en_attente_preparation_logistique)
  // - Si pas de type : afficher les deux (comportement par défaut)
  const sousDemandes = demandes.filter((d) => {
    if (d.typeDemande !== "sous_demande") return false
    
    if (type === "materiel") {
      return d.type === "materiel" && d.status === "en_attente_preparation_appro"
    } else if (type === "outillage") {
      return d.type === "outillage" && d.status === "en_attente_preparation_logistique"
    } else {
      // Par défaut, afficher les deux types
      return d.status === "en_attente_preparation_appro" || d.status === "en_attente_preparation_logistique"
    }
  })

  const demandesRenvoyees = demandes.filter(
    (d) => d.status === "renvoyee_vers_appro"
  )

  const handleViewDetails = (demande: Demande) => {
    setSelectedDemande(demande)
    setDetailsModalOpen(true)
  }

  const totalAnomalies = sousDemandes.length + demandesRenvoyees.length

  if (totalAnomalies === 0) {
    return null
  }

  return (
    <>
      <Card className="border-red-200 bg-red-50/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PackageX className="h-5 w-5 text-red-600" />
              <CardTitle className="text-red-900">Anomalies de livraison</CardTitle>
            </div>
            <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
              {totalAnomalies} {totalAnomalies > 1 ? "anomalies" : "anomalie"}
            </Badge>
          </div>
          <CardDescription>
            Sous-demandes et demandes renvoyées suite à des problèmes de réception
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Sous-demandes */}
            {sousDemandes.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Sous-demandes à préparer ({sousDemandes.length})
                </h4>
                <div className="space-y-2">
                  {sousDemandes.map((demande) => (
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
                              className="text-xs bg-orange-50 text-orange-700 border-orange-200"
                            >
                              Sous-demande
                            </Badge>
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
                            {demande.items.length} article{demande.items.length > 1 ? "s" : ""} -{" "}
                            {demande.motifSousDemande === "complement"
                              ? "Complément de livraison"
                              : demande.motifSousDemande === "remplacement"
                              ? "Remplacement"
                              : "Autre"}
                          </p>

                          {demande.demandeParentId && (
                            <p className="text-xs text-gray-500 mt-1">
                              Générée depuis la demande parente
                            </p>
                          )}

                          {demande.budgetPrevisionnel && (
                            <p className="text-xs text-gray-600 mt-1 font-medium">
                              Budget: {demande.budgetPrevisionnel.toFixed(0)} FCFA
                            </p>
                          )}
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
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Demandes renvoyées */}
            {demandesRenvoyees.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Demandes renvoyées ({demandesRenvoyees.length})
                </h4>
                <div className="space-y-2">
                  {demandesRenvoyees.map((demande) => (
                    <div
                      key={demande.id}
                      className="flex items-center justify-between p-4 bg-white rounded-lg border border-red-200 hover:border-red-300 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-100">
                          <PackageX className="h-5 w-5 text-red-600" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-mono text-sm font-semibold text-gray-900">
                              {demande.numero}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-xs bg-red-50 text-red-700 border-red-200"
                            >
                              Refusée totalement
                            </Badge>
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
                            {demande.items.length} article{demande.items.length > 1 ? "s" : ""} - Refusé
                            par le demandeur
                          </p>

                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Retraitement nécessaire
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
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedDemande && (
        <DemandeDetailsModal
          isOpen={detailsModalOpen}
          onClose={() => {
            setDetailsModalOpen(false)
            setSelectedDemande(null)
          }}
          demandeId={selectedDemande.id}
          mode="view"
        />
      )}
    </>
  )
}

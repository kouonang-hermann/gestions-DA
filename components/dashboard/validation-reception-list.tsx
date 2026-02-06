"use client"

import { useState } from "react"
import { useStore } from "@/stores/useStore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PackageCheck, Eye, AlertTriangle } from "lucide-react"
import type { Demande } from "@/types"
import ValidationReceptionModal from "@/components/modals/validation-reception-modal"
import DemandeDetailsModal from "@/components/modals/demande-details-modal"

export default function ValidationReceptionList() {
  const { demandes, currentUser } = useStore()
  const [validationModalOpen, setValidationModalOpen] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  if (!currentUser) return null

  // Filtrer les demandes en attente de validation de réception par le demandeur
  const demandesAValider = demandes.filter(
    (d) =>
      d.technicienId === currentUser.id &&
      d.status === "en_attente_validation_reception_demandeur"
  )

  const handleOpenValidation = (demande: Demande) => {
    setSelectedDemande(demande)
    setValidationModalOpen(true)
  }

  const handleViewDetails = (demande: Demande) => {
    setSelectedDemande(demande)
    setDetailsModalOpen(true)
  }

  const handleValidateReception = async (data: any) => {
    if (!selectedDemande) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/demandes/${selectedDemande.id}/valider-reception`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": currentUser.id,
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la validation")
      }

      alert(result.message)
      setValidationModalOpen(false)
      setSelectedDemande(null)

      // Recharger les demandes
      window.location.reload()
    } catch (error) {
      alert("Erreur lors de la validation de réception")
    } finally {
      setIsLoading(false)
    }
  }

  if (demandesAValider.length === 0) {
    return null
  }

  return (
    <>
      <Card className="border-green-200 bg-green-50/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-green-600" />
              <CardTitle className="text-green-900">Réceptions à valider</CardTitle>
            </div>
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
              {demandesAValider.length} {demandesAValider.length > 1 ? "demandes" : "demande"}
            </Badge>
          </div>
          <CardDescription>
            Vérifiez les articles reçus et validez la réception
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {demandesAValider.map((demande) => (
              <div
                key={demande.id}
                className="flex items-center justify-between p-4 bg-white rounded-lg border border-green-200 hover:border-green-300 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100">
                    <PackageCheck className="h-5 w-5 text-green-600" />
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
                      {demande.items.length} article{demande.items.length > 1 ? "s" : ""} livré
                      {demande.items.length > 1 ? "s" : ""}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Validation requise
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
                    onClick={() => handleOpenValidation(demande)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <PackageCheck className="h-4 w-4 mr-1" />
                    Valider la réception
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedDemande && validationModalOpen && (
        <ValidationReceptionModal
          demande={selectedDemande}
          onClose={() => {
            setValidationModalOpen(false)
            setSelectedDemande(null)
          }}
          onValidate={handleValidateReception}
        />
      )}

      {selectedDemande && detailsModalOpen && (
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

"use client"

import { useStore } from "@/stores/useStore"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Package, CheckCircle, Truck } from "lucide-react"
import { useState } from "react"
import DemandeDetailsModal from "@/components/modals/demande-details-modal"

export default function MesLivraisonsSection() {
  const { demandes, currentUser, token, loadDemandes } = useStore()
  const [selectedDemandeId, setSelectedDemandeId] = useState<string | null>(null)
  const [confirmingReception, setConfirmingReception] = useState<string | null>(null)
  const [confirmingLivraison, setConfirmingLivraison] = useState<string | null>(null)

  if (!currentUser) return null

  const mesLivraisons = demandes.filter(
    (d) => d.livreurAssigneId === currentUser.id &&
    (d.status === "en_attente_reception_livreur" || d.status === "en_attente_livraison")
  )

  const livraisonsAReceptionner = mesLivraisons.filter(
    (d) => d.status === "en_attente_reception_livreur"
  )

  const livraisonsAEffectuer = mesLivraisons.filter(
    (d) => d.status === "en_attente_livraison"
  )

  if (mesLivraisons.length === 0) {
    return null
  }

  const handleConfirmReception = async (demandeId: string) => {
    if (!token) return
    
    setConfirmingReception(demandeId)
    try {
      const response = await fetch(`/api/demandes/${demandeId}/actions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          action: "confirmer_reception_livreur"
        }),
      })

      const result = await response.json()

      if (result.success) {
        await loadDemandes()
      } else {
        alert(result.error || "Erreur lors de la confirmation")
      }
    } catch (error) {
      console.error("Erreur:", error)
      alert("Erreur de connexion")
    } finally {
      setConfirmingReception(null)
    }
  }

  const handleConfirmLivraison = async (demandeId: string) => {
    if (!token) return
    
    setConfirmingLivraison(demandeId)
    try {
      const response = await fetch(`/api/demandes/${demandeId}/actions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          action: "confirmer_livraison"
        }),
      })

      const result = await response.json()

      if (result.success) {
        await loadDemandes()
      } else {
        alert(result.error || "Erreur lors de la confirmation")
      }
    } catch (error) {
      console.error("Erreur:", error)
      alert("Erreur de connexion")
    } finally {
      setConfirmingLivraison(null)
    }
  }

  const getStatusBadge = (status: string) => {
    if (status === "en_attente_reception_livreur") {
      return (
        <Badge className="bg-indigo-400 hover:bg-indigo-500">
          <Package className="w-3 h-3 mr-1" />
          À réceptionner
        </Badge>
      )
    }
    return (
      <Badge className="bg-indigo-500 hover:bg-indigo-600">
        <Truck className="w-3 h-3 mr-1" />
        À livrer
      </Badge>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-indigo-600" />
              Mes livraisons à effectuer
            </CardTitle>
            <CardDescription>
              {mesLivraisons.length} livraison{mesLivraisons.length > 1 ? "s" : ""} assignée{mesLivraisons.length > 1 ? "s" : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {livraisonsAReceptionner.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Matériel à réceptionner ({livraisonsAReceptionner.length})
                  </h3>
                  <div className="space-y-2">
                    {livraisonsAReceptionner.map((demande) => (
                      <div
                        key={demande.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{demande.numero}</span>
                            {getStatusBadge(demande.status)}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {demande.projet?.nom || "Projet non défini"}
                          </p>
                          <p className="text-xs text-gray-500">
                            {demande.items?.length || 0} article{(demande.items?.length || 0) > 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedDemandeId(demande.id)}
                          >
                            Voir détails
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleConfirmReception(demande.id)}
                            disabled={confirmingReception === demande.id}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                          >
                            {confirmingReception === demande.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            ) : (
                              <CheckCircle className="w-4 h-4 mr-1" />
                            )}
                            Réception
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {livraisonsAEffectuer.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Truck className="w-4 h-4" />
                    Livraisons à effectuer ({livraisonsAEffectuer.length})
                  </h3>
                  <div className="space-y-2">
                    {livraisonsAEffectuer.map((demande) => (
                      <div
                        key={demande.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{demande.numero}</span>
                            {getStatusBadge(demande.status)}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {demande.projet?.nom || "Projet non défini"}
                          </p>
                          <p className="text-xs text-gray-500">
                            Demandeur: {demande.technicien?.nom} {demande.technicien?.prenom}
                          </p>
                          {demande.dateReceptionLivreur && (
                            <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                              <CheckCircle className="w-3 h-3" />
                              Matériel réceptionné le {new Date(demande.dateReceptionLivreur).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedDemandeId(demande.id)}
                          >
                            Voir détails
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleConfirmLivraison(demande.id)}
                            disabled={confirmingLivraison === demande.id}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            {confirmingLivraison === demande.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            ) : (
                              <Truck className="w-4 h-4 mr-1" />
                            )}
                            Livraison
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
      </div>

      {selectedDemandeId && (
        <DemandeDetailsModal
          isOpen={!!selectedDemandeId}
          onClose={() => setSelectedDemandeId(null)}
          demande={demandes.find(d => d.id === selectedDemandeId) || null}
          showDeliveryColumns={true}
          canEditPrices={false}
        />
      )}
    </>
  )
}

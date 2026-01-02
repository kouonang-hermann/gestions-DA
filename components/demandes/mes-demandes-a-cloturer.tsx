"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useStore } from "@/stores/useStore"
import { CheckCircle, Package, Clock, Eye } from "lucide-react"
import type { Demande } from "@/types"
import DemandeDetailsModal from "@/components/modals/demande-details-modal"

export default function MesDemandesACloturer() {
  const { currentUser, demandes, loadDemandes, executeAction, isLoading } = useStore()
  const [demandesACloturer, setDemandesACloturer] = useState<Demande[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedDemandeId, setSelectedDemandeId] = useState<string | null>(null)

  useEffect(() => {
    if (currentUser && demandes) {
      console.log(`🔍 [CLÔTURE] Filtrage pour ${currentUser.nom} (${currentUser.role}):`)
      console.log(`  - ID utilisateur: ${currentUser.id}`)
      console.log(`  - Total demandes: ${demandes.length}`)
      
      // Afficher toutes les demandes de l'utilisateur avec leurs statuts
      const mesDemandesAll = demandes.filter(d => d.technicienId === currentUser.id)
      console.log(`  - Demandes de l'utilisateur: ${mesDemandesAll.length}`)
      mesDemandesAll.forEach(d => {
        console.log(`    • ${d.numero}: statut="${d.status}", type=${d.type}`)
      })
      
      // Filtrer les demandes que l'utilisateur peut clôturer
      const mesDemandesACloturer = demandes.filter(
        (demande) => {
          const isMyDemande = demande.technicienId === currentUser.id
          const isCloturable = demande.status === "confirmee_demandeur" || demande.status === "en_attente_validation_finale_demandeur"
          
          return isMyDemande && isCloturable
        }
      )
      
      console.log(`  - Demandes à clôturer trouvées: ${mesDemandesACloturer.length}`)
      if (mesDemandesACloturer.length > 0) {
        console.log(`  - IDs des demandes à clôturer:`, mesDemandesACloturer.map(d => d.numero))
      } else {
        console.log(`  ⚠️ Aucune demande avec statut "confirmee_demandeur" ou "en_attente_validation_finale_demandeur"`)
      }
      
      setDemandesACloturer(mesDemandesACloturer)
    }
  }, [currentUser, demandes])

  const handleCloturer = async (demandeId: string) => {
    setActionLoading(demandeId)
    
    try {
      const commentaire = prompt("Commentaire de clôture (optionnel) :")
      
      const success = await executeAction(demandeId, "cloturer", { 
        commentaire: commentaire || "Demande clôturée par le demandeur" 
      })
      
      if (success) {
        await loadDemandes()
      }
    } catch (error) {
      console.error("Erreur lors de la clôture:", error)
    } finally {
      setActionLoading(null)
    }
  }

  const handleVoirDetails = (demandeId: string) => {
    setSelectedDemandeId(demandeId)
    setDetailsModalOpen(true)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmee_demandeur":
        return (
          <Badge style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
            ✅ Confirmée - Prête à clôturer
          </Badge>
        )
      case "en_attente_validation_finale_demandeur":
        return (
          <Badge style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
            ⏳ En attente de votre validation
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            Mes demandes à clôturer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-blue-600" />
            Mes demandes à clôturer ({demandesACloturer.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {demandesACloturer.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">Aucune demande à clôturer</p>
              <p className="text-sm">
                Vos demandes livrées et confirmées apparaîtront ici pour clôture finale.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {demandesACloturer.map((demande) => (
                <div
                  key={demande.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {demande.numero}
                        </h3>
                        {getStatusBadge(demande.status)}
                        <Badge 
                          variant="outline"
                          style={{ 
                            backgroundColor: demande.type === 'materiel' ? '#dbeafe' : '#f3e8ff',
                            color: demande.type === 'materiel' ? '#015fc4' : '#7c3aed'
                          }}
                        >
                          {demande.type === 'materiel' ? '📦 Matériel' : '🔧 Outillage'}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        {demande.commentaires || 'Aucune description'}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>
                          📋 Projet: {demande.projet?.nom || 'N/A'}
                        </span>
                        <span>
                          📦 {demande.items?.length || 0} article{(demande.items?.length || 0) > 1 ? 's' : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(demande.dateCreation).toLocaleDateString()}
                        </span>
                      </div>

                      {demande.status === "confirmee_demandeur" && (
                        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                          <p className="text-sm text-green-800">
                            ✅ <strong>Demande livrée et confirmée</strong> - Vous pouvez maintenant la clôturer définitivement.
                          </p>
                        </div>
                      )}

                      {demande.status === "en_attente_validation_finale_demandeur" && (
                        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            ⏳ <strong>En attente de votre validation</strong> - Vérifiez la livraison et clôturez si tout est conforme.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleVoirDetails(demande.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Détails
                      </Button>
                      
                      <Button
                        size="sm"
                        onClick={() => handleCloturer(demande.id)}
                        disabled={actionLoading === demande.id}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {actionLoading === demande.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-1" />
                        )}
                        Clôturer
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de détails */}
      {selectedDemandeId && (
        <DemandeDetailsModal
          isOpen={detailsModalOpen}
          onClose={() => {
            setDetailsModalOpen(false)
            setSelectedDemandeId(null)
          }}
          demande={demandesACloturer.find(d => d.id === selectedDemandeId) || null}
          canValidate={false}
          canEditPrices={false}
          canRemoveItems={false}
          showDeliveryColumns={true}
        />
      )}
    </>
  )
}

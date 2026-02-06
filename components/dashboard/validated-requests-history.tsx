"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { CheckCircle, Clock, User, Package, Calendar, FileText, Eye } from "lucide-react"
import type { Demande, HistoryEntry } from "@/types"
import PurchaseRequestDetailsModal from "@/components/modals/purchase-request-details-modal"
import { useStore } from "@/stores/useStore"

interface ValidatedRequestsHistoryProps {
  isOpen: boolean
  onClose: () => void
}

interface DemandeWithHistory extends Demande {
  history: HistoryEntry[]
  validationSteps: ValidationStep[]
}

interface ValidationStep {
  role: string
  validator: string
  date: string
  status: string
}

export default function ValidatedRequestsHistory({ isOpen, onClose }: ValidatedRequestsHistoryProps) {
  const [validatedRequests, setValidatedRequests] = useState<DemandeWithHistory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<DemandeWithHistory | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchValidatedRequests()
    }
  }, [isOpen])

  const fetchValidatedRequests = async () => {
    setIsLoading(true)
    try {
      const token = useStore.getState().token
      
      // Check localStorage as fallback
      const localToken = localStorage.getItem('token')
      
      const finalToken = token || localToken
      
      if (!finalToken) {
        setError('Non authentifié')
        setIsLoading(false)
        return
      }
      
      const response = await fetch('/api/demandes/validated-history', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${finalToken}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setValidatedRequests(data.data || [])
      } else {
        setError(`Erreur lors du chargement de l'historique: ${response.statusText}`)
      }
    } catch (error) {
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'cloturee':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'confirmee_demandeur':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'en_attente_validation_finale_demandeur':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'rejetee':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'cloturee':
        return 'Clôturée'
      case 'confirmee_demandeur':
        return 'Confirmée'
      case 'en_attente_validation_finale_demandeur':
        return 'Livrée - En attente de clôture'
      case 'rejetee':
        return 'Rejetée'
      default:
        return status
    }
  }

  const getRoleLabel = (role: string) => {
    const roleLabels: { [key: string]: string } = {
      conducteur: 'Conducteur de Travaux',
      responsable_travaux: 'Responsable des Travaux',
      qhse: 'Responsable QHSE',
      appro: 'Responsable Approvisionnements',
      charge_affaire: 'Chargé d\'Affaire',
      logistique: 'Responsable Logistique',
      employe: 'Demandeur'
    }
    return roleLabels[role] || role
  }

  const openRequestDetails = (request: DemandeWithHistory) => {
    setSelectedRequest(request)
    setDetailsModalOpen(true)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Toutes mes demandes
            </DialogTitle>
            <DialogDescription>
              Toutes les demandes ayant suivi le processus de validation complet
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[70vh]">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : validatedRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Aucune demande trouvée</p>
              </div>
            ) : (
              <div className="space-y-4">
                {validatedRequests.map((request) => (
                  <Card key={request.id} className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Package className="h-5 w-5 text-blue-600" />
                          <div>
                            <CardTitle className="text-lg">
                              {request.numero}
                            </CardTitle>
                            <p className="text-sm text-gray-600">
                              {request.projet?.nom} • {request.type === 'materiel' ? 'Matériel' : 'Outillage'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(request.status || request.status)}>
                            {getStatusLabel(request.status || request.status)}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openRequestDetails(request)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Détails
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            <strong>Demandeur:</strong> {request.technicien?.nom} {request.technicien?.prenom}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            <strong>Créée le:</strong> {new Date(request.dateCreation).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">
                            <strong>Dernière action:</strong> {request.validationSteps?.length > 0 
                              ? new Date(request.validationSteps[request.validationSteps.length - 1].date).toLocaleDateString('fr-FR')
                              : new Date(request.dateCreation).toLocaleDateString('fr-FR')
                            }
                          </span>
                        </div>
                      </div>

                      <Separator className="my-3" />

                      <div>
                        <h4 className="font-medium mb-2 text-sm">Articles demandés:</h4>
                        <div className="space-y-2">
                          {request.items?.map((item, index) => {
                            const quantiteValidee = item.quantiteValidee || item.quantiteDemandee
                            const quantiteLivree = item.quantiteSortie || 0
                            const quantiteRestante = Math.max(0, quantiteValidee - quantiteLivree)
                            
                            return (
                              <div key={index} className="bg-gray-50 p-3 rounded text-sm border border-gray-200">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="font-medium">{item.article?.nom || 'Article inconnu'}</span>
                                  <span className="text-xs text-gray-500">{item.article?.reference || 'N/A'}</span>
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                  <Badge variant="secondary" className="text-xs">
                                    Qté validée: {quantiteValidee}
                                  </Badge>
                                  <Badge className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                                    Qté livrée: {quantiteLivree}
                                  </Badge>
                                  <Badge className="text-xs bg-orange-100 text-orange-700 border-orange-200">
                                    Qté restante: {quantiteRestante}
                                  </Badge>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>

                      {request.validationSteps && request.validationSteps.length > 0 && (
                        <>
                          <Separator className="my-3" />
                          <div>
                            <h4 className="font-medium mb-2 text-sm">Étapes de validation:</h4>
                            <div className="flex flex-wrap gap-2">
                              {request.validationSteps.map((step, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {getRoleLabel(step.role)} ✓
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {request.commentaires && (
                        <>
                          <Separator className="my-3" />
                          <div>
                            <h4 className="font-medium mb-2 text-sm">Commentaires:</h4>
                            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                              {request.commentaires}
                            </p>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Modal des détails de la demande avec format professionnel */}
      <PurchaseRequestDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        demande={selectedRequest}
      />
    </>
  )
}

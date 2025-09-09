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
  quantities: { [key: string]: number }
  status: string
}

export default function ValidatedRequestsHistory({ isOpen, onClose }: ValidatedRequestsHistoryProps) {
  const [validatedRequests, setValidatedRequests] = useState<DemandeWithHistory[]>([])
  const [isLoading, setIsLoading] = useState(false)
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
      const token = localStorage.getItem('token')
      const response = await fetch('/api/demandes/validated-history', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setValidatedRequests(data.data || [])
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'historique:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmee_demandeur':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rejetee':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmee_demandeur':
        return 'Validée Complètement'
      case 'rejetee':
        return 'Rejetée'
      default:
        return status
    }
  }

  const getRoleLabel = (role: string) => {
    const roleLabels: { [key: string]: string } = {
      conducteur_travaux: 'Conducteur de Travaux',
      responsable_travaux: 'Responsable des Travaux',
      responsable_qhse: 'Responsable QHSE',
      responsable_appro: 'Responsable Approvisionnements',
      charge_affaire: 'Chargé d\'Affaire',
      responsable_logistique: 'Responsable Logistique',
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
              Historique des Demandes Validées
            </DialogTitle>
            <DialogDescription>
              Toutes les demandes ayant suivi le flow complet de validation
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
                <p>Aucune demande validée trouvée</p>
              </div>
            ) : (
              <div className="space-y-4">
                {validatedRequests.map((request) => (
                  <Card key={request.id} className="border-l-4 border-l-green-500">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Package className="h-5 w-5 text-blue-600" />
                          <div>
                            <CardTitle className="text-lg">
                              Demande #{request.id.slice(-8)}
                            </CardTitle>
                            <p className="text-sm text-gray-600">
                              {request.projet?.nom} • {request.type}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(request.statut)}>
                            {getStatusLabel(request.statut)}
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
                            <strong>Demandeur:</strong> {request.demandeur?.nom} {request.demandeur?.prenom}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">
                            <strong>Créée le:</strong> {new Date(request.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">
                            <strong>Validée le:</strong> {request.validationSteps?.length > 0 
                              ? new Date(request.validationSteps[request.validationSteps.length - 1].date).toLocaleDateString('fr-FR')
                              : 'N/A'
                            }
                          </span>
                        </div>
                      </div>

                      <Separator className="my-3" />

                      <div>
                        <h4 className="font-medium mb-2 text-sm">Articles demandés:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {request.items?.map((item, index) => (
                            <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
                              <span>{item.article?.nom || 'Article inconnu'}</span>
                              <Badge variant="secondary">
                                Qté: {item.quantite}
                              </Badge>
                            </div>
                          ))}
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Modal des détails de la demande */}
      {selectedRequest && (
        <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>
                Détails de la Demande #{selectedRequest.id.slice(-8)}
              </DialogTitle>
            </DialogHeader>
            
            <ScrollArea className="h-[70vh]">
              <div className="space-y-6">
                {/* Informations générales */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informations Générales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p><strong>Projet:</strong> {selectedRequest.projet?.nom}</p>
                        <p><strong>Type:</strong> {selectedRequest.type}</p>
                        <p><strong>Statut:</strong> 
                          <Badge className={`ml-2 ${getStatusColor(selectedRequest.statut)}`}>
                            {getStatusLabel(selectedRequest.statut)}
                          </Badge>
                        </p>
                      </div>
                      <div>
                        <p><strong>Demandeur:</strong> {selectedRequest.demandeur?.nom} {selectedRequest.demandeur?.prenom}</p>
                        <p><strong>Date de création:</strong> {new Date(selectedRequest.createdAt).toLocaleDateString('fr-FR')}</p>
                        <p><strong>Urgence:</strong> {selectedRequest.urgence ? 'Oui' : 'Non'}</p>
                      </div>
                    </div>
                    {selectedRequest.justification && (
                      <div className="mt-4">
                        <p><strong>Justification:</strong></p>
                        <p className="text-gray-700 bg-gray-50 p-3 rounded mt-1">{selectedRequest.justification}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Articles avec quantités validées */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Articles et Quantités Validées</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedRequest.items?.map((item, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-medium">{item.article?.nom || 'Article inconnu'}</h4>
                              <p className="text-sm text-gray-600">{item.article?.description}</p>
                            </div>
                            <Badge variant="secondary">
                              Quantité finale: {item.quantite}
                            </Badge>
                          </div>
                          
                          {/* Historique des quantités par valideur */}
                          {selectedRequest.validationSteps && (
                            <div className="mt-3">
                              <h5 className="text-sm font-medium mb-2">Historique des validations:</h5>
                              <div className="space-y-1">
                                {selectedRequest.validationSteps.map((step, stepIndex) => (
                                  <div key={stepIndex} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                                    <span>{getRoleLabel(step.role)} ({step.validator})</span>
                                    <div className="flex items-center gap-2">
                                      <span>Qté validée: {step.quantities[item.id] || item.quantite}</span>
                                      <span className="text-gray-500">{new Date(step.date).toLocaleDateString('fr-FR')}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Historique complet */}
                {selectedRequest.history && selectedRequest.history.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Historique Complet</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {selectedRequest.history.map((entry, index) => (
                          <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                            <Clock className="h-4 w-4 text-gray-500 mt-1" />
                            <div className="flex-1">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium text-sm">{entry.action}</p>
                                  <p className="text-sm text-gray-600">
                                    {entry.user?.nom} {entry.user?.prenom} ({getRoleLabel(entry.user?.role || '')})
                                  </p>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {new Date(entry.createdAt).toLocaleString('fr-FR')}
                                </span>
                              </div>
                              {entry.commentaire && (
                                <p className="text-sm text-gray-700 mt-1 italic">"{entry.commentaire}"</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

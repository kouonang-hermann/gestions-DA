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
              <FileText className="h-5 w-5 text-blue-600" />
              Toutes les demandes
            </DialogTitle>
            <DialogDescription>
              Vue d'ensemble de toutes les demandes du système
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
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="text-left p-3 font-medium text-sm text-gray-600">Numéro</th>
                      <th className="text-left p-3 font-medium text-sm text-gray-600">Type</th>
                      <th className="text-left p-3 font-medium text-sm text-gray-600">Projet</th>
                      <th className="text-left p-3 font-medium text-sm text-gray-600">Demandeur</th>
                      <th className="text-left p-3 font-medium text-sm text-gray-600">Statut</th>
                      <th className="text-left p-3 font-medium text-sm text-gray-600">Date création</th>
                      <th className="text-center p-3 font-medium text-sm text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validatedRequests.map((request) => (
                      <tr key={request.id} className="border-t hover:bg-gray-50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-sm">{request.numero}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-xs">
                            {request.type === 'materiel' ? 'Matériel' : 'Outillage'}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm">
                          {request.projet?.nom || 'N/A'}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">
                              {request.technicien?.prenom} {request.technicien?.nom}
                            </span>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge className={getStatusColor(request.status)}>
                            {getStatusLabel(request.status)}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span className="text-sm">
                              {new Date(request.dateCreation).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openRequestDetails(request)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

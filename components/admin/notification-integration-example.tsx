"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { useNotifications, triggerStatusChangeNotifications } from "@/hooks/useNotifications"
import { useStore } from "@/stores/useStore"
import type { DemandeStatus } from "@/types"

/**
 * Exemple d'intégration du système de notifications
 * Ce composant montre comment utiliser les notifications lors des changements de statut
 */
export default function NotificationIntegrationExample() {
  const { demandes, users, updateDemande } = useStore()
  const { notifyStatusChange } = useNotifications()
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  // Exemple de fonction pour changer le statut d'une demande avec notifications
  const handleStatusChange = async (demandeId: string, newStatus: DemandeStatus) => {
    setIsUpdating(demandeId)
    
    try {
      const demande = demandes.find(d => d.id === demandeId)
      if (!demande) return

      const oldStatus = demande.status

      // 1. Mettre à jour le statut en base de données
      const updatedDemande = { ...demande, status: newStatus }
      updateDemande(demandeId, updatedDemande)

      // 2. Déclencher les notifications automatiques
      await notifyStatusChange(updatedDemande, oldStatus, newStatus, users)

      console.log(`✅ Statut mis à jour et notifications envoyées pour ${demande.numero}`)
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
    } finally {
      setIsUpdating(null)
    }
  }

  // Exemple avec la fonction utilitaire
  const handleStatusChangeWithUtility = async (demandeId: string, newStatus: DemandeStatus) => {
    setIsUpdating(demandeId)
    
    try {
      const demande = demandes.find(d => d.id === demandeId)
      if (!demande) return

      const oldStatus = demande.status

      // 1. Mettre à jour le statut
      const updatedDemande = { ...demande, status: newStatus }
      updateDemande(demandeId, updatedDemande)

      // 2. Utiliser la fonction utilitaire pour les notifications
      await triggerStatusChangeNotifications(demandeId, oldStatus, newStatus, users, demandes)

      console.log(`✅ Statut mis à jour avec fonction utilitaire pour ${demande.numero}`)
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
    } finally {
      setIsUpdating(null)
    }
  }

  const getStatusColor = (status: DemandeStatus) => {
    if (status.includes('attente')) return 'bg-yellow-100 text-yellow-800'
    if (status === 'cloturee' || status === 'confirmee_demandeur') return 'bg-green-100 text-green-800'
    if (status === 'rejetee') return 'bg-red-100 text-red-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status: DemandeStatus) => {
    if (status.includes('attente')) return <Clock className="h-4 w-4" />
    if (status === 'cloturee' || status === 'confirmee_demandeur') return <CheckCircle className="h-4 w-4" />
    if (status === 'rejetee') return <AlertCircle className="h-4 w-4" />
    return <Mail className="h-4 w-4" />
  }

  // Prendre les 5 premières demandes pour l'exemple
  const exampleDemandes = demandes.slice(0, 5)

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" style={{ color: '#015fc4' }} />
          Exemple d'Intégration des Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-medium text-blue-900 mb-2">Comment ça fonctionne :</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Changez le statut d'une demande</li>
            <li>• Le système envoie automatiquement des emails aux personnes concernées</li>
            <li>• Les valideurs reçoivent des notifications de validation</li>
            <li>• Les demandeurs reçoivent des notifications de clôture</li>
          </ul>
        </div>

        {exampleDemandes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Aucune demande disponible pour la démonstration
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">Demandes d'exemple :</h3>
            {exampleDemandes.map((demande) => (
              <Card key={demande.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium">{demande.numero}</h4>
                        <Badge className={`text-xs ${getStatusColor(demande.status)}`}>
                          {getStatusIcon(demande.status)}
                          <span className="ml-1">{demande.status.replace(/_/g, ' ')}</span>
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        Type: {demande.type} • {demande.items?.length || 0} articles
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      {/* Boutons d'action selon le statut actuel */}
                      {demande.status === 'soumise' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(demande.id, 'en_attente_validation_conducteur')}
                          disabled={isUpdating === demande.id}
                          style={{ backgroundColor: '#015fc4' }}
                        >
                          {isUpdating === demande.id ? 'Envoi...' : 'Envoyer en validation'}
                        </Button>
                      )}
                      
                      {demande.status === 'en_attente_validation_conducteur' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChangeWithUtility(demande.id, 'en_attente_validation_logistique')}
                            disabled={isUpdating === demande.id}
                          >
                            Valider → QHSE
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStatusChange(demande.id, 'rejetee')}
                            disabled={isUpdating === demande.id}
                          >
                            Rejeter
                          </Button>
                        </>
                      )}
                      
                      {demande.status === 'en_attente_validation_logistique' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(demande.id, 'en_attente_validation_finale_demandeur')}
                          disabled={isUpdating === demande.id}
                        >
                          Valider → Clôture
                        </Button>
                      )}
                      
                      {demande.status === 'en_attente_validation_finale_demandeur' && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleStatusChange(demande.id, 'cloturee')}
                          disabled={isUpdating === demande.id}
                        >
                          Clôturer
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Code d'exemple :</h4>
          <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
{`// Méthode 1: Avec le hook
const { notifyStatusChange } = useNotifications()
await notifyStatusChange(demande, oldStatus, newStatus, users)

// Méthode 2: Avec la fonction utilitaire
await triggerStatusChangeNotifications(
  demandeId, oldStatus, newStatus, users, demandes
)`}
          </pre>
        </div>
      </CardContent>
    </Card>
  )
}

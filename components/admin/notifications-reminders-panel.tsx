"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Send, RefreshCw, CheckCircle, AlertCircle, Clock } from "lucide-react"
import { useStore } from "@/stores/useStore"

export default function NotificationsRemindersPanel() {
  const { currentUser, token } = useStore()
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const loadStats = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch("/api/notifications/reminders", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      const data = await response.json()
      
      if (data.success) {
        setStats(data.data)
      } else {
        setError(data.error || "Erreur lors du chargement des statistiques")
      }
    } catch (err) {
      setError("Erreur de connexion au serveur")
    } finally {
      setLoading(false)
    }
  }

  const sendReminders = async () => {
    if (!confirm("Êtes-vous sûr de vouloir envoyer les rappels pour toutes les demandes en attente depuis plus de 24h ?")) {
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)
    
    try {
      const response = await fetch("/api/notifications/reminders", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      const data = await response.json()
      
      if (data.success) {
        setResult(data)
        // Recharger les stats après l'envoi
        await loadStats()
      } else {
        setError(data.error || "Erreur lors de l'envoi des rappels")
      }
    } catch (err) {
      setError("Erreur de connexion au serveur")
    } finally {
      setLoading(false)
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      en_attente_validation_conducteur: "Validation Conducteur",
      en_attente_validation_logistique: "Validation Logistique",
      en_attente_validation_responsable_travaux: "Validation Resp. Travaux",
      en_attente_validation_charge_affaire: "Validation Chargé Affaire",
      en_attente_preparation_appro: "Préparation Appro",
      en_attente_reception_livreur: "Réception Livreur",
      en_attente_livraison: "Livraison",
      en_attente_validation_finale_demandeur: "Validation Finale"
    }
    return labels[status] || status
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-orange-600" />
            <div>
              <CardTitle>Rappels Automatiques</CardTitle>
              <CardDescription>
                Envoyer des rappels pour les demandes en attente depuis plus de 24h
              </CardDescription>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadStats}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Statistiques */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-700">Total en attente</span>
              </div>
              <p className="text-2xl font-bold text-orange-900">{stats.total}</p>
              <p className="text-xs text-orange-600 mt-1">Depuis plus de {stats.seuilRappel}</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Statuts différents</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{stats.parStatut?.length || 0}</p>
              <p className="text-xs text-blue-600 mt-1">Étapes de validation</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <Send className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-700">Action</span>
              </div>
              <Button
                onClick={sendReminders}
                disabled={loading || stats.total === 0}
                className="w-full bg-green-600 hover:bg-green-700 mt-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Envoyer les rappels
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Détails par statut */}
        {stats?.parStatut && stats.parStatut.length > 0 && (
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Répartition par statut</h3>
            <div className="space-y-2">
              {stats.parStatut.map((item: any) => (
                <div
                  key={item.status}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <span className="text-sm text-gray-700">{getStatusLabel(item.status)}</span>
                  <Badge variant="secondary">{item._count} demande{item._count > 1 ? "s" : ""}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Résultat de l'envoi */}
        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-green-900">Rappels envoyés avec succès</h4>
                <p className="text-sm text-green-700 mt-1">{result.message}</p>
                <div className="mt-2 text-xs text-green-600">
                  <p>• Demandes traitées : {result.data?.demandesTraitees}</p>
                  <p>• Rappels envoyés : {result.data?.rappelsEnvoyes}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-red-900">Erreur</h4>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">ℹ️ Informations</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Les rappels sont envoyés aux utilisateurs concernés par email et WhatsApp (si configurés)</li>
            <li>• Seules les demandes en attente depuis plus de 24h reçoivent un rappel</li>
            <li>• Les rappels peuvent également être automatisés via un cron job</li>
            <li>• Cette fonctionnalité est réservée aux superadmins</li>
          </ul>
        </div>

        {/* Bouton de chargement initial */}
        {!stats && !loading && (
          <Button
            onClick={loadStats}
            className="w-full"
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Charger les statistiques
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

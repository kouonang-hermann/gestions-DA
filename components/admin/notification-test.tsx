"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Mail, Send, CheckCircle, AlertCircle } from "lucide-react"
import { useNotifications } from "@/hooks/useNotifications"
import type { User, Demande } from "@/types"

interface NotificationTestProps {
  users: User[]
  demandes: Demande[]
}

export default function NotificationTest({ users, demandes }: NotificationTestProps) {
  const [testEmail, setTestEmail] = useState("")
  const [selectedDemande, setSelectedDemande] = useState<string>("")
  const [testStatus, setTestStatus] = useState<"idle" | "sending" | "success" | "error">("idle")
  const [testMessage, setTestMessage] = useState("")
  
  const { notifyValidationRequest, notifyClosureRequest } = useNotifications()

  const handleTestValidationEmail = async () => {
    if (!testEmail || !selectedDemande) {
      setTestStatus("error")
      setTestMessage("Veuillez sélectionner un email et une demande")
      return
    }

    setTestStatus("sending")
    
    try {
      const demande = demandes.find(d => d.id === selectedDemande)
      const validator = users.find(u => u.email === testEmail)
      const requester = users.find(u => u.id === demande?.technicienId)

      if (!demande || !validator || !requester) {
        throw new Error("Données manquantes pour le test")
      }

      await notifyValidationRequest(validator, demande, requester)
      
      setTestStatus("success")
      setTestMessage("Email de validation envoyé avec succès !")
    } catch (error) {
      setTestStatus("error")
      setTestMessage(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }

  const handleTestClosureEmail = async () => {
    if (!testEmail || !selectedDemande) {
      setTestStatus("error")
      setTestMessage("Veuillez sélectionner un email et une demande")
      return
    }

    setTestStatus("sending")
    
    try {
      const demande = demandes.find(d => d.id === selectedDemande)
      const requester = users.find(u => u.email === testEmail)

      if (!demande || !requester) {
        throw new Error("Données manquantes pour le test")
      }

      await notifyClosureRequest(requester, demande)
      
      setTestStatus("success")
      setTestMessage("Email de clôture envoyé avec succès !")
    } catch (error) {
      setTestStatus("error")
      setTestMessage(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }

  const getStatusIcon = () => {
    switch (testStatus) {
      case "sending":
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-600" />
      default:
        return <Mail className="h-4 w-4" style={{ color: '#015fc4' }} />
    }
  }

  const getStatusColor = () => {
    switch (testStatus) {
      case "success":
        return "text-green-600"
      case "error":
        return "text-red-600"
      case "sending":
        return "text-blue-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" style={{ color: '#015fc4' }} />
          Test du Système de Notifications Email
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configuration du test */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="test-email">Email de test</Label>
            <select
              id="test-email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Sélectionner un utilisateur</option>
              {users.filter(u => u.email).map(user => (
                <option key={user.id} value={user.email}>
                  {user.nom} ({user.email}) - {user.role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="test-demande">Demande de test</Label>
            <select
              id="test-demande"
              value={selectedDemande}
              onChange={(e) => setSelectedDemande(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Sélectionner une demande</option>
              {demandes.slice(0, 10).map(demande => (
                <option key={demande.id} value={demande.id}>
                  {demande.numero} - {demande.type} ({demande.status})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Boutons de test */}
        <div className="flex gap-4">
          <Button
            onClick={handleTestValidationEmail}
            disabled={testStatus === "sending" || !testEmail || !selectedDemande}
            className="flex-1"
            style={{ backgroundColor: '#015fc4' }}
          >
            <Send className="h-4 w-4 mr-2" />
            Tester Email de Validation
          </Button>

          <Button
            onClick={handleTestClosureEmail}
            disabled={testStatus === "sending" || !testEmail || !selectedDemande}
            variant="outline"
            className="flex-1"
          >
            <Send className="h-4 w-4 mr-2" />
            Tester Email de Clôture
          </Button>
        </div>

        {/* Statut du test */}
        {testMessage && (
          <div className={`flex items-center gap-2 p-3 rounded-md border ${
            testStatus === "success" ? "bg-green-50 border-green-200" :
            testStatus === "error" ? "bg-red-50 border-red-200" :
            "bg-blue-50 border-blue-200"
          }`}>
            {getStatusIcon()}
            <span className={getStatusColor()}>{testMessage}</span>
          </div>
        )}

        {/* Informations sur la configuration */}
        <div className="bg-gray-50 p-4 rounded-md">
          <h4 className="font-medium mb-2">Configuration requise :</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Variables d'environnement EMAIL_* configurées</li>
            <li>• Serveur SMTP ou Gmail configuré</li>
            <li>• API endpoint /api/notifications/email fonctionnel</li>
          </ul>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold" style={{ color: '#015fc4' }}>
              {users.filter(u => u.email).length}
            </div>
            <div className="text-sm text-gray-600">Utilisateurs avec email</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {demandes.length}
            </div>
            <div className="text-sm text-gray-600">Demandes disponibles</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {demandes.filter(d => d.status.includes('attente')).length}
            </div>
            <div className="text-sm text-gray-600">En attente</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

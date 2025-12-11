"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { MessageCircle, CheckCircle, XCircle, Loader2, Info, Send } from "lucide-react"

export function WhatsAppTest() {
  const [phoneNumber, setPhoneNumber] = useState("")
  const [customMessage, setCustomMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    details?: any
  } | null>(null)

  const handleSendTest = async () => {
    if (!phoneNumber) {
      setResult({
        success: false,
        message: "Veuillez entrer un numéro de téléphone"
      })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const message = customMessage || `🧪 *Test WhatsApp*

Bonjour !

Ce message de test confirme que les notifications WhatsApp fonctionnent correctement.

📅 Envoyé le : ${new Date().toLocaleString('fr-FR')}

_Système de Gestion des Demandes Matériel_`

      const response = await fetch('/api/notifications/whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: phoneNumber,
          message: message,
          type: 'validation_request'
        }),
      })

      const data = await response.json()

      if (data.success) {
        setResult({
          success: true,
          message: "Message WhatsApp envoyé avec succès !",
          details: data
        })
      } else if (data.skipped) {
        setResult({
          success: false,
          message: "Notifications WhatsApp désactivées. Activez ENABLE_WHATSAPP_NOTIFICATIONS=true dans .env.local",
          details: data
        })
      } else {
        setResult({
          success: false,
          message: data.error || "Échec de l'envoi",
          details: data
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Erreur réseau"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-6 w-6 text-green-500" />
          Test Notifications WhatsApp
        </CardTitle>
        <CardDescription>
          Testez l'envoi de messages WhatsApp via Twilio
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Instructions */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Configuration Twilio Sandbox</AlertTitle>
          <AlertDescription className="mt-2">
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Créez un compte sur <a href="https://www.twilio.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">twilio.com</a></li>
              <li>Accédez à <strong>Messaging → Try it out → Send a WhatsApp message</strong></li>
              <li>Envoyez le code affiché (ex: <code className="bg-gray-100 px-1 rounded">join example-sandbox</code>) au <strong>+1 415 523 8886</strong> depuis votre WhatsApp</li>
              <li>Copiez vos credentials (Account SID et Auth Token) dans votre <code className="bg-gray-100 px-1 rounded">.env.local</code></li>
              <li>Définissez <code className="bg-gray-100 px-1 rounded">ENABLE_WHATSAPP_NOTIFICATIONS=true</code></li>
            </ol>
          </AlertDescription>
        </Alert>

        {/* Formulaire */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Numéro de téléphone (format international)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+33612345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="font-mono"
            />
            <p className="text-xs text-gray-500">
              Le numéro doit avoir rejoint le sandbox Twilio au préalable
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message personnalisé (optionnel)</Label>
            <Textarea
              id="message"
              placeholder="Laissez vide pour utiliser le message de test par défaut"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
            />
          </div>

          <Button 
            onClick={handleSendTest} 
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Envoyer le message test
              </>
            )}
          </Button>
        </div>

        {/* Résultat */}
        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            {result.success ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertTitle>{result.success ? "Succès" : "Erreur"}</AlertTitle>
            <AlertDescription>
              <p>{result.message}</p>
              {result.details && (
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* Variables d'environnement requises */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Variables d'environnement requises :</h4>
          <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
{`# .env.local
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
ENABLE_WHATSAPP_NOTIFICATIONS=true`}
          </pre>
        </div>
      </CardContent>
    </Card>
  )
}

export default WhatsAppTest

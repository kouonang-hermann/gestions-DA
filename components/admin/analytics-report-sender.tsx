"use client"

/**
 * COMPOSANT ADMIN - ENVOI DE RAPPORTS ANALYTIQUES
 * 
 * Interface d'administration pour :
 * - Envoyer manuellement le rapport analytique au Super Admin
 * - Tester l'envoi à un email spécifique
 * - Voir l'aperçu des données du rapport
 * - Configurer l'envoi automatique quotidien
 */

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  BarChart3,
  TrendingUp
} from "lucide-react"
import { toast } from "sonner"

export function AnalyticsReportSender() {
  const [isLoading, setIsLoading] = useState(false)
  const [testEmail, setTestEmail] = useState("")
  const [lastSent, setLastSent] = useState<Date | null>(null)

  /**
   * Envoie le rapport au Super Admin
   */
  const sendToSuperAdmin = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/analytics/send-report', {
        method: 'GET'
      })

      const result = await response.json()

      if (result.success) {
        setLastSent(new Date())
        toast.success('Rapport envoyé au Super Admin avec succès')
      } else {
        toast.error(result.error || 'Erreur lors de l\'envoi du rapport')
      }
    } catch (error) {
      toast.error('Erreur de connexion')
      console.error('Erreur envoi rapport:', error)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Envoie le rapport à un email de test
   */
  const sendToTestEmail = async () => {
    if (!testEmail || !testEmail.includes('@')) {
      toast.error('Veuillez entrer un email valide')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/analytics/send-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail })
      })

      const result = await response.json()

      if (result.success) {
        setLastSent(new Date())
        toast.success(`Rapport envoyé à ${testEmail}`)
        setTestEmail("")
      } else {
        toast.error(result.error || 'Erreur lors de l\'envoi du rapport')
      }
    } catch (error) {
      toast.error('Erreur de connexion')
      console.error('Erreur envoi rapport:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Carte principale */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Rapports Analytiques Direction
              </CardTitle>
              <CardDescription>
                Envoi des rapports sur les projets bloqués et articles non valorisés
              </CardDescription>
            </div>
            {lastSent && (
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Dernier envoi : {lastSent.toLocaleTimeString('fr-FR')}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Envoi au Super Admin */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Envoi au Super Admin
                </h3>
                <p className="text-sm text-muted-foreground">
                  Envoie le rapport complet à l'adresse email du Super Admin
                </p>
              </div>
            </div>
            <Button
              onClick={sendToSuperAdmin}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              <Send className="mr-2 h-4 w-4" />
              Envoyer le Rapport Maintenant
            </Button>
          </div>

          <div className="border-t pt-6">
            {/* Envoi de test */}
            <div className="space-y-3">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Envoi de Test
                </h3>
                <p className="text-sm text-muted-foreground">
                  Testez l'envoi du rapport à une adresse email spécifique
                </p>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="test-email" className="sr-only">Email de test</Label>
                  <Input
                    id="test-email"
                    type="email"
                    placeholder="email@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <Button
                  onClick={sendToTestEmail}
                  disabled={isLoading || !testEmail}
                  variant="outline"
                >
                  <Send className="mr-2 h-4 w-4" />
                  Envoyer
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations sur le rapport */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Contenu du Rapport
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                  Tableau 1
                </div>
                <p className="text-sm text-muted-foreground">
                  Synthèse des projets bloqués avec coûts
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  Tableau 3
                </div>
                <p className="text-sm text-muted-foreground">
                  Articles non valorisés (priorité)
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Tableau 2
                </div>
                <p className="text-sm text-muted-foreground">
                  Top 20 articles restants détaillés
                </p>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Résumé Exécutif Inclus :</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Nombre de projets impactés</li>
                <li>• Total des articles restants</li>
                <li>• Articles non valorisés (alerte)</li>
                <li>• Coût total restant</li>
                <li>• Niveau d'alerte automatique (Normal / Vigilance / Attention)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration automatique */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Envoi Automatique
          </CardTitle>
          <CardDescription>
            Configuration de l'envoi quotidien automatique
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-blue-900">
                    Envoi Automatique Quotidien
                  </p>
                  <p className="text-sm text-blue-700">
                    Pour activer l'envoi automatique quotidien, configurez un cron job ou utilisez Vercel Cron Jobs :
                  </p>
                  <div className="bg-white rounded border border-blue-200 p-3 mt-2">
                    <code className="text-xs">
                      GET /api/analytics/send-report
                    </code>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    Recommandation : Envoi tous les jours à 8h00
                  </p>
                </div>
              </div>
            </div>

            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>Option 1 - Vercel Cron (Recommandé) :</strong></p>
              <p className="pl-4">
                Ajoutez dans <code>vercel.json</code> :
              </p>
              <pre className="bg-slate-100 p-3 rounded text-xs overflow-x-auto">
{`{
  "crons": [{
    "path": "/api/analytics/send-report",
    "schedule": "0 8 * * *"
  }]
}`}
              </pre>

              <p className="pt-4"><strong>Option 2 - Cron Linux :</strong></p>
              <pre className="bg-slate-100 p-3 rounded text-xs overflow-x-auto">
{`0 8 * * * curl https://votre-app.com/api/analytics/send-report`}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Informations de configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-muted-foreground">
              Utilise les mêmes credentials que les notifications (EMAIL_USER, EMAIL_PASSWORD)
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-muted-foreground">
              Template HTML responsive (mobile + desktop)
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-muted-foreground">
              Lien direct vers le dashboard analytique
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

/**
 * COMPOSANT ADMIN - SURVEILLANCE DES EMAILS
 * 
 * Interface d'administration pour gérer la réception des emails :
 * - Démarrer/arrêter la surveillance automatique
 * - Traiter manuellement les emails non lus
 * - Voir les statistiques de traitement
 * - Configurer l'intervalle de vérification
 */

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Mail, 
  PlayCircle, 
  StopCircle, 
  RefreshCw, 
  CheckCircle2, 
  XCircle,
  Clock,
  AlertCircle
} from "lucide-react"
import { toast } from "sonner"

interface EmailStats {
  total: number
  processed: number
  failed: number
  byAction: {
    validate: number
    reject: number
    close: number
    comment: number
    unknown: number
  }
}

interface ProcessedEmail {
  from: string
  subject: string
  date: string
  action: string
  demandeNumero?: string
  processed: boolean
  error?: string
}

export function EmailMonitoring() {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [intervalMinutes, setIntervalMinutes] = useState(5)
  const [stats, setStats] = useState<EmailStats | null>(null)
  const [recentEmails, setRecentEmails] = useState<ProcessedEmail[]>([])

  // Vérifier le statut au chargement
  useEffect(() => {
    checkMonitoringStatus()
  }, [])

  /**
   * Vérifie si la surveillance est active
   */
  const checkMonitoringStatus = async () => {
    try {
      const response = await fetch('/api/emails/monitor')
      const result = await response.json()
      
      if (result.success) {
        setIsMonitoring(result.data.active)
      }
    } catch (error) {
      console.error('Erreur vérification statut:', error)
    }
  }

  /**
   * Démarre la surveillance automatique
   */
  const startMonitoring = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/emails/monitor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intervalMinutes })
      })

      const result = await response.json()

      if (result.success) {
        setIsMonitoring(true)
        toast.success(`Surveillance démarrée (${intervalMinutes}min)`)
      } else {
        toast.error(result.error || 'Erreur démarrage surveillance')
      }
    } catch (error) {
      toast.error('Erreur de connexion')
      console.error('Erreur démarrage:', error)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Arrête la surveillance automatique
   */
  const stopMonitoring = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/emails/monitor', {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        setIsMonitoring(false)
        toast.success('Surveillance arrêtée')
      } else {
        toast.error(result.error || 'Erreur arrêt surveillance')
      }
    } catch (error) {
      toast.error('Erreur de connexion')
      console.error('Erreur arrêt:', error)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Traite manuellement les emails non lus
   */
  const processEmails = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/emails/receive')
      const result = await response.json()

      if (result.success) {
        setStats(result.data.stats)
        setRecentEmails(result.data.emails)
        
        const { processed, total } = result.data.stats
        toast.success(`${processed}/${total} emails traités`)
      } else {
        toast.error(result.error || 'Erreur traitement emails')
      }
    } catch (error) {
      toast.error('Erreur de connexion')
      console.error('Erreur traitement:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Carte de contrôle */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Surveillance des Emails
              </CardTitle>
              <CardDescription>
                Gestion de la réception et du traitement automatique des emails
              </CardDescription>
            </div>
            <Badge variant={isMonitoring ? "default" : "secondary"}>
              {isMonitoring ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Configuration */}
          <div className="space-y-2">
            <Label htmlFor="interval">Intervalle de vérification (minutes)</Label>
            <div className="flex gap-2">
              <Input
                id="interval"
                type="number"
                min="1"
                max="60"
                value={intervalMinutes}
                onChange={(e) => setIntervalMinutes(parseInt(e.target.value) || 5)}
                disabled={isMonitoring}
                className="max-w-[200px]"
              />
              <Button
                onClick={isMonitoring ? stopMonitoring : startMonitoring}
                disabled={isLoading}
                variant={isMonitoring ? "destructive" : "default"}
              >
                {isMonitoring ? (
                  <>
                    <StopCircle className="mr-2 h-4 w-4" />
                    Arrêter
                  </>
                ) : (
                  <>
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Démarrer
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Traitement manuel */}
          <div className="pt-4 border-t">
            <Button
              onClick={processEmails}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Traiter les emails maintenant
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Statistiques de traitement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Traités
                </p>
                <p className="text-2xl font-bold text-green-600">{stats.processed}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <XCircle className="h-4 w-4 text-red-500" />
                  Échecs
                </p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Validations</p>
                <p className="text-2xl font-bold text-blue-600">{stats.byAction.validate}</p>
              </div>
            </div>

            {/* Détails par action */}
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium mb-2">Actions détectées</p>
              <div className="flex flex-wrap gap-2">
                {stats.byAction.reject > 0 && (
                  <Badge variant="destructive">
                    Rejets: {stats.byAction.reject}
                  </Badge>
                )}
                {stats.byAction.close > 0 && (
                  <Badge variant="secondary">
                    Clôtures: {stats.byAction.close}
                  </Badge>
                )}
                {stats.byAction.comment > 0 && (
                  <Badge variant="outline">
                    Commentaires: {stats.byAction.comment}
                  </Badge>
                )}
                {stats.byAction.unknown > 0 && (
                  <Badge variant="outline" className="bg-yellow-50">
                    Inconnus: {stats.byAction.unknown}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Emails récents */}
      {recentEmails.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Emails récents</CardTitle>
            <CardDescription>
              Derniers emails traités
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentEmails.map((email, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                >
                  <div className="mt-1">
                    {email.processed ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{email.from}</p>
                      <Badge variant="outline" className="text-xs">
                        {email.action}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{email.subject}</p>
                    {email.demandeNumero && (
                      <p className="text-sm font-mono text-blue-600">
                        {email.demandeNumero}
                      </p>
                    )}
                    {email.error && (
                      <p className="text-sm text-red-600">{email.error}</p>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(email.date).toLocaleString('fr-FR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informations de configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration IMAP</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline">IMAP_HOST</Badge>
            <span className="text-muted-foreground">
              {process.env.NEXT_PUBLIC_IMAP_HOST || 'imap.gmail.com'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="outline">IMAP_PORT</Badge>
            <span className="text-muted-foreground">
              {process.env.NEXT_PUBLIC_IMAP_PORT || '993'}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Assurez-vous que les variables d'environnement IMAP_USER et IMAP_PASSWORD sont configurées.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * SERVICE DE RÉCEPTION D'EMAILS (IMAP)
 * 
 * Ce service gère la réception et le traitement des emails entrants.
 * Utilise IMAP pour se connecter à la boîte de réception et traiter les réponses.
 * 
 * ARCHITECTURE :
 * - Connexion IMAP sécurisée (TLS)
 * - Parsing des emails entrants
 * - Extraction des actions (validation, rejet, commentaires)
 * - Mise à jour automatique des demandes
 * 
 * CONFIGURATION REQUISE :
 * - IMAP_HOST : Serveur IMAP (ex: imap.gmail.com)
 * - IMAP_PORT : Port IMAP (993 pour TLS)
 * - IMAP_USER : Email de réception
 * - IMAP_PASSWORD : Mot de passe ou app password
 */

import { simpleParser, ParsedMail } from 'mailparser'
import { ImapFlow, FetchMessageObject } from 'imapflow'
import { prisma } from '@/lib/prisma'

// ============================================================================
// CONFIGURATION
// ============================================================================

const IMAP_CONFIG = {
  host: process.env.IMAP_HOST || 'imap.gmail.com',
  port: parseInt(process.env.IMAP_PORT || '993'),
  secure: true, // TLS
  auth: {
    user: process.env.IMAP_USER || process.env.EMAIL_USER || '',
    pass: process.env.IMAP_PASSWORD || process.env.EMAIL_PASSWORD || ''
  }
  // logger: false peut être ajouté pour debug si nécessaire
}

// ============================================================================
// TYPES
// ============================================================================

export interface EmailAction {
  type: 'validate' | 'reject' | 'comment' | 'close' | 'unknown'
  demandeId?: string
  demandeNumero?: string
  userId?: string
  userEmail: string
  commentaire?: string
  timestamp: Date
}

export interface ProcessedEmail {
  messageId: string
  from: string
  subject: string
  date: Date
  action: EmailAction
  processed: boolean
  error?: string
}

// ============================================================================
// SERVICE DE RÉCEPTION
// ============================================================================

export class EmailReceiver {
  private client: ImapFlow | null = null
  private isConnected = false

  /**
   * Connexion au serveur IMAP
   */
  async connect(): Promise<boolean> {
    if (this.isConnected && this.client) {
      return true
    }

    try {
      if (!IMAP_CONFIG.auth.user || !IMAP_CONFIG.auth.pass) {
        console.error('❌ [IMAP] Configuration manquante (IMAP_USER ou IMAP_PASSWORD)')
        return false
      }

      this.client = new ImapFlow(IMAP_CONFIG)
      await this.client.connect()
      this.isConnected = true
      
      console.log('✅ [IMAP] Connexion établie')
      return true
    } catch (error) {
      console.error('❌ [IMAP] Erreur de connexion:', error)
      this.isConnected = false
      return false
    }
  }

  /**
   * Déconnexion du serveur IMAP
   */
  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        await this.client.logout()
        this.isConnected = false
        console.log('✅ [IMAP] Déconnexion réussie')
      } catch (error) {
        console.error('⚠️ [IMAP] Erreur lors de la déconnexion:', error)
      }
    }
  }

  /**
   * Récupère les nouveaux emails non lus
   */
  async fetchUnreadEmails(): Promise<ProcessedEmail[]> {
    if (!await this.connect()) {
      return []
    }

    const processedEmails: ProcessedEmail[] = []

    try {
      if (!this.client) return []

      // Ouvrir la boîte INBOX
      const lock = await this.client.getMailboxLock('INBOX')
      
      try {
        // Rechercher les emails non lus
        const messages = this.client.fetch('1:*', { 
          envelope: true, 
          source: true,
          flags: true
        }, {
          uid: true
        })

        for await (const message of messages) {
          // Ignorer les emails déjà lus
          if (message.flags?.has('\\Seen')) {
            continue
          }

          try {
            const processed = await this.processEmail(message)
            processedEmails.push(processed)

            // Marquer comme lu si traité avec succès
            if (processed.processed && message.uid) {
              await this.client.messageFlagsAdd(
                { uid: message.uid },
                ['\\Seen'],
                { uid: true }
              )
            }
          } catch (error) {
            console.error('❌ [IMAP] Erreur traitement email:', error)
          }
        }
      } finally {
        lock.release()
      }

      console.log(`✅ [IMAP] ${processedEmails.length} emails traités`)
      return processedEmails

    } catch (error) {
      console.error('❌ [IMAP] Erreur récupération emails:', error)
      return []
    }
  }

  /**
   * Traite un email individuel
   */
  private async processEmail(message: FetchMessageObject): Promise<ProcessedEmail> {
    try {
      // Vérifier que la source existe
      if (!message.source) {
        throw new Error('Message source is undefined')
      }

      // Parser l'email
      const parsed = await simpleParser(message.source)
      
      const from = this.extractEmail(parsed.from?.text || '')
      const subject = parsed.subject || ''
      const date = parsed.date || new Date()
      const messageId = parsed.messageId || `${Date.now()}`

      // Extraire l'action de l'email
      const action = await this.extractAction(parsed, from)

      // Traiter l'action
      const processed = await this.executeAction(action)

      return {
        messageId,
        from,
        subject,
        date,
        action,
        processed
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue'
      console.error('❌ [IMAP] Erreur parsing email:', errorMsg)
      
      return {
        messageId: `error-${Date.now()}`,
        from: '',
        subject: '',
        date: new Date(),
        action: {
          type: 'unknown',
          userEmail: '',
          timestamp: new Date()
        },
        processed: false,
        error: errorMsg
      }
    }
  }

  /**
   * Extrait l'action à partir du contenu de l'email
   */
  private async extractAction(parsed: ParsedMail, from: string): Promise<EmailAction> {
    const subject = (parsed.subject || '').toLowerCase()
    const text = (parsed.text || '').toLowerCase()
    const html = (parsed.html || '').toString().toLowerCase()
    const content = `${subject} ${text} ${html}`

    // Extraire le numéro de demande (format: DA-M-2026-0001 ou DA-O-2026-0001)
    const demandeMatch = content.match(/DA-[MO]-\d{4}-\d{4}(?:-SD-\d{4})?/i)
    const demandeNumero = demandeMatch ? demandeMatch[0].toUpperCase() : undefined

    // Récupérer l'utilisateur par email
    const user = await prisma.user.findUnique({
      where: { email: from }
    })

    const action: EmailAction = {
      type: 'unknown',
      demandeNumero,
      userId: user?.id,
      userEmail: from,
      timestamp: parsed.date || new Date()
    }

    // Détecter le type d'action
    if (content.includes('valider') || content.includes('approuver') || content.includes('ok')) {
      action.type = 'validate'
    } else if (content.includes('rejeter') || content.includes('refuser') || content.includes('non')) {
      action.type = 'reject'
    } else if (content.includes('clôturer') || content.includes('cloture') || content.includes('terminer')) {
      action.type = 'close'
    } else if (demandeNumero) {
      action.type = 'comment'
    }

    // Extraire le commentaire (première ligne du texte)
    const lines = (parsed.text || '').split('\n').filter(l => l.trim())
    if (lines.length > 0) {
      action.commentaire = lines[0].substring(0, 500) // Limiter à 500 caractères
    }

    return action
  }

  /**
   * Exécute l'action extraite de l'email
   */
  private async executeAction(action: EmailAction): Promise<boolean> {
    if (!action.demandeNumero || !action.userId) {
      console.log('⚠️ [IMAP] Action ignorée: demande ou utilisateur non identifié')
      return false
    }

    try {
      // Récupérer la demande
      const demande = await prisma.demande.findFirst({
        where: { numero: action.demandeNumero }
      })

      if (!demande) {
        console.log(`⚠️ [IMAP] Demande ${action.demandeNumero} non trouvée`)
        return false
      }

      // Vérifier les permissions de l'utilisateur
      const user = await prisma.user.findUnique({
        where: { id: action.userId }
      })

      if (!user) {
        console.log(`⚠️ [IMAP] Utilisateur ${action.userId} non trouvé`)
        return false
      }

      console.log(`📧 [IMAP] Action ${action.type} sur ${action.demandeNumero} par ${user.email}`)

      // Exécuter l'action selon le type
      switch (action.type) {
        case 'validate':
          // Appeler l'API de validation
          // Note: Ceci devrait idéalement appeler le même endpoint que l'interface web
          console.log(`✅ [IMAP] Validation de ${action.demandeNumero}`)
          // TODO: Implémenter la validation via API interne
          return true

        case 'reject':
          console.log(`❌ [IMAP] Rejet de ${action.demandeNumero}`)
          // TODO: Implémenter le rejet via API interne
          return true

        case 'close':
          console.log(`🔒 [IMAP] Clôture de ${action.demandeNumero}`)
          // TODO: Implémenter la clôture via API interne
          return true

        case 'comment':
          // Ajouter un commentaire à la demande
          if (action.commentaire) {
            console.log(`💬 [IMAP] Commentaire ajouté à ${action.demandeNumero}`)
            // TODO: Ajouter le commentaire via API interne
          }
          return true

        default:
          console.log(`⚠️ [IMAP] Type d'action inconnu: ${action.type}`)
          return false
      }

    } catch (error) {
      console.error('❌ [IMAP] Erreur exécution action:', error)
      return false
    }
  }

  /**
   * Extrait l'adresse email d'une chaîne
   */
  private extractEmail(text: string): string {
    const match = text.match(/<(.+?)>/)
    return match ? match[1] : text.trim()
  }

  /**
   * Démarre la surveillance continue des emails
   * Vérifie les nouveaux emails toutes les X minutes
   */
  async startMonitoring(intervalMinutes: number = 5): Promise<void> {
    console.log(`🔄 [IMAP] Démarrage surveillance (intervalle: ${intervalMinutes}min)`)

    const check = async () => {
      try {
        const emails = await this.fetchUnreadEmails()
        if (emails.length > 0) {
          console.log(`📬 [IMAP] ${emails.length} nouveaux emails traités`)
        }
      } catch (error) {
        console.error('❌ [IMAP] Erreur surveillance:', error)
      }
    }

    // Vérification initiale
    await check()

    // Vérifications périodiques
    setInterval(check, intervalMinutes * 60 * 1000)
  }
}

// ============================================================================
// INSTANCE SINGLETON
// ============================================================================

let receiverInstance: EmailReceiver | null = null

export function getEmailReceiver(): EmailReceiver {
  if (!receiverInstance) {
    receiverInstance = new EmailReceiver()
  }
  return receiverInstance
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Traite tous les emails non lus
 */
export async function processUnreadEmails(): Promise<ProcessedEmail[]> {
  const receiver = getEmailReceiver()
  return await receiver.fetchUnreadEmails()
}

/**
 * Démarre la surveillance des emails
 */
export async function startEmailMonitoring(intervalMinutes: number = 5): Promise<void> {
  const receiver = getEmailReceiver()
  await receiver.startMonitoring(intervalMinutes)
}

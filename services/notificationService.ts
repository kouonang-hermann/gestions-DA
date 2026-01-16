import { emailService } from './emailService'
import { whatsappService } from './whatsappService'
import type { User, Demande, DemandeStatus } from '@/types'
import crypto from 'crypto'

export interface NotificationTrigger {
  demandeId: string
  oldStatus?: DemandeStatus
  newStatus: DemandeStatus
  userId?: string
  action: 'status_change' | 'validation_request' | 'closure_request'
}

// Configuration des canaux de notification (depuis variables d'environnement)
const getNotificationChannels = () => ({
  email: process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'false', // Activé par défaut
  whatsapp: process.env.ENABLE_WHATSAPP_NOTIFICATIONS === 'true' // Désactivé par défaut
})

export class NotificationService {
  private static instance: NotificationService

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  /**
   * Traite un changement de statut et envoie les notifications appropriées
   * Envoie sur les deux canaux : Email + WhatsApp (si activés)
   */
  async handleStatusChange(
    demande: Demande,
    oldStatus: DemandeStatus,
    newStatus: DemandeStatus,
    users: User[]
  ): Promise<void> {
    try {
      const channels = getNotificationChannels()
      console.log(`📬 Traitement notifications: ${oldStatus} -> ${newStatus} pour ${demande.numero}`)
      console.log(`📧 Email: ${channels.email ? 'activé' : 'désactivé'} | 📱 WhatsApp: ${channels.whatsapp ? 'activé' : 'désactivé'}`)

      // 1. Notification au demandeur du changement de statut
      const requester = users.find(u => u.id === demande.technicienId)
      if (requester) {
        // Email
        if (channels.email && requester.email) {
          await emailService.notifyStatusUpdate(requester, demande, oldStatus, newStatus)
        }
        // WhatsApp
        if (channels.whatsapp && requester.phone) {
          await whatsappService.notifyStatusUpdate(requester, demande, oldStatus, newStatus)
        }
      }

      // 2. Notifications spécifiques selon le nouveau statut
      await this.handleSpecificStatusNotifications(demande, newStatus, users)

    } catch (error) {
      console.error('❌ Erreur lors du traitement des notifications:', error)
    }
  }

  /**
   * Gère les notifications spécifiques selon le statut
   * Envoie sur Email + WhatsApp selon la configuration
   */
  private async handleSpecificStatusNotifications(
    demande: Demande,
    status: DemandeStatus,
    users: User[]
  ): Promise<void> {
    const channels = getNotificationChannels()
    const requester = users.find(u => u.id === demande.technicienId)

    switch (status) {
      case 'en_attente_validation_conducteur':
        await this.notifyValidators(demande, users, ['conducteur_travaux'], requester)
        break

      case 'en_attente_validation_logistique':
        await this.notifyValidators(demande, users, ['responsable_logistique'], requester)
        break

      case 'en_attente_validation_responsable_travaux':
        await this.notifyValidators(demande, users, ['responsable_travaux'], requester)
        break

      case 'en_attente_validation_charge_affaire':
        await this.notifyValidators(demande, users, ['charge_affaire'], requester)
        break

      case 'en_attente_preparation_appro':
        await this.notifyValidators(demande, users, ['responsable_appro'], requester)
        break

      case 'en_attente_reception_livreur':
        // Notification envoyée directement par l'API lors de l'assignation
        break

      case 'en_attente_livraison':
        // Le livreur a confirmé la réception, pas besoin de notification supplémentaire
        break

      case 'en_attente_validation_logistique':
        await this.notifyValidators(demande, users, ['responsable_logistique'], requester)
        break

      case 'en_attente_validation_finale_demandeur':
        // Notification au demandeur pour clôture (Email + WhatsApp)
        if (requester) {
          if (channels.email && requester.email) {
            await emailService.notifyClosureRequest(requester, demande)
          }
          if (channels.whatsapp && requester.phone) {
            await whatsappService.notifyClosureRequest(requester, demande)
          }
        }
        break

      case 'confirmee_demandeur':
      case 'cloturee':
        // Notification de clôture aux parties prenantes
        await this.notifyStakeholdersOfClosure(demande, users)
        break

      case 'rejetee':
        // Notification de rejet au demandeur (Email + WhatsApp)
        if (requester) {
          await this.notifyRejection(requester, demande)
        }
        break
    }
  }

  /**
   * Notifie les validateurs appropriés (Email + WhatsApp)
   */
  private async notifyValidators(
    demande: Demande,
    users: User[],
    validatorRoles: string[],
    requester?: User
  ): Promise<void> {
    if (!requester) return

    const channels = getNotificationChannels()

    // Trouver les utilisateurs avec les rôles de validation appropriés
    // Inclure ceux qui ont email OU téléphone
    const validators = users.filter(user => 
      validatorRoles.includes(user.role) && 
      (user.email || user.phone) &&
      user.id !== requester.id // Ne pas notifier le demandeur lui-même
    )

    // Si c'est lié à un projet, ne notifier que les validateurs du projet
    let targetValidators = validators
    if (demande.projetId) {
      const projectValidators = validators.filter(validator =>
        validator.projets?.includes(demande.projetId)
      )
      
      if (projectValidators.length > 0) {
        targetValidators = projectValidators
      }
    }

    // Envoyer les notifications sur les deux canaux
    for (const validator of targetValidators) {
      // Email
      if (channels.email && validator.email) {
        await emailService.notifyValidationRequest(validator, demande, requester)
      }
      // WhatsApp
      if (channels.whatsapp && validator.phone) {
        await whatsappService.notifyValidationRequest(validator, demande, requester)
      }
    }
  }

  /**
   * Notifie les parties prenantes de la clôture
   */
  private async notifyStakeholdersOfClosure(
    demande: Demande,
    users: User[]
  ): Promise<void> {
    // Notifier les administrateurs et superviseurs
    const stakeholders = users.filter(user =>
      ['admin', 'super_admin'].includes(user.role) &&
      user.email
    )

    const requester = users.find(u => u.id === demande.technicienId)
    if (!requester) return

    for (const stakeholder of stakeholders) {
      await emailService.notifyStatusUpdate(
        stakeholder,
        demande,
        'en_attente_validation_finale_demandeur',
        'cloturee'
      )
    }
  }

  /**
   * Notifie le rejet d'une demande (Email + WhatsApp)
   */
  private async notifyRejection(requester: User, demande: Demande): Promise<void> {
    const channels = getNotificationChannels()
    
    // Email
    if (channels.email && requester.email) {
      await emailService.notifyStatusUpdate(
        requester,
        demande,
        'en_attente_validation_conducteur', // Statut générique
        'rejetee'
      )
    }
    
    // WhatsApp
    if (channels.whatsapp && requester.phone) {
      await whatsappService.notifyRejection(requester, demande, demande.rejetMotif)
    }
  }

  /**
   * Envoie des rappels pour les demandes en attente
   */
  async sendReminders(users: User[], demandes: Demande[]): Promise<void> {
    const now = new Date()
    const reminderThreshold = 24 * 60 * 60 * 1000 // 24 heures en millisecondes

    for (const demande of demandes) {
      // Vérifier si la demande est en attente depuis plus de 24h
      const lastUpdate = new Date(demande.dateModification)
      const timeDiff = now.getTime() - lastUpdate.getTime()

      if (timeDiff > reminderThreshold) {
        await this.sendReminderForDemande(demande, users)
      }
    }
  }

  /**
   * Envoie un rappel pour une demande spécifique (Email + WhatsApp)
   */
  private async sendReminderForDemande(demande: Demande, users: User[]): Promise<void> {
    const channels = getNotificationChannels()
    const requester = users.find(u => u.id === demande.technicienId)
    if (!requester) return

    // Déterminer qui doit recevoir le rappel selon le statut
    // Inclure ceux qui ont email OU téléphone
    let reminderRecipients: User[] = []
    let actionLabel = 'Validation requise'

    switch (demande.status) {
      case 'en_attente_validation_conducteur':
        reminderRecipients = users.filter(u => u.role === 'conducteur_travaux' && (u.email || u.phone))
        actionLabel = 'Validation conducteur'
        break
      case 'en_attente_validation_logistique':
        reminderRecipients = users.filter(u => u.role === 'responsable_logistique' && (u.email || u.phone))
        actionLabel = 'Validation Logistique'
        break
      case 'en_attente_validation_responsable_travaux':
        reminderRecipients = users.filter(u => u.role === 'responsable_travaux' && (u.email || u.phone))
        actionLabel = 'Validation resp. travaux'
        break
      case 'en_attente_validation_charge_affaire':
        reminderRecipients = users.filter(u => u.role === 'charge_affaire' && (u.email || u.phone))
        actionLabel = 'Validation chargé affaire'
        break
      case 'en_attente_preparation_appro':
        reminderRecipients = users.filter(u => u.role === 'responsable_appro' && (u.email || u.phone))
        actionLabel = 'Préparation appro'
        break
      case 'en_attente_validation_logistique':
        reminderRecipients = users.filter(u => u.role === 'responsable_logistique' && (u.email || u.phone))
        actionLabel = 'Validation logistique'
        break
      case 'en_attente_validation_finale_demandeur':
        reminderRecipients = [requester]
        actionLabel = 'Clôture de la demande'
        break
    }

    // Envoyer les rappels sur les deux canaux
    for (const recipient of reminderRecipients) {
      // Email
      if (channels.email && recipient.email) {
        if (demande.status === 'en_attente_validation_finale_demandeur') {
          await emailService.notifyClosureRequest(recipient, demande)
        } else {
          await emailService.notifyValidationRequest(recipient, demande, requester)
        }
      }
      
      // WhatsApp
      if (channels.whatsapp && recipient.phone) {
        await whatsappService.notifyReminder(recipient, demande, actionLabel)
      }
    }
  }

  /**
   * Notifie le livreur assigné qu'il doit récupérer le matériel
   */
  async notifyLivreurAssigne(demandeId: string, livreurId: string, approId: string): Promise<void> {
    try {
      const channels = getNotificationChannels()
      console.log(`📬 Notification livreur assigné pour demande ${demandeId}`)

      // Récupérer les informations nécessaires depuis la base de données
      const { prisma } = await import('@/lib/prisma')
      
      const demande = await prisma.demande.findUnique({
        where: { id: demandeId },
        include: {
          projet: true,
          technicien: true,
          livreurAssigne: {
            include: {
              projets: {
                include: {
                  projet: true
                }
              }
            }
          }
        }
      })

      if (!demande || !demande.livreurAssigne) {
        console.error('❌ Demande ou livreur non trouvé')
        return
      }

      // Transformer les données Prisma en type User
      const livreur: any = {
        ...demande.livreurAssigne,
        projets: demande.livreurAssigne.projets.map(up => up.projet.id)
      }

      const titre = `📦 Nouvelle livraison assignée`
      const message = `Vous avez été assigné pour livrer la demande ${demande.numero} du projet ${demande.projet?.nom}. Veuillez confirmer la réception du matériel.`

      // Créer la notification dans la base de données
      await prisma.notification.create({
        data: {
          id: crypto.randomUUID(),
          userId: livreurId,
          titre,
          message,
          demandeId,
          lu: false
        }
      })

      // Email
      if (channels.email && livreur.email) {
        await emailService.notifyLivreurAssigne(livreur, demande as any)
      }

      // WhatsApp
      if (channels.whatsapp && livreur.phone) {
        await whatsappService.notifyLivreurAssigne(livreur, demande as any)
      }

      console.log(`✅ Notification envoyée au livreur ${livreur.prenom} ${livreur.nom}`)
    } catch (error) {
      console.error('❌ Erreur lors de la notification du livreur:', error)
    }
  }

  /**
   * Notifie le changement de statut d'une demande
   */
  async notifyDemandeStatusChange(
    demandeId: string,
    userId: string,
    oldStatus: DemandeStatus,
    newStatus: DemandeStatus,
    actionUserId: string
  ): Promise<void> {
    try {
      const channels = getNotificationChannels()
      console.log(`📬 Notification changement de statut: ${oldStatus} -> ${newStatus}`)

      const { prisma } = await import('@/lib/prisma')
      
      const demande = await prisma.demande.findUnique({
        where: { id: demandeId },
        include: {
          projet: true,
          technicien: true,
          items: true,
          validationSignatures: true
        }
      })

      const userData = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          projets: {
            include: {
              projet: true
            }
          }
        }
      })

      if (!demande || !userData) {
        console.error('❌ Demande ou utilisateur non trouvé')
        return
      }

      // Transformer les données Prisma en type User
      const user: any = {
        ...userData,
        projets: userData.projets.map(up => up.projet.id)
      }

      const statusLabels: Record<DemandeStatus, string> = {
        brouillon: "Brouillon",
        soumise: "Soumise",
        en_attente_validation_conducteur: "En attente validation conducteur",
        en_attente_validation_logistique: "En attente validation logistique",
        en_attente_validation_responsable_travaux: "En attente validation responsable travaux",
        en_attente_validation_charge_affaire: "En attente validation chargé d'affaire",
        en_attente_preparation_appro: "En attente préparation appro",
        en_attente_preparation_logistique: "En attente préparation logistique",
        en_attente_validation_logistique_finale: "En attente validation logistique finale",
        en_attente_reception_livreur: "En attente réception livreur",
        en_attente_livraison: "En attente livraison",
        en_attente_validation_finale_demandeur: "En attente validation finale",
        en_attente_validation_qhse: "En attente validation QHSE",
        en_attente_validation_reception_demandeur: "En attente validation réception",
        renvoyee_vers_appro: "Renvoyée vers appro",
        cloturee_partiellement: "Clôturée partiellement",
        confirmee_demandeur: "Confirmée par le demandeur",
        cloturee: "Clôturée",
        rejetee: "Rejetée",
        archivee: "Archivée"
      }

      const titre = `📋 Mise à jour de votre demande ${demande.numero}`
      const message = `Votre demande est maintenant : ${statusLabels[newStatus]}`

      // Créer la notification dans la base de données
      await prisma.notification.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          titre,
          message,
          demandeId,
          lu: false
        }
      })

      // Email
      if (channels.email && user.email) {
        await emailService.notifyStatusUpdate(user, demande as any, oldStatus, newStatus)
      }

      // WhatsApp
      if (channels.whatsapp && user.phone) {
        await whatsappService.notifyStatusUpdate(user, demande as any, oldStatus, newStatus)
      }

      console.log(`✅ Notification envoyée à ${user.prenom} ${user.nom}`)
    } catch (error) {
      console.error('❌ Erreur lors de la notification de changement de statut:', error)
    }
  }

  /**
   * Planifie l'envoi de rappels automatiques
   */
  startReminderScheduler(users: User[], demandes: Demande[]): void {
    // Envoyer des rappels toutes les heures
    setInterval(async () => {
      await this.sendReminders(users, demandes)
    }, 60 * 60 * 1000) // 1 heure
  }
}

// Export de l'instance singleton
export const notificationService = NotificationService.getInstance()

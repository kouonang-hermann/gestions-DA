import { emailService } from './emailService'
import type { User, Demande, DemandeStatus } from '@/types'

export interface NotificationTrigger {
  demandeId: string
  oldStatus?: DemandeStatus
  newStatus: DemandeStatus
  userId?: string
  action: 'status_change' | 'validation_request' | 'closure_request'
}

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
   */
  async handleStatusChange(
    demande: Demande,
    oldStatus: DemandeStatus,
    newStatus: DemandeStatus,
    users: User[]
  ): Promise<void> {
    try {
      console.log(`Traitement changement de statut: ${oldStatus} -> ${newStatus} pour demande ${demande.numero}`)

      // 1. Notification au demandeur du changement de statut
      const requester = users.find(u => u.id === demande.technicienId)
      if (requester?.email) {
        await emailService.notifyStatusUpdate(requester, demande, oldStatus, newStatus)
      }

      // 2. Notifications spécifiques selon le nouveau statut
      await this.handleSpecificStatusNotifications(demande, newStatus, users)

    } catch (error) {
      console.error('Erreur lors du traitement des notifications:', error)
    }
  }

  /**
   * Gère les notifications spécifiques selon le statut
   */
  private async handleSpecificStatusNotifications(
    demande: Demande,
    status: DemandeStatus,
    users: User[]
  ): Promise<void> {
    const requester = users.find(u => u.id === demande.technicienId)

    switch (status) {
      case 'en_attente_validation_conducteur':
        await this.notifyValidators(demande, users, ['conducteur_travaux'], requester)
        break

      case 'en_attente_validation_qhse':
        await this.notifyValidators(demande, users, ['responsable_qhse'], requester)
        break

      case 'en_attente_validation_responsable_travaux':
        await this.notifyValidators(demande, users, ['responsable_travaux'], requester)
        break

      case 'en_attente_validation_charge_affaire':
        await this.notifyValidators(demande, users, ['charge_affaire'], requester)
        break

      case 'en_attente_preparation_appro':
        await this.notifyValidators(demande, users, ['approvisionneur'], requester)
        break

      case 'en_attente_validation_logistique':
        await this.notifyValidators(demande, users, ['logisticien'], requester)
        break

      case 'en_attente_validation_finale_demandeur':
        // Notification au demandeur pour clôture
        if (requester?.email) {
          await emailService.notifyClosureRequest(requester, demande)
        }
        break

      case 'confirmee_demandeur':
      case 'cloturee':
        // Notification de clôture aux parties prenantes
        await this.notifyStakeholdersOfClosure(demande, users)
        break

      case 'rejetee':
        // Notification de rejet au demandeur
        if (requester?.email) {
          await this.notifyRejection(requester, demande)
        }
        break
    }
  }

  /**
   * Notifie les validateurs appropriés
   */
  private async notifyValidators(
    demande: Demande,
    users: User[],
    validatorRoles: string[],
    requester?: User
  ): Promise<void> {
    if (!requester) return

    // Trouver les utilisateurs avec les rôles de validation appropriés
    const validators = users.filter(user => 
      validatorRoles.includes(user.role) && 
      user.email &&
      user.id !== requester.id // Ne pas notifier le demandeur lui-même
    )

    // Si c'est lié à un projet, ne notifier que les validateurs du projet
    if (demande.projetId) {
      const projectValidators = validators.filter(validator =>
        validator.projets?.includes(demande.projetId)
      )
      
      if (projectValidators.length > 0) {
        // Utiliser les validateurs du projet
        for (const validator of projectValidators) {
          await emailService.notifyValidationRequest(validator, demande, requester)
        }
        return
      }
    }

    // Sinon, notifier tous les validateurs avec le bon rôle
    for (const validator of validators) {
      await emailService.notifyValidationRequest(validator, demande, requester)
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
   * Notifie le rejet d'une demande
   */
  private async notifyRejection(requester: User, demande: Demande): Promise<void> {
    // Utiliser le template de mise à jour de statut pour le rejet
    await emailService.notifyStatusUpdate(
      requester,
      demande,
      'en_attente_validation_conducteur', // Statut générique
      'rejetee'
    )
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
   * Envoie un rappel pour une demande spécifique
   */
  private async sendReminderForDemande(demande: Demande, users: User[]): Promise<void> {
    const requester = users.find(u => u.id === demande.technicienId)
    if (!requester) return

    // Déterminer qui doit recevoir le rappel selon le statut
    let reminderRecipients: User[] = []

    switch (demande.status) {
      case 'en_attente_validation_conducteur':
        reminderRecipients = users.filter(u => u.role === 'conducteur_travaux' && u.email)
        break
      case 'en_attente_validation_qhse':
        reminderRecipients = users.filter(u => u.role === 'responsable_qhse' && u.email)
        break
      case 'en_attente_validation_responsable_travaux':
        reminderRecipients = users.filter(u => u.role === 'responsable_travaux' && u.email)
        break
      case 'en_attente_validation_charge_affaire':
        reminderRecipients = users.filter(u => u.role === 'charge_affaire' && u.email)
        break
      case 'en_attente_validation_finale_demandeur':
        reminderRecipients = [requester]
        break
    }

    // Envoyer les rappels
    for (const recipient of reminderRecipients) {
      if (recipient.email) {
        if (demande.status === 'en_attente_validation_finale_demandeur') {
          await emailService.notifyClosureRequest(recipient, demande)
        } else {
          await emailService.notifyValidationRequest(recipient, demande, requester)
        }
      }
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

import { useCallback } from 'react'
import { notificationService } from '@/services/notificationService'
import type { User, Demande, DemandeStatus } from '@/types'

export interface UseNotificationsReturn {
  notifyStatusChange: (
    demande: Demande,
    oldStatus: DemandeStatus,
    newStatus: DemandeStatus,
    users: User[]
  ) => Promise<void>
  notifyValidationRequest: (
    validator: User,
    demande: Demande,
    requester: User
  ) => Promise<void>
  notifyClosureRequest: (
    requester: User,
    demande: Demande
  ) => Promise<void>
}

/**
 * Hook personnalisé pour gérer les notifications par email
 */
export const useNotifications = (): UseNotificationsReturn => {
  
  const notifyStatusChange = useCallback(async (
    demande: Demande,
    oldStatus: DemandeStatus,
    newStatus: DemandeStatus,
    users: User[]
  ) => {
    try {
      await notificationService.handleStatusChange(demande, oldStatus, newStatus, users)
      console.log(`Notifications envoyées pour le changement de statut: ${oldStatus} -> ${newStatus}`)
    } catch (error) {
      console.error('Erreur lors de l\'envoi des notifications:', error)
    }
  }, [])

  const notifyValidationRequest = useCallback(async (
    validator: User,
    demande: Demande,
    requester: User
  ) => {
    try {
      const { emailService } = await import('@/services/emailService')
      await emailService.notifyValidationRequest(validator, demande, requester)
      console.log(`Notification de validation envoyée à ${validator.email}`)
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification de validation:', error)
    }
  }, [])

  const notifyClosureRequest = useCallback(async (
    requester: User,
    demande: Demande
  ) => {
    try {
      const { emailService } = await import('@/services/emailService')
      await emailService.notifyClosureRequest(requester, demande)
      console.log(`Notification de clôture envoyée à ${requester.email}`)
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification de clôture:', error)
    }
  }, [])

  return {
    notifyStatusChange,
    notifyValidationRequest,
    notifyClosureRequest
  }
}

/**
 * Fonction utilitaire pour déclencher les notifications lors des changements de statut
 * Peut être utilisée directement dans les composants ou les actions du store
 */
export const triggerStatusChangeNotifications = async (
  demandeId: string,
  oldStatus: DemandeStatus,
  newStatus: DemandeStatus,
  users: User[],
  demandes: Demande[]
) => {
  const demande = demandes.find(d => d.id === demandeId)
  if (!demande) {
    console.warn(`Demande ${demandeId} non trouvée pour les notifications`)
    return
  }

  try {
    await notificationService.handleStatusChange(demande, oldStatus, newStatus, users)
  } catch (error) {
    console.error('Erreur lors du déclenchement des notifications:', error)
  }
}

/**
 * Fonction pour envoyer des rappels automatiques
 */
export const sendAutomaticReminders = async (users: User[], demandes: Demande[]) => {
  try {
    await notificationService.sendReminders(users, demandes)
    console.log('Rappels automatiques envoyés')
  } catch (error) {
    console.error('Erreur lors de l\'envoi des rappels:', error)
  }
}

/**
 * Configuration des déclencheurs automatiques de notifications
 */
export const setupNotificationTriggers = (users: User[], demandes: Demande[]) => {
  // Démarrer le planificateur de rappels (toutes les heures)
  notificationService.startReminderScheduler(users, demandes)
  
  console.log('Système de notifications configuré et démarré')
}

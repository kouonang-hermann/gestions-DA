import type { User, Demande } from "@/types"

export interface WhatsAppNotification {
  to: string // Numéro de téléphone au format international (+33...)
  message: string
  type: 'validation_request' | 'closure_request' | 'status_update' | 'reminder'
}

export class WhatsAppService {
  private static instance: WhatsAppService
  private apiEndpoint: string

  private constructor() {
    // Utiliser une URL absolue pour les appels côté serveur
    this.apiEndpoint = process.env.NEXT_PUBLIC_APP_URL 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/notifications/whatsapp`
      : 'http://localhost:3000/api/notifications/whatsapp'
  }

  public static getInstance(): WhatsAppService {
    if (!WhatsAppService.instance) {
      WhatsAppService.instance = new WhatsAppService()
    }
    return WhatsAppService.instance
  }

  /**
   * Formate le numéro de téléphone au format international
   */
  private formatPhoneNumber(phone: string): string {
    // Supprimer les espaces et caractères spéciaux
    let cleaned = phone.replace(/[\s\-\.\(\)]/g, '')
    
    // Si le numéro commence par 0, le remplacer par +33 (France)
    if (cleaned.startsWith('0')) {
      cleaned = '+33' + cleaned.substring(1)
    }
    
    // S'assurer que le numéro commence par +
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned
    }
    
    return cleaned
  }

  /**
   * Envoie une notification WhatsApp
   */
  async sendWhatsApp(notification: WhatsAppNotification): Promise<boolean> {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...notification,
          to: this.formatPhoneNumber(notification.to)
        }),
      })

      // Vérifier si la réponse est OK avant de parser le JSON
      if (!response.ok) {
        const text = await response.text()
        console.error(`❌ [WHATSAPP] Erreur HTTP ${response.status}:`, text.substring(0, 200))
        return false
      }

      const result = await response.json()
      
      if (result.success) {
        console.log(`✅ [WhatsApp] Message envoyé à ${notification.to}`)
      } else {
        console.warn(`⚠️ [WhatsApp] Échec envoi à ${notification.to}:`, result.error)
      }
      
      return result.success
    } catch (error) {
      console.error('❌ [WhatsApp] Erreur lors de l\'envoi:', error)
      return false
    }
  }

  /**
   * Notification de demande de validation
   */
  async notifyValidationRequest(validator: User, demande: Demande, requester: User): Promise<boolean> {
    if (!validator.phone) {
      console.log(`📱 [WhatsApp] Pas de numéro pour ${validator.nom} - notification ignorée`)
      return false
    }

    const message = `🔔 *Demande de Validation*

Bonjour ${validator.prenom},

Une nouvelle demande nécessite votre validation :

📋 *${demande.numero}*
• Type : ${demande.type === 'materiel' ? 'Matériel' : 'Outillage'}
• Demandeur : ${requester.nom} ${requester.prenom}
• Projet : ${demande.projet?.nom || 'Non défini'}
• Articles : ${demande.items?.length || 0}

👉 Connectez-vous pour valider cette demande.

_Système de Gestion des Demandes_`

    return this.sendWhatsApp({
      to: validator.phone,
      message,
      type: 'validation_request'
    })
  }

  /**
   * Notification de demande de clôture
   */
  async notifyClosureRequest(requester: User, demande: Demande): Promise<boolean> {
    if (!requester.phone) {
      console.log(`📱 [WhatsApp] Pas de numéro pour ${requester.nom} - notification ignorée`)
      return false
    }

    const message = `✅ *Demande Prête pour Clôture*

Bonjour ${requester.prenom},

Votre demande a été traitée et est prête à être clôturée :

📋 *${demande.numero}*
• Type : ${demande.type === 'materiel' ? 'Matériel' : 'Outillage'}
• Projet : ${demande.projet?.nom || 'Non défini'}
• Articles : ${demande.items?.length || 0}

👉 Connectez-vous pour confirmer la réception et clôturer.

_Système de Gestion des Demandes_`

    return this.sendWhatsApp({
      to: requester.phone,
      message,
      type: 'closure_request'
    })
  }

  /**
   * Notification de changement de statut
   */
  async notifyStatusUpdate(user: User, demande: Demande, oldStatus: string, newStatus: string): Promise<boolean> {
    if (!user.phone) {
      console.log(`📱 [WhatsApp] Pas de numéro pour ${user.nom} - notification ignorée`)
      return false
    }

    const message = `📋 *Mise à Jour de Statut*

Bonjour ${user.prenom},

Le statut de votre demande a changé :

📋 *${demande.numero}*
• Projet : ${demande.projet?.nom || 'Non défini'}

🔄 *Changement :*
${this.getStatusLabel(oldStatus)} → ${this.getStatusLabel(newStatus)}

👉 Connectez-vous pour plus de détails.

_Système de Gestion des Demandes_`

    return this.sendWhatsApp({
      to: user.phone,
      message,
      type: 'status_update'
    })
  }

  /**
   * Notification de rappel
   */
  async notifyReminder(user: User, demande: Demande, action: string): Promise<boolean> {
    if (!user.phone) return false

    const message = `⏰ *Rappel*

Bonjour ${user.prenom},

Une demande attend votre action depuis plus de 24h :

📋 *${demande.numero}*
• Action requise : ${action}
• Projet : ${demande.projet?.nom || 'Non défini'}

👉 Merci de traiter cette demande rapidement.

_Système de Gestion des Demandes_`

    return this.sendWhatsApp({
      to: user.phone,
      message,
      type: 'reminder'
    })
  }

  /**
   * Notification de rejet
   */
  async notifyRejection(user: User, demande: Demande, motif?: string): Promise<boolean> {
    if (!user.phone) return false

    const message = `❌ *Demande Rejetée*

Bonjour ${user.prenom},

Votre demande a été rejetée :

📋 *${demande.numero}*
• Projet : ${demande.projet?.nom || 'Non défini'}
${motif ? `• Motif : ${motif}` : ''}

👉 Connectez-vous pour plus de détails ou créer une nouvelle demande.

_Système de Gestion des Demandes_`

    return this.sendWhatsApp({
      to: user.phone,
      message,
      type: 'status_update'
    })
  }

  /**
   * Notification d'assignation de livraison
   */
  async notifyLivreurAssigne(livreur: User, demande: Demande): Promise<boolean> {
    if (!livreur.phone) {
      console.log(`📱 [WhatsApp] Pas de numéro pour ${livreur.nom} - notification ignorée`)
      return false
    }

    const message = `📦 *Nouvelle Livraison Assignée*

Bonjour ${livreur.prenom},

Vous avez été assigné pour effectuer la livraison :

📋 *${demande.numero}*
• Type : ${demande.type === 'materiel' ? 'Matériel' : 'Outillage'}
• Projet : ${demande.projet?.nom || 'Non défini'}
• Articles : ${demande.items?.length || 0}

*Prochaines étapes :*
1️⃣ Récupérer le matériel auprès du responsable appro
2️⃣ Confirmer la réception dans le système
3️⃣ Livrer au demandeur
4️⃣ Confirmer la livraison dans le système

👉 Connectez-vous pour gérer cette livraison.

_Système de Gestion des Demandes_`

    return this.sendWhatsApp({
      to: livreur.phone,
      message,
      type: 'validation_request'
    })
  }

  /**
   * Convertit un statut en libellé lisible avec emoji
   */
  private getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'brouillon': '📝 Brouillon',
      'soumise': '📤 Soumise',
      'en_attente_validation_conducteur': '⏳ Attente conducteur',
      'en_attente_validation_qhse': '⏳ Attente QHSE',
      'en_attente_validation_responsable_travaux': '⏳ Attente resp. travaux',
      'en_attente_validation_charge_affaire': '⏳ Attente chargé affaire',
      'en_attente_preparation_appro': '📦 Préparation appro',
      'en_attente_validation_logistique': '🚚 Attente logistique',
      'en_attente_validation_finale_demandeur': '✋ Attente clôture',
      'confirmee_demandeur': '✅ Confirmée',
      'cloturee': '🔒 Clôturée',
      'rejetee': '❌ Rejetée',
      'archivee': '📁 Archivée'
    }
    
    return statusLabels[status] || status
  }
}

// Export de l'instance singleton
export const whatsappService = WhatsAppService.getInstance()

import type { User, Demande } from "@/types"

export interface EmailNotification {
  to: string
  subject: string
  html: string
  type: 'validation_request' | 'closure_request' | 'status_update' | 'reminder'
}

export class EmailService {
  private static instance: EmailService
  private apiEndpoint = '/api/notifications/email'

  private constructor() {}

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService()
    }
    return EmailService.instance
  }

  /**
   * Envoie une notification par email
   */
  async sendEmail(notification: EmailNotification): Promise<boolean> {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notification),
      })

      const result = await response.json()
      return result.success
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error)
      return false
    }
  }

  /**
   * Notification de demande de validation
   */
  async notifyValidationRequest(validator: User, demande: Demande, requester: User): Promise<boolean> {
    const subject = `🔔 Demande de validation - ${demande.numero}`
    
    const html = this.generateValidationRequestTemplate({
      validatorName: validator.nom,
      requesterName: requester.nom,
      demandeNumber: demande.numero,
      demandeType: demande.type === 'materiel' ? 'Matériel' : 'Outillage',
      itemsCount: demande.items?.length || 0,
      projectName: demande.projet?.nom || 'Projet non défini',
      validationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/demandes/${demande.id}/validate`,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
    })

    return this.sendEmail({
      to: validator.email,
      subject,
      html,
      type: 'validation_request'
    })
  }

  /**
   * Notification de demande de clôture
   */
  async notifyClosureRequest(requester: User, demande: Demande): Promise<boolean> {
    const subject = `✅ Demande prête pour clôture - ${demande.numero}`
    
    const html = this.generateClosureRequestTemplate({
      requesterName: requester.nom,
      demandeNumber: demande.numero,
      demandeType: demande.type === 'materiel' ? 'Matériel' : 'Outillage',
      itemsCount: demande.items?.length || 0,
      projectName: demande.projet?.nom || 'Projet non défini',
      closureUrl: `${process.env.NEXT_PUBLIC_APP_URL}/demandes/${demande.id}/close`,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
    })

    return this.sendEmail({
      to: requester.email,
      subject,
      html,
      type: 'closure_request'
    })
  }

  /**
   * Notification de changement de statut
   */
  async notifyStatusUpdate(user: User, demande: Demande, oldStatus: string, newStatus: string): Promise<boolean> {
    const subject = `📋 Mise à jour de statut - ${demande.numero}`
    
    const html = this.generateStatusUpdateTemplate({
      userName: user.nom,
      demandeNumber: demande.numero,
      demandeType: demande.type === 'materiel' ? 'Matériel' : 'Outillage',
      oldStatus: this.getStatusLabel(oldStatus),
      newStatus: this.getStatusLabel(newStatus),
      projectName: demande.projet?.nom || 'Projet non défini',
      viewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/demandes/${demande.id}`,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
    })

    return this.sendEmail({
      to: user.email,
      subject,
      html,
      type: 'status_update'
    })
  }

  /**
   * Template pour demande de validation
   */
  private generateValidationRequestTemplate(data: {
    validatorName: string
    requesterName: string
    demandeNumber: string
    demandeType: string
    itemsCount: number
    projectName: string
    validationUrl: string
    dashboardUrl: string
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Demande de validation</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #015fc4; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background-color: #015fc4; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
          .button:hover { background-color: #014a9b; }
          .info-box { background-color: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #015fc4; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 Demande de Validation</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${data.validatorName}</strong>,</p>
            
            <p>Une nouvelle demande nécessite votre validation :</p>
            
            <div class="info-box">
              <h3>📋 Détails de la demande</h3>
              <ul>
                <li><strong>Numéro :</strong> ${data.demandeNumber}</li>
                <li><strong>Type :</strong> ${data.demandeType}</li>
                <li><strong>Demandeur :</strong> ${data.requesterName}</li>
                <li><strong>Projet :</strong> ${data.projectName}</li>
                <li><strong>Nombre d'articles :</strong> ${data.itemsCount}</li>
              </ul>
            </div>
            
            <p>Veuillez examiner cette demande et procéder à la validation si elle est conforme.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.validationUrl}" class="button">✅ Valider la demande</a>
              <a href="${data.dashboardUrl}" class="button" style="background-color: #6b7280;">📊 Voir le tableau de bord</a>
            </div>
            
            <p><em>Cette notification a été générée automatiquement par le système de gestion des demandes matériel.</em></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Système de Gestion des Demandes Matériel</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Template pour demande de clôture
   */
  private generateClosureRequestTemplate(data: {
    requesterName: string
    demandeNumber: string
    demandeType: string
    itemsCount: number
    projectName: string
    closureUrl: string
    dashboardUrl: string
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Demande prête pour clôture</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #16a34a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
          .button:hover { background-color: #15803d; }
          .info-box { background-color: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #16a34a; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Demande Prête pour Clôture</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${data.requesterName}</strong>,</p>
            
            <p>Votre demande a été traitée et est maintenant prête pour clôture :</p>
            
            <div class="info-box">
              <h3>📋 Détails de la demande</h3>
              <ul>
                <li><strong>Numéro :</strong> ${data.demandeNumber}</li>
                <li><strong>Type :</strong> ${data.demandeType}</li>
                <li><strong>Projet :</strong> ${data.projectName}</li>
                <li><strong>Nombre d'articles :</strong> ${data.itemsCount}</li>
              </ul>
            </div>
            
            <p>Veuillez vérifier que vous avez bien reçu tous les éléments demandés et procéder à la clôture de la demande.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.closureUrl}" class="button">🔒 Clôturer la demande</a>
              <a href="${data.dashboardUrl}" class="button" style="background-color: #6b7280;">📊 Voir le tableau de bord</a>
            </div>
            
            <p><em>Cette notification a été générée automatiquement par le système de gestion des demandes matériel.</em></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Système de Gestion des Demandes Matériel</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Template pour mise à jour de statut
   */
  private generateStatusUpdateTemplate(data: {
    userName: string
    demandeNumber: string
    demandeType: string
    oldStatus: string
    newStatus: string
    projectName: string
    viewUrl: string
    dashboardUrl: string
  }): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mise à jour de statut</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #0ea5e9; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
          .button:hover { background-color: #0284c7; }
          .info-box { background-color: white; padding: 20px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #0ea5e9; }
          .status-change { background-color: #fef3c7; padding: 15px; border-radius: 6px; margin: 15px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Mise à Jour de Statut</h1>
          </div>
          <div class="content">
            <p>Bonjour <strong>${data.userName}</strong>,</p>
            
            <p>Le statut de votre demande a été mis à jour :</p>
            
            <div class="info-box">
              <h3>📋 Détails de la demande</h3>
              <ul>
                <li><strong>Numéro :</strong> ${data.demandeNumber}</li>
                <li><strong>Type :</strong> ${data.demandeType}</li>
                <li><strong>Projet :</strong> ${data.projectName}</li>
              </ul>
            </div>
            
            <div class="status-change">
              <h4>🔄 Changement de statut</h4>
              <p><strong>Ancien statut :</strong> ${data.oldStatus}</p>
              <p><strong>Nouveau statut :</strong> <span style="color: #16a34a; font-weight: bold;">${data.newStatus}</span></p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.viewUrl}" class="button">👁️ Voir la demande</a>
              <a href="${data.dashboardUrl}" class="button" style="background-color: #6b7280;">📊 Tableau de bord</a>
            </div>
            
            <p><em>Cette notification a été générée automatiquement par le système de gestion des demandes matériel.</em></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Système de Gestion des Demandes Matériel</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  /**
   * Convertit un statut en libellé lisible
   */
  private getStatusLabel(status: string): string {
    const statusLabels: { [key: string]: string } = {
      'brouillon': 'Brouillon',
      'soumise': 'Soumise',
      'en_attente_validation_conducteur': 'En attente validation conducteur',
      'en_attente_validation_qhse': 'En attente validation QHSE',
      'en_attente_validation_responsable_travaux': 'En attente validation responsable travaux',
      'en_attente_validation_charge_affaire': 'En attente validation chargé d\'affaire',
      'en_attente_preparation_appro': 'En attente préparation appro',
      'en_attente_validation_logistique': 'En attente validation logistique',
      'en_attente_validation_finale_demandeur': 'En attente validation finale demandeur',
      'confirmee_demandeur': 'Confirmée par le demandeur',
      'cloturee': 'Clôturée',
      'rejetee': 'Rejetée',
      'archivee': 'Archivée'
    }
    
    return statusLabels[status] || status
  }
}

// Export de l'instance singleton
export const emailService = EmailService.getInstance()

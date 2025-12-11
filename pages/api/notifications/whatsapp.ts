import { NextApiRequest, NextApiResponse } from 'next'
import type { WhatsAppNotification } from '@/services/whatsappService'

// Configuration Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886' // Sandbox par défaut

/**
 * Crée le client Twilio dynamiquement
 */
const createTwilioClient = async () => {
  if (!accountSid || !authToken) {
    throw new Error('Configuration Twilio manquante. Vérifiez TWILIO_ACCOUNT_SID et TWILIO_AUTH_TOKEN dans vos variables d\'environnement.')
  }
  
  // Import dynamique de Twilio (évite les erreurs si le package n'est pas installé)
  const twilio = (await import('twilio')).default
  return twilio(accountSid, authToken)
}

/**
 * Log des activités WhatsApp (pour audit)
 */
async function logWhatsAppActivity(data: {
  to: string
  type: string
  status: 'sent' | 'failed'
  messageSid?: string
  error?: string
  timestamp: Date
}): Promise<void> {
  // Log console (en production, sauvegarder en base de données)
  const logEntry = {
    ...data,
    timestamp: data.timestamp.toISOString()
  }
  
  if (data.status === 'sent') {
    console.log('✅ [WhatsApp Log]', JSON.stringify(logEntry))
  } else {
    console.error('❌ [WhatsApp Log]', JSON.stringify(logEntry))
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Vérifier la méthode HTTP
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Vérifier si WhatsApp est activé
  if (process.env.ENABLE_WHATSAPP_NOTIFICATIONS !== 'true') {
    console.log('📱 [WhatsApp] Notifications désactivées (ENABLE_WHATSAPP_NOTIFICATIONS !== true)')
    return res.status(200).json({ 
      success: false, 
      skipped: true,
      message: 'WhatsApp notifications are disabled' 
    })
  }

  try {
    const notification: WhatsAppNotification = req.body

    // Validation des données requises
    if (!notification.to || !notification.message) {
      return res.status(400).json({ 
        error: 'Champs requis manquants: to, message' 
      })
    }

    // Validation du format du numéro de téléphone (format international)
    const phoneRegex = /^\+[1-9]\d{6,14}$/
    if (!phoneRegex.test(notification.to)) {
      return res.status(400).json({ 
        error: 'Format de numéro invalide. Utilisez le format international: +33612345678',
        received: notification.to
      })
    }

    // Création du client Twilio
    const client = await createTwilioClient()

    // Envoi du message WhatsApp via Twilio
    const message = await client.messages.create({
      from: twilioWhatsAppNumber,
      to: `whatsapp:${notification.to}`,
      body: notification.message
    })

    console.log('📱 [WhatsApp] Message envoyé:', {
      messageSid: message.sid,
      to: notification.to,
      type: notification.type,
      status: message.status,
      timestamp: new Date().toISOString()
    })

    // Log de l'activité (succès)
    await logWhatsAppActivity({
      to: notification.to,
      type: notification.type,
      status: 'sent',
      messageSid: message.sid,
      timestamp: new Date()
    })

    // Réponse succès
    res.status(200).json({ 
      success: true, 
      messageSid: message.sid,
      status: message.status
    })

  } catch (error) {
    console.error('❌ [WhatsApp] Erreur lors de l\'envoi:', error)

    // Log de l'erreur
    await logWhatsAppActivity({
      to: req.body?.to || 'unknown',
      type: req.body?.type || 'unknown',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      timestamp: new Date()
    })

    // Gestion des erreurs Twilio spécifiques
    if (error instanceof Error) {
      // Numéro invalide
      if (error.message.includes('not a valid phone number')) {
        return res.status(400).json({ 
          success: false,
          error: 'Numéro de téléphone invalide',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        })
      }
      
      // Numéro non enregistré sur WhatsApp ou sandbox
      if (error.message.includes('not registered') || error.message.includes('unregistered')) {
        return res.status(400).json({ 
          success: false,
          error: 'Ce numéro n\'est pas enregistré sur WhatsApp ou n\'a pas rejoint le sandbox Twilio. Envoyez "join <code>" au +1 415 523 8886',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        })
      }

      // Credentials Twilio invalides
      if (error.message.includes('authenticate') || error.message.includes('credentials')) {
        return res.status(500).json({ 
          success: false,
          error: 'Erreur d\'authentification Twilio. Vérifiez vos credentials.',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        })
      }

      // Quota dépassé
      if (error.message.includes('quota') || error.message.includes('limit')) {
        return res.status(429).json({ 
          success: false,
          error: 'Quota de messages WhatsApp dépassé.',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        })
      }
    }

    // Erreur générique
    res.status(500).json({ 
      success: false,
      error: 'Échec de l\'envoi du message WhatsApp',
      details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : error) : undefined
    })
  }
}

import { NextApiRequest, NextApiResponse } from 'next'
import nodemailer from 'nodemailer'
import type { EmailNotification } from '@/services/emailService'

// Configuration du transporteur email (à adapter selon votre fournisseur)
const createTransporter = () => {
  // Exemple avec Gmail (à remplacer par votre configuration)
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Votre email
      pass: process.env.EMAIL_PASSWORD, // Mot de passe d'application Gmail
    },
  })

  // Exemple avec un serveur SMTP personnalisé
  /*
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  })
  */
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const notification: EmailNotification = req.body

    // Validation des données
    if (!notification.to || !notification.subject || !notification.html) {
      return res.status(400).json({ 
        error: 'Missing required fields: to, subject, html' 
      })
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(notification.to)) {
      return res.status(400).json({ 
        error: 'Invalid email address' 
      })
    }

    // Création du transporteur
    const transporter = createTransporter()

    // Configuration de l'email
    const mailOptions = {
      from: {
        name: 'Système de Gestion des Demandes Matériel',
        address: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@gestion-materiel.com'
      },
      to: notification.to,
      subject: notification.subject,
      html: notification.html,
      // Ajout d'une version texte pour la compatibilité
      text: notification.html.replace(/<[^>]*>/g, ''), // Supprime les balises HTML
    }

    // Envoi de l'email
    const info = await transporter.sendMail(mailOptions)

    console.log('Email envoyé:', {
      messageId: info.messageId,
      to: notification.to,
      type: notification.type,
      timestamp: new Date().toISOString()
    })

    // Log de l'activité (optionnel - pour audit)
    await logEmailActivity({
      to: notification.to,
      subject: notification.subject,
      type: notification.type,
      status: 'sent',
      messageId: info.messageId,
      timestamp: new Date()
    })

    res.status(200).json({ 
      success: true, 
      messageId: info.messageId 
    })

  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error)

    // Log de l'erreur
    await logEmailActivity({
      to: req.body?.to || 'unknown',
      subject: req.body?.subject || 'unknown',
      type: req.body?.type || 'unknown',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    })

    res.status(500).json({ 
      error: 'Failed to send email',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    })
  }
}

/**
 * Log de l'activité email pour audit et debugging
 */
async function logEmailActivity(activity: {
  to: string
  subject: string
  type: string
  status: 'sent' | 'failed'
  messageId?: string
  error?: string
  timestamp: Date
}) {
  try {
    // Ici vous pouvez logger dans une base de données, un fichier, etc.
    console.log('Email Activity Log:', activity)
    
    // Exemple d'insertion en base de données
    /*
    await db.emailLogs.create({
      data: activity
    })
    */
  } catch (error) {
    console.error('Erreur lors du logging de l\'activité email:', error)
  }
}

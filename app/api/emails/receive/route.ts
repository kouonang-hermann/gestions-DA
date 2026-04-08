/**
 * API ENDPOINT - RÉCEPTION D'EMAILS
 * 
 * Endpoint pour traiter manuellement les emails entrants
 * ou déclencher la vérification des nouveaux emails.
 * 
 * GET /api/emails/receive - Vérifie et traite les nouveaux emails
 * POST /api/emails/receive - Traite un email spécifique (webhook)
 */

import { type NextRequest, NextResponse } from 'next/server'
import { processUnreadEmails } from '@/lib/email-receiver'
import { getCurrentUser } from '@/lib/auth'

/**
 * GET - Vérifie et traite tous les emails non lus
 */
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification (admin uniquement)
    const currentUser = await getCurrentUser(request)
    
    if (!currentUser || currentUser.role !== 'superadmin') {
      return NextResponse.json({
        success: false,
        error: 'Non autorisé - Admin uniquement'
      }, { status: 403 })
    }

    console.log('📧 [API] Traitement des emails entrants...')

    // Traiter les emails non lus
    const processedEmails = await processUnreadEmails()

    const stats = {
      total: processedEmails.length,
      processed: processedEmails.filter(e => e.processed).length,
      failed: processedEmails.filter(e => !e.processed).length,
      byAction: {
        validate: processedEmails.filter(e => e.action.type === 'validate').length,
        reject: processedEmails.filter(e => e.action.type === 'reject').length,
        close: processedEmails.filter(e => e.action.type === 'close').length,
        comment: processedEmails.filter(e => e.action.type === 'comment').length,
        unknown: processedEmails.filter(e => e.action.type === 'unknown').length
      }
    }

    console.log(`✅ [API] ${stats.processed}/${stats.total} emails traités avec succès`)

    return NextResponse.json({
      success: true,
      data: {
        stats,
        emails: processedEmails.map(e => ({
          from: e.from,
          subject: e.subject,
          date: e.date,
          action: e.action.type,
          demandeNumero: e.action.demandeNumero,
          processed: e.processed,
          error: e.error
        }))
      }
    })

  } catch (error) {
    console.error('❌ [API] Erreur traitement emails:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur'
    }, { status: 500 })
  }
}

/**
 * POST - Traite un email spécifique (pour webhooks)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Vérifier le token de sécurité pour les webhooks
    const webhookToken = request.headers.get('x-webhook-token')
    const expectedToken = process.env.EMAIL_WEBHOOK_TOKEN
    
    if (expectedToken && webhookToken !== expectedToken) {
      return NextResponse.json({
        success: false,
        error: 'Token webhook invalide'
      }, { status: 401 })
    }

    console.log('📧 [API] Réception webhook email:', body)

    // TODO: Implémenter le traitement du webhook
    // Format attendu: { from, subject, text, html, messageId }

    return NextResponse.json({
      success: true,
      message: 'Webhook reçu (traitement à implémenter)'
    })

  } catch (error) {
    console.error('❌ [API] Erreur webhook email:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur'
    }, { status: 500 })
  }
}

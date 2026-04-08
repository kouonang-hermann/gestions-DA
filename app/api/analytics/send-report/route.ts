/**
 * API ENDPOINT - ENVOI DU RAPPORT ANALYTIQUE
 * 
 * Endpoint pour envoyer manuellement ou automatiquement le rapport analytique
 * au Super Admin par email.
 * 
 * GET /api/analytics/send-report - Envoie le rapport au Super Admin
 * POST /api/analytics/send-report - Envoie le rapport à un email spécifique
 */

import { type NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { sendReportToSuperAdmin, sendAnalyticsReport } from '@/lib/analytics-email-service'

/**
 * GET - Envoie le rapport au Super Admin
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

    console.log('📧 [API] Envoi du rapport analytique au Super Admin...')

    // Envoyer le rapport
    const result = await sendReportToSuperAdmin()

    if (result.success) {
      console.log('✅ [API] Rapport envoyé avec succès')
      return NextResponse.json({
        success: true,
        message: 'Rapport analytique envoyé avec succès'
      })
    } else {
      console.error('❌ [API] Erreur envoi rapport:', result.error)
      return NextResponse.json({
        success: false,
        error: result.error || 'Erreur lors de l\'envoi du rapport'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ [API] Erreur:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur'
    }, { status: 500 })
  }
}

/**
 * POST - Envoie le rapport à un email spécifique
 */
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification (admin uniquement)
    const currentUser = await getCurrentUser(request)
    
    if (!currentUser || currentUser.role !== 'superadmin') {
      return NextResponse.json({
        success: false,
        error: 'Non autorisé - Admin uniquement'
      }, { status: 403 })
    }

    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email destinataire requis'
      }, { status: 400 })
    }

    console.log(`📧 [API] Envoi du rapport analytique à ${email}...`)

    // Envoyer le rapport
    const result = await sendAnalyticsReport(email)

    if (result.success) {
      console.log('✅ [API] Rapport envoyé avec succès')
      return NextResponse.json({
        success: true,
        message: `Rapport analytique envoyé à ${email}`
      })
    } else {
      console.error('❌ [API] Erreur envoi rapport:', result.error)
      return NextResponse.json({
        success: false,
        error: result.error || 'Erreur lors de l\'envoi du rapport'
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ [API] Erreur:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur'
    }, { status: 500 })
  }
}

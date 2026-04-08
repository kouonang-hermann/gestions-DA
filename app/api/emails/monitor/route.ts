/**
 * API ENDPOINT - SURVEILLANCE DES EMAILS
 * 
 * Endpoint pour démarrer/arrêter la surveillance automatique des emails.
 * 
 * POST /api/emails/monitor - Démarre la surveillance
 * DELETE /api/emails/monitor - Arrête la surveillance
 */

import { type NextRequest, NextResponse } from 'next/server'
import { startEmailMonitoring, getEmailReceiver } from '@/lib/email-receiver'
import { getCurrentUser } from '@/lib/auth'

let monitoringActive = false

/**
 * POST - Démarre la surveillance des emails
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

    if (monitoringActive) {
      return NextResponse.json({
        success: false,
        error: 'Surveillance déjà active'
      }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const intervalMinutes = body.intervalMinutes || 5

    console.log(`🔄 [API] Démarrage surveillance emails (${intervalMinutes}min)`)

    // Démarrer la surveillance en arrière-plan
    startEmailMonitoring(intervalMinutes).catch(error => {
      console.error('❌ [API] Erreur surveillance:', error)
      monitoringActive = false
    })

    monitoringActive = true

    return NextResponse.json({
      success: true,
      message: `Surveillance démarrée (intervalle: ${intervalMinutes}min)`,
      data: {
        active: true,
        intervalMinutes
      }
    })

  } catch (error) {
    console.error('❌ [API] Erreur démarrage surveillance:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur'
    }, { status: 500 })
  }
}

/**
 * DELETE - Arrête la surveillance des emails
 */
export async function DELETE(request: NextRequest) {
  try {
    // Vérifier l'authentification (admin uniquement)
    const currentUser = await getCurrentUser(request)
    
    if (!currentUser || currentUser.role !== 'superadmin') {
      return NextResponse.json({
        success: false,
        error: 'Non autorisé - Admin uniquement'
      }, { status: 403 })
    }

    if (!monitoringActive) {
      return NextResponse.json({
        success: false,
        error: 'Surveillance non active'
      }, { status: 400 })
    }

    console.log('⏹️ [API] Arrêt surveillance emails')

    // Déconnecter le client IMAP
    const receiver = getEmailReceiver()
    await receiver.disconnect()

    monitoringActive = false

    return NextResponse.json({
      success: true,
      message: 'Surveillance arrêtée',
      data: {
        active: false
      }
    })

  } catch (error) {
    console.error('❌ [API] Erreur arrêt surveillance:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur'
    }, { status: 500 })
  }
}

/**
 * GET - Statut de la surveillance
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

    return NextResponse.json({
      success: true,
      data: {
        active: monitoringActive
      }
    })

  } catch (error) {
    console.error('❌ [API] Erreur statut surveillance:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur'
    }, { status: 500 })
  }
}

/**
 * ENDPOINT CRON - RAPPORT ANALYTIQUE QUOTIDIEN
 * 
 * Cet endpoint est appelé automatiquement par Vercel Cron à 05:00 UTC chaque jour.
 * Il génère un snapshot des tableaux analytiques et envoie un email au directeur.
 * 
 * SÉCURITÉ :
 * - Vérifie le header CRON_SECRET pour authentifier les appels Vercel
 * - Peut être appelé manuellement avec le même secret pour les tests
 * 
 * ARCHITECTURE :
 * - Aucune logique de calcul ici
 * - Délègue à analytics-snapshot.ts pour la génération
 * - Délègue à email-service.ts pour l'envoi
 * - Trace tout dans NotificationLog
 * 
 * VERCEL CRON :
 * - Configure dans vercel.json : "0 5 * * *" (05:00 UTC)
 * - Timeout max : 10 secondes (plan gratuit) ou 60 secondes (pro)
 * - Les fonctions serverless ont un cold start, prévoir ~2-3s
 */

import { type NextRequest, NextResponse } from "next/server"
import { generateDailySnapshot, Tableau1Data, Tableau3Data } from "@/lib/analytics-snapshot"
import { sendDailyAnalyticsReport } from "@/lib/email-service"
import { prisma } from "@/lib/prisma"

// Secret pour authentifier les appels CRON
const CRON_SECRET = process.env.CRON_SECRET

// ============================================================================
// TYPES
// ============================================================================

interface CronResult {
  success: boolean
  snapshotId?: string
  emailSent?: boolean
  emailLogId?: string
  errors: string[]
  executionTimeMs: number
  timestamp: string
}

// ============================================================================
// HANDLER GET - CRON VERCEL
// ============================================================================

export async function GET(request: NextRequest) {
  const startTime = Date.now()
  const timestamp = new Date().toISOString()
  const errors: string[] = []

  console.log(`🕐 [CRON] Démarrage du job analytique quotidien - ${timestamp}`)

  // Vérifier l'authentification CRON
  const authHeader = request.headers.get("authorization")
  const cronSecret = authHeader?.replace("Bearer ", "")

  // Vercel envoie aussi le secret via le header x-vercel-cron-auth
  const vercelCronAuth = request.headers.get("x-vercel-cron-auth")

  if (!CRON_SECRET) {
    console.warn("⚠️ [CRON] CRON_SECRET non configuré - acceptation de l'appel en développement")
  } else if (cronSecret !== CRON_SECRET && vercelCronAuth !== CRON_SECRET) {
    console.error("❌ [CRON] Authentification échouée")
    return NextResponse.json({
      success: false,
      error: "Non autorisé",
      timestamp
    }, { status: 401 })
  }

  let snapshotId: string | undefined
  let emailSent = false
  let emailLogId: string | undefined

  try {
    // =========================================================================
    // ÉTAPE 1 : Génération du snapshot
    // =========================================================================
    console.log("📊 [CRON] Étape 1/3 : Génération du snapshot...")
    
    const snapshotResult = await generateDailySnapshot()

    if (!snapshotResult.success) {
      errors.push(`Snapshot: ${snapshotResult.error}`)
      console.error(`❌ [CRON] Échec génération snapshot: ${snapshotResult.error}`)
      
      return NextResponse.json({
        success: false,
        errors,
        executionTimeMs: Date.now() - startTime,
        timestamp
      } as CronResult, { status: 500 })
    }

    snapshotId = snapshotResult.snapshotId
    console.log(`✅ [CRON] Snapshot généré: ${snapshotId} (${snapshotResult.executionTimeMs}ms)`)

    // =========================================================================
    // ÉTAPE 2 : Envoi de l'email
    // =========================================================================
    console.log("📧 [CRON] Étape 2/3 : Envoi de l'email au directeur...")

    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const emailResult = await sendDailyAnalyticsReport(
      snapshotId!,
      snapshotResult.tableau1 as Tableau1Data,
      snapshotResult.tableau3 as Tableau3Data,
      today
    )

    emailSent = emailResult.success
    emailLogId = emailResult.logId

    if (!emailResult.success) {
      errors.push(`Email: ${emailResult.error}`)
      console.error(`❌ [CRON] Échec envoi email: ${emailResult.error}`)
    } else {
      console.log(`✅ [CRON] Email envoyé: ${emailResult.messageId}`)
    }

    // =========================================================================
    // ÉTAPE 3 : Mise à jour des métadonnées du snapshot
    // =========================================================================
    console.log("📝 [CRON] Étape 3/3 : Mise à jour des métadonnées...")

    await prisma.dailyAnalyticsSnapshot.update({
      where: { id: snapshotId },
      data: {
        metadata: {
          cronExecutionTime: Date.now() - startTime,
          snapshotGenerationTime: snapshotResult.executionTimeMs,
          emailSent,
          emailSentAt: emailSent ? new Date().toISOString() : null,
          emailLogId,
          errors: errors.length > 0 ? errors : undefined
        } as any
      }
    })

    const executionTimeMs = Date.now() - startTime
    console.log(`✅ [CRON] Job terminé en ${executionTimeMs}ms`)

    // =========================================================================
    // RÉPONSE
    // =========================================================================
    const result: CronResult = {
      success: errors.length === 0,
      snapshotId,
      emailSent,
      emailLogId,
      errors,
      executionTimeMs,
      timestamp
    }

    return NextResponse.json(result, { 
      status: errors.length === 0 ? 200 : 207 // 207 = Multi-Status (succès partiel)
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
    errors.push(`Exception: ${errorMessage}`)
    console.error(`❌ [CRON] Exception non gérée: ${errorMessage}`)

    return NextResponse.json({
      success: false,
      snapshotId,
      emailSent,
      emailLogId,
      errors,
      executionTimeMs: Date.now() - startTime,
      timestamp
    } as CronResult, { status: 500 })
  }
}

// ============================================================================
// HANDLER POST - DÉCLENCHEMENT MANUEL
// ============================================================================

/**
 * Permet de déclencher manuellement le job CRON
 * Utile pour les tests ou pour forcer une régénération
 * 
 * Body optionnel :
 * - forceRegenerate: boolean - Force la régénération même si un snapshot existe
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const timestamp = new Date().toISOString()
  const errors: string[] = []

  console.log(`🔧 [CRON-MANUAL] Déclenchement manuel - ${timestamp}`)

  // Vérifier l'authentification
  const authHeader = request.headers.get("authorization")
  const token = authHeader?.replace("Bearer ", "")

  if (!CRON_SECRET) {
    console.warn("⚠️ [CRON-MANUAL] CRON_SECRET non configuré")
  } else if (token !== CRON_SECRET) {
    console.error("❌ [CRON-MANUAL] Authentification échouée")
    return NextResponse.json({
      success: false,
      error: "Non autorisé",
      timestamp
    }, { status: 401 })
  }

  let forceRegenerate = false
  try {
    const body = await request.json()
    forceRegenerate = body.forceRegenerate === true
  } catch {
    // Body vide ou invalide, on continue avec les valeurs par défaut
  }

  let snapshotId: string | undefined
  let emailSent = false
  let emailLogId: string | undefined

  try {
    // Génération du snapshot
    console.log(`📊 [CRON-MANUAL] Génération du snapshot (force=${forceRegenerate})...`)
    
    const snapshotResult = await generateDailySnapshot(forceRegenerate)

    if (!snapshotResult.success) {
      errors.push(`Snapshot: ${snapshotResult.error}`)
      return NextResponse.json({
        success: false,
        errors,
        executionTimeMs: Date.now() - startTime,
        timestamp
      } as CronResult, { status: 500 })
    }

    snapshotId = snapshotResult.snapshotId
    console.log(`✅ [CRON-MANUAL] Snapshot: ${snapshotId}`)

    // Envoi de l'email
    console.log("📧 [CRON-MANUAL] Envoi de l'email...")

    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    const emailResult = await sendDailyAnalyticsReport(
      snapshotId!,
      snapshotResult.tableau1 as Tableau1Data,
      snapshotResult.tableau3 as Tableau3Data,
      today
    )

    emailSent = emailResult.success
    emailLogId = emailResult.logId

    if (!emailResult.success) {
      errors.push(`Email: ${emailResult.error}`)
    }

    // Mise à jour métadonnées
    await prisma.dailyAnalyticsSnapshot.update({
      where: { id: snapshotId },
      data: {
        metadata: {
          cronExecutionTime: Date.now() - startTime,
          snapshotGenerationTime: snapshotResult.executionTimeMs,
          emailSent,
          emailSentAt: emailSent ? new Date().toISOString() : null,
          emailLogId,
          manualTrigger: true,
          errors: errors.length > 0 ? errors : undefined
        } as any
      }
    })

    const executionTimeMs = Date.now() - startTime
    console.log(`✅ [CRON-MANUAL] Terminé en ${executionTimeMs}ms`)

    return NextResponse.json({
      success: errors.length === 0,
      snapshotId,
      emailSent,
      emailLogId,
      errors,
      executionTimeMs,
      timestamp
    } as CronResult, {
      status: errors.length === 0 ? 200 : 207
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
    errors.push(`Exception: ${errorMessage}`)
    console.error(`❌ [CRON-MANUAL] Exception: ${errorMessage}`)

    return NextResponse.json({
      success: false,
      snapshotId,
      emailSent,
      emailLogId,
      errors,
      executionTimeMs: Date.now() - startTime,
      timestamp
    } as CronResult, { status: 500 })
  }
}

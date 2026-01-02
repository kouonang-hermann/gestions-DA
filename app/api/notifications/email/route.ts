import { type NextRequest, NextResponse } from "next/server"

/**
 * POST /api/notifications/email - Envoie une notification par email
 * Cette route est appelée par le service emailService côté serveur
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, subject, html, type } = body

    // Validation des données
    if (!to || !subject || !html || !type) {
      return NextResponse.json(
        { success: false, error: "Données manquantes" },
        { status: 400 }
      )
    }

    // Vérifier si les notifications email sont activées
    const emailEnabled = process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'false'
    
    if (!emailEnabled) {
      console.log("📧 [EMAIL] Notifications email désactivées")
      return NextResponse.json({
        success: true,
        message: "Notifications email désactivées"
      })
    }

    // TODO: Intégrer un vrai service d'email (SendGrid, Resend, etc.)
    // Pour l'instant, on simule l'envoi
    console.log("📧 [EMAIL] Envoi d'email simulé:")
    console.log(`  - Destinataire: ${to}`)
    console.log(`  - Sujet: ${subject}`)
    console.log(`  - Type: ${type}`)

    // Simulation d'envoi réussi
    return NextResponse.json({
      success: true,
      message: "Email envoyé avec succès",
      data: {
        to,
        subject,
        type,
        sentAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error("❌ [EMAIL] Erreur lors de l'envoi de l'email:", error)
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'envoi de l'email" },
      { status: 500 }
    )
  }
}

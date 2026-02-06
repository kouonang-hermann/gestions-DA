import { type NextRequest, NextResponse } from "next/server"

/**
 * POST /api/notifications/whatsapp - Envoie une notification par WhatsApp
 * Cette route est appelée par le service whatsappService côté serveur
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, message, type } = body

    // Validation des données
    if (!to || !message || !type) {
      return NextResponse.json(
        { success: false, error: "Données manquantes" },
        { status: 400 }
      )
    }

    // Vérifier si les notifications WhatsApp sont activées
    const whatsappEnabled = process.env.ENABLE_WHATSAPP_NOTIFICATIONS === 'true'
    
    if (!whatsappEnabled) {
      return NextResponse.json({
        success: true,
        message: "Notifications WhatsApp désactivées"
      })
    }

    // TODO: Intégrer un vrai service WhatsApp (Twilio, WhatsApp Business API, etc.)
    // Pour l'instant, on simule l'envoi

    // Simulation d'envoi réussi
    return NextResponse.json({
      success: true,
      message: "Message WhatsApp envoyé avec succès",
      data: {
        to,
        type,
        sentAt: new Date().toISOString()
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Erreur lors de l'envoi du message WhatsApp" },
      { status: 500 }
    )
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * PUT /api/notifications/[id]/read - Marque une notification comme lue
 */
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const currentUser = await getCurrentUser(request)

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier que la notification existe et appartient à l'utilisateur
    const notification = await prisma.notification.findFirst({
      where: {
        id: params.id,
        userId: currentUser.id
      }
    })

    if (!notification) {
      return NextResponse.json({ success: false, error: "Notification non trouvée" }, { status: 404 })
    }

    // Marquer comme lue
    const updatedNotification = await prisma.notification.update({
      where: { id: params.id },
      data: { lu: true },
      include: {
        demande: {
          select: { id: true, numero: true, type: true }
        },
        projet: {
          select: { id: true, nom: true }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedNotification,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

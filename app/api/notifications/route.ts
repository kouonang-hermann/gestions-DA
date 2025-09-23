import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { Notification } from "@/types"

/**
 * GET /api/notifications - Récupère les notifications de l'utilisateur
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const nonLues = searchParams.get("nonLues") === "true"

    const whereClause: any = { userId: currentUser.id }
    if (nonLues) {
      whereClause.lu = false
    }

    const userNotifications = await prisma.notification.findMany({
      where: whereClause,
      include: {
        demande: {
          select: { id: true, numero: true, type: true }
        },
        projet: {
          select: { id: true, nom: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: userNotifications,
    })
  } catch (error) {
    console.error("Erreur lors de la récupération des notifications:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

/**
 * POST /api/notifications - Crée une nouvelle notification
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    }

    const { userId, titre, message, demandeId, projetId } = await request.json()

    if (!userId || !titre || !message) {
      return NextResponse.json({ success: false, error: "Données manquantes" }, { status: 400 })
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        titre,
        message,
        lu: false,
        demandeId: demandeId || null,
        projetId: projetId || null,
      },
      include: {
        demande: {
          select: { id: true, numero: true, type: true }
        },
        projet: {
          select: { id: true, nom: true }
        }
      }
    })

    return NextResponse.json(
      {
        success: true,
        data: notification,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Erreur lors de la création de la notification:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

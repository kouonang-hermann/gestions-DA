import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "@/lib/middleware"
import { prisma } from "@/lib/prisma"
import { hasPermission } from "@/lib/auth"

/**
 * PATCH /api/users/[id]/admin - Met à jour le statut admin d'un utilisateur
 */
export const PATCH = withAuth(async (request: NextRequest, currentUser: any, context: { params: Promise<{ id: string }> }) => {
  try {
    const params = await context.params
    // Vérifier les permissions - seul le superadmin peut attribuer des privilèges admin
    if (!hasPermission(currentUser, "assign_admin")) {
      return NextResponse.json(
        { success: false, error: "Permissions insuffisantes" },
        { status: 403 }
      )
    }

    const { isAdmin } = await request.json()
    const { id } = params

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Utilisateur non trouvé" },
        { status: 404 }
      )
    }

    // Ne pas permettre de modifier le statut admin d'un superadmin
    if (user.role === "superadmin") {
      return NextResponse.json(
        { success: false, error: "Impossible de modifier les privilèges d'un superadmin" },
        { status: 400 }
      )
    }

    // Mettre à jour le statut admin
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isAdmin: Boolean(isAdmin) },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedUser
    })

  } catch (error) {
    console.error("Erreur lors de la mise à jour du statut admin:", error)
    return NextResponse.json(
      { success: false, error: "Erreur interne du serveur" },
      { status: 500 }
    )
  }
})

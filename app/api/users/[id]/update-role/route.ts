import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { UserRole } from "@prisma/client"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Vérifier l'authentification
    const authResult = await requireAuth(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: authResult.error || "Non authentifié" },
        { status: 401 }
      )
    }

    const currentUser = authResult.user

    // Vérifier que l'utilisateur est admin
    if (!currentUser.isAdmin) {
      return NextResponse.json(
        { success: false, error: "Permission refusée" },
        { status: 403 }
      )
    }

    const { id: userId } = await params
    const { newRole } = await request.json()

    if (!newRole) {
      return NextResponse.json(
        { success: false, error: "newRole requis" },
        { status: 400 }
      )
    }

    // Vérifier que le rôle est valide
    const validRoles = Object.values(UserRole)
    if (!validRoles.includes(newRole as UserRole)) {
      return NextResponse.json(
        { success: false, error: "Rôle invalide" },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Utilisateur introuvable" },
        { status: 404 }
      )
    }

    // Ne pas permettre de modifier son propre rôle
    if (userId === currentUser.id) {
      return NextResponse.json(
        { success: false, error: "Vous ne pouvez pas modifier votre propre rôle" },
        { status: 400 }
      )
    }

    // Mettre à jour le rôle
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole as UserRole },
      include: {
        projets: true,
      },
    })

    // Note: L'historique pourrait être ajouté si le modèle HistoryEntry est étendu
    // Pour l'instant, on log l'action

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        nom: updatedUser.nom,
        prenom: updatedUser.prenom,
        email: updatedUser.email,
        role: updatedUser.role,
        isAdmin: updatedUser.isAdmin,
        projets: updatedUser.projets.map(p => p.projetId),
      },
      message: "Rôle mis à jour avec succès",
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

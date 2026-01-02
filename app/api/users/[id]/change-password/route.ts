import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import bcrypt from "bcryptjs"

/**
 * PUT /api/users/[id]/change-password - Changer le mot de passe d'un utilisateur
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: 401 })
    }

    const { id } = await params
    const { currentPassword, newPassword } = await request.json()

    // Vérifier que l'utilisateur ne peut changer que son propre mot de passe
    if (authResult.user.id !== id) {
      return NextResponse.json(
        { success: false, error: "Vous ne pouvez modifier que votre propre mot de passe" },
        { status: 403 }
      )
    }

    // Validation des données
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, error: "Mot de passe actuel et nouveau mot de passe requis" },
        { status: 400 }
      )
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: "Le nouveau mot de passe doit contenir au moins 6 caractères" },
        { status: 400 }
      )
    }

    // Récupérer l'utilisateur avec son mot de passe
    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Utilisateur non trouvé" },
        { status: 404 }
      )
    }

    // Vérifier le mot de passe actuel
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: "Mot de passe actuel incorrect" },
        { status: 401 }
      )
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      message: "Mot de passe modifié avec succès"
    })
  } catch (error) {
    console.error("Erreur lors du changement de mot de passe:", error)
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

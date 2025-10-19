import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

export async function POST(
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

    const { userId } = await request.json()
    const { id: projectId } = await params

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId requis" },
        { status: 400 }
      )
    }

    // Vérifier que le projet existe
    const projet = await prisma.projet.findUnique({
      where: { id: projectId },
    })

    if (!projet) {
      return NextResponse.json(
        { success: false, error: "Projet introuvable" },
        { status: 404 }
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

    // Vérifier si l'utilisateur est déjà dans le projet
    const existingRelation = await prisma.userProjet.findUnique({
      where: {
        userId_projetId: {
          userId,
          projetId: projectId,
        },
      },
    })

    if (existingRelation) {
      return NextResponse.json(
        { success: false, error: "Utilisateur déjà assigné à ce projet" },
        { status: 400 }
      )
    }

    // Ajouter l'utilisateur au projet
    await prisma.userProjet.create({
      data: {
        userId,
        projetId: projectId,
      },
    })

    // Note: L'historique pourrait être ajouté si le modèle HistoryEntry est étendu
    // Pour l'instant, on log l'action
    console.log(`✅ Utilisateur ${userId} ajouté au projet ${projectId} par ${currentUser.id}`)

    return NextResponse.json({
      success: true,
      message: "Utilisateur ajouté au projet avec succès",
    })
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'utilisateur au projet:", error)
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

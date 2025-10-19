import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

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

    const { id: projectId } = await params
    const projectData = await request.json()

    // Vérifier que le projet existe
    const existingProjet = await prisma.projet.findUnique({
      where: { id: projectId },
    })

    if (!existingProjet) {
      return NextResponse.json(
        { success: false, error: "Projet introuvable" },
        { status: 404 }
      )
    }

    // Préparer les données à mettre à jour
    const updateData: any = {}
    
    if (projectData.nom !== undefined) updateData.nom = projectData.nom
    if (projectData.description !== undefined) updateData.description = projectData.description
    if (projectData.dateDebut !== undefined) updateData.dateDebut = new Date(projectData.dateDebut)
    if (projectData.dateFin !== undefined) {
      updateData.dateFin = projectData.dateFin ? new Date(projectData.dateFin) : null
    }
    if (projectData.actif !== undefined) updateData.actif = projectData.actif
    if (projectData.localisation !== undefined) updateData.localisation = projectData.localisation

    // Mettre à jour le projet
    const updatedProjet = await prisma.projet.update({
      where: { id: projectId },
      data: updateData,
      include: {
        createur: true,
        utilisateurs: {
          include: {
            user: true,
          },
        },
      },
    })

    // Note: L'historique pourrait être ajouté si le modèle HistoryEntry est étendu
    // Pour l'instant, on log l'action
    console.log(`✅ Projet ${projectId} modifié par ${currentUser.id}`)

    return NextResponse.json({
      success: true,
      projet: updatedProjet,
      message: "Projet mis à jour avec succès",
    })
  } catch (error) {
    console.error("Erreur lors de la mise à jour du projet:", error)
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

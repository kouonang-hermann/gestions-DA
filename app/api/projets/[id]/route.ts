import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/projets/[id] - Récupère un projet spécifique
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const currentUser = await getCurrentUser(request)

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    }

    const projet = await prisma.projet.findUnique({
      where: { id: params.id },
      include: {
        createdByUser: {
          select: { id: true, nom: true, prenom: true, email: true }
        },
        utilisateurs: {
          include: {
            user: {
              select: { id: true, nom: true, prenom: true, email: true, role: true }
            }
          }
        },
        demandes: {
          select: { id: true, numero: true, type: true, status: true }
        }
      }
    })

    if (!projet) {
      return NextResponse.json({ success: false, error: "Projet non trouvé" }, { status: 404 })
    }

    // Vérifier les permissions
    const isAssigned = projet.utilisateurs.some(up => up.userId === currentUser.id)
    if (
      currentUser.role !== "superadmin" &&
      !isAssigned &&
      projet.createdBy !== currentUser.id
    ) {
      return NextResponse.json({ success: false, error: "Accès non autorisé" }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: projet,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

/**
 * PUT /api/projets/[id] - Met à jour un projet
 */
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const currentUser = await getCurrentUser(request)

    if (!currentUser || currentUser.role !== "superadmin") {
      return NextResponse.json({ success: false, error: "Accès non autorisé" }, { status: 403 })
    }

    const projet = await prisma.projet.findUnique({
      where: { id: params.id }
    })

    if (!projet) {
      return NextResponse.json({ success: false, error: "Projet non trouvé" }, { status: 404 })
    }

    const updates = await request.json()
    const updatedProjet = await prisma.projet.update({
      where: { id: params.id },
      data: {
        nom: updates.nom,
        description: updates.description,
        dateDebut: updates.dateDebut ? new Date(updates.dateDebut) : undefined,
        dateFin: updates.dateFin ? new Date(updates.dateFin) : undefined,
        actif: updates.actif,
      },
      include: {
        createdByUser: {
          select: { id: true, nom: true, prenom: true, email: true }
        },
        utilisateurs: {
          include: {
            user: {
              select: { id: true, nom: true, prenom: true, email: true, role: true }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: updatedProjet,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

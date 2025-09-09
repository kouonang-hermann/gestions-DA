import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth, withPermission } from "@/lib/middleware"
import { createProjetSchema } from "@/lib/validations"

/**
 * GET /api/projets - Récupère les projets
 */
export const GET = withAuth(async (request: NextRequest, currentUser: any) => {
  try {
    let whereClause: any = {}

    // Filtrer selon le rôle - seuls les utilisateurs assignés voient les projets
    if (currentUser.role !== "superadmin") {
      // Les utilisateurs voient uniquement les projets auxquels ils sont assignés
      const userProjets = await prisma.userProjet.findMany({
        where: { userId: currentUser.id },
        select: { projetId: true }
      })
      const projetIds = userProjets.map((up: any) => up.projetId)
      
      // Si l'utilisateur n'est assigné à aucun projet, retourner une liste vide
      if (projetIds.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
        })
      }
      
      whereClause = {
        id: { in: projetIds }
      }
    }

    const projets = await prisma.projet.findMany({
      where: whereClause,
      include: {
        createur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true
          }
        },
        utilisateurs: {
          include: {
            user: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true,
                role: true
              }
            }
          }
        },
        _count: {
          select: {
            demandes: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: projets,
    })
  } catch (error) {
    console.error("Erreur lors de la récupération des projets:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
})

/**
 * POST /api/projets - Crée un nouveau projet
 */
export const POST = withPermission(["superadmin"], async (request: NextRequest, currentUser: any) => {
  try {
    const body = await request.json()
    
    // Validation des données
    const validatedData = createProjetSchema.parse(body)
    
    // Validation supplémentaire des dates
    if (validatedData.dateFin && validatedData.dateFin !== "" && new Date(validatedData.dateFin) <= new Date(validatedData.dateDebut)) {
      return NextResponse.json({ success: false, error: "La date de fin doit être postérieure à la date de début" }, { status: 400 })
    }

    // Créer le projet
    const newProjet = await prisma.projet.create({
      data: {
        nom: validatedData.nom,
        description: validatedData.description,
        dateDebut: new Date(validatedData.dateDebut),
        dateFin: validatedData.dateFin ? new Date(validatedData.dateFin) : null,
        createdBy: currentUser.id,
        actif: true,
      },
      include: {
        createur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true
          }
        },
        utilisateurs: {
          include: {
            user: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true,
                role: true
              }
            }
          }
        }
      }
    })

    // Assigner les utilisateurs au projet
    let utilisateursAAssigner = validatedData.utilisateurs || []
    
    // Si aucun utilisateur spécifié, assigner automatiquement tous les utilisateurs non-superadmin
    if (utilisateursAAssigner.length === 0) {
      const tousLesUtilisateurs = await prisma.user.findMany({
        where: {
          role: {
            not: "superadmin"
          }
        },
        select: { id: true }
      })
      utilisateursAAssigner = tousLesUtilisateurs.map(u => u.id)
    }
    
    // Créer les assignations
    if (utilisateursAAssigner.length > 0) {
      await Promise.all(
        utilisateursAAssigner.map((userId: string) =>
          prisma.userProjet.create({
            data: {
              userId,
              projetId: newProjet.id,
            }
          })
        )
      )
    }

    // Récupérer le projet avec toutes les relations mises à jour
    const projetComplet = await prisma.projet.findUnique({
      where: { id: newProjet.id },
      include: {
        createur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true
          }
        },
        utilisateurs: {
          include: {
            user: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true,
                role: true
              }
            }
          }
        },
        _count: {
          select: {
            demandes: true
          }
        }
      }
    })

    return NextResponse.json(
      {
        success: true,
        data: projetComplet,
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ success: false, error: "Données invalides", details: error }, { status: 400 })
    }
    
    console.error("Erreur lors de la création du projet:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
})

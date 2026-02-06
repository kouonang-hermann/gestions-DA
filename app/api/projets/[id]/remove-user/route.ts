import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import crypto from "crypto"

/**
 * DELETE /api/projets/[id]/remove-user - Retire un utilisateur d'un projet
 */
export const DELETE = async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const params = await context.params
    const currentUser = await getCurrentUser(request)
    
    // Vérifier les permissions (seuls admin et superadmin peuvent retirer des utilisateurs)
    if (!currentUser || (!currentUser.isAdmin && currentUser.role !== "superadmin")) {
      return NextResponse.json({ 
        success: false, 
        error: "Accès non autorisé. Seuls les administrateurs peuvent retirer des utilisateurs des projets." 
      }, { status: 403 })
    }

    const { userId, reason } = await request.json()

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: "L'ID de l'utilisateur est requis" 
      }, { status: 400 })
    }

    // Vérifier que le projet existe
    const projet = await prisma.projet.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        nom: true,
        actif: true,
        createdBy: true,
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

    if (!projet) {
      return NextResponse.json({ 
        success: false, 
        error: "Projet non trouvé" 
      }, { status: 404 })
    }

    // Vérifier que l'utilisateur est bien assigné au projet
    const userProjet = await prisma.userProjet.findUnique({
      where: {
        userId_projetId: {
          userId: userId,
          projetId: params.id
        }
      },
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
    })

    if (!userProjet) {
      return NextResponse.json({ 
        success: false, 
        error: "L'utilisateur n'est pas assigné à ce projet" 
      }, { status: 404 })
    }

    // Empêcher de retirer le créateur du projet
    if (projet.createdBy === userId) {
      return NextResponse.json({ 
        success: false, 
        error: "Impossible de retirer le créateur du projet. Transférez d'abord la propriété du projet." 
      }, { status: 400 })
    }

    // Vérifier s'il y a des demandes en cours pour cet utilisateur sur ce projet
    const demandesEnCours = await prisma.demande.findMany({
      where: {
        projetId: params.id,
        technicienId: userId,
        status: {
          not: {
            in: ['cloturee', 'rejetee', 'archivee']
          }
        }
      },
      select: {
        id: true,
        status: true,
        type: true
      }
    })

    if (demandesEnCours.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: `Impossible de retirer l'utilisateur. Il a ${demandesEnCours.length} demande(s) en cours sur ce projet. Veuillez d'abord clôturer ou transférer ces demandes.`,
        data: {
          demandesEnCours: demandesEnCours.length
        }
      }, { status: 400 })
    }

    // Retirer l'utilisateur du projet
    await prisma.userProjet.delete({
      where: {
        userId_projetId: {
          userId: userId,
          projetId: params.id
        }
      }
    })

    // Créer une entrée d'historique
    await prisma.historyEntry.create({
      data: {
        id: crypto.randomUUID(),
        demandeId: `PROJECT_USER_REMOVAL_${params.id}`,
        userId: currentUser.id,
        action: "USER_REMOVED_FROM_PROJECT",
        commentaire: `Utilisateur ${userProjet.user.prenom} ${userProjet.user.nom} (${userProjet.user.role}) retiré du projet "${projet.nom}"${reason ? `. Raison: ${reason}` : ""}`,
        timestamp: new Date(),
        signature: `${currentUser.id}_${Date.now()}`,
        ancienStatus: null,
        nouveauStatus: null
      }
    })

    // Créer une notification pour l'utilisateur retiré
    await prisma.notification.create({
      data: {
        id: crypto.randomUUID(),
        userId: userId,
        titre: "Retrait d'un projet",
        message: `Vous avez été retiré du projet "${projet.nom}" par ${currentUser.prenom} ${currentUser.nom}${reason ? `. Raison: ${reason}` : ""}.`,
        lu: false
      }
    })

    // Créer une notification pour tous les autres membres du projet
    const autresMembres = projet.utilisateurs
      .filter(up => up.userId !== userId && up.userId !== currentUser.id)
      .map(up => up.userId)

    if (autresMembres.length > 0) {
      await prisma.notification.createMany({
        data: autresMembres.map(memberId => ({
          id: crypto.randomUUID(),
          userId: memberId,
          titre: "Modification d'équipe projet",
          message: `${userProjet.user.prenom} ${userProjet.user.nom} a été retiré du projet "${projet.nom}".`,
          lu: false
        }))
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        projet: {
          id: projet.id,
          nom: projet.nom
        },
        userRemoved: {
          id: userProjet.user.id,
          nom: userProjet.user.nom,
          prenom: userProjet.user.prenom,
          email: userProjet.user.email,
          role: userProjet.user.role
        },
        removedBy: {
          id: currentUser.id,
          nom: currentUser.nom,
          prenom: currentUser.prenom
        }
      },
      message: `${userProjet.user.prenom} ${userProjet.user.nom} a été retiré du projet "${projet.nom}" avec succès`
    })

  } catch (error) {
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Erreur serveur lors du retrait de l'utilisateur du projet",
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 })
  }
}

/**
 * GET /api/projets/[id]/remove-user - Récupère les informations nécessaires pour retirer un utilisateur
 */
export const GET = async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const params = await context.params
    const currentUser = await getCurrentUser(request)
    
    if (!currentUser || (!currentUser.isAdmin && currentUser.role !== "superadmin")) {
      return NextResponse.json({ 
        success: false, 
        error: "Accès non autorisé" 
      }, { status: 403 })
    }

    // Récupérer les utilisateurs du projet avec leurs demandes en cours
    const projet = await prisma.projet.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        nom: true,
        createdBy: true,
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

    if (!projet) {
      return NextResponse.json({ 
        success: false, 
        error: "Projet non trouvé" 
      }, { status: 404 })
    }

    // Pour chaque utilisateur, compter ses demandes en cours
    const utilisateursAvecDemandes = await Promise.all(
      projet.utilisateurs.map(async (userProjet) => {
        const demandesEnCours = await prisma.demande.count({
          where: {
            projetId: params.id,
            technicienId: userProjet.userId,
            status: {
              not: {
                in: ['cloturee', 'rejetee', 'archivee']
              }
            }
          }
        })

        return {
          ...userProjet.user,
          demandesEnCours,
          isCreator: userProjet.userId === projet.createdBy,
          canBeRemoved: userProjet.userId !== projet.createdBy && demandesEnCours === 0
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: {
        projet: {
          id: projet.id,
          nom: projet.nom
        },
        utilisateurs: utilisateursAvecDemandes
      }
    })

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: "Erreur serveur" 
    }, { status: 500 })
  }
}

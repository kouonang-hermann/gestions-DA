import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser, hasPermission } from "@/lib/auth"
import crypto from "crypto"

/**
 * PUT /api/users/[id]/role - Modifie le rôle d'un utilisateur
 */
export const PUT = async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const params = await context.params
    const currentUser = await getCurrentUser(request)
    
    // Vérifier les permissions (seuls admin et superadmin peuvent modifier les rôles)
    if (!currentUser || (!currentUser.isAdmin && currentUser.role !== "superadmin")) {
      return NextResponse.json({ 
        success: false, 
        error: "Accès non autorisé. Seuls les administrateurs peuvent modifier les rôles." 
      }, { status: 403 })
    }

    const { newRole, reason } = await request.json()

    // Validation du nouveau rôle
    const validRoles = [
      "employe",
      "conducteur_travaux", 
      "responsable_travaux",
      "charge_affaire",
      "responsable_appro",
      "responsable_logistique",
      "responsable_livreur"
    ]

    if (!newRole || !validRoles.includes(newRole)) {
      return NextResponse.json({ 
        success: false, 
        error: "Rôle invalide. Rôles autorisés: " + validRoles.join(", ") 
      }, { status: 400 })
    }

    // Vérifier que l'utilisateur à modifier existe
    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        isAdmin: true
      }
    })

    if (!targetUser) {
      return NextResponse.json({ 
        success: false, 
        error: "Utilisateur non trouvé" 
      }, { status: 404 })
    }

    // Empêcher la modification du rôle d'un superadmin (sécurité)
    if (targetUser.isAdmin && currentUser.role !== "superadmin") {
      return NextResponse.json({ 
        success: false, 
        error: "Seul un superadmin peut modifier le rôle d'un administrateur" 
      }, { status: 403 })
    }

    // Vérifier si le rôle a vraiment changé
    if (targetUser.role === newRole) {
      return NextResponse.json({ 
        success: false, 
        error: "L'utilisateur a déjà ce rôle" 
      }, { status: 400 })
    }

    const oldRole = targetUser.role

    // Mettre à jour le rôle
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: { 
        role: newRole as any,
        updatedAt: new Date()
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true,
        updatedAt: true
      }
    })

    // Note: HistoryEntry nécessite un demandeId valide (clé étrangère)
    // Les changements de rôle ne sont pas liés à une demande spécifique
    // L'audit est assuré par la notification et les logs de l'application
    
    // Créer une notification pour l'utilisateur concerné
    if (targetUser.id !== currentUser.id) {
      await prisma.notification.create({
        data: {
          id: crypto.randomUUID(),
          userId: targetUser.id,
          titre: "Modification de votre rôle",
          message: `Votre rôle a été modifié de "${oldRole}" vers "${newRole}" par ${currentUser.prenom} ${currentUser.nom}${reason ? `. Raison: ${reason}` : ""}.`,
          lu: false
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        user: updatedUser,
        oldRole,
        newRole,
        modifiedBy: {
          id: currentUser.id,
          nom: currentUser.nom,
          prenom: currentUser.prenom
        }
      },
      message: `Rôle de ${targetUser.prenom} ${targetUser.nom} modifié avec succès de "${oldRole}" vers "${newRole}"`
    })

  } catch (error) {
    console.error("Erreur lors de la modification du rôle:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Erreur serveur lors de la modification du rôle" 
    }, { status: 500 })
  }
}

/**
 * GET /api/users/[id]/role - Récupère l'historique des modifications de rôle
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

    // Récupérer l'historique des modifications de rôle pour cet utilisateur
    const roleHistory = await prisma.historyEntry.findMany({
      where: {
        demandeId: "ROLE_CHANGE",
        // On peut filtrer par l'utilisateur concerné si nécessaire
      },
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 20 // Limiter à 20 dernières modifications
    })

    return NextResponse.json({
      success: true,
      data: roleHistory
    })

  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Erreur serveur" 
    }, { status: 500 })
  }
}

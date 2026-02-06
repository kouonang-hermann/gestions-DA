import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { notificationService } from "@/services/notificationService"

/**
 * POST /api/notifications/reminders - Envoie des rappels pour les demandes en attente
 * Cette route peut être appelée manuellement ou par un cron job
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    
    // Seuls les superadmin peuvent déclencher les rappels manuellement
    if (!authResult.success || authResult.user.role !== "superadmin") {
      return NextResponse.json(
        { success: false, error: "Accès non autorisé - Superadmin requis" },
        { status: 403 }
      )
    }


    // Récupérer toutes les demandes en attente
    const now = new Date()
    const reminderThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000) // 24 heures

    const demandesEnAttente = await prisma.demande.findMany({
      where: {
        status: {
          in: [
            "en_attente_validation_conducteur",
            "en_attente_validation_logistique",
            "en_attente_validation_responsable_travaux",
            "en_attente_validation_charge_affaire",
            "en_attente_preparation_appro",
            "en_attente_reception_livreur",
            "en_attente_livraison",
            "en_attente_validation_finale_demandeur"
          ]
        },
        dateModification: {
          lt: reminderThreshold // Modifiées il y a plus de 24h
        }
      },
      include: {
        projet: true,
        technicien: true,
        items: {
          include: {
            article: true
          }
        }
      }
    })


    // Récupérer tous les utilisateurs
    const users = await prisma.user.findMany({
      include: {
        projets: {
          include: {
            projet: true
          }
        }
      }
    })

    // Transformer les données pour le service de notification
    const transformedUsers = users.map(u => ({
      ...u,
      projets: u.projets.map(up => up.projet.id)
    }))

    // Envoyer les rappels
    let rappelsEnvoyes = 0
    for (const demande of demandesEnAttente) {
      try {
        await notificationService.sendReminders(
          transformedUsers as any,
          [demande as any]
        )
        rappelsEnvoyes++
      } catch (error) {
      }
    }


    return NextResponse.json({
      success: true,
      message: `${rappelsEnvoyes} rappel(s) envoyé(s)`,
      data: {
        demandesTraitees: demandesEnAttente.length,
        rappelsEnvoyes
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

/**
 * GET /api/notifications/reminders - Récupère les statistiques des rappels
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      )
    }

    const now = new Date()
    const reminderThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Compter les demandes nécessitant un rappel
    const demandesNecessitantRappel = await prisma.demande.count({
      where: {
        status: {
          in: [
            "en_attente_validation_conducteur",
            "en_attente_validation_logistique",
            "en_attente_validation_responsable_travaux",
            "en_attente_validation_charge_affaire",
            "en_attente_preparation_appro",
            "en_attente_reception_livreur",
            "en_attente_livraison",
            "en_attente_validation_finale_demandeur"
          ]
        },
        dateModification: {
          lt: reminderThreshold
        }
      }
    })

    // Statistiques par statut
    const statsParStatut = await prisma.demande.groupBy({
      by: ['status'],
      where: {
        status: {
          in: [
            "en_attente_validation_conducteur",
            "en_attente_validation_logistique",
            "en_attente_validation_responsable_travaux",
            "en_attente_validation_charge_affaire",
            "en_attente_preparation_appro",
            "en_attente_reception_livreur",
            "en_attente_livraison",
            "en_attente_validation_finale_demandeur"
          ]
        },
        dateModification: {
          lt: reminderThreshold
        }
      },
      _count: true
    })

    return NextResponse.json({
      success: true,
      data: {
        total: demandesNecessitantRappel,
        parStatut: statsParStatut,
        seuilRappel: "24 heures"
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

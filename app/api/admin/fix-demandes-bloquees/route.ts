import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

/**
 * ENDPOINT TEMPORAIRE DE MIGRATION
 * Débloquer les demandes bloquées en "en_attente_validation_logistique"
 * après que le livreur ait confirmé la réception
 * 
 * Ces demandes doivent passer à "en_attente_livraison"
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: authResult.error }, { status: 401 })
  }

  const currentUser = authResult.user

  // Sécurité : seul le superadmin peut exécuter cette migration
  if (currentUser.role !== "superadmin") {
    return NextResponse.json({ 
      success: false, 
      error: "Accès refusé. Seul le superadmin peut exécuter cette migration." 
    }, { status: 403 })
  }

  try {

    // Trouver toutes les demandes d'outillage bloquées en "en_attente_validation_logistique"
    // qui ont déjà une date de réception livreur (preuve que le livreur a confirmé)
    const demandesBloqueesAvecReception = await prisma.demande.findMany({
      where: {
        status: "en_attente_validation_logistique",
        type: "outillage",
        dateReceptionLivreur: {
          not: null
        }
      },
      include: {
        technicien: {
          select: {
            nom: true,
            prenom: true
          }
        },
        livreurAssigne: {
          select: {
            nom: true,
            prenom: true
          }
        }
      }
    })


    if (demandesBloqueesAvecReception.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Aucune demande bloquée trouvée",
        migratedCount: 0,
        demandes: []
      })
    }

    // Migrer chaque demande vers "en_attente_livraison"
    const results = []
    for (const demande of demandesBloqueesAvecReception) {
      try {
        const updated = await prisma.demande.update({
          where: { id: demande.id },
          data: {
            status: "en_attente_livraison"
          }
        })

        
        results.push({
          id: demande.id,
          numero: demande.numero,
          demandeur: `${demande.technicien.prenom} ${demande.technicien.nom}`,
          livreur: demande.livreurAssigne 
            ? `${demande.livreurAssigne.prenom} ${demande.livreurAssigne.nom}` 
            : "Non assigné",
          dateReception: demande.dateReceptionLivreur,
          ancienStatus: "en_attente_validation_logistique",
          nouveauStatus: "en_attente_livraison",
          success: true
        })
      } catch (error) {
        results.push({
          id: demande.id,
          numero: demande.numero,
          success: false,
          error: error instanceof Error ? error.message : "Erreur inconnue"
        })
      }
    }

    const successCount = results.filter(r => r.success).length

    return NextResponse.json({
      success: true,
      message: `Migration terminée avec succès`,
      migratedCount: successCount,
      totalFound: demandesBloqueesAvecReception.length,
      demandes: results
    })

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Erreur serveur" 
    }, { status: 500 })
  }
}

/**
 * GET - Prévisualiser les demandes qui seront migrées (sans les modifier)
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: authResult.error }, { status: 401 })
  }

  const currentUser = authResult.user

  if (currentUser.role !== "superadmin") {
    return NextResponse.json({ 
      success: false, 
      error: "Accès refusé" 
    }, { status: 403 })
  }

  try {
    const demandesBloqueesAvecReception = await prisma.demande.findMany({
      where: {
        status: "en_attente_validation_logistique",
        type: "outillage",
        dateReceptionLivreur: {
          not: null
        }
      },
      include: {
        technicien: {
          select: {
            nom: true,
            prenom: true
          }
        },
        livreurAssigne: {
          select: {
            nom: true,
            prenom: true
          }
        }
      }
    })

    const preview = demandesBloqueesAvecReception.map(d => ({
      id: d.id,
      numero: d.numero,
      type: d.type,
      demandeur: `${d.technicien.prenom} ${d.technicien.nom}`,
      livreur: d.livreurAssigne 
        ? `${d.livreurAssigne.prenom} ${d.livreurAssigne.nom}` 
        : "Non assigné",
      statusActuel: d.status,
      dateReception: d.dateReceptionLivreur,
      nouveauStatus: "en_attente_livraison"
    }))

    return NextResponse.json({
      success: true,
      count: preview.length,
      demandes: preview,
      message: `${preview.length} demande(s) seront migrées vers "en_attente_livraison"`
    })

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Erreur serveur" 
    }, { status: 500 })
  }
}

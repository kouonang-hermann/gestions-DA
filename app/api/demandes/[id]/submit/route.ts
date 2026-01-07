import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/middleware"

/**
 * Détermine le statut initial d'une demande selon son type et le rôle du créateur
 */
function getInitialStatus(type: "materiel" | "outillage", creatorRole: string): string {
  const flows = {
    materiel: [
      { status: "en_attente_validation_conducteur", role: "conducteur_travaux" },
      { status: "en_attente_validation_responsable_travaux", role: "responsable_travaux" },
      { status: "en_attente_validation_charge_affaire", role: "charge_affaire" },
      { status: "en_attente_preparation_appro", role: "responsable_appro" },
    ],
    outillage: [
      { status: "en_attente_validation_logistique", role: "responsable_logistique" },
      { status: "en_attente_validation_responsable_travaux", role: "responsable_travaux" },
      { status: "en_attente_validation_charge_affaire", role: "charge_affaire" },
      { status: "en_attente_preparation_appro", role: "responsable_appro" },
    ]
  }

  const skipRules: Record<string, string[]> = {
    "conducteur_travaux": ["en_attente_validation_conducteur"],
    "responsable_logistique": ["en_attente_validation_logistique"],
    "responsable_travaux": ["en_attente_validation_responsable_travaux"],
    "charge_affaire": ["en_attente_validation_charge_affaire"],
    "superadmin": []
  }

  const flow = flows[type]
  const stepsToSkip = skipRules[creatorRole] || []
  
  for (const step of flow) {
    if (!stepsToSkip.includes(step.status)) {
      return step.status
    }
  }
  
  return "en_attente_validation_finale_demandeur"
}

/**
 * POST /api/demandes/[id]/submit - Soumet un brouillon (change le statut de brouillon à soumis)
 */
export const POST = withAuth(async (request: NextRequest, currentUser: any, context: { params: Promise<{ id: string }> }) => {
  try {
    const params = await context.params
    
    // Récupérer le brouillon
    const demande = await prisma.demande.findUnique({
      where: { id: params.id }
    })

    if (!demande) {
      return NextResponse.json({ 
        success: false, 
        error: "Demande non trouvée" 
      }, { status: 404 })
    }

    // Vérifier que c'est bien le créateur
    if (demande.technicienId !== currentUser.id && currentUser.role !== "superadmin") {
      return NextResponse.json({ 
        success: false, 
        error: "Seul le créateur peut soumettre ce brouillon" 
      }, { status: 403 })
    }

    // Vérifier que c'est bien un brouillon
    if (demande.status !== "brouillon") {
      return NextResponse.json({ 
        success: false, 
        error: "Cette demande n'est pas un brouillon" 
      }, { status: 400 })
    }

    // Déterminer le statut initial selon le type et le rôle
    const initialStatus = getInitialStatus(demande.type as "materiel" | "outillage", currentUser.role)

    // Générer un vrai numéro de demande
    const year = new Date().getFullYear()
    const count = await prisma.demande.count({
      where: {
        numero: {
          not: {
            startsWith: "BROUILLON-"
          }
        }
      }
    })
    const numero = `DEM-${year}-${String(count + 1).padStart(4, "0")}`

    // Mettre à jour le brouillon
    const updatedDemande = await prisma.demande.update({
      where: { id: params.id },
      data: {
        numero,
        status: initialStatus as any,
        dateModification: new Date(),
      },
      include: {
        projet: {
          select: { id: true, nom: true }
        },
        technicien: {
          select: { id: true, nom: true, prenom: true, email: true }
        },
        items: {
          include: {
            article: true
          }
        }
      }
    })

    console.log(`📤 [API] Brouillon ${demande.numero} soumis → ${updatedDemande.numero} (statut: ${initialStatus}) par ${currentUser.nom}`)

    return NextResponse.json({
      success: true,
      data: updatedDemande,
    })
  } catch (error) {
    console.error("Erreur lors de la soumission du brouillon:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Erreur lors de la soumission du brouillon" 
    }, { status: 500 })
  }
})

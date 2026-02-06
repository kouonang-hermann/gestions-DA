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
      { status: "en_attente_preparation_logistique", role: "responsable_logistique" },
    ]
  }

  // LOGIQUE DIFFÉRENTE SELON LE TYPE DE DEMANDE (matériel vs outillage)
  const skipRules: Record<string, { materiel: string[], outillage: string[] }> = {
    // CONDUCTEUR (matériel uniquement)
    "conducteur_travaux": {
      materiel: ["en_attente_validation_conducteur"],
      outillage: [] // Pas dans le flow outillage
    },
    
    // RESPONSABLE LOGISTIQUE (outillage uniquement)
    "responsable_logistique": {
      materiel: [], // Pas dans le flow matériel
      outillage: [] // Ne saute rien, il valide 2 fois (validation + préparation)
    },
    
    // RESPONSABLE TRAVAUX
    "responsable_travaux": {
      // Matériel: saute Conducteur + lui-même (démarre au Chargé Affaire)
      materiel: [
        "en_attente_validation_conducteur",
        "en_attente_validation_responsable_travaux"
      ],
      // Outillage: ne saute RIEN (flow normal: Logistique → lui → Chargé Affaire)
      outillage: []
    },
    
    // CHARGÉ AFFAIRE
    "charge_affaire": {
      // Matériel: saute Conducteur + Resp. Travaux + lui-même (démarre à l'Appro)
      materiel: [
        "en_attente_validation_conducteur",
        "en_attente_validation_responsable_travaux",
        "en_attente_validation_charge_affaire"
      ],
      // Outillage: saute uniquement Resp. Travaux (Logistique → lui → Préparation Logistique)
      outillage: [
        "en_attente_validation_responsable_travaux"
      ]
    },
    
    // RESPONSABLE APPRO (matériel uniquement)
    "responsable_appro": {
      materiel: [
        "en_attente_validation_conducteur",
        "en_attente_validation_responsable_travaux",
        "en_attente_validation_charge_affaire"
      ],
      outillage: [] // Pas dans le flow outillage
    },
    
    // SUPERADMIN ne saute AUCUNE étape
    "superadmin": {
      materiel: [],
      outillage: []
    }
  }

  const flow = flows[type]
  const stepsToSkip = skipRules[creatorRole]?.[type] || []
  
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
    const typePrefix = demande.type === "materiel" ? "DA-M" : "DA-O"
    
    // Compter les demandes du même type pour l'année en cours
    const countThisYear = await prisma.demande.count({
      where: {
        numero: {
          startsWith: `${typePrefix}-${year}-`
        }
      }
    })
    
    const numero = `${typePrefix}-${year}-${String(countThisYear + 1).padStart(4, "0")}`

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


    return NextResponse.json({
      success: true,
      data: updatedDemande,
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: "Erreur lors de la soumission du brouillon" 
    }, { status: 500 })
  }
})

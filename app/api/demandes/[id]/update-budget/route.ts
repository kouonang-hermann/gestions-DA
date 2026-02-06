import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import crypto from "crypto"

/**
 * PUT /api/demandes/[id]/update-budget - Met à jour le budget prévisionnel d'une demande
 * Seul le chargé d'affaires peut utiliser cette API
 */
export const PUT = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: authResult.error }, { status: 401 })
  }

  const currentUser = authResult.user
  const { id: demandeId } = await params

  // Vérifier que l'utilisateur est chargé d'affaires ou superadmin
  if (currentUser.role !== "charge_affaire" && currentUser.role !== "superadmin") {
    return NextResponse.json(
      { success: false, error: "Seul le chargé d'affaires peut renseigner le budget prévisionnel" },
      { status: 403 }
    )
  }

  try {
    const body = await request.json()
    const { budgetPrevisionnel } = body

    if (budgetPrevisionnel === undefined || budgetPrevisionnel === null) {
      return NextResponse.json(
        { success: false, error: "Le budget prévisionnel est requis" },
        { status: 400 }
      )
    }

    const budget = parseFloat(budgetPrevisionnel)
    
    if (isNaN(budget) || budget < 0) {
      return NextResponse.json(
        { success: false, error: "Budget prévisionnel invalide" },
        { status: 400 }
      )
    }

    // Vérifier que la demande existe
    const demande = await prisma.demande.findUnique({
      where: { id: demandeId },
      include: {
        projet: {
          include: {
            utilisateurs: true
          }
        }
      }
    })

    if (!demande) {
      return NextResponse.json(
        { success: false, error: "Demande introuvable" },
        { status: 404 }
      )
    }

    // Vérifier que le chargé d'affaires est assigné au projet (sauf superadmin)
    if (currentUser.role !== "superadmin") {
      const isAssigned = demande.projet.utilisateurs.some(
        (up: any) => up.userId === currentUser.id
      )

      if (!isAssigned) {
        return NextResponse.json(
          { success: false, error: "Vous n'êtes pas assigné au projet de cette demande" },
          { status: 403 }
        )
      }
    }

    // Vérifier que la demande est au bon statut
    const allowedStatuses = [
      "en_attente_validation_charge_affaire",
      "en_attente_preparation_appro",
      "en_attente_validation_logistique",
      "en_attente_validation_finale_demandeur",
      "confirmee_demandeur",
      "cloturee"
    ]

    if (!allowedStatuses.includes(demande.status)) {
      return NextResponse.json(
        { success: false, error: "Le budget prévisionnel ne peut être renseigné qu'à partir de l'étape chargé d'affaires" },
        { status: 400 }
      )
    }

    // Mettre à jour le budget prévisionnel
    const updatedDemande = await prisma.demande.update({
      where: { id: demandeId },
      data: { budgetPrevisionnel: budget },
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

    // Créer une entrée dans l'historique
    await prisma.historyEntry.create({
      data: {
        id: crypto.randomUUID(),
        demandeId,
        userId: currentUser.id,
        action: "Mise à jour du budget prévisionnel",
        commentaire: `Budget prévisionnel: ${budget.toFixed(2)} €`,
        signature: `budget-update-${Date.now()}`,
      }
    })


    return NextResponse.json({
      success: true,
      message: "Budget prévisionnel mis à jour avec succès",
      data: {
        demandeId,
        budgetPrevisionnel: budget
      }
    })

  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { requireAuth } from "@/lib/auth"

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      )
    }
    
    const currentUser = authResult.user
    
    // Vérifier que l'utilisateur est responsable appro
    if (currentUser.role !== "responsable_appro") {
      return NextResponse.json(
        { success: false, error: "Non autorisé" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { quantitesSorties } = body // Format: { itemId: quantite }
    const params = await context.params
    const demandeId = params.id


    // Vérifier que la demande existe
    const demande = await prisma.demande.findUnique({
      where: { id: demandeId },
      include: { items: true }
    })

    if (!demande) {
      return NextResponse.json(
        { success: false, error: "Demande non trouvée" },
        { status: 404 }
      )
    }

    // Mettre à jour les quantités sorties pour chaque article
    if (quantitesSorties && typeof quantitesSorties === 'object') {
      for (const [itemId, quantite] of Object.entries(quantitesSorties)) {
        await prisma.itemDemande.update({
          where: { id: itemId },
          data: {
            quantiteSortie: quantite as number
          }
        })
      }
    }


    return NextResponse.json({
      success: true,
      message: "Quantités livrées enregistrées avec succès"
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

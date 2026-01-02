import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { requireAuth } from "@/lib/auth"

const prisma = new PrismaClient()

export async function PUT(
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

    const { items } = await request.json()
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
    for (const itemData of items) {
      await prisma.itemDemande.update({
        where: { id: itemData.itemId },
        data: {
          quantiteSortie: itemData.quantiteSortie
        }
      })
    }

    console.log(`✅ [UPDATE-DELIVERY] Quantités livrées mises à jour pour la demande ${demande.numero}`)

    return NextResponse.json({
      success: true,
      message: "Quantités livrées enregistrées avec succès"
    })
  } catch (error) {
    console.error("❌ [UPDATE-DELIVERY] Erreur:", error)
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

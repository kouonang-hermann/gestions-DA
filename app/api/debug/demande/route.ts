import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const numero = searchParams.get('numero')

    if (!numero) {
      return NextResponse.json({ error: "Numéro de demande requis" }, { status: 400 })
    }

    console.log(`🔍 [DEBUG-API] Recherche de la demande: ${numero}`)

    // Rechercher la demande avec toutes ses relations
    const demande = await prisma.demande.findFirst({
      where: {
        OR: [
          { numero: numero },
          { numero: { contains: numero } }
        ]
      },
      include: {
        technicien: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            role: true
          }
        },
        livreurAssigne: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            role: true
          }
        },
        projet: {
          select: {
            id: true,
            nom: true
          }
        },
        items: true
      }
    })

    if (!demande) {
      console.log(`❌ [DEBUG-API] Demande ${numero} non trouvée`)
      return NextResponse.json({ error: "Demande non trouvée" }, { status: 404 })
    }

    console.log(`✅ [DEBUG-API] Demande trouvée:`, {
      numero: demande.numero,
      status: demande.status,
      type: demande.type,
      technicienId: demande.technicienId,
      technicienNom: demande.technicien?.nom,
      livreurAssigneId: demande.livreurAssigneId,
      livreurNom: demande.livreurAssigne?.nom,
      projetId: demande.projetId,
      projetNom: demande.projet?.nom
    })

    return NextResponse.json({
      success: true,
      demande: {
        id: demande.id,
        numero: demande.numero,
        status: demande.status,
        type: demande.type,
        technicienId: demande.technicienId,
        technicien: demande.technicien,
        livreurAssigneId: demande.livreurAssigneId,
        livreurAssigne: demande.livreurAssigne,
        projetId: demande.projetId,
        projet: demande.projet,
        dateCreation: demande.dateCreation,
        dateReceptionLivreur: demande.dateReceptionLivreur,
        dateLivraison: demande.dateLivraison,
        items: demande.items
      }
    })
  } catch (error) {
    console.error("❌ [DEBUG-API] Erreur:", error)
    return NextResponse.json({ 
      error: "Erreur serveur", 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

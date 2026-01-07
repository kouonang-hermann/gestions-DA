import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/middleware"

/**
 * PUT /api/demandes/[id]/edit - Modifie une demande non encore validée
 * Permet au demandeur de modifier sa demande tant qu'elle n'a pas été validée
 * Statuts autorisés : brouillon, soumise, en_attente_validation_conducteur, en_attente_validation_qhse
 */
export const PUT = withAuth(async (request: NextRequest, currentUser: any, context: { params: Promise<{ id: string }> }) => {
  try {
    const params = await context.params
    const body = await request.json()

    // Récupérer la demande actuelle
    const demande = await prisma.demande.findUnique({
      where: { id: params.id },
      include: {
        items: true
      }
    })

    if (!demande) {
      return NextResponse.json({ success: false, error: "Demande non trouvée" }, { status: 404 })
    }

    // Vérifier que c'est bien le demandeur ou un superadmin
    if (demande.technicienId !== currentUser.id && currentUser.role !== "superadmin") {
      return NextResponse.json({ 
        success: false, 
        error: "Seul le demandeur peut modifier sa demande" 
      }, { status: 403 })
    }

    // Vérifier que la demande n'a pas encore été validée par un niveau supérieur
    const editableStatuses = [
      "brouillon",
      "soumise",
      "en_attente_validation_conducteur",
      "en_attente_validation_qhse"
    ]

    if (!editableStatuses.includes(demande.status)) {
      return NextResponse.json({ 
        success: false, 
        error: "Cette demande ne peut plus être modifiée car elle a déjà été validée par un niveau supérieur" 
      }, { status: 403 })
    }

    // Supprimer les anciens items
    await prisma.itemDemande.deleteMany({
      where: { demandeId: params.id }
    })

    // Créer les nouveaux items
    const items = body.items || []
    for (const item of items) {
      // Créer ou récupérer l'article
      let article = await prisma.article.findFirst({
        where: {
          reference: item.article.reference,
          nom: item.article.nom
        }
      })

      if (!article) {
        article = await prisma.article.create({
          data: {
            nom: item.article.nom,
            description: item.article.description || "",
            reference: item.article.reference,
            unite: item.article.unite,
            type: item.article.type,
          }
        })
      }

      // Créer l'item de demande
      await prisma.itemDemande.create({
        data: {
          demandeId: params.id,
          articleId: article.id,
          quantiteDemandee: item.quantiteDemandee,
          commentaire: item.commentaire,
        }
      })
    }

    // Mettre à jour les autres champs de la demande
    const updatedDemande = await prisma.demande.update({
      where: { id: params.id },
      data: {
        projetId: body.projetId || demande.projetId,
        commentaires: body.commentaires !== undefined ? body.commentaires : demande.commentaires,
        dateLivraisonSouhaitee: body.dateLivraisonSouhaitee 
          ? new Date(body.dateLivraisonSouhaitee) 
          : demande.dateLivraisonSouhaitee,
        dateModification: new Date(),
      },
      include: {
        items: {
          include: {
            article: true
          }
        },
        projet: true,
        technicien: true
      }
    })

    console.log(`✅ [API] Demande ${demande.numero} modifiée par ${currentUser.nom}`)

    return NextResponse.json({
      success: true,
      data: updatedDemande,
    })
  } catch (error) {
    console.error("Erreur lors de la modification de la demande:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
})

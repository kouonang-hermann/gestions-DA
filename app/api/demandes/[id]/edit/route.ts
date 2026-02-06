import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/middleware"
import crypto from "crypto"

/**
 * PUT /api/demandes/[id]/edit - Modifie une demande non encore validée
 * Permet au demandeur de modifier sa demande tant qu'elle n'a pas été validée
 * Statuts autorisés : brouillon, soumise, en_attente_validation_conducteur, en_attente_validation_logistique
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
      "en_attente_validation_logistique"
    ]

    if (!editableStatuses.includes(demande.status)) {
      return NextResponse.json({ 
        success: false, 
        error: "Cette demande ne peut plus être modifiée car elle a déjà été validée par un niveau supérieur" 
      }, { status: 403 })
    }

    // Préparer les données pour création en batch
    const items = body.items || []
    const articlesData: any[] = []
    const itemsData: any[] = []

    // Récupérer tous les articles existants en une seule requête
    const existingArticles = await prisma.article.findMany({
      where: {
        OR: items.map((item: any) => ({
          reference: item.article.reference,
          nom: item.article.nom
        }))
      }
    })

    // Préparer les données pour création
    for (const item of items) {
      let articleId: string

      // Si l'item a déjà un articleId (modification d'un item existant), le réutiliser
      if (item.articleId && !item.articleId.startsWith('temp-')) {
        articleId = item.articleId
      } else {
        // Chercher si l'article existe déjà dans la base
        const existingArticle = existingArticles.find(a => 
          a.reference === item.article.reference && 
          a.nom === item.article.nom
        )

        if (existingArticle) {
          // Réutiliser l'article existant
          articleId = existingArticle.id
        } else {
          // Créer un nouvel article seulement si nécessaire
          articleId = crypto.randomUUID()
          articlesData.push({
            id: articleId,
            nom: item.article.nom,
            description: item.article.description || "",
            reference: item.article.reference,
            unite: item.article.unite,
            type: item.article.type,
            updatedAt: new Date(),
          })
        }
      }

      // Préparer l'item de demande
      itemsData.push({
        id: crypto.randomUUID(),
        demandeId: params.id,
        articleId: articleId,
        quantiteDemandee: item.quantiteDemandee,
        commentaire: item.commentaire,
      })
    }

    // Utiliser une transaction pour garantir la cohérence
    await prisma.$transaction(async (tx) => {
      // Supprimer les anciens items
      await tx.itemDemande.deleteMany({
        where: { demandeId: params.id }
      })

      // Créer tous les nouveaux articles en batch
      if (articlesData.length > 0) {
        await tx.article.createMany({
          data: articlesData
        })
      }

      // Créer tous les items en batch
      await tx.itemDemande.createMany({
        data: itemsData
      })
    })

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

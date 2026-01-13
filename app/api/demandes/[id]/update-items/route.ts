import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/middleware"

/**
 * PATCH /api/demandes/[id] - Met à jour les données d'une demande rejetée
 * Permet au demandeur de modifier sa demande avant de la renvoyer
 */
export const PATCH = withAuth(async (request: NextRequest, currentUser: any, context: { params: Promise<{ id: string }> }) => {
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

    // Vérifier les permissions selon le rôle et le statut
    const isOwner = demande.technicienId === currentUser.id
    const isSuperAdmin = currentUser.role === "superadmin"
    const isConducteur = currentUser.role === "conducteur_travaux"
    const isResponsableTravaux = currentUser.role === "responsable_travaux"
    
    // Statuts où la modification est autorisée
    const modifiableStatuses = [
      "rejetee", // Demandeur peut modifier après rejet
      "en_attente_validation_conducteur", // Conducteur peut modifier avant validation
      "en_attente_validation_responsable_travaux", // Responsable travaux peut modifier avant validation
    ]
    
    // Vérifier les permissions
    if (!isSuperAdmin) {
      // Le demandeur peut modifier sa demande rejetée
      if (isOwner && demande.status === "rejetee") {
        // OK
      }
      // Le conducteur peut modifier les demandes en attente de sa validation
      else if (isConducteur && demande.status === "en_attente_validation_conducteur") {
        // OK
      }
      // Le responsable travaux peut modifier les demandes en attente de sa validation
      else if (isResponsableTravaux && demande.status === "en_attente_validation_responsable_travaux") {
        // OK
      }
      else {
        return NextResponse.json({ 
          success: false, 
          error: "Vous n'avez pas la permission de modifier cette demande" 
        }, { status: 403 })
      }
    }
    
    // Vérifier que la demande est dans un statut modifiable
    if (!modifiableStatuses.includes(demande.status)) {
      return NextResponse.json({ 
        success: false, 
        error: `Cette demande ne peut pas être modifiée (statut: ${demande.status})` 
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
    console.error("Erreur lors de la mise à jour de la demande:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
})

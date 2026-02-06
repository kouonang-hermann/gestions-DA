import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/middleware"
import crypto from "crypto"

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
    const isChargeAffaire = currentUser.role === "charge_affaire"
    const isResponsableLogistique = currentUser.role === "responsable_logistique"
    
    // Statuts où la modification est autorisée (pour les non-superadmin)
    const modifiableStatuses = [
      "rejetee", // Demandeur peut modifier après rejet
      "en_attente_validation_conducteur", // Conducteur peut modifier avant validation
      "en_attente_validation_responsable_travaux", // Responsable travaux peut modifier avant validation
      "en_attente_validation_charge_affaire", // Chargé d'affaire peut modifier avant validation
      "en_attente_validation_logistique", // Responsable logistique peut modifier avant validation
    ]
    
    // Superadmin peut tout modifier, sinon vérifier les permissions
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
      // Le chargé d'affaire peut modifier les demandes en attente de sa validation
      else if (isChargeAffaire && demande.status === "en_attente_validation_charge_affaire") {
        // OK
      }
      // Le responsable logistique peut modifier les demandes en attente de sa validation
      else if (isResponsableLogistique && demande.status === "en_attente_validation_logistique") {
        // OK
      }
      else {
        return NextResponse.json({ 
          success: false, 
          error: "Vous n'avez pas la permission de modifier cette demande" 
        }, { status: 403 })
      }
      
      // Vérifier que la demande est dans un statut modifiable
      if (!modifiableStatuses.includes(demande.status)) {
        return NextResponse.json({ 
          success: false, 
          error: `Cette demande ne peut pas être modifiée (statut: ${demande.status})` 
        }, { status: 403 })
      }
    }

    // Préparer les données pour création en batch
    const items = body.items || []
    const articlesData = items.map((item: any) => ({
      id: crypto.randomUUID(),
      nom: item.article.nom,
      description: item.article.description || "",
      reference: item.article.reference?.trim() || null,
      unite: item.article.unite,
      type: item.article.type,
      updatedAt: new Date(),
    }))

    // Utiliser une transaction pour garantir la cohérence
    await prisma.$transaction(async (tx) => {
      // Supprimer les anciens items
      await tx.itemDemande.deleteMany({
        where: { demandeId: params.id }
      })

      // Créer tous les articles en batch
      if (articlesData.length > 0) {
        await tx.article.createMany({
          data: articlesData
        })

        // Créer tous les items de demande en batch
        const itemsData = items.map((item: any, index: number) => ({
          id: crypto.randomUUID(),
          demandeId: params.id,
          articleId: articlesData[index].id,
          quantiteDemandee: item.quantiteDemandee,
          commentaire: item.commentaire,
        }))

        await tx.itemDemande.createMany({
          data: itemsData
        })
      }
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


    return NextResponse.json({
      success: true,
      data: updatedDemande,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
})

import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/middleware"
import type { DemandeStatus } from "@/types"
import { getModificationPermissions, canModifyRejectedDemande } from "@/lib/workflow-utils"

/**
 * PUT /api/demandes/[id]/modify - Modifie une demande rejetée
 * Permet au valideur précédent de modifier la demande et la renvoyer
 */
export const PUT = withAuth(async (request: NextRequest, currentUser: any, context: { params: Promise<{ id: string }> }) => {
  try {
    const params = await context.params
    const body = await request.json()

    console.log(`🔧 [MODIFY] Tentative de modification de la demande ${params.id} par ${currentUser.role}`)

    // Récupérer la demande actuelle
    const demande = await prisma.demande.findUnique({
      where: { id: params.id },
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

    if (!demande) {
      return NextResponse.json({ success: false, error: "Demande non trouvée" }, { status: 404 })
    }

    // Vérifier que l'utilisateur peut modifier cette demande
    const canModify = canModifyRejectedDemande(
      currentUser.role,
      demande.status as DemandeStatus,
      demande.technicienId,
      currentUser.id
    )

    if (!canModify) {
      return NextResponse.json({ 
        success: false, 
        error: "Vous n'avez pas les permissions pour modifier cette demande" 
      }, { status: 403 })
    }

    // Obtenir les permissions de modification selon le rôle
    const permissions = getModificationPermissions(currentUser.role, demande.status as DemandeStatus)

    console.log(`🔑 [MODIFY] Permissions pour ${currentUser.role}:`, permissions)

    // Préparer les données de mise à jour
    const updateData: any = {
      dateModification: new Date(),
    }

    // Mettre à jour les commentaires (toujours autorisé)
    if (body.commentaires !== undefined && permissions.canModifyComments) {
      updateData.commentaires = body.commentaires
    }

    // Mettre à jour la date de besoin (selon permissions)
    if (body.dateLivraisonSouhaitee !== undefined && permissions.canModifyDateBesoin) {
      updateData.dateLivraisonSouhaitee = new Date(body.dateLivraisonSouhaitee)
    }

    // Mettre à jour les items (articles et quantités)
    if (body.items && Array.isArray(body.items)) {
      // Supprimer les anciens items
      await prisma.itemDemande.deleteMany({
        where: { demandeId: params.id }
      })

      // Créer les nouveaux items
      const processedItems = []
      
      for (const item of body.items) {
        let articleId = item.articleId

        // Vérifier les permissions pour modifier les articles
        if (!permissions.canModifyArticles && item.articleId.startsWith('manual-')) {
          return NextResponse.json({ 
            success: false, 
            error: "Vous n'avez pas la permission d'ajouter de nouveaux articles" 
          }, { status: 403 })
        }

        // Si c'est un article manuel, le créer
        if (item.articleId.startsWith('manual-') && item.article) {
          const newArticle = await prisma.article.create({
            data: {
              nom: item.article.nom,
              description: item.article.description || '',
              reference: item.article.reference?.trim() || null,
              unite: item.article.unite,
              type: demande.type,
              stock: null,
              prixUnitaire: null,
            }
          })
          articleId = newArticle.id
        }

        // Vérifier les permissions pour modifier les quantités
        if (!permissions.canModifyQuantities && item.quantiteDemandee !== undefined) {
          // Vérifier que la quantité n'a pas changé
          const originalItem = demande.items.find(i => i.articleId === articleId)
          if (originalItem && originalItem.quantiteDemandee !== item.quantiteDemandee) {
            return NextResponse.json({ 
              success: false, 
              error: "Vous n'avez pas la permission de modifier les quantités" 
            }, { status: 403 })
          }
        }
        
        processedItems.push({
          articleId,
          quantiteDemandee: item.quantiteDemandee,
          commentaire: item.commentaire || null,
        })
      }

      // Créer les nouveaux items
      await prisma.itemDemande.createMany({
        data: processedItems.map(item => ({
          ...item,
          demandeId: params.id
        }))
      })
    }

    // Déterminer le nouveau statut (avancer d'un statut après modification)
    let newStatus = demande.statusPrecedent as DemandeStatus || demande.status as DemandeStatus
    
    // Si statusPrecedent existe, cela signifie que la demande a été rejetée
    // On la remet au statut d'où elle venait (avant le rejet)
    if (demande.statusPrecedent) {
      newStatus = demande.statusPrecedent as DemandeStatus
      updateData.statusPrecedent = null // Réinitialiser
      console.log(`↗️ [MODIFY] Renvoi de la demande au statut: ${newStatus}`)
    }

    updateData.status = newStatus

    // Mettre à jour la demande
    const updatedDemande = await prisma.demande.update({
      where: { id: params.id },
      data: updateData,
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
        demandeId: params.id,
        userId: currentUser.id,
        action: `Demande modifiée après rejet par ${currentUser.role}`,
        ancienStatus: demande.status as DemandeStatus,
        nouveauStatus: newStatus,
        commentaire: body.commentaires || "Modifications apportées suite au rejet",
        signature: `${currentUser.role}-modify-${Date.now()}`,
      }
    })

    // Notifier le valideur suivant
    const { notificationService } = await import('@/services/notificationService')
    const users = await prisma.user.findMany({
      include: {
        projets: {
          include: {
            projet: true
          }
        }
      }
    })
    
    const transformedUsers = users.map(u => ({
      ...u,
      projets: u.projets.map(up => up.projet.id)
    }))
    
    await notificationService.handleStatusChange(
      updatedDemande as any,
      demande.status as any,
      newStatus as any,
      transformedUsers as any
    )

    console.log(`✅ [MODIFY] Demande ${demande.numero} modifiée et renvoyée: ${demande.status} → ${newStatus}`)

    return NextResponse.json({
      success: true,
      data: updatedDemande,
      message: "Demande modifiée et renvoyée avec succès"
    })
  } catch (error) {
    console.error("Erreur lors de la modification de la demande:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
})

import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import crypto from "crypto"

/**
 * DELETE /api/demandes/[id]/remove-item - Supprime un article d'une demande
 */
export const DELETE = async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const params = await context.params
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: 401 })
    }
    
    const currentUser = authResult.user

    const { itemId, justification } = await request.json()

    if (!itemId) {
      return NextResponse.json({ 
        success: false, 
        error: "L'ID de l'article est requis" 
      }, { status: 400 })
    }

    if (!justification || justification.trim().length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: "Une justification est requise pour supprimer un article" 
      }, { status: 400 })
    }

    // Récupérer la demande avec ses items
    const demande = await prisma.demande.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            article: true
          }
        },
        technicien: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true
          }
        },
        projet: {
          select: {
            id: true,
            nom: true
          }
        }
      }
    })

    if (!demande) {
      return NextResponse.json({ 
        success: false, 
        error: "Demande non trouvée" 
      }, { status: 404 })
    }

    // Vérifier les permissions selon le rôle et le statut de la demande
    const allowedRoles = ["conducteur_travaux", "responsable_travaux", "charge_affaire"]
    if (!allowedRoles.includes(currentUser.role)) {
      return NextResponse.json({ 
        success: false, 
        error: "Vous n'avez pas les permissions pour supprimer des articles" 
      }, { status: 403 })
    }

    // Vérifier que le statut de la demande permet la modification
    const allowedStatuses = [
      "en_attente_validation_conducteur",
      "en_attente_validation_responsable_travaux", 
      "en_attente_validation_charge_affaire"
    ]
    
    if (!allowedStatuses.includes(demande.status)) {
      return NextResponse.json({ 
        success: false, 
        error: "La demande ne peut plus être modifiée à ce stade" 
      }, { status: 400 })
    }

    // Vérifier que l'article existe dans la demande
    const itemToRemove = demande.items.find(item => item.id === itemId)
    if (!itemToRemove) {
      return NextResponse.json({ 
        success: false, 
        error: "Article non trouvé dans cette demande" 
      }, { status: 404 })
    }

    // Vérifier qu'il reste au moins un article après suppression
    if (demande.items.length <= 1) {
      return NextResponse.json({ 
        success: false, 
        error: "Impossible de supprimer le dernier article de la demande. Rejetez plutôt la demande complète." 
      }, { status: 400 })
    }

    // Supprimer l'article de la demande
    await prisma.itemDemande.delete({
      where: { id: itemId }
    })

    // Créer une entrée d'historique
    await prisma.historyEntry.create({
      data: {
        id: crypto.randomUUID(),
        demandeId: demande.id,
        userId: currentUser.id,
        action: "ARTICLE_SUPPRIME",
        commentaire: `Article "${itemToRemove.article.nom}" (${itemToRemove.article.reference}) supprimé par ${currentUser.prenom} ${currentUser.nom}. Justification: ${justification}`,
        signature: `${currentUser.id}_${Date.now()}`,
        ancienStatus: demande.status as any,
        nouveauStatus: demande.status as any
      }
    })

    // Créer une notification pour le demandeur
    await prisma.notification.create({
      data: {
        id: crypto.randomUUID(),
        userId: demande.technicienId,
        titre: "Article supprimé de votre demande",
        message: `L'article "${itemToRemove.article.nom}" (${itemToRemove.article.reference}) a été supprimé de votre demande ${demande.numero} par ${currentUser.prenom} ${currentUser.nom}. Justification: ${justification}`,
        lu: false
      }
    })

    // Récupérer la demande mise à jour
    const demandeUpdated = await prisma.demande.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            article: true
          }
        },
        technicien: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true
          }
        },
        projet: {
          select: {
            id: true,
            nom: true
          }
        },
        validationSignatures: true,
        history: {
          include: {
            user: {
              select: {
                id: true,
                nom: true,
                prenom: true
              }
            }
          },
          orderBy: { timestamp: 'desc' }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        demande: demandeUpdated,
        articleSupprime: {
          id: itemToRemove.id,
          nom: itemToRemove.article.nom,
          reference: itemToRemove.article.reference,
          quantiteDemandee: itemToRemove.quantiteDemandee
        },
        suppressionPar: {
          id: currentUser.id,
          nom: currentUser.nom,
          prenom: currentUser.prenom,
          role: currentUser.role
        },
        justification
      },
      message: `Article "${itemToRemove.article.nom}" supprimé avec succès de la demande ${demande.numero}`
    })

  } catch (error) {
    console.error("Erreur lors de la suppression de l'article:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Erreur serveur lors de la suppression de l'article" 
    }, { status: 500 })
  }
}

/**
 * GET /api/demandes/[id]/remove-item - Récupère les informations sur les articles supprimables
 */
export const GET = async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const params = await context.params
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: 401 })
    }
    
    const currentUser = authResult.user

    // Récupérer la demande avec ses items
    const demande = await prisma.demande.findUnique({
      where: { id: params.id },
      include: {
        items: {
          include: {
            article: true
          }
        }
      }
    })

    if (!demande) {
      return NextResponse.json({ 
        success: false, 
        error: "Demande non trouvée" 
      }, { status: 404 })
    }

    // Vérifier les permissions
    const allowedRoles = ["conducteur_travaux", "responsable_travaux", "charge_affaire"]
    const canRemoveItems = allowedRoles.includes(currentUser.role)

    // Vérifier le statut
    const allowedStatuses = [
      "en_attente_validation_conducteur",
      "en_attente_validation_responsable_travaux", 
      "en_attente_validation_charge_affaire"
    ]
    const statusAllowsRemoval = allowedStatuses.includes(demande.status)

    // Déterminer quels articles peuvent être supprimés
    const removableItems = demande.items.map(item => ({
      ...item,
      canBeRemoved: canRemoveItems && statusAllowsRemoval && demande.items.length > 1
    }))

    return NextResponse.json({
      success: true,
      data: {
        demande: {
          id: demande.id,
          numero: demande.numero,
          status: demande.status,
          type: demande.type
        },
        items: removableItems,
        permissions: {
          canRemoveItems,
          statusAllowsRemoval,
          minimumItemsReached: demande.items.length <= 1
        },
        currentUser: {
          id: currentUser.id,
          role: currentUser.role
        }
      }
    })

  } catch (error) {
    console.error("Erreur lors de la récupération des informations:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Erreur serveur" 
    }, { status: 500 })
  }
}

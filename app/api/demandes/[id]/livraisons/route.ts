import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { getDemandeDeliveryStatus, getDemandeWithLivraisons } from "@/lib/livraison-utils"
import crypto from "crypto"

/**
 * GET /api/demandes/[id]/livraisons - Récupère toutes les livraisons d'une demande
 */
export const GET = async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const params = await context.params
    const currentUser = await getCurrentUser(request)
    
    if (!currentUser) {
      return NextResponse.json({ 
        success: false, 
        error: "Non autorisé" 
      }, { status: 401 })
    }
    
    // Récupérer les livraisons
    const livraisons = await prisma.livraison.findMany({
      where: { demandeId: params.id },
      include: {
        items: {
          include: {
            itemDemande: {
              include: { article: true }
            }
          }
        },
        livreur: {
          select: { id: true, nom: true, prenom: true }
        }
      },
      orderBy: { dateCreation: 'desc' }
    })
    
    // Calculer le statut de livraison
    const deliveryStatus = await getDemandeDeliveryStatus(params.id)
    
    return NextResponse.json({
      success: true,
      data: { 
        livraisons, 
        deliveryStatus 
      }
    })
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: "Erreur serveur" 
    }, { status: 500 })
  }
}

/**
 * POST /api/demandes/[id]/livraisons - Crée une nouvelle livraison
 */
export const POST = async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
  try {
    const params = await context.params
    const currentUser = await getCurrentUser(request)
    
    if (!currentUser) {
      return NextResponse.json({ 
        success: false, 
        error: "Non autorisé" 
      }, { status: 401 })
    }
    
    // Vérifier que l'utilisateur a les permissions (appro ou admin)
    if (!["responsable_appro", "superadmin"].includes(currentUser.role)) {
      return NextResponse.json({ 
        success: false, 
        error: "Seul le responsable appro peut créer des livraisons" 
      }, { status: 403 })
    }
    
    const { items, livreurId, commentaire } = await request.json()
    
    // Vérifier que la demande existe et est en attente de préparation
    const demande = await prisma.demande.findUnique({
      where: { id: params.id },
      include: { items: true }
    })
    
    if (!demande) {
      return NextResponse.json({ 
        success: false, 
        error: "Demande non trouvée" 
      }, { status: 404 })
    }
    
    if (demande.status !== "en_attente_preparation_appro") {
      return NextResponse.json({ 
        success: false, 
        error: "La demande doit être en attente de préparation" 
      }, { status: 400 })
    }
    
    // Créer la livraison avec transaction pour mettre à jour les quantités livrées
    const livraison = await prisma.$transaction(async (tx) => {
      // 1. Créer la livraison
      const newLivraison = await tx.livraison.create({
        data: {
          id: crypto.randomUUID(),
          demandeId: demande.id,
          livreurId: livreurId || currentUser.id,
          commentaire,
          statut: "prete",
          items: {
            create: items.map((item: any) => ({
              id: crypto.randomUUID(),
              itemDemandeId: item.itemDemandeId,
              quantiteLivree: item.quantiteLivree
            }))
          }
        },
        include: { 
          items: {
            include: {
              itemDemande: {
                include: { article: true }
              }
            }
          },
          livreur: {
            select: { id: true, nom: true, prenom: true }
          }
        }
      })

      // 2. Mettre à jour quantiteLivreeTotal pour chaque ItemDemande
      for (const item of items) {
        await tx.itemDemande.update({
          where: { id: item.itemDemandeId },
          data: {
            quantiteLivreeTotal: {
              increment: item.quantiteLivree
            }
          }
        })
      }

      return newLivraison
    })
    
    // Vérifier si c'est une livraison complète
    const deliveryStatus = await getDemandeDeliveryStatus(demande.id)
    
    // Si livraison complète, passer au statut suivant
    if (deliveryStatus.estComplete) {
      await prisma.demande.update({
        where: { id: demande.id },
        data: { 
          status: "en_attente_reception_livreur",
          livreurAssigneId: livreurId || currentUser.id
        }
      })
    }
    
    return NextResponse.json({
      success: true,
      data: { livraison, deliveryStatus },
      message: deliveryStatus.estComplete 
        ? "Livraison créée et demande passée en attente de réception livreur"
        : "Livraison partielle créée. Il reste des quantités à livrer."
    })
    
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: "Erreur serveur" 
    }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/middleware"
import crypto from "crypto"

/**
 * POST /api/demandes/brouillon - Sauvegarde un brouillon de demande
 * Permet de sauvegarder une demande en cours d'édition sans la soumettre
 */
export const POST = withAuth(async (request: NextRequest, currentUser: any) => {
  try {
    const body = await request.json()

    // Vérifier que l'utilisateur a accès au projet
    if (body.projetId) {
      const projet = await prisma.projet.findFirst({
        where: {
          id: body.projetId,
          utilisateurs: { some: { userId: currentUser.id } }
        }
      })

      if (!projet && currentUser.role !== "superadmin") {
        return NextResponse.json({ 
          success: false, 
          error: "Vous n'avez pas accès à ce projet" 
        }, { status: 403 })
      }
    }

    // Générer un numéro de demande temporaire
    const year = new Date().getFullYear()
    const count = await prisma.demande.count()
    const numero = `BROUILLON-${year}-${String(count + 1).padStart(4, "0")}`

    // Traiter les articles
    const processedItems = []
    
    for (const item of body.items || []) {
      let articleId = item.articleId || `manual-${item.id}`
      
      // Si c'est un article manuel, le créer
      if (articleId.startsWith('manual-') && item.article) {
        const newArticle = await prisma.article.create({
          data: {
            id: crypto.randomUUID(),
            nom: item.article.nom,
            description: item.article.description || '',
            reference: item.article.reference?.trim() || null,
            unite: item.article.unite,
            type: body.type,
            stock: null,
            prixUnitaire: null,
            updatedAt: new Date(),
          }
        })
        articleId = newArticle.id
      }
      
      processedItems.push({
        id: crypto.randomUUID(),
        articleId,
        quantiteDemandee: item.quantiteDemandee,
        commentaire: item.commentaire || null,
      })
    }

    // Créer le brouillon
    const brouillon = await prisma.demande.create({
      data: {
        id: crypto.randomUUID(),
        numero,
        projetId: body.projetId,
        technicienId: currentUser.id,
        type: body.type,
        status: "brouillon" as any,
        commentaires: body.commentaires || null,
        dateLivraisonSouhaitee: body.dateLivraisonSouhaitee 
          ? new Date(body.dateLivraisonSouhaitee) 
          : null,
        dateModification: new Date(),
        items: {
          create: processedItems
        }
      },
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


    return NextResponse.json({
      success: true,
      data: brouillon,
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: "Erreur lors de la sauvegarde du brouillon" 
    }, { status: 500 })
  }
})

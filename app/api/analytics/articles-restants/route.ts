import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

/**
 * TABLEAU 2 – DÉTAIL DES ARTICLES RESTANTS
 * 
 * Une ligne = (Projet, Demande, Article)
 * 
 * Colonnes :
 * - Projet
 * - Référence article
 * - Désignation
 * - Quantité demandée
 * - Quantité livrée
 * - Quantité restante
 * - Prix unitaire (lié à la demande)
 * - Coût restant = quantité restante × prix unitaire
 * - Numéro de demande
 * 
 * Contraintes :
 * - Si un article apparaît dans plusieurs demandes, il apparaît sur plusieurs lignes
 * - Le coût est calculé ligne par ligne
 * - Le total par projet est la somme des coûts restants du projet
 * - Un total global doit être calculable
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    
    if (!currentUser) {
      return NextResponse.json({ 
        success: false, 
        error: "Non autorisé" 
      }, { status: 401 })
    }

    // Paramètres de filtrage optionnels
    const { searchParams } = new URL(request.url)
    const projetId = searchParams.get("projetId")
    const type = searchParams.get("type") // "materiel" ou "outillage"

    // Construire le filtre
    const whereClause: any = {
      status: {
        notIn: ["brouillon", "rejetee", "archivee"]
      }
    }

    if (projetId) {
      whereClause.projetId = projetId
    }

    if (type && ["materiel", "outillage"].includes(type)) {
      whereClause.type = type
    }

    // Récupérer toutes les demandes avec leurs items et articles
    const demandes = await prisma.demande.findMany({
      where: whereClause,
      include: {
        projet: {
          select: {
            id: true,
            nom: true
          }
        },
        items: {
          include: {
            article: {
              select: {
                id: true,
                nom: true,
                reference: true,
                description: true,
                unite: true
              }
            }
          }
        }
      },
      orderBy: {
        dateCreation: "desc"
      }
    })

    // Construire la liste des articles restants
    const articlesRestants: Array<{
      projetId: string
      projetNom: string
      demandeId: string
      demandeNumero: string
      demandeType: string
      articleId: string
      articleReference: string | null
      articleDesignation: string
      articleUnite: string
      quantiteDemandee: number
      quantiteLivree: number
      quantiteRestante: number
      prixUnitaire: number | null
      coutRestant: number
    }> = []

    for (const demande of demandes) {
      for (const item of demande.items) {
        const quantiteLivree = item.quantiteLivreeTotal || 0
        const quantiteRestante = item.quantiteDemandee - quantiteLivree
        
        // Inclure uniquement les articles avec quantité restante > 0
        if (quantiteRestante > 0) {
          const coutRestant = item.prixUnitaire !== null 
            ? quantiteRestante * item.prixUnitaire 
            : 0

          articlesRestants.push({
            projetId: demande.projetId,
            projetNom: demande.projet?.nom || "Projet inconnu",
            demandeId: demande.id,
            demandeNumero: demande.numero,
            demandeType: demande.type,
            articleId: item.article.id,
            articleReference: item.article.reference,
            articleDesignation: item.article.nom,
            articleUnite: item.article.unite,
            quantiteDemandee: item.quantiteDemandee,
            quantiteLivree,
            quantiteRestante,
            prixUnitaire: item.prixUnitaire,
            coutRestant
          })
        }
      }
    }

    // Calculer les totaux par projet
    const totauxParProjet = new Map<string, {
      projetId: string
      projetNom: string
      nombreArticles: number
      quantiteTotale: number
      coutTotal: number
    }>()

    for (const article of articlesRestants) {
      if (!totauxParProjet.has(article.projetId)) {
        totauxParProjet.set(article.projetId, {
          projetId: article.projetId,
          projetNom: article.projetNom,
          nombreArticles: 0,
          quantiteTotale: 0,
          coutTotal: 0
        })
      }
      
      const totaux = totauxParProjet.get(article.projetId)!
      totaux.nombreArticles += 1
      totaux.quantiteTotale += article.quantiteRestante
      totaux.coutTotal += article.coutRestant
    }

    // Calculer le total global
    const totalGlobal = {
      nombreArticles: articlesRestants.length,
      quantiteTotale: articlesRestants.reduce((sum, a) => sum + a.quantiteRestante, 0),
      coutTotal: articlesRestants.reduce((sum, a) => sum + a.coutRestant, 0)
    }

    return NextResponse.json({
      success: true,
      data: {
        articles: articlesRestants,
        totauxParProjet: Array.from(totauxParProjet.values()),
        totalGlobal
      }
    })

  } catch (error) {
    console.error("Erreur API articles-restants:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Erreur serveur" 
    }, { status: 500 })
  }
}

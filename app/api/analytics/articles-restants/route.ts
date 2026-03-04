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

    // Construire la structure groupée par projet
    const projetsMap = new Map<string, {
      projetId: string
      projetNom: string
      articles: Array<{
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
      }>
      totalQuantiteRestante: number
      totalCoutRestant: number
    }>()

    for (const demande of demandes) {
      const projetId = demande.projetId
      const projetNom = demande.projet?.nom || "Projet inconnu"

      // Initialiser le projet s'il n'existe pas
      if (!projetsMap.has(projetId)) {
        projetsMap.set(projetId, {
          projetId,
          projetNom,
          articles: [],
          totalQuantiteRestante: 0,
          totalCoutRestant: 0
        })
      }

      const projetData = projetsMap.get(projetId)!

      for (const item of demande.items) {
        // Définition unique "quantité restante" (analyse):
        // restant = (quantité validée si dispo, sinon quantité demandée)
        //         − (quantité sortie si dispo, sinon quantité livrée totale)
        // clamp à 0 pour éviter les restants négatifs (sur-sortie / sur-livraison)
        const baseDemandee = item.quantiteDemandee || 0
        const baseValidee = item.quantiteValidee ?? baseDemandee
        const baseLivreeTotal = item.quantiteLivreeTotal || 0
        const baseSortie = item.quantiteSortie ?? baseLivreeTotal

        const quantiteLivree = baseLivreeTotal
        const quantiteRestante = Math.max(0, baseValidee - baseSortie)
        
        // Inclure uniquement les articles avec quantité restante > 0
        if (quantiteRestante > 0) {
          const coutRestant = item.prixUnitaire !== null 
            ? quantiteRestante * item.prixUnitaire 
            : 0

          projetData.articles.push({
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

          projetData.totalQuantiteRestante += quantiteRestante
          projetData.totalCoutRestant += coutRestant
        }
      }
    }

    // Convertir en tableau et filtrer les projets sans articles restants
    const projetsAvecArticles = Array.from(projetsMap.values())
      .filter(p => p.articles.length > 0)
      .sort((a, b) => b.totalCoutRestant - a.totalCoutRestant)

    // Calculer le total global
    const totalGlobal = {
      nombreProjets: projetsAvecArticles.length,
      nombreArticles: projetsAvecArticles.reduce((sum, p) => sum + p.articles.length, 0),
      quantiteTotale: projetsAvecArticles.reduce((sum, p) => sum + p.totalQuantiteRestante, 0),
      coutTotal: projetsAvecArticles.reduce((sum, p) => sum + p.totalCoutRestant, 0)
    }

    return NextResponse.json({
      success: true,
      data: {
        projets: projetsAvecArticles,
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

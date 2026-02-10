import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

/**
 * TABLEAU 1 – SYNTHÈSE PROJETS BLOQUÉS (VUE DIRECTION)
 * 
 * Objectif : donner une vision macro des projets impactés par des quantités restantes.
 * 
 * Colonnes :
 * - Projet
 * - Nombre d'articles restants
 * - Quantité totale restante
 * - Coût total restant
 * 
 * Règles :
 * - Quantité restante ligne = quantité demandée − quantité livrée
 * - Quantité totale restante projet = somme des quantités restantes (> 0) du projet
 * - Nombre d'articles restants = nombre de lignes avec quantité restante > 0
 * - Coût total restant projet = somme des coûts restants du projet
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

    // Récupérer toutes les demandes avec leurs items et projets
    // Exclure : brouillon, rejetee, archivee
    // Inclure : toutes les autres, y compris cloturee si quantité restante > 0
    const demandes = await prisma.demande.findMany({
      where: {
        status: {
          notIn: ["brouillon", "rejetee", "archivee"]
        }
      },
      include: {
        projet: {
          select: {
            id: true,
            nom: true
          }
        },
        items: {
          select: {
            id: true,
            quantiteDemandee: true,
            quantiteLivreeTotal: true,
            prixUnitaire: true
          }
        }
      }
    })

    // Agréger par projet
    const projetsMap = new Map<string, {
      projetId: string
      projetNom: string
      nombreArticlesRestants: number
      quantiteTotaleRestante: number
      coutTotalRestant: number
    }>()

    for (const demande of demandes) {
      const projetId = demande.projetId
      const projetNom = demande.projet?.nom || "Projet inconnu"

      if (!projetsMap.has(projetId)) {
        projetsMap.set(projetId, {
          projetId,
          projetNom,
          nombreArticlesRestants: 0,
          quantiteTotaleRestante: 0,
          coutTotalRestant: 0
        })
      }

      const projetData = projetsMap.get(projetId)!

      for (const item of demande.items) {
        const quantiteRestante = item.quantiteDemandee - (item.quantiteLivreeTotal || 0)
        
        if (quantiteRestante > 0) {
          projetData.nombreArticlesRestants += 1
          projetData.quantiteTotaleRestante += quantiteRestante
          
          // Calculer le coût restant (si prix unitaire disponible)
          // IMPORTANT : Même logique que TABLEAU 2 pour garantir la cohérence
          if (item.prixUnitaire !== null) {
            projetData.coutTotalRestant += quantiteRestante * item.prixUnitaire
          }
        }
      }
    }

    // Convertir en tableau et filtrer les projets sans articles restants
    const projetsBloques = Array.from(projetsMap.values())
      .filter(p => p.nombreArticlesRestants > 0)
      .sort((a, b) => b.coutTotalRestant - a.coutTotalRestant) // Trier par coût décroissant

    // Calculer les totaux globaux
    const totaux = {
      nombreProjetsImpactes: projetsBloques.length,
      nombreArticlesRestantsGlobal: projetsBloques.reduce((sum, p) => sum + p.nombreArticlesRestants, 0),
      quantiteTotaleRestanteGlobale: projetsBloques.reduce((sum, p) => sum + p.quantiteTotaleRestante, 0),
      coutTotalRestantGlobal: projetsBloques.reduce((sum, p) => sum + p.coutTotalRestant, 0)
    }

    return NextResponse.json({
      success: true,
      data: {
        projets: projetsBloques,
        totaux
      }
    })

  } catch (error) {
    console.error("Erreur API projets-bloques:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Erreur serveur" 
    }, { status: 500 })
  }
}

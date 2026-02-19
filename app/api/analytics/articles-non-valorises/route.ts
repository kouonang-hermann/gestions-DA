import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

/**
 * TABLEAU 3 – ARTICLES NON VALORISÉS
 * 
 * Objectif : détecter les blocages anciens du processus.
 * 
 * Colonnes :
 * - Projet
 * - Type de demande
 * - Nombre d'articles non valorisés
 * - Jours sans valorisation (MAX)
 * 
 * Règles :
 * - Un article est "non valorisé" si :
 *   1. Il a une quantité restante (quantiteValidee - quantiteSortie > 0)
 *   2. Cette quantité restante n'a pas de prix (prixUnitaire IS NULL)
 * - Le point de départ du calcul est la date de validation appro/logistique
 *   (datePassageAppro ou datePassageLogistique)
 * - Jours sans valorisation = Date du jour − Date de validation
 * - Pour chaque projet et type de demande, on prend le MAX des jours
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

    // Récupérer toutes les demandes actives qui ont des articles non valorisés
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

    console.log(`🔍 [ARTICLES NON VALORISÉS] Total demandes trouvées: ${demandes.length}`)

    // Agréger par projet et type
    const aggregationMap = new Map<string, {
      projetId: string
      projetNom: string
      type: string
      nombreArticlesNonValorises: number
      joursMaxSansValorisation: number
      demandesImpactees: string[]
    }>()

    const now = new Date()

    for (const demande of demandes) {
      // Compter les articles non valorisés :
      // - Quantité restante > 0 (quantiteDemandee - quantiteLivreeTotal)
      // - Prix unitaire non renseigné (prixUnitaire IS NULL)
      // IMPORTANT: Utilise les mêmes champs que les Tableaux 1 & 2 pour cohérence
      const articlesNonValorises = demande.items.filter(item => {
        const quantiteDemandee = item.quantiteDemandee || 0
        const quantiteLivree = item.quantiteLivreeTotal || 0
        const quantiteRestante = quantiteDemandee - quantiteLivree
        
        return quantiteRestante > 0 && item.prixUnitaire === null
      })
      
      console.log(`📦 [${demande.numero}] Items: ${demande.items.length}, Non valorisés: ${articlesNonValorises.length}, DateAppro: ${demande.datePassageAppro}, DateLog: ${demande.datePassageLogistique}`)
      
      if (articlesNonValorises.length === 0) continue

      // Déterminer la date de référence pour le calcul
      // Priorité : date de passage > date de création
      const datePassage = demande.type === "materiel" 
        ? demande.datePassageAppro 
        : demande.datePassageLogistique
      
      const dateReference = datePassage || demande.dateCreation

      // Calculer les jours sans valorisation
      const diffTime = now.getTime() - new Date(dateReference).getTime()
      const joursSansValorisation = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      // Clé d'agrégation : projetId + type
      const key = `${demande.projetId}-${demande.type}`

      if (!aggregationMap.has(key)) {
        aggregationMap.set(key, {
          projetId: demande.projetId,
          projetNom: demande.projet?.nom || "Projet inconnu",
          type: demande.type,
          nombreArticlesNonValorises: 0,
          joursMaxSansValorisation: 0,
          demandesImpactees: []
        })
      }

      const aggregation = aggregationMap.get(key)!
      aggregation.nombreArticlesNonValorises += articlesNonValorises.length
      aggregation.joursMaxSansValorisation = Math.max(
        aggregation.joursMaxSansValorisation, 
        joursSansValorisation
      )
      aggregation.demandesImpactees.push(demande.numero)
    }

    // Convertir en tableau et trier par jours décroissants (blocages les plus anciens en premier)
    const articlesNonValorises = Array.from(aggregationMap.values())
      .sort((a, b) => b.joursMaxSansValorisation - a.joursMaxSansValorisation)

    // Calculer les totaux globaux
    const totaux = {
      nombreProjetsImpactes: new Set(articlesNonValorises.map(a => a.projetId)).size,
      nombreArticlesNonValorises: articlesNonValorises.reduce((sum, a) => sum + a.nombreArticlesNonValorises, 0),
      joursMaxGlobal: articlesNonValorises.length > 0 
        ? Math.max(...articlesNonValorises.map(a => a.joursMaxSansValorisation))
        : 0,
      nombreDemandesImpactees: articlesNonValorises.reduce((sum, a) => sum + a.demandesImpactees.length, 0)
    }

    // Détail par demande (pour export détaillé)
    const detailParDemande: Array<{
      projetId: string
      projetNom: string
      demandeNumero: string
      type: string
      nombreArticlesNonValorises: number
      joursSansValorisation: number
      datePassagePreparation: Date | null
    }> = []

    for (const demande of demandes) {
      const articlesNonValorises = demande.items.filter(item => {
        const quantiteDemandee = item.quantiteDemandee || 0
        const quantiteLivree = item.quantiteLivreeTotal || 0
        const quantiteRestante = quantiteDemandee - quantiteLivree
        
        return quantiteRestante > 0 && item.prixUnitaire === null
      })
      if (articlesNonValorises.length === 0) continue

      const datePassage = demande.type === "materiel" 
        ? demande.datePassageAppro 
        : demande.datePassageLogistique

      const dateReference = datePassage || demande.dateCreation

      const diffTime = now.getTime() - new Date(dateReference).getTime()
      const joursSansValorisation = Math.floor(diffTime / (1000 * 60 * 60 * 24))

      detailParDemande.push({
        projetId: demande.projetId,
        projetNom: demande.projet?.nom || "Projet inconnu",
        demandeNumero: demande.numero,
        type: demande.type,
        nombreArticlesNonValorises: articlesNonValorises.length,
        joursSansValorisation,
        datePassagePreparation: datePassage
      })
    }

    // Trier le détail par jours décroissants
    detailParDemande.sort((a, b) => b.joursSansValorisation - a.joursSansValorisation)

    return NextResponse.json({
      success: true,
      data: {
        synthese: articlesNonValorises,
        detail: detailParDemande,
        totaux
      }
    })

  } catch (error) {
    console.error("Erreur API articles-non-valorises:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Erreur serveur" 
    }, { status: 500 })
  }
}

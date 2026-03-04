import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

/**
 * TABLEAU 3 – ARTICLES NON VALORISÉS
 * 
 * Objectif : détecter tous les articles sans prix ayant dépassé la validation budgétaire.
 * 
 * Colonnes :
 * - Projet
 * - Type de demande
 * - Nombre d'articles non valorisés
 * - Jours sans valorisation (MAX)
 * 
 * Règles RÉVISÉES :
 * - Un article est "non valorisé" si :
 *   1. Quantité restante > 0 (quantiteValidee - max(quantiteSortie, quantiteRecue, quantiteLivreeTotal))
 *   2. Prix unitaire non renseigné (prixUnitaire IS NULL)
 *   3. La demande a dépassé l'étape de validation charge_affaire
 *   4. La demande n'est pas rejetée définitivement ou archivée
 * 
 * - Calcul des jours sans valorisation :
 *   Priorité : dateEngagement > datePassageAppro/Logistique > dateCreation
 * 
 * - Statuts concernés : tous les statuts à partir de la préparation jusqu'à la clôture
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

    // Récupérer toutes les demandes ayant dépassé la validation charge_affaire
    // Cela inclut : préparation, réception, livraison, validation finale, clôture
    const demandes = await prisma.demande.findMany({
      where: {
        status: {
          in: [
            "en_attente_preparation_appro",
            "en_attente_preparation_logistique",
            "en_attente_reception_livreur",
            "en_attente_livraison",
            "en_attente_validation_finale_demandeur",
            "cloturee"
          ]
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
            quantiteValidee: true,
            quantiteSortie: true,
            quantiteRecue: true,
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
      demandesImpactees: Set<string>
    }>()

    const now = new Date()

    for (const demande of demandes) {
      // Compter les articles non valorisés :
      // - Article validé (quantiteValidee IS NOT NULL)
      // - Quantité restante > 0 (quantiteValidee - max(quantiteSortie, quantiteRecue, quantiteLivreeTotal))
      // - Prix unitaire non renseigné (prixUnitaire IS NULL)
      const articlesNonValorises = demande.items.filter(item => {
        // Exclure les articles jamais validés (quantiteValidee = NULL)
        if (item.quantiteValidee === null || item.quantiteValidee === undefined) {
          return false
        }

        const baseValidee = item.quantiteValidee
        const qteSortie = item.quantiteSortie ?? 0
        const qteRecue = item.quantiteRecue ?? 0
        const qteLivreeTotal = item.quantiteLivreeTotal ?? 0

        // On prend la quantité la plus fiable disponible (certaines colonnes peuvent rester à 0)
        const baseSortie = Math.max(qteSortie, qteRecue, qteLivreeTotal)

        const quantiteRestante = Math.max(0, baseValidee - baseSortie)
        return quantiteRestante > 0 && item.prixUnitaire === null
      })
      
      console.log(`📦 [${demande.numero}] Items: ${demande.items.length}, Non valorisés: ${articlesNonValorises.length}, DateAppro: ${demande.datePassageAppro}, DateLog: ${demande.datePassageLogistique}`)
      
      if (articlesNonValorises.length === 0) continue

      // Déterminer la date de référence pour le calcul
      // Priorité : dateEngagement (saisie prix) > datePassage (validation étape) > dateCreation
      const datePassage = demande.type === "materiel" 
        ? demande.datePassageAppro 
        : demande.datePassageLogistique
      
      const dateReference = demande.dateEngagement || datePassage || demande.dateCreation

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
          demandesImpactees: new Set<string>()
        })
      }

      const aggregation = aggregationMap.get(key)!
      aggregation.nombreArticlesNonValorises += articlesNonValorises.length
      aggregation.joursMaxSansValorisation = Math.max(
        aggregation.joursMaxSansValorisation, 
        joursSansValorisation
      )
      aggregation.demandesImpactees.add(demande.numero)
    }

    // Convertir en tableau et trier par jours décroissants (blocages les plus anciens en premier)
    const articlesNonValorises = Array.from(aggregationMap.values())
      .map(a => ({
        ...a,
        demandesImpactees: Array.from(a.demandesImpactees)
      }))
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
        // Exclure les articles jamais validés (quantiteValidee = NULL)
        if (item.quantiteValidee === null || item.quantiteValidee === undefined) {
          return false
        }

        const baseValidee = item.quantiteValidee
        const qteSortie = item.quantiteSortie ?? 0
        const qteRecue = item.quantiteRecue ?? 0
        const qteLivreeTotal = item.quantiteLivreeTotal ?? 0

        // On prend la quantité la plus fiable disponible (certaines colonnes peuvent rester à 0)
        const baseSortie = Math.max(qteSortie, qteRecue, qteLivreeTotal)

        const quantiteRestante = Math.max(0, baseValidee - baseSortie)
        return quantiteRestante > 0 && item.prixUnitaire === null
      })
      if (articlesNonValorises.length === 0) continue

      const datePassage = demande.type === "materiel" 
        ? demande.datePassageAppro 
        : demande.datePassageLogistique

      const dateReference = demande.dateEngagement || datePassage || demande.dateCreation

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

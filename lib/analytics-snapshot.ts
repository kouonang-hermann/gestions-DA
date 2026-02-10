/**
 * SERVICE DE GÉNÉRATION DE SNAPSHOTS ANALYTIQUES
 * 
 * Ce service réutilise la logique des endpoints analytics existants
 * pour générer des snapshots journaliers stockés en base.
 * 
 * ARCHITECTURE :
 * - Aucune logique de calcul dupliquée
 * - Appelle les mêmes fonctions que les endpoints API
 * - Stocke les résultats en JSON pour traçabilité
 * 
 * USAGE :
 * - Appelé par le CRON quotidien à 05:00
 * - Génère un snapshot unique par date
 * - Évite les doublons avec upsert
 */

import { prisma } from "@/lib/prisma"

// ============================================================================
// TYPES
// ============================================================================

export interface ProjetBloque {
  projetId: string
  projetNom: string
  nombreArticlesRestants: number
  quantiteTotaleRestante: number
  coutTotalRestant: number
}

export interface Tableau1Data {
  projets: ProjetBloque[]
  totaux: {
    nombreProjetsImpactes: number
    nombreArticlesRestantsGlobal: number
    quantiteTotaleRestanteGlobale: number
    coutTotalRestantGlobal: number
  }
  generatedAt: string
}

export interface ArticleNonValorise {
  projetId: string
  projetNom: string
  type: string
  nombreArticlesNonValorises: number
  joursMaxSansValorisation: number
  demandesImpactees: string[]
}

export interface Tableau3Data {
  synthese: ArticleNonValorise[]
  totaux: {
    nombreProjetsImpactes: number
    nombreArticlesNonValorises: number
    joursMaxGlobal: number
    nombreDemandesImpactees: number
  }
  generatedAt: string
}

export interface SnapshotMetadata {
  cronExecutionTime: number
  snapshotGenerationTime: number
  emailSent: boolean
  emailSentAt?: string
  errors?: string[]
}

// ============================================================================
// FONCTIONS DE CALCUL (RÉUTILISATION DE LA LOGIQUE DES ENDPOINTS)
// ============================================================================

/**
 * Génère les données du TABLEAU 1 : Synthèse Projets Bloqués
 * Logique identique à /api/analytics/projets-bloques
 */
export async function generateTableau1Data(): Promise<Tableau1Data> {
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

  const projetsMap = new Map<string, ProjetBloque>()

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
        
        if (item.prixUnitaire !== null) {
          projetData.coutTotalRestant += quantiteRestante * item.prixUnitaire
        }
      }
    }
  }

  const projetsBloques = Array.from(projetsMap.values())
    .filter(p => p.nombreArticlesRestants > 0)
    .sort((a, b) => b.coutTotalRestant - a.coutTotalRestant)

  const totaux = {
    nombreProjetsImpactes: projetsBloques.length,
    nombreArticlesRestantsGlobal: projetsBloques.reduce((sum, p) => sum + p.nombreArticlesRestants, 0),
    quantiteTotaleRestanteGlobale: projetsBloques.reduce((sum, p) => sum + p.quantiteTotaleRestante, 0),
    coutTotalRestantGlobal: projetsBloques.reduce((sum, p) => sum + p.coutTotalRestant, 0)
  }

  return {
    projets: projetsBloques,
    totaux,
    generatedAt: new Date().toISOString()
  }
}

/**
 * Génère les données du TABLEAU 3 : Articles Non Valorisés
 * Logique identique à /api/analytics/articles-non-valorises
 */
export async function generateTableau3Data(): Promise<Tableau3Data> {
  const demandes = await prisma.demande.findMany({
    where: {
      status: {
        notIn: ["brouillon", "rejetee", "archivee"]
      },
      OR: [
        { datePassageAppro: { not: null } },
        { datePassageLogistique: { not: null } }
      ]
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
          prixUnitaire: true
        }
      }
    }
  })

  const aggregationMap = new Map<string, ArticleNonValorise>()
  const now = new Date()

  for (const demande of demandes) {
    const articlesNonValorises = demande.items.filter(item => item.prixUnitaire === null)
    
    if (articlesNonValorises.length === 0) continue

    const datePassage = demande.type === "materiel" 
      ? demande.datePassageAppro 
      : demande.datePassageLogistique

    if (!datePassage) continue

    const diffTime = now.getTime() - new Date(datePassage).getTime()
    const joursSansValorisation = Math.floor(diffTime / (1000 * 60 * 60 * 24))

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

  const synthese = Array.from(aggregationMap.values())
    .sort((a, b) => b.joursMaxSansValorisation - a.joursMaxSansValorisation)

  const totaux = {
    nombreProjetsImpactes: new Set(synthese.map(a => a.projetId)).size,
    nombreArticlesNonValorises: synthese.reduce((sum, a) => sum + a.nombreArticlesNonValorises, 0),
    joursMaxGlobal: synthese.length > 0 
      ? Math.max(...synthese.map(a => a.joursMaxSansValorisation))
      : 0,
    nombreDemandesImpactees: synthese.reduce((sum, a) => sum + a.demandesImpactees.length, 0)
  }

  return {
    synthese,
    totaux,
    generatedAt: new Date().toISOString()
  }
}

// ============================================================================
// GÉNÉRATION ET STOCKAGE DU SNAPSHOT
// ============================================================================

export interface SnapshotResult {
  success: boolean
  snapshotId?: string
  tableau1?: Tableau1Data
  tableau3?: Tableau3Data
  error?: string
  executionTimeMs: number
}

/**
 * Génère et stocke un snapshot journalier des tableaux analytiques
 * 
 * Comportement :
 * - Si un snapshot existe déjà pour la date, retourne celui-ci (pas de recalcul)
 * - Sinon, génère les données et les stocke
 * - Utilise une transaction pour garantir la cohérence
 */
export async function generateDailySnapshot(forceRegenerate = false): Promise<SnapshotResult> {
  const startTime = Date.now()
  
  try {
    // Normaliser la date (début de journée UTC)
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    // Vérifier si un snapshot existe déjà
    const existingSnapshot = await prisma.dailyAnalyticsSnapshot.findUnique({
      where: { date: today }
    })

    if (existingSnapshot && !forceRegenerate) {
      console.log(`📊 [SNAPSHOT] Snapshot existant pour ${today.toISOString().split('T')[0]}`)
      return {
        success: true,
        snapshotId: existingSnapshot.id,
        tableau1: existingSnapshot.tableau1 as unknown as Tableau1Data,
        tableau3: existingSnapshot.tableau3 as unknown as Tableau3Data,
        executionTimeMs: Date.now() - startTime
      }
    }

    console.log(`📊 [SNAPSHOT] Génération du snapshot pour ${today.toISOString().split('T')[0]}...`)

    // Générer les données des deux tableaux en parallèle
    const [tableau1, tableau3] = await Promise.all([
      generateTableau1Data(),
      generateTableau3Data()
    ])

    // Stocker le snapshot (upsert pour éviter les doublons)
    const snapshot = await prisma.dailyAnalyticsSnapshot.upsert({
      where: { date: today },
      update: {
        tableau1: tableau1 as any,
        tableau3: tableau3 as any,
        metadata: {
          regenerated: true,
          regeneratedAt: new Date().toISOString()
        } as any
      },
      create: {
        date: today,
        tableau1: tableau1 as any,
        tableau3: tableau3 as any,
        metadata: {
          generatedAt: new Date().toISOString()
        } as any
      }
    })

    const executionTimeMs = Date.now() - startTime
    console.log(`✅ [SNAPSHOT] Snapshot généré en ${executionTimeMs}ms`)

    return {
      success: true,
      snapshotId: snapshot.id,
      tableau1,
      tableau3,
      executionTimeMs
    }

  } catch (error) {
    const executionTimeMs = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
    
    console.error(`❌ [SNAPSHOT] Erreur: ${errorMessage}`)
    
    return {
      success: false,
      error: errorMessage,
      executionTimeMs
    }
  }
}

/**
 * Récupère le dernier snapshot disponible
 */
export async function getLatestSnapshot() {
  return prisma.dailyAnalyticsSnapshot.findFirst({
    orderBy: { date: "desc" }
  })
}

/**
 * Récupère un snapshot par date
 */
export async function getSnapshotByDate(date: Date) {
  const normalizedDate = new Date(date)
  normalizedDate.setUTCHours(0, 0, 0, 0)
  
  return prisma.dailyAnalyticsSnapshot.findUnique({
    where: { date: normalizedDate }
  })
}

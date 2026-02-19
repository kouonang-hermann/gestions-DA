import type { Demande, ItemDemande } from "@/types"

export type ItemFinance = {
  unitPrice: number
  validatedQty: number
  deliveredQty: number
  remainingQty: number
  spentAmount: number
  remainingAmount: number
  committedAmount: number
  hasPrice: boolean
}

export type DemandeFinance = {
  spentAmount: number
  remainingAmount: number
  committedAmount: number
  hasAnyPrice: boolean
}

export function getItemDeliveredQuantity(item: ItemDemande): number {
  // CORRECTION : Utiliser quantiteLivreeTotal qui est la source de vérité
  // pour les livraisons réelles (mis à jour par l'API livraisons)
  // Cohérence avec les tableaux analytiques qui utilisent quantiteLivreeTotal
  return Number(item.quantiteLivreeTotal ?? 0)
}

export function getItemValidatedQuantity(item: ItemDemande): number {
  return Number(item.quantiteValidee ?? item.quantiteDemandee ?? 0)
}

export function getItemRemainingQuantity(item: ItemDemande): number {
  // CORRECTION : Utiliser quantiteDemandee - quantiteLivreeTotal
  // au lieu de quantiteValidee - quantiteSortie/quantiteRecue
  // Cohérence avec les 3 tableaux analytiques (API)
  const demanded = Number(item.quantiteDemandee ?? 0)
  const delivered = Number(item.quantiteLivreeTotal ?? 0)
  return Math.max(0, demanded - delivered)
}

export function getItemUnitPrice(item: ItemDemande): number {
  return Number(item.prixUnitaire || 0)
}

export function getItemFinance(item: ItemDemande): ItemFinance {
  const unitPrice = getItemUnitPrice(item)
  const validatedQty = getItemValidatedQuantity(item)
  const deliveredQty = getItemDeliveredQuantity(item)
  const remainingQty = Math.max(0, validatedQty - deliveredQty)

  const spentAmount = unitPrice * deliveredQty
  const remainingAmount = unitPrice * remainingQty

  return {
    unitPrice,
    validatedQty,
    deliveredQty,
    remainingQty,
    spentAmount,
    remainingAmount,
    committedAmount: spentAmount + remainingAmount,
    hasPrice: unitPrice > 0,
  }
}

export function getDemandeFinance(demande: Pick<Demande, "items">): DemandeFinance {
  const items = Array.isArray(demande.items) ? demande.items : []

  let spentAmount = 0
  let remainingAmount = 0
  let hasAnyPrice = false

  for (const item of items) {
    const f = getItemFinance(item)
    spentAmount += f.spentAmount
    remainingAmount += f.remainingAmount
    if (f.hasPrice) hasAnyPrice = true
  }

  return {
    spentAmount,
    remainingAmount,
    committedAmount: spentAmount + remainingAmount,
    hasAnyPrice,
  }
}

/**
 * Calcule le coût total des quantités restantes pour une demande
 * INCLUANT tous les articles avec quantités restantes, même non valorisés
 * 
 * Cette fonction utilise la même logique que le tableau "Synthèse des projets bloqués":
 * - Pour chaque article avec quantité restante > 0
 * - Si prix unitaire existe: ajoute (quantité_restante * prix_unitaire)
 * - Si prix unitaire null: contribue 0 au coût total
 * 
 * Différence avec remainingAmount:
 * - remainingAmount: Somme uniquement des articles valorisés
 * - getTotalRemainingCost: Prend en compte TOUS les articles restants
 */
export function getTotalRemainingCost(demande: Pick<Demande, "items">): number {
  const items = Array.isArray(demande.items) ? demande.items : []
  let totalCost = 0

  for (const item of items) {
    const remainingQty = getItemRemainingQuantity(item)
    
    if (remainingQty > 0) {
      const unitPrice = getItemUnitPrice(item)
      // Même si unitPrice est 0 (non valorisé), on l'inclut dans le calcul
      totalCost += remainingQty * unitPrice
    }
  }

  return totalCost
}

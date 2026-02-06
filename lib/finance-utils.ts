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
  const livraisons = Array.isArray(item.livraisons) ? item.livraisons : []
  if (livraisons.length > 0) {
    return livraisons.reduce((sum, l) => sum + Number(l?.quantiteLivree || 0), 0)
  }

  return Number(item.quantiteSortie ?? item.quantiteRecue ?? 0)
}

export function getItemValidatedQuantity(item: ItemDemande): number {
  return Number(item.quantiteValidee ?? item.quantiteDemandee ?? 0)
}

export function getItemRemainingQuantity(item: ItemDemande): number {
  const validated = getItemValidatedQuantity(item)
  const delivered = getItemDeliveredQuantity(item)
  return Math.max(0, validated - delivered)
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

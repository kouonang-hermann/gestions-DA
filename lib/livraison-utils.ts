import { prisma } from "./prisma"

/**
 * Calcule la quantité totale livrée pour un item
 */
export async function getQuantiteTotaleLivree(itemDemandeId: string): Promise<number> {
  const result = await prisma.itemLivraison.aggregate({
    where: { 
      itemDemandeId,
      livraison: {
        statut: { in: ["livree", "en_cours", "prete"] }
      }
    },
    _sum: { quantiteLivree: true }
  })
  
  return result._sum.quantiteLivree || 0
}

/**
 * Calcule la quantité restante à livrer pour un item
 */
export async function getQuantiteRestante(itemDemandeId: string): Promise<number> {
  const item = await prisma.itemDemande.findUnique({
    where: { id: itemDemandeId },
    select: { quantiteValidee: true, quantiteDemandee: true }
  })
  
  if (!item) return 0
  
  const quantiteValidee = item.quantiteValidee || item.quantiteDemandee
  const quantiteLivree = await getQuantiteTotaleLivree(itemDemandeId)
  
  return Math.max(0, quantiteValidee - quantiteLivree)
}

/**
 * Vérifie si une demande est complètement livrée
 */
export async function isDemandeCompletelyDelivered(demandeId: string): Promise<boolean> {
  const items = await prisma.itemDemande.findMany({
    where: { demandeId },
    select: { id: true }
  })
  
  for (const item of items) {
    const restante = await getQuantiteRestante(item.id)
    if (restante > 0) return false
  }
  
  return true
}

/**
 * Calcule le statut de livraison d'une demande
 */
export async function getDemandeDeliveryStatus(demandeId: string): Promise<{
  totalValidee: number
  totalLivree: number
  totalRestante: number
  pourcentageLivre: number
  estComplete: boolean
  itemsRestants: Record<string, number>
}> {
  const items = await prisma.itemDemande.findMany({
    where: { demandeId },
    select: { 
      id: true, 
      quantiteValidee: true, 
      quantiteDemandee: true 
    }
  })
  
  let totalValidee = 0
  let totalLivree = 0
  const itemsRestants: Record<string, number> = {}
  
  for (const item of items) {
    const validee = item.quantiteValidee || item.quantiteDemandee
    const livree = await getQuantiteTotaleLivree(item.id)
    const restante = validee - livree
    
    totalValidee += validee
    totalLivree += livree
    itemsRestants[item.id] = restante
  }
  
  const totalRestante = totalValidee - totalLivree
  const pourcentageLivre = totalValidee > 0 ? (totalLivree / totalValidee) * 100 : 0
  
  return {
    totalValidee,
    totalLivree,
    totalRestante,
    pourcentageLivre,
    estComplete: totalRestante === 0,
    itemsRestants
  }
}

/**
 * Obtient toutes les livraisons d'une demande avec détails
 */
export async function getDemandeWithLivraisons(demandeId: string) {
  return await prisma.demande.findUnique({
    where: { id: demandeId },
    include: {
      items: {
        include: {
          article: true,
          livraisons: {
            include: {
              livraison: {
                include: {
                  livreur: {
                    select: { id: true, nom: true, prenom: true }
                  }
                }
              }
            }
          }
        }
      },
      livraisons: {
        include: {
          livreur: {
            select: { id: true, nom: true, prenom: true }
          },
          items: {
            include: {
              itemDemande: {
                include: { article: true }
              }
            }
          }
        },
        orderBy: { dateCreation: 'desc' }
      }
    }
  })
}

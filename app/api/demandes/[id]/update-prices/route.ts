import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import crypto from "crypto"

/**
 * PUT /api/demandes/[id]/update-prices - Met à jour les prix des articles d'une demande
 * Seul le responsable_appro peut utiliser cette API
 * Le coût total est calculé automatiquement
 */
export const PUT = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: authResult.error }, { status: 401 })
  }

  const currentUser = authResult.user
  const { id: demandeId } = await params

  try {
    const body = await request.json()
    const { prices, items } = body

    const pricesFromItems: Record<string, unknown> = {}
    if (Array.isArray(items)) {
      for (const item of items) {
        if (item && typeof item === 'object') {
          const itemId = (item as any).itemId
          const prixUnitaire = (item as any).prixUnitaire
          if (typeof itemId === 'string') {
            pricesFromItems[itemId] = prixUnitaire
          }
        }
      }
    }

    const effectivePrices: Record<string, unknown> =
      prices && typeof prices === 'object' ? prices : pricesFromItems

    console.log("💰 [API-PRICES] Réception des prix:", effectivePrices)

    if (!effectivePrices || typeof effectivePrices !== 'object') {
      return NextResponse.json(
        { success: false, error: "Format invalide. Attendu: { prices: { itemId: prixUnitaire } }" },
        { status: 400 }
      )
    }

    // Vérifier que la demande existe et est dans le bon statut
    const demande = await prisma.demande.findUnique({
      where: { id: demandeId },
      include: {
        items: true,
        projet: {
          include: {
            utilisateurs: true
          }
        }
      }
    })

    if (!demande) {
      return NextResponse.json(
        { success: false, error: "Demande introuvable" },
        { status: 404 }
      )
    }

    // Vérifier que l'utilisateur peut renseigner les prix selon le type de demande
    const canUpdatePrices =
      currentUser.role === "superadmin" ||
      (currentUser.role === "responsable_appro" && demande.type === "materiel") ||
      (currentUser.role === "responsable_logistique" && demande.type === "outillage")

    if (!canUpdatePrices) {
      return NextResponse.json(
        { success: false, error: "Vous n'êtes pas autorisé à renseigner les prix pour cette demande" },
        { status: 403 }
      )
    }

    // Vérifier que l'appro est assigné au projet de la demande
    const isAssigned = demande.projet.utilisateurs.some(
      (up: any) => up.userId === currentUser.id
    )

    if (!isAssigned) {
      return NextResponse.json(
        { success: false, error: "Vous n'êtes pas assigné au projet de cette demande" },
        { status: 403 }
      )
    }

    // Vérifier que la demande est au bon statut (en_attente_preparation_appro ou après)
    const allowedStatuses = [
      "en_attente_preparation_appro",
      "en_attente_preparation_logistique",
      "en_attente_validation_logistique",
      "en_attente_validation_finale_demandeur",
      "confirmee_demandeur",
      "cloturee"
    ]

    if (!allowedStatuses.includes(demande.status)) {
      return NextResponse.json(
        { success: false, error: "Les prix ne peuvent être renseignés qu'à partir de l'étape de préparation appro" },
        { status: 400 }
      )
    }

    // Mettre à jour les prix unitaires de chaque article
    let coutTotal = 0

    for (const [itemId, prixValue] of Object.entries(effectivePrices)) {
      const prixUnitaire = parseFloat(String(prixValue))
      
      if (isNaN(prixUnitaire) || prixUnitaire < 0) {
        return NextResponse.json(
          { success: false, error: `Prix invalide pour l'article ${itemId}` },
          { status: 400 }
        )
      }

      // Mettre à jour le prix unitaire de l'item
      await prisma.itemDemande.update({
        where: { id: itemId },
        data: { prixUnitaire }
      })

      // Calculer le coût basé sur la QUANTITÉ RESTANTE (quantité validée - quantité livrée)
      // Cela permet de connaître le coût de ce qui reste à livrer (rupture de stock magasin)
      const demandeItem = demande.items.find((i: any) => i.id === itemId)
      if (demandeItem) {
        const quantiteValidee = demandeItem.quantiteValidee || demandeItem.quantiteDemandee
        const quantiteLivree = demandeItem.quantiteSortie || 0
        const quantiteRestante = Math.max(0, quantiteValidee - quantiteLivree)
        coutTotal += prixUnitaire * quantiteRestante
        console.log(`   💰 Item ${itemId}: Qté validée=${quantiteValidee}, Qté livrée=${quantiteLivree}, Qté restante=${quantiteRestante}, Coût=${prixUnitaire * quantiteRestante}`)
      }
    }

    // Mettre à jour le coût total et la date d'engagement financier
    const updatedDemande = await prisma.demande.update({
      where: { id: demandeId },
      data: { 
        coutTotal,
        dateEngagement: new Date() // Date d'engagement financier = quand les prix sont validés
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

    // Créer une entrée dans l'historique
    await prisma.historyEntry.create({
      data: {
        id: crypto.randomUUID(),
        demandeId,
        userId: currentUser.id,
        action: "Mise à jour des prix",
        commentaire: `Coût total calculé: ${coutTotal.toFixed(2)} FCFA`,
        signature: `prices-update-${Date.now()}`,
      }
    })

    console.log(`💰 [API-PRICES] Prix mis à jour pour demande ${demande.numero}. Coût total: ${coutTotal} FCFA`)

    return NextResponse.json({
      success: true,
      message: "Prix mis à jour avec succès",
      data: {
        demandeId,
        coutTotal,
        itemsUpdated: Object.keys(effectivePrices).length
      }
    })

  } catch (error) {
    console.error("Erreur lors de la mise à jour des prix:", error)
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

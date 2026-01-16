import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

interface ValidationItemData {
  itemId: string
  quantiteRecue: number
  quantiteAcceptee: number
  quantiteRefusee: number
  motifRefus?: "endommage" | "non_conforme" | "manquant" | "autre"
  commentaire?: string
  photos?: string[]
}

interface ValidationReceptionData {
  items: ValidationItemData[]
  commentaireGeneral?: string
  refuserTout?: boolean
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: demandeId } = await params
    const userId = request.headers.get("x-user-id")

    if (!userId) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      )
    }

    const data: ValidationReceptionData = await request.json()

    // 1. Récupérer la demande avec tous ses items
    const demande = await prisma.demande.findUnique({
      where: { id: demandeId },
      include: {
        items: {
          include: {
            article: true,
          },
        },
        projet: true,
        technicien: true,
      },
    })

    if (!demande) {
      return NextResponse.json(
        { error: "Demande non trouvée" },
        { status: 404 }
      )
    }

    // Vérifier que l'utilisateur est bien le demandeur
    if (demande.technicienId !== userId) {
      return NextResponse.json(
        { error: "Vous n'êtes pas autorisé à valider cette réception" },
        { status: 403 }
      )
    }

    // Vérifier que la demande est au bon statut
    if (demande.status !== "en_attente_livraison") {
      return NextResponse.json(
        { error: "La demande n'est pas au statut attendu pour validation de réception" },
        { status: 400 }
      )
    }

    // 2. Traiter le cas de refus total
    if (data.refuserTout) {
      // Créer la validation de réception avec refus total
      await prisma.validationReception.create({
        data: {
          demandeId,
          validePar: userId,
          statut: "refusee_totale",
          commentaireGeneral: data.commentaireGeneral,
          items: {
            create: demande.items.map((item) => ({
              itemId: item.id,
              quantiteValidee: item.quantiteValidee || item.quantiteDemandee,
              quantiteRecue: 0,
              quantiteAcceptee: 0,
              quantiteRefusee: item.quantiteValidee || item.quantiteDemandee,
              statut: "refuse_total",
              motifRefus: "autre",
            })),
          },
        },
      })

      // Mettre à jour le statut de la demande
      await prisma.demande.update({
        where: { id: demandeId },
        data: {
          status: "renvoyee_vers_appro",
          statusPrecedent: demande.status,
        },
      })

      // Créer une entrée d'historique
      await prisma.historyEntry.create({
        data: {
          demandeId,
          userId,
          action: "refus_total_reception",
          ancienStatus: demande.status,
          nouveauStatus: "renvoyee_vers_appro",
          commentaire: data.commentaireGeneral,
          signature: `refus_total_${Date.now()}`,
        },
      })

      console.log(`✅ [VALIDATION-RECEPTION] Refus total de la demande ${demande.numero}`)

      return NextResponse.json({
        success: true,
        message: "Demande renvoyée vers l'appro",
        demande: {
          id: demandeId,
          status: "renvoyee_vers_appro",
        },
      })
    }

    // 3. Traiter la validation article par article
    const itemsACreerSousDemande: any[] = []
    let tousAcceptes = true

    for (const itemData of data.items) {
      const item = demande.items.find((i) => i.id === itemData.itemId)
      if (!item) continue

      const quantiteValidee = item.quantiteValidee || item.quantiteDemandee

      // Déterminer le statut de l'item
      let statutItem: "accepte_total" | "accepte_partiel" | "refuse_total"
      if (itemData.quantiteRefusee === 0 && itemData.quantiteAcceptee === quantiteValidee) {
        statutItem = "accepte_total"
      } else if (itemData.quantiteAcceptee === 0) {
        statutItem = "refuse_total"
        tousAcceptes = false
      } else {
        statutItem = "accepte_partiel"
        tousAcceptes = false
      }

      // Si quantité refusée > 0 ou quantité acceptée < quantité validée
      // => Créer une sous-demande pour la différence
      const quantiteManquante = quantiteValidee - itemData.quantiteAcceptee
      if (quantiteManquante > 0) {
        itemsACreerSousDemande.push({
          articleId: item.articleId,
          quantiteDemandee: quantiteManquante,
          quantiteValidee: quantiteManquante, // Pré-validée
          commentaire: `Sous-demande générée automatiquement - ${itemData.motifRefus || "Quantité manquante"}`,
          prixUnitaire: item.prixUnitaire,
        })
      }
    }

    // 4. Créer la validation de réception
    const validation = await prisma.validationReception.create({
      data: {
        demandeId,
        validePar: userId,
        statut: tousAcceptes ? "acceptee_totale" : "acceptee_partielle",
        commentaireGeneral: data.commentaireGeneral,
        items: {
          create: data.items.map((itemData) => {
            const item = demande.items.find((i) => i.id === itemData.itemId)!
            const quantiteValidee = item.quantiteValidee || item.quantiteDemandee

            let statutItem: "accepte_total" | "accepte_partiel" | "refuse_total"
            if (itemData.quantiteRefusee === 0 && itemData.quantiteAcceptee === quantiteValidee) {
              statutItem = "accepte_total"
            } else if (itemData.quantiteAcceptee === 0) {
              statutItem = "refuse_total"
            } else {
              statutItem = "accepte_partiel"
            }

            return {
              itemId: itemData.itemId,
              quantiteValidee,
              quantiteRecue: itemData.quantiteRecue,
              quantiteAcceptee: itemData.quantiteAcceptee,
              quantiteRefusee: itemData.quantiteRefusee,
              statut: statutItem,
              motifRefus: itemData.motifRefus,
              commentaire: itemData.commentaire,
              photos: itemData.photos || [],
            }
          }),
        },
      },
    })

    // 5. Créer la sous-demande si nécessaire
    let sousDemande = null
    if (itemsACreerSousDemande.length > 0) {
      // Calculer le budget prévisionnel de la sous-demande
      const budgetSousDemande = itemsACreerSousDemande.reduce((total, item) => {
        return total + (item.prixUnitaire || 0) * item.quantiteDemandee
      }, 0)

      // Générer un numéro de sous-demande
      const numeroSousDemande = `${demande.numero}-SD${Date.now().toString().slice(-4)}`

      // Créer la sous-demande
      sousDemande = await prisma.demande.create({
        data: {
          numero: numeroSousDemande,
          projetId: demande.projetId,
          technicienId: demande.technicienId,
          type: demande.type,
          status: "en_attente_preparation_appro", // Pré-validée, directement chez l'appro
          demandeParentId: demandeId,
          typeDemande: "sous_demande",
          motifSousDemande: "complement",
          budgetPrevisionnel: budgetSousDemande,
          commentaires: `Sous-demande générée automatiquement suite à validation de réception de ${demande.numero}`,
          items: {
            create: itemsACreerSousDemande,
          },
        },
        include: {
          items: {
            include: {
              article: true,
            },
          },
        },
      })

      // Créer une entrée d'historique pour la sous-demande
      await prisma.historyEntry.create({
        data: {
          demandeId: sousDemande.id,
          userId,
          action: "creation_sous_demande",
          ancienStatus: null,
          nouveauStatus: "en_attente_preparation_appro",
          commentaire: `Sous-demande créée automatiquement depuis ${demande.numero}`,
          signature: `sous_demande_${Date.now()}`,
        },
      })

      console.log(`✅ [VALIDATION-RECEPTION] Sous-demande créée: ${numeroSousDemande}`)
    }

    // 6. Mettre à jour le statut de la demande principale
    const nouveauStatut = tousAcceptes
      ? "en_attente_validation_finale_demandeur"
      : itemsACreerSousDemande.length > 0
      ? "cloturee_partiellement"
      : "en_attente_validation_finale_demandeur"

    await prisma.demande.update({
      where: { id: demandeId },
      data: {
        status: nouveauStatut,
        statusPrecedent: demande.status,
      },
    })

    // 7. Créer une entrée d'historique pour la demande principale
    await prisma.historyEntry.create({
      data: {
        demandeId,
        userId,
        action: "validation_reception",
        ancienStatus: demande.status,
        nouveauStatus: nouveauStatut,
        commentaire: data.commentaireGeneral,
        signature: `validation_reception_${Date.now()}`,
      },
    })

    console.log(`✅ [VALIDATION-RECEPTION] Demande ${demande.numero} validée - Statut: ${nouveauStatut}`)

    // 8. Créer les notifications
    // Notification pour le responsable appro si sous-demande créée
    if (sousDemande) {
      const responsablesAppro = await prisma.user.findMany({
        where: { role: "responsable_appro" },
      })

      for (const responsable of responsablesAppro) {
        await prisma.notification.create({
          data: {
            userId: responsable.id,
            titre: "Nouvelle sous-demande à préparer",
            message: `Une sous-demande ${sousDemande.numero} a été générée suite à une anomalie de livraison de ${demande.numero}`,
            demandeId: sousDemande.id,
          },
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: tousAcceptes
        ? "Réception validée avec succès"
        : "Réception validée partiellement, sous-demande créée",
      demande: {
        id: demandeId,
        status: nouveauStatut,
      },
      sousDemande: sousDemande
        ? {
            id: sousDemande.id,
            numero: sousDemande.numero,
            items: sousDemande.items.length,
          }
        : null,
    })
  } catch (error) {
    console.error("❌ [VALIDATION-RECEPTION] Erreur:", error)
    return NextResponse.json(
      { error: "Erreur lors de la validation de réception" },
      { status: 500 }
    )
  }
}

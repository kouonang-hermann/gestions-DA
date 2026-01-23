import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/middleware"
import { updateDemandeStatusSchema } from "@/lib/validations"
import type { DemandeStatus } from "@/types"
import { getPreviousStatus, getPreviousValidatorRole, generateRejectionNotificationMessage, hasReachedMaxRejections } from "@/lib/workflow-utils"
import crypto from "crypto"

/**
 * Détermine le prochain statut selon le statut actuel, le rôle et le type de demande
 */
function getNextStatus(currentStatus: string, userRole: string, demandeType?: string): DemandeStatus | null {
  // CAS SPÉCIAL : Validation à l'étape chargé d'affaire - dépend du type de demande
  // Le superadmin ou le chargé d'affaire peuvent valider à cette étape
  if (currentStatus === "en_attente_validation_charge_affaire" && (userRole === "charge_affaire" || userRole === "superadmin")) {
    return demandeType === "materiel" ? "en_attente_preparation_appro" : "en_attente_preparation_logistique"
  }

  const transitions: Record<string, Record<string, DemandeStatus>> = {
    // Flow Matériel: Conducteur -> Responsable Travaux -> Chargé Affaire -> Appro -> Logistique -> Demandeur
    "en_attente_validation_conducteur": {
      "conducteur_travaux": "en_attente_validation_responsable_travaux"
    },
    // Flow Outillage: Logistique -> Responsable Travaux -> Chargé Affaire -> Logistique (préparation) -> Livreur -> Demandeur  
    "en_attente_validation_logistique": {
      "responsable_logistique": "en_attente_validation_responsable_travaux"
    },
    "en_attente_validation_responsable_travaux": {
      "responsable_travaux": "en_attente_validation_charge_affaire"
    },
    "en_attente_preparation_appro": {
      "responsable_appro": "en_attente_reception_livreur"
    },
    "en_attente_preparation_logistique": {
      "responsable_logistique": "en_attente_reception_livreur"
    },
    "en_attente_reception_livreur": {
      "responsable_livreur": "en_attente_livraison",
      "employe": "en_attente_livraison"
    },
    "en_attente_livraison": {
      "responsable_livreur": "en_attente_validation_finale_demandeur",
      "employe": "en_attente_validation_finale_demandeur"
    },
    "en_attente_validation_finale_demandeur": {
      "employe": "cloturee"
    }
  }

  return transitions[currentStatus]?.[userRole] || null
}

/**
 * GET /api/demandes/[id] - Récupère une demande spécifique
 */
export const GET = withAuth(async (request: NextRequest, currentUser: any, context: { params: Promise<{ id: string }> }) => {
  try {
    const params = await context.params
    const demande = await prisma.demande.findUnique({
      where: { id: params.id },
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
        },
        validationSignatures: {
          include: {
            user: {
              select: { id: true, nom: true, prenom: true, role: true }
            }
          },
          orderBy: { date: 'asc' }
        },
        history: {
          include: {
            user: {
              select: { id: true, nom: true, prenom: true }
            }
          },
          orderBy: { timestamp: 'desc' }
        }
      }
    })

    if (!demande) {
      return NextResponse.json({ success: false, error: "Demande non trouvée" }, { status: 404 })
    }

    // Vérifier les permissions d'accès
    const hasAccess = currentUser.role === "superadmin" || 
                     demande.technicienId === currentUser.id ||
                     await prisma.userProjet.findFirst({
                       where: {
                         userId: currentUser.id,
                         projetId: demande.projetId
                       }
                     })

    if (!hasAccess) {
      return NextResponse.json({ success: false, error: "Accès non autorisé" }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: demande,
    })
  } catch (error) {
    console.error("Erreur lors de la récupération de la demande:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
})

/**
 * PUT /api/demandes/[id] - Met à jour une demande
 * - Si body contient "status" : Validation/rejet (workflow existant)
 * - Si body contient "type", "items", etc. : Modification complète (super admin uniquement)
 */
export const PUT = withAuth(async (request: NextRequest, currentUser: any, context: { params: Promise<{ id: string }> }) => {
  try {
    const params = await context.params
    const body = await request.json()
    
    // Vérifier si c'est une modification complète (super admin) ou une validation
    if (body.items !== undefined || body.type !== undefined) {
      // MODIFICATION COMPLÈTE - Réservé au super admin
      if (currentUser.role !== "superadmin") {
        return NextResponse.json({ 
          success: false, 
          error: "Seul le super admin peut modifier complètement une demande" 
        }, { status: 403 })
      }

      console.log(`✏️ [MODIFICATION] Super admin modifie la demande ${params.id}`)

      // Récupérer la demande actuelle
      const demande = await prisma.demande.findUnique({
        where: { id: params.id },
        include: { items: true }
      })

      if (!demande) {
        return NextResponse.json({ success: false, error: "Demande non trouvée" }, { status: 404 })
      }

      // Préparer les données de mise à jour
      const updateData: any = {
        dateModification: new Date(),
      }

      if (body.type) updateData.type = body.type
      if (body.projetId) updateData.projetId = body.projetId
      if (body.technicienId) updateData.technicienId = body.technicienId
      if (body.commentaires !== undefined) updateData.commentaires = body.commentaires
      if (body.dateLivraisonSouhaitee !== undefined) {
        updateData.dateLivraisonSouhaitee = body.dateLivraisonSouhaitee ? new Date(body.dateLivraisonSouhaitee) : null
      }

      // Mettre à jour la demande
      const updatedDemande = await prisma.demande.update({
        where: { id: params.id },
        data: updateData,
      })

      // Gérer les articles si fournis
      if (body.items && Array.isArray(body.items)) {
        // Supprimer les anciens articles
        await prisma.itemDemande.deleteMany({
          where: { demandeId: params.id }
        })

        // Créer les nouveaux articles
        for (const item of body.items) {
          // Créer un nouvel article pour chaque item (pas de réutilisation)
          const article = await prisma.article.create({
            data: {
              id: crypto.randomUUID(),
              reference: item.reference?.trim() || null,
              nom: item.nom,
              unite: item.unite || "pièce",
              description: item.nom,
              type: updatedDemande.type,
              updatedAt: new Date(),
            }
          })

          // Créer l'item de demande
          await prisma.itemDemande.create({
            data: {
              id: crypto.randomUUID(),
              demandeId: params.id,
              articleId: article.id,
              quantiteDemandee: item.quantiteDemandee,
              quantiteValidee: item.quantiteValidee || item.quantiteDemandee,
              prixUnitaire: item.prixUnitaire,
            }
          })
        }
      }

      // Créer une entrée dans l'historique
      await prisma.historyEntry.create({
        data: {
          id: crypto.randomUUID(),
          demandeId: params.id,
          userId: currentUser.id,
          action: `Demande modifiée par ${currentUser.prenom} ${currentUser.nom} (super admin)`,
          ancienStatus: demande.status as any,
          nouveauStatus: demande.status as any,
          commentaire: "Modification complète de la demande",
          signature: `superadmin-edit-${Date.now()}`,
        }
      })

      // Récupérer la demande complète mise à jour
      const finalDemande = await prisma.demande.findUnique({
        where: { id: params.id },
        include: {
          projet: { select: { id: true, nom: true } },
          technicien: { select: { id: true, nom: true, prenom: true, email: true } },
          items: { include: { article: true } }
        }
      })

      console.log(`✅ [MODIFICATION] Demande ${demande.numero} modifiée avec succès`)

      return NextResponse.json({
        success: true,
        data: finalDemande,
      })
    }

    // VALIDATION/REJET - Workflow existant
    const validatedData = updateDemandeStatusSchema.parse(body)

    // Récupérer la demande actuelle
    const demande = await prisma.demande.findUnique({
      where: { id: params.id },
      include: {
        projet: true,
        technicien: true
      }
    })

    if (!demande) {
      return NextResponse.json({ success: false, error: "Demande non trouvée" }, { status: 404 })
    }

    // Vérifier les permissions selon le statut actuel
    const canValidate = await canUserValidateStatus(demande.status, currentUser, demande.projetId)
    if (!canValidate) {
      return NextResponse.json({ success: false, error: "Vous n'avez pas les permissions pour cette action" }, { status: 403 })
    }

    let newStatus: DemandeStatus | string = validatedData.status
    let updateData: any = {
      dateModification: new Date(),
    }

    // NOUVEAU WORKFLOW DE REJET
    if (validatedData.status === "rejetee") {
      console.log(`🔄 [REJET] Demande ${demande.numero} rejetée par ${currentUser.role}`)
      
      // Vérifier si le nombre maximum de rejets est atteint
      if (hasReachedMaxRejections(demande.nombreRejets || 0)) {
        return NextResponse.json({ 
          success: false, 
          error: `Cette demande a atteint le nombre maximum de rejets (${demande.nombreRejets}). Veuillez créer une nouvelle demande.` 
        }, { status: 400 })
      }

      // Déterminer le statut précédent
      const previousStatus = getPreviousStatus(demande.status as DemandeStatus, demande.type)
      
      if (!previousStatus) {
        return NextResponse.json({ 
          success: false, 
          error: "Impossible de rejeter cette demande à ce stade du workflow" 
        }, { status: 400 })
      }

      console.log(`↩️ [REJET] Retour au statut précédent: ${previousStatus}`)

      // Mettre à jour avec retour au statut précédent
      newStatus = previousStatus
      updateData = {
        status: previousStatus as any,
        statusPrecedent: demande.status as any, // Sauvegarder le statut actuel
        nombreRejets: (demande.nombreRejets || 0) + 1, // Incrémenter le compteur
        rejetMotif: validatedData.commentaire || "Aucun motif spécifié",
        dateModification: new Date(),
      }

      // Déterminer qui notifier (valideur précédent)
      const previousValidatorRole = getPreviousValidatorRole(demande.status as DemandeStatus, demande.type)
      
      if (previousValidatorRole) {
        console.log(`📧 [REJET] Notification au valideur précédent: ${previousValidatorRole}`)
        
        // Trouver les utilisateurs avec ce rôle assignés au projet
        const usersToNotify = await prisma.user.findMany({
          where: {
            role: previousValidatorRole,
            projets: {
              some: {
                projetId: demande.projetId
              }
            }
          }
        })

        // Créer les notifications
        const notificationMessage = generateRejectionNotificationMessage(
          demande.numero,
          currentUser.role,
          validatedData.commentaire || "Aucun motif spécifié"
        )

        for (const user of usersToNotify) {
          await prisma.notification.create({
            data: {
              id: crypto.randomUUID(),
              userId: user.id,
              titre: `Demande ${demande.numero} rejetée`,
              message: notificationMessage,
              demandeId: demande.id,
              projetId: demande.projetId
            }
          })
        }
      }
    } else {
      // VALIDATION NORMALE - Déterminer le prochain statut
      const nextStatus = getNextStatus(demande.status, currentUser.role, demande.type)
      if (nextStatus) {
        newStatus = nextStatus as any
      }
      updateData.status = newStatus as any
    }

    // Mettre à jour la demande
    const updatedDemande = await prisma.demande.update({
      where: { id: params.id },
      data: updateData,
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

    // Créer une signature de validation
    await prisma.validationSignature.create({
      data: {
        id: crypto.randomUUID(),
        demandeId: params.id,
        userId: currentUser.id,
        type: getValidationType(demande.status, currentUser.role),
        commentaire: validatedData.commentaire,
        signature: `${currentUser.role}-${Date.now()}`,
      }
    })

    // Créer une entrée dans l'historique
    await prisma.historyEntry.create({
      data: {
        id: crypto.randomUUID(),
        demandeId: params.id,
        userId: currentUser.id,
        action: validatedData.status === "rejetee" ? 
          `Demande rejetée par ${currentUser.role} - Retour à ${newStatus}` : 
          `Demande validée par ${currentUser.role}`,
        ancienStatus: demande.status as any,
        nouveauStatus: newStatus as any,
        commentaire: validatedData.commentaire,
        signature: `${currentUser.role}-validation-${Date.now()}`,
      }
    })

    console.log(`✅ [WORKFLOW] Demande ${demande.numero} mise à jour: ${demande.status} → ${newStatus}`)

    return NextResponse.json({
      success: true,
      data: updatedDemande,
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ success: false, error: "Données invalides", details: error }, { status: 400 })
    }
    
    console.error("Erreur lors de la mise à jour de la demande:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
})

/**
 * Vérifie si un utilisateur peut valider une demande selon son statut
 */
async function canUserValidateStatus(status: string, user: any, projetId: string): Promise<boolean> {
  // Superadmin peut tout faire
  if (user.role === "superadmin") return true

  // Vérifier que l'utilisateur est assigné au projet
  const userProjet = await prisma.userProjet.findFirst({
    where: {
      userId: user.id,
      projetId: projetId
    }
  })

  if (!userProjet && user.role !== "superadmin") return false

  // Permissions selon le statut et le rôle
  const permissions: Record<string, string[]> = {
    "en_attente_validation_conducteur": ["conducteur_travaux"],
    "en_attente_validation_logistique": ["responsable_logistique"],
    "en_attente_validation_responsable_travaux": ["responsable_travaux"],
    "en_attente_validation_charge_affaire": ["charge_affaire"],
    "en_attente_preparation_appro": ["responsable_appro"],
    "en_attente_validation_livreur": ["responsable_livreur"],
    "en_attente_validation_finale_demandeur": ["employe"]
  }

  return permissions[status]?.includes(user.role) || false
}

/**
 * DELETE /api/demandes/[id] - Supprime une demande (si non validée)
 * Autorisé pour: brouillon, soumise, en_attente_validation_conducteur
 */
export const DELETE = withAuth(async (request: NextRequest, currentUser: any, context: { params: Promise<{ id: string }> }) => {
  try {
    const params = await context.params
    const demande = await prisma.demande.findUnique({
      where: { id: params.id }
    })

    if (!demande) {
      return NextResponse.json({ success: false, error: "Demande non trouvée" }, { status: 404 })
    }

    // Seul le créateur ou un superadmin peut supprimer une demande
    if (demande.technicienId !== currentUser.id && currentUser.role !== "superadmin") {
      return NextResponse.json({ success: false, error: "Accès non autorisé" }, { status: 403 })
    }

    // Superadmin peut supprimer n'importe quelle demande, quel que soit son statut
    if (currentUser.role !== "superadmin") {
      // Pour les autres utilisateurs, autoriser uniquement les demandes non validées
      const allowedStatuses = [
        "brouillon", 
        "soumise", 
        "en_attente_validation_conducteur",
        "en_attente_validation_logistique",
        "en_attente_validation_responsable_travaux",
        "en_attente_validation_charge_affaire"
      ]
      if (!allowedStatuses.includes(demande.status)) {
        return NextResponse.json({ 
          success: false, 
          error: "Cette demande a déjà été validée et ne peut plus être supprimée" 
        }, { status: 400 })
      }
    }

    await prisma.demande.delete({
      where: { id: params.id }
    })

    console.log(`🗑️ [SUPPRESSION] Demande ${demande.numero} supprimée par ${currentUser.nom}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur lors de la suppression de la demande:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
})

function getValidationType(status: string, role: string): string {
  // Définir le type de validation en fonction du statut et du rôle
  // Cette fonction peut être personnalisée pour répondre aux besoins spécifiques de votre application
  return "validation"
}

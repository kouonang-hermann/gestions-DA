import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/middleware"

/**
 * Flows de validation par type de demande
 */
const VALIDATION_FLOWS = {
  "materiel": [
    "soumise",
    "en_attente_validation_conducteur",
    "en_attente_validation_responsable_travaux",
    "en_attente_validation_charge_affaire",
    "en_attente_preparation_appro",
    "en_attente_validation_logistique",
    "en_attente_validation_finale_demandeur",
    "cloturee"
  ],
  "outillage": [
    "soumise",
    "en_attente_validation_qhse",
    "en_attente_validation_responsable_travaux",
    "en_attente_validation_charge_affaire",
    "en_attente_preparation_appro",
    "en_attente_validation_logistique",
    "en_attente_validation_finale_demandeur",
    "cloturee"
  ]
}

const ROLE_TO_STATUS = {
  "conducteur_travaux": "en_attente_validation_conducteur",
  "responsable_qhse": "en_attente_validation_qhse",
  "responsable_travaux": "en_attente_validation_responsable_travaux",
  "charge_affaire": "en_attente_validation_charge_affaire",
  "responsable_appro": "en_attente_preparation_appro",
  "responsable_logistique": "en_attente_validation_logistique"
}

/**
 * Vérifie si un utilisateur peut auto-valider une étape
 */
function canUserAutoValidateStep(demandeurRole: string, demandeType: string, status: string): boolean {
  const statusForRole = ROLE_TO_STATUS[demandeurRole as keyof typeof ROLE_TO_STATUS]
  if (!statusForRole) return false
  
  const flow = VALIDATION_FLOWS[demandeType as keyof typeof VALIDATION_FLOWS]
  return status === statusForRole && flow.includes(statusForRole)
}

/**
 * Détermine le prochain statut avec auto-validation intelligente
 */
function getNextStatusWithAutoValidation(currentStatus: string, userRole: string, demandeType: string, demandeurRole: string, targetStatus?: string): string | null {
  // Si un statut cible est fourni par le frontend, l'utiliser
  if (targetStatus) {
    console.log(`🎯 [API] Utilisation du statut cible fourni: ${targetStatus}`)
    return targetStatus
  }

  const flow = VALIDATION_FLOWS[demandeType as keyof typeof VALIDATION_FLOWS]
  if (!flow) return null

  const currentIndex = flow.indexOf(currentStatus)
  if (currentIndex === -1 || currentIndex >= flow.length - 1) return null

  let nextIndex = currentIndex + 1
  let nextStatus = flow[nextIndex]

  // Vérifier les auto-validations successives
  while (nextIndex < flow.length - 1) {
    const canAutoValidate = canUserAutoValidateStep(demandeurRole, demandeType, nextStatus)
    
    if (canAutoValidate) {
      console.log(`🔄 [API AUTO-VALIDATION] ${demandeurRole} peut auto-valider l'étape: ${nextStatus}`)
      nextIndex++
      nextStatus = flow[nextIndex]
    } else {
      break
    }
  }

  return nextStatus
}

/**
 * Détermine le prochain statut selon le statut actuel et le rôle (fonction legacy)
 */
function getNextStatus(currentStatus: string, userRole: string, demandeType: string): string | null {
  const transitions: Record<string, Record<string, string>> = {
    // Flow Matériel: Conducteur -> Responsable Travaux -> Chargé Affaire -> Appro -> Logistique -> Demandeur
    "en_attente_validation_conducteur": {
      "conducteur_travaux": "en_attente_validation_responsable_travaux"
    },
    // Flow Outillage: QHSE -> Responsable Travaux -> Chargé Affaire -> Appro -> Logistique -> Demandeur  
    "en_attente_validation_qhse": {
      "responsable_qhse": "en_attente_validation_responsable_travaux"
    },
    "en_attente_validation_responsable_travaux": {
      "responsable_travaux": "en_attente_validation_charge_affaire"
    },
    "en_attente_validation_charge_affaire": {
      "charge_affaire": "en_attente_preparation_appro"
    },
    "en_attente_preparation_appro": {
      "responsable_appro": "en_attente_validation_logistique"
    },
    "en_attente_validation_logistique": {
      "responsable_logistique": "en_attente_validation_finale_demandeur"
    },
    "en_attente_validation_finale_demandeur": {
      "employe": "cloturee"
    }
  }

  return transitions[currentStatus]?.[userRole] || null
}

/**
 * POST /api/demandes/[id]/actions - Exécute une action sur une demande
 */
export const POST = withAuth(async (request: NextRequest, currentUser: any, context: { params: Promise<{ id: string }> }) => {
  try {
    const params = await context.params
    const { action, commentaire, quantitesSorties, quantites, itemsModifications, targetStatus } = await request.json()

    console.log(`🚀 [API] ${currentUser.nom} (${currentUser.role}) exécute "${action}" sur ${params.id}`)
    console.log(`📋 [API] Payload reçu:`, { action, commentaire, targetStatus })

    // Récupérer la demande
    const demande = await prisma.demande.findUnique({
      where: { id: params.id },
      include: {
        projet: true,
        technicien: true,
        items: {
          include: {
            article: true
          }
        },
        validationSignatures: true,
        sortieAppro: true
      }
    })

    if (!demande) {
      console.log(`❌ [API] Demande ${params.id} non trouvée`)
      return NextResponse.json({ success: false, error: "Demande non trouvée" }, { status: 404 })
    }

    console.log(`📋 [API] Demande trouvée: ${demande.numero}, statut=${demande.status}, demandeur=${demande.technicienId}`)
    console.log(`📋 [API] Projet de la demande: ${demande.projetId} (${demande.projet?.nom})`)

    // Vérifier l'accès au projet (sauf pour le demandeur original qui peut toujours clôturer sa demande)
    const userProjet = await prisma.userProjet.findFirst({
      where: {
        userId: currentUser.id,
        projetId: demande.projetId
      }
    })

    const isOriginalRequester = demande.technicienId === currentUser.id
    const isSuperAdmin = currentUser.role === "superadmin"
    const isTransversalValidator = ["responsable_appro", "responsable_logistique"].includes(currentUser.role)
    
    console.log(`🔐 [API] Vérifications d'accès:`)
    console.log(`  - User ID: ${currentUser.id}`)
    console.log(`  - Projet ID: ${demande.projetId}`)
    console.log(`  - UserProjet trouvé: ${!!userProjet}`)
    console.log(`  - Demandeur original: ${isOriginalRequester}`)
    console.log(`  - Super admin: ${isSuperAdmin}`)
    console.log(`  - Validateur transversal (appro/logistique): ${isTransversalValidator}`)
    
    if (!userProjet && !isOriginalRequester && !isSuperAdmin && !isTransversalValidator) {
      console.log(`❌ [API] Accès refusé au projet ${demande.projetId}`)
      return NextResponse.json({ 
        success: false, 
        error: `Accès non autorisé à ce projet. Vous devez être assigné au projet "${demande.projet?.nom || demande.projetId}"` 
      }, { status: 403 })
    }
    
    console.log(`✅ [API] Accès au projet autorisé`)

    let newStatus = demande.status
    const updates: any = {}

    // Vérifier les permissions et exécuter l'action
    switch (action) {
      case "valider":
        // Utiliser la nouvelle logique d'auto-validation intelligente
        const nextStatus = getNextStatusWithAutoValidation(
          demande.status, 
          currentUser.role, 
          demande.type, 
          demande.technicien?.role || "employe",
          targetStatus
        )
        
        if (!nextStatus) {
          return NextResponse.json({ success: false, error: "Action non autorisée pour ce rôle et statut" }, { status: 403 })
        }
        
        console.log(`🔄 [API] Transition: ${demande.status} → ${nextStatus} (demandeur: ${demande.technicien?.role})`)
        
        // Vérifications de permissions (seulement si pas d'auto-validation)
        if (!targetStatus) {
          // Vérifications spécifiques par type de demande
          if (demande.status === "en_attente_validation_conducteur" && currentUser.role !== "conducteur_travaux") {
            return NextResponse.json({ success: false, error: "Seul le conducteur de travaux peut valider les demandes de matériel" }, { status: 403 })
          }
          
          if (demande.status === ("en_attente_validation_responsable_travaux" as any) && currentUser.role !== "responsable_travaux") {
            return NextResponse.json({ success: false, error: "Seul le responsable des travaux peut valider à cette étape" }, { status: 403 })
          }
          
          if (demande.status === "en_attente_validation_qhse" && currentUser.role !== "responsable_qhse") {
            return NextResponse.json({ success: false, error: "Seul le responsable QHSE peut valider les demandes d'outillage" }, { status: 403 })
          }
          
          if (demande.status === "en_attente_validation_charge_affaire" && currentUser.role !== "charge_affaire") {
            return NextResponse.json({ success: false, error: "Seul le chargé d'affaires peut valider à cette étape" }, { status: 403 })
          }
          
          if (demande.status === "en_attente_preparation_appro" && currentUser.role !== "responsable_appro") {
            return NextResponse.json({ success: false, error: "Seul le responsable appro peut préparer la sortie" }, { status: 403 })
          }
          
          if (demande.status === "en_attente_validation_logistique" && currentUser.role !== "responsable_logistique") {
            return NextResponse.json({ success: false, error: "Seul le responsable logistique peut valider à cette étape" }, { status: 403 })
          }
          
          if (demande.status === "en_attente_validation_finale_demandeur" && demande.technicienId !== currentUser.id) {
            return NextResponse.json({ success: false, error: "Seul le demandeur peut valider finalement sa demande" }, { status: 403 })
          }
        }
        
        newStatus = nextStatus as any
        
        // Mettre à jour les quantités validées si fournies
        if (quantites) {
          for (const [itemId, quantiteValidee] of Object.entries(quantites)) {
            await prisma.itemDemande.update({
              where: { id: itemId },
              data: { quantiteValidee: quantiteValidee as number }
            })
          }
        }
        
        // Permettre aux valideurs de modifier les articles (nom, référence, quantité)
        if (itemsModifications && (
          currentUser.role === 'conducteur_travaux' || 
          currentUser.role === 'responsable_travaux' || 
          currentUser.role === 'responsable_qhse' ||
          currentUser.role === 'charge_affaire'
        )) {
          for (const [itemId, modifications] of Object.entries(itemsModifications)) {
            const updateData: any = {}
            const modifs = modifications as any
            
            // Mise à jour de l'article associé, pas de l'item directement
            if (modifs.nom || modifs.reference || modifs.description) {
              const item = await prisma.itemDemande.findUnique({
                where: { id: itemId },
                include: { article: true }
              })
              
              if (item?.article) {
                const articleUpdateData: any = {}
                if (modifs.nom) articleUpdateData.nom = modifs.nom
                if (modifs.reference) articleUpdateData.reference = modifs.reference
                if (modifs.description) articleUpdateData.description = modifs.description
                
                if (Object.keys(articleUpdateData).length > 0) {
                  await prisma.article.update({
                    where: { id: item.article.id },
                    data: articleUpdateData
                  })
                }
              }
            }
            
            // Mise à jour de la quantité demandée sur l'item
            if (modifs.quantite) {
              await prisma.itemDemande.update({
                where: { id: itemId },
                data: { quantiteDemandee: modifs.quantite }
              })
            }
          }
        }
        
        // Pour appro et logistique : seulement modification des quantités
        if (itemsModifications && (
          currentUser.role === 'responsable_appro' || 
          currentUser.role === 'responsable_logistique'
        )) {
          for (const [itemId, modifications] of Object.entries(itemsModifications)) {
            const modifs = modifications as any
            
            if (modifs.quantite) {
              await prisma.itemDemande.update({
                where: { id: itemId },
                data: { quantiteDemandee: modifs.quantite }
              })
            }
          }
        }
        
        // Créer/mettre à jour la signature de validation (éviter les doublons)
        await prisma.validationSignature.upsert({
          where: {
            demandeId_type: {
              demandeId: demande.id,
              type: getValidationType(demande.status, currentUser.role)
            }
          },
          update: {
            userId: currentUser.id,
            commentaire: commentaire || null,
            signature: `${currentUser.id}-${action}-${Date.now()}`,
            date: new Date()
          },
          create: {
            userId: currentUser.id,
            demandeId: demande.id,
            commentaire: commentaire || null,
            signature: `${currentUser.id}-${action}-${Date.now()}`,
            type: getValidationType(demande.status, currentUser.role)
          }
        })
        break

      case "valider_sortie":
        // Action spécifique pour la logistique - marquer comme livré
        if (demande.status === "en_attente_validation_logistique") {
          newStatus = "en_attente_validation_finale_demandeur"
        } else {
          return NextResponse.json({ success: false, error: "Action non autorisée pour ce statut" }, { status: 403 })
        }
        break

      case "cloturer":
        console.log(`🔒 [API] Tentative de clôture:`)
        console.log(`  - Statut actuel: ${demande.status}`)
        console.log(`  - Demandeur: ${demande.technicienId}`)
        console.log(`  - Utilisateur actuel: ${currentUser.id}`)
        console.log(`  - Est le demandeur: ${demande.technicienId === currentUser.id}`)
        
        // Action spécifique pour le demandeur - clôturer la demande après livraison
        if (demande.status === "en_attente_validation_finale_demandeur" && demande.technicienId === currentUser.id) {
          console.log(`✅ [API] Clôture autorisée`)
          newStatus = "cloturee"
        } else if (demande.status !== "en_attente_validation_finale_demandeur") {
          console.log(`❌ [API] Statut incorrect pour clôture: ${demande.status}`)
          return NextResponse.json({ success: false, error: "La demande n'est pas prête à être clôturée" }, { status: 403 })
        } else {
          console.log(`❌ [API] Utilisateur non autorisé à clôturer`)
          return NextResponse.json({ success: false, error: "Seul le demandeur original peut clôturer sa demande" }, { status: 403 })
        }
        break

      case "rejeter":
        if (demande.status === "en_attente_validation_conducteur" || 
            demande.status === ("en_attente_validation_responsable_travaux" as any) || 
            demande.status === "en_attente_validation_qhse" ||
            demande.status === "en_attente_validation_charge_affaire") {
          newStatus = "rejetee"
          updates.rejetMotif = commentaire
        } else {
          return NextResponse.json({ success: false, error: "Action non autorisée" }, { status: 403 })
        }
        break

      case "preparer_sortie":
        console.log(`📦 [PREPARER-SORTIE] Vérifications:`)
        console.log(`  - Status demande: ${demande.status}`)
        console.log(`  - Role utilisateur: ${currentUser.role}`)
        console.log(`  - Status attendu: en_attente_preparation_appro`)
        console.log(`  - Role attendu: responsable_appro`)
        
        if (demande.status === ("en_attente_preparation_appro" as any) && currentUser.role === "responsable_appro") {
          const nextStatus = getNextStatus(demande.status, currentUser.role, demande.type)
          console.log(`  - Next status calculé: ${nextStatus}`)
          
          if (!nextStatus) {
            console.log(`❌ [PREPARER-SORTIE] Impossible de déterminer le prochain statut`)
            return NextResponse.json({ success: false, error: "Impossible de déterminer le prochain statut de la demande" }, { status: 403 })
          }
          
          console.log(`✅ [PREPARER-SORTIE] Préparation de sortie validée, transition: ${demande.status} → ${nextStatus}`)
          
          newStatus = nextStatus as any
          
          // Créer la sortie appro
          await prisma.sortieSignature.create({
            data: {
              userId: currentUser.id,
              demandeId: demande.id,
              commentaire: commentaire || null,
              signature: `${currentUser.id}-sortie-${Date.now()}`,
              quantitesSorties: quantitesSorties || {},
              dateModificationLimite: new Date(Date.now() + 45 * 60 * 1000) // +45 minutes
            }
          })
          
          console.log(`✅ [PREPARER-SORTIE] Sortie signature créée`)
        } else {
          console.log(`❌ [PREPARER-SORTIE] Conditions non remplies:`)
          console.log(`  - Status correct: ${demande.status === "en_attente_preparation_appro"}`)
          console.log(`  - Role correct: ${currentUser.role === "responsable_appro"}`)
          return NextResponse.json({ 
            success: false, 
            error: `Action non autorisée. Status: ${demande.status}, Role: ${currentUser.role}` 
          }, { status: 403 })
        }
        break

      case "validation_finale_demandeur":
        if ((demande.status as string) === "en_attente_validation_finale_demandeur" && demande.technicienId === currentUser.id) {
          const nextStatus = getNextStatus(demande.status, currentUser.role, demande.type)
          if (!nextStatus) {
            return NextResponse.json({ success: false, error: "Action non autorisée pour ce rôle et statut" }, { status: 403 })
          }
          
          newStatus = nextStatus as any
          updates.dateValidationFinale = new Date()
        } else {
          return NextResponse.json({ success: false, error: "Action non autorisée" }, { status: 403 })
        }
        break

      default:
        return NextResponse.json({ success: false, error: "Action non reconnue" }, { status: 400 })
    }

    // Mettre à jour la demande
    const updatedDemande = await prisma.demande.update({
      where: { id: params.id },
      data: {
        status: newStatus,
        ...updates,
        dateModification: new Date()
      },
      include: {
        projet: true,
        technicien: true,
        items: {
          include: {
            article: true
          }
        },
        validationSignatures: true,
        sortieAppro: true
      }
    })

    // Créer une entrée d'historique
    await prisma.historyEntry.create({
      data: {
        demandeId: params.id,
        userId: currentUser.id,
        action: getActionLabel(action),
        ancienStatus: demande.status,
        nouveauStatus: newStatus,
        commentaire: commentaire || null,
        signature: `${currentUser.id}-${Date.now()}-${action}`
      }
    })

    // Créer une notification pour le demandeur
    await prisma.notification.create({
      data: {
        userId: demande.technicienId,
        titre: "Mise à jour de demande",
        message: `Votre demande ${demande.numero} a été ${getActionLabel(action)}`,
        demandeId: params.id,
        projetId: demande.projetId
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        demande: updatedDemande
      }
    })
  } catch (error) {
    console.error("Erreur lors de l'exécution de l'action:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
})

function getValidationType(status: string, role: string): string {
  if (status === "en_attente_validation_conducteur") return "conducteur"
  if (status === "en_attente_validation_responsable_travaux") return "responsable_travaux"
  if (status === "en_attente_validation_qhse") return "qhse"
  if (status === "en_attente_validation_charge_affaire") return "charge_affaire"
  if (status === "en_attente_preparation_appro") return "appro"
  if (status === "en_attente_validation_logistique") return "logistique"
  return "finale"
}

function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    valider: "validée",
    rejeter: "rejetée",
    preparer_sortie: "préparée pour sortie",
    confirmer: "confirmée",
    valider_sortie: "livrée",
    cloturer: "clôturée"
  }
  return labels[action] || "mise à jour"
}

import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { withAuth } from "@/lib/middleware"
import { notificationService } from "@/services/notificationService"
import type { DemandeStatus } from "@/types"
import crypto from "crypto"

/**
 * Flows de validation par type de demande
 */
const VALIDATION_FLOWS: Record<string, DemandeStatus[]> = {
  "materiel": [
    "soumise",
    "en_attente_validation_conducteur",
    "en_attente_validation_responsable_travaux",
    "en_attente_validation_charge_affaire",
    "en_attente_preparation_appro",
    "en_attente_reception_livreur",
    "en_attente_livraison",
    "en_attente_validation_finale_demandeur",
    "cloturee"
  ],
  "outillage": [
    "soumise",
    "en_attente_validation_logistique",
    "en_attente_validation_responsable_travaux",
    "en_attente_validation_charge_affaire",
    "en_attente_preparation_logistique",
    "en_attente_reception_livreur",
    "en_attente_livraison",
    "en_attente_validation_finale_demandeur",
    "cloturee"
  ]
}

const ROLE_TO_STATUS: Record<string, DemandeStatus> = {
  "conducteur_travaux": "en_attente_validation_conducteur",
  "responsable_logistique": "en_attente_validation_logistique",
  "responsable_travaux": "en_attente_validation_responsable_travaux",
  "charge_affaire": "en_attente_validation_charge_affaire",
  "responsable_appro": "en_attente_preparation_appro",
  "responsable_livreur": "en_attente_reception_livreur",
  "responsable_logistique_preparation": "en_attente_preparation_logistique"
}

/**
 * Vérifie si un utilisateur peut auto-valider une étape
 */
function canUserAutoValidateStep(demandeurRole: string, demandeType: string, status: DemandeStatus): boolean {
  const statusForRole = ROLE_TO_STATUS[demandeurRole as keyof typeof ROLE_TO_STATUS]
  if (!statusForRole) return false
  
  const flow = VALIDATION_FLOWS[demandeType as keyof typeof VALIDATION_FLOWS]
  return status === statusForRole && flow.includes(statusForRole)
}

/**
 * Détermine le prochain statut avec auto-validation intelligente
 */
function getNextStatusWithAutoValidation(currentStatus: DemandeStatus, userRole: string, demandeType: string, demandeurRole: string, targetStatus?: DemandeStatus): DemandeStatus | null {
  // Si un statut cible est fourni par le frontend, l'utiliser
  if (targetStatus) {
    console.log(`🎯 [API] Utilisation du statut cible fourni: ${targetStatus}`)
    return targetStatus
  }

  // CAS SPÉCIAL : Validation à l'étape chargé d'affaire - dépend du type de demande
  // Le superadmin ou le chargé d'affaire peuvent valider à cette étape
  if (currentStatus === "en_attente_validation_charge_affaire" && (userRole === "charge_affaire" || userRole === "superadmin")) {
    const nextStatus = demandeType === "materiel" ? "en_attente_preparation_appro" : "en_attente_preparation_logistique"
    console.log(`🎯 [API CHARGE-AFFAIRE] Type: ${demandeType} → Prochain statut: ${nextStatus} (validé par ${userRole})`)
    return nextStatus as DemandeStatus
  }

  const flow = VALIDATION_FLOWS[demandeType as keyof typeof VALIDATION_FLOWS]
  if (!flow) return null

  const currentIndex = flow.indexOf(currentStatus)
  if (currentIndex === -1 || currentIndex >= flow.length - 1) return null

  let nextIndex = currentIndex + 1
  let nextStatus = flow[nextIndex]

  console.log(`🔄 [API] Calcul du prochain statut depuis ${currentStatus} → ${nextStatus}`)
  console.log(`🔄 [API] Demandeur original: ${demandeurRole}, Valideur actuel: ${userRole}`)

  // Vérifier les auto-validations successives
  // IMPORTANT: On vérifie si le demandeur ORIGINAL peut auto-valider les étapes suivantes
  // Cela permet de sauter les étapes où le demandeur a déjà le rôle de valideur
  while (nextIndex < flow.length - 1) {
    const canAutoValidate = canUserAutoValidateStep(demandeurRole, demandeType, nextStatus)
    
    if (canAutoValidate) {
      console.log(`🔄 [API AUTO-VALIDATION] ${demandeurRole} peut auto-valider l'étape: ${nextStatus}, passage à l'étape suivante`)
      nextIndex++
      nextStatus = flow[nextIndex]
    } else {
      console.log(`✋ [API] ${demandeurRole} ne peut pas auto-valider ${nextStatus}, arrêt ici`)
      break
    }
  }

  console.log(`✅ [API] Prochain statut déterminé: ${nextStatus}`)
  return nextStatus
}

/**
 * Détermine le prochain statut selon le statut actuel et le rôle (fonction legacy)
 */
function getNextStatus(currentStatus: DemandeStatus, userRole: string, demandeType: string): DemandeStatus | null {
  // Logique spéciale pour l'étape chargé d'affaire : dépend du type de demande
  // Le superadmin ou le chargé d'affaire peuvent valider à cette étape
  if (currentStatus === "en_attente_validation_charge_affaire" && (userRole === "charge_affaire" || userRole === "superadmin")) {
    return demandeType === "materiel" ? "en_attente_preparation_appro" : "en_attente_preparation_logistique"
  }

  const transitions: Record<string, Record<string, DemandeStatus>> = {
    // Flow Matériel: Conducteur -> Responsable Travaux -> Chargé Affaire -> Appro -> Livreur -> Demandeur
    "en_attente_validation_conducteur": {
      "conducteur_travaux": "en_attente_validation_responsable_travaux"
    },
    // Flow Outillage: Logistique -> Responsable Travaux -> Chargé Affaire -> Préparation Logistique -> Livreur -> Demandeur  
    "en_attente_validation_logistique": {
      "responsable_logistique": "en_attente_validation_responsable_travaux"
    },
    "en_attente_preparation_logistique": {
      "responsable_logistique": "en_attente_reception_livreur"
    },
    "en_attente_validation_responsable_travaux": {
      "responsable_travaux": "en_attente_validation_charge_affaire"
    },
    "en_attente_preparation_appro": {
      "responsable_appro": "en_attente_reception_livreur"
    },
    "en_attente_reception_livreur": {
      "responsable_livreur": "en_attente_livraison",
      "livreur": "en_attente_livraison",
      "employe": "en_attente_livraison",
      "conducteur_travaux": "en_attente_livraison",
      "responsable_travaux": "en_attente_livraison",
      "responsable_logistique": "en_attente_livraison",
      "responsable_appro": "en_attente_livraison",
      "charge_affaire": "en_attente_livraison",
      "superadmin": "en_attente_livraison"
    },
    "en_attente_livraison": {
      "responsable_livreur": "en_attente_validation_finale_demandeur",
      "livreur": "en_attente_validation_finale_demandeur",
      "employe": "en_attente_validation_finale_demandeur",
      "conducteur_travaux": "en_attente_validation_finale_demandeur",
      "responsable_travaux": "en_attente_validation_finale_demandeur",
      "responsable_logistique": "en_attente_validation_finale_demandeur",
      "responsable_appro": "en_attente_validation_finale_demandeur",
      "charge_affaire": "en_attente_validation_finale_demandeur",
      "superadmin": "en_attente_validation_finale_demandeur"
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
    const { action, commentaire, quantitesSorties, quantites, itemsModifications, targetStatus, livreurAssigneId } = await request.json()

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
        sortieSignature: true
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
    const isTransversalValidator = ["responsable_appro", "responsable_livreur"].includes(currentUser.role)
    
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
        console.log(`🔍 [API VALIDATION] Début de la validation:`)
        console.log(`  - Demande: ${demande.numero}`)
        console.log(`  - Statut actuel: ${demande.status}`)
        console.log(`  - Type: ${demande.type}`)
        console.log(`  - Valideur: ${currentUser.nom} (${currentUser.role})`)
        console.log(`  - Demandeur original: ${demande.technicien?.nom} (${demande.technicien?.role})`)
        console.log(`  - Target status fourni: ${targetStatus || 'aucun'}`)
        
        // Utiliser la nouvelle logique d'auto-validation intelligente
        const nextStatus = getNextStatusWithAutoValidation(
          demande.status, 
          currentUser.role, 
          demande.type, 
          demande.technicien?.role || "employe",
          targetStatus
        )
        
        if (!nextStatus) {
          console.log(`❌ [API VALIDATION] Aucun prochain statut trouvé`)
          return NextResponse.json({ success: false, error: "Action non autorisée pour ce rôle et statut" }, { status: 403 })
        }
        
        console.log(`🔄 [API VALIDATION] Transition calculée: ${demande.status} → ${nextStatus}`)
        
        // Vérifications de permissions (seulement si pas d'auto-validation)
        // IMPORTANT: Le superadmin peut valider à n'importe quelle étape
        if (!targetStatus && currentUser.role !== "superadmin") {
          // Vérifications spécifiques par type de demande
          if (demande.status === "en_attente_validation_conducteur" && currentUser.role !== "conducteur_travaux") {
            return NextResponse.json({ success: false, error: "Seul le conducteur de travaux peut valider les demandes de matériel" }, { status: 403 })
          }
          
          if (demande.status === ("en_attente_validation_responsable_travaux" as any) && currentUser.role !== "responsable_travaux") {
            return NextResponse.json({ success: false, error: "Seul le responsable des travaux peut valider à cette étape" }, { status: 403 })
          }
          
          if (demande.status === "en_attente_validation_logistique" && currentUser.role !== "responsable_logistique") {
            return NextResponse.json({ success: false, error: "Seul le responsable Logistique peut valider les demandes d'outillage" }, { status: 403 })
          }
          
          if (demande.status === "en_attente_validation_charge_affaire" && currentUser.role !== "charge_affaire") {
            return NextResponse.json({ success: false, error: "Seul le chargé d'affaires peut valider à cette étape" }, { status: 403 })
          }
          
          if (demande.status === "en_attente_preparation_appro" && currentUser.role !== "responsable_appro") {
            return NextResponse.json({ success: false, error: "Seul le responsable appro peut préparer la sortie" }, { status: 403 })
          }
          
          if (demande.status === ("en_attente_preparation_logistique" as DemandeStatus) && currentUser.role !== "responsable_logistique") {
            return NextResponse.json({ success: false, error: "Seul le responsable Logistique peut préparer la sortie d'outillage" }, { status: 403 })
          }
          
          if ((demande.status === "en_attente_reception_livreur" || demande.status === "en_attente_livraison") && demande.livreurAssigneId !== currentUser.id) {
            return NextResponse.json({ success: false, error: "Seul le livreur assigné peut confirmer la réception et la livraison" }, { status: 403 })
          }
          
          if (demande.status === "en_attente_validation_finale_demandeur" && demande.technicienId !== currentUser.id) {
            return NextResponse.json({ success: false, error: "Seul le demandeur peut valider finalement sa demande" }, { status: 403 })
          }
        }
        
        // Log spécial si c'est un superadmin qui valide
        if (currentUser.role === "superadmin") {
          console.log(`👑 [API VALIDATION] Validation par SUPERADMIN - bypass des vérifications de rôle`)
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
            id: crypto.randomUUID(),
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

      case "valider_reception":
        console.log(`📦 [VALIDER-RECEPTION] Vérifications:`)
        console.log(`  - Status demande: ${demande.status}`)
        console.log(`  - Livreur assigné: ${demande.livreurAssigneId}`)
        console.log(`  - Utilisateur actuel: ${currentUser.id}`)
        console.log(`  - Est le livreur: ${demande.livreurAssigneId === currentUser.id}`)
        
        // Première validation : le livreur reçoit le matériel à livrer
        if (demande.status === "en_attente_reception_livreur" && demande.livreurAssigneId === currentUser.id) {
          console.log(`✅ [VALIDER-RECEPTION] Réception du matériel validée`)
          newStatus = "en_attente_livraison"
        } else if (demande.status !== "en_attente_reception_livreur") {
          console.log(`❌ [VALIDER-RECEPTION] Statut incorrect: ${demande.status}`)
          return NextResponse.json({ success: false, error: "La demande n'est pas en attente de réception" }, { status: 403 })
        } else {
          console.log(`❌ [VALIDER-RECEPTION] Utilisateur non autorisé`)
          return NextResponse.json({ success: false, error: "Seul le livreur assigné peut valider la réception" }, { status: 403 })
        }
        break

      case "valider_livraison":
        console.log(`🚚 [VALIDER-LIVRAISON] Vérifications:`)
        console.log(`  - Status demande: ${demande.status}`)
        console.log(`  - Livreur assigné: ${demande.livreurAssigneId}`)
        console.log(`  - Utilisateur actuel: ${currentUser.id}`)
        console.log(`  - Est le livreur: ${demande.livreurAssigneId === currentUser.id}`)
        
        // Deuxième validation : le livreur livre effectivement le matériel au demandeur
        if (demande.status === "en_attente_livraison" && demande.livreurAssigneId === currentUser.id) {
          console.log(`✅ [VALIDER-LIVRAISON] Livraison effective validée`)
          newStatus = "en_attente_validation_finale_demandeur"
        } else if (demande.status !== "en_attente_livraison") {
          console.log(`❌ [VALIDER-LIVRAISON] Statut incorrect: ${demande.status}`)
          return NextResponse.json({ success: false, error: "La demande n'est pas en attente de livraison" }, { status: 403 })
        } else {
          console.log(`❌ [VALIDER-LIVRAISON] Utilisateur non autorisé`)
          return NextResponse.json({ success: false, error: "Seul le livreur assigné peut valider la livraison" }, { status: 403 })
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
          
          // Marquer toutes les livraisons comme livrées
          await prisma.livraison.updateMany({
            where: { 
              demandeId: demande.id,
              statut: { in: ["prete", "en_cours"] }
            },
            data: { 
              statut: "livree",
              dateLivraison: new Date()
            }
          })
          
          console.log(`✅ [API] Toutes les livraisons marquées comme livrées`)
          
          newStatus = "cloturee"
        } else if (demande.status !== "en_attente_validation_finale_demandeur") {
          console.log(`❌ [API] Statut incorrect pour clôture: ${demande.status}`)
          return NextResponse.json({ success: false, error: "La demande n'est pas prête à être clôturée" }, { status: 403 })
        } else {
          console.log(`❌ [API] Utilisateur non autorisé à clôturer`)
          return NextResponse.json({ success: false, error: "Seul le demandeur original peut clôturer sa demande" }, { status: 403 })
        }
        break

      case "annuler":
        // Le demandeur peut annuler sa propre demande tant qu'elle n'a pas été validée
        if (demande.technicienId !== currentUser.id && currentUser.role !== "superadmin") {
          return NextResponse.json({ 
            success: false, 
            error: "Seul le demandeur original peut annuler sa demande" 
          }, { status: 403 })
        }
        
        // Vérifier que la demande n'a pas encore été validée (statuts autorisés pour annulation)
        const annulableStatuses = [
          "brouillon",
          "soumise",
          "en_attente_validation_conducteur",
          "en_attente_validation_logistique"
        ]
        
        if (!annulableStatuses.includes(demande.status)) {
          return NextResponse.json({ 
            success: false, 
            error: "Cette demande ne peut plus être annulée car elle a déjà été validée par un niveau supérieur" 
          }, { status: 403 })
        }
        
        newStatus = "archivee"
        updates.commentaire = commentaire || "Demande annulée par le demandeur"
        console.log(`🗑️ [API] Demande ${demande.numero} annulée par ${currentUser.nom}`)
        break

      case "rejeter":
        if (demande.status === "en_attente_validation_conducteur" || 
            demande.status === ("en_attente_validation_responsable_travaux" as any) || 
            demande.status === "en_attente_validation_logistique" ||
            demande.status === "en_attente_validation_charge_affaire") {
          newStatus = "rejetee"
          updates.rejetMotif = commentaire
        } else {
          return NextResponse.json({ success: false, error: "Action non autorisée" }, { status: 403 })
        }
        break

      case "renvoyer":
        // Permettre au demandeur de renvoyer une demande rejetée après modification
        if (demande.status !== "rejetee") {
          return NextResponse.json({ success: false, error: "Seules les demandes rejetées peuvent être renvoyées" }, { status: 403 })
        }
        
        if (demande.technicienId !== currentUser.id && currentUser.role !== "superadmin") {
          return NextResponse.json({ success: false, error: "Seul le demandeur original peut renvoyer sa demande" }, { status: 403 })
        }
        
        // Remettre la demande au début du workflow selon son type
        if (demande.type === "materiel") {
          newStatus = "en_attente_validation_conducteur"
        } else if (demande.type === "outillage") {
          newStatus = "en_attente_validation_logistique"
        } else {
          newStatus = "soumise"
        }
        
        // Effacer le motif de rejet
        updates.rejetMotif = null
        
        console.log(`🔄 [API] Demande ${demande.numero} renvoyée par ${currentUser.nom} - nouveau statut: ${newStatus}`)
        break

      case "preparer_sortie":
        console.log(`📦 [PREPARER-SORTIE] Vérifications:`)
        console.log(`  - Status demande: ${demande.status}`)
        console.log(`  - Role utilisateur: ${currentUser.role}`)
        console.log(`  - Livreur assigné: ${livreurAssigneId}`)
        console.log(`  - Status attendu: en_attente_preparation_appro`)
        console.log(`  - Role attendu: responsable_appro`)
        
        if (demande.status === ("en_attente_preparation_appro" as any) && currentUser.role === "responsable_appro") {
          // Vérifier que le livreur est assigné
          if (!livreurAssigneId) {
            console.log(`❌ [PREPARER-SORTIE] Aucun livreur assigné`)
            return NextResponse.json({ 
              success: false, 
              error: "Vous devez choisir un livreur avant de valider la préparation" 
            }, { status: 400 })
          }

          // Vérifier que le livreur existe
          const livreur = await prisma.user.findUnique({
            where: { id: livreurAssigneId }
          })

          if (!livreur) {
            console.log(`❌ [PREPARER-SORTIE] Livreur ${livreurAssigneId} non trouvé`)
            return NextResponse.json({ 
              success: false, 
              error: "Le livreur sélectionné n'existe pas" 
            }, { status: 404 })
          }

          const nextStatus = getNextStatus(demande.status, currentUser.role, demande.type)
          console.log(`  - Next status calculé: ${nextStatus}`)
          
          if (!nextStatus) {
            console.log(`❌ [PREPARER-SORTIE] Impossible de déterminer le prochain statut`)
            return NextResponse.json({ success: false, error: "Impossible de déterminer le prochain statut de la demande" }, { status: 403 })
          }
          
          console.log(`✅ [PREPARER-SORTIE] Préparation de sortie validée, transition: ${demande.status} → ${nextStatus}`)
          console.log(`✅ [PREPARER-SORTIE] Livreur assigné: ${livreur.prenom} ${livreur.nom} (${livreur.role})`)
          
          newStatus = nextStatus as any
          
          // Assigner le livreur
          updates.livreurAssigneId = livreurAssigneId
          
          // Créer la sortie appro (ancien système - compatibilité)
          await prisma.sortieSignature.create({
            data: {
              id: crypto.randomUUID(),
              userId: currentUser.id,
              demandeId: demande.id,
              commentaire: commentaire || null,
              signature: `${currentUser.id}-sortie-${Date.now()}`,
              quantitesSorties: quantitesSorties || {},
              dateModificationLimite: new Date(Date.now() + 45 * 60 * 1000) // +45 minutes
            }
          })
          
          console.log(`✅ [PREPARER-SORTIE] Sortie signature créée`)

          // NOUVEAU : Créer automatiquement une livraison complète (système de livraisons multiples)
          // Cela permet la compatibilité avec l'ancien système tout en supportant le nouveau
          const items = await prisma.itemDemande.findMany({
            where: { demandeId: demande.id }
          })
          
          await prisma.livraison.create({
            data: {
              id: crypto.randomUUID(),
              demandeId: demande.id,
              livreurId: livreurAssigneId,
              commentaire: commentaire || "Livraison complète créée automatiquement",
              statut: "prete",
              items: {
                create: items.map(item => ({
                  id: crypto.randomUUID(),
                  itemDemandeId: item.id,
                  quantiteLivree: item.quantiteValidee || item.quantiteDemandee
                }))
              }
            }
          })
          
          console.log(`✅ [PREPARER-SORTIE] Livraison complète créée automatiquement`)

          // Envoyer notification au livreur assigné
          await notificationService.notifyLivreurAssigne(demande.id, livreurAssigneId, currentUser.id)
          console.log(`✅ [PREPARER-SORTIE] Notification envoyée au livreur`)
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

      case "preparer_sortie_logistique":
        console.log(`📦 [PREPARER-SORTIE-LOGISTIQUE] Vérifications:`)
        console.log(`  - Status demande: ${demande.status}`)
        console.log(`  - Role utilisateur: ${currentUser.role}`)
        console.log(`  - Livreur assigné: ${livreurAssigneId}`)
        console.log(`  - Status attendu: en_attente_preparation_logistique`)
        console.log(`  - Role attendu: responsable_logistique`)
        
        if (demande.status === ("en_attente_preparation_logistique" as any) && currentUser.role === "responsable_logistique") {
          // Vérifier que le livreur est assigné
          if (!livreurAssigneId) {
            console.log(`❌ [PREPARER-SORTIE-LOGISTIQUE] Aucun livreur assigné`)
            return NextResponse.json({ 
              success: false, 
              error: "Vous devez choisir un livreur avant de valider la préparation" 
            }, { status: 400 })
          }

          // Vérifier que le livreur existe
          const livreurLogistique = await prisma.user.findUnique({
            where: { id: livreurAssigneId }
          })

          if (!livreurLogistique) {
            console.log(`❌ [PREPARER-SORTIE-LOGISTIQUE] Livreur ${livreurAssigneId} non trouvé`)
            return NextResponse.json({ 
              success: false, 
              error: "Le livreur sélectionné n'existe pas" 
            }, { status: 404 })
          }

          const nextStatusLogistique = getNextStatus(demande.status, currentUser.role, demande.type)
          console.log(`  - Next status calculé: ${nextStatusLogistique}`)
          
          if (!nextStatusLogistique) {
            console.log(`❌ [PREPARER-SORTIE-LOGISTIQUE] Impossible de déterminer le prochain statut`)
            return NextResponse.json({ success: false, error: "Impossible de déterminer le prochain statut de la demande" }, { status: 403 })
          }
          
          console.log(`✅ [PREPARER-SORTIE-LOGISTIQUE] Préparation de sortie validée, transition: ${demande.status} → ${nextStatusLogistique}`)
          console.log(`✅ [PREPARER-SORTIE-LOGISTIQUE] Livreur assigné: ${livreurLogistique.prenom} ${livreurLogistique.nom} (${livreurLogistique.role})`)
          
          newStatus = nextStatusLogistique as any
          
          // Assigner le livreur
          updates.livreurAssigneId = livreurAssigneId
          
          // Créer la sortie signature (pour traçabilité)
          await prisma.sortieSignature.create({
            data: {
              id: crypto.randomUUID(),
              userId: currentUser.id,
              demandeId: demande.id,
              commentaire: commentaire || null,
              signature: `${currentUser.id}-sortie-logistique-${Date.now()}`,
              quantitesSorties: quantitesSorties || {},
              dateModificationLimite: new Date(Date.now() + 45 * 60 * 1000) // +45 minutes
            }
          })
          
          console.log(`✅ [PREPARER-SORTIE-LOGISTIQUE] Sortie signature créée`)

          // Créer automatiquement une livraison complète
          const itemsLogistique = await prisma.itemDemande.findMany({
            where: { demandeId: demande.id }
          })
          
          await prisma.livraison.create({
            data: {
              id: crypto.randomUUID(),
              demandeId: demande.id,
              livreurId: livreurAssigneId,
              commentaire: commentaire || "Livraison outillage créée automatiquement",
              statut: "prete",
              items: {
                create: itemsLogistique.map(item => ({
                  id: crypto.randomUUID(),
                  itemDemandeId: item.id,
                  quantiteLivree: item.quantiteValidee || item.quantiteDemandee
                }))
              }
            }
          })
          
          console.log(`✅ [PREPARER-SORTIE-LOGISTIQUE] Livraison complète créée automatiquement`)

          // Envoyer notification au livreur assigné
          await notificationService.notifyLivreurAssigne(demande.id, livreurAssigneId, currentUser.id)
          console.log(`✅ [PREPARER-SORTIE-LOGISTIQUE] Notification envoyée au livreur`)
        } else {
          console.log(`❌ [PREPARER-SORTIE-LOGISTIQUE] Conditions non remplies:`)
          console.log(`  - Status correct: ${demande.status === "en_attente_preparation_logistique"}`)
          console.log(`  - Role correct: ${currentUser.role === "responsable_logistique"}`)
          return NextResponse.json({ 
            success: false, 
            error: `Action non autorisée. Status: ${demande.status}, Role: ${currentUser.role}` 
          }, { status: 403 })
        }
        break

      case "confirmer_reception_livreur":
        console.log(`📦 [RECEPTION-LIVREUR] Vérifications:`)
        console.log(`  - Status demande: ${demande.status}`)
        console.log(`  - Role utilisateur: ${currentUser.role}`)
        console.log(`  - Livreur assigné: ${demande.livreurAssigneId}`)
        
        if (demande.status === "en_attente_reception_livreur" && demande.livreurAssigneId === currentUser.id) {
          const nextStatus = getNextStatus(demande.status, currentUser.role, demande.type)
          console.log(`  - Next status calculé: ${nextStatus}`)
          
          if (!nextStatus) {
            console.log(`❌ [RECEPTION-LIVREUR] Impossible de déterminer le prochain statut`)
            return NextResponse.json({ success: false, error: "Impossible de déterminer le prochain statut de la demande" }, { status: 403 })
          }
          
          console.log(`✅ [RECEPTION-LIVREUR] Réception confirmée, transition: ${demande.status} → ${nextStatus}`)
          
          newStatus = nextStatus as any
          updates.dateReceptionLivreur = new Date()
          
          console.log(`✅ [RECEPTION-LIVREUR] Date de réception enregistrée`)
        } else {
          console.log(`❌ [RECEPTION-LIVREUR] Conditions non remplies:`)
          console.log(`  - Status correct: ${demande.status === "en_attente_reception_livreur"}`)
          console.log(`  - Livreur assigné correct: ${demande.livreurAssigneId === currentUser.id}`)
          return NextResponse.json({ 
            success: false, 
            error: `Action non autorisée. Seul le livreur assigné peut confirmer la réception.` 
          }, { status: 403 })
        }
        break

      case "confirmer_livraison":
        console.log(`🚚 [LIVRAISON] Vérifications:`)
        console.log(`  - Status demande: ${demande.status}`)
        console.log(`  - Role utilisateur: ${currentUser.role}`)
        console.log(`  - Livreur assigné: ${demande.livreurAssigneId}`)
        
        if (demande.status === "en_attente_livraison" && demande.livreurAssigneId === currentUser.id) {
          const nextStatus = getNextStatus(demande.status, currentUser.role, demande.type)
          console.log(`  - Next status calculé: ${nextStatus}`)
          
          if (!nextStatus) {
            console.log(`❌ [LIVRAISON] Impossible de déterminer le prochain statut`)
            return NextResponse.json({ success: false, error: "Impossible de déterminer le prochain statut de la demande" }, { status: 403 })
          }
          
          console.log(`✅ [LIVRAISON] Livraison confirmée, transition: ${demande.status} → ${nextStatus}`)
          
          newStatus = nextStatus as any
          updates.dateLivraison = new Date()
          
          // Notifier le demandeur que la livraison est effectuée
          await notificationService.notifyDemandeStatusChange(
            demande.id,
            demande.technicienId,
            demande.status,
            nextStatus,
            currentUser.id
          )
          
          console.log(`✅ [LIVRAISON] Date de livraison enregistrée et demandeur notifié`)
        } else {
          console.log(`❌ [LIVRAISON] Conditions non remplies:`)
          console.log(`  - Status correct: ${demande.status === "en_attente_livraison"}`)
          console.log(`  - Livreur assigné correct: ${demande.livreurAssigneId === currentUser.id}`)
          return NextResponse.json({ 
            success: false, 
            error: `Action non autorisée. Seul le livreur assigné peut confirmer la livraison.` 
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

      case "superadmin_validation":
        console.log(`👑 [SUPERADMIN-VALIDATION] Validation super admin:`)
        console.log(`  - Utilisateur: ${currentUser.nom} (${currentUser.role})`)
        console.log(`  - Statut actuel: ${demande.status}`)
        console.log(`  - Statut cible: ${targetStatus}`)
        
        if (currentUser.role !== "superadmin") {
          console.log(`❌ [SUPERADMIN-VALIDATION] Accès refusé - rôle insuffisant`)
          return NextResponse.json({ 
            success: false, 
            error: "Seul le super admin peut utiliser cette action" 
          }, { status: 403 })
        }

        if (!targetStatus) {
          console.log(`❌ [SUPERADMIN-VALIDATION] Statut cible manquant`)
          return NextResponse.json({ 
            success: false, 
            error: "Le statut cible est requis pour la validation super admin" 
          }, { status: 400 })
        }

        console.log(`✅ [SUPERADMIN-VALIDATION] Validation autorisée, transition: ${demande.status} → ${targetStatus}`)
        
        newStatus = targetStatus as any
        
        // Notifier les validateurs concernés si demandé
        if (action === "superadmin_validation") {
          console.log(`📧 [SUPERADMIN-VALIDATION] Envoi des notifications aux validateurs`)
          
          // Notifier l'ancien validateur que le super admin a pris le relais
          await notificationService.notifyDemandeStatusChange(
            demande.id,
            demande.technicienId,
            demande.status,
            targetStatus,
            currentUser.id
          )
          
          console.log(`✅ [SUPERADMIN-VALIDATION] Notifications envoyées`)
        }
        break

      case "update_quantites_prix":
        console.log(`📝 [UPDATE-QTE-PRIX] Mise à jour des quantités livrées et prix:`)
        console.log(`  - Utilisateur: ${currentUser.nom} (${currentUser.role})`)
        console.log(`  - Demande: ${demande.numero}`)
        
        // Vérifier les permissions
        if (!["responsable_logistique", "responsable_appro", "superadmin"].includes(currentUser.role)) {
          console.log(`❌ [UPDATE-QTE-PRIX] Accès refusé - rôle insuffisant`)
          return NextResponse.json({ 
            success: false, 
            error: "Seuls les responsables logistique, appro ou super admin peuvent modifier ces données" 
          }, { status: 403 })
        }

        // Récupérer les items de la requête
        const { items: itemsToUpdate } = await request.clone().json()
        
        if (!itemsToUpdate || !Array.isArray(itemsToUpdate)) {
          console.log(`❌ [UPDATE-QTE-PRIX] Données items manquantes`)
          return NextResponse.json({ 
            success: false, 
            error: "Les données des items sont requises" 
          }, { status: 400 })
        }

        console.log(`📋 [UPDATE-QTE-PRIX] Items à mettre à jour:`, itemsToUpdate)

        // Mettre à jour chaque item
        let coutTotal = 0
        for (const itemData of itemsToUpdate) {
          const { itemId, quantiteLivree, prixUnitaire } = itemData
          
          // Récupérer l'item actuel
          const currentItem = await prisma.itemDemande.findUnique({
            where: { id: itemId }
          })
          
          if (!currentItem) {
            console.log(`⚠️ [UPDATE-QTE-PRIX] Item ${itemId} non trouvé, ignoré`)
            continue
          }

          // Mettre à jour l'item
          await prisma.itemDemande.update({
            where: { id: itemId },
            data: {
              quantiteSortie: quantiteLivree || 0,
              prixUnitaire: prixUnitaire || null
            }
          })

          // Calculer le coût total
          if (prixUnitaire && quantiteLivree) {
            coutTotal += prixUnitaire * quantiteLivree
          }

          console.log(`✅ [UPDATE-QTE-PRIX] Item ${itemId} mis à jour: qté=${quantiteLivree}, prix=${prixUnitaire}`)
        }

        // Mettre à jour le coût total de la demande
        if (coutTotal > 0) {
          updates.coutTotal = coutTotal
          console.log(`💰 [UPDATE-QTE-PRIX] Coût total calculé: ${coutTotal}`)
        }

        // Ne pas changer le statut pour cette action
        newStatus = demande.status

        // Créer une entrée d'historique spécifique
        await prisma.historyEntry.create({
          data: {
            id: crypto.randomUUID(),
            demandeId: params.id,
            userId: currentUser.id,
            action: "Mise à jour des quantités livrées et prix",
            ancienStatus: demande.status,
            nouveauStatus: demande.status,
            commentaire: `Coût total: ${coutTotal.toFixed(2)} €`,
            signature: `update-qte-prix-${Date.now()}`
          }
        })

        console.log(`✅ [UPDATE-QTE-PRIX] Mise à jour terminée`)
        
        // Retourner directement la réponse car on ne veut pas créer d'entrée d'historique en double
        return NextResponse.json({ 
          success: true, 
          data: { ...demande, coutTotal },
          message: "Quantités et prix mis à jour avec succès"
        })

      default:
        return NextResponse.json({ success: false, error: "Action non reconnue" }, { status: 400 })
    }

    // Mettre à jour la demande
    console.log(`💾 [API] Mise à jour de la demande dans la base de données:`)
    console.log(`  - ID: ${params.id}`)
    console.log(`  - Ancien statut: ${demande.status}`)
    console.log(`  - Nouveau statut: ${newStatus}`)
    console.log(`  - Updates supplémentaires:`, updates)
    
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
        sortieSignature: true
      }
    })
    
    console.log(`✅ [API] Demande mise à jour avec succès, statut final: ${updatedDemande.status}`)

    // Créer une entrée d'historique
    await prisma.historyEntry.create({
      data: {
        id: crypto.randomUUID(),
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
        id: crypto.randomUUID(),
        userId: demande.technicienId,
        titre: "Mise à jour de demande",
        message: `Votre demande ${demande.numero} a été ${getActionLabel(action)}`,
        demandeId: params.id,
        projetId: demande.projetId
      }
    })

    // 📧 ENVOYER LES NOTIFICATIONS EMAIL
    try {
      console.log(`📧 [API] Envoi des notifications email pour changement de statut: ${demande.status} → ${newStatus}`)
      
      // Récupérer tous les utilisateurs pour les notifications
      const allUsers = await prisma.user.findMany({
        include: {
          projets: {
            select: {
              projetId: true
            }
          }
        }
      })
      
      // Transformer les projets en tableau d'IDs
      const usersWithProjetIds = allUsers.map(user => ({
        ...user,
        projets: user.projets.map(p => p.projetId)
      }))
      
      // Envoyer les notifications email (au demandeur + aux prochains valideurs)
      await notificationService.handleStatusChange(
        updatedDemande as any,
        demande.status as any,
        newStatus as any,
        usersWithProjetIds as any
      )
      
      console.log(`✅ [API] Notifications email envoyées avec succès`)
    } catch (emailError) {
      // Ne pas bloquer la réponse si l'envoi d'email échoue
      console.error(`⚠️ [API] Erreur lors de l'envoi des emails (non bloquant):`, emailError)
    }

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
  if (status === "en_attente_validation_logistique") return "logistique"
  if (status === "en_attente_validation_charge_affaire") return "charge_affaire"
  if (status === "en_attente_preparation_appro") return "appro"
  if (status === "en_attente_validation_livreur") return "livreur"
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

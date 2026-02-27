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

    return targetStatus

  }



  const flow = VALIDATION_FLOWS[demandeType as keyof typeof VALIDATION_FLOWS]

  if (!flow) return null



  const currentIndex = flow.indexOf(currentStatus)

  if (currentIndex === -1 || currentIndex >= flow.length - 1) return null



  let nextIndex = currentIndex + 1

  let nextStatus = flow[nextIndex]





  // CAS SPÉCIAL : Validation à l'étape chargé d'affaire - dépend du type de demande

  // IMPORTANT: Ce cas doit être traité AVANT l'auto-validation pour éviter les conflits

  if (currentStatus === "en_attente_validation_charge_affaire" && (userRole === "charge_affaire" || userRole === "superadmin")) {

    const nextStatusChargeAffaire = demandeType === "materiel" ? "en_attente_preparation_appro" : "en_attente_preparation_logistique"

    return nextStatusChargeAffaire as DemandeStatus

  }



  // Vérifier les auto-validations successives

  // IMPORTANT: On vérifie si le demandeur ORIGINAL peut auto-valider les étapes suivantes

  // Cela permet de sauter les étapes où le demandeur a déjà le rôle de valideur

  while (nextIndex < flow.length - 1) {

    const canAutoValidate = canUserAutoValidateStep(demandeurRole, demandeType, nextStatus)

    

    if (canAutoValidate) {

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

    const { action, commentaire, quantitesSorties, quantites, itemsModifications, targetStatus, livreurAssigneId, items, quantitesRecues } = await request.json()





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

      return NextResponse.json({ success: false, error: "Demande non trouvée" }, { status: 404 })

    }





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

    

    

    if (!userProjet && !isOriginalRequester && !isSuperAdmin && !isTransversalValidator) {

      return NextResponse.json({ 

        success: false, 

        error: `Accès non autorisé à ce projet. Vous devez être assigné au projet "${demande.projet?.nom || demande.projetId}"` 

      }, { status: 403 })

    }

    



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



        // Tracker les modifications d'items si présentes

        if (itemsModifications && (

          currentUser.role === 'conducteur_travaux' || 

          currentUser.role === 'responsable_travaux' || 

          currentUser.role === 'charge_affaire' ||

          currentUser.role === 'superadmin'

        )) {

          for (const [itemId, modifications] of Object.entries(itemsModifications)) {

            const modifs = modifications as any



            const item = await prisma.itemDemande.findUnique({

              where: { id: itemId },

              include: { article: true }

            })



            if (!item) continue



            if (item.article) {

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

        

        // Vérifier d'abord le statut

        if (demande.status !== "en_attente_reception_livreur") {

          return NextResponse.json({ 

            success: false, 

            error: `La demande n'est pas en attente de réception (statut actuel: ${demande.status})` 

          }, { status: 403 })

        }

        

        // Vérifier que l'utilisateur est bien le livreur assigné

        if (demande.livreurAssigneId !== currentUser.id) {

          return NextResponse.json({ 

            success: false, 

            error: "Seul le livreur assigné peut valider la réception" 

          }, { status: 403 })

        }

        

        // Tout est OK, valider la réception

        newStatus = "en_attente_livraison"

        break



      case "valider_livraison":

        

        // Vérifier d'abord le statut

        if (demande.status !== "en_attente_livraison") {

          return NextResponse.json({ 

            success: false, 

            error: `La demande n'est pas en attente de livraison (statut actuel: ${demande.status})` 

          }, { status: 403 })

        }

        

        // Vérifier que l'utilisateur est bien le livreur assigné

        if (demande.livreurAssigneId !== currentUser.id) {

          return NextResponse.json({ 

            success: false, 

            error: "Seul le livreur assigné peut valider la livraison" 

          }, { status: 403 })

        }

        

        // Tout est OK, valider la livraison

        newStatus = "en_attente_validation_finale_demandeur"

        break



      case "cloturer":

        

        // Action spécifique pour le demandeur - clôturer la demande après livraison

        if (demande.status === "en_attente_validation_finale_demandeur" && demande.technicienId === currentUser.id) {

          

          // Vérifier les quantités reçues et identifier les items manquants

          const itemsManquants: any[] = []

          

          

          if (quantitesRecues) {

            for (const item of demande.items) {

              // IMPORTANT : Comparer avec la quantité VALIDÉE par le chargé d'affaires/super admin

              // PAS avec la quantité sortie/livrée qui peut être différente

              const quantiteValideeParChargeAffaire = item.quantiteValidee || item.quantiteDemandee

              const quantiteRecue = quantitesRecues[item.id] || 0

              const quantiteManquante = quantiteValideeParChargeAffaire - quantiteRecue

              

              

              // Mettre à jour la quantité reçue sur l'item

              await prisma.itemDemande.update({

                where: { id: item.id },

                data: { quantiteRecue }

              })

              

              if (quantiteManquante > 0) {

                itemsManquants.push({

                  articleId: item.articleId,

                  quantiteDemandee: quantiteManquante,

                  quantiteValidee: quantiteManquante,

                  commentaire: `Quantité manquante de la demande ${demande.numero} - Validée: ${quantiteValideeParChargeAffaire}, Reçue: ${quantiteRecue}`

                })

              } else if (quantiteManquante < 0) {

              } else {

              }

            }

          } else {

          }

          

          

          // Créer une sous-demande si nécessaire

          if (itemsManquants.length > 0) {

            

            // Déterminer le statut selon le type de demande

            // - Outillage → en_attente_preparation_logistique (responsable logistique)

            // - Matériel → en_attente_preparation_appro (responsable appro)

            const sousDemandeStatus = demande.type === "outillage" 

              ? "en_attente_preparation_logistique" 

              : "en_attente_preparation_appro"

            

            

            const sousDemande = await prisma.demande.create({

              data: {

                id: crypto.randomUUID(),

                numero: `${demande.numero}-SD-${Date.now().toString().slice(-4)}`,

                type: demande.type,

                projetId: demande.projetId,

                technicienId: demande.technicienId,

                status: sousDemandeStatus,

                commentaires: `Sous-demande créée automatiquement suite à réception partielle de ${demande.numero}. ${commentaire || ''}`,

                dateLivraisonSouhaitee: demande.dateLivraisonSouhaitee,

                dateModification: new Date(),

                coutTotal: 0, // Sera calculé lors de la préparation/validation

                items: {

                  create: itemsManquants.map(item => ({

                    id: crypto.randomUUID(),

                    ...item

                  }))

                }

              }

            })

            

            

            // Ajouter une entrée dans l'historique de la demande principale

            await prisma.historyEntry.create({

              data: {

                id: crypto.randomUUID(),

                demandeId: demande.id,

                userId: currentUser.id,

                action: "creation_sous_demande",

                commentaire: `Sous-demande ${sousDemande.numero} créée automatiquement pour ${itemsManquants.length} article(s) manquant(s)`,

                ancienStatus: demande.status,

                nouveauStatus: "cloturee",

                signature: `creation_sous_demande_${currentUser.id}_${Date.now()}`

              }

            })

            

            // Ajouter une entrée dans l'historique de la sous-demande pour tracer son origine

            await prisma.historyEntry.create({

              data: {

                id: crypto.randomUUID(),

                demandeId: sousDemande.id,

                userId: currentUser.id,

                action: "creation_automatique",

                commentaire: `Sous-demande créée automatiquement suite à réception partielle de la demande ${demande.numero}. ${demande.type === "outillage" ? "Envoyée au responsable logistique." : "Envoyée au responsable appro."}`,

                ancienStatus: null,

                nouveauStatus: sousDemandeStatus,

                signature: `creation_auto_${currentUser.id}_${Date.now()}`

              }

            })

          }

          

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

          

          

          newStatus = "cloturee"

        } else if (demande.status !== "en_attente_validation_finale_demandeur") {

          return NextResponse.json({ success: false, error: "La demande n'est pas prête à être clôturée" }, { status: 403 })

        } else {

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

        

        break



      case "preparer_sortie":

        

        if (demande.status === ("en_attente_preparation_appro" as any) && currentUser.role === "responsable_appro") {

          // Vérifier que le livreur est assigné

          if (!livreurAssigneId) {

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

            return NextResponse.json({ 

              success: false, 

              error: "Le livreur sélectionné n'existe pas" 

            }, { status: 404 })

          }



          const nextStatus = getNextStatus(demande.status, currentUser.role, demande.type)

          

          if (!nextStatus) {

            return NextResponse.json({ success: false, error: "Impossible de déterminer le prochain statut de la demande" }, { status: 403 })

          }

          

          

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

          



          // Envoyer notification au livreur assigné

          await notificationService.notifyLivreurAssigne(demande.id, livreurAssigneId, currentUser.id)

        } else {

          return NextResponse.json({ 

            success: false, 

            error: `Action non autorisée. Status: ${demande.status}, Role: ${currentUser.role}` 

          }, { status: 403 })

        }

        break



      case "preparer_sortie_logistique":

        

        if (demande.status === ("en_attente_preparation_logistique" as any) && currentUser.role === "responsable_logistique") {

          // Vérifier que le livreur est assigné

          if (!livreurAssigneId) {

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

            return NextResponse.json({ 

              success: false, 

              error: "Le livreur sélectionné n'existe pas" 

            }, { status: 404 })

          }



          const nextStatusLogistique = getNextStatus(demande.status, currentUser.role, demande.type)

          

          if (!nextStatusLogistique) {

            return NextResponse.json({ success: false, error: "Impossible de déterminer le prochain statut de la demande" }, { status: 403 })

          }

          

          

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

          



          // Envoyer notification au livreur assigné

          await notificationService.notifyLivreurAssigne(demande.id, livreurAssigneId, currentUser.id)

        } else {

          return NextResponse.json({ 

            success: false, 

            error: `Action non autorisée. Status: ${demande.status}, Role: ${currentUser.role}` 

          }, { status: 403 })

        }

        break



      case "confirmer_reception_livreur":

        

        if (demande.status === "en_attente_reception_livreur" && demande.livreurAssigneId === currentUser.id) {

          const nextStatus = getNextStatus(demande.status, currentUser.role, demande.type)

          

          if (!nextStatus) {

            return NextResponse.json({ success: false, error: "Impossible de déterminer le prochain statut de la demande" }, { status: 403 })

          }

          

          

          newStatus = nextStatus as any

          updates.dateReceptionLivreur = new Date()

          

        } else {

          return NextResponse.json({ 

            success: false, 

            error: `Action non autorisée. Seul le livreur assigné peut confirmer la réception.` 

          }, { status: 403 })

        }

        break



      case "confirmer_livraison":

        

        if (demande.status === "en_attente_livraison" && demande.livreurAssigneId === currentUser.id) {

          const nextStatus = getNextStatus(demande.status, currentUser.role, demande.type)

          

          if (!nextStatus) {

            return NextResponse.json({ success: false, error: "Impossible de déterminer le prochain statut de la demande" }, { status: 403 })

          }

          

          

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

          

        } else {

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

        

        if (currentUser.role !== "superadmin") {

          return NextResponse.json({ 

            success: false, 

            error: "Seul le super admin peut utiliser cette action" 

          }, { status: 403 })

        }



        if (!targetStatus) {

          return NextResponse.json({ 

            success: false, 

            error: "Le statut cible est requis pour la validation super admin" 

          }, { status: 400 })

        }



        

        newStatus = targetStatus as any

        

        // Notifier les validateurs concernés si demandé

        if (action === "superadmin_validation") {

          

          // Notifier l'ancien validateur que le super admin a pris le relais

          await notificationService.notifyDemandeStatusChange(

            demande.id,

            demande.technicienId,

            demande.status,

            targetStatus,

            currentUser.id

          )

          

        }

        break



      case "update_validated_quantities":

        

        // Vérifier les permissions - seuls les valideurs peuvent modifier les quantités validées

        const canUpdateValidatedQty = (

          (demande.status === "en_attente_validation_conducteur" && currentUser.role === "conducteur_travaux") ||

          (demande.status === "en_attente_validation_logistique" && currentUser.role === "responsable_logistique") ||

          (demande.status === "en_attente_validation_responsable_travaux" && currentUser.role === "responsable_travaux") ||

          (demande.status === "en_attente_validation_charge_affaire" && currentUser.role === "charge_affaire") ||

          currentUser.role === "superadmin"

        )

        

        if (!canUpdateValidatedQty) {

          return NextResponse.json({ 

            success: false, 

            error: "Vous n'avez pas les permissions pour modifier les quantités validées" 

          }, { status: 403 })

        }



        // Récupérer les items de la requête

        const validatedItems = items

        

        if (!validatedItems || !Array.isArray(validatedItems)) {

          return NextResponse.json({ 

            success: false, 

            error: "Les données des items sont requises" 

          }, { status: 400 })

        }





        // Mettre à jour chaque item

        let validatedItemsUpdated = 0

        

        for (const itemData of validatedItems) {

          const { itemId, quantiteValidee } = itemData

          

          

          // Récupérer l'item actuel

          const currentItem = await prisma.itemDemande.findUnique({

            where: { id: itemId },

            include: { article: true }

          })

          

          if (!currentItem) {

            continue

          }



          // Validation des données

          const qteToSave = typeof quantiteValidee === 'number' && quantiteValidee >= 0 && quantiteValidee <= currentItem.quantiteDemandee 

            ? quantiteValidee 

            : currentItem.quantiteDemandee





          // Mettre à jour l'item

          await prisma.itemDemande.update({

            where: { id: itemId },

            data: {

              quantiteValidee: qteToSave

            }

          })



          validatedItemsUpdated++

        }





        // Mettre à jour la date de modification de la demande

        await prisma.demande.update({

          where: { id: params.id },

          data: {

            dateModification: new Date()

          }

        })



        

        return NextResponse.json({ 

          success: true, 

          message: `${validatedItemsUpdated} quantité(s) validée(s) mise(s) à jour avec succès`

        })



      case "update_quantites_prix":

        

        // Vérifier les permissions

        if (!["responsable_logistique", "responsable_appro", "superadmin"].includes(currentUser.role)) {

          return NextResponse.json({ 

            success: false, 

            error: "Seuls les responsables logistique, appro ou super admin peuvent modifier ces données" 

          }, { status: 403 })

        }



        // Récupérer les items de la requête (déjà extraits du payload initial)

        const itemsToUpdate = items

        

        if (!itemsToUpdate || !Array.isArray(itemsToUpdate)) {

          return NextResponse.json({ 

            success: false, 

            error: "Les données des items sont requises" 

          }, { status: 400 })

        }





        // Mettre à jour chaque item

        let coutTotal = 0

        let itemsUpdated = 0

        let itemsWithPrice = 0

        

        for (const itemData of itemsToUpdate) {

          const { itemId, quantiteLivree, prixUnitaire } = itemData

          

          

          // Récupérer l'item actuel

          const currentItem = await prisma.itemDemande.findUnique({

            where: { id: itemId },

            include: { article: true }

          })

          

          if (!currentItem) {

            continue

          }



          // Validation des données

          const qteToSave = typeof quantiteLivree === 'number' && quantiteLivree >= 0 ? quantiteLivree : 0

          const prixToSave = typeof prixUnitaire === 'number' && prixUnitaire >= 0 ? prixUnitaire : null





          // Mettre à jour l'item

          await prisma.itemDemande.update({

            where: { id: itemId },

            data: {

              quantiteSortie: qteToSave,

              prixUnitaire: prixToSave

            }

          })



          itemsUpdated++



          // Calculer le coût total basé sur la QUANTITÉ RESTANTE (quantité validée - quantité livrée)

          // Cela permet de connaître le coût de ce qui reste à livrer (rupture de stock magasin)

          const quantiteValidee = currentItem.quantiteValidee || currentItem.quantiteDemandee

          const quantiteRestante = Math.max(0, quantiteValidee - qteToSave)

          

          if (prixToSave !== null && quantiteRestante > 0) {

            const coutRestant = prixToSave * quantiteRestante

            coutTotal += coutRestant

            itemsWithPrice++

          } else if (prixToSave !== null && quantiteRestante === 0) {

          }



        }





        // Mettre à jour le coût total de la demande



        // Mettre à jour la demande avec le coût total

        const updatedDemandeWithPrices = await prisma.demande.update({

          where: { id: params.id },

          data: {

            coutTotal,

            dateModification: new Date(),

            dateEngagement: new Date() // Date d'engagement financier

          },

          include: {

            projet: true,

            technicien: true,

            items: {

              include: {

                article: true

              }

            }

          }

        })



        // Créer une entrée d'historique spécifique

        await prisma.historyEntry.create({

          data: {

            id: crypto.randomUUID(),

            demandeId: params.id,

            userId: currentUser.id,

            action: "Mise à jour des quantités livrées et prix",

            ancienStatus: demande.status,

            nouveauStatus: demande.status,

            commentaire: `Coût total: ${coutTotal.toFixed(2)} FCFA`,

            signature: `update-qte-prix-${Date.now()}`

          }

        })



        

        // Retourner directement la réponse avec les données mises à jour

        return NextResponse.json({ 

          success: true, 

          data: updatedDemandeWithPrices,

          message: "Quantités et prix mis à jour avec succès"

        })



      default:

        return NextResponse.json({ success: false, error: "Action non reconnue" }, { status: 400 })

    }



    // Mettre à jour la demande

    // Ajouter les dates de passage aux statuts de préparation (pour analytics)

    if (newStatus === "en_attente_preparation_appro" && demande.status !== "en_attente_preparation_appro") {

      updates.datePassageAppro = new Date()

    }

    if (newStatus === "en_attente_preparation_logistique" && demande.status !== "en_attente_preparation_logistique") {

      updates.datePassageLogistique = new Date()

    }

    

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

      

    } catch (emailError) {

      // Ne pas bloquer la réponse si l'envoi d'email échoue

    }



    return NextResponse.json({

      success: true,

      data: {

        demande: updatedDemande

      }

    })

  } catch (error) {

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


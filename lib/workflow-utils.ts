import type { DemandeStatus, DemandeType, UserRole } from "@/types"

/**
 * Mapping des statuts vers leurs statuts précédents dans le workflow
 * Utilisé pour le retour arrière lors d'un rejet
 */
const PREVIOUS_STATUS_MAP: Record<string, Record<DemandeType, DemandeStatus>> = {
  // Matériel
  "en_attente_validation_responsable_travaux": {
    materiel: "en_attente_validation_conducteur",
    outillage: "en_attente_validation_logistique"
  },
  "en_attente_validation_charge_affaire": {
    materiel: "en_attente_validation_responsable_travaux",
    outillage: "en_attente_validation_responsable_travaux"
  },
  "en_attente_preparation_appro": {
    materiel: "en_attente_validation_charge_affaire",
    outillage: "en_attente_validation_charge_affaire"
  },
  "en_attente_reception_livreur": {
    materiel: "en_attente_preparation_appro",
    outillage: "en_attente_preparation_logistique"
  },
  "en_attente_livraison": {
    materiel: "en_attente_reception_livreur",
    outillage: "en_attente_reception_livreur"
  },
  "en_attente_validation_finale_demandeur": {
    materiel: "en_attente_livraison",
    outillage: "en_attente_livraison"
  }
}

/**
 * Détermine le statut précédent lors d'un rejet
 * @param currentStatus - Statut actuel de la demande
 * @param type - Type de demande (materiel/outillage)
 * @returns Le statut précédent ou null si pas de statut précédent
 */
export function getPreviousStatus(
  currentStatus: DemandeStatus,
  type: DemandeType
): DemandeStatus | null {
  const previousStatusForType = PREVIOUS_STATUS_MAP[currentStatus]
  if (!previousStatusForType) return null
  
  return previousStatusForType[type] || null
}

/**
 * Mapping des rôles vers les statuts qu'ils peuvent valider
 */
const ROLE_VALIDATION_STATUS: Record<UserRole, DemandeStatus[]> = {
  superadmin: [], // Peut tout faire
  employe: ["en_attente_validation_finale_demandeur"],
  conducteur_travaux: ["en_attente_validation_conducteur"],
  responsable_logistique: ["en_attente_validation_logistique"],
  responsable_travaux: ["en_attente_validation_responsable_travaux"],
  charge_affaire: ["en_attente_validation_charge_affaire"],
  responsable_appro: ["en_attente_preparation_appro"],
  responsable_livreur: ["en_attente_reception_livreur", "en_attente_livraison"]
}

/**
 * Vérifie si un utilisateur peut valider/rejeter une demande à un statut donné
 */
export function canUserValidateStatus(
  userRole: UserRole,
  demandeStatus: DemandeStatus
): boolean {
  if (userRole === "superadmin") return true
  
  const allowedStatuses = ROLE_VALIDATION_STATUS[userRole] || []
  return allowedStatuses.includes(demandeStatus)
}

/**
 * Permissions de modification selon le niveau de valideur
 * Définit quels champs peuvent être modifiés par chaque rôle
 */
export interface ModificationPermissions {
  canModifyQuantities: boolean
  canModifyArticles: boolean
  canModifyComments: boolean
  canModifyDateBesoin: boolean
}

/**
 * Détermine les permissions de modification selon le rôle du valideur
 */
export function getModificationPermissions(
  userRole: UserRole,
  demandeStatus: DemandeStatus
): ModificationPermissions {
  // Niveau 1 : Valideurs techniques (Conducteur, QHSE, Resp. Travaux)
  if (
    userRole === "conducteur_travaux" ||
    userRole === "responsable_logistique" ||
    userRole === "responsable_travaux"
  ) {
    return {
      canModifyQuantities: true,
      canModifyArticles: true,
      canModifyComments: true,
      canModifyDateBesoin: true
    }
  }

  // Niveau 2 : Chargé d'Affaire (validation budget)
  if (userRole === "charge_affaire") {
    return {
      canModifyQuantities: true,
      canModifyArticles: true,
      canModifyComments: true,
      canModifyDateBesoin: false
    }
  }

  // Niveau 3 : Resp. Appro (préparation stock)
  if (userRole === "responsable_appro") {
    return {
      canModifyQuantities: true,
      canModifyArticles: true,
      canModifyComments: true,
      canModifyDateBesoin: false
    }
  }

  // Niveau 4 : Livreur (réception/livraison)
  if (userRole === "responsable_livreur") {
    return {
      canModifyQuantities: true,
      canModifyArticles: false,
      canModifyComments: true,
      canModifyDateBesoin: false
    }
  }

  // Super admin peut tout modifier
  if (userRole === "superadmin") {
    return {
      canModifyQuantities: true,
      canModifyArticles: true,
      canModifyComments: true,
      canModifyDateBesoin: true
    }
  }

  // Par défaut, aucune modification
  return {
    canModifyQuantities: false,
    canModifyArticles: false,
    canModifyComments: true,
    canModifyDateBesoin: false
  }
}

/**
 * Détermine qui doit être notifié lors d'un rejet
 * @param currentStatus - Statut actuel de la demande
 * @param type - Type de demande
 * @returns Le rôle du valideur précédent qui doit être notifié
 */
export function getPreviousValidatorRole(
  currentStatus: DemandeStatus,
  type: DemandeType
): UserRole | null {
  const previousStatus = getPreviousStatus(currentStatus, type)
  if (!previousStatus) return null

  // Mapping des statuts vers les rôles valideurs
  const statusToRole: Record<string, UserRole> = {
    "en_attente_validation_conducteur": "conducteur_travaux",
    "en_attente_validation_logistique": "responsable_logistique",
    "en_attente_validation_responsable_travaux": "responsable_travaux",
    "en_attente_validation_charge_affaire": "charge_affaire",
    "en_attente_preparation_appro": "responsable_appro",
    "en_attente_reception_livreur": "responsable_livreur",
    "en_attente_livraison": "responsable_livreur",
    "en_attente_validation_finale_demandeur": "employe"
  }

  return statusToRole[previousStatus] || null
}

/**
 * Génère un message de notification pour un rejet
 */
export function generateRejectionNotificationMessage(
  demandeNumero: string,
  rejecteurRole: UserRole,
  motif: string
): string {
  const roleLabels: Record<UserRole, string> = {
    superadmin: "Super Admin",
    employe: "Employé",
    conducteur_travaux: "Conducteur de Travaux",
    responsable_logistique: "Responsable Logistique",
    responsable_travaux: "Responsable des Travaux",
    charge_affaire: "Chargé d'Affaire",
    responsable_appro: "Responsable Appro",
    responsable_livreur: "Responsable Livreur"
  }

  return `La demande ${demandeNumero} a été rejetée par ${roleLabels[rejecteurRole]}. Motif: ${motif}. Vous pouvez la modifier et la renvoyer.`
}

/**
 * Vérifie si une demande peut être modifiée après rejet
 */
export function canModifyRejectedDemande(
  userRole: UserRole,
  demandeStatus: DemandeStatus,
  demandeTechnicienId: string,
  currentUserId: string
): boolean {
  // Le demandeur original peut toujours modifier sa demande rejetée
  if (demandeTechnicienId === currentUserId) return true

  // Le valideur précédent peut modifier la demande rejetée
  return canUserValidateStatus(userRole, demandeStatus)
}

/**
 * Calcule le nombre maximum de rejets autorisés
 */
export const MAX_REJECTIONS = 5

/**
 * Vérifie si une demande a atteint le nombre maximum de rejets
 */
export function hasReachedMaxRejections(nombreRejets: number): boolean {
  return nombreRejets >= MAX_REJECTIONS
}

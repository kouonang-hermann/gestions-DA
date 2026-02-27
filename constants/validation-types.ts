/**
 * CONSTANTES POUR LES TYPES DE VALIDATION
 * 
 * Ce fichier centralise tous les types de validation utilisés dans le système
 * pour éviter les incohérences entre la base de données et l'API.
 * 
 * IMPORTANT : Toujours utiliser ces constantes au lieu de chaînes de caractères
 * en dur pour éviter les erreurs de frappe et faciliter la maintenance.
 */

export const VALIDATION_TYPES = {
  CONDUCTEUR: 'validation_conducteur',
  RESPONSABLE_TRAVAUX: 'validation_responsable_travaux',
  CHARGE_AFFAIRE: 'validation_charge_affaire',
  LOGISTIQUE: 'validation_logistique',
  APPRO: 'validation_appro',
} as const

export type ValidationType = typeof VALIDATION_TYPES[keyof typeof VALIDATION_TYPES]

/**
 * Labels lisibles pour l'affichage dans l'interface utilisateur
 */
export const VALIDATION_TYPE_LABELS: Record<ValidationType, string> = {
  'validation_conducteur': 'Conducteur des Travaux',
  'validation_responsable_travaux': 'Responsable des Travaux',
  'validation_charge_affaire': 'Chargé d\'Affaire',
  'validation_logistique': 'Responsable Logistique',
  'validation_appro': 'Responsable Appro',
}

/**
 * Mapping entre les rôles utilisateur et les types de validation
 */
export const ROLE_TO_VALIDATION_TYPE: Record<string, ValidationType> = {
  'conducteur_travaux': VALIDATION_TYPES.CONDUCTEUR,
  'responsable_travaux': VALIDATION_TYPES.RESPONSABLE_TRAVAUX,
  'charge_affaire': VALIDATION_TYPES.CHARGE_AFFAIRE,
  'responsable_logistique': VALIDATION_TYPES.LOGISTIQUE,
  'responsable_appro': VALIDATION_TYPES.APPRO,
}

/**
 * Vérifie si une chaîne est un type de validation valide
 */
export function isValidValidationType(type: string): type is ValidationType {
  return Object.values(VALIDATION_TYPES).includes(type as ValidationType)
}

/**
 * Obtient le label d'un type de validation
 */
export function getValidationTypeLabel(type: ValidationType): string {
  return VALIDATION_TYPE_LABELS[type] || type
}

/**
 * Obtient le type de validation pour un rôle utilisateur
 */
export function getValidationTypeForRole(role: string): ValidationType | null {
  return ROLE_TO_VALIDATION_TYPE[role] || null
}

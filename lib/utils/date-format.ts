/**
 * Utilitaires de formatage de dates sécurisés
 * Ces fonctions protègent contre les valeurs undefined/null
 */

/**
 * Formate une date en chaîne localisée française
 * @param date - La date à formater (peut être undefined, null, string ou Date)
 * @param fallback - Valeur de remplacement si la date est invalide (par défaut "—")
 * @returns La date formatée ou la valeur de remplacement
 */
export function formatDate(date: Date | string | null | undefined, fallback: string = "—"): string {
  if (!date) return fallback
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return fallback
    return dateObj.toLocaleDateString('fr-FR')
  } catch {
    return fallback
  }
}

/**
 * Formate une date avec l'heure en chaîne localisée française
 * @param date - La date à formater (peut être undefined, null, string ou Date)
 * @param fallback - Valeur de remplacement si la date est invalide (par défaut "—")
 * @returns La date et l'heure formatées ou la valeur de remplacement
 */
export function formatDateTime(date: Date | string | null | undefined, fallback: string = "—"): string {
  if (!date) return fallback
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    if (isNaN(dateObj.getTime())) return fallback
    return dateObj.toLocaleString('fr-FR')
  } catch {
    return fallback
  }
}

/**
 * Formate un nombre avec séparateur de milliers
 * @param value - Le nombre à formater (peut être undefined, null ou number)
 * @param fallback - Valeur de remplacement si le nombre est invalide (par défaut "0")
 * @returns Le nombre formaté ou la valeur de remplacement
 */
export function formatNumber(value: number | null | undefined, fallback: string = "0"): string {
  if (value === null || value === undefined) return fallback
  
  try {
    if (typeof value !== 'number' || isNaN(value)) return fallback
    return value.toLocaleString('fr-FR')
  } catch {
    return fallback
  }
}

/**
 * Formate un prix en euros
 * @param value - Le montant à formater (peut être undefined, null ou number)
 * @param fallback - Valeur de remplacement si le montant est invalide (par défaut "—")
 * @returns Le montant formaté en euros ou la valeur de remplacement
 */
export function formatPrice(value: number | null | undefined, fallback: string = "—"): string {
  if (value === null || value === undefined) return fallback
  
  try {
    if (typeof value !== 'number' || isNaN(value)) return fallback
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(value)
  } catch {
    return fallback
  }
}

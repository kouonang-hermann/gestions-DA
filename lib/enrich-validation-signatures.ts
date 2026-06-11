import { prisma } from "@/lib/prisma"

/**
 * Enrichit un tableau de ValidationSignature (ou similaire) en ajoutant
 * la signature manuscrite (data URL base64 PNG) de chaque utilisateur.
 *
 * @param validations - Tableau d'objets contenant au moins { userId, user? }
 * @returns Promesse résolue avec les mêmes objets, mais avec `user.signature` ajouté
 */
export async function enrichValidationSignatures<T extends { userId: string; user?: any }>(
  validations: T[]
): Promise<(T & { user: T['user'] & { signature?: string | null } })[]> {
  if (!validations.length) return validations as any

  // Collecter les userId uniques
  const userIds = [...new Set(validations.map(v => v.userId).filter(Boolean))]

  // Charger les utilisateurs avec leur signature
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, signature: true }
  })

  const userSignatures = Object.fromEntries(
    users.map(u => [u.id, u.signature])
  )

  // Enrichir chaque validation : on ajoute la signature manuscrite (data URL PNG)
  // à la fois sur user.signature ET en raccourci sur validation.signatureImage
  // pour que les générateurs PDF (qui lisent signatureImage) la trouvent.
  return validations.map(validation => {
    const userSignature = userSignatures[validation.userId] ?? null
    return {
      ...validation,
      signatureImage: (validation as any).signatureImage || userSignature || null,
      user: {
        ...validation.user,
        signature: userSignature
      }
    }
  }) as any
}

/**
 * Enrichit un objet de validation unique avec la signature de l'utilisateur.
 */
export async function enrichValidationSignature<T extends { userId: string; user?: any }>(
  validation: T
): Promise<(T & { user: T['user'] & { signature?: string | null } })> {
  const enriched = await enrichValidationSignatures([validation])
  return enriched[0]
}

/**
 * Enrichit un objet Demande (ou similaire) contenant plusieurs champs de validation
 * (validationConducteur, validationLogistique, etc.) en ajoutant les signatures des utilisateurs.
 *
 * @param demande - Objet contenant les champs de validation
 * @returns Promesse résolue avec le même objet, mais avec les signatures ajoutées
 */
export async function enrichDemandeWithSignatures(demande: any): Promise<any> {
  // Collecter toutes les validations
  const fieldsToEnrich = [
    'validationConducteur',
    'validationLogistique',
    'validationChargeAffaire',
    'validationFinale',
    'validationReception',
    'sortieAppro'
  ]

  const allValidations: any[] = []
  const fieldMap: Record<string, any[]> = {}

  fieldsToEnrich.forEach(field => {
    const validation = demande[field]
    if (validation && validation.userId) {
      allValidations.push(validation)
      if (!fieldMap[field]) fieldMap[field] = []
      fieldMap[field].push(validation)
    }
  })

  // Enrichir toutes les validations d'un coup
  const enrichedValidations = await enrichValidationSignatures(allValidations)

  // Reconstruire l'objet demande avec les validations enrichies
  const enriched = { ...demande }

  let idx = 0
  fieldsToEnrich.forEach(field => {
    if (fieldMap[field] && fieldMap[field].length > 0) {
      enriched[field] = enrichedValidations[idx]
      idx += 1
    }
  })

  // Enrichir validationSignatures s'il existe
  if (demande.validationSignatures && Array.isArray(demande.validationSignatures)) {
    enriched.validationSignatures = await enrichValidationSignatures(demande.validationSignatures)
  }

  // Enrichir sortieSignature s'il existe
  if (demande.sortieSignature && demande.sortieSignature.userId) {
    enriched.sortieSignature = await enrichValidationSignature(demande.sortieSignature)
  }

  return enriched
}

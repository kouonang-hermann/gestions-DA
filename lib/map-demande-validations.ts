import { VALIDATION_TYPES } from '@/constants/validation-types'

/**
 * Mappe les `validationSignatures` d'une demande vers les champs attendus par le
 * frontend et les générateurs PDF (validationConducteur, validationLogistique, ...).
 *
 * Cette logique était auparavant dupliquée en ligne dans `GET /api/demandes`. Elle est
 * désormais centralisée ici pour être réutilisée à l'identique par :
 *  - la liste `GET /api/demandes` (SANS images de signature : `user.signature` n'est pas
 *    sélectionné, donc `signatureImage` vaut `null` -> payload léger),
 *  - le détail `GET /api/demandes/[id]` (AVEC images de signature -> PDF complets).
 *
 * L'image (`signatureImage`) est simplement dérivée de `user.signature` lorsqu'elle est
 * présente. Aucun champ affiché à l'écran (commentaire, date, user) n'est modifié.
 */
export function mapDemandeValidations(demande: any) {
  const validationSignatures = demande.validationSignatures || []

  const validationSignaturesSorted = [...validationSignatures].sort((a: any, b: any) => {
    const aTime = a?.date instanceof Date ? a.date.getTime() : new Date(a?.date).getTime()
    const bTime = b?.date instanceof Date ? b.date.getTime() : new Date(b?.date).getTime()
    return bTime - aTime
  })

  // Ajoute signatureImage (data URL PNG) dérivée de user.signature.
  // Si user.signature n'est pas chargé (cas de la liste), signatureImage vaut null.
  const withSignatureImage = (v: any) => {
    if (!v) return v
    return { ...v, signatureImage: v.user?.signature || v.signatureImage || null }
  }

  const findSignature = (types: string[]) => {
    const match = validationSignaturesSorted.find((v: any) => types.includes(v.type)) || null
    return withSignatureImage(match)
  }

  const validationConducteur = findSignature([
    VALIDATION_TYPES.CONDUCTEUR,
    'conducteur_travaux',
    'conducteur'
  ])
  const validationResponsableTravaux = findSignature([
    VALIDATION_TYPES.RESPONSABLE_TRAVAUX,
    'responsable_travaux'
  ])
  const validationChargeAffaire = findSignature([
    VALIDATION_TYPES.CHARGE_AFFAIRE,
    'charge_affaire'
  ])
  const validationLogistique = findSignature([
    VALIDATION_TYPES.LOGISTIQUE,
    'logistique',
    'preparation_logistique'
  ])
  const validationAppro = findSignature([
    VALIDATION_TYPES.APPRO,
    'appro',
    'preparation_appro'
  ])
  const sortieAppro = withSignatureImage(demande.sortieSignature || validationAppro || null)
  const validationFinale = findSignature([
    'finale',
    'validation_finale',
    'demandeur'
  ])

  return {
    ...demande,
    // Le tableau brut est également enrichi (signatureImage) afin que les générateurs PDF
    // qui lisent directement `demande.validationSignatures` disposent de l'image.
    validationSignatures: validationSignatures.map(withSignatureImage),
    validationConducteur,
    validationResponsableTravaux,
    validationChargeAffaire,
    validationLogistique,
    validationFinale,
    sortieAppro,
  }
}

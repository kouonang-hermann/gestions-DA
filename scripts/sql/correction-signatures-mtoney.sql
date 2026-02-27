-- ============================================================================
-- CORRECTION - SIGNATURES DE VALIDATION POUR M. TONEY
-- ============================================================================
-- Ce script corrige les signatures de validation pour que M. Toney
-- puisse voir ses deux demandes validées (0132 et 0138)
-- ============================================================================

-- ÉTAPE 1 : VÉRIFIER L'ID DE M. TONEY
-- ----------------------------------------------------------------------------
-- Exécuter d'abord pour obtenir l'ID exact
DO $$
DECLARE
    mtoney_id TEXT;
BEGIN
    SELECT id INTO mtoney_id FROM users WHERE nom ILIKE '%toney%' LIMIT 1;
    RAISE NOTICE 'ID de M. Toney: %', mtoney_id;
END $$;

-- ============================================================================
-- OPTION A : CORRIGER LE TYPE DE SIGNATURE (si signature existe avec mauvais type)
-- ============================================================================

-- A.1 VÉRIFIER LES TYPES ACTUELS
-- ----------------------------------------------------------------------------
SELECT 
    '=== VÉRIFICATION TYPES AVANT CORRECTION ===' AS section,
    d.numero,
    vs.id AS signature_id,
    vs.type AS type_actuel,
    u.nom || ' ' || u.prenom AS valideur
FROM validation_signatures vs
INNER JOIN demandes d ON vs."demandeId" = d.id
INNER JOIN users u ON vs."userId" = u.id
WHERE (u.nom ILIKE '%toney%' OR u.email ILIKE '%toney%')
  AND (d.numero LIKE '%0132%' OR d.numero LIKE '%0138%');

-- A.2 CORRIGER LE TYPE SI NÉCESSAIRE
-- ----------------------------------------------------------------------------
-- Mettre à jour le type de 'responsable_travaux' vers 'validation_responsable_travaux'
UPDATE validation_signatures
SET type = 'validation_responsable_travaux'
WHERE type = 'responsable_travaux'
  AND "userId" IN (SELECT id FROM users WHERE nom ILIKE '%toney%')
  AND "demandeId" IN (
    SELECT id FROM demandes WHERE numero LIKE '%0132%' OR numero LIKE '%0138%'
  );

-- A.3 VÉRIFIER APRÈS CORRECTION
-- ----------------------------------------------------------------------------
SELECT 
    '=== VÉRIFICATION TYPES APRÈS CORRECTION ===' AS section,
    d.numero,
    vs.id AS signature_id,
    vs.type AS type_corrige,
    u.nom || ' ' || u.prenom AS valideur
FROM validation_signatures vs
INNER JOIN demandes d ON vs."demandeId" = d.id
INNER JOIN users u ON vs."userId" = u.id
WHERE (u.nom ILIKE '%toney%' OR u.email ILIKE '%toney%')
  AND (d.numero LIKE '%0132%' OR d.numero LIKE '%0138%');

-- ============================================================================
-- OPTION B : CRÉER LA SIGNATURE MANQUANTE (si signature n'existe pas pour 0132)
-- ============================================================================

-- B.1 IDENTIFIER LA DEMANDE SANS SIGNATURE
-- ----------------------------------------------------------------------------
WITH mtoney AS (
    SELECT id FROM users WHERE nom ILIKE '%toney%' LIMIT 1
),
demandes_sans_signature AS (
    SELECT 
        d.id,
        d.numero,
        d.status
    FROM demandes d
    CROSS JOIN mtoney
    WHERE (d.numero LIKE '%0132%' OR d.numero LIKE '%0138%')
      AND NOT EXISTS (
        SELECT 1 FROM validation_signatures vs 
        WHERE vs."demandeId" = d.id 
          AND vs."userId" = mtoney.id
          AND vs.type = 'validation_responsable_travaux'
      )
)
SELECT 
    '=== DEMANDES SANS SIGNATURE M. TONEY ===' AS section,
    * 
FROM demandes_sans_signature;

-- B.2 CRÉER LA SIGNATURE MANQUANTE POUR 0132
-- ----------------------------------------------------------------------------
-- IMPORTANT : Remplacer 'ID_MTONEY' par l'ID réel obtenu à l'étape 1
-- IMPORTANT : Remplacer 'ID_DEMANDE_0132' par l'ID réel de la demande 0132

-- Exemple de création de signature :
/*
INSERT INTO validation_signatures (
    id,
    "demandeId",
    "userId",
    type,
    date,
    signature,
    commentaire
)
SELECT 
    'vs-' || gen_random_uuid()::text AS id,
    d.id AS "demandeId",
    u.id AS "userId",
    'validation_responsable_travaux' AS type,
    NOW() AS date,
    'signature_' || u.id || '_' || EXTRACT(EPOCH FROM NOW())::bigint AS signature,
    'Signature créée manuellement pour correction' AS commentaire
FROM demandes d
CROSS JOIN users u
WHERE d.numero LIKE '%0132%'
  AND u.nom ILIKE '%toney%'
  AND NOT EXISTS (
    SELECT 1 FROM validation_signatures vs 
    WHERE vs."demandeId" = d.id 
      AND vs."userId" = u.id
      AND vs.type = 'validation_responsable_travaux'
  );
*/

-- ============================================================================
-- VÉRIFICATION FINALE
-- ============================================================================

-- Vérifier que M. Toney a bien 2 signatures
SELECT 
    '=== VÉRIFICATION FINALE ===' AS section,
    COUNT(*) AS nombre_signatures,
    STRING_AGG(d.numero, ', ') AS demandes_validees
FROM validation_signatures vs
INNER JOIN demandes d ON vs."demandeId" = d.id
INNER JOIN users u ON vs."userId" = u.id
WHERE (u.nom ILIKE '%toney%' OR u.email ILIKE '%toney%')
  AND (d.numero LIKE '%0132%' OR d.numero LIKE '%0138%')
  AND vs.type = 'validation_responsable_travaux';

-- Détail des signatures
SELECT 
    '=== DÉTAIL DES SIGNATURES M. TONEY ===' AS section,
    d.numero,
    d.status,
    vs.type,
    vs.date,
    vs.commentaire
FROM validation_signatures vs
INNER JOIN demandes d ON vs."demandeId" = d.id
INNER JOIN users u ON vs."userId" = u.id
WHERE (u.nom ILIKE '%toney%' OR u.email ILIKE '%toney%')
  AND (d.numero LIKE '%0132%' OR d.numero LIKE '%0138%')
ORDER BY d.numero;

-- ============================================================================
-- INSTRUCTIONS D'UTILISATION
-- ============================================================================
-- 
-- 1. Exécuter d'abord le script diagnostic-rapide-mtoney.sql
-- 2. Identifier le problème :
--    - Si type incorrect → Exécuter OPTION A
--    - Si signature manquante → Décommenter et exécuter OPTION B
-- 3. Exécuter la VÉRIFICATION FINALE
-- 4. Tester dans l'interface : M. Toney devrait voir 2 demandes validées
-- 
-- ============================================================================

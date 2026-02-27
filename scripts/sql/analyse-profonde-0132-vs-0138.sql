-- ============================================================================
-- ANALYSE PROFONDE - COMPARAISON DEMANDES 0132 vs 0138
-- ============================================================================
-- PROBLÈME IDENTIFIÉ :
-- - Demande 0132 : Validée par M. Toney mais N'APPARAÎT PAS dans la BDD
-- - Demande 0138 : Validée par M. Toney et APPARAÎT dans la BDD
-- 
-- OBJECTIF : Identifier pourquoi 0132 n'a pas de signature de validation
-- ============================================================================

-- ============================================================================
-- PARTIE 1 : INFORMATIONS DE BASE DES DEUX DEMANDES
-- ============================================================================

-- 1.1 DEMANDE 0132 - INFORMATIONS COMPLÈTES
-- ----------------------------------------------------------------------------
SELECT 
    '=== DEMANDE 0132 - INFORMATIONS COMPLÈTES ===' AS section,
    d.id,
    d.numero,
    d.status,
    d.type,
    d."projetId",
    d."technicienId",
    d."dateCreation",
    d."dateModification",
    d."dateValidationFinale",
    d."dateSortie",
    d."dateLivraisonSouhaitee",
    d."dateLivraison",
    d."dateReceptionLivreur",
    d.commentaires,
    d."coutTotal",
    p.nom AS projet_nom,
    tech.nom || ' ' || tech.prenom AS demandeur_nom,
    tech.role AS demandeur_role
FROM demandes d
LEFT JOIN projets p ON d."projetId" = p.id
LEFT JOIN users tech ON d."technicienId" = tech.id
WHERE d.numero LIKE '%0132%';

-- 1.2 DEMANDE 0138 - INFORMATIONS COMPLÈTES
-- ----------------------------------------------------------------------------
SELECT 
    '=== DEMANDE 0138 - INFORMATIONS COMPLÈTES ===' AS section,
    d.id,
    d.numero,
    d.status,
    d.type,
    d."projetId",
    d."technicienId",
    d."dateCreation",
    d."dateModification",
    d."dateValidationFinale",
    d."dateSortie",
    d."dateLivraisonSouhaitee",
    d."dateLivraison",
    d."dateReceptionLivreur",
    d.commentaires,
    d."coutTotal",
    p.nom AS projet_nom,
    tech.nom || ' ' || tech.prenom AS demandeur_nom,
    tech.role AS demandeur_role
FROM demandes d
LEFT JOIN projets p ON d."projetId" = p.id
LEFT JOIN users tech ON d."technicienId" = tech.id
WHERE d.numero LIKE '%0138%';

-- ============================================================================
-- PARTIE 2 : SIGNATURES DE VALIDATION
-- ============================================================================

-- 2.1 TOUTES LES SIGNATURES POUR 0132
-- ----------------------------------------------------------------------------
SELECT 
    '=== SIGNATURES DE VALIDATION - DEMANDE 0132 ===' AS section,
    vs.id AS signature_id,
    vs.type AS type_validation,
    vs."userId" AS valideur_id,
    u.nom || ' ' || u.prenom AS valideur_nom,
    u.role AS valideur_role,
    vs.date AS date_validation,
    vs.commentaire,
    vs.signature
FROM validation_signatures vs
INNER JOIN demandes d ON vs."demandeId" = d.id
INNER JOIN users u ON vs."userId" = u.id
WHERE d.numero LIKE '%0132%'
ORDER BY vs.date ASC;

-- 2.2 TOUTES LES SIGNATURES POUR 0138
-- ----------------------------------------------------------------------------
SELECT 
    '=== SIGNATURES DE VALIDATION - DEMANDE 0138 ===' AS section,
    vs.id AS signature_id,
    vs.type AS type_validation,
    vs."userId" AS valideur_id,
    u.nom || ' ' || u.prenom AS valideur_nom,
    u.role AS valideur_role,
    vs.date AS date_validation,
    vs.commentaire,
    vs.signature
FROM validation_signatures vs
INNER JOIN demandes d ON vs."demandeId" = d.id
INNER JOIN users u ON vs."userId" = u.id
WHERE d.numero LIKE '%0138%'
ORDER BY vs.date ASC;

-- 2.3 COMPARAISON DES SIGNATURES M. TONEY
-- ----------------------------------------------------------------------------
SELECT 
    '=== COMPARAISON SIGNATURES M. TONEY ===' AS section,
    d.numero,
    vs.type AS type_validation,
    vs.date AS date_validation,
    u.nom || ' ' || u.prenom AS valideur_nom,
    CASE 
        WHEN d.numero LIKE '%0132%' THEN 'DEMANDE 0132'
        WHEN d.numero LIKE '%0138%' THEN 'DEMANDE 0138'
    END AS quelle_demande
FROM validation_signatures vs
INNER JOIN demandes d ON vs."demandeId" = d.id
INNER JOIN users u ON vs."userId" = u.id
WHERE (u.nom ILIKE '%toney%' OR u.email ILIKE '%toney%')
  AND (d.numero LIKE '%0132%' OR d.numero LIKE '%0138%')
ORDER BY vs.date ASC;

-- ============================================================================
-- PARTIE 3 : HISTORIQUE COMPLET DES DEUX DEMANDES
-- ============================================================================

-- 3.1 HISTORIQUE COMPLET - DEMANDE 0132
-- ----------------------------------------------------------------------------
SELECT 
    '=== HISTORIQUE COMPLET - DEMANDE 0132 ===' AS section,
    he.id AS history_id,
    he.action,
    he."ancienStatus",
    he."nouveauStatus",
    he.timestamp,
    he.commentaire,
    u.nom || ' ' || u.prenom AS utilisateur_nom,
    u.role AS utilisateur_role,
    he.details
FROM history_entries he
INNER JOIN demandes d ON he."demandeId" = d.id
INNER JOIN users u ON he."userId" = u.id
WHERE d.numero LIKE '%0132%'
ORDER BY he.timestamp ASC;

-- 3.2 HISTORIQUE COMPLET - DEMANDE 0138
-- ----------------------------------------------------------------------------
SELECT 
    '=== HISTORIQUE COMPLET - DEMANDE 0138 ===' AS section,
    he.id AS history_id,
    he.action,
    he."ancienStatus",
    he."nouveauStatus",
    he.timestamp,
    he.commentaire,
    u.nom || ' ' || u.prenom AS utilisateur_nom,
    u.role AS utilisateur_role,
    he.details
FROM history_entries he
INNER JOIN demandes d ON he."demandeId" = d.id
INNER JOIN users u ON he."userId" = u.id
WHERE d.numero LIKE '%0138%'
ORDER BY he.timestamp ASC;

-- 3.3 RECHERCHE D'ACTIONS DE VALIDATION PAR M. TONEY
-- ----------------------------------------------------------------------------
SELECT 
    '=== ACTIONS DE VALIDATION PAR M. TONEY ===' AS section,
    d.numero,
    he.action,
    he."ancienStatus",
    he."nouveauStatus",
    he.timestamp,
    he.commentaire,
    u.nom || ' ' || u.prenom AS utilisateur_nom
FROM history_entries he
INNER JOIN demandes d ON he."demandeId" = d.id
INNER JOIN users u ON he."userId" = u.id
WHERE (u.nom ILIKE '%toney%' OR u.email ILIKE '%toney%')
  AND (d.numero LIKE '%0132%' OR d.numero LIKE '%0138%')
  AND he.action IN ('valider', 'validation', 'approuver', 'approved')
ORDER BY he.timestamp ASC;

-- ============================================================================
-- PARTIE 4 : ANALYSE DES DIFFÉRENCES
-- ============================================================================

-- 4.1 COMPARAISON DES STATUTS ACTUELS
-- ----------------------------------------------------------------------------
SELECT 
    '=== COMPARAISON STATUTS ACTUELS ===' AS section,
    d.numero,
    d.status AS statut_actuel,
    d."dateValidationFinale" AS date_validation_finale,
    d."dateModification" AS derniere_modification,
    COUNT(vs.id) AS nombre_signatures,
    STRING_AGG(vs.type, ', ') AS types_validations,
    STRING_AGG(u.nom || ' ' || u.prenom, ', ') AS valideurs
FROM demandes d
LEFT JOIN validation_signatures vs ON d.id = vs."demandeId"
LEFT JOIN users u ON vs."userId" = u.id
WHERE d.numero LIKE '%0132%' OR d.numero LIKE '%0138%'
GROUP BY d.id, d.numero, d.status, d."dateValidationFinale", d."dateModification"
ORDER BY d.numero;

-- 4.2 VÉRIFICATION DES TYPES DE VALIDATION ATTENDUS
-- ----------------------------------------------------------------------------
SELECT 
    '=== TYPES DE VALIDATION ATTENDUS VS PRÉSENTS ===' AS section,
    d.numero,
    d.type AS type_demande,
    d.status AS statut_actuel,
    CASE 
        WHEN d.type = 'materiel' THEN 'conducteur_travaux, responsable_travaux, charge_affaire, logistique'
        WHEN d.type = 'outillage' THEN 'qhse'
        ELSE 'inconnu'
    END AS validations_attendues,
    STRING_AGG(vs.type, ', ') AS validations_presentes
FROM demandes d
LEFT JOIN validation_signatures vs ON d.id = vs."demandeId"
WHERE d.numero LIKE '%0132%' OR d.numero LIKE '%0138%'
GROUP BY d.id, d.numero, d.type, d.status;

-- 4.3 RECHERCHE DE SIGNATURES SUPPRIMÉES OU ORPHELINES
-- ----------------------------------------------------------------------------
-- Vérifier s'il existe des signatures sans demande correspondante
SELECT 
    '=== SIGNATURES ORPHELINES (sans demande) ===' AS section,
    vs.id AS signature_id,
    vs.type,
    vs."demandeId",
    vs."userId",
    u.nom || ' ' || u.prenom AS valideur_nom,
    vs.date
FROM validation_signatures vs
LEFT JOIN demandes d ON vs."demandeId" = d.id
INNER JOIN users u ON vs."userId" = u.id
WHERE d.id IS NULL
  AND (u.nom ILIKE '%toney%' OR u.email ILIKE '%toney%');

-- ============================================================================
-- PARTIE 5 : VÉRIFICATION DE L'INTÉGRITÉ DES DONNÉES
-- ============================================================================

-- 5.1 VÉRIFIER SI LA DEMANDE 0132 EXISTE BIEN
-- ----------------------------------------------------------------------------
SELECT 
    '=== EXISTENCE DEMANDE 0132 ===' AS section,
    COUNT(*) AS nombre_resultats,
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ DEMANDE 0132 N''EXISTE PAS'
        WHEN COUNT(*) = 1 THEN '✅ DEMANDE 0132 EXISTE'
        ELSE '⚠️ PLUSIEURS DEMANDES 0132 (PROBLÈME)'
    END AS diagnostic
FROM demandes
WHERE numero LIKE '%0132%';

-- 5.2 VÉRIFIER L'ID EXACT DE M. TONEY
-- ----------------------------------------------------------------------------
SELECT 
    '=== ID EXACT DE M. TONEY ===' AS section,
    u.id AS user_id,
    u.nom,
    u.prenom,
    u.email,
    u.role,
    u.phone
FROM users u
WHERE u.nom ILIKE '%toney%' OR u.email ILIKE '%toney%';

-- 5.3 RECHERCHE DE VALIDATIONS AVEC L'ID EXACT DE M. TONEY
-- ----------------------------------------------------------------------------
-- Cette requête utilise l'ID exact au lieu du nom
WITH mtoney AS (
    SELECT id FROM users WHERE nom ILIKE '%toney%' OR email ILIKE '%toney%' LIMIT 1
)
SELECT 
    '=== VALIDATIONS AVEC ID EXACT M. TONEY ===' AS section,
    d.numero,
    vs.type AS type_validation,
    vs.date AS date_validation,
    vs."userId" AS valideur_id,
    mtoney.id AS mtoney_id,
    CASE 
        WHEN vs."userId" = mtoney.id THEN '✅ CORRESPOND'
        ELSE '❌ NE CORRESPOND PAS'
    END AS verification
FROM validation_signatures vs
INNER JOIN demandes d ON vs."demandeId" = d.id
CROSS JOIN mtoney
WHERE (d.numero LIKE '%0132%' OR d.numero LIKE '%0138%')
ORDER BY vs.date ASC;

-- ============================================================================
-- PARTIE 6 : HYPOTHÈSES À VÉRIFIER
-- ============================================================================

-- 6.1 HYPOTHÈSE 1 : La signature a été créée puis supprimée
-- ----------------------------------------------------------------------------
SELECT 
    '=== HYPOTHÈSE 1 : Signature supprimée ? ===' AS section,
    'Vérifier dans les logs de l''application ou les sauvegardes' AS action_requise;

-- 6.2 HYPOTHÈSE 2 : La validation a été faite via l'interface mais pas enregistrée
-- ----------------------------------------------------------------------------
SELECT 
    '=== HYPOTHÈSE 2 : Validation non enregistrée ===' AS section,
    he.timestamp,
    he.action,
    he."nouveauStatus",
    d.numero,
    COUNT(vs.id) AS signatures_creees
FROM history_entries he
INNER JOIN demandes d ON he."demandeId" = d.id
LEFT JOIN validation_signatures vs ON d.id = vs."demandeId" 
    AND vs.date::date = he.timestamp::date
WHERE d.numero LIKE '%0132%'
  AND he.action IN ('valider', 'validation', 'approuver')
GROUP BY he.id, he.timestamp, he.action, he."nouveauStatus", d.numero;

-- 6.3 HYPOTHÈSE 3 : Type de validation incorrect
-- ----------------------------------------------------------------------------
SELECT 
    '=== HYPOTHÈSE 3 : Type de validation incorrect ===' AS section,
    d.numero,
    vs.type AS type_actuel,
    CASE 
        WHEN vs.type = 'responsable_travaux' THEN '❌ ANCIEN FORMAT'
        WHEN vs.type = 'validation_responsable_travaux' THEN '✅ NOUVEAU FORMAT'
        ELSE '⚠️ AUTRE TYPE'
    END AS format_type
FROM validation_signatures vs
INNER JOIN demandes d ON vs."demandeId" = d.id
INNER JOIN users u ON vs."userId" = u.id
WHERE (u.nom ILIKE '%toney%' OR u.email ILIKE '%toney%')
  AND (d.numero LIKE '%0132%' OR d.numero LIKE '%0138%');

-- ============================================================================
-- RÉSUMÉ DE L'ANALYSE
-- ============================================================================
-- Ce script va révéler :
-- 
-- ✅ POUR LA DEMANDE 0138 (qui fonctionne) :
--    - Signature de validation présente
--    - Type de validation correct
--    - Historique complet
-- 
-- ❌ POUR LA DEMANDE 0132 (qui ne fonctionne pas) :
--    - Signature de validation absente OU
--    - Type de validation incorrect OU
--    - Problème d'intégrité des données
-- 
-- CAUSES POSSIBLES :
-- 1. La signature n'a jamais été créée (bug dans le code de validation)
-- 2. La signature a été créée puis supprimée (problème de cascade delete)
-- 3. Le type de validation est incorrect (ancien vs nouveau format)
-- 4. L'ID de M. Toney ne correspond pas (problème d'authentification)
-- 5. La demande 0132 n'existe pas ou a été recréée
-- ============================================================================

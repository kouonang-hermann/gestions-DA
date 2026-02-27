-- ============================================================================
-- DIAGNOSTIC RAPIDE - M. TONEY DEMANDES 0132 ET 0138
-- ============================================================================
-- Script simplifié pour identifier rapidement le problème
-- ============================================================================

-- 1. ID DE M. TONEY
-- ----------------------------------------------------------------------------
SELECT 
    '=== ID M. TONEY ===' AS section,
    id, nom, prenom, role
FROM users 
WHERE nom ILIKE '%toney%' 
LIMIT 1;

-- 2. INFORMATIONS DES DEUX DEMANDES
-- ----------------------------------------------------------------------------
SELECT 
    '=== DEMANDES 0132 ET 0138 ===' AS section,
    numero,
    status,
    type,
    "projetId",
    "technicienId"
FROM demandes 
WHERE numero LIKE '%0132%' OR numero LIKE '%0138%'
ORDER BY numero;

-- 3. SIGNATURES DE VALIDATION EXISTANTES
-- ----------------------------------------------------------------------------
SELECT 
    '=== SIGNATURES ACTUELLES ===' AS section,
    d.numero,
    vs.type AS type_validation,
    vs."userId" AS valideur_id,
    u.nom || ' ' || u.prenom AS valideur_nom,
    vs.date
FROM validation_signatures vs
INNER JOIN demandes d ON vs."demandeId" = d.id
INNER JOIN users u ON vs."userId" = u.id
WHERE d.numero LIKE '%0132%' OR d.numero LIKE '%0138%'
ORDER BY d.numero, vs.date;

-- 4. VÉRIFICATION TYPE DE SIGNATURE POUR M. TONEY
-- ----------------------------------------------------------------------------
SELECT 
    '=== SIGNATURES M. TONEY ===' AS section,
    d.numero,
    vs.type AS type_actuel,
    CASE 
        WHEN vs.type = 'responsable_travaux' THEN '❌ ANCIEN FORMAT - À CORRIGER'
        WHEN vs.type = 'validation_responsable_travaux' THEN '✅ NOUVEAU FORMAT - OK'
        ELSE '⚠️ AUTRE TYPE'
    END AS diagnostic
FROM validation_signatures vs
INNER JOIN demandes d ON vs."demandeId" = d.id
INNER JOIN users u ON vs."userId" = u.id
WHERE (u.nom ILIKE '%toney%' OR u.email ILIKE '%toney%')
  AND (d.numero LIKE '%0132%' OR d.numero LIKE '%0138%');

-- ============================================================================
-- RÉSULTAT ATTENDU :
-- - Si 0138 a une signature mais pas 0132 → Créer la signature manquante
-- - Si les deux ont des signatures avec type incorrect → Corriger le type
-- ============================================================================

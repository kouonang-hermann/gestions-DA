-- ============================================================================
-- SCRIPT DE DIAGNOSTIC - PROBLÈME M. TONEY CARTE VALIDÉES
-- ============================================================================
-- Ce script récupère toutes les informations nécessaires pour diagnostiquer
-- pourquoi M. Toney voit 1 demande validée au lieu de 2
-- ============================================================================

-- 1. INFORMATIONS M. TONEY
-- ----------------------------------------------------------------------------
SELECT 
    '=== INFORMATIONS M. TONEY ===' AS section,
    u.id AS user_id,
    u.nom,
    u.prenom,
    u.email,
    u.role,
    u.phone
FROM users u
WHERE u.nom ILIKE '%toney%' OR u.email ILIKE '%toney%';

-- 2. PROJETS ASSIGNÉS À M. TONEY
-- ----------------------------------------------------------------------------
SELECT 
    '=== PROJETS ASSIGNÉS À M. TONEY ===' AS section,
    p.id AS projet_id,
    p.nom AS projet_nom,
    up."userId" AS user_id
FROM user_projets up
INNER JOIN projets p ON up."projetId" = p.id
INNER JOIN users u ON up."userId" = u.id
WHERE u.nom ILIKE '%toney%' OR u.email ILIKE '%toney%';

-- 3. TOUTES LES VALIDATIONS DE M. TONEY
-- ----------------------------------------------------------------------------
SELECT 
    '=== TOUTES LES VALIDATIONS DE M. TONEY ===' AS section,
    vs.id AS validation_id,
    vs.type AS type_validation,
    vs.date AS date_validation,
    vs.commentaire,
    d.numero AS demande_numero,
    d.status AS demande_status,
    d.type AS demande_type,
    d."projetId" AS projet_id,
    d."technicienId" AS demandeur_id,
    tech.nom || ' ' || tech.prenom AS demandeur_nom
FROM validation_signatures vs
INNER JOIN demandes d ON vs."demandeId" = d.id
INNER JOIN users u ON vs."userId" = u.id
LEFT JOIN users tech ON d."technicienId" = tech.id
WHERE u.nom ILIKE '%toney%' OR u.email ILIKE '%toney%'
ORDER BY vs.date DESC;

-- 4. DÉTAILS DE LA DEMANDE DA-M-2026-0138
-- ----------------------------------------------------------------------------
SELECT 
    '=== DÉTAILS DEMANDE DA-M-2026-0138 ===' AS section,
    d.id AS demande_id,
    d.numero,
    d.status,
    d.type,
    d."projetId",
    d."technicienId",
    d."dateCreation",
    tech.nom || ' ' || tech.prenom AS demandeur_nom,
    p.nom AS projet_nom
FROM demandes d
LEFT JOIN users tech ON d."technicienId" = tech.id
LEFT JOIN projets p ON d."projetId" = p.id
WHERE d.numero = 'DA-M-2026-0138';

-- 5. TOUTES LES SIGNATURES DE VALIDATION POUR DA-M-2026-0138
-- ----------------------------------------------------------------------------
SELECT 
    '=== SIGNATURES VALIDATION DA-M-2026-0138 ===' AS section,
    vs.id AS validation_id,
    vs.type AS type_validation,
    vs.date AS date_validation,
    vs.commentaire,
    vs."userId" AS valideur_id,
    u.nom || ' ' || u.prenom AS valideur_nom,
    u.role AS valideur_role
FROM validation_signatures vs
INNER JOIN demandes d ON vs."demandeId" = d.id
INNER JOIN users u ON vs."userId" = u.id
WHERE d.numero = 'DA-M-2026-0138'
ORDER BY vs.date ASC;

-- 6. HISTORIQUE COMPLET DE DA-M-2026-0138
-- ----------------------------------------------------------------------------
SELECT 
    '=== HISTORIQUE DA-M-2026-0138 ===' AS section,
    he.id AS history_id,
    he.action,
    he."ancienStatus",
    he."nouveauStatus",
    he.timestamp,
    he.commentaire,
    u.nom || ' ' || u.prenom AS utilisateur_nom,
    u.role AS utilisateur_role
FROM history_entries he
INNER JOIN demandes d ON he."demandeId" = d.id
INNER JOIN users u ON he."userId" = u.id
WHERE d.numero = 'DA-M-2026-0138'
ORDER BY he.timestamp ASC;

-- 7. DEMANDES VALIDÉES PAR M. TONEY (SELON LOGIQUE DASHBOARD)
-- ----------------------------------------------------------------------------
-- Cette requête reproduit la logique du dashboard pour identifier
-- quelles demandes devraient apparaître dans la carte "Validées"
SELECT 
    '=== DEMANDES VALIDÉES PAR M. TONEY (LOGIQUE DASHBOARD) ===' AS section,
    d.numero,
    d.status,
    d.type,
    d."projetId",
    p.nom AS projet_nom,
    vs.type AS type_validation,
    vs.date AS date_validation,
    tech.nom || ' ' || tech.prenom AS demandeur_nom,
    CASE 
        WHEN d.status IN (
            'en_attente_validation_charge_affaire',
            'en_attente_preparation_appro',
            'en_attente_validation_logistique',
            'en_attente_reception_livreur',
            'en_attente_livraison',
            'en_attente_validation_finale_demandeur',
            'confirmee_demandeur',
            'cloturee',
            'rejetee'
        ) THEN 'OUI ✅'
        ELSE 'NON ❌ (statut non inclus)'
    END AS devrait_apparaitre
FROM demandes d
INNER JOIN validation_signatures vs ON d.id = vs."demandeId"
INNER JOIN users u ON vs."userId" = u.id
LEFT JOIN users tech ON d."technicienId" = tech.id
LEFT JOIN projets p ON d."projetId" = p.id
WHERE 
    (u.nom ILIKE '%toney%' OR u.email ILIKE '%toney%')
    AND vs.type = 'validation_responsable_travaux'
ORDER BY vs.date DESC;

-- 8. VÉRIFICATION DES PROJETS DE M. TONEY VS PROJETS DES DEMANDES
-- ----------------------------------------------------------------------------
SELECT 
    '=== VÉRIFICATION FILTRAGE PAR PROJET ===' AS section,
    d.numero,
    d.status,
    d."projetId",
    p.nom AS projet_nom,
    vs.date AS date_validation,
    CASE 
        WHEN up."userId" IS NOT NULL THEN 'OUI ✅ (M. Toney assigné)'
        ELSE 'NON ❌ (M. Toney NON assigné)'
    END AS projet_assigne_a_toney
FROM demandes d
INNER JOIN validation_signatures vs ON d.id = vs."demandeId"
INNER JOIN users u ON vs."userId" = u.id
LEFT JOIN projets p ON d."projetId" = p.id
LEFT JOIN user_projets up ON d."projetId" = up."projetId" AND up."userId" = u.id
WHERE 
    (u.nom ILIKE '%toney%' OR u.email ILIKE '%toney%')
    AND vs.type = 'validation_responsable_travaux'
ORDER BY vs.date DESC;

-- ============================================================================
-- RÉSUMÉ ATTENDU
-- ============================================================================
-- Ce script devrait montrer :
-- 1. L'ID exact de M. Toney
-- 2. Ses projets assignés
-- 3. Toutes ses validations (devrait montrer 2 demandes)
-- 4. Le statut actuel de DA-M-2026-0138
-- 5. Si DA-M-2026-0138 a bien une signature de M. Toney
-- 6. Si le statut de DA-M-2026-0138 est dans la liste des statuts acceptés
-- 7. Si le projet de DA-M-2026-0138 est bien assigné à M. Toney
-- ============================================================================

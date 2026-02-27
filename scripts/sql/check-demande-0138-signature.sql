-- ============================================================================
-- VÉRIFICATION DE LA SIGNATURE DE VALIDATION POUR DA-M-2026-0138
-- ============================================================================
-- Ce script vérifie si la demande DA-M-2026-0138 a bien une signature
-- de validation du responsable des travaux enregistrée
-- ============================================================================

-- 1. Vérifier les informations de la demande
SELECT 
    d.id AS demande_id,
    d.numero,
    d.status AS statut_actuel,
    d."projetId" AS projet_id,
    d."technicienId" AS technicien_id,
    d."dateCreation",
    d."dateModification"
FROM 
    demandes d
WHERE 
    d.numero = 'DA-M-2026-0138';

-- 2. Vérifier les signatures de validation dans validation_signatures
SELECT 
    vs.id,
    vs.type AS type_validation,
    vs."userId" AS user_id,
    vs.date,
    vs.commentaire,
    u.nom || ' ' || u.prenom AS validateur,
    u.role
FROM 
    validation_signatures vs
    INNER JOIN users u ON vs."userId" = u.id
    INNER JOIN demandes d ON vs."demandeId" = d.id
WHERE 
    d.numero = 'DA-M-2026-0138';

-- 3. Vérifier l'ID de M. Toney
SELECT 
    id,
    nom,
    prenom,
    role,
    email
FROM 
    users
WHERE 
    nom ILIKE '%TONYE%' OR nom ILIKE '%TONEY%';

-- 4. Vérifier si la signature existe pour M. Toney spécifiquement
SELECT 
    vs.id,
    vs.type AS type_validation,
    vs."userId" AS user_id_signature,
    vs.date,
    d.numero AS numero_demande,
    d.status AS statut_demande,
    u.nom || ' ' || u.prenom AS validateur
FROM 
    validation_signatures vs
    INNER JOIN demandes d ON vs."demandeId" = d.id
    INNER JOIN users u ON vs."userId" = u.id
WHERE 
    d.numero = 'DA-M-2026-0138'
    AND vs.type = 'validation_responsable_travaux';

-- 5. Vérifier les projets assignés à M. Toney
SELECT 
    u.id AS user_id,
    u.nom || ' ' || u.prenom AS nom_complet,
    up."projetId" AS projet_id,
    p.nom AS nom_projet
FROM 
    users u
    LEFT JOIN user_projets up ON u.id = up."userId"
    LEFT JOIN projets p ON up."projetId" = p.id
WHERE 
    u.nom ILIKE '%TONYE%' OR u.nom ILIKE '%TONEY%';

-- 6. Vérifier si la demande DA-M-2026-0138 est dans un projet assigné à M. Toney
SELECT 
    d.numero,
    d."projetId",
    p.nom AS nom_projet,
    CASE 
        WHEN up."userId" IS NOT NULL THEN 'OUI - Projet assigné à M. Toney'
        ELSE 'NON - Projet NON assigné à M. Toney'
    END AS projet_assigne
FROM 
    demandes d
    INNER JOIN projets p ON d."projetId" = p.id
    LEFT JOIN user_projets up ON p.id = up."projetId" 
        AND up."userId" IN (SELECT id FROM users WHERE nom ILIKE '%TONYE%' OR nom ILIKE '%TONEY%')
WHERE 
    d.numero = 'DA-M-2026-0138';

-- ============================================================================
-- DIAGNOSTIC COMPLET
-- ============================================================================
-- Cette requête combine toutes les vérifications
WITH toney_user AS (
    SELECT id, nom, prenom, role
    FROM users
    WHERE nom ILIKE '%TONYE%' OR nom ILIKE '%TONEY%'
    LIMIT 1
),
demande_info AS (
    SELECT 
        d.id,
        d.numero,
        d.status,
        d."projetId"
    FROM demandes d
    WHERE d.numero = 'DA-M-2026-0138'
)
SELECT 
    'DIAGNOSTIC COMPLET' AS section,
    t.id AS toney_user_id,
    t.nom || ' ' || t.prenom AS toney_nom,
    di.numero AS demande_numero,
    di.status AS demande_statut,
    di."projetId" AS demande_projet_id,
    CASE 
        WHEN vs.id IS NOT NULL THEN 'OUI - Signature existe'
        ELSE 'NON - Signature manquante'
    END AS signature_existe,
    vs.type AS type_signature,
    vs.date AS date_signature,
    CASE 
        WHEN up."userId" IS NOT NULL THEN 'OUI - Projet assigné'
        ELSE 'NON - Projet non assigné'
    END AS projet_assigne
FROM 
    toney_user t
    CROSS JOIN demande_info di
    LEFT JOIN validation_signatures vs ON vs."demandeId" = di.id 
        AND vs."userId" = t.id
        AND vs.type = 'validation_responsable_travaux'
    LEFT JOIN user_projets up ON up."projetId" = di."projetId" 
        AND up."userId" = t.id;

-- ============================================================================
-- INSTRUCTIONS :
-- Exécutez ces requêtes dans l'ordre pour diagnostiquer le problème
-- ============================================================================

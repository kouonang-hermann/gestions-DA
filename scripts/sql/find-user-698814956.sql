-- ============================================================================
-- SCRIPT DE RECHERCHE - UTILISATEUR 698814956
-- ============================================================================
-- Ce script recherche l'utilisateur avec le numéro de téléphone 698814956
-- pour vérifier ses informations avant réinitialisation du mot de passe
-- ============================================================================

-- 1. RECHERCHE PAR NUMÉRO DE TÉLÉPHONE EXACT
-- ----------------------------------------------------------------------------
SELECT 
    '=== RECHERCHE PAR TÉLÉPHONE EXACT ===' AS section,
    u.id,
    u.nom,
    u.prenom,
    u.email,
    u.phone,
    u.role,
    u."createdAt",
    u."updatedAt"
FROM users u
WHERE u.phone = '698814956';

-- 2. RECHERCHE PAR NUMÉRO DE TÉLÉPHONE (VARIATIONS POSSIBLES)
-- ----------------------------------------------------------------------------
-- Recherche avec différentes variations du numéro
SELECT 
    '=== RECHERCHE AVEC VARIATIONS ===' AS section,
    u.id,
    u.nom,
    u.prenom,
    u.email,
    u.phone,
    u.role
FROM users u
WHERE 
    u.phone LIKE '%698814956%'
    OR u.phone = '698814956'
    OR u.phone = '+237698814956'
    OR u.phone = '237698814956'
    OR u.phone = '0698814956';

-- 3. INFORMATIONS COMPLÈTES DE L'UTILISATEUR
-- ----------------------------------------------------------------------------
-- Si trouvé, afficher toutes les informations pertinentes
SELECT 
    '=== INFORMATIONS COMPLÈTES ===' AS section,
    u.id,
    u.nom,
    u.prenom,
    u.email,
    u.phone,
    u.role,
    u.actif,
    u."createdAt",
    u."updatedAt",
    COUNT(DISTINCT up."projetId") AS nombre_projets,
    COUNT(DISTINCT d.id) AS nombre_demandes_creees
FROM users u
LEFT JOIN user_projets up ON u.id = up."userId"
LEFT JOIN demandes d ON u.id = d."technicienId"
WHERE u.phone LIKE '%698814956%'
GROUP BY u.id, u.nom, u.prenom, u.email, u.phone, u.role, u.actif, u."createdAt", u."updatedAt";

-- 4. PROJETS ASSIGNÉS À L'UTILISATEUR
-- ----------------------------------------------------------------------------
SELECT 
    '=== PROJETS ASSIGNÉS ===' AS section,
    p.id AS projet_id,
    p.nom AS projet_nom,
    p.actif AS projet_actif,
    u.nom || ' ' || u.prenom AS utilisateur
FROM user_projets up
INNER JOIN projets p ON up."projetId" = p.id
INNER JOIN users u ON up."userId" = u.id
WHERE u.phone LIKE '%698814956%';

-- 5. DERNIÈRES DEMANDES CRÉÉES PAR L'UTILISATEUR
-- ----------------------------------------------------------------------------
SELECT 
    '=== DERNIÈRES DEMANDES ===' AS section,
    d.numero,
    d.type,
    d.status,
    d."dateCreation",
    p.nom AS projet_nom
FROM demandes d
INNER JOIN users u ON d."technicienId" = u.id
INNER JOIN projets p ON d."projetId" = p.id
WHERE u.phone LIKE '%698814956%'
ORDER BY d."dateCreation" DESC
LIMIT 5;

-- ============================================================================
-- RÉSULTAT ATTENDU
-- ============================================================================
-- Ce script devrait afficher :
-- 1. Les informations de base de l'utilisateur
-- 2. Ses projets assignés
-- 3. Ses dernières demandes
-- 
-- Si aucun résultat, l'utilisateur n'existe pas avec ce numéro de téléphone
-- ============================================================================

-- ============================================================================
-- VÉRIFICATION UTILISATEUR 698814956
-- ============================================================================
-- Script pour vérifier les informations exactes de l'utilisateur
-- ============================================================================

-- 1. RECHERCHE PAR TÉLÉPHONE (toutes variations)
-- ----------------------------------------------------------------------------
SELECT 
    '=== RECHERCHE PAR TÉLÉPHONE ===' AS section,
    id,
    nom,
    prenom,
    email,
    phone,
    role,
    actif
FROM users
WHERE phone LIKE '%698814956%'
   OR phone = '698814956'
   OR phone = '+237698814956'
   OR phone = '237698814956'
   OR phone = '0698814956';

-- 2. RECHERCHE PAR NOM (FOUTSAP KONLACK)
-- ----------------------------------------------------------------------------
SELECT 
    '=== RECHERCHE PAR NOM ===' AS section,
    id,
    nom,
    prenom,
    email,
    phone,
    role,
    actif
FROM users
WHERE nom ILIKE '%FOUTSAP%'
   OR nom ILIKE '%KONLACK%'
   OR prenom ILIKE '%FOUTSAP%'
   OR prenom ILIKE '%KONLACK%'
   OR (nom ILIKE '%FOUTSAP%' AND prenom ILIKE '%KONLACK%');

-- 3. RECHERCHE PAR NOM COMPLET EXACT
-- ----------------------------------------------------------------------------
SELECT 
    '=== RECHERCHE NOM COMPLET EXACT ===' AS section,
    id,
    nom,
    prenom,
    CONCAT(nom, ' ', prenom) AS nom_complet,
    email,
    phone,
    role,
    actif
FROM users
WHERE CONCAT(nom, ' ', prenom) ILIKE '%FOUTSAP KONLACK Aristide%'
   OR CONCAT(prenom, ' ', nom) ILIKE '%FOUTSAP KONLACK Aristide%';

-- 4. LISTE DE TOUS LES UTILISATEURS (pour comparaison)
-- ----------------------------------------------------------------------------
SELECT 
    '=== TOUS LES UTILISATEURS ===' AS section,
    id,
    nom,
    prenom,
    CONCAT(nom, ' ', prenom) AS nom_complet,
    phone,
    email,
    role
FROM users
ORDER BY nom, prenom;

-- ============================================================================
-- DIAGNOSTIC
-- ============================================================================
-- Ce script va révéler :
-- 1. Si l'utilisateur existe avec le numéro 698814956
-- 2. Le format exact du nom dans la base de données
-- 3. Si le nom "FOUTSAP KONLACK Aristide" correspond exactement
-- ============================================================================

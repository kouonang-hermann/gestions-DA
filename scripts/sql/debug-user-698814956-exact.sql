-- ============================================================================
-- DEBUG EXACT - UTILISATEUR 698814956
-- ============================================================================
-- Script pour identifier EXACTEMENT pourquoi l'utilisateur n'est pas trouvé
-- ============================================================================

-- 1. RECHERCHE PAR TÉLÉPHONE EXACT
-- ----------------------------------------------------------------------------
SELECT 
    '=== RECHERCHE PAR TÉLÉPHONE EXACT ===' AS section,
    id,
    nom,
    prenom,
    phone,
    email,
    LENGTH(phone) AS longueur_telephone,
    LENGTH(nom) AS longueur_nom,
    LENGTH(prenom) AS longueur_prenom
FROM users
WHERE phone = '698814956';

-- 2. RECHERCHE PAR TÉLÉPHONE (LIKE)
-- ----------------------------------------------------------------------------
SELECT 
    '=== RECHERCHE PAR TÉLÉPHONE (LIKE) ===' AS section,
    id,
    nom,
    prenom,
    phone,
    email
FROM users
WHERE phone LIKE '%698814956%';

-- 3. VÉRIFIER LE FORMAT EXACT DU NOM
-- ----------------------------------------------------------------------------
SELECT 
    '=== FORMAT EXACT DU NOM ===' AS section,
    nom,
    prenom,
    CONCAT(nom, ' ', prenom) AS nom_complet,
    phone,
    -- Vérifier si le nom correspond
    CASE 
        WHEN nom ILIKE 'FOUTSAP KONLACK Aristide' THEN '✅ NOM CORRESPOND'
        ELSE '❌ NOM NE CORRESPOND PAS'
    END AS verification_nom,
    -- Vérifier si le prénom correspond
    CASE 
        WHEN prenom ILIKE 'FOUTSAP KONLACK Aristide' THEN '✅ PRENOM CORRESPOND'
        ELSE '❌ PRENOM NE CORRESPOND PAS'
    END AS verification_prenom,
    -- Vérifier si nom contient FOUTSAP
    CASE 
        WHEN nom ILIKE '%FOUTSAP%' THEN '✅ NOM CONTIENT FOUTSAP'
        ELSE '❌ NOM NE CONTIENT PAS FOUTSAP'
    END AS contient_foutsap,
    -- Vérifier si prenom contient Aristide
    CASE 
        WHEN prenom ILIKE '%Aristide%' THEN '✅ PRENOM CONTIENT Aristide'
        ELSE '❌ PRENOM NE CONTIENT PAS Aristide'
    END AS contient_aristide
FROM users
WHERE phone = '698814956';

-- 4. TOUS LES UTILISATEURS AVEC FOUTSAP
-- ----------------------------------------------------------------------------
SELECT 
    '=== TOUS LES UTILISATEURS AVEC FOUTSAP ===' AS section,
    id,
    nom,
    prenom,
    phone,
    email
FROM users
WHERE nom ILIKE '%FOUTSAP%' OR prenom ILIKE '%FOUTSAP%';

-- 5. TOUS LES UTILISATEURS AVEC 698814956
-- ----------------------------------------------------------------------------
SELECT 
    '=== TOUS LES UTILISATEURS AVEC 698814956 ===' AS section,
    id,
    nom,
    prenom,
    phone,
    email
FROM users
WHERE phone LIKE '%698814956%';

-- 6. SIMULATION DE LA REQUÊTE PRISMA
-- ----------------------------------------------------------------------------
-- Cette requête simule exactement ce que Prisma fait
SELECT 
    '=== SIMULATION REQUÊTE PRISMA ===' AS section,
    id,
    nom,
    prenom,
    phone,
    email
FROM users
WHERE phone = '698814956'
  AND (
    nom ILIKE 'FOUTSAP KONLACK Aristide'
    OR prenom ILIKE 'FOUTSAP KONLACK Aristide'
    OR (nom ILIKE 'FOUTSAP' AND prenom ILIKE 'KONLACK Aristide')
    OR (prenom ILIKE 'FOUTSAP' AND nom ILIKE 'KONLACK Aristide')
  );

-- 7. LISTE DE TOUS LES UTILISATEURS (pour comparaison)
-- ----------------------------------------------------------------------------
SELECT 
    '=== TOUS LES UTILISATEURS ===' AS section,
    id,
    nom,
    prenom,
    phone,
    email,
    role
FROM users
ORDER BY nom, prenom;

-- ============================================================================
-- DIAGNOSTIC
-- ============================================================================
-- Ce script va révéler :
-- 1. Si l'utilisateur existe avec le téléphone 698814956
-- 2. Le format EXACT du nom et prénom dans la BDD
-- 3. Pourquoi la requête Prisma ne trouve pas l'utilisateur
-- 4. Quelle correction appliquer
-- ============================================================================

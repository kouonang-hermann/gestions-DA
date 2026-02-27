-- ============================================================================
-- SOLUTION - RÉINITIALISATION MOT DE PASSE 698814956
-- ============================================================================
-- Ce script identifie le problème et propose des solutions
-- ============================================================================

-- ÉTAPE 1 : IDENTIFIER L'UTILISATEUR EXACT
-- ----------------------------------------------------------------------------
-- Recherche par téléphone
SELECT 
    '=== UTILISATEUR TROUVÉ PAR TÉLÉPHONE ===' AS section,
    id,
    nom,
    prenom,
    CONCAT(nom, ' ', prenom) AS nom_complet_bdd,
    'FOUTSAP KONLACK Aristide' AS nom_saisi,
    phone,
    email,
    CASE 
        WHEN CONCAT(nom, ' ', prenom) = 'FOUTSAP KONLACK Aristide' THEN '✅ CORRESPOND EXACTEMENT'
        WHEN LOWER(CONCAT(nom, ' ', prenom)) = LOWER('FOUTSAP KONLACK Aristide') THEN '⚠️ CORRESPOND (casse différente)'
        ELSE '❌ NE CORRESPOND PAS'
    END AS verification_nom
FROM users
WHERE phone LIKE '%698814956%';

-- ÉTAPE 2 : VÉRIFIER LE FORMAT DU NOM DANS LA BDD
-- ----------------------------------------------------------------------------
SELECT 
    '=== FORMAT DU NOM DANS LA BDD ===' AS section,
    nom,
    prenom,
    CONCAT(nom, ' ', prenom) AS format_nom_prenom,
    CONCAT(prenom, ' ', nom) AS format_prenom_nom,
    LENGTH(nom) AS longueur_nom,
    LENGTH(prenom) AS longueur_prenom
FROM users
WHERE phone LIKE '%698814956%';

-- ============================================================================
-- SOLUTION A : RÉINITIALISER LE MOT DE PASSE DIRECTEMENT EN SQL
-- ============================================================================

-- Générer un hash bcrypt pour un nouveau mot de passe
-- Mot de passe temporaire : Temp2026!
-- Hash bcrypt : $2a$10$YourHashHere (à générer avec bcrypt)

-- IMPORTANT : Exécuter cette commande Node.js pour générer le hash :
-- node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('Temp2026!', 10, (err, hash) => console.log(hash));"

-- Puis exécuter cette requête avec le hash généré :
/*
UPDATE users
SET 
    password = '$2a$10$VOTRE_HASH_ICI',
    "updatedAt" = NOW()
WHERE phone LIKE '%698814956%';
*/

-- ============================================================================
-- SOLUTION B : CORRIGER LE NOM DANS LA BASE DE DONNÉES
-- ============================================================================

-- Si le nom dans la BDD est différent de "FOUTSAP KONLACK Aristide"
-- Option 1 : Mettre à jour le nom pour qu'il corresponde
/*
UPDATE users
SET 
    nom = 'FOUTSAP KONLACK Aristide',
    prenom = '',
    "updatedAt" = NOW()
WHERE phone LIKE '%698814956%';
*/

-- Option 2 : Séparer nom et prénom correctement
/*
UPDATE users
SET 
    nom = 'FOUTSAP KONLACK',
    prenom = 'Aristide',
    "updatedAt" = NOW()
WHERE phone LIKE '%698814956%';
*/

-- ============================================================================
-- VÉRIFICATION APRÈS CORRECTION
-- ============================================================================

SELECT 
    '=== VÉRIFICATION FINALE ===' AS section,
    id,
    nom,
    prenom,
    CONCAT(nom, ' ', prenom) AS nom_complet,
    phone,
    email,
    "updatedAt"
FROM users
WHERE phone LIKE '%698814956%';

-- ============================================================================
-- INSTRUCTIONS
-- ============================================================================
-- 
-- 1. Exécuter ÉTAPE 1 et ÉTAPE 2 pour identifier le problème
-- 
-- 2. Si le nom ne correspond pas :
--    - Choisir SOLUTION B pour corriger le nom
--    - Puis réessayer la récupération via l'interface
-- 
-- 3. Si vous voulez réinitialiser directement :
--    - Générer un hash bcrypt avec Node.js
--    - Utiliser SOLUTION A avec le hash généré
--    - Communiquer le mot de passe temporaire à l'utilisateur
-- 
-- ============================================================================

-- ============================================================================
-- REQUÊTE SQL : AJOUTER DES UTILISATEURS À TOUS LES PROJETS
-- ============================================================================
-- Cette requête ajoute les utilisateurs spécifiés à tous les projets
-- où ils ne sont pas encore assignés
-- 
-- Utilisateurs à ajouter (par leur numéro de téléphone) :
-- - 690671804
-- - 656511602
-- - 693428811
-- - 657765003
-- - 697619722
-- ============================================================================

-- Étape 1 : Vérifier que les utilisateurs existent
-- (Optionnel - pour diagnostic)
SELECT 
    id, 
    nom, 
    prenom, 
    phone, 
    role 
FROM users 
WHERE phone IN ('690671804', '656511602', '693428811', '657765003', '697619722');

-- ============================================================================
-- Étape 2 : REQUÊTE PRINCIPALE - Ajouter les utilisateurs à tous les projets
-- ============================================================================

-- Cette requête insère les associations utilisateur-projet manquantes
-- Elle utilise un CROSS JOIN pour créer toutes les combinaisons possibles
-- puis filtre celles qui existent déjà avec un LEFT JOIN + WHERE IS NULL

INSERT INTO user_projets (id, "userId", "projetId")
SELECT 
    gen_random_uuid() AS id,  -- Génère un UUID pour chaque nouvelle association
    u.id AS "userId",
    p.id AS "projetId"
FROM 
    users u
CROSS JOIN 
    projets p
LEFT JOIN 
    user_projets up ON up."userId" = u.id AND up."projetId" = p.id
WHERE 
    u.phone IN ('690671804', '656511602', '693428811', '657765003', '697619722')
    AND up.id IS NULL  -- Ne pas insérer si l'association existe déjà
    AND p.actif = true; -- Seulement les projets actifs

-- ============================================================================
-- Étape 3 : Vérifier le résultat
-- (Optionnel - pour diagnostic)
-- ============================================================================

-- Compter le nombre d'associations créées par utilisateur
SELECT 
    u.phone,
    u.nom,
    u.prenom,
    COUNT(up.id) AS nombre_projets_assignes
FROM 
    users u
LEFT JOIN 
    user_projets up ON up."userId" = u.id
WHERE 
    u.phone IN ('690671804', '656511602', '693428811', '657765003', '697619722')
GROUP BY 
    u.id, u.phone, u.nom, u.prenom
ORDER BY 
    u.phone;

-- ============================================================================
-- ALTERNATIVE : Si vous voulez inclure TOUS les projets (même inactifs)
-- ============================================================================

-- Décommentez cette requête si vous voulez ajouter les utilisateurs
-- à TOUS les projets, y compris les projets inactifs

/*
INSERT INTO user_projets (id, "userId", "projetId")
SELECT 
    gen_random_uuid() AS id,
    u.id AS "userId",
    p.id AS "projetId"
FROM 
    users u
CROSS JOIN 
    projets p
LEFT JOIN 
    user_projets up ON up."userId" = u.id AND up."projetId" = p.id
WHERE 
    u.phone IN ('690671804', '656511602', '693428811', '657765003', '697619722')
    AND up.id IS NULL;
*/

-- ============================================================================
-- NOTES IMPORTANTES
-- ============================================================================
-- 1. La requête utilise gen_random_uuid() pour générer les IDs
--    (compatible PostgreSQL 13+)
-- 
-- 2. Si vous utilisez une version plus ancienne de PostgreSQL,
--    remplacez gen_random_uuid() par uuid_generate_v4()
--    (nécessite l'extension uuid-ossp)
--
-- 3. La contrainte UNIQUE sur (userId, projetId) dans la table user_projets
--    empêche les doublons, donc la requête est sûre à exécuter plusieurs fois
--
-- 4. Seuls les projets actifs sont ciblés par défaut
--    (modifiez la clause WHERE si nécessaire)
-- ============================================================================

-- Script SQL pour ajouter l'utilisateur 69930545 à tous les projets non-test
-- Date: 2026-01-26
-- Description: Ajoute l'utilisateur avec le téléphone 69930545 à tous les projets 
--              dont le nom ne contient pas "test" (insensible à la casse)

-- ÉTAPE 1: Vérifier que l'utilisateur existe
-- Décommentez cette ligne pour vérifier l'utilisateur avant d'exécuter le script
-- SELECT id, nom, prenom, email, phone, role FROM users WHERE phone = '69930545';

-- ÉTAPE 2: Ajouter l'utilisateur à tous les projets non-test
-- Cette requête insère une ligne dans user_projets pour chaque projet non-test
-- Elle évite les doublons grâce à ON CONFLICT DO NOTHING

INSERT INTO user_projets (id, "userId", "projetId")
SELECT 
    gen_random_uuid() AS id,
    u.id AS "userId",
    p.id AS "projetId"
FROM 
    users u
CROSS JOIN 
    projets p
WHERE 
    u.phone = '69930545'
    AND p.actif = true
    AND LOWER(p.nom) NOT LIKE '%test%'
    AND LOWER(p.id) NOT LIKE '%test%'
    AND NOT EXISTS (
        -- Éviter les doublons si l'utilisateur est déjà assigné
        SELECT 1 
        FROM user_projets up 
        WHERE up."userId" = u.id 
        AND up."projetId" = p.id
    );

-- ÉTAPE 3: Vérifier le résultat
-- Décommentez ces lignes pour voir les assignations créées
-- SELECT 
--     u.nom, 
--     u.prenom, 
--     u.phone,
--     p.nom AS projet_nom,
--     p.id AS projet_id
-- FROM user_projets up
-- JOIN users u ON up."userId" = u.id
-- JOIN projets p ON up."projetId" = p.id
-- WHERE u.phone = '69930545'
-- ORDER BY p.nom;

-- ÉTAPE 4 (OPTIONNEL): Compter les assignations
-- Décommentez pour voir le nombre de projets assignés
-- SELECT COUNT(*) AS nombre_projets_assignes
-- FROM user_projets up
-- JOIN users u ON up."userId" = u.id
-- WHERE u.phone = '69930545';

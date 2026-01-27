-- Script pour assigner l'utilisateur 69930545 à tous les projets non-test
-- Date: 2026-01-26
-- CORRECTION: Script simplifié sans condition NOT EXISTS

-- ÉTAPE 1: Vérifier l'utilisateur (pour debug)
DO $$
DECLARE
    v_user_id TEXT;
    v_user_nom TEXT;
BEGIN
    SELECT id, nom INTO v_user_id, v_user_nom FROM users WHERE phone = '69930545';
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE '❌ ERREUR: Utilisateur avec phone 69930545 non trouvé!';
    ELSE
        RAISE NOTICE '✅ Utilisateur trouvé: % (ID: %)', v_user_nom, v_user_id;
    END IF;
END $$;

-- ÉTAPE 2: Supprimer les assignations existantes (pour éviter les doublons)
DELETE FROM user_projets
WHERE "userId" = (SELECT id FROM users WHERE phone = '69930545');

-- ÉTAPE 3: Insérer les nouvelles assignations pour TOUS les projets non-test
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
    AND LOWER(p.id) NOT LIKE '%test%';

-- ÉTAPE 4: Afficher le résultat
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM user_projets up
    JOIN users u ON up."userId" = u.id
    WHERE u.phone = '69930545';
    
    RAISE NOTICE '✅ Nombre de projets assignés: %', v_count;
END $$;

-- ÉTAPE 5: Vérifier les assignations créées
SELECT 
    u.nom AS "utilisateur",
    u.phone,
    p.nom AS "projet",
    p.actif AS "projet_actif"
FROM user_projets up
JOIN users u ON up."userId" = u.id
JOIN projets p ON up."projetId" = p.id
WHERE u.phone = '69930545'
ORDER BY p.nom;

-- ============================================================================
-- Script SQL : Assigner l'utilisateur 655082309 à tous les projets de production
-- Exclut les projets de test (contenant "test" dans le nom ou la description)
-- ============================================================================

-- 1. Vérifier que l'utilisateur existe
DO $$
DECLARE
    v_user_id TEXT;
    v_user_nom TEXT;
    v_user_prenom TEXT;
BEGIN
    -- Récupérer l'ID de l'utilisateur
    SELECT id, nom, prenom INTO v_user_id, v_user_nom, v_user_prenom
    FROM users
    WHERE phone = '655082309';

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur avec le téléphone 655082309 non trouvé';
    END IF;

    RAISE NOTICE '✓ Utilisateur trouvé: % % (ID: %)', v_user_prenom, v_user_nom, v_user_id;
END $$;

-- 2. Afficher les projets qui seront assignés (projets actifs, hors test)
DO $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM projets
    WHERE actif = true
    AND LOWER(nom) NOT LIKE '%test%'
    AND LOWER(description) NOT LIKE '%test%';

    RAISE NOTICE '→ Nombre de projets de production à assigner: %', v_count;
END $$;

-- 3. Afficher les projets exclus (projets test)
SELECT 
    id,
    nom,
    description,
    actif,
    '❌ EXCLU (projet test)' as statut
FROM projets
WHERE actif = true
AND (
    LOWER(nom) LIKE '%test%'
    OR LOWER(description) LIKE '%test%'
)
ORDER BY nom;

-- 4. Supprimer les assignations existantes pour cet utilisateur
-- (pour éviter les doublons et permettre une réassignation propre)
DELETE FROM user_projets
WHERE userId = (SELECT id FROM users WHERE phone = '655082309');

RAISE NOTICE '✓ Assignations existantes supprimées';

-- 5. Créer les nouvelles assignations pour tous les projets de production
INSERT INTO user_projets (id, "userId", "projetId")
SELECT 
    gen_random_uuid()::text,
    (SELECT id FROM users WHERE phone = '655082309'),
    p.id
FROM projets p
WHERE p.actif = true
AND LOWER(p.nom) NOT LIKE '%test%'
AND LOWER(p.description) NOT LIKE '%test%'
AND NOT EXISTS (
    -- Vérifier qu'il n'y a pas déjà une assignation (sécurité supplémentaire)
    SELECT 1 
    FROM user_projets up 
    WHERE up."userId" = (SELECT id FROM users WHERE phone = '655082309')
    AND up."projetId" = p.id
);

-- 6. Afficher le résultat final
DO $$
DECLARE
    v_user_id TEXT;
    v_user_nom TEXT;
    v_user_prenom TEXT;
    v_count_assigned INTEGER;
    v_count_excluded INTEGER;
BEGIN
    -- Récupérer les infos utilisateur
    SELECT id, nom, prenom INTO v_user_id, v_user_nom, v_user_prenom
    FROM users
    WHERE phone = '655082309';

    -- Compter les projets assignés
    SELECT COUNT(*) INTO v_count_assigned
    FROM user_projets
    WHERE "userId" = v_user_id;

    -- Compter les projets exclus
    SELECT COUNT(*) INTO v_count_excluded
    FROM projets
    WHERE actif = true
    AND (
        LOWER(nom) LIKE '%test%'
        OR LOWER(description) LIKE '%test%'
    );

    RAISE NOTICE '';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'RÉSUMÉ DE L''ASSIGNATION';
    RAISE NOTICE '============================================================================';
    RAISE NOTICE 'Utilisateur: % % (655082309)', v_user_prenom, v_user_nom;
    RAISE NOTICE 'Projets assignés: %', v_count_assigned;
    RAISE NOTICE 'Projets exclus (test): %', v_count_excluded;
    RAISE NOTICE '============================================================================';
END $$;

-- 7. Afficher la liste détaillée des projets assignés
SELECT 
    p.id,
    p.nom,
    p.description,
    p.actif,
    TO_CHAR(p."dateDebut", 'DD/MM/YYYY') as date_debut,
    TO_CHAR(p."dateFin", 'DD/MM/YYYY') as date_fin,
    '✓ ASSIGNÉ' as statut
FROM projets p
INNER JOIN user_projets up ON up."projetId" = p.id
WHERE up."userId" = (SELECT id FROM users WHERE phone = '655082309')
ORDER BY p.nom;

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================

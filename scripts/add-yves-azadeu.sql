-- ============================================
-- Script d'ajout de M. AZADEU NOUMA Yves
-- Téléphone: 655082309
-- Mot de passe: Secure01
-- Rôle: Employé
-- ============================================

DO $$
DECLARE
    v_user_id TEXT;
    v_projet RECORD;
    v_count INTEGER := 0;
BEGIN
    -- Vérifier si l'utilisateur existe déjà
    SELECT id INTO v_user_id FROM users WHERE phone = '655082309';
    
    IF v_user_id IS NOT NULL THEN
        RAISE NOTICE '⚠️  Utilisateur avec le téléphone 655082309 existe déjà (ID: %)', v_user_id;
        
        -- Mettre à jour les informations et le mot de passe
        UPDATE users 
        SET 
            nom = 'AZADEU NOUMA',
            prenom = 'Yves',
            email = 'yves.azadeunouma@company.com',
            password = '$2b$12$9hdfwz7nMf8YrTU9aiWaBuHzrDKNdSVK.e6OlRhuINfB3onQuegPu',
            role = 'employe',
            "isAdmin" = false,
            "updatedAt" = NOW()
        WHERE phone = '655082309';
        
        RAISE NOTICE '✅ Informations et mot de passe mis à jour pour 655082309';
        
    ELSE
        -- Générer un nouvel ID
        v_user_id := 'user-azadeunouma-' || substr(md5(random()::text), 1, 12);
        
        -- Créer le nouvel utilisateur
        INSERT INTO users (
            id,
            nom,
            prenom,
            email,
            password,
            phone,
            role,
            "isAdmin",
            "createdAt",
            "updatedAt"
        ) VALUES (
            v_user_id,
            'AZADEU NOUMA',
            'Yves',
            'yves.azadeunouma@company.com',
            '$2b$12$9hdfwz7nMf8YrTU9aiWaBuHzrDKNdSVK.e6OlRhuINfB3onQuegPu',
            '655082309',
            'employe',
            false,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE '✅ Nouvel utilisateur créé avec ID: %', v_user_id;
    END IF;

    -- Supprimer les anciennes assignations de projets
    DELETE FROM user_projets WHERE "userId" = v_user_id;
    RAISE NOTICE '🗑️  Anciennes assignations supprimées';

    -- Assigner à tous les projets en production (hors test)
    FOR v_projet IN 
        SELECT id, nom 
        FROM projets 
        WHERE actif = true 
        AND LOWER(nom) NOT LIKE '%test%'
        AND LOWER(description) NOT LIKE '%test%'
        ORDER BY nom
    LOOP
        INSERT INTO user_projets (
            id,
            "userId",
            "projetId"
        ) VALUES (
            'up-' || substr(md5(v_user_id || v_projet.id || random()::text), 1, 24),
            v_user_id,
            v_projet.id
        );
        
        v_count := v_count + 1;
        RAISE NOTICE '📌 Assigné au projet: %', v_projet.nom;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '✅ TERMINÉ: Utilisateur assigné à % projet(s)', v_count;
    RAISE NOTICE '════════════════════════════════════════';
    RAISE NOTICE '📱 Identifiants de connexion:';
    RAISE NOTICE '   Téléphone: 655082309';
    RAISE NOTICE '   Mot de passe: Secure01';
    RAISE NOTICE '   Rôle: Employé';
    RAISE NOTICE '════════════════════════════════════════';
    
END $$;

-- ============================================
-- Vérification finale
-- ============================================

SELECT 
    '✅ UTILISATEUR' as type,
    u.id,
    u.nom,
    u.prenom,
    u.phone,
    u.email,
    u.role,
    u."isAdmin" as is_admin,
    COUNT(up."projetId") as nombre_projets_assignes
FROM users u
LEFT JOIN user_projets up ON u.id = up."userId"
WHERE u.phone = '655082309'
GROUP BY u.id, u.nom, u.prenom, u.phone, u.email, u.role, u."isAdmin";

-- Liste des projets assignés
SELECT 
    '📌 PROJETS ASSIGNÉS' as type,
    p.nom as projet_nom,
    p.description as projet_description,
    p.actif as projet_actif
FROM users u
JOIN user_projets up ON u.id = up."userId"
JOIN projets p ON up."projetId" = p.id
WHERE u.phone = '655082309'
ORDER BY p.nom;

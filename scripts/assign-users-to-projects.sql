-- Script SQL pour assigner tous les utilisateurs (sauf les utilisateurs de test) a tous les projets
-- A executer dans l'editeur SQL de Supabase apres avoir cree les projets

-- Ce script va creer des relations dans la table user_projets
-- pour assigner chaque utilisateur non-test a chaque projet

DO $$
DECLARE
  user_record RECORD;
  projet_record RECORD;
  existing_count INT;
  created_count INT := 0;
BEGIN
  -- Parcourir tous les utilisateurs (sauf les utilisateurs de test)
  FOR user_record IN 
    SELECT id, nom, prenom, email 
    FROM users 
    WHERE 
      -- Exclure les utilisateurs de test (ajustez les critères selon vos besoins)
      email NOT LIKE '%@test.com%' 
      AND email IS NOT NULL
      AND email != ''
  LOOP
    -- Pour chaque utilisateur, l'assigner à tous les projets
    FOR projet_record IN 
      SELECT id, nom 
      FROM projets
    LOOP
      -- Vérifier si l'assignation existe déjà
      SELECT COUNT(*) INTO existing_count
      FROM user_projets
      WHERE "userId" = user_record.id AND "projetId" = projet_record.id;
      
      -- Si l'assignation n'existe pas, la créer
      IF existing_count = 0 THEN
        INSERT INTO user_projets (id, "userId", "projetId")
        VALUES (gen_random_uuid(), user_record.id, projet_record.id);
        
        created_count := created_count + 1;
        
        -- Log pour suivre la progression (optionnel)
        RAISE NOTICE 'Assigné: % % au projet %', user_record.prenom, user_record.nom, projet_record.nom;
      END IF;
    END LOOP;
  END LOOP;
  
  -- Afficher le résultat
  RAISE NOTICE '✅ Total assignations créées: %', created_count;
END $$;

-- Afficher les statistiques finales
SELECT 
  COUNT(DISTINCT "userId") as "Nombre d'utilisateurs assignés",
  COUNT(DISTINCT "projetId") as "Nombre de projets avec assignations",
  COUNT(*) as "Total assignations"
FROM user_projets;

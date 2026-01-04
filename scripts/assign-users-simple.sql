-- Assigner tous les utilisateurs non-test a tous les projets
-- Inclut les utilisateurs avec ou sans email

INSERT INTO user_projets (id, "userId", "projetId")
SELECT 
  gen_random_uuid(),
  u.id,
  p.id
FROM users u
CROSS JOIN projets p
WHERE 
  (u.email NOT LIKE '%@test.com%' OR u.email IS NULL OR u.email = '')
  AND NOT EXISTS (
    SELECT 1 
    FROM user_projets up 
    WHERE up."userId" = u.id AND up."projetId" = p.id
  );

-- Afficher les statistiques
SELECT 
  COUNT(DISTINCT "userId") as "Utilisateurs assignes",
  COUNT(DISTINCT "projetId") as "Projets avec assignations",
  COUNT(*) as "Total assignations"
FROM user_projets;

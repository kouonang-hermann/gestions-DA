-- Script pour analyser les utilisateurs et leurs assignations aux projets

-- 1. Nombre total d'utilisateurs par statut
SELECT 
  COUNT(*) as "Total utilisateurs",
  COUNT(*) FILTER (WHERE email NOT LIKE '%@test.com%') as "Utilisateurs non-test",
  COUNT(*) FILTER (WHERE email LIKE '%@test.com%') as "Utilisateurs test"
FROM users;

-- 2. Nombre d'utilisateurs assignes a au moins un projet
SELECT 
  COUNT(DISTINCT "userId") as "Utilisateurs assignes a des projets"
FROM user_projets;

-- 3. Repartition des utilisateurs par role
SELECT 
  role,
  COUNT(*) as nombre,
  COUNT(*) FILTER (WHERE email NOT LIKE '%@test.com%') as "non-test"
FROM users
GROUP BY role
ORDER BY nombre DESC;

-- 4. Utilisateurs NON assignes a des projets
SELECT 
  u.id,
  u.nom,
  u.prenom,
  u.email,
  u.role
FROM users u
LEFT JOIN user_projets up ON u.id = up."userId"
WHERE 
  up."userId" IS NULL
  AND u.email NOT LIKE '%@test.com%'
  AND u.email IS NOT NULL
  AND u.email != ''
ORDER BY u.nom;

-- 5. Nombre d'assignations par utilisateur
SELECT 
  u.nom,
  u.prenom,
  u.email,
  u.role,
  COUNT(up."projetId") as "Nombre de projets"
FROM users u
LEFT JOIN user_projets up ON u.id = up."userId"
WHERE 
  u.email NOT LIKE '%@test.com%'
  AND u.email IS NOT NULL
  AND u.email != ''
GROUP BY u.id, u.nom, u.prenom, u.email, u.role
ORDER BY "Nombre de projets" DESC, u.nom;

-- 6. Projets avec le nombre d'utilisateurs assignes
SELECT 
  p.nom as "Projet",
  COUNT(up."userId") as "Nombre utilisateurs"
FROM projets p
LEFT JOIN user_projets up ON p.id = up."projetId"
WHERE p.actif = true
GROUP BY p.id, p.nom
ORDER BY "Nombre utilisateurs" DESC;

-- 7. Total des assignations
SELECT 
  COUNT(*) as "Total assignations user-projet"
FROM user_projets;

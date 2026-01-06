-- Script de test pour vérifier que le superadmin peut valider une demande
-- Ce script crée un projet de test, des utilisateurs de test, et une demande de test

-- 1. Créer un projet de test
INSERT INTO "Projet" (id, nom, description, localisation, dateDebut, dateFin, actif, "createdAt", "updatedAt")
VALUES (
  'test-projet-superadmin',
  'Projet Test Superadmin',
  'Projet de test pour valider les permissions du superadmin',
  'Site Test',
  NOW(),
  NOW() + INTERVAL '6 months',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  nom = EXCLUDED.nom,
  description = EXCLUDED.description,
  "updatedAt" = NOW();

-- 2. Créer un utilisateur employé de test (demandeur)
INSERT INTO "User" (id, nom, prenom, email, password, role, telephone, actif, "createdAt", "updatedAt")
VALUES (
  'test-employe-001',
  'Test',
  'Employé',
  'test.employe@test.com',
  '$2a$10$YourHashedPasswordHere', -- Mot de passe: test123
  'employe',
  '0600000001',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  nom = EXCLUDED.nom,
  email = EXCLUDED.email,
  "updatedAt" = NOW();

-- 3. Assigner l'employé au projet de test
INSERT INTO "UserProjet" (id, "userId", "projetId", role, "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'test-employe-001',
  'test-projet-superadmin',
  'employe',
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- 4. Créer un article de test
INSERT INTO "Article" (id, nom, reference, description, unite, "createdAt", "updatedAt")
VALUES (
  'test-article-001',
  'Article Test Superadmin',
  'REF-TEST-001',
  'Article de test pour validation superadmin',
  'unité',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  nom = EXCLUDED.nom,
  "updatedAt" = NOW();

-- 5. Créer une demande de test en statut "en_attente_validation_conducteur"
INSERT INTO "Demande" (
  id,
  numero,
  type,
  status,
  "technicienId",
  "projetId",
  "dateCreation",
  "dateModification",
  "dateLivraisonSouhaitee",
  commentaire,
  "createdAt",
  "updatedAt"
)
VALUES (
  'test-demande-superadmin-001',
  'DEM-TEST-SUPERADMIN-001',
  'materiel',
  'en_attente_validation_conducteur',
  'test-employe-001',
  'test-projet-superadmin',
  NOW(),
  NOW(),
  NOW() + INTERVAL '7 days',
  'Demande de test pour validation par superadmin',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  status = 'en_attente_validation_conducteur',
  "dateModification" = NOW(),
  "updatedAt" = NOW();

-- 6. Ajouter un item à la demande
INSERT INTO "ItemDemande" (
  id,
  "demandeId",
  "articleId",
  "quantiteDemandee",
  "quantiteValidee",
  "prixUnitaire",
  "createdAt",
  "updatedAt"
)
VALUES (
  gen_random_uuid(),
  'test-demande-superadmin-001',
  'test-article-001',
  10,
  NULL,
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- 7. Afficher les informations de test
SELECT 
  '=== DONNÉES DE TEST CRÉÉES ===' as info,
  '' as separator;

SELECT 
  'Projet:' as type,
  id,
  nom,
  description
FROM "Projet"
WHERE id = 'test-projet-superadmin';

SELECT 
  'Utilisateur:' as type,
  id,
  nom,
  prenom,
  email,
  role
FROM "User"
WHERE id = 'test-employe-001';

SELECT 
  'Demande:' as type,
  d.id,
  d.numero,
  d.type,
  d.status,
  u.nom || ' ' || u.prenom as demandeur,
  p.nom as projet
FROM "Demande" d
JOIN "User" u ON d."technicienId" = u.id
JOIN "Projet" p ON d."projetId" = p.id
WHERE d.id = 'test-demande-superadmin-001';

SELECT 
  'Items:' as type,
  i.id,
  a.nom as article,
  i."quantiteDemandee"
FROM "ItemDemande" i
JOIN "Article" a ON i."articleId" = a.id
WHERE i."demandeId" = 'test-demande-superadmin-001';

-- 8. Instructions pour le test
SELECT 
  '=== INSTRUCTIONS DE TEST ===' as info,
  '' as separator;

SELECT 
  'ÉTAPE 1: Se connecter en tant que superadmin' as etape,
  'Email: admin@test.com (ou votre compte superadmin)' as details;

SELECT 
  'ÉTAPE 2: Trouver la demande DEM-TEST-SUPERADMIN-001' as etape,
  'Statut actuel: en_attente_validation_conducteur' as details;

SELECT 
  'ÉTAPE 3: Cliquer sur Valider' as etape,
  'Le superadmin devrait pouvoir valider malgré son rôle' as details;

SELECT 
  'ÉTAPE 4: Vérifier le nouveau statut' as etape,
  'Statut attendu: en_attente_validation_responsable_travaux' as details;

SELECT 
  'ÉTAPE 5: Valider à nouveau' as etape,
  'Le superadmin devrait pouvoir continuer à valider' as details;

SELECT 
  'ÉTAPE 6: Vérifier la progression' as etape,
  'La demande devrait progresser dans le workflow' as details;

-- Script SQL pour créer manuellement les utilisateurs de test
-- Exécutez ces requêtes dans votre base de données de production

-- Utilisateur Admin Test
INSERT INTO "User" (id, nom, prenom, email, password, role, "createdAt", "updatedAt") 
VALUES (
  'admin-test-001',
  'Admin',
  'Test', 
  'admin@test.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/Enm', -- admin123
  'superadmin',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Utilisateur Employé Test  
INSERT INTO "User" (id, nom, prenom, email, password, role, "createdAt", "updatedAt")
VALUES (
  'employe-test-001',
  'Employé',
  'Test',
  'employe@test.com', 
  '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- employe123
  'employe',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Utilisateur Conducteur Test
INSERT INTO "User" (id, nom, prenom, email, password, role, "createdAt", "updatedAt")
VALUES (
  'conducteur-test-001',
  'Conducteur', 
  'Test',
  'conducteur@test.com',
  '$2a$12$8B7/Z1XkqhRGauCUEk6wLOmK5dX8/Og5s1khMhUPA0WJzcLiobS4W', -- conducteur123
  'conducteur_travaux',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Projet de test
INSERT INTO "Projet" (id, nom, description, "dateDebut", "dateFin", "createdBy", actif, "createdAt")
VALUES (
  'projet-test-001',
  'Projet Test',
  'Projet pour les tests',
  '2024-01-01',
  '2024-12-31', 
  'admin-test-001',
  true,
  NOW()
) ON CONFLICT (id) DO NOTHING;

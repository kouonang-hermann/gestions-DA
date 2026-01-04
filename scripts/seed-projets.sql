-- Script SQL pour créer les 29 projets Instrumelec dans Supabase
-- À exécuter dans l'éditeur SQL de Supabase
-- Note: Vous devez d'abord récupérer l'ID d'un utilisateur superadmin pour le champ createdBy

-- Récupérer l'ID du premier superadmin
DO $$
DECLARE
  admin_id TEXT;
BEGIN
  SELECT id INTO admin_id FROM users WHERE role = 'superadmin' LIMIT 1;
  
  -- Insertion des projets avec l'ID du superadmin
  INSERT INTO projets (id, nom, description, "dateDebut", "dateFin", actif, "createdBy", "createdAt", "updatedAt")
  VALUES
    (gen_random_uuid(), 'CONSO', 'Frais généraux Instrumelec - Siège Instrumelec', '2026-01-01', '2030-12-21', true, admin_id, NOW(), NOW()),
    (gen_random_uuid(), 'MINTP – SINOHYDRO', 'Électricité courant fort immeuble devant abriter les services centraux du Ministère des Travaux Publics - Yaoundé, Cameroun', '2026-01-01', '2030-12-21', true, admin_id, NOW(), NOW()),
    (gen_random_uuid(), 'CCA – BONANJO', 'Travaux de courant fort SCI-AFG - Bonanjo, Douala', '2026-01-01', '2030-12-21', true, admin_id, NOW(), NOW()),
    (gen_random_uuid(), 'IMMEUBLE SIEGE CARTE ROSE', 'Construction de l''immeuble siège BNCR CEMAC - Cameroun', '2026-01-01', '2030-12-21', true, admin_id, NOW(), NOW()),
    (gen_random_uuid(), 'SANDAGA', 'Construction d''un immeuble R+14 - Cameroun', '2026-01-01', '2030-12-21', true, admin_id, NOW(), NOW()),
    (gen_random_uuid(), 'TOTAL – RETROFIT ABONGMBANG', 'Retrofit des installations solaires d''Abongmbang - Abongmbang, Cameroun', '2026-01-01', '2030-12-21', true, admin_id, NOW(), NOW()),
    (gen_random_uuid(), 'TOTAL B2B FRONIUS', 'Fourniture de matériel B2B – équipements Fronius - Cameroun', '2026-01-01', '2030-12-21', true, admin_id, NOW(), NOW()),
    (gen_random_uuid(), 'TOTAL COFFRET ATEX', 'Fourniture et pose de coffrets ATEX pour kits d''additivation - Cameroun', '2026-01-01', '2030-12-21', true, admin_id, NOW(), NOW()),
    (gen_random_uuid(), 'TOTAL SOLARISATION 2022', 'Travaux de solarisation – campagne 2022 - Cameroun', '2026-01-01', '2030-12-21', true, admin_id, NOW(), NOW()),
    (gen_random_uuid(), 'CURIO', 'Projet CURIO - Cameroun', '2026-01-01', '2030-12-21', true, admin_id, NOW(), NOW()),
    (gen_random_uuid(), 'TOTAL SOLARISATION NYOM', 'Solarisation de la station-service TOTAL NYOM - Nyom, Cameroun', '2026-01-01', '2030-12-21', true, admin_id, NOW(), NOW()),
    (gen_random_uuid(), 'TRADEX MISE EN CONFORMITÉ SSI', 'Mise en conformité du système de sécurité incendie TRADEX - Cameroun', '2026-01-01', '2030-12-21', true, admin_id, NOW(), NOW()),
    (gen_random_uuid(), 'BONAMOUSSADI MALL', 'Travaux électriques courant fort – Bonamoussadi Mall - Douala, Cameroun', '2026-01-01', '2030-12-21', true, admin_id, NOW(), NOW()),
    (gen_random_uuid(), 'CONGELCAM CAFETERIAT', 'Aménagement de la cafétéria Congelcam - Cameroun', '2026-01-01', '2030-12-21', true, admin_id, NOW(), NOW()),
    (gen_random_uuid(), 'BENEFICIAL FOURNITURE 2 GE', 'Fourniture, livraison et installation de deux groupes électrogènes - Cameroun', '2026-01-01', '2030-12-21', true, admin_id, NOW(), NOW()),
    (gen_random_uuid(), 'TGBT BEAC', 'Remplacement des tableaux généraux basse tension (TGBT) de l''immeuble siège - Cameroun', '2026-01-01', '2030-12-21', true, admin_id, NOW(), NOW()),
    (gen_random_uuid(), 'CAMILLA', 'Projet Camilla - Cameroun', '2026-01-01', '2030-12-21', true, admin_id, NOW(), NOW()),
    (gen_random_uuid(), 'TOTAL FOURNITURE MAT DEPOT BONABERIE', 'Fourniture et installation des mâts au dépôt TOTAL de Bonabérie - Bonabérie, Douala', '2026-01-01', '2030-12-21', true, admin_id, NOW(), NOW()),
    (gen_random_uuid(), 'NEO INDUSTRY MAGASIN PDR', 'Construction et aménagement du magasin de pièces de rechange - Kekem, Cameroun', '2026-01-01', '2030-12-21', true, admin_id, NOW(), NOW()),
    (gen_random_uuid(), 'NEO INDUSTRY MAGASIN FEVES', 'Construction et aménagement du magasin de fèves - Kekem, Cameroun', '2026-01-01', '2030-12-21', true, admin_id, NOW(), NOW()),
    (gen_random_uuid(), 'CONGELCAM RDC & LEVEL 1', 'Travaux d''électricité au RDC et au Level 1 du siège Congelcam - Cameroun', '2026-01-01', '2030-12-21', true, admin_id, NOW(), NOW()),
    (gen_random_uuid(), 'NEO INDUSTRY EXTENSION', 'Projet d''extension de l''usine NEO Industry - Kekem, Cameroun', '2026-01-01', '2030-12-21', true, admin_id, NOW(), NOW()),
    (gen_random_uuid(), 'TOTAL CORRECTION MONITORING CENTRE', 'Correction des problèmes de monitoring – Région Centre - Région Centre, Cameroun', '2026-01-01', '2030-12-21', true, admin_id, NOW(), NOW()),
    (gen_random_uuid(), 'TOTAL CORRECTION MONITORING LITTORAL & SUD-OUEST', 'Correction des problèmes de monitoring – Régions Littoral et Sud-Ouest - Littoral & Sud-Ouest, Cameroun', '2026-01-01', '2030-12-21', true, admin_id, NOW(), NOW()),
    (gen_random_uuid(), 'TOTAL TAWAAL SANGMELIMA', 'Reprise du projet TAWAAL Sangmélima – lot électricité - Sangmélima, Cameroun', '2026-01-01', '2030-12-21', true, admin_id, NOW(), NOW()),
    (gen_random_uuid(), 'ORANGE SOLARISATION EDEA & KRIBI', 'Solarisation des sites ORANGE à Edéa et Kribi - Edéa & Kribi, Cameroun', '2026-01-01', '2030-12-21', true, admin_id, NOW(), NOW()),
    (gen_random_uuid(), 'HOTEL KRYSTAL YAOUNDE', 'Travaux d''électricité courant fort et courant faible – Hôtel Krystal - Yaoundé, Cameroun', '2026-01-01', '2030-12-21', true, admin_id, NOW(), NOW()),
    (gen_random_uuid(), 'NEO INDUSTRY REMPLACEMENT BATTERIES DE COMPENSATION', 'Remplacement des batteries de compensation automatiques - Cameroun', '2026-01-01', '2030-12-21', true, admin_id, NOW(), NOW()),
    (gen_random_uuid(), 'CONGELCAM MAGASIN AKWA', 'Travaux de canalisations secondaires et principales – magasin Congelcam Akwa - Akwa, Douala', '2026-01-01', '2030-12-21', true, admin_id, NOW(), NOW());
END $$;

-- Afficher le nombre de projets créés
SELECT COUNT(*) as "Nombre de projets créés" FROM projets;

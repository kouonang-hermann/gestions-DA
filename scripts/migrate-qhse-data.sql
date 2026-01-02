-- Migration des données QHSE vers Logistique
-- Ce script doit être exécuté AVANT de faire prisma db push

-- 1. Migrer les rôles utilisateurs de 'responsable_qhse' vers 'responsable_logistique'
UPDATE users 
SET role = 'responsable_logistique' 
WHERE role = 'responsable_qhse';

-- 2. Migrer les statuts de demandes de 'en_attente_validation_qhse' vers 'en_attente_validation_logistique'
UPDATE demandes 
SET status = 'en_attente_validation_logistique' 
WHERE status = 'en_attente_validation_qhse';

-- 3. Migrer les entrées d'historique avec ancien statut
UPDATE history_entries 
SET "ancienStatus" = 'en_attente_validation_logistique' 
WHERE "ancienStatus" = 'en_attente_validation_qhse';

UPDATE history_entries 
SET "nouveauStatus" = 'en_attente_validation_logistique' 
WHERE "nouveauStatus" = 'en_attente_validation_qhse';

-- Afficher les résultats de la migration
SELECT 'Migration terminée!' as message;
SELECT COUNT(*) as "Utilisateurs migrés" FROM users WHERE role = 'responsable_logistique';
SELECT COUNT(*) as "Demandes migrées" FROM demandes WHERE status = 'en_attente_validation_logistique';

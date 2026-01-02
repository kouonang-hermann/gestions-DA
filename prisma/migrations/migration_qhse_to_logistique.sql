-- ============================================================================
-- SCRIPT DE MIGRATION : QHSE → LOGISTIQUE et LOGISTIQUE → LIVREUR
-- ============================================================================
-- Date: 2025-01-27
-- Description: Migration complète des rôles et statuts dans la base de données
-- 
-- CHANGEMENTS:
-- 1. Rôle "responsable_qhse" → "responsable_logistique"
-- 2. Rôle "responsable_logistique" → "responsable_livreur"
-- 3. Statut "en_attente_validation_qhse" → "en_attente_validation_logistique"
-- 4. Statut "en_attente_validation_logistique" → "en_attente_validation_livreur"
-- 5. Champ "validationQHSE" → "validationLogistique"
-- 6. Champ "validationLogistique" → "validationLivreur"
-- ============================================================================

-- ÉTAPE 1: Sauvegarder les données actuelles (optionnel mais recommandé)
-- Créer des tables de backup avant la migration
CREATE TABLE IF NOT EXISTS "User_backup" AS SELECT * FROM "User";
CREATE TABLE IF NOT EXISTS "Demande_backup" AS SELECT * FROM "Demande";
CREATE TABLE IF NOT EXISTS "HistoryEntry_backup" AS SELECT * FROM "HistoryEntry";

-- ============================================================================
-- ÉTAPE 2: MIGRATION DES RÔLES UTILISATEURS
-- ============================================================================

-- Mettre à jour les rôles dans la table User
UPDATE "User" 
SET role = 'responsable_logistique' 
WHERE role = 'responsable_qhse';

UPDATE "User" 
SET role = 'responsable_livreur' 
WHERE role = 'responsable_logistique';

-- Vérification: Afficher le nombre d'utilisateurs migrés
SELECT 
  'Utilisateurs migrés vers responsable_logistique' as action,
  COUNT(*) as count 
FROM "User" 
WHERE role = 'responsable_logistique';

SELECT 
  'Utilisateurs migrés vers responsable_livreur' as action,
  COUNT(*) as count 
FROM "User" 
WHERE role = 'responsable_livreur';

-- ============================================================================
-- ÉTAPE 3: MIGRATION DES STATUTS DE DEMANDES
-- ============================================================================

-- Mettre à jour les statuts dans la table Demande
UPDATE "Demande" 
SET status = 'en_attente_validation_logistique' 
WHERE status = 'en_attente_validation_qhse';

UPDATE "Demande" 
SET status = 'en_attente_validation_livreur' 
WHERE status = 'en_attente_validation_logistique';

-- Vérification: Afficher le nombre de demandes migrées
SELECT 
  'Demandes migrées vers en_attente_validation_logistique' as action,
  COUNT(*) as count 
FROM "Demande" 
WHERE status = 'en_attente_validation_logistique';

SELECT 
  'Demandes migrées vers en_attente_validation_livreur' as action,
  COUNT(*) as count 
FROM "Demande" 
WHERE status = 'en_attente_validation_livreur';

-- ============================================================================
-- ÉTAPE 4: MIGRATION DES CHAMPS DE VALIDATION (JSONB)
-- ============================================================================

-- Renommer le champ validationQHSE en validationLogistique
UPDATE "Demande" 
SET "validationLogistique" = "validationQHSE",
    "validationQHSE" = NULL
WHERE "validationQHSE" IS NOT NULL;

-- Renommer le champ validationLogistique en validationLivreur
-- Note: Cette opération doit se faire après avoir sauvegardé validationQHSE
UPDATE "Demande" 
SET "validationLivreur" = "validationLogistique",
    "validationLogistique" = NULL
WHERE "validationLogistique" IS NOT NULL 
  AND "validationQHSE" IS NULL; -- S'assurer qu'on ne touche pas aux anciennes validations QHSE

-- ============================================================================
-- ÉTAPE 5: MIGRATION DE L'HISTORIQUE
-- ============================================================================

-- Mettre à jour les statuts dans l'historique (ancienStatus)
UPDATE "HistoryEntry" 
SET "ancienStatus" = 'en_attente_validation_logistique' 
WHERE "ancienStatus" = 'en_attente_validation_qhse';

UPDATE "HistoryEntry" 
SET "ancienStatus" = 'en_attente_validation_livreur' 
WHERE "ancienStatus" = 'en_attente_validation_logistique';

-- Mettre à jour les statuts dans l'historique (nouveauStatus)
UPDATE "HistoryEntry" 
SET "nouveauStatus" = 'en_attente_validation_logistique' 
WHERE "nouveauStatus" = 'en_attente_validation_qhse';

UPDATE "HistoryEntry" 
SET "nouveauStatus" = 'en_attente_validation_livreur' 
WHERE "nouveauStatus" = 'en_attente_validation_logistique';

-- Mettre à jour les actions dans l'historique
UPDATE "HistoryEntry" 
SET action = REPLACE(action, 'QHSE', 'Logistique')
WHERE action LIKE '%QHSE%';

UPDATE "HistoryEntry" 
SET action = REPLACE(action, 'responsable_logistique', 'responsable_livreur')
WHERE action LIKE '%responsable_logistique%';

-- ============================================================================
-- ÉTAPE 6: VÉRIFICATIONS FINALES
-- ============================================================================

-- Vérifier qu'il ne reste plus d'anciennes valeurs
SELECT 
  'Utilisateurs avec ancien rôle responsable_qhse' as verification,
  COUNT(*) as count 
FROM "User" 
WHERE role = 'responsable_qhse';

SELECT 
  'Demandes avec ancien statut en_attente_validation_qhse' as verification,
  COUNT(*) as count 
FROM "Demande" 
WHERE status = 'en_attente_validation_qhse';

SELECT 
  'Demandes avec ancien champ validationQHSE' as verification,
  COUNT(*) as count 
FROM "Demande" 
WHERE "validationQHSE" IS NOT NULL;

-- Afficher un résumé de la migration
SELECT 
  'RÉSUMÉ DE LA MIGRATION' as titre,
  (SELECT COUNT(*) FROM "User" WHERE role = 'responsable_logistique') as users_logistique,
  (SELECT COUNT(*) FROM "User" WHERE role = 'responsable_livreur') as users_livreur,
  (SELECT COUNT(*) FROM "Demande" WHERE status = 'en_attente_validation_logistique') as demandes_validation_logistique,
  (SELECT COUNT(*) FROM "Demande" WHERE status = 'en_attente_validation_livreur') as demandes_validation_livreur,
  (SELECT COUNT(*) FROM "Demande" WHERE "validationLogistique" IS NOT NULL) as demandes_avec_validation_logistique,
  (SELECT COUNT(*) FROM "Demande" WHERE "validationLivreur" IS NOT NULL) as demandes_avec_validation_livreur;

-- ============================================================================
-- ÉTAPE 7: NETTOYAGE (OPTIONNEL)
-- ============================================================================

-- Une fois la migration validée, vous pouvez supprimer les tables de backup
-- ATTENTION: Ne pas exécuter cette étape avant d'avoir vérifié que tout fonctionne !
-- DROP TABLE IF EXISTS "User_backup";
-- DROP TABLE IF EXISTS "Demande_backup";
-- DROP TABLE IF EXISTS "HistoryEntry_backup";

-- ============================================================================
-- FIN DU SCRIPT DE MIGRATION
-- ============================================================================

-- INSTRUCTIONS D'EXÉCUTION:
-- 1. Faire un backup complet de la base de données avant d'exécuter ce script
-- 2. Exécuter ce script dans un environnement de test d'abord
-- 3. Vérifier les résultats avec les requêtes de vérification
-- 4. Une fois validé, exécuter en production
-- 5. Tester l'application complètement après la migration
-- 6. Supprimer les tables de backup après validation complète

-- COMMANDE D'EXÉCUTION (Supabase/PostgreSQL):
-- psql -h [HOST] -U [USER] -d [DATABASE] -f migration_qhse_to_logistique.sql

-- ROLLBACK EN CAS DE PROBLÈME:
-- Si la migration échoue, restaurer depuis les tables de backup:
-- DELETE FROM "User";
-- INSERT INTO "User" SELECT * FROM "User_backup";
-- DELETE FROM "Demande";
-- INSERT INTO "Demande" SELECT * FROM "Demande_backup";
-- DELETE FROM "HistoryEntry";
-- INSERT INTO "HistoryEntry" SELECT * FROM "HistoryEntry_backup";

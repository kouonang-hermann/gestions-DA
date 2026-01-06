-- Script pour nettoyer les données de test après les tests

-- Supprimer les items de demande de test
DELETE FROM "ItemDemande"
WHERE "demandeId" = 'test-demande-superadmin-001';

-- Supprimer les entrées d'historique de test
DELETE FROM "HistoryEntry"
WHERE "demandeId" = 'test-demande-superadmin-001';

-- Supprimer les notifications de test
DELETE FROM "Notification"
WHERE "demandeId" = 'test-demande-superadmin-001';

-- Supprimer les signatures de validation de test
DELETE FROM "ValidationSignature"
WHERE "demandeId" = 'test-demande-superadmin-001';

-- Supprimer la demande de test
DELETE FROM "Demande"
WHERE id = 'test-demande-superadmin-001';

-- Supprimer l'article de test
DELETE FROM "Article"
WHERE id = 'test-article-001';

-- Supprimer l'assignation utilisateur-projet de test
DELETE FROM "UserProjet"
WHERE "userId" = 'test-employe-001' AND "projetId" = 'test-projet-superadmin';

-- Supprimer l'utilisateur de test
DELETE FROM "User"
WHERE id = 'test-employe-001';

-- Supprimer le projet de test
DELETE FROM "Projet"
WHERE id = 'test-projet-superadmin';

-- Afficher le résultat
SELECT '=== DONNÉES DE TEST SUPPRIMÉES ===' as info;

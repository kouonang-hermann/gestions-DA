-- Script pour vérifier les résultats du test de validation superadmin

-- 1. Vérifier l'état actuel de la demande de test
SELECT 
  '=== ÉTAT DE LA DEMANDE DE TEST ===' as info,
  '' as separator;

SELECT 
  d.numero as "Numéro",
  d.type as "Type",
  d.status as "Statut Actuel",
  u.nom || ' ' || u.prenom as "Demandeur",
  p.nom as "Projet",
  d."dateCreation" as "Date Création",
  d."dateModification" as "Dernière Modification"
FROM "Demande" d
JOIN "User" u ON d."technicienId" = u.id
JOIN "Projet" p ON d."projetId" = p.id
WHERE d.id = 'test-demande-superadmin-001';

-- 2. Vérifier l'historique des actions sur la demande
SELECT 
  '=== HISTORIQUE DES ACTIONS ===' as info,
  '' as separator;

SELECT 
  h.action as "Action",
  u.nom || ' ' || u.prenom as "Utilisateur",
  u.role as "Rôle",
  h."ancienStatus" as "Ancien Statut",
  h."nouveauStatus" as "Nouveau Statut",
  h.commentaire as "Commentaire",
  h."createdAt" as "Date"
FROM "HistoryEntry" h
JOIN "User" u ON h."userId" = u.id
WHERE h."demandeId" = 'test-demande-superadmin-001'
ORDER BY h."createdAt" ASC;

-- 3. Vérifier les signatures de validation
SELECT 
  '=== SIGNATURES DE VALIDATION ===' as info,
  '' as separator;

SELECT 
  v.type as "Type Validation",
  u.nom || ' ' || u.prenom as "Valideur",
  u.role as "Rôle",
  v.commentaire as "Commentaire",
  v.date as "Date"
FROM "ValidationSignature" v
JOIN "User" u ON v."userId" = u.id
WHERE v."demandeId" = 'test-demande-superadmin-001'
ORDER BY v.date ASC;

-- 4. Vérifier les notifications créées
SELECT 
  '=== NOTIFICATIONS CRÉÉES ===' as info,
  '' as separator;

SELECT 
  n.titre as "Titre",
  n.message as "Message",
  u.nom || ' ' || u.prenom as "Destinataire",
  n.lu as "Lu",
  n."createdAt" as "Date"
FROM "Notification" n
JOIN "User" u ON n."userId" = u.id
WHERE n."demandeId" = 'test-demande-superadmin-001'
ORDER BY n."createdAt" ASC;

-- 5. Résumé du test
SELECT 
  '=== RÉSUMÉ DU TEST ===' as info,
  '' as separator;

SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Demande de test trouvée'
    ELSE '❌ Demande de test non trouvée'
  END as "Statut Demande"
FROM "Demande"
WHERE id = 'test-demande-superadmin-001';

SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Actions enregistrées dans l''historique'
    ELSE '❌ Aucune action dans l''historique'
  END as "Statut Historique",
  COUNT(*) as "Nombre d'actions"
FROM "HistoryEntry"
WHERE "demandeId" = 'test-demande-superadmin-001';

SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ Signatures de validation créées'
    ELSE '❌ Aucune signature de validation'
  END as "Statut Signatures",
  COUNT(*) as "Nombre de signatures"
FROM "ValidationSignature"
WHERE "demandeId" = 'test-demande-superadmin-001';

-- 6. Vérifier si le superadmin a pu valider
SELECT 
  '=== VÉRIFICATION SUPERADMIN ===' as info,
  '' as separator;

SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM "HistoryEntry" h
      JOIN "User" u ON h."userId" = u.id
      WHERE h."demandeId" = 'test-demande-superadmin-001'
      AND u.role = 'superadmin'
      AND h.action LIKE '%Validé%'
    ) THEN '✅ Le superadmin a pu valider la demande'
    ELSE '❌ Le superadmin n''a pas validé la demande'
  END as "Résultat Test Superadmin";

-- 7. Vérifier la progression du statut
SELECT 
  '=== PROGRESSION DU STATUT ===' as info,
  '' as separator;

WITH status_progression AS (
  SELECT 
    "ancienStatus",
    "nouveauStatus",
    "createdAt"
  FROM "HistoryEntry"
  WHERE "demandeId" = 'test-demande-superadmin-001'
  ORDER BY "createdAt" ASC
)
SELECT 
  ROW_NUMBER() OVER (ORDER BY "createdAt") as "Étape",
  "ancienStatus" as "De",
  "nouveauStatus" as "Vers",
  "createdAt" as "Date"
FROM status_progression;

-- Script pour nettoyer les projets en double et les projets test
-- ATTENTION : Ce script va supprimer des projets et leurs demandes associees
-- Verifiez bien avant d'executer

-- Etape 1 : Activer le comportement CASCADE DELETE sur toutes les contraintes
-- (A executer d'abord si la migration Prisma n'a pas ete appliquee)

-- CASCADE DELETE pour demandes -> projets
   
-- Etape 6 : Verification finale
SELECT 
  COUNT(*) as "Total projets",
  COUNT(*) FILTER (WHERE nom ILIKE '%test%') as "Projets test restants",
  COUNT(DISTINCT nom) as "Noms uniques"
FROM projets;

-- ============================================================================
-- SCRIPT DE CORRECTION: Demandes d'outillage avec statut en_attente_preparation_appro
-- ============================================================================
-- 
-- PROBLÈME: 38 demandes d'outillage ont le statut "en_attente_preparation_appro"
--           qui est normalement réservé aux demandes MATÉRIEL
--
-- CAUSE: Bug dans l'ancien code de validation du chargé d'affaire qui ne 
--        différenciait pas correctement matériel vs outillage
--
-- SOLUTION: Corriger le statut vers "en_attente_preparation_logistique"
--           qui est le statut correct pour les demandes d'outillage
--
-- Date: 26 février 2026
-- ============================================================================

-- ÉTAPE 1: VÉRIFICATION AVANT CORRECTION
-- ============================================================================
SELECT 
    '=== VÉRIFICATION AVANT CORRECTION ===' as etape,
    COUNT(*) as total_demandes_a_corriger
FROM demandes
WHERE type = 'outillage'
  AND status = 'en_attente_preparation_appro';

-- Détails des demandes à corriger
SELECT 
    d.numero,
    d.type,
    d.status as statut_actuel,
    d."dateCreation" as date_creation,
    p.nom as projet,
    t.nom || ' ' || t.prenom as demandeur
FROM demandes d
LEFT JOIN projets p ON d."projetId" = p.id
LEFT JOIN users t ON d."technicienId" = t.id
WHERE d.type = 'outillage'
  AND d.status = 'en_attente_preparation_appro'
ORDER BY d."dateCreation" DESC;

-- ÉTAPE 2: CORRECTION DES STATUTS
-- ============================================================================
-- Corriger les demandes d'outillage bloquées à l'étape Appro
UPDATE demandes
SET 
    status = 'en_attente_preparation_logistique',
    "dateModification" = NOW()
WHERE type = 'outillage'
  AND status = 'en_attente_preparation_appro';

-- ÉTAPE 3: AJOUT D'ENTRÉES DANS L'HISTORIQUE
-- ============================================================================
-- Ajouter une entrée dans l'historique pour tracer cette correction
INSERT INTO history_entries (
    id,
    "demandeId",
    "userId",
    action,
    "ancienStatus",
    "nouveauStatus",
    timestamp,
    details
)
SELECT 
    gen_random_uuid(),
    d.id,
    d."technicienId", -- Utiliser le demandeur comme userId
    'Correction automatique du statut',
    'en_attente_preparation_appro',
    'en_attente_preparation_logistique',
    NOW(),
    'Correction automatique: demande d''outillage avec statut matériel corrigé vers le statut outillage approprié (en_attente_preparation_logistique)'
FROM demandes d
WHERE d.type = 'outillage'
  AND d.status = 'en_attente_preparation_logistique'
  AND d."dateModification" >= NOW() - INTERVAL '1 minute'; -- Seulement celles qui viennent d'être modifiées

-- ÉTAPE 4: VÉRIFICATION APRÈS CORRECTION
-- ============================================================================
SELECT 
    '=== VÉRIFICATION APRÈS CORRECTION ===' as etape,
    COUNT(*) as demandes_corrigees
FROM demandes
WHERE type = 'outillage'
  AND status = 'en_attente_preparation_logistique'
  AND "dateModification" >= NOW() - INTERVAL '1 minute';

-- Vérifier qu'il ne reste plus de demandes d'outillage avec statut appro
SELECT 
    '=== VÉRIFICATION: Plus de demandes outillage avec statut appro ===' as etape,
    COUNT(*) as demandes_restantes
FROM demandes
WHERE type = 'outillage'
  AND status = 'en_attente_preparation_appro';

-- ÉTAPE 5: STATISTIQUES FINALES
-- ============================================================================
SELECT 
    '=== STATISTIQUES FINALES ===' as etape,
    type,
    status,
    COUNT(*) as nombre_demandes
FROM demandes
WHERE type = 'outillage'
  AND status IN ('en_attente_preparation_appro', 'en_attente_preparation_logistique')
GROUP BY type, status
ORDER BY type, status;

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================

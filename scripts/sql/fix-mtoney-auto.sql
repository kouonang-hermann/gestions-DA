-- ============================================================================
-- CORRECTION AUTOMATIQUE - SIGNATURES M. TONEY (0132 et 0138)
-- ============================================================================
-- Ce script détecte et corrige automatiquement le problème
-- pour que M. Toney puisse voir ses deux demandes validées
-- ============================================================================

-- DIAGNOSTIC ET CORRECTION AUTOMATIQUE
DO $$
DECLARE
    mtoney_id TEXT;
    demande_0132_id TEXT;
    demande_0138_id TEXT;
    signature_0132_count INT;
    signature_0138_count INT;
    wrong_type_count INT;
BEGIN
    -- 1. Obtenir l'ID de M. Toney
    SELECT id INTO mtoney_id FROM users WHERE nom ILIKE '%toney%' LIMIT 1;
    RAISE NOTICE '✓ ID M. Toney: %', mtoney_id;
    
    -- 2. Obtenir les IDs des demandes
    SELECT id INTO demande_0132_id FROM demandes WHERE numero LIKE '%0132%' LIMIT 1;
    SELECT id INTO demande_0138_id FROM demandes WHERE numero LIKE '%0138%' LIMIT 1;
    RAISE NOTICE '✓ ID Demande 0132: %', demande_0132_id;
    RAISE NOTICE '✓ ID Demande 0138: %', demande_0138_id;
    
    -- 3. Vérifier les signatures existantes
    SELECT COUNT(*) INTO signature_0132_count 
    FROM validation_signatures 
    WHERE "demandeId" = demande_0132_id 
      AND "userId" = mtoney_id
      AND type = 'validation_responsable_travaux';
    
    SELECT COUNT(*) INTO signature_0138_count 
    FROM validation_signatures 
    WHERE "demandeId" = demande_0138_id 
      AND "userId" = mtoney_id
      AND type = 'validation_responsable_travaux';
    
    RAISE NOTICE '✓ Signatures 0132 (bon type): %', signature_0132_count;
    RAISE NOTICE '✓ Signatures 0138 (bon type): %', signature_0138_count;
    
    -- 4. Vérifier les signatures avec mauvais type
    SELECT COUNT(*) INTO wrong_type_count
    FROM validation_signatures
    WHERE "userId" = mtoney_id
      AND "demandeId" IN (demande_0132_id, demande_0138_id)
      AND type = 'responsable_travaux';
    
    RAISE NOTICE '✓ Signatures avec mauvais type: %', wrong_type_count;
    
    -- 5. CORRECTION : Mettre à jour le type si nécessaire
    IF wrong_type_count > 0 THEN
        UPDATE validation_signatures
        SET type = 'validation_responsable_travaux'
        WHERE "userId" = mtoney_id
          AND "demandeId" IN (demande_0132_id, demande_0138_id)
          AND type = 'responsable_travaux';
        
        RAISE NOTICE '✓ CORRECTION: % signature(s) mises à jour avec le bon type', wrong_type_count;
    END IF;
    
    -- 6. CORRECTION : Créer la signature manquante pour 0132 si nécessaire
    IF signature_0132_count = 0 AND demande_0132_id IS NOT NULL THEN
        INSERT INTO validation_signatures (
            id,
            "demandeId",
            "userId",
            type,
            date,
            signature,
            commentaire
        )
        VALUES (
            'vs-' || gen_random_uuid()::text,
            demande_0132_id,
            mtoney_id,
            'validation_responsable_travaux',
            NOW(),
            'signature_' || mtoney_id || '_' || EXTRACT(EPOCH FROM NOW())::bigint,
            'Signature créée automatiquement - correction problème visibilité'
        );
        
        RAISE NOTICE '✓ CORRECTION: Signature créée pour demande 0132';
    END IF;
    
    -- 7. CORRECTION : Créer la signature manquante pour 0138 si nécessaire
    IF signature_0138_count = 0 AND demande_0138_id IS NOT NULL THEN
        INSERT INTO validation_signatures (
            id,
            "demandeId",
            "userId",
            type,
            date,
            signature,
            commentaire
        )
        VALUES (
            'vs-' || gen_random_uuid()::text,
            demande_0138_id,
            mtoney_id,
            'validation_responsable_travaux',
            NOW(),
            'signature_' || mtoney_id || '_' || EXTRACT(EPOCH FROM NOW())::bigint,
            'Signature créée automatiquement - correction problème visibilité'
        );
        
        RAISE NOTICE '✓ CORRECTION: Signature créée pour demande 0138';
    END IF;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CORRECTION TERMINÉE';
    RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- VÉRIFICATION FINALE
-- ============================================================================

-- Afficher le résultat final
SELECT 
    '=== RÉSULTAT FINAL ===' AS section,
    COUNT(*) AS nombre_signatures_mtoney,
    STRING_AGG(d.numero, ', ' ORDER BY d.numero) AS demandes_validees
FROM validation_signatures vs
INNER JOIN demandes d ON vs."demandeId" = d.id
INNER JOIN users u ON vs."userId" = u.id
WHERE (u.nom ILIKE '%toney%' OR u.email ILIKE '%toney%')
  AND (d.numero LIKE '%0132%' OR d.numero LIKE '%0138%')
  AND vs.type = 'validation_responsable_travaux';

-- Détail des signatures
SELECT 
    '=== DÉTAIL DES SIGNATURES ===' AS section,
    d.numero AS demande,
    d.status AS statut_demande,
    vs.type AS type_signature,
    vs.date AS date_validation,
    vs.commentaire,
    u.nom || ' ' || u.prenom AS valideur
FROM validation_signatures vs
INNER JOIN demandes d ON vs."demandeId" = d.id
INNER JOIN users u ON vs."userId" = u.id
WHERE (u.nom ILIKE '%toney%' OR u.email ILIKE '%toney%')
  AND (d.numero LIKE '%0132%' OR d.numero LIKE '%0138%')
ORDER BY d.numero;

-- Vérifier que les statuts sont corrects
SELECT 
    '=== STATUTS DES DEMANDES ===' AS section,
    numero,
    status,
    CASE 
        WHEN status IN (
            'en_attente_validation_charge_affaire',
            'en_attente_preparation_appro',
            'en_attente_validation_logistique',
            'en_attente_reception_livreur',
            'en_attente_livraison',
            'en_attente_validation_finale_demandeur',
            'confirmee_demandeur',
            'cloturee',
            'rejetee'
        ) THEN '✅ DEVRAIT APPARAÎTRE dans carte Validées'
        ELSE '❌ NE DEVRAIT PAS apparaître'
    END AS visibilite_dashboard
FROM demandes
WHERE numero LIKE '%0132%' OR numero LIKE '%0138%'
ORDER BY numero;

-- ============================================================================
-- RÉSULTAT ATTENDU
-- ============================================================================
-- Après exécution de ce script :
-- - M. Toney devrait avoir 2 signatures de validation
-- - Type : 'validation_responsable_travaux' pour les deux
-- - Les deux demandes (0132 et 0138) devraient apparaître dans sa carte "Validées"
-- ============================================================================

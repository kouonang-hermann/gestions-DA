-- ============================================================
-- SCRIPT 3 : ROLLBACK (ANNULATION) - SI NÉCESSAIRE
-- ============================================================
-- 
-- Ce script permet d'annuler les modifications effectuées
-- par le script 02 si vous constatez un problème
--
-- ATTENTION : 
-- - N'exécutez ce script QUE si vous devez annuler les changements
-- - Ce script restaure les statuts précédents
-- - Les entrées d'historique sont conservées pour traçabilité
--
-- ============================================================

-- ============================================================
-- VÉRIFICATION : Demandes modifiées récemment
-- ============================================================

-- Voir les demandes qui ont été réouvertes dans les dernières heures
SELECT 
    d.numero as "Numéro",
    d."statusPrecedent" as "Statut Avant Réouverture",
    d.status as "Statut Actuel",
    d."dateModification" as "Date Modification",
    EXTRACT(EPOCH FROM (NOW() - d."dateModification")) / 60 as "Minutes Écoulées"
FROM demandes d
WHERE d.status = 'en_attente_preparation_appro'
AND d."statusPrecedent" IS NOT NULL
AND d."statusPrecedent" != 'en_attente_preparation_appro'
AND d."dateModification" >= NOW() - INTERVAL '24 hours'
ORDER BY d."dateModification" DESC;

-- ============================================================
-- ROLLBACK : Restaurer les statuts précédents
-- ============================================================

-- IMPORTANT : Ajustez l'intervalle de temps selon vos besoins
-- Par défaut : dernières 24 heures

UPDATE demandes
SET 
    status = "statusPrecedent",
    "statusPrecedent" = NULL,
    "dateModification" = NOW()
WHERE status = 'en_attente_preparation_appro'
AND "statusPrecedent" IS NOT NULL
AND "statusPrecedent" != 'en_attente_preparation_appro'
AND "dateModification" >= NOW() - INTERVAL '24 hours';

-- ============================================================
-- AJOUT ENTRÉE HISTORIQUE POUR LE ROLLBACK
-- ============================================================

INSERT INTO history_entries (
    id,
    "demandeId",
    "userId",
    action,
    "ancienStatus",
    "nouveauStatus",
    commentaire,
    signature,
    timestamp
)
SELECT 
    'rollback-' || d.id || '-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    d.id,
    (SELECT id FROM users WHERE role = 'superadmin' LIMIT 1),
    'rollback_reouverture',
    'en_attente_preparation_appro',
    d.status,
    'Annulation de la réouverture automatique. Retour au statut précédent.',
    'system-rollback-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    NOW()
FROM demandes d
WHERE d."statusPrecedent" IS NULL
AND d."dateModification" >= NOW() - INTERVAL '1 minute';

-- ============================================================
-- VÉRIFICATION APRÈS ROLLBACK
-- ============================================================

SELECT 
    'ROLLBACK EFFECTUÉ' as action,
    COUNT(*) as demandes_restaurees
FROM demandes d
WHERE d."dateModification" >= NOW() - INTERVAL '2 minutes'
AND d."statusPrecedent" IS NULL;

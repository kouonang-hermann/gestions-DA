-- ============================================================
-- SCRIPT 2 : RÉOUVERTURE DES DEMANDES SANS PRIX
-- ============================================================
-- 
-- Ce script réouvre toutes les demandes qui ont traversé 
-- l'étape appro et dont les QUANTITÉS RESTANTES n'ont pas de prix renseigné
--
-- CRITÈRES STRICTS :
-- 1. Demande avec statut post-appro (a déjà traversé l'étape appro)
-- 2. Article avec QUANTITÉ RESTANTE > 0 
--    (quantiteDemandee - quantiteLivreeTotal > 0)
-- 3. Article sans prix unitaire (prixUnitaire IS NULL OR = 0)
--
-- IMPORTANT : 
-- 1. Exécutez d'abord le script 01 pour identifier les demandes
-- 2. Vérifiez les résultats avant d'exécuter ce script
-- 3. Ce script modifie la base de données
--
-- Action : Change le statut vers 'en_attente_preparation_appro'
-- pour permettre au responsable appro de renseigner les prix manquants
-- et optimiser les tableaux financiers
--
-- ============================================================

-- ============================================================
-- ÉTAPE 1 : VÉRIFICATION AVANT MODIFICATION
-- ============================================================

-- Comptez combien de demandes seront affectées
SELECT 
    'VÉRIFICATION' as action,
    COUNT(DISTINCT d.id) as demandes_a_modifier,
    COUNT(i.id) as articles_qte_restante_sans_prix,
    SUM(i."quantiteDemandee" - COALESCE(i."quantiteLivreeTotal", 0)) as quantite_totale_restante
FROM demandes d
INNER JOIN item_demandes i ON i."demandeId" = d.id
WHERE d.status IN (
    'en_attente_reception_livreur',
    'en_attente_livraison',
    'en_attente_validation_finale_demandeur',
    'confirmee_demandeur',
    'cloturee'
)
AND (
    i."quantiteDemandee" - COALESCE(i."quantiteLivreeTotal", 0) > 0
)
AND (
    i."prixUnitaire" IS NULL 
    OR i."prixUnitaire" = 0
);

-- ============================================================
-- ÉTAPE 2 : MISE À JOUR DES DEMANDES
-- ============================================================

-- Mettre à jour le statut des demandes concernées
UPDATE demandes
SET 
    status = 'en_attente_preparation_appro',
    "statusPrecedent" = status,
    "dateModification" = NOW()
WHERE id IN (
    SELECT DISTINCT d.id
    FROM demandes d
    INNER JOIN item_demandes i ON i."demandeId" = d.id
    WHERE d.status IN (
        'en_attente_reception_livreur',
        'en_attente_livraison',
        'en_attente_validation_finale_demandeur',
        'confirmee_demandeur',
        'cloturee'
    )
    AND (
        i."quantiteDemandee" - COALESCE(i."quantiteLivreeTotal", 0) > 0
    )
    AND (
        i."prixUnitaire" IS NULL 
        OR i."prixUnitaire" = 0
    )
);

-- Note : Seules les demandes avec quantités restantes > 0 ET sans prix sont modifiées

-- ============================================================
-- ÉTAPE 3 : AJOUT DES ENTRÉES D'HISTORIQUE
-- ============================================================

-- Créer une entrée d'historique pour chaque demande modifiée
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
    'reopen-' || d.id || '-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    d.id,
    (SELECT id FROM users WHERE role = 'superadmin' LIMIT 1),
    'reouverture_pour_saisie_prix',
    d."statusPrecedent",
    'en_attente_preparation_appro',
    'Demande réouverte automatiquement pour permettre la saisie des prix. ' || 
    (SELECT COUNT(*) 
     FROM item_demandes 
     WHERE "demandeId" = d.id 
     AND ("quantiteDemandee" - COALESCE("quantiteLivreeTotal", 0) > 0)
     AND ("prixUnitaire" IS NULL OR "prixUnitaire" = 0)) || 
    ' article(s) avec quantité restante sans prix. Quantité totale restante: ' ||
    (SELECT SUM("quantiteDemandee" - COALESCE("quantiteLivreeTotal", 0))
     FROM item_demandes 
     WHERE "demandeId" = d.id 
     AND ("quantiteDemandee" - COALESCE("quantiteLivreeTotal", 0) > 0)
     AND ("prixUnitaire" IS NULL OR "prixUnitaire" = 0)) || '.',
    'system-reopen-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    NOW()
FROM demandes d
WHERE d.status = 'en_attente_preparation_appro'
AND d."statusPrecedent" IS NOT NULL
AND d."statusPrecedent" != 'en_attente_preparation_appro'
AND d."dateModification" >= NOW() - INTERVAL '1 minute';

-- ============================================================
-- ÉTAPE 4 : VÉRIFICATION APRÈS MODIFICATION
-- ============================================================

-- Vérifier les demandes modifiées
SELECT 
    'RÉSULTAT' as action,
    d.numero as "Numéro",
    d."statusPrecedent" as "Ancien Statut",
    d.status as "Nouveau Statut",
    COUNT(i.id) as "Articles Qté Restante Sans Prix",
    SUM(i."quantiteDemandee" - COALESCE(i."quantiteLivreeTotal", 0)) as "Qté Totale Restante",
    d."dateModification" as "Date Modification"
FROM demandes d
INNER JOIN item_demandes i ON i."demandeId" = d.id
WHERE d.status = 'en_attente_preparation_appro'
AND d."statusPrecedent" IS NOT NULL
AND d."statusPrecedent" != 'en_attente_preparation_appro'
AND d."dateModification" >= NOW() - INTERVAL '5 minutes'
AND (
    i."quantiteDemandee" - COALESCE(i."quantiteLivreeTotal", 0) > 0
)
AND (
    i."prixUnitaire" IS NULL 
    OR i."prixUnitaire" = 0
)
GROUP BY d.id, d.numero, d."statusPrecedent", d.status, d."dateModification"
ORDER BY d."dateModification" DESC;

-- ============================================================
-- STATISTIQUES FINALES
-- ============================================================

SELECT 
    'STATISTIQUES FINALES' as titre,
    COUNT(DISTINCT d.id) as demandes_reouvertes,
    COUNT(i.id) as articles_qte_restante_sans_prix,
    SUM(i."quantiteDemandee" - COALESCE(i."quantiteLivreeTotal", 0)) as quantite_totale_restante,
    MIN(d."dateModification") as premiere_modification,
    MAX(d."dateModification") as derniere_modification
FROM demandes d
INNER JOIN item_demandes i ON i."demandeId" = d.id
WHERE d.status = 'en_attente_preparation_appro'
AND d."statusPrecedent" IS NOT NULL
AND d."dateModification" >= NOW() - INTERVAL '5 minutes'
AND (
    i."quantiteDemandee" - COALESCE(i."quantiteLivreeTotal", 0) > 0
)
AND (
    i."prixUnitaire" IS NULL 
    OR i."prixUnitaire" = 0
);

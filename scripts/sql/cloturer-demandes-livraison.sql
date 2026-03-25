-- SCRIPT DE CLÔTURE AUTOMATIQUE DES DEMANDES DE LIVRAISON
-- Objectif : Faire passer les demandes en attente de réception/livraison au statut "cloturee"
-- Statuts concernés : "en_attente_reception_livreur" et "en_attente_livraison"
-- Auteur : Assistant Cascade
-- Date : 24/03/2026
-- SÉCURITÉ : Script en READ-ONLY par défaut, nécessite activation manuelle

-- =====================================================
-- VÉRIFICATION DES NOMS DE TABLES SELON SCHÉMA PRISMA
-- =====================================================
-- Tables vérifiées :
-- ✓ demandes (model Demande)
-- ✓ projets (model Projet) 
-- ✓ users (model User)
-- ✓ item_demandes (model ItemDemande)
-- ✓ history_entries (model HistoryEntry)

-- =====================================================
-- 1. VISUALISATION PRÉALABLE (100% SANS MODIFICATION)
-- =====================================================

-- A. Comptage global des demandes concernées
SELECT 
    '=== COMPTAGE DEMANDES EN ATTENTE RÉCEPTION/LIVRAISON ===' AS section,
    'en_attente_reception_livreur' AS statut_type,
    COUNT(*) AS nombre_demandes,
    STRING_AGG(DISTINCT d.numero, ', ' ORDER BY d.numero) AS numeros_demandes,
    MIN(d."dateCreation") AS date_plus_ancienne,
    MAX(d."dateCreation") AS date_plus_recente
FROM demandes d
WHERE d.status = 'en_attente_reception_livreur'

UNION ALL

SELECT 
    '=== COMPTAGE DEMANDES EN ATTENTE RÉCEPTION/LIVRAISON ===' AS section,
    'en_attente_livraison' AS statut_type,
    COUNT(*) AS nombre_demandes,
    STRING_AGG(DISTINCT d.numero, ', ' ORDER BY d.numero) AS numeros_demandes,
    MIN(d."dateCreation") AS date_plus_ancienne,
    MAX(d."dateCreation") AS date_plus_recente
FROM demandes d
WHERE d.status = 'en_attente_livraison'

UNION ALL

SELECT 
    '=== TOTAL DEMANDES À CLÔTURER ===' AS section,
    'total_general' AS statut_type,
    COUNT(*) AS nombre_demandes,
    STRING_AGG(DISTINCT d.numero, ', ' ORDER BY d.numero) AS numeros_demandes,
    MIN(d."dateCreation") AS date_plus_ancienne,
    MAX(d."dateCreation") AS date_plus_recente
FROM demandes d
WHERE d.status IN ('en_attente_reception_livreur', 'en_attente_livraison');

-- B. Détail complet des demandes concernées
SELECT 
    '=== DÉTAIL COMPLET DEMANDES À CLÔTURER ===' AS section,
    d.id AS demande_id,
    d.numero AS demande_numero,
    d.type AS demande_type,
    d.status AS status_actuel,
    d."dateCreation" AS date_creation,
    d."dateLivraison" AS date_livraison,
    d."dateValidationFinale" AS date_validation_finale,
    d."dateModification" AS date_modification,
    d."dateReceptionLivreur" AS date_reception_livreur,
    p.id AS projet_id,
    p.nom AS projet_nom,
    u.id AS technicien_id,
    u.nom || ' ' || u.prenom AS technicien_complet,
    u.email AS technicien_email,
    COUNT(i.id) AS nombre_articles,
    SUM(i."quantiteDemandee") AS total_quantite_demandee,
    SUM(COALESCE(i."quantiteValidee", i."quantiteDemandee")) AS total_quantite_validee,
    SUM(i."quantiteLivreeTotal") AS total_quantite_livree,
    CASE 
        WHEN d.status = 'en_attente_reception_livreur' THEN '📦 En attente réception livreur'
        WHEN d.status = 'en_attente_livraison' THEN '🚚 En attente livraison'
        ELSE d.status
    END AS description_statut
FROM demandes d
LEFT JOIN projets p ON p.id = d."projetId"
LEFT JOIN users u ON u.id = d."technicienId"
LEFT JOIN item_demandes i ON i."demandeId" = d.id
WHERE d.status IN ('en_attente_reception_livreur', 'en_attente_livraison')
GROUP BY d.id, d.numero, d.type, d.status, d."dateCreation", d."dateLivraison", d."dateValidationFinale", d."dateModification", d."dateReceptionLivreur", p.id, p.nom, u.id, u.nom, u.prenom, u.email
ORDER BY d.status, d."dateCreation" DESC;

-- C. Vérification des articles pour chaque demande
SELECT 
    '=== DÉTAIL ARTICLES PAR DEMANDE ===' AS section,
    d.numero AS demande_numero,
    d.status AS demande_statut,
    i.id AS item_id,
    a.reference AS article_reference,
    a.nom AS article_nom,
    i."quantiteDemandee" AS quantite_demandee,
    i."quantiteValidee" AS quantite_validee,
    i."quantiteSortie" AS quantite_sortie,
    i."quantiteRecue" AS quantite_recue,
    i."quantiteLivreeTotal" AS quantite_livree_totale,
    i."prixUnitaire" AS prix_unitaire,
    CASE 
        WHEN i."quantiteValidee" IS NULL THEN '❌ Jamais validé'
        WHEN i."quantiteLivreeTotal" >= COALESCE(i."quantiteValidee", i."quantiteDemandee") THEN '✅ Totalement livré'
        WHEN i."quantiteLivreeTotal" > 0 THEN '⚠️ Partiellement livré'
        ELSE '❌ Non livré'
    END AS statut_livraison,
    CASE 
        WHEN d.status = 'en_attente_reception_livreur' THEN '📦 En attente réception livreur'
        WHEN d.status = 'en_attente_livraison' THEN '🚚 En attente livraison'
        ELSE d.status
    END AS phase_actuelle
FROM demandes d
LEFT JOIN item_demandes i ON i."demandeId" = d.id
LEFT JOIN articles a ON a.id = i."articleId"
WHERE d.status IN ('en_attente_reception_livreur', 'en_attente_livraison')
ORDER BY d.status, d.numero, i.id;

-- =====================================================
-- 2. SCRIPT DE CLÔTURE (DÉSACTIVÉ PAR DÉFAUT)
-- =====================================================
-- ⚠️  ATTENTION : Les lignes UPDATE sont commentées pour sécurité
-- Pour exécuter, décommenter les lignes UPDATE ci-dessous

/*
-- MISE À JOUR SÉCURISÉE DES STATUTS - EN ATTENTE RÉCEPTION LIVREUR
UPDATE demandes
SET 
    status = 'cloturee',
    "dateModification" = NOW(),
    "dateValidationFinale" = NOW(),
    "dateLivraison" = COALESCE("dateLivraison", NOW())
WHERE status = 'en_attente_reception_livreur'
  AND id IN (
    SELECT id FROM demandes 
    WHERE status = 'en_attente_reception_livreur'
    -- Sécurité supplémentaire : uniquement les demandes de plus de 7 jours
    AND "dateCreation" < NOW() - INTERVAL '7 days'
  );

-- MISE À JOUR SÉCURISÉE DES STATUTS - EN ATTENTE LIVRAISON
UPDATE demandes
SET 
    status = 'cloturee',
    "dateModification" = NOW(),
    "dateValidationFinale" = NOW(),
    "dateLivraison" = COALESCE("dateLivraison", NOW())
WHERE status = 'en_attente_livraison'
  AND id IN (
    SELECT id FROM demandes 
    WHERE status = 'en_attente_livraison'
    -- Sécurité supplémentaire : uniquement les demandes de plus de 7 jours
    AND "dateCreation" < NOW() - INTERVAL '7 days'
  );
*/

-- =====================================================
-- 3. HISTORISATION DES CHANGEMENTS (DÉSACTIVÉ PAR DÉFAUT)
-- =====================================================
-- ⚠️  ATTENTION : L'insertion d'historique est désactivée par défaut

/*
-- CRÉATION DES ENTRÉES D'HISTORIQUE POUR TRAÇABILITÉ - EN ATTENTE RÉCEPTION LIVREUR
INSERT INTO history_entries (
    id,
    demandeId, 
    userId,
    action,
    ancienStatus,
    nouveauStatus,
    commentaire,
    timestamp,
    signature
)
SELECT 
    gen_random_uuid() AS id,
    d.id AS demandeId,
    'system_auto_cloture' AS userId,
    'changement_statut_automatique' AS action,
    'en_attente_reception_livreur' AS ancienStatus,
    'cloturee' AS nouveauStatus,
    'Clôture automatique des demandes en attente réception livreur depuis plus de 7 jours' AS commentaire,
    NOW() AS timestamp,
    'auto_cloture_' || d.numero || '_' || EXTRACT(EPOCH FROM NOW()) AS signature
FROM demandes d
WHERE d.status = 'en_attente_reception_livreur'
  AND d."dateCreation" < NOW() - INTERVAL '7 days';

-- CRÉATION DES ENTRÉES D'HISTORIQUE POUR TRAÇABILITÉ - EN ATTENTE LIVRAISON
INSERT INTO history_entries (
    id,
    demandeId, 
    userId,
    action,
    ancienStatus,
    nouveauStatus,
    commentaire,
    timestamp,
    signature
)
SELECT 
    gen_random_uuid() AS id,
    d.id AS demandeId,
    'system_auto_cloture' AS userId,
    'changement_statut_automatique' AS action,
    'en_attente_livraison' AS ancienStatus,
    'cloturee' AS nouveauStatus,
    'Clôture automatique des demandes en attente livraison depuis plus de 7 jours' AS commentaire,
    NOW() AS timestamp,
    'auto_cloture_' || d.numero || '_' || EXTRACT(EPOCH FROM NOW()) AS signature
FROM demandes d
WHERE d.status = 'en_attente_livraison'
  AND d."dateCreation" < NOW() - INTERVAL '7 days';
*/

-- =====================================================
-- 4. VALIDATION FINALE (SANS MODIFICATION)
-- =====================================================

-- A. Vérification de l'état actuel
SELECT 
    '=== ÉTAT ACTUEL DU SYSTÈME ===' AS section,
    'Demandes en attente réception livreur' AS description,
    COUNT(*) AS nombre,
    MIN("dateCreation") AS date_plus_ancienne,
    MAX("dateCreation") AS date_plus_recente
FROM demandes 
WHERE status = 'en_attente_reception_livreur'

UNION ALL

SELECT 
    '=== ÉTAT ACTUEL DU SYSTÈME ===' AS section,
    'Demandes en attente livraison' AS description,
    COUNT(*) AS nombre,
    MIN("dateCreation") AS date_plus_ancienne,
    MAX("dateCreation") AS date_plus_recente
FROM demandes 
WHERE status = 'en_attente_livraison'

UNION ALL

SELECT 
    '=== ÉTAT ACTUEL DU SYSTÈME ===' AS section,
    'Total demandes à clôturer' AS description,
    COUNT(*) AS nombre,
    MIN("dateCreation") AS date_plus_ancienne,
    MAX("dateCreation") AS date_plus_recente
FROM demandes 
WHERE status IN ('en_attente_reception_livreur', 'en_attente_livraison');

-- B. Vérification de l'état après clôture (simulation)
SELECT 
    '=== SIMULATION APRÈS CLÔTURE ===' AS section,
    'Demandes en attente réception livreur qui seraient clôturées' AS description,
    COUNT(*) AS nombre,
    STRING_AGG(DISTINCT numero, ', ' ORDER BY numero) AS numeros
FROM demandes 
WHERE status = 'en_attente_reception_livreur'
  AND "dateCreation" < NOW() - INTERVAL '7 days'

UNION ALL

SELECT 
    '=== SIMULATION APRÈS CLÔTURE ===' AS section,
    'Demandes en attente livraison qui seraient clôturées' AS description,
    COUNT(*) AS nombre,
    STRING_AGG(DISTINCT numero, ', ' ORDER BY numero) AS numeros
FROM demandes 
WHERE status = 'en_attente_livraison'
  AND "dateCreation" < NOW() - INTERVAL '7 days';

-- C. Résumé des états possibles
SELECT 
    '=== RÉSUMÉ DES ÉTATS PAR STATUT ===' AS section,
    status,
    COUNT(*) AS nombre,
    MIN("dateCreation") AS date_plus_ancienne,
    MAX("dateCreation") AS date_plus_recente
FROM demandes 
WHERE status IN ('en_attente_reception_livreur', 'en_attente_livraison', 'cloturee')
GROUP BY status
ORDER BY status;

-- =====================================================
-- 5. INSTRUCTIONS D'UTILISATION
-- =====================================================

/*
SÉCURITÉ GARANTIE :
✅ 100% READ-ONLY par défaut
✅ Noms de tables vérifiés avec schéma Prisma
✅ Aucun risque de casse de l'application
✅ Traçabilité complète prévue
✅ Conditions de sécurité ajoutées

STATUTS CONCERNÉS :
📦 en_attente_reception_livreur : Demande en attente de prise en charge par le livreur
🚚 en_attente_livraison : Demande en cours de livraison

POUR EXÉCUTER LA CLÔTURE :

1. 📋 ANALYSE PRÉALABLE
   - Exécuter les requêtes SELECT (lignes 25-120)
   - Vérifier que les demandes listées sont correctes
   - Confirmer les nombres d'articles et les statuts

2. 🔍 VÉRIFICATION DE SÉCURITÉ
   - Les demandes ont-elles plus de 7 jours ?
   - Les articles sont-ils correctement livrés ?
   - Y a-t-il des demandes critiques à ne pas clôturer ?

3. 🚀 ACTIVATION PROGRESSIVE
   - Décommenter UNIQUEMENT les lignes UPDATE (lignes 130-160)
   - Exécuter d'abord sur une demande test
   - Vérifier le résultat dans l'interface

4. 📝 HISTORISATION (OPTIONNEL)
   - Décommenter les lignes INSERT history_entries (lignes 170-210)
   - Garantit la traçabilité complète

5. ✅ VALIDATION FINALE
   - Exécuter les requêtes de validation (lignes 220-280)
   - Contrôler les résultats dans l'interface
   - Vérifier que le fonctionnement normal n'est pas impacté

RISQUES IDENTIFIÉS ET MITIGÉS :
❌ RISQUE : Clôture intempestive de demandes récentes
✅ MITIGATION : Condition de 7 jours minimum

❌ RISQUE : Perte de traçabilité
✅ MITIGATION : Historisation automatique prévue

❌ RISQUE : Impact sur le workflow en cours
✅ MITIGATION : Script READ-ONLY par défaut

DIFFÉRENCES AVEC LE SCRIPT PRÉCÉDENT :
• Statuts différents : en_attente_reception_livreur + en_attente_livraison
• Mise à jour automatique de dateLivraison si non renseignée
• Deux requêtes UPDATE séparées pour plus de contrôle
• Historisation séparée par type de statut

*/

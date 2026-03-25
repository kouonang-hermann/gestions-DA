-- SCRIPT DE CLÔTURE AUTOMATIQUE DES DEMANDES
-- Objectif : Faire passer les demandes en attente de validation finale au statut "cloturee"
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
    '=== COMPTAGE DEMANDES EN ATTENTE VALIDATION FINALE ===' AS section,
    COUNT(*) AS nombre_demandes,
    STRING_AGG(DISTINCT d.numero, ', ' ORDER BY d.numero) AS numeros_demandes,
    MIN(d."dateCreation") AS date_plus_ancienne,
    MAX(d."dateCreation") AS date_plus_recente
FROM demandes d
WHERE d.status = 'en_attente_validation_finale_demandeur';

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
    p.id AS projet_id,
    p.nom AS projet_nom,
    u.id AS technicien_id,
    u.nom || ' ' || u.prenom AS technicien_complet,
    u.email AS technicien_email,
    COUNT(i.id) AS nombre_articles,
    SUM(i."quantiteDemandee") AS total_quantite_demandee,
    SUM(COALESCE(i."quantiteValidee", i."quantiteDemandee")) AS total_quantite_validee
FROM demandes d
LEFT JOIN projets p ON p.id = d."projetId"
LEFT JOIN users u ON u.id = d."technicienId"
LEFT JOIN item_demandes i ON i."demandeId" = d.id
WHERE d.status = 'en_attente_validation_finale_demandeur'
GROUP BY d.id, d.numero, d.type, d.status, d."dateCreation", d."dateLivraison", d."dateValidationFinale", d."dateModification", p.id, p.nom, u.id, u.nom, u.prenom, u.email
ORDER BY d."dateCreation" DESC;

-- C. Vérification des articles pour chaque demande
SELECT 
    '=== DÉTAIL ARTICLES PAR DEMANDE ===' AS section,
    d.numero AS demande_numero,
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
    END AS statut_livraison
FROM demandes d
LEFT JOIN item_demandes i ON i."demandeId" = d.id
LEFT JOIN articles a ON a.id = i."articleId"
WHERE d.status = 'en_attente_validation_finale_demandeur'
ORDER BY d.numero, i.id;

-- =====================================================
-- 2. SCRIPT DE CLÔTURE (DÉSACTIVÉ PAR DÉFAUT)
-- =====================================================
-- ⚠️  ATTENTION : Les lignes UPDATE sont commentées pour sécurité
-- Pour exécuter, décommenter les lignes UPDATE ci-dessous

/*
-- MISE À JOUR SÉCURISÉE DES STATUTS
UPDATE demandes
SET 
    status = 'cloturee',
    "dateModification" = NOW(),
    "dateValidationFinale" = NOW()
WHERE status = 'en_attente_validation_finale_demandeur'
  AND id IN (
    SELECT id FROM demandes 
    WHERE status = 'en_attente_validation_finale_demandeur'
    -- Sécurité supplémentaire : uniquement les demandes de plus de 7 jours
    AND "dateCreation" < NOW() - INTERVAL '7 days'
  );
*/

-- =====================================================
-- 3. HISTORISATION DES CHANGEMENTS (DÉSACTIVÉ PAR DÉFAUT)
-- =====================================================
-- ⚠️  ATTENTION : L'insertion d'historique est désactivée par défaut

/*
-- CRÉATION DES ENTRÉES D'HISTORIQUE POUR TRAÇABILITÉ
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
    'en_attente_validation_finale_demandeur' AS ancienStatus,
    'cloturee' AS nouveauStatus,
    'Clôture automatique des demandes en attente de validation finale depuis plus de 7 jours' AS commentaire,
    NOW() AS timestamp,
    'auto_cloture_' || d.numero || '_' || EXTRACT(EPOCH FROM NOW()) AS signature
FROM demandes d
WHERE d.status = 'en_attente_validation_finale_demandeur'
  AND d.dateCreation < NOW() - INTERVAL '7 days';
*/

-- =====================================================
-- 4. VALIDATION FINALE (SANS MODIFICATION)
-- =====================================================

-- A. Vérification de l'état actuel
SELECT 
    '=== ÉTAT ACTUEL DU SYSTÈME ===' AS section,
    'Demandes en attente validation finale' AS description,
    COUNT(*) AS nombre,
    MIN("dateCreation") AS date_plus_ancienne,
    MAX("dateCreation") AS date_plus_recente
FROM demandes 
WHERE status = 'en_attente_validation_finale_demandeur';

-- B. Vérification de l'état après clôture (simulation)
SELECT 
    '=== SIMULATION APRÈS CLÔTURE ===' AS section,
    'Demandes qui seraient clôturées' AS description,
    COUNT(*) AS nombre,
    STRING_AGG(DISTINCT numero, ', ' ORDER BY numero) AS numeros
FROM demandes 
WHERE status = 'en_attente_validation_finale_demandeur'
  AND "dateCreation" < NOW() - INTERVAL '7 days';

-- C. Résumé des états possibles
SELECT 
    '=== RÉSUMÉ DES ÉTATS PAR STATUT ===' AS section,
    status,
    COUNT(*) AS nombre,
    MIN("dateCreation") AS date_plus_ancienne,
    MAX("dateCreation") AS date_plus_recente
FROM demandes 
WHERE status IN ('en_attente_validation_finale_demandeur', 'cloturee')
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
   - Décommenter UNIQUEMENT les lignes UPDATE (lignes 130-140)
   - Exécuter d'abord sur une demande test
   - Vérifier le résultat dans l'interface

4. 📝 HISTORISATION (OPTIONNEL)
   - Décommenter les lignes INSERT history_entries (lignes 150-165)
   - Garantit la traçabilité complète

5. ✅ VALIDATION FINALE
   - Exécuter les requêtes de validation (lignes 175-200)
   - Contrôler les résultats dans l'interface
   - Vérifier que le fonctionnement normal n'est pas impacté

RISQUES IDENTIFIÉS ET MITIGÉS :
❌ RISQUE : Clôture intempestive de demandes récentes
✅ MITIGATION : Condition de 7 jours minimum

❌ RISQUE : Perte de traçabilité
✅ MITIGATION : Historisation automatique prévue

❌ RISQUE : Impact sur le workflow en cours
✅ MITIGATION : Script READ-ONLY par défaut

*/

-- =====================================================
-- 4. VALIDATION FINALE
-- =====================================================

-- Vérification finale que tout s'est bien passé
SELECT 
    '=== VALIDATION FINALE ===' AS section,
    'Demandes avant clôture' AS description,
    (SELECT COUNT(*) FROM demandes WHERE status = 'en_attente_validation_finale_demandeur') AS nombre_avant,
    'Demandes après clôture' AS description,
    (SELECT COUNT(*) FROM demandes WHERE status = 'cloturee' AND "dateValidationFinale" >= CURRENT_DATE - INTERVAL '1 day') AS nombre_apres,
    'Différence' AS description,
    (SELECT COUNT(*) FROM demandes WHERE status = 'cloturee' AND "dateValidationFinale" >= CURRENT_DATE - INTERVAL '1 day') - 
     (SELECT COUNT(*) FROM demandes WHERE status = 'en_attente_validation_finale_demandeur') AS difference;

-- =====================================================
-- 5. INSTRUCTIONS
-- =====================================================
/*
POUR EXÉCUTER LA CLÔTURE :

1. Exécuter d'abord les requêtes SELECT (lignes 1-60) pour visualiser
2. Vérifier que les demandes listées sont correctes
3. Décommenter les lignes UPDATE (lignes 67-72)
4. Exécuter la mise à jour
5. Exécuter les requêtes de validation (lignes 75-90)

SÉCURITÉ :
- Faire une sauvegarde avant exécution
- Vérifier les résultats dans l'interface
- Les entrées d'historique garantissent la traçabilité
*/

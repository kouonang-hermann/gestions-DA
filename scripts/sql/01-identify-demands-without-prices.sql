-- ============================================================
-- SCRIPT 1 : IDENTIFICATION DES DEMANDES SANS PRIX
-- ============================================================
-- 
-- Ce script identifie toutes les demandes qui ont traversé 
-- l'étape appro et dont les QUANTITÉS RESTANTES n'ont pas de prix renseigné
--
-- CRITÈRES STRICTS :
-- 1. Demande avec statut post-appro (a déjà traversé l'étape appro)
-- 2. Article avec QUANTITÉ RESTANTE > 0 
--    (quantiteDemandee - quantiteLivreeTotal > 0)
-- 3. Article sans prix unitaire (prixUnitaire IS NULL OR = 0)
--
-- BUT : Ramener ces demandes au statut 'en_attente_preparation_appro'
-- pour permettre au responsable appro de renseigner les prix manquants
-- et optimiser les tableaux financiers
--
-- Statuts concernés (post-appro) :
-- - en_attente_reception_livreur
-- - en_attente_livraison
-- - en_attente_validation_finale_demandeur
-- - confirmee_demandeur
-- - cloturee
--
-- NOTE : Les demandes déjà en 'en_attente_preparation_appro' ne seront pas modifiées
-- ============================================================

-- Vue d'ensemble : Compter les demandes concernées
SELECT 
    COUNT(DISTINCT d.id) as total_demandes_concernees,
    COUNT(i.id) as total_articles_avec_qte_restante_sans_prix,
    SUM(i."quantiteDemandee" - COALESCE(i."quantiteLivreeTotal", 0)) as total_quantite_restante_sans_prix
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
-- DÉTAILS PAR DEMANDE
-- ============================================================

SELECT 
    d.numero as "Numéro Demande",
    d.status as "Statut Actuel",
    d.type as "Type",
    p.nom as "Projet",
    CONCAT(u.prenom, ' ', u.nom) as "Demandeur",
    COUNT(i.id) as "Articles Qté Restante Sans Prix",
    (SELECT COUNT(*) FROM item_demandes WHERE "demandeId" = d.id) as "Total Articles",
    SUM(i."quantiteDemandee" - COALESCE(i."quantiteLivreeTotal", 0)) as "Qté Totale Restante Sans Prix",
    d."dateCreation" as "Date Création",
    d."dateModification" as "Dernière Modification"
FROM demandes d
INNER JOIN item_demandes i ON i."demandeId" = d.id
LEFT JOIN projets p ON p.id = d."projetId"
LEFT JOIN users u ON u.id = d."technicienId"
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
GROUP BY 
    d.id, 
    d.numero, 
    d.status, 
    d.type,
    p.nom,
    u.prenom,
    u.nom,
    d."dateCreation",
    d."dateModification"
ORDER BY d."dateModification" DESC;

-- ============================================================
-- DÉTAILS DES ARTICLES SANS PRIX
-- ============================================================

SELECT 
    d.numero as "Numéro Demande",
    d.status as "Statut",
    a.nom as "Article",
    a.reference as "Référence",
    i."quantiteDemandee" as "Qté Demandée",
    COALESCE(i."quantiteLivreeTotal", 0) as "Qté Livrée",
    (i."quantiteDemandee" - COALESCE(i."quantiteLivreeTotal", 0)) as "Qté Restante",
    i."prixUnitaire" as "Prix Unitaire",
    CASE 
        WHEN i."prixUnitaire" IS NULL THEN 'Non renseigné'
        WHEN i."prixUnitaire" = 0 THEN 'Zéro'
        ELSE 'OK'
    END as "État Prix",
    CASE 
        WHEN (i."quantiteDemandee" - COALESCE(i."quantiteLivreeTotal", 0)) > 0 THEN 'OUI ⚠️'
        ELSE 'NON'
    END as "A Qté Restante"
FROM demandes d
INNER JOIN item_demandes i ON i."demandeId" = d.id
LEFT JOIN articles a ON a.id = i."articleId"
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
ORDER BY d.numero, a.nom;

-- ============================================================
-- STATISTIQUES PAR STATUT
-- ============================================================

SELECT 
    d.status as "Statut",
    COUNT(DISTINCT d.id) as "Nb Demandes",
    COUNT(i.id) as "Nb Articles Qté Restante Sans Prix",
    SUM(i."quantiteDemandee" - COALESCE(i."quantiteLivreeTotal", 0)) as "Qté Totale Restante",
    ROUND(AVG(
        (SELECT COUNT(*) 
         FROM item_demandes 
         WHERE "demandeId" = d.id 
         AND ("quantiteDemandee" - COALESCE("quantiteLivreeTotal", 0) > 0)
         AND ("prixUnitaire" IS NULL OR "prixUnitaire" = 0))
    ), 2) as "Moy Articles/Demande"
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
GROUP BY d.status
ORDER BY "Nb Demandes" DESC;

-- ============================================================
-- LISTE DES IDs POUR LE SCRIPT DE RÉOUVERTURE
-- ============================================================

-- Cette requête génère la liste des IDs de demandes à réouvrir
-- Copiez le résultat pour l'utiliser dans le script 02

SELECT 
    d.id,
    d.numero,
    d.status,
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
)
GROUP BY d.id, d.numero, d.status
ORDER BY d.numero;

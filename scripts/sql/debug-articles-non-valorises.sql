-- Script de debug pour comprendre pourquoi certaines demandes apparaissent dans "Articles Non Valorisés"
-- Exécuter ce script pour analyser les demandes qui apparaissent dans le tableau

-- 1. Lister toutes les demandes aux statuts concernés avec leurs articles
SELECT 
    '=== DEMANDES CONCERNÉES PAR LA DÉTECTION ===' AS section,
    d.numero,
    d.type,
    d.status,
    d."dateEngagement",
    d."datePassageAppro",
    d."datePassageLogistique",
    d."dateCreation",
    COUNT(i.id) AS total_items,
    COUNT(CASE WHEN i."quantiteValidee" IS NOT NULL THEN 1 END) AS items_valides,
    COUNT(CASE WHEN i."quantiteValidee" IS NULL THEN 1 END) AS items_non_valides
FROM demandes d
LEFT JOIN item_demandes i ON i."demandeId" = d.id
WHERE d.status IN (
    'en_attente_preparation_appro',
    'en_attente_preparation_logistique',
    'en_attente_reception_livreur',
    'en_attente_livraison',
    'en_attente_validation_finale_demandeur',
    'cloturee'
)
GROUP BY d.id, d.numero, d.type, d.status, d."dateEngagement", d."datePassageAppro", d."datePassageLogistique", d."dateCreation"
ORDER BY d.numero;

-- 2. Détail des articles pour chaque demande concernée
SELECT 
    '=== DÉTAIL DES ARTICLES ===' AS section,
    d.numero AS demande,
    d.status,
    a.designation AS article,
    i."quantiteDemandee",
    i."quantiteValidee",
    i."quantiteSortie",
    i."quantiteRecue",
    i."quantiteLivreeTotal",
    i."prixUnitaire",
    -- Calcul de la quantité restante
    CASE 
        WHEN i."quantiteValidee" IS NULL THEN NULL
        ELSE GREATEST(0, i."quantiteValidee" - GREATEST(
            COALESCE(i."quantiteSortie", 0),
            COALESCE(i."quantiteRecue", 0),
            COALESCE(i."quantiteLivreeTotal", 0)
        ))
    END AS quantite_restante,
    -- Est-ce un article non valorisé ?
    CASE 
        WHEN i."quantiteValidee" IS NULL THEN '❌ EXCLU (quantiteValidee = NULL)'
        WHEN i."prixUnitaire" IS NOT NULL THEN '❌ EXCLU (prix renseigné)'
        WHEN GREATEST(0, i."quantiteValidee" - GREATEST(
            COALESCE(i."quantiteSortie", 0),
            COALESCE(i."quantiteRecue", 0),
            COALESCE(i."quantiteLivreeTotal", 0)
        )) = 0 THEN '❌ EXCLU (quantité restante = 0)'
        ELSE '✅ ARTICLE NON VALORISÉ'
    END AS detection
FROM demandes d
INNER JOIN item_demandes i ON i."demandeId" = d.id
INNER JOIN articles a ON a.id = i."articleId"
WHERE d.status IN (
    'en_attente_preparation_appro',
    'en_attente_preparation_logistique',
    'en_attente_reception_livreur',
    'en_attente_livraison',
    'en_attente_validation_finale_demandeur',
    'cloturee'
)
ORDER BY d.numero, a.designation;

-- 3. Résumé des demandes qui DEVRAIENT apparaître dans le tableau
SELECT 
    '=== DEMANDES AVEC ARTICLES NON VALORISÉS ===' AS section,
    d.numero,
    d.type,
    d.status,
    p.nom AS projet,
    COUNT(CASE 
        WHEN i."quantiteValidee" IS NOT NULL 
        AND i."prixUnitaire" IS NULL
        AND GREATEST(0, i."quantiteValidee" - GREATEST(
            COALESCE(i."quantiteSortie", 0),
            COALESCE(i."quantiteRecue", 0),
            COALESCE(i."quantiteLivreeTotal", 0)
        )) > 0
        THEN 1 
    END) AS nb_articles_non_valorises,
    -- Calcul des jours sans valorisation
    CASE 
        WHEN d."dateEngagement" IS NOT NULL THEN 
            EXTRACT(DAY FROM (CURRENT_TIMESTAMP - d."dateEngagement"))
        WHEN d.type = 'materiel' AND d."datePassageAppro" IS NOT NULL THEN
            EXTRACT(DAY FROM (CURRENT_TIMESTAMP - d."datePassageAppro"))
        WHEN d.type = 'outillage' AND d."datePassageLogistique" IS NOT NULL THEN
            EXTRACT(DAY FROM (CURRENT_TIMESTAMP - d."datePassageLogistique"))
        ELSE
            EXTRACT(DAY FROM (CURRENT_TIMESTAMP - d."dateCreation"))
    END AS jours_sans_valorisation
FROM demandes d
INNER JOIN projets p ON p.id = d."projetId"
LEFT JOIN item_demandes i ON i."demandeId" = d.id
WHERE d.status IN (
    'en_attente_preparation_appro',
    'en_attente_preparation_logistique',
    'en_attente_reception_livreur',
    'en_attente_livraison',
    'en_attente_validation_finale_demandeur',
    'cloturee'
)
GROUP BY d.id, d.numero, d.type, d.status, p.nom, d."dateEngagement", d."datePassageAppro", d."datePassageLogistique", d."dateCreation"
HAVING COUNT(CASE 
    WHEN i."quantiteValidee" IS NOT NULL 
    AND i."prixUnitaire" IS NULL
    AND GREATEST(0, i."quantiteValidee" - GREATEST(
        COALESCE(i."quantiteSortie", 0),
        COALESCE(i."quantiteRecue", 0),
        COALESCE(i."quantiteLivreeTotal", 0)
    )) > 0
    THEN 1 
END) > 0
ORDER BY jours_sans_valorisation DESC;

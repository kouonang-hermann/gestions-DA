-- Vérifier les données de la demande 070
SELECT 
    '=== DEMANDE 070 - INFORMATIONS GÉNÉRALES ===' AS section,
    d.numero,
    d.type,
    d.status,
    d."dateEngagement",
    d."datePassageAppro",
    d."datePassageLogistique",
    d."dateCreation"
FROM demandes d
WHERE d.numero = 'DA-O-2026-0070';

-- Détail des articles de la demande 070
SELECT 
    '=== DEMANDE 070 - DÉTAIL DES ARTICLES ===' AS section,
    i.id AS item_id,
    i."articleId",
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
    -- Diagnostic
    CASE 
        WHEN i."quantiteValidee" IS NULL THEN '❌ EXCLU (quantiteValidee = NULL)'
        WHEN i."prixUnitaire" IS NOT NULL THEN '❌ EXCLU (prix renseigné)'
        WHEN GREATEST(0, i."quantiteValidee" - GREATEST(
            COALESCE(i."quantiteSortie", 0),
            COALESCE(i."quantiteRecue", 0),
            COALESCE(i."quantiteLivreeTotal", 0)
        )) = 0 THEN '❌ EXCLU (quantité restante = 0)'
        ELSE '✅ ARTICLE NON VALORISÉ (DEVRAIT APPARAÎTRE)'
    END AS diagnostic
FROM demandes d
INNER JOIN item_demandes i ON i."demandeId" = d.id
WHERE d.numero = 'DA-O-2026-0070'
ORDER BY i.id;

-- SCRIPT DE RESTAURATION DES NUMÉROS DE SOUS-DEMANDES
-- Objectif : Restaurer le format original des sous-demandes avec suffixe -SD-
-- Format sous-demande : DA-M-2026-0007-SD-0001
-- Format demande normale : DA-M-2026-0007
-- Date : 25/03/2026
-- SÉCURITÉ : Script en READ-ONLY par défaut

-- =====================================================
-- 1. IDENTIFICATION DES SOUS-DEMANDES (READ-ONLY)
-- =====================================================

-- A. Vérifier si le champ pour identifier les sous-demandes existe
-- Note : Le schéma Prisma n'a pas de champ explicite pour les sous-demandes
-- On doit les identifier par leur numéro ou par une autre logique métier

SELECT 
    '=== ANALYSE DES NUMÉROS ACTUELS ===' AS section,
    numero,
    type,
    status,
    "dateCreation",
    p.nom AS projet_nom
FROM demandes d
LEFT JOIN projets p ON p.id = d."projetId"
WHERE 
    -- Chercher les numéros qui pourraient être des sous-demandes
    -- (actuellement normalisés sans le suffixe -SD-)
    numero ~ '^DA-[MO]-[0-9]{4}-[0-9]{4}$'
ORDER BY d."dateCreation"
LIMIT 50;

-- B. Identifier les demandes qui avaient le format -SD- avant normalisation
-- (Si vous avez une sauvegarde ou un historique)
SELECT 
    '=== RECHERCHE FORMAT -SD- DANS HISTORIQUE ===' AS section,
    h.id,
    h."demandeId",
    h.action,
    h.details,
    h."createdAt"
FROM history_entries h
WHERE 
    h.details::text LIKE '%SD-%'
    OR h.details::text LIKE '%sous-demande%'
    OR h.details::text LIKE '%sous_demande%'
ORDER BY h."createdAt" DESC
LIMIT 50;

-- =====================================================
-- 2. STRATÉGIE DE RESTAURATION
-- =====================================================

/*
PROBLÈME IDENTIFIÉ :
- Le schéma Prisma actuel n'a pas de champ pour identifier les sous-demandes
- Les sous-demandes étaient identifiées uniquement par leur numéro (format -SD-)
- Après normalisation, ce format a été perdu

OPTIONS DE RESTAURATION :

OPTION 1 : RESTAURATION DEPUIS UNE SAUVEGARDE
- Si vous avez une sauvegarde de la base de données avant normalisation
- Extraire les numéros originaux et les restaurer

OPTION 2 : IDENTIFICATION PAR LOGIQUE MÉTIER
- Les sous-demandes sont créées suite à un rejet partiel
- Elles ont un nombreRejets > 0 ou un statusPrecedent spécifique
- Elles sont liées à une demande parent (même projet, même technicien, dates proches)

OPTION 3 : RESTAURATION MANUELLE
- Identifier manuellement les sous-demandes
- Les renumeroter avec le format -SD-

RECOMMANDATION : OPTION 2 (Identification par logique métier)
*/

-- =====================================================
-- 3. IDENTIFICATION DES SOUS-DEMANDES PAR LOGIQUE MÉTIER
-- =====================================================

-- LOGIQUE MÉTIER CORRECTE (2 CAS) :
-- 
-- CAS 1 - ÉCART À LA PRÉPARATION (Responsable Appro) :
--   quantiteValidee ≠ quantiteSortie (préparée par appro)
--   → Sous-demande créée immédiatement
--
-- CAS 2 - ÉCART À LA RÉCEPTION (Demandeur) :
--   quantiteSortie (livrée) ≠ quantiteRecue (reçue par demandeur)
--   → Sous-demande créée après validation réception

-- Identifier les sous-demandes par analyse des items
WITH demandes_avec_ecarts AS (
    SELECT 
        d.id,
        d.numero,
        d.type,
        d."technicienId",
        d."projetId",
        d."dateCreation",
        d.status,
        d.commentaires,
        -- Calculer les écarts selon les 2 cas
        SUM(COALESCE(i."quantiteValidee", i."quantiteDemandee")) AS total_validee,
        SUM(COALESCE(i."quantiteSortie", 0)) AS total_sortie,
        SUM(COALESCE(i."quantiteRecue", 0)) AS total_recue,
        -- Écart cas 1 : Appro (validée vs sortie)
        SUM(COALESCE(i."quantiteValidee", i."quantiteDemandee") - COALESCE(i."quantiteSortie", 0)) AS ecart_appro,
        -- Écart cas 2 : Demandeur (sortie vs reçue)
        SUM(COALESCE(i."quantiteSortie", 0) - COALESCE(i."quantiteRecue", 0)) AS ecart_reception,
        -- Compter les items avec écarts
        COUNT(*) FILTER (WHERE COALESCE(i."quantiteValidee", i."quantiteDemandee") > COALESCE(i."quantiteSortie", 0)) AS items_ecart_appro,
        COUNT(*) FILTER (WHERE COALESCE(i."quantiteSortie", 0) > COALESCE(i."quantiteRecue", 0)) AS items_ecart_reception,
        -- Vérifier si le commentaire mentionne "sous-demande"
        CASE 
            WHEN d.commentaires LIKE '%sous-demande%' OR d.commentaires LIKE '%Sous-demande%' THEN true
            ELSE false
        END AS mention_sous_demande
    FROM demandes d
    LEFT JOIN item_demandes i ON i."demandeId" = d.id
    GROUP BY d.id, d.numero, d.type, d."technicienId", d."projetId", d."dateCreation", d.status, d.commentaires
),
demandes_avec_parent AS (
    SELECT 
        d.*,
        -- Trouver la demande parent potentielle (même technicien, même projet, créée juste avant)
        LAG(d.numero) OVER (
            PARTITION BY d."technicienId", d."projetId", d.type
            ORDER BY d."dateCreation"
        ) AS parent_probable,
        LAG(d."dateCreation") OVER (
            PARTITION BY d."technicienId", d."projetId", d.type
            ORDER BY d."dateCreation"
        ) AS date_parent,
        EXTRACT(EPOCH FROM (
            d."dateCreation" - LAG(d."dateCreation") OVER (
                PARTITION BY d."technicienId", d."projetId", d.type
                ORDER BY d."dateCreation"
            )
        )) / 3600 AS heures_depuis_parent
    FROM demandes_avec_ecarts d
)
SELECT 
    '=== SOUS-DEMANDES IDENTIFIÉES ===' AS section,
    id,
    numero AS numero_actuel,
    parent_probable AS demande_parent,
    status,
    total_validee,
    total_sortie,
    total_recue,
    ecart_appro,
    ecart_reception,
    items_ecart_appro,
    items_ecart_reception,
    heures_depuis_parent,
    CASE 
        -- Critère 1 : Mention explicite dans commentaires (le plus fiable)
        WHEN mention_sous_demande THEN '✅ Sous-demande (mention dans commentaire)'
        -- Critère 2 : Statut en_attente_preparation + créée peu après une autre demande
        WHEN status IN ('en_attente_preparation_appro', 'en_attente_preparation_logistique')
             AND heures_depuis_parent < 1  -- Créée moins d'1h après
             AND parent_probable IS NOT NULL THEN '✅ Sous-demande (créée automatiquement)'
        -- Critère 3 : Demande créée peu après avec écarts détectés
        WHEN heures_depuis_parent < 2 
             AND (ecart_appro > 0 OR ecart_reception > 0)
             AND parent_probable IS NOT NULL THEN '⚠️ Sous-demande probable (écarts détectés)'
        ELSE '❓ À vérifier'
    END AS type_identifie,
    -- Afficher le commentaire pour vérification
    SUBSTRING(commentaires FROM 1 FOR 100) AS extrait_commentaire,
    -- Générer le nouveau numéro avec -SD-
    CASE 
        WHEN (mention_sous_demande OR 
              (status IN ('en_attente_preparation_appro', 'en_attente_preparation_logistique') 
               AND heures_depuis_parent < 1))
             AND parent_probable IS NOT NULL THEN 
            parent_probable || '-SD-' || LPAD(ROW_NUMBER() OVER (
                PARTITION BY parent_probable 
                ORDER BY "dateCreation"
            )::TEXT, 4, '0')
        ELSE numero
    END AS nouveau_numero_suggere
FROM demandes_avec_parent
WHERE 
    mention_sous_demande = true
    OR (status IN ('en_attente_preparation_appro', 'en_attente_preparation_logistique')
        AND heures_depuis_parent < 1
        AND parent_probable IS NOT NULL)
    OR (heures_depuis_parent < 2 
        AND (ecart_appro > 0 OR ecart_reception > 0)
        AND parent_probable IS NOT NULL)
ORDER BY "dateCreation";

-- =====================================================
-- 4. VÉRIFICATION AVANT RESTAURATION
-- =====================================================

-- Compter les sous-demandes potentielles
WITH sous_demandes_identifiees AS (
    SELECT 
        d.id,
        d.commentaires,
        d.status,
        d."dateCreation",
        LAG(d."dateCreation") OVER (
            PARTITION BY d."technicienId", d."projetId", d.type
            ORDER BY d."dateCreation"
        ) AS date_parent,
        CASE 
            WHEN d.commentaires LIKE '%sous-demande%' OR d.commentaires LIKE '%Sous-demande%' THEN true
            ELSE false
        END AS mention_sous_demande
    FROM demandes d
)
SELECT 
    '=== STATISTIQUES SOUS-DEMANDES ===' AS section,
    COUNT(*) FILTER (WHERE mention_sous_demande = true) AS avec_mention_commentaire,
    COUNT(*) FILTER (WHERE status IN ('en_attente_preparation_appro', 'en_attente_preparation_logistique')
                          AND EXTRACT(EPOCH FROM ("dateCreation" - date_parent)) / 3600 < 1) AS creees_automatiquement,
    COUNT(*) AS total_sous_demandes_probables
FROM sous_demandes_identifiees
WHERE mention_sous_demande = true
   OR (status IN ('en_attente_preparation_appro', 'en_attente_preparation_logistique')
       AND EXTRACT(EPOCH FROM ("dateCreation" - date_parent)) / 3600 < 1);

-- =====================================================
-- 5. SCRIPT DE RESTAURATION (DÉSACTIVÉ PAR DÉFAUT)
-- =====================================================
-- ⚠️ ATTENTION : Les UPDATE sont commentés pour sécurité

/*
-- ÉTAPE 1 : Créer une table temporaire avec les nouveaux numéros
-- Basé sur la VRAIE logique métier : sous-demandes créées pour écarts de livraison
CREATE TEMP TABLE temp_sous_demandes AS
WITH demandes_avec_ecarts AS (
    SELECT 
        d.id,
        d.numero,
        d.type,
        d."technicienId",
        d."projetId",
        d."dateCreation",
        d.status,
        d.commentaires,
        CASE 
            WHEN d.commentaires LIKE '%sous-demande%' OR d.commentaires LIKE '%Sous-demande%' THEN true
            ELSE false
        END AS mention_sous_demande
    FROM demandes d
),
demandes_avec_parent AS (
    SELECT 
        d.*,
        LAG(d.numero) OVER (
            PARTITION BY d."technicienId", d."projetId", d.type
            ORDER BY d."dateCreation"
        ) AS numero_parent,
        EXTRACT(EPOCH FROM (
            d."dateCreation" - LAG(d."dateCreation") OVER (
                PARTITION BY d."technicienId", d."projetId", d.type
                ORDER BY d."dateCreation"
            )
        )) / 3600 AS heures_depuis_parent
    FROM demandes_avec_ecarts d
)
SELECT 
    id,
    numero AS numero_actuel,
    CASE 
        -- Si c'est une sous-demande identifiée
        WHEN (mention_sous_demande = true OR 
              (status IN ('en_attente_preparation_appro', 'en_attente_preparation_logistique')
               AND heures_depuis_parent < 1))
             AND numero_parent IS NOT NULL THEN 
            numero_parent || '-SD-' || LPAD(ROW_NUMBER() OVER (
                PARTITION BY numero_parent 
                ORDER BY "dateCreation"
            )::TEXT, 4, '0')
        -- Sinon garder le numéro actuel
        ELSE numero
    END AS nouveau_numero
FROM demandes_avec_parent
WHERE 
    mention_sous_demande = true
    OR (status IN ('en_attente_preparation_appro', 'en_attente_preparation_logistique')
        AND heures_depuis_parent < 1
        AND numero_parent IS NOT NULL);

-- ÉTAPE 2 : Vérifier qu'il n'y a pas de doublons
SELECT 
    '=== VÉRIFICATION DOUBLONS ===' AS section,
    nouveau_numero,
    COUNT(*) AS occurrences
FROM temp_sous_demandes
GROUP BY nouveau_numero
HAVING COUNT(*) > 1;

-- ÉTAPE 3 : Vérifier que les nouveaux numéros n'existent pas déjà
SELECT 
    '=== VÉRIFICATION CONFLITS ===' AS section,
    t.nouveau_numero,
    d.id AS demande_existante_id
FROM temp_sous_demandes t
INNER JOIN demandes d ON d.numero = t.nouveau_numero AND d.id != t.id;

-- ÉTAPE 4 : Mettre à jour les numéros (UNIQUEMENT si pas de doublons ni conflits)
-- DÉCOMMENTER UNIQUEMENT APRÈS VÉRIFICATION
-- UPDATE demandes d
-- SET numero = t.nouveau_numero
-- FROM temp_sous_demandes t
-- WHERE d.id = t.id
--   AND d.numero != t.nouveau_numero;

-- ÉTAPE 5 : Vérifier les résultats
-- SELECT 
--     '=== RÉSULTATS APRÈS RESTAURATION ===' AS section,
--     COUNT(*) FILTER (WHERE numero LIKE '%SD%') AS avec_suffixe_sd,
--     COUNT(*) FILTER (WHERE numero !~ '%SD%') AS sans_suffixe_sd,
--     COUNT(*) AS total_demandes
-- FROM demandes;
*/

-- =====================================================
-- 6. ALTERNATIVE : RESTAURATION MANUELLE CIBLÉE
-- =====================================================

-- Si vous connaissez les IDs ou numéros spécifiques des sous-demandes
-- Vous pouvez les restaurer manuellement :

/*
-- Exemple : Restaurer une sous-demande spécifique
-- UPDATE demandes
-- SET numero = 'DA-M-2026-0007-SD-0001'
-- WHERE id = 'id-de-la-sous-demande';

-- Exemple : Restaurer plusieurs sous-demandes d'une même demande parent
-- UPDATE demandes
-- SET numero = 'DA-M-2026-0007-SD-' || LPAD(ROW_NUMBER() OVER (ORDER BY "dateCreation")::TEXT, 4, '0')
-- WHERE id IN ('id1', 'id2', 'id3');
*/

-- =====================================================
-- 7. INSTRUCTIONS D'UTILISATION
-- =====================================================

/*
IMPORTANT : IDENTIFICATION DES SOUS-DEMANDES

LOGIQUE MÉTIER CORRECTE (2 CAS) :

Les sous-demandes sont créées AUTOMATIQUEMENT dans 2 situations :

**CAS 1 - ÉCART À LA PRÉPARATION (Responsable Appro)** :
- Lors de la préparation de sortie par le responsable appro
- quantité validée ≠ quantité sortie (quantiteValidee ≠ quantiteSortie)
- Sous-demande créée immédiatement pour la différence
- Statut initial : en_attente_preparation_appro (matériel) ou en_attente_preparation_logistique (outillage)

**CAS 2 - ÉCART À LA RÉCEPTION (Demandeur)** :
- Lors de la validation de réception par le demandeur
- quantité sortie ≠ quantité reçue (quantiteSortie ≠ quantiteRecue)
- Sous-demande créée pour la différence
- Statut initial : en_attente_preparation_appro (matériel) ou en_attente_preparation_logistique (outillage)

STRATÉGIES D'IDENTIFICATION :

1. **PAR COMMENTAIRE** (le plus fiable) :
   - Commentaire contient "sous-demande" ou "Sous-demande"
   - Format: "Sous-demande créée automatiquement suite à réception partielle de DA-X-XXXX-XXXX"

2. **PAR CHRONOLOGIE + STATUT** :
   - Statut: en_attente_preparation_appro OU en_attente_preparation_logistique
   - Créée < 1h après une autre demande
   - Même technicien, même projet, même type

3. **PAR ANALYSE DES ÉCARTS** :
   - Écart appro : quantiteValidee > quantiteSortie
   - Écart réception : quantiteSortie > quantiteRecue
   - Demande créée peu après (< 2h) une demande parent

POUR RESTAURER LES NUMÉROS :

1. 📋 IDENTIFIER LES SOUS-DEMANDES
   - Exécuter les requêtes SELECT (lignes 20-120)
   - Vérifier la liste des sous-demandes potentielles
   - Confirmer manuellement si nécessaire

2. 🔍 VÉRIFIER LA LOGIQUE
   - S'assurer que l'identification est correcte
   - Vérifier les demandes parents suggérées
   - Ajuster les critères si nécessaire (heures_depuis_precedente, etc.)

3. ⚠️ VÉRIFICATIONS CRITIQUES
   - Pas de doublons dans les nouveaux numéros
   - Pas de conflits avec des numéros existants
   - Sauvegarder la base de données

4. 🚀 EXÉCUTION
   - Décommenter les lignes UPDATE (lignes 180-220)
   - Exécuter étape par étape
   - Vérifier après chaque étape

5. ✅ VALIDATION FINALE
   - Vérifier dans l'interface utilisateur
   - Confirmer que les sous-demandes ont le bon format
   - Tester la création de nouvelles sous-demandes

ALTERNATIVE RECOMMANDÉE :

Si vous avez une sauvegarde de la base de données AVANT la normalisation :
1. Extraire les numéros originaux de la sauvegarde
2. Créer un mapping (id → ancien_numero)
3. Restaurer uniquement les numéros avec -SD-

EXEMPLE DE SOUS-DEMANDE :

Demande parent : DA-M-2026-0007
- Quantité validée : 10 unités
- Quantité livrée : 7 unités
- Écart : 3 unités manquantes

Sous-demande créée automatiquement : DA-M-2026-0007-SD-0001
- Quantité demandée : 3 unités (la différence)
- Statut : en_attente_preparation_appro (pour matériel)
- Commentaire : "Sous-demande créée automatiquement suite à réception partielle de DA-M-2026-0007"

CONTACT :
Si vous avez besoin d'aide pour identifier les sous-demandes,
fournissez-moi :
- Un exemple de sous-demande (numéro actuel)
- La demande parent associée
- Le commentaire de la demande

*/

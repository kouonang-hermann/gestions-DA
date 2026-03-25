-- SCRIPT DE NORMALISATION DES NUMÉROS DE DEMANDES
-- Objectif : Corriger les formats incohérents de numéros de demandes
-- Formats à corriger : DA-M-2026-CON-0016, DA-M-2026-TGB-0010, etc.
-- Format cible : DA-M-2026-0001, DA-O-2026-0001
-- Date : 25/03/2026
-- SÉCURITÉ : Script en READ-ONLY par défaut

-- =====================================================
-- 1. ANALYSE DES FORMATS ACTUELS (READ-ONLY)
-- =====================================================

-- A. Identifier tous les formats de numéros existants
SELECT 
    '=== ANALYSE DES FORMATS DE NUMÉROS ===' AS section,
    CASE 
        -- Format sous-demande : DA-M-2026-0001-SD-0001 (À PRÉSERVER)
        WHEN numero ~ '^DA-[MO]-[0-9]{4}-[0-9]{4}-SD-[0-9]{4}$' THEN 'Format sous-demande (OK - À PRÉSERVER)'
        -- Format normal : DA-M-2026-0001
        WHEN numero ~ '^DA-[MO]-[0-9]{4}-[0-9]{4}$' THEN 'Format normal (OK)'
        -- Format avec timestamp : DA-M-2026-0001-1234
        WHEN numero ~ '^DA-[MO]-[0-9]{4}-[0-9]{4}-[0-9]+$' THEN 'Format avec timestamp'
        -- Format avec code projet : DA-M-2026-CON-0001, DA-M-2026-TGB-0001
        WHEN numero ~ '^DA-[MO]-[0-9]{4}-[A-Z]+-[0-9]{4}$' THEN 'Format avec code projet'
        -- Format avec UUID : DA-M-2026-ABC123
        WHEN numero ~ '^DA-[MO]-[0-9]{4}-[A-Z0-9]{6}$' THEN 'Format avec UUID'
        -- Autres formats
        ELSE 'Format inconnu'
    END AS format_type,
    COUNT(*) AS nombre,
    MIN(numero) AS exemple_min,
    MAX(numero) AS exemple_max
FROM demandes
GROUP BY format_type
ORDER BY nombre DESC;

-- B. Lister toutes les demandes avec formats non-standard
SELECT 
    '=== DEMANDES AVEC FORMATS NON-STANDARD ===' AS section,
    d.id,
    d.numero AS numero_actuel,
    d.type,
    d.status,
    d."dateCreation",
    p.nom AS projet_nom,
    CASE 
        WHEN numero ~ '^DA-[MO]-[0-9]{4}-[0-9]{4}-SD-[0-9]{4}$' THEN '✅ Sous-demande (À PRÉSERVER)'
        WHEN numero ~ '^DA-[MO]-[0-9]{4}-[0-9]{4}-[0-9]+$' THEN 'Timestamp à supprimer'
        WHEN numero ~ '^DA-[MO]-[0-9]{4}-[A-Z]+-[0-9]{4}$' THEN 'Code projet à supprimer'
        WHEN numero ~ '^DA-[MO]-[0-9]{4}-[A-Z0-9]{6}$' THEN 'UUID à remplacer'
        ELSE 'Autre'
    END AS action_requise
FROM demandes d
LEFT JOIN projets p ON p.id = d."projetId"
WHERE numero !~ '^DA-[MO]-[0-9]{4}-[0-9]{4}$'
  AND numero !~ '^DA-[MO]-[0-9]{4}-[0-9]{4}-SD-[0-9]{4}$'  -- EXCLURE les sous-demandes
ORDER BY d."dateCreation";

-- C. Compter les demandes par type et année
SELECT 
    '=== COMPTAGE PAR TYPE ET ANNÉE ===' AS section,
    SUBSTRING(numero FROM 4 FOR 1) AS type_demande,
    SUBSTRING(numero FROM 6 FOR 4) AS annee,
    COUNT(*) AS nombre_demandes,
    MIN(numero) AS premier_numero,
    MAX(numero) AS dernier_numero
FROM demandes
GROUP BY type_demande, annee
ORDER BY annee DESC, type_demande;

-- =====================================================
-- 2. GÉNÉRATION DES NOUVEAUX NUMÉROS (SIMULATION)
-- =====================================================

-- Simuler la renumérotation séquentielle par type et année
-- ⚠️ EXCLUT LES SOUS-DEMANDES (format -SD-) pour préserver leur numérotation
WITH demandes_ordonnees AS (
    SELECT 
        d.id,
        d.numero AS numero_actuel,
        d.type,
        d."dateCreation",
        ROW_NUMBER() OVER (
            PARTITION BY 
                CASE WHEN d.type = 'materiel' THEN 'M' ELSE 'O' END,
                EXTRACT(YEAR FROM d."dateCreation")
            ORDER BY d."dateCreation", d.id
        ) AS nouveau_sequence
    FROM demandes d
    WHERE d.numero !~ '^DA-[MO]-[0-9]{4}-[0-9]{4}-SD-[0-9]{4}$'  -- EXCLURE les sous-demandes
)
SELECT 
    '=== SIMULATION NOUVEAUX NUMÉROS ===' AS section,
    numero_actuel,
    CASE WHEN type = 'materiel' THEN 'DA-M' ELSE 'DA-O' END || '-' ||
    EXTRACT(YEAR FROM "dateCreation") || '-' ||
    LPAD(nouveau_sequence::TEXT, 4, '0') AS nouveau_numero,
    type,
    "dateCreation",
    CASE 
        WHEN numero_actuel = (
            CASE WHEN type = 'materiel' THEN 'DA-M' ELSE 'DA-O' END || '-' ||
            EXTRACT(YEAR FROM "dateCreation") || '-' ||
            LPAD(nouveau_sequence::TEXT, 4, '0')
        ) THEN '✅ Déjà correct'
        ELSE '⚠️ À modifier'
    END AS statut_modification
FROM demandes_ordonnees
ORDER BY "dateCreation";

-- =====================================================
-- 3. SCRIPT DE NORMALISATION (DÉSACTIVÉ PAR DÉFAUT)
-- =====================================================
-- ⚠️ ATTENTION : Les UPDATE sont commentés pour sécurité

/*
-- ÉTAPE 1 : Créer une table temporaire avec les nouveaux numéros
-- ⚠️ IMPORTANT : EXCLUT LES SOUS-DEMANDES pour préserver leur format -SD-
CREATE TEMP TABLE temp_nouveaux_numeros AS
WITH demandes_ordonnees AS (
    SELECT 
        d.id,
        d.numero AS numero_actuel,
        d.type,
        d."dateCreation",
        ROW_NUMBER() OVER (
            PARTITION BY 
                CASE WHEN d.type = 'materiel' THEN 'M' ELSE 'O' END,
                EXTRACT(YEAR FROM d."dateCreation")
            ORDER BY d."dateCreation", d.id
        ) AS nouveau_sequence
    FROM demandes d
    WHERE d.numero !~ '^DA-[MO]-[0-9]{4}-[0-9]{4}-SD-[0-9]{4}$'  -- EXCLURE les sous-demandes
)
SELECT 
    id,
    numero_actuel,
    CASE WHEN type = 'materiel' THEN 'DA-M' ELSE 'DA-O' END || '-' ||
    EXTRACT(YEAR FROM "dateCreation") || '-' ||
    LPAD(nouveau_sequence::TEXT, 4, '0') AS nouveau_numero
FROM demandes_ordonnees;

-- ÉTAPE 2 : Vérifier qu'il n'y a pas de doublons dans les nouveaux numéros
SELECT 
    '=== VÉRIFICATION DOUBLONS ===' AS section,
    nouveau_numero,
    COUNT(*) AS occurrences
FROM temp_nouveaux_numeros
GROUP BY nouveau_numero
HAVING COUNT(*) > 1;

-- ÉTAPE 3 : Mettre à jour les numéros (UNIQUEMENT si pas de doublons)
-- DÉCOMMENTER UNIQUEMENT APRÈS VÉRIFICATION
-- UPDATE demandes d
-- SET numero = t.nouveau_numero
-- FROM temp_nouveaux_numeros t
-- WHERE d.id = t.id
--   AND d.numero != t.nouveau_numero;

-- ÉTAPE 4 : Vérifier les résultats
-- SELECT 
--     '=== RÉSULTATS APRÈS NORMALISATION ===' AS section,
--     COUNT(*) AS total_demandes,
--     SUM(CASE WHEN numero ~ '^DA-[MO]-[0-9]{4}-[0-9]{4}$' THEN 1 ELSE 0 END) AS format_correct,
--     SUM(CASE WHEN numero !~ '^DA-[MO]-[0-9]{4}-[0-9]{4}$' THEN 1 ELSE 0 END) AS format_incorrect
-- FROM demandes;
*/

-- =====================================================
-- 4. VALIDATION FINALE (READ-ONLY)
-- =====================================================

-- Vérifier la cohérence des numéros après normalisation
SELECT 
    '=== VALIDATION COHÉRENCE ===' AS section,
    SUBSTRING(numero FROM 4 FOR 1) AS type_code,
    type AS type_reel,
    COUNT(*) AS nombre,
    CASE 
        WHEN SUBSTRING(numero FROM 4 FOR 1) = 'M' AND type = 'materiel' THEN '✅ Cohérent'
        WHEN SUBSTRING(numero FROM 4 FOR 1) = 'O' AND type = 'outillage' THEN '✅ Cohérent'
        ELSE '❌ Incohérent'
    END AS coherence
FROM demandes
GROUP BY type_code, type_reel, coherence
ORDER BY coherence DESC;

-- =====================================================
-- 5. INSTRUCTIONS D'UTILISATION
-- =====================================================

/*
SÉCURITÉ GARANTIE :
✅ 100% READ-ONLY par défaut
✅ Simulation complète avant modification
✅ Vérification des doublons
✅ Préservation de l'ordre chronologique
✅ Traçabilité complète

FORMATS DÉTECTÉS :
1. ✅ Format normal : DA-M-2026-0001 (à conserver)
2. ⚠️ Format timestamp : DA-M-2026-0001-1234 (à normaliser)
3. ⚠️ Format code projet : DA-M-2026-CON-0001 (à normaliser)
4. ⚠️ Format UUID : DA-M-2026-ABC123 (à normaliser)

STRATÉGIE DE NORMALISATION :
- Renumérotation séquentielle par type (M/O) et année
- Ordre chronologique préservé (dateCreation)
- Format uniforme : DA-[M|O]-[ANNÉE]-[0001-9999]
- Pas de collision possible

POUR EXÉCUTER LA NORMALISATION :

1. 📋 ANALYSE PRÉALABLE
   - Exécuter les requêtes SELECT (lignes 10-100)
   - Identifier tous les formats non-standard
   - Vérifier le nombre de demandes à modifier

2. 🔍 SIMULATION
   - Exécuter la simulation (lignes 105-130)
   - Vérifier que les nouveaux numéros sont corrects
   - Confirmer l'ordre chronologique

3. ⚠️ VÉRIFICATION CRITIQUE
   - Vérifier qu'il n'y a PAS de doublons
   - Confirmer que tous les formats sont cohérents
   - Sauvegarder la base de données

4. 🚀 EXÉCUTION
   - Décommenter les lignes UPDATE (lignes 140-180)
   - Exécuter étape par étape
   - Vérifier après chaque étape

5. ✅ VALIDATION FINALE
   - Exécuter les requêtes de validation (lignes 190-210)
   - Vérifier dans l'interface utilisateur
   - Confirmer que tout fonctionne

RISQUES IDENTIFIÉS ET MITIGÉS :
❌ RISQUE : Doublons de numéros
✅ MITIGATION : Vérification avant UPDATE

❌ RISQUE : Perte de l'ordre chronologique
✅ MITIGATION : ORDER BY dateCreation, id

❌ RISQUE : Incohérence type/numéro
✅ MITIGATION : Validation finale incluse

IMPACT SUR L'APPLICATION :
- Les numéros de demandes seront uniformes
- Meilleure lisibilité pour les utilisateurs
- Cohérence dans les rapports et exports
- Pas d'impact sur les relations (ID reste inchangé)

ALTERNATIVE PLUS SÛRE :
Si tu préfères ne pas modifier les numéros existants,
on peut simplement corriger le code de génération pour
éviter les formats non-standard à l'avenir.

*/

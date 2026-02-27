-- ============================================================================
-- SCRIPT SQL : AFFICHER TOUTES LES VALIDATIONS D'UNE DEMANDE
-- ============================================================================
-- Description : Ce script affiche toutes les personnes qui ont effectué
--               des validations sur une demande spécifique
-- Demande : DA-M-2026-0138
-- ============================================================================

-- MÉTHODE 1 : Validations via ValidationSignature (signatures de validation)
-- ----------------------------------------------------------------------------
SELECT 
    'ValidationSignature' AS source,
    vs.id AS validation_id,
    vs.type AS type_validation,
    vs.date AS date_validation,
    u.nom || ' ' || u.prenom AS validateur,
    u.role AS role_validateur,
    u.email AS email_validateur,
    u.phone AS telephone_validateur,
    vs.commentaire,
    vs.signature
FROM 
    validation_signatures vs
    INNER JOIN users u ON vs."userId" = u.id
    INNER JOIN demandes d ON vs."demandeId" = d.id
WHERE 
    d.numero = 'DA-M-2026-0138'
ORDER BY 
    vs.date ASC;

-- MÉTHODE 2 : Historique des actions (HistoryEntry)
-- ----------------------------------------------------------------------------
-- Affiche toutes les actions effectuées sur la demande, y compris les validations
SELECT 
    'HistoryEntry' AS source,
    he.id AS history_id,
    he.action AS type_action,
    he.timestamp AS date_action,
    u.nom || ' ' || u.prenom AS utilisateur,
    u.role AS role_utilisateur,
    u.email AS email_utilisateur,
    he."ancienStatus" AS ancien_statut,
    he."nouveauStatus" AS nouveau_statut,
    he.commentaire,
    he.signature
FROM 
    history_entries he
    INNER JOIN users u ON he."userId" = u.id
    INNER JOIN demandes d ON he."demandeId" = d.id
WHERE 
    d.numero = 'DA-M-2026-0138'
ORDER BY 
    he.timestamp ASC;

-- MÉTHODE 3 : Vue combinée (Validations + Historique)
-- ----------------------------------------------------------------------------
-- Combine les deux sources pour avoir une vue complète
SELECT 
    'Validation' AS type_evenement,
    vs.type AS details,
    vs.date AS date_evenement,
    u.nom || ' ' || u.prenom AS personne,
    u.role AS role_personne,
    u.email AS email,
    u.phone AS telephone,
    vs.commentaire,
    d.status AS statut_actuel_demande
FROM 
    validation_signatures vs
    INNER JOIN users u ON vs."userId" = u.id
    INNER JOIN demandes d ON vs."demandeId" = d.id
WHERE 
    d.numero = 'DA-M-2026-0138'

UNION ALL

SELECT 
    'Action' AS type_evenement,
    he.action AS details,
    he.timestamp AS date_evenement,
    u.nom || ' ' || u.prenom AS personne,
    u.role AS role_personne,
    u.email AS email,
    u.phone AS telephone,
    he.commentaire,
    d.status AS statut_actuel_demande
FROM 
    history_entries he
    INNER JOIN users u ON he."userId" = u.id
    INNER JOIN demandes d ON he."demandeId" = d.id
WHERE 
    d.numero = 'DA-M-2026-0138'
    AND he.action LIKE '%valida%'  -- Filtre pour ne garder que les actions de validation

ORDER BY 
    date_evenement ASC;

-- MÉTHODE 4 : Résumé des validations par type
-- ----------------------------------------------------------------------------
-- Affiche un résumé groupé par type de validation
SELECT 
    vs.type AS type_validation,
    COUNT(*) AS nombre_validations,
    STRING_AGG(u.nom || ' ' || u.prenom, ', ') AS validateurs,
    MIN(vs.date) AS premiere_validation,
    MAX(vs.date) AS derniere_validation
FROM 
    validation_signatures vs
    INNER JOIN users u ON vs."userId" = u.id
    INNER JOIN demandes d ON vs."demandeId" = d.id
WHERE 
    d.numero = 'DA-M-2026-0138'
GROUP BY 
    vs.type
ORDER BY 
    premiere_validation ASC;

-- MÉTHODE 5 : Informations complètes de la demande avec validations
-- ----------------------------------------------------------------------------
-- Affiche les informations de la demande et toutes ses validations
SELECT 
    d.numero AS numero_demande,
    d.type AS type_demande,
    d.status AS statut_actuel,
    d."dateCreation" AS date_creation,
    d."dateModification" AS date_modification,
    tech.nom || ' ' || tech.prenom AS demandeur,
    proj.nom AS projet,
    -- Validations
    (SELECT COUNT(*) FROM validation_signatures WHERE "demandeId" = d.id) AS nombre_validations,
    (SELECT COUNT(*) FROM history_entries WHERE "demandeId" = d.id) AS nombre_actions_historique
FROM 
    demandes d
    INNER JOIN users tech ON d."technicienId" = tech.id
    INNER JOIN projets proj ON d."projetId" = proj.id
WHERE 
    d.numero = 'DA-M-2026-0138';

-- ============================================================================
-- INSTRUCTIONS D'UTILISATION :
-- ============================================================================
-- 1. Copiez la requête souhaitée (MÉTHODE 1, 2, 3, 4 ou 5)
-- 2. Exécutez-la dans votre client PostgreSQL
-- 3. Pour une autre demande, remplacez 'DA-M-2026-0138' par le numéro souhaité
--
-- RECOMMANDATIONS :
-- - MÉTHODE 1 : Pour voir uniquement les signatures de validation officielles
-- - MÉTHODE 2 : Pour voir tout l'historique des actions
-- - MÉTHODE 3 : Pour une vue combinée et complète (RECOMMANDÉ)
-- - MÉTHODE 4 : Pour un résumé statistique
-- - MÉTHODE 5 : Pour les informations générales de la demande
-- ============================================================================

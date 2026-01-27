-- Script de vérification pour l'utilisateur 69930545
-- Date: 2026-01-26

-- ÉTAPE 1: Vérifier que l'utilisateur existe
SELECT 
    id, 
    nom, 
    prenom, 
    email, 
    phone, 
    role,
    "createdAt",
    "updatedAt"
FROM users 
WHERE phone = '69930545';

-- ÉTAPE 2: Vérifier les projets assignés à cet utilisateur
SELECT 
    up.id AS "userProjet_id",
    up."userId",
    up."projetId",
    p.nom AS "projet_nom",
    p.description AS "projet_description",
    p.actif AS "projet_actif",
    p."dateDebut",
    p."dateFin"
FROM user_projets up
JOIN users u ON up."userId" = u.id
JOIN projets p ON up."projetId" = p.id
WHERE u.phone = '69930545'
ORDER BY p.nom;

-- ÉTAPE 3: Compter les projets assignés
SELECT 
    COUNT(*) AS "nombre_projets_assignes"
FROM user_projets up
JOIN users u ON up."userId" = u.id
WHERE u.phone = '69930545';

-- ÉTAPE 4: Lister TOUS les projets actifs (pour comparaison)
SELECT 
    id,
    nom,
    description,
    actif,
    "dateDebut",
    "dateFin",
    CASE 
        WHEN LOWER(nom) LIKE '%test%' THEN 'OUI'
        WHEN LOWER(id) LIKE '%test%' THEN 'OUI'
        ELSE 'NON'
    END AS "est_projet_test"
FROM projets
WHERE actif = true
ORDER BY nom;

-- ÉTAPE 5: Vérifier les projets NON-TEST qui devraient être assignés
SELECT 
    p.id,
    p.nom,
    p.actif,
    CASE 
        WHEN up."userId" IS NOT NULL THEN 'ASSIGNÉ'
        ELSE 'NON ASSIGNÉ'
    END AS "statut_assignation"
FROM projets p
LEFT JOIN user_projets up ON p.id = up."projetId" 
    AND up."userId" = (SELECT id FROM users WHERE phone = '69930545')
WHERE 
    p.actif = true
    AND LOWER(p.nom) NOT LIKE '%test%'
    AND LOWER(p.id) NOT LIKE '%test%'
ORDER BY p.nom;

-- ÉTAPE 6: Vérifier s'il y a des doublons dans user_projets
SELECT 
    "userId",
    "projetId",
    COUNT(*) AS "nombre_doublons"
FROM user_projets
WHERE "userId" = (SELECT id FROM users WHERE phone = '69930545')
GROUP BY "userId", "projetId"
HAVING COUNT(*) > 1;

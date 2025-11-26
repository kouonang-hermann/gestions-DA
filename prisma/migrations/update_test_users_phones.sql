-- Script pour attribuer des numéros de téléphone aux utilisateurs de test existants
-- À exécuter APRÈS le script principal (manual_add_phone_unique.sql)

-- Mise à jour des utilisateurs de test avec des numéros réalistes
UPDATE users SET phone = '+33601020304' WHERE email = 'admin@test.com';
UPDATE users SET phone = '+33602030405' WHERE email = 'employe@test.com';
UPDATE users SET phone = '+33603040506' WHERE email = 'conducteur@test.com';
UPDATE users SET phone = '+33604050607' WHERE email = 'qhse@test.com';
UPDATE users SET phone = '+33605060708' WHERE email = 'appro@test.com';
UPDATE users SET phone = '+33606070809' WHERE email = 'charge@test.com';
UPDATE users SET phone = '+33607080910' WHERE email = 'logistique@test.com';

-- Vérification finale
SELECT 
    id, 
    nom, 
    prenom, 
    email, 
    phone, 
    role,
    CASE 
        WHEN phone LIKE '+337%' THEN '⚠️ Temporaire - À remplacer'
        ELSE '✅ Mis à jour'
    END as statut
FROM users 
ORDER BY role, nom;

-- Statistiques
SELECT 
    '📊 Total utilisateurs' as info,
    COUNT(*) as valeur
FROM users
UNION ALL
SELECT 
    '✅ Avec téléphone réel' as info,
    COUNT(*) as valeur
FROM users 
WHERE phone NOT LIKE '+337%'
UNION ALL
SELECT 
    '⚠️ Avec numéro temporaire' as info,
    COUNT(*) as valeur
FROM users 
WHERE phone LIKE '+337%';

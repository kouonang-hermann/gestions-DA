-- Mettre à jour l'email du Super Admin pour les tests
UPDATE users 
SET email = 'hermannfipa@gmail.com'
WHERE role = 'superadmin';

-- Vérifier la mise à jour
SELECT id, nom, prenom, email, role 
FROM users 
WHERE role = 'superadmin';

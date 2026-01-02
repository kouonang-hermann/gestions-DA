-- Migration pour remplacer le rôle responsable_qhse par responsable_logistique
-- Cette migration est nécessaire car l'enum UserRole ne contient plus responsable_qhse

-- Mise à jour de tous les utilisateurs avec le rôle responsable_qhse
UPDATE users 
SET role = 'responsable_logistique' 
WHERE role = 'responsable_qhse';

-- Afficher le nombre d'utilisateurs mis à jour
SELECT COUNT(*) as utilisateurs_mis_a_jour 
FROM users 
WHERE role = 'responsable_logistique';

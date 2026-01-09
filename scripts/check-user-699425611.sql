-- Vérifier si l'utilisateur avec le numéro 699425611 existe
SELECT 
  id,
  nom,
  prenom,
  email,
  phone,
  role,
  "createdAt",
  "updatedAt"
FROM "public"."users"
WHERE phone = '699425611';

-- Vérifier tous les utilisateurs dont le nom contient "Ndando" ou "Alfred"
SELECT 
  id,
  nom,
  prenom,
  email,
  phone,
  role
FROM "public"."users"
WHERE 
  LOWER(nom) LIKE '%ndando%' 
  OR LOWER(prenom) LIKE '%alfred%'
  OR LOWER(nom) LIKE '%alfred%'
  OR LOWER(prenom) LIKE '%ndando%';

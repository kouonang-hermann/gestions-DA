-- Migration manuelle pour ajouter la contrainte UNIQUE sur phone
-- À exécuter dans Supabase SQL Editor

-- Étape 1 : Mettre à jour les utilisateurs sans téléphone avec un numéro temporaire unique
-- (Ajustez selon vos besoins - vous pouvez aussi les définir manuellement)
DO $$
DECLARE
    user_record RECORD;
    counter INT := 1;
BEGIN
    FOR user_record IN 
        SELECT id FROM users WHERE phone IS NULL OR phone = ''
    LOOP
        UPDATE users 
        SET phone = '+33700000' || LPAD(counter::TEXT, 3, '0')
        WHERE id = user_record.id;
        counter := counter + 1;
    END LOOP;
END $$;

-- Étape 2 : Rendre la colonne phone NOT NULL
ALTER TABLE users ALTER COLUMN phone SET NOT NULL;

-- Étape 3 : Ajouter la contrainte UNIQUE sur phone
ALTER TABLE users ADD CONSTRAINT users_phone_key UNIQUE (phone);

-- Vérification : Afficher tous les utilisateurs avec leurs numéros
SELECT id, nom, prenom, email, phone, role FROM users ORDER BY role, nom;

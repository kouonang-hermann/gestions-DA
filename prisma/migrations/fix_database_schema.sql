-- Migration complète pour synchroniser la base de données avec le schéma Prisma
-- Résout tous les problèmes de désynchronisation

-- 1. Rendre la colonne reference nullable pour accepter les valeurs NULL existantes
ALTER TABLE articles ALTER COLUMN reference DROP NOT NULL;

-- 2. Ajouter la colonne fichiersJoints si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'demandes' 
        AND column_name = 'fichiersJoints'
    ) THEN
        ALTER TABLE demandes ADD COLUMN "fichiersJoints" TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- Vérification : afficher les colonnes de la table demandes
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'demandes' 
-- ORDER BY ordinal_position;

-- Vérification : afficher les articles avec reference NULL
-- SELECT id, nom, reference FROM articles WHERE reference IS NULL LIMIT 10;

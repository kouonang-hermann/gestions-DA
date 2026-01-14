-- Migration pour corriger le champ reference dans la table articles
-- Ce champ doit être nullable pour accepter les valeurs NULL existantes

-- Modifier la colonne reference pour accepter les valeurs NULL
ALTER TABLE articles ALTER COLUMN reference DROP NOT NULL;

-- Vérification : afficher les articles avec reference NULL
-- SELECT id, nom, reference FROM articles WHERE reference IS NULL;

-- Migration pour ajouter le système de livraison flexible
-- Ajout des colonnes pour l'assignation du livreur et les dates de livraison

-- Ajouter les nouvelles colonnes à la table demandes
ALTER TABLE demandes 
ADD COLUMN IF NOT EXISTS "livreurAssigneId" TEXT,
ADD COLUMN IF NOT EXISTS "dateReceptionLivreur" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "dateLivraison" TIMESTAMP(3);

-- Ajouter la contrainte de clé étrangère pour livreurAssigne
ALTER TABLE demandes 
ADD CONSTRAINT "demandes_livreurAssigneId_fkey" 
FOREIGN KEY ("livreurAssigneId") REFERENCES users(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Ajouter les nouveaux statuts à l'enum DemandeStatus
-- Note: PostgreSQL nécessite une approche spéciale pour modifier les enums

-- Étape 1: Créer un nouveau type enum avec tous les statuts
DO $$ 
BEGIN
    -- Vérifier si les nouveaux statuts existent déjà
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'en_attente_reception_livreur' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'DemandeStatus')) THEN
        ALTER TYPE "DemandeStatus" ADD VALUE 'en_attente_reception_livreur' AFTER 'en_attente_preparation_appro';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'en_attente_livraison' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'DemandeStatus')) THEN
        ALTER TYPE "DemandeStatus" ADD VALUE 'en_attente_livraison' AFTER 'en_attente_reception_livreur';
    END IF;
END $$;

-- Mettre à jour les demandes existantes avec statut en_attente_validation_livreur vers en_attente_reception_livreur
UPDATE demandes 
SET status = 'en_attente_reception_livreur'
WHERE status = 'en_attente_validation_livreur';

-- Créer un index sur livreurAssigneId pour améliorer les performances des requêtes
CREATE INDEX IF NOT EXISTS "demandes_livreurAssigneId_idx" ON demandes("livreurAssigneId");

-- Créer un index sur les nouveaux statuts pour améliorer les performances
CREATE INDEX IF NOT EXISTS "demandes_status_livraison_idx" ON demandes(status) 
WHERE status IN ('en_attente_reception_livreur', 'en_attente_livraison');

-- Ajouter des commentaires pour la documentation
COMMENT ON COLUMN demandes."livreurAssigneId" IS 'ID de la personne assignée pour effectuer la livraison (peut être le livreur officiel ou un autre employé)';
COMMENT ON COLUMN demandes."dateReceptionLivreur" IS 'Date à laquelle le livreur a confirmé la réception du matériel à livrer';
COMMENT ON COLUMN demandes."dateLivraison" IS 'Date à laquelle le livreur a confirmé avoir effectué la livraison au demandeur';

-- ============================================================================
-- MIGRATION MANUELLE : AJOUT DU SYSTÈME DE CONGÉS ET RÔLES RH/DG
-- ============================================================================
-- Ce script ajoute les nouveaux éléments sans supprimer aucune donnée existante
-- ============================================================================

-- 1. AJOUT DES NOUVEAUX RÔLES DANS L'ENUM UserRole
-- ============================================================================

-- Ajouter le rôle responsable_rh
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'responsable_rh' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')
    ) THEN
        ALTER TYPE "UserRole" ADD VALUE 'responsable_rh';
    END IF;
END $$;

-- Ajouter le rôle directeur_general
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'directeur_general' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')
    ) THEN
        ALTER TYPE "UserRole" ADD VALUE 'directeur_general';
    END IF;
END $$;

-- 2. AJOUT DES NOUVEAUX CHAMPS DANS LA TABLE users
-- ============================================================================

-- Ajouter le champ matricule
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'matricule'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "matricule" TEXT;
    END IF;
END $$;

-- Ajouter le champ service
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'service'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "service" TEXT;
    END IF;
END $$;

-- Ajouter le champ anciennete
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'anciennete'
    ) THEN
        ALTER TABLE "users" ADD COLUMN "anciennete" TEXT;
    END IF;
END $$;

-- 3. CRÉATION DES ENUMS POUR LE SYSTÈME DE CONGÉS
-- ============================================================================

-- Créer l'enum TypeConge
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TypeConge') THEN
        CREATE TYPE "TypeConge" AS ENUM ('annuel', 'maladie', 'parental', 'recuperation', 'autres');
    END IF;
END $$;

-- Créer l'enum CongeStatus
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CongeStatus') THEN
        CREATE TYPE "CongeStatus" AS ENUM (
            'brouillon',
            'soumise',
            'en_attente_validation_hierarchique',
            'en_attente_validation_rh',
            'en_attente_visa_dg',
            'approuvee',
            'rejetee',
            'annulee'
        );
    END IF;
END $$;

-- 4. CRÉATION DE LA TABLE demandes_conges
-- ============================================================================

CREATE TABLE IF NOT EXISTS "demandes_conges" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    
    -- Informations employé
    "employeId" TEXT NOT NULL,
    "matricule" TEXT NOT NULL,
    "anciennete" TEXT NOT NULL,
    
    -- Responsable hiérarchique
    "responsableId" TEXT NOT NULL,
    "responsableNom" TEXT NOT NULL,
    "responsableTel" TEXT NOT NULL,
    "responsableEmail" TEXT NOT NULL,
    
    -- Type et dates de congé
    "typeConge" "TypeConge" NOT NULL,
    "autresPrecision" TEXT,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3) NOT NULL,
    "nombreJours" INTEGER NOT NULL,
    "resteJours" INTEGER,
    
    -- Contacts d'urgence
    "contactPersonnelNom" TEXT NOT NULL,
    "contactPersonnelTel" TEXT NOT NULL,
    "contactAutreNom" TEXT,
    "contactAutreTel" TEXT,
    
    -- Workflow et statut
    "status" "CongeStatus" NOT NULL DEFAULT 'brouillon',
    
    -- Signatures de validation avec modifications possibles
    "signatureEmploye" JSONB,
    "signatureResponsable" JSONB,
    "signatureRH" JSONB,
    "signatureDG" JSONB,
    
    -- Dates finales après modifications
    "dateDebutFinale" TIMESTAMP(3),
    "dateFinFinale" TIMESTAMP(3),
    "nombreJoursFinal" INTEGER,
    
    -- Métadonnées
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModification" TIMESTAMP(3) NOT NULL,
    "dateSoumission" TIMESTAMP(3),
    "dateValidation" TIMESTAMP(3),
    "rejetMotif" TEXT,

    CONSTRAINT "demandes_conges_pkey" PRIMARY KEY ("id")
);

-- 5. CRÉATION DES INDEX ET CONTRAINTES
-- ============================================================================

-- Index unique sur le numéro de demande
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename = 'demandes_conges' AND indexname = 'demandes_conges_numero_key'
    ) THEN
        CREATE UNIQUE INDEX "demandes_conges_numero_key" ON "demandes_conges"("numero");
    END IF;
END $$;

-- 6. CRÉATION DES FOREIGN KEYS
-- ============================================================================

-- Foreign key vers users pour employeId
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'demandes_conges_employeId_fkey'
    ) THEN
        ALTER TABLE "demandes_conges" 
        ADD CONSTRAINT "demandes_conges_employeId_fkey" 
        FOREIGN KEY ("employeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Foreign key vers users pour responsableId
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'demandes_conges_responsableId_fkey'
    ) THEN
        ALTER TABLE "demandes_conges" 
        ADD CONSTRAINT "demandes_conges_responsableId_fkey" 
        FOREIGN KEY ("responsableId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================

-- Afficher un message de confirmation
DO $$ 
BEGIN
    RAISE NOTICE '✅ Migration terminée avec succès !';
    RAISE NOTICE '   - Rôles ajoutés : responsable_rh, directeur_general';
    RAISE NOTICE '   - Champs users ajoutés : matricule, service, anciennete';
    RAISE NOTICE '   - Table demandes_conges créée';
    RAISE NOTICE '   - Enums TypeConge et CongeStatus créés';
END $$;

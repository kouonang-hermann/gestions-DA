-- ============================================================================
-- Migration de synchronisation production
-- Corrige les désynchronisations entre prisma/schema.prisma et la DB de prod
-- ============================================================================
--
-- À exécuter UNE SEULE FOIS sur la base de production (Supabase SQL Editor
-- ou psql). Toutes les opérations sont idempotentes (IF NOT EXISTS / IF EXISTS)
-- donc le script peut être ré-exécuté sans danger.
--
-- Problèmes corrigés :
--   1. demandes_absences.superieurHierarchiqueId  →  responsableId
--   2. users.signature + signatureUpdatedAt        (colonnes manquantes)
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. demandes_absences : renommer superieurHierarchiqueId → responsableId
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'demandes_absences'
      AND column_name = 'superieurHierarchiqueId'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'demandes_absences'
      AND column_name = 'responsableId'
  ) THEN
    ALTER TABLE "public"."demandes_absences"
      RENAME COLUMN "superieurHierarchiqueId" TO "responsableId";
  END IF;
END $$;

-- Renommer l'index si encore sous l'ancien nom
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'demandes_absences_superieurHierarchiqueId_idx'
  ) THEN
    ALTER INDEX "public"."demandes_absences_superieurHierarchiqueId_idx"
      RENAME TO "demandes_absences_responsableId_idx";
  END IF;
END $$;

-- Renommer la contrainte de clé étrangère
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'demandes_absences'
      AND constraint_name = 'demandes_absences_superieurHierarchiqueId_fkey'
  ) THEN
    ALTER TABLE "public"."demandes_absences"
      RENAME CONSTRAINT "demandes_absences_superieurHierarchiqueId_fkey"
      TO "demandes_absences_responsableId_fkey";
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. demandes_absences : colonnes ajoutées par le schema.prisma actuel
-- ----------------------------------------------------------------------------
ALTER TABLE "public"."demandes_absences"
  ADD COLUMN IF NOT EXISTS "signatureEmploye" JSONB,
  ADD COLUMN IF NOT EXISTS "signatureResponsable" JSONB,
  ADD COLUMN IF NOT EXISTS "signatureRH" JSONB,
  ADD COLUMN IF NOT EXISTS "signatureDG" JSONB,
  ADD COLUMN IF NOT EXISTS "dateDebutFinale" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "dateFinFinale" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "nombreJoursFinal" INTEGER;

-- Le schéma utilise un type String pour typeAbsence (pas l'enum). Si l'enum
-- TypeAbsence existe encore, on convertit la colonne en TEXT.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'demandes_absences'
      AND column_name = 'typeAbsence'
      AND udt_name = 'TypeAbsence'
  ) THEN
    ALTER TABLE "public"."demandes_absences"
      ALTER COLUMN "typeAbsence" TYPE TEXT USING "typeAbsence"::text;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 3. users : colonnes signature manuscrite (ajoutées dans le Lot 1 signature)
-- ----------------------------------------------------------------------------
ALTER TABLE "public"."users"
  ADD COLUMN IF NOT EXISTS "signature" TEXT,
  ADD COLUMN IF NOT EXISTS "signatureUpdatedAt" TIMESTAMP(3);

COMMENT ON COLUMN "public"."users"."signature"
  IS 'Signature manuscrite numérique (data URL base64 PNG) capturée une seule fois et réutilisée sur tous les documents signés par cet utilisateur';
COMMENT ON COLUMN "public"."users"."signatureUpdatedAt"
  IS 'Horodatage de la dernière création/modification de la signature';

-- ----------------------------------------------------------------------------
-- 4. AbsenceStatus : ajouter les nouveaux statuts utilisés par l'API actuelle
--    (en_attente_validation_hierarchique / _rh / _visa_dg)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  -- en_attente_validation_hierarchique
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'AbsenceStatus'
      AND e.enumlabel = 'en_attente_validation_hierarchique'
  ) THEN
    ALTER TYPE "AbsenceStatus" ADD VALUE 'en_attente_validation_hierarchique';
  END IF;

  -- en_attente_validation_rh
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'AbsenceStatus'
      AND e.enumlabel = 'en_attente_validation_rh'
  ) THEN
    ALTER TYPE "AbsenceStatus" ADD VALUE 'en_attente_validation_rh';
  END IF;

  -- en_attente_visa_dg
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'AbsenceStatus'
      AND e.enumlabel = 'en_attente_visa_dg'
  ) THEN
    ALTER TYPE "AbsenceStatus" ADD VALUE 'en_attente_visa_dg';
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- Vérifications post-migration (à exécuter manuellement)
-- ============================================================================
-- 1) Vérifier que responsableId existe :
--    SELECT column_name FROM information_schema.columns
--    WHERE table_name = 'demandes_absences' AND column_name = 'responsableId';
--
-- 2) Vérifier que users.signature existe :
--    SELECT column_name FROM information_schema.columns
--    WHERE table_name = 'users' AND column_name IN ('signature','signatureUpdatedAt');
--
-- 3) Lister les valeurs de l'enum AbsenceStatus :
--    SELECT enumlabel FROM pg_enum
--    WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'AbsenceStatus')
--    ORDER BY enumsortorder;

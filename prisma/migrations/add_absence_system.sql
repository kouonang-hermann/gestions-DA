-- Migration pour ajouter le système de demandes d'absence

-- Créer l'enum pour les types d'absence
CREATE TYPE "TypeAbsence" AS ENUM (
  'maladie',
  'personnelle',
  'familiale',
  'formation',
  'autre'
);

-- Créer l'enum pour les statuts de demande d'absence
CREATE TYPE "AbsenceStatus" AS ENUM (
  'brouillon',
  'soumise',
  'en_attente_validation',
  'approuvee',
  'rejetee',
  'annulee'
);

-- Créer la table des demandes d'absence
CREATE TABLE "demandes_absences" (
  "id" TEXT NOT NULL,
  "numero" TEXT NOT NULL,
  "employeId" TEXT NOT NULL,
  "superieurHierarchiqueId" TEXT NOT NULL,
  "typeAbsence" "TypeAbsence" NOT NULL,
  "motif" TEXT NOT NULL,
  "dateDebut" TIMESTAMP(3) NOT NULL,
  "dateFin" TIMESTAMP(3) NOT NULL,
  "nombreJours" INTEGER NOT NULL,
  "status" "AbsenceStatus" NOT NULL DEFAULT 'brouillon',
  "commentaireEmploye" TEXT,
  "commentaireSuperieur" TEXT,
  "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dateModification" TIMESTAMP(3) NOT NULL,
  "dateSoumission" TIMESTAMP(3),
  "dateValidation" TIMESTAMP(3),
  "rejetMotif" TEXT,

  CONSTRAINT "demandes_absences_pkey" PRIMARY KEY ("id")
);

-- Créer les index
CREATE UNIQUE INDEX "demandes_absences_numero_key" ON "demandes_absences"("numero");
CREATE INDEX "demandes_absences_employeId_idx" ON "demandes_absences"("employeId");
CREATE INDEX "demandes_absences_superieurHierarchiqueId_idx" ON "demandes_absences"("superieurHierarchiqueId");
CREATE INDEX "demandes_absences_status_idx" ON "demandes_absences"("status");

-- Ajouter les contraintes de clés étrangères
ALTER TABLE "demandes_absences" ADD CONSTRAINT "demandes_absences_employeId_fkey" FOREIGN KEY ("employeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "demandes_absences" ADD CONSTRAINT "demandes_absences_superieurHierarchiqueId_fkey" FOREIGN KEY ("superieurHierarchiqueId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

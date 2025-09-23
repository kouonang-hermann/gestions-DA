-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('superadmin', 'employe', 'conducteur_travaux', 'responsable_travaux', 'responsable_qhse', 'responsable_appro', 'charge_affaire', 'responsable_logistique');

-- CreateEnum
CREATE TYPE "public"."DemandeType" AS ENUM ('materiel', 'outillage');

-- CreateEnum
CREATE TYPE "public"."DemandeStatus" AS ENUM ('brouillon', 'soumise', 'en_attente_validation_conducteur', 'en_attente_validation_qhse', 'en_attente_validation_responsable_travaux', 'en_attente_validation_charge_affaire', 'en_attente_preparation_appro', 'en_attente_validation_logistique', 'en_attente_validation_finale_demandeur', 'confirmee_demandeur', 'cloturee', 'rejetee', 'archivee');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."projets" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL,
    "dateFin" TIMESTAMP(3),
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT NOT NULL,

    CONSTRAINT "projets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user_projets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,

    CONSTRAINT "user_projets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."articles" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "unite" TEXT NOT NULL,
    "type" "public"."DemandeType" NOT NULL,
    "stock" INTEGER,
    "prixUnitaire" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."demandes" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "projetId" TEXT NOT NULL,
    "technicienId" TEXT NOT NULL,
    "type" "public"."DemandeType" NOT NULL,
    "status" "public"."DemandeStatus" NOT NULL DEFAULT 'brouillon',
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModification" TIMESTAMP(3) NOT NULL,
    "dateSortie" TIMESTAMP(3),
    "dateValidationFinale" TIMESTAMP(3),
    "dateLivraisonSouhaitee" TIMESTAMP(3),
    "commentaires" TEXT,
    "rejetMotif" TEXT,

    CONSTRAINT "demandes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."item_demandes" (
    "id" TEXT NOT NULL,
    "demandeId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "quantiteDemandee" INTEGER NOT NULL,
    "quantiteValidee" INTEGER,
    "quantiteSortie" INTEGER,
    "quantiteRecue" INTEGER,
    "commentaire" TEXT,

    CONSTRAINT "item_demandes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."validation_signatures" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "demandeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "commentaire" TEXT,
    "signature" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "validation_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sortie_signatures" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "demandeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "commentaire" TEXT,
    "signature" TEXT NOT NULL,
    "quantitesSorties" JSONB NOT NULL,
    "modifiable" BOOLEAN NOT NULL DEFAULT true,
    "dateModificationLimite" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sortie_signatures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."history_entries" (
    "id" TEXT NOT NULL,
    "demandeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "ancienStatus" "public"."DemandeStatus",
    "nouveauStatus" "public"."DemandeStatus",
    "commentaire" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signature" TEXT NOT NULL,

    CONSTRAINT "history_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "lu" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "demandeId" TEXT,
    "projetId" TEXT,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_projets_userId_projetId_key" ON "public"."user_projets"("userId", "projetId");

-- CreateIndex
CREATE UNIQUE INDEX "articles_reference_key" ON "public"."articles"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "demandes_numero_key" ON "public"."demandes"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "validation_signatures_demandeId_type_key" ON "public"."validation_signatures"("demandeId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "sortie_signatures_demandeId_key" ON "public"."sortie_signatures"("demandeId");

-- AddForeignKey
ALTER TABLE "public"."projets" ADD CONSTRAINT "projets_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_projets" ADD CONSTRAINT "user_projets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."user_projets" ADD CONSTRAINT "user_projets_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "public"."projets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."demandes" ADD CONSTRAINT "demandes_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "public"."projets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."demandes" ADD CONSTRAINT "demandes_technicienId_fkey" FOREIGN KEY ("technicienId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."item_demandes" ADD CONSTRAINT "item_demandes_demandeId_fkey" FOREIGN KEY ("demandeId") REFERENCES "public"."demandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."item_demandes" ADD CONSTRAINT "item_demandes_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "public"."articles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."validation_signatures" ADD CONSTRAINT "validation_signatures_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."validation_signatures" ADD CONSTRAINT "validation_signatures_demandeId_fkey" FOREIGN KEY ("demandeId") REFERENCES "public"."demandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sortie_signatures" ADD CONSTRAINT "sortie_signatures_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sortie_signatures" ADD CONSTRAINT "sortie_signatures_demandeId_fkey" FOREIGN KEY ("demandeId") REFERENCES "public"."demandes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."history_entries" ADD CONSTRAINT "history_entries_demandeId_fkey" FOREIGN KEY ("demandeId") REFERENCES "public"."demandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."history_entries" ADD CONSTRAINT "history_entries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_demandeId_fkey" FOREIGN KEY ("demandeId") REFERENCES "public"."demandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notifications" ADD CONSTRAINT "notifications_projetId_fkey" FOREIGN KEY ("projetId") REFERENCES "public"."projets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

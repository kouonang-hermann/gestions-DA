-- Migration manuelle pour ajouter le système de signature numérique par utilisateur
-- Une seule signature par utilisateur, stockée sur son profil et réutilisée
-- automatiquement sur tous les documents qu'il signe (congés, absences,
-- demandes matériel/outillage, bons de sortie/livraison).

-- Ajouter la colonne signature (data URL base64 PNG)
-- Format attendu : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "signature" TEXT;

-- Date de dernière mise à jour de la signature (audit / cache invalidation)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "signatureUpdatedAt" TIMESTAMP(3);

-- Commentaires pour documentation
COMMENT ON COLUMN "users"."signature" IS 'Signature manuscrite numérique (data URL base64 PNG) capturée une seule fois et réutilisée sur tous les documents signés par cet utilisateur';
COMMENT ON COLUMN "users"."signatureUpdatedAt" IS 'Horodatage de la dernière création/modification de la signature';

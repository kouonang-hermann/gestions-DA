-- Migration manuelle pour ajouter le système de traçabilité des rejets
-- Cette migration ajoute deux nouveaux champs au modèle Demande

-- Ajouter le champ nombreRejets avec valeur par défaut 0
ALTER TABLE "demandes" ADD COLUMN IF NOT EXISTS "nombreRejets" INTEGER NOT NULL DEFAULT 0;

-- Ajouter le champ statusPrecedent (nullable)
ALTER TABLE "demandes" ADD COLUMN IF NOT EXISTS "statusPrecedent" TEXT;

-- Commentaires pour documentation
COMMENT ON COLUMN "demandes"."nombreRejets" IS 'Compteur de rejets pour traçabilité';
COMMENT ON COLUMN "demandes"."statusPrecedent" IS 'Statut avant le rejet (pour retour arrière)';

/**
 * Applique la migration "add_user_signature.sql" via le client Prisma.
 *
 * Strictement additif (ALTER TABLE ADD COLUMN IF NOT EXISTS) — aucune
 * suppression, aucune modification de donnees existantes.
 *
 * Usage: npx tsx scripts/apply-signature-migration.ts
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("[migration] Application de add_user_signature.sql ...\n")

  // 1) Compter les utilisateurs AVANT pour preuve de non-destruction
  const usersBefore = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
    `SELECT COUNT(*)::bigint as count FROM "users"`
  )
  const countBefore = Number(usersBefore[0]?.count ?? 0)
  console.log(`[migration] Utilisateurs en base AVANT : ${countBefore}`)

  // 2) Appliquer les ALTER TABLE (idempotents grace a IF NOT EXISTS)
  console.log("[migration] -> ALTER TABLE users ADD COLUMN signature ...")
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "signature" TEXT`
  )

  console.log("[migration] -> ALTER TABLE users ADD COLUMN signatureUpdatedAt ...")
  await prisma.$executeRawUnsafe(
    `ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "signatureUpdatedAt" TIMESTAMP(3)`
  )

  // 3) Commentaires (documentation)
  await prisma.$executeRawUnsafe(
    `COMMENT ON COLUMN "users"."signature" IS 'Signature manuscrite numerique (data URL base64 PNG) capturee une seule fois et reutilisee sur tous les documents signes par cet utilisateur'`
  )
  await prisma.$executeRawUnsafe(
    `COMMENT ON COLUMN "users"."signatureUpdatedAt" IS 'Horodatage de la derniere creation/modification de la signature'`
  )

  // 4) Verifier que les colonnes existent
  const cols = await prisma.$queryRawUnsafe<
    { column_name: string; data_type: string; is_nullable: string }[]
  >(
    `SELECT column_name, data_type, is_nullable
     FROM information_schema.columns
     WHERE table_name = 'users'
       AND column_name IN ('signature', 'signatureUpdatedAt')
     ORDER BY column_name`
  )
  console.log("\n[migration] Colonnes ajoutees :")
  console.table(cols)

  // 5) Compter les utilisateurs APRES (preuve de non-destruction)
  const usersAfter = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
    `SELECT COUNT(*)::bigint as count FROM "users"`
  )
  const countAfter = Number(usersAfter[0]?.count ?? 0)
  console.log(`[migration] Utilisateurs en base APRES : ${countAfter}`)

  if (countBefore !== countAfter) {
    throw new Error(
      `INCOHERENCE : ${countBefore} -> ${countAfter} utilisateurs. STOP.`
    )
  }

  console.log("\n[migration] OK - Migration appliquee avec succes (aucune donnee touchee)")
}

main()
  .catch((e) => {
    console.error("[migration] ECHEC :", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

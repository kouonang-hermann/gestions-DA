/**
 * Seed des utilisateurs spécifiques au workflow des demandes de congés.
 *
 * Ce script ajoute les comptes manquants pour tester le workflow complet :
 *   - Responsable RH (rôle: responsable_rh)
 *   - Directeur Général (rôle: directeur_general)
 *
 * Il crée également un employé dédié au test des congés rattaché à un
 * responsable hiérarchique existant.
 *
 * Lancer avec : npx tsx scripts/seed-conges-users.ts
 */

import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import crypto from "crypto"

const prisma = new PrismaClient()

async function upsertUser(params: {
  email: string
  nom: string
  prenom: string
  phone: string
  password: string
  role: any
  matricule?: string
  anciennete?: string
  service?: string
}) {
  const hashed = await bcrypt.hash(params.password, 12)
  const user = await prisma.user.upsert({
    where: { email: params.email },
    update: {
      role: params.role,
      nom: params.nom,
      prenom: params.prenom,
      phone: params.phone,
      ...(params.matricule ? { matricule: params.matricule } : {}),
      ...(params.anciennete ? { anciennete: params.anciennete } : {}),
      ...(params.service ? { service: params.service } : {}),
    },
    create: {
      id: crypto.randomUUID(),
      email: params.email,
      nom: params.nom,
      prenom: params.prenom,
      phone: params.phone,
      password: hashed,
      role: params.role,
      ...(params.matricule ? { matricule: params.matricule } : {}),
      ...(params.anciennete ? { anciennete: params.anciennete } : {}),
      ...(params.service ? { service: params.service } : {}),
      updatedAt: new Date(),
    },
  })
  console.log(`  ✅ ${params.role.padEnd(22)} ${params.email}  (mdp: ${params.password})`)
  return user
}

async function main() {
  console.log("\n🌱 Seed des utilisateurs pour le workflow CONGÉS\n")

  // 1) Responsable RH (étape 2 du workflow)
  await upsertUser({
    email: "rh@test.com",
    nom: "Ressources",
    prenom: "Humaines",
    phone: "600000010",
    password: "rh123",
    role: "responsable_rh",
    service: "Ressources Humaines",
  })

  // 2) Directeur Général (étape 3 / visa final)
  await upsertUser({
    email: "dg@test.com",
    nom: "Général",
    prenom: "Directeur",
    phone: "600000011",
    password: "dg123",
    role: "directeur_general",
    service: "Direction Générale",
  })

  // 3) Employé dédié aux tests de congés (avec matricule + ancienneté pré-remplis)
  await upsertUser({
    email: "employe-conges@test.com",
    nom: "Testeur",
    prenom: "Congés",
    phone: "600000012",
    password: "conges123",
    role: "employe" as any,
    matricule: "MAT-2026-001",
    anciennete: "3 ans",
    service: "Production",
  })

  console.log("\n✅ Tous les comptes nécessaires au workflow congés sont prêts.\n")
}

main()
  .catch((e) => {
    console.error("❌ Erreur seed :", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Début du seeding...')

  // Hash du mot de passe par défaut
  const hashedPassword = await bcrypt.hash('password', 12)

  // Hash des mots de passe de test
  const testPasswordHashes = {
    admin123: await bcrypt.hash('admin123', 12),
    employe123: await bcrypt.hash('employe123', 12),
    responsable123: await bcrypt.hash('responsable123', 12),
    conducteur123: await bcrypt.hash('conducteur123', 12),
    logistique123: await bcrypt.hash('logistique123', 12),
    appro123: await bcrypt.hash('appro123', 12),
    charge123: await bcrypt.hash('charge123', 12),
    livreur123: await bcrypt.hash('livreur123', 12),
  }

  // Créer les utilisateurs (incluant ceux pour les tests)
  const users = await Promise.all([
    // Utilisateurs de production
    prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        nom: 'Admin',
        prenom: 'Super',
        email: 'admin@example.com',
        phone: '610000001',
        password: hashedPassword,
        role: 'superadmin',
      },
    }),
    prisma.user.upsert({
      where: { email: 'jean.dupont@example.com' },
      update: {},
      create: {
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean.dupont@example.com',
        phone: '610000002',
        password: hashedPassword,
        role: 'employe' as any,
      },
    }),
    prisma.user.upsert({
      where: { email: 'pierre.martin@example.com' },
      update: {},
      create: {
        nom: 'Martin',
        prenom: 'Pierre',
        email: 'pierre.martin@example.com',
        phone: '610000003',
        password: hashedPassword,
        role: 'conducteur_travaux',
      },
    }),
    prisma.user.upsert({
      where: { email: 'marie.durand@example.com' },
      update: {},
      create: {
        nom: 'Durand',
        prenom: 'Marie',
        email: 'marie.durand@example.com',
        phone: '610000004',
        password: hashedPassword,
        role: 'responsable_logistique',
      },
    }),
    prisma.user.upsert({
      where: { email: 'paul.bernard@example.com' },
      update: {},
      create: {
        nom: 'Bernard',
        prenom: 'Paul',
        email: 'paul.bernard@example.com',
        phone: '610000005',
        password: hashedPassword,
        role: 'responsable_appro',
      },
    }),
    prisma.user.upsert({
      where: { email: 'sophie.moreau@example.com' },
      update: {},
      create: {
        nom: 'Moreau',
        prenom: 'Sophie',
        email: 'sophie.moreau@example.com',
        phone: '610000006',
        password: hashedPassword,
        role: 'charge_affaire',
      },
    }),
    // Utilisateurs de test pour le flow de validation complet
    // FLOW MATÉRIEL: Employé → Conducteur → Resp. Travaux → Chargé Affaire → Appro → Livreur → Demandeur
    // FLOW OUTILLAGE: Employé → Logistique → Resp. Travaux → Chargé Affaire → Logistique (finale) → Livreur → Demandeur
    prisma.user.upsert({
      where: { email: 'admin@test.com' },
      update: {},
      create: {
        nom: 'Admin',
        prenom: 'Test',
        email: 'admin@test.com',
        phone: '600000001',
        password: testPasswordHashes.admin123,
        role: 'superadmin',
      },
    }),
    prisma.user.upsert({
      where: { email: 'employe@test.com' },
      update: {},
      create: {
        nom: 'Employé',
        prenom: 'Test',
        email: 'employe@test.com',
        phone: '600000002',
        password: testPasswordHashes.employe123,
        role: 'employe' as any,
      },
    }),
    prisma.user.upsert({
      where: { email: 'conducteur@test.com' },
      update: {},
      create: {
        nom: 'Conducteur',
        prenom: 'Test',
        email: 'conducteur@test.com',
        phone: '600000003',
        password: testPasswordHashes.conducteur123,
        role: 'conducteur_travaux',
      },
    }),
    prisma.user.upsert({
      where: { email: 'responsable-travaux@test.com' },
      update: {},
      create: {
        nom: 'Responsable Travaux',
        prenom: 'Test',
        email: 'responsable-travaux@test.com',
        phone: '600000004',
        password: testPasswordHashes.responsable123,
        role: 'responsable_travaux' as any,
      },
    }),
    prisma.user.upsert({
      where: { email: 'logistique@test.com' },
      update: {},
      create: {
        nom: 'Logistique',
        prenom: 'Test',
        email: 'logistique@test.com',
        phone: '600000005',
        password: testPasswordHashes.logistique123,
        role: 'responsable_logistique',
      },
    }),
    prisma.user.upsert({
      where: { email: 'appro@test.com' },
      update: {},
      create: {
        nom: 'Appro',
        prenom: 'Test',
        email: 'appro@test.com',
        phone: '600000006',
        password: testPasswordHashes.appro123,
        role: 'responsable_appro',
      },
    }),
    prisma.user.upsert({
      where: { email: 'charge@test.com' },
      update: {},
      create: {
        nom: 'Chargé Affaire',
        prenom: 'Test',
        email: 'charge@test.com',
        phone: '600000007',
        password: testPasswordHashes.charge123,
        role: 'charge_affaire',
      },
    }),
    prisma.user.upsert({
      where: { email: 'livreur@test.com' },
      update: {},
      create: {
        nom: 'Livreur',
        prenom: 'Test',
        email: 'livreur@test.com',
        phone: '600000009',
        password: testPasswordHashes.livreur123,
        role: 'responsable_livreur',
      },
    }),
  ])

  console.log('✅ Utilisateurs créés')

  // Créer un projet de test
  const projet = await prisma.projet.upsert({
    where: { id: 'projet-test-1' },
    update: {},
    create: {
      id: 'projet-test-1',
      nom: 'Projet de Construction Alpha',
      description: 'Projet de construction d\'un bâtiment industriel',
      dateDebut: new Date('2024-01-01'),
      dateFin: new Date('2024-12-31'),
      createdBy: users[0].id, // Super Admin
      actif: true,
    },
  })

  console.log('✅ Projet créé')

  // Assigner UNIQUEMENT les utilisateurs test au projet test (indices 6-13 = utilisateurs @test.com)
  // Les utilisateurs de production (indices 0-5) ne sont PAS assignés au projet test
  const testUsers = users.slice(6) // Utilisateurs test uniquement
  await Promise.all(
    testUsers.map((user) =>
      prisma.userProjet.upsert({
        where: {
          userId_projetId: {
            userId: user.id,
            projetId: projet.id,
          },
        },
        update: {},
        create: {
          userId: user.id,
          projetId: projet.id,
        },
      })
    )
  )

  console.log(`✅ ${testUsers.length} utilisateurs test assignés au projet`)

  // Créer des articles de test
  const articles = await Promise.all([
    prisma.article.create({
      data: {
        nom: 'Casque de sécurité',
        description: 'Casque de sécurité conforme aux normes EN 397',
        reference: 'MAT-001',
        unite: 'pièce',
        type: 'materiel',
        stock: 100,
        prixUnitaire: 12.50,
      },
    }),
    prisma.article.create({
      data: {
        nom: 'Perceuse électrique',
        description: 'Perceuse électrique 18V avec batterie',
        reference: 'OUT-001',
        unite: 'pièce',
        type: 'outillage',
        stock: 10,
        prixUnitaire: 150.00,
      },
    }),
    prisma.article.create({
      data: {
        nom: 'Gants de protection',
        description: 'Gants de protection en cuir renforcé',
        reference: 'MAT-002',
        unite: 'paire',
        type: 'materiel',
        stock: 100,
        prixUnitaire: 12.50,
      },
    }),
  ])

  console.log('✅ Articles créés')

  console.log('🎉 Seeding terminé avec succès!')
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

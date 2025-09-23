const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

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
    qhse123: await bcrypt.hash('qhse123', 12),
    appro123: await bcrypt.hash('appro123', 12),
    charge123: await bcrypt.hash('charge123', 12),
    logistique123: await bcrypt.hash('logistique123', 12),
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
        password: hashedPassword,
        role: 'employe',
      },
    }),
    prisma.user.upsert({
      where: { email: 'pierre.martin@example.com' },
      update: {},
      create: {
        nom: 'Martin',
        prenom: 'Pierre',
        email: 'pierre.martin@example.com',
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
        password: hashedPassword,
        role: 'responsable_qhse',
      },
    }),
    prisma.user.upsert({
      where: { email: 'paul.bernard@example.com' },
      update: {},
      create: {
        nom: 'Bernard',
        prenom: 'Paul',
        email: 'paul.bernard@example.com',
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
        password: hashedPassword,
        role: 'charge_affaire',
      },
    }),
    // Utilisateurs de test (correspondant au script test-validation-flow.js)
    prisma.user.upsert({
      where: { email: 'admin@test.com' },
      update: {},
      create: {
        nom: 'Admin',
        prenom: 'Test',
        email: 'admin@test.com',
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
        password: testPasswordHashes.employe123,
        role: 'employe',
      },
    }),
    prisma.user.upsert({
      where: { email: 'responsable-travaux@test.com' },
      update: {},
      create: {
        nom: 'Responsable Travaux',
        prenom: 'Test',
        email: 'responsable-travaux@test.com',
        password: testPasswordHashes.responsable123,
        role: 'responsable_travaux',
      },
    }),
    prisma.user.upsert({
      where: { email: 'conducteur@test.com' },
      update: {},
      create: {
        nom: 'Conducteur',
        prenom: 'Test',
        email: 'conducteur@test.com',
        password: testPasswordHashes.conducteur123,
        role: 'conducteur_travaux',
      },
    }),
    prisma.user.upsert({
      where: { email: 'qhse@test.com' },
      update: {},
      create: {
        nom: 'QHSE',
        prenom: 'Test',
        email: 'qhse@test.com',
        password: testPasswordHashes.qhse123,
        role: 'responsable_qhse',
      },
    }),
    prisma.user.upsert({
      where: { email: 'appro@test.com' },
      update: {},
      create: {
        nom: 'Appro',
        prenom: 'Test',
        email: 'appro@test.com',
        password: testPasswordHashes.appro123,
        role: 'responsable_appro',
      },
    }),
    prisma.user.upsert({
      where: { email: 'charge@test.com' },
      update: {},
      create: {
        nom: 'Charge',
        prenom: 'Test',
        email: 'charge@test.com',
        password: testPasswordHashes.charge123,
        role: 'charge_affaire',
      },
    }),
    prisma.user.upsert({
      where: { email: 'logistique@test.com' },
      update: {},
      create: {
        nom: 'Logistique',
        prenom: 'Test',
        email: 'logistique@test.com',
        password: testPasswordHashes.logistique123,
        role: 'responsable_logistique',
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

  // Assigner tous les utilisateurs (sauf le superadmin créateur) au projet
  await Promise.all(
    users.slice(1).map((user) =>
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

  console.log('✅ Utilisateurs assignés au projet')

  // Créer des articles de test
  const articles = await Promise.all([
    prisma.article.upsert({
      where: { reference: 'MAT-001' },
      update: {},
      create: {
        nom: 'Casque de sécurité',
        description: 'Casque de sécurité conforme aux normes EN 397',
        reference: 'MAT-001',
        unite: 'pièce',
        type: 'materiel',
        stock: 100,
        prixUnitaire: 12.50,
      },
    }),
    prisma.article.upsert({
      where: { reference: 'OUT-001' },
      update: {},
      create: {
        nom: 'Perceuse électrique',
        description: 'Perceuse électrique 18V avec batterie',
        reference: 'OUT-001',
        unite: 'pièce',
        type: 'outillage',
        stock: 10,
        prixUnitaire: 150.00,
      },
    }),
    prisma.article.upsert({
      where: { reference: 'MAT-002' },
      update: {},
      create: {
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

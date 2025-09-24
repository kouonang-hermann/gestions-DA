import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  // Sécurité : seulement en mode développement ou avec un secret
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== 'seed-database-2024') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('🌱 Début du seeding...')

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

    // Créer les utilisateurs de test
    const users = await Promise.all([
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

    return NextResponse.json({
      success: true,
      message: 'Base de données seedée avec succès',
      users: users.length,
      accounts: [
        'admin@test.com / admin123',
        'employe@test.com / employe123',
        'conducteur@test.com / conducteur123',
        'qhse@test.com / qhse123',
        'appro@test.com / appro123',
        'charge@test.com / charge123',
        'logistique@test.com / logistique123'
      ]
    })

  } catch (error) {
    console.error('Erreur lors du seeding:', error)
    return NextResponse.json({ 
      error: 'Erreur lors du seeding', 
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

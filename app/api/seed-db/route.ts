import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  // Sécurité : seulement en mode développement ou avec un secret
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== 'seed-database-2024') {
    return NextResponse.json({ error: 'Unauthorized', message: 'Secret requis' }, { status: 401 })
  }

  try {

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
          id: crypto.randomUUID(),
          nom: 'Admin',
          prenom: 'Test',
          email: 'admin@test.com',
          phone: '600000001',
          password: testPasswordHashes.admin123,
          role: 'superadmin',
          updatedAt: new Date(),
        },
      }),
      prisma.user.upsert({
        where: { email: 'employe@test.com' },
        update: {},
        create: {
          id: crypto.randomUUID(),
          nom: 'Employé',
          prenom: 'Test',
          email: 'employe@test.com',
          phone: '600000002',
          password: testPasswordHashes.employe123,
          role: 'employe' as any,
          updatedAt: new Date(),
        },
      }),
      prisma.user.upsert({
        where: { email: 'conducteur@test.com' },
        update: {},
        create: {
          id: crypto.randomUUID(),
          nom: 'Conducteur',
          prenom: 'Test',
          email: 'conducteur@test.com',
          phone: '600000003',
          password: testPasswordHashes.conducteur123,
          role: 'conducteur_travaux',
          updatedAt: new Date(),
        },
      }),
      prisma.user.upsert({
        where: { email: 'qhse@test.com' },
        update: {},
        create: {
          id: crypto.randomUUID(),
          nom: 'QHSE',
          prenom: 'Test',
          email: 'logistique@test.com',
          phone: '600000005',
          password: testPasswordHashes.qhse123,
          role: 'responsable_logistique',
          updatedAt: new Date(),
        },
      }),
      prisma.user.upsert({
        where: { email: 'appro@test.com' },
        update: {},
        create: {
          id: crypto.randomUUID(),
          nom: 'Appro',
          prenom: 'Test',
          email: 'appro@test.com',
          phone: '600000006',
          password: testPasswordHashes.appro123,
          role: 'responsable_appro',
          updatedAt: new Date(),
        },
      }),
      prisma.user.upsert({
        where: { email: 'charge@test.com' },
        update: {},
        create: {
          id: crypto.randomUUID(),
          nom: 'Charge',
          prenom: 'Test',
          email: 'charge@test.com',
          phone: '600000007',
          password: testPasswordHashes.charge123,
          role: 'charge_affaire',
          updatedAt: new Date(),
        },
      }),
      prisma.user.upsert({
        where: { email: 'logistique@test.com' },
        update: {},
        create: {
          id: crypto.randomUUID(),
          nom: 'Logistique',
          prenom: 'Test',
          email: 'livreur@test.com',
          phone: '600000008',
          password: testPasswordHashes.logistique123,
          role: 'responsable_livreur',
          updatedAt: new Date(),
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      message: 'Base de données seedée avec succès',
      users: users.length,
      accounts: [
        '600000001 (Super Admin) / admin123',
        '600000002 (Employé) / employe123',
        '600000003 (Conducteur) / conducteur123',
        '600000005 (QHSE) / qhse123',
        '600000006 (Appro) / appro123',
        '600000007 (Chargé Affaire) / charge123',
        '600000008 (Logistique) / logistique123'
      ]
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Erreur lors du seeding', 
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

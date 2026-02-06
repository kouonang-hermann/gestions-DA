import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  // Sécurité : seulement en mode développement ou avec un secret
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== 'seed-database-2024') {
    return NextResponse.json({ error: 'Unauthorized', message: 'Secret requis' }, { status: 401 })
  }

  try {

    // Récupérer l'employé de test
    const employe = await prisma.user.findUnique({
      where: { email: 'employe@test.com' }
    })

    if (!employe) {
      return NextResponse.json({ 
        error: 'Employé de test non trouvé', 
        message: 'Veuillez d\'abord exécuter /api/seed-db?secret=seed-database-2024'
      }, { status: 404 })
    }

    // Récupérer ou créer un projet de test
    let projet = await prisma.projet.findFirst({
      where: { nom: 'Projet Test Clôture' }
    })

    if (!projet) {
      projet = await prisma.projet.create({
        data: {
          id: crypto.randomUUID(),
          nom: 'Projet Test Clôture',
          description: 'Projet de test pour les demandes à clôturer',
          dateDebut: new Date(),
          createdBy: employe.id,
          updatedAt: new Date()
        }
      })

      // Assigner l'employé au projet
      await prisma.userProjet.create({
        data: {
          id: crypto.randomUUID(),
          userId: employe.id,
          projetId: projet.id
        }
      })
    }

    // Créer des articles de test (référence n'est plus unique, on crée toujours de nouveaux articles)
    const casque = await prisma.article.create({
      data: {
        id: crypto.randomUUID(),
        nom: 'Casque de chantier',
        description: 'Casque de protection pour chantier',
        reference: 'ART-CASQUE-001',
        unite: 'pièce',
        type: 'materiel',
        stock: 100,
        updatedAt: new Date()
      }
    })

    const gants = await prisma.article.create({
      data: {
        id: crypto.randomUUID(),
        nom: 'Gants de protection',
        description: 'Gants de protection industriels',
        reference: 'ART-GANTS-001',
        unite: 'paire',
        type: 'materiel',
        stock: 200,
        updatedAt: new Date()
      }
    })

    const perceuse = await prisma.article.create({
      data: {
        id: crypto.randomUUID(),
        nom: 'Perceuse électrique',
        description: 'Perceuse électrique professionnelle',
        reference: 'ART-PERCEUSE-001',
        unite: 'pièce',
        type: 'outillage',
        stock: 50,
        updatedAt: new Date()
      }
    })

    const tournevis = await prisma.article.create({
      data: {
        id: crypto.randomUUID(),
        nom: 'Jeu de tournevis',
        description: 'Set de tournevis professionnels',
        reference: 'ART-TOURNEVIS-001',
        unite: 'set',
        type: 'outillage',
        stock: 80,
        updatedAt: new Date()
      }
    })

    const chaussures = await prisma.article.create({
      data: {
        id: crypto.randomUUID(),
        nom: 'Chaussures de sécurité',
        description: 'Chaussures de sécurité normées',
        reference: 'ART-CHAUSSURES-001',
        unite: 'paire',
        type: 'materiel',
        stock: 150,
        updatedAt: new Date()
      }
    })

    // Créer des demandes de test avec différents statuts
    const demandes = []

    // Demande 1 : En attente de validation finale (prête à clôturer)
    const demande1 = await prisma.demande.create({
      data: {
        id: crypto.randomUUID(),
        numero: `DA-CLOTURE-${Date.now()}-1`,
        type: 'materiel',
        status: 'en_attente_validation_finale_demandeur' as any,
        technicienId: employe.id,
        projetId: projet.id,
        commentaires: 'Demande de matériel prête à être clôturée - En attente de validation finale',
        dateModification: new Date(),
        items: {
          create: [
            {
              id: crypto.randomUUID(),
              articleId: casque.id,
              quantiteDemandee: 5
            },
            {
              id: crypto.randomUUID(),
              articleId: gants.id,
              quantiteDemandee: 10
            }
          ]
        }
      }
    })
    demandes.push(demande1)

    // Demande 2 : Confirmée par le demandeur (prête à clôturer)
    const demande2 = await prisma.demande.create({
      data: {
        id: crypto.randomUUID(),
        numero: `DA-CLOTURE-${Date.now()}-2`,
        type: 'outillage',
        status: 'confirmee_demandeur' as any,
        technicienId: employe.id,
        projetId: projet.id,
        commentaires: 'Demande d\'outillage confirmée - Prête à être clôturée définitivement',
        dateModification: new Date(),
        items: {
          create: [
            {
              id: crypto.randomUUID(),
              articleId: perceuse.id,
              quantiteDemandee: 2
            },
            {
              id: crypto.randomUUID(),
              articleId: tournevis.id,
              quantiteDemandee: 3
            }
          ]
        }
      }
    })
    demandes.push(demande2)

    // Demande 3 : En attente de validation finale (autre demande)
    const demande3 = await prisma.demande.create({
      data: {
        id: crypto.randomUUID(),
        numero: `DA-CLOTURE-${Date.now()}-3`,
        type: 'materiel',
        status: 'en_attente_validation_finale_demandeur' as any,
        technicienId: employe.id,
        projetId: projet.id,
        commentaires: 'Matériel de sécurité livré - En attente de votre validation',
        dateModification: new Date(),
        items: {
          create: [
            {
              id: crypto.randomUUID(),
              articleId: chaussures.id,
              quantiteDemandee: 8
            }
          ]
        }
      }
    })
    demandes.push(demande3)


    return NextResponse.json({
      success: true,
      message: 'Demandes à clôturer créées avec succès',
      demandes: demandes.map(d => ({
        numero: d.numero,
        type: d.type,
        status: d.status,
        commentaires: d.commentaires
      })),
      instructions: [
        '1. Connectez-vous avec le compte employé : 600000002 / employe123',
        '2. Allez sur le dashboard employé',
        '3. Vous devriez voir 3 demandes dans la carte "Mes demandes à clôturer"',
        '4. Cliquez sur "Clôturer" pour finaliser chaque demande'
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

import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { requireAuth } from '@/lib/auth'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  // Authentification requise
  const authResult = await requireAuth(req)
  if (!authResult.success) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const currentUser = authResult.user

  try {
    console.log('🔧 Correction des demandes à clôturer...')
    console.log(`👤 Utilisateur connecté: ${currentUser.nom} ${currentUser.prenom}`)
    console.log(`   - ID: ${currentUser.id}`)
    console.log(`   - Email: ${currentUser.email}`)
    console.log(`   - Rôle: ${currentUser.role}`)

    // Récupérer toutes les demandes créées par le seeding
    const demandesACorreger = await prisma.demande.findMany({
      where: {
        numero: {
          startsWith: 'DA-CLOTURE-'
        }
      },
      include: {
        items: {
          include: {
            article: true
          }
        }
      }
    })

    console.log(`📋 Demandes trouvées: ${demandesACorreger.length}`)

    if (demandesACorreger.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Aucune demande à corriger trouvée. Veuillez d\'abord exécuter /api/seed-demandes-cloture?secret=seed-database-2024'
      })
    }

    // Mettre à jour le technicienId de toutes ces demandes avec l'utilisateur connecté
    const updatePromises = demandesACorreger.map(demande =>
      prisma.demande.update({
        where: { id: demande.id },
        data: {
          technicienId: currentUser.id
        }
      })
    )

    await Promise.all(updatePromises)

    console.log(`✅ ${demandesACorreger.length} demandes corrigées avec succès`)

    return NextResponse.json({
      success: true,
      message: `${demandesACorreger.length} demandes corrigées avec succès`,
      demandes: demandesACorreger.map(d => ({
        numero: d.numero,
        type: d.type,
        status: d.status,
        ancienTechnicienId: d.technicienId,
        nouveauTechnicienId: currentUser.id,
        items: d.items.map(item => ({
          article: item.article.nom,
          quantite: item.quantiteDemandee
        }))
      })),
      instructions: [
        '✅ Les demandes ont été assignées à votre compte',
        '🔄 Rechargez la page (F5) pour voir les demandes dans la carte "Mes demandes à clôturer"',
        `📧 Vous êtes connecté en tant que: ${currentUser.nom} ${currentUser.prenom} (${currentUser.email})`
      ]
    })

  } catch (error) {
    console.error('Erreur lors de la correction:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la correction', 
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

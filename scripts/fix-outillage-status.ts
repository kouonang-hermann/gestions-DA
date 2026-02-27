import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

async function fixOutillageApproStatus() {
  console.log('🔧 CORRECTION: Demandes d\'outillage avec statut en_attente_preparation_appro\n')
  console.log('=' .repeat(80))

  try {
    // ÉTAPE 1: Vérification avant correction
    console.log('\n📊 ÉTAPE 1: VÉRIFICATION AVANT CORRECTION\n')
    
    const demandesACorreger = await prisma.demande.findMany({
      where: {
        type: 'outillage',
        status: 'en_attente_preparation_appro'
      },
      include: {
        projet: {
          select: {
            nom: true
          }
        },
        technicien: {
          select: {
            nom: true,
            prenom: true
          }
        }
      },
      orderBy: {
        dateCreation: 'desc'
      }
    })

    console.log(`Total demandes d'outillage à corriger: ${demandesACorreger.length}\n`)

    if (demandesACorreger.length === 0) {
      console.log('✅ Aucune demande à corriger. Toutes les demandes d\'outillage ont le bon statut.\n')
      return
    }

    console.log('📋 Liste des demandes à corriger:\n')
    demandesACorreger.forEach((d, index) => {
      console.log(`${index + 1}. ${d.numero}`)
      console.log(`   Projet: ${d.projet.nom}`)
      console.log(`   Demandeur: ${d.technicien.prenom} ${d.technicien.nom}`)
      console.log(`   Statut actuel: ${d.status} ❌`)
      console.log(`   Date création: ${d.dateCreation.toLocaleDateString('fr-FR')}`)
      console.log('')
    })

    console.log('=' .repeat(80))
    console.log('\n⚠️  ATTENTION: Ces demandes vont être corrigées vers le statut "en_attente_preparation_logistique"\n')

    // ÉTAPE 2: Correction des statuts
    console.log('🔄 ÉTAPE 2: CORRECTION DES STATUTS\n')

    const demandeIds = demandesACorreger.map(d => d.id)
    
    // Mettre à jour les demandes
    const updateResult = await prisma.demande.updateMany({
      where: {
        id: {
          in: demandeIds
        },
        type: 'outillage',
        status: 'en_attente_preparation_appro'
      },
      data: {
        status: 'en_attente_preparation_logistique',
        dateModification: new Date()
      }
    })

    console.log(`✅ ${updateResult.count} demandes mises à jour avec succès\n`)

    // ÉTAPE 3: Ajouter des entrées dans l'historique
    console.log('📝 ÉTAPE 3: AJOUT D\'ENTRÉES DANS L\'HISTORIQUE\n')

    let historyCount = 0
    for (const demande of demandesACorreger) {
      await prisma.historyEntry.create({
        data: {
          id: crypto.randomUUID(),
          demandeId: demande.id,
          userId: demande.technicienId,
          action: 'Correction automatique du statut',
          ancienStatus: 'en_attente_preparation_appro',
          nouveauStatus: 'en_attente_preparation_logistique',
          timestamp: new Date(),
          signature: 'SYSTEM',
          commentaire: 'Correction automatique: demande d\'outillage avec statut matériel corrigé vers le statut outillage approprié (en_attente_preparation_logistique)'
        }
      })
      historyCount++
    }

    console.log(`✅ ${historyCount} entrées d'historique créées\n`)

    // ÉTAPE 4: Vérification après correction
    console.log('=' .repeat(80))
    console.log('\n✅ ÉTAPE 4: VÉRIFICATION APRÈS CORRECTION\n')

    const demandesCorrigees = await prisma.demande.count({
      where: {
        type: 'outillage',
        status: 'en_attente_preparation_logistique',
        id: {
          in: demandeIds
        }
      }
    })

    console.log(`Demandes corrigées avec succès: ${demandesCorrigees}`)

    // Vérifier qu'il ne reste plus de demandes d'outillage avec statut appro
    const demandesRestantes = await prisma.demande.count({
      where: {
        type: 'outillage',
        status: 'en_attente_preparation_appro'
      }
    })

    console.log(`Demandes d'outillage restantes avec statut appro: ${demandesRestantes}`)

    if (demandesRestantes === 0) {
      console.log('\n🎉 SUCCÈS: Toutes les demandes d\'outillage ont maintenant le bon statut!\n')
    } else {
      console.log(`\n⚠️  ATTENTION: Il reste ${demandesRestantes} demandes d'outillage avec statut appro\n`)
    }

    // ÉTAPE 5: Statistiques finales
    console.log('=' .repeat(80))
    console.log('\n📊 ÉTAPE 5: STATISTIQUES FINALES\n')

    const statsOutillage = await prisma.demande.groupBy({
      by: ['status'],
      where: {
        type: 'outillage',
        status: {
          in: ['en_attente_preparation_appro', 'en_attente_preparation_logistique']
        }
      },
      _count: true
    })

    console.log('Répartition des demandes d\'outillage:')
    statsOutillage.forEach(stat => {
      const icon = stat.status === 'en_attente_preparation_logistique' ? '✅' : '❌'
      console.log(`  ${icon} ${stat.status}: ${stat._count}`)
    })

    console.log('\n' + '=' .repeat(80))
    console.log('\n✅ CORRECTION TERMINÉE AVEC SUCCÈS\n')

  } catch (error) {
    console.error('\n❌ ERREUR lors de la correction:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter la correction
fixOutillageApproStatus()
  .then(() => {
    console.log('✅ Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })

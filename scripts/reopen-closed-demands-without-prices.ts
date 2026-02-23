/**
 * Script pour réouvrir les demandes clôturées qui ont des articles sans prix
 * 
 * Ce script identifie toutes les demandes avec le statut "cloturee" qui contiennent
 * des articles (items) dont le prixUnitaire n'a pas été renseigné, et les ramène
 * au statut "en_attente_preparation_appro" pour permettre la saisie des prix.
 * 
 * Contexte : Après l'implémentation du système de sous-demandes et de calcul de prix,
 * certaines demandes ont été clôturées avant que les prix ne soient renseignés.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface DemandeWithoutPrices {
  id: string
  numero: string
  status: string
  itemsSansPrix: number
  totalItems: number
}

async function findDemandesClotureesWithoutPrices(): Promise<DemandeWithoutPrices[]> {
  console.log('🔍 Recherche des demandes clôturées avec articles sans prix...\n')

  // Récupérer toutes les demandes clôturées
  const demandesCloturees = await prisma.demande.findMany({
    where: {
      status: 'cloturee'
    },
    include: {
      items: true,
      projet: {
        select: {
          id: true,
          nom: true
        }
      },
      technicien: {
        select: {
          id: true,
          nom: true,
          prenom: true
        }
      }
    }
  })

  console.log(`📊 Total de demandes clôturées : ${demandesCloturees.length}`)

  // Filtrer celles qui ont des items sans prix
  const demandesWithoutPrices: DemandeWithoutPrices[] = []

  for (const demande of demandesCloturees) {
    const itemsSansPrix = demande.items.filter(item => 
      item.prixUnitaire === null || 
      item.prixUnitaire === undefined || 
      item.prixUnitaire === 0
    )

    if (itemsSansPrix.length > 0) {
      demandesWithoutPrices.push({
        id: demande.id,
        numero: demande.numero,
        status: demande.status,
        itemsSansPrix: itemsSansPrix.length,
        totalItems: demande.items.length
      })

      console.log(`\n📦 Demande ${demande.numero}:`)
      console.log(`   - Projet: ${demande.projet?.nom || 'N/A'}`)
      console.log(`   - Demandeur: ${demande.technicien?.prenom} ${demande.technicien?.nom}`)
      console.log(`   - Articles sans prix: ${itemsSansPrix.length}/${demande.items.length}`)
      console.log(`   - Articles concernés:`)
      
      for (const item of itemsSansPrix) {
        console.log(`     • Article ID: ${item.articleId}`)
        console.log(`       Quantité demandée: ${item.quantiteDemandee}`)
        console.log(`       Prix actuel: ${item.prixUnitaire || 'Non renseigné'}`)
      }
    }
  }

  console.log(`\n✅ Trouvé ${demandesWithoutPrices.length} demande(s) à réouvrir\n`)
  
  return demandesWithoutPrices
}

async function reopenDemandes(demandes: DemandeWithoutPrices[], dryRun: boolean = true) {
  if (demandes.length === 0) {
    console.log('ℹ️  Aucune demande à réouvrir.')
    return
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log(`${dryRun ? '🧪 MODE TEST' : '⚠️  MODE RÉEL'} - ${demandes.length} demande(s) à traiter`)
  console.log(`${'='.repeat(60)}\n`)

  for (const demande of demandes) {
    console.log(`\n📝 Traitement de ${demande.numero}...`)

    if (dryRun) {
      console.log(`   [TEST] Changerait le statut: cloturee → en_attente_preparation_appro`)
      console.log(`   [TEST] Ajouterait une entrée dans l'historique`)
    } else {
      try {
        // Mettre à jour le statut de la demande
        await prisma.demande.update({
          where: { id: demande.id },
          data: {
            status: 'en_attente_preparation_appro',
            statusPrecedent: 'cloturee'
          }
        })

        // Ajouter une entrée dans l'historique
        await prisma.historyEntry.create({
          data: {
            id: `reopen-${demande.id}-${Date.now()}`,
            demandeId: demande.id,
            userId: 'system', // Utilisateur système
            action: 'reouverture_pour_saisie_prix',
            ancienStatus: 'cloturee',
            nouveauStatus: 'en_attente_preparation_appro',
            commentaire: `Demande réouverte automatiquement pour permettre la saisie des prix. ${demande.itemsSansPrix} article(s) sans prix sur ${demande.totalItems} total.`,
            signature: `system-reopen-${Date.now()}`
          }
        })

        console.log(`   ✅ Demande ${demande.numero} réouverte avec succès`)
      } catch (error) {
        console.error(`   ❌ Erreur lors de la réouverture de ${demande.numero}:`, error)
      }
    }
  }

  console.log(`\n${'='.repeat(60)}`)
  console.log(`${dryRun ? '✅ Test terminé' : '✅ Réouverture terminée'}`)
  console.log(`${'='.repeat(60)}\n`)
}

async function main() {
  try {
    console.log('\n' + '='.repeat(60))
    console.log('🔧 SCRIPT DE RÉOUVERTURE DES DEMANDES CLÔTURÉES SANS PRIX')
    console.log('='.repeat(60) + '\n')

    // Étape 1 : Trouver les demandes concernées
    const demandesWithoutPrices = await findDemandesClotureesWithoutPrices()

    if (demandesWithoutPrices.length === 0) {
      console.log('✅ Aucune demande clôturée sans prix trouvée. Tout est en ordre!\n')
      return
    }

    // Étape 2 : Afficher un résumé
    console.log('\n📊 RÉSUMÉ:')
    console.log(`   - Demandes à réouvrir: ${demandesWithoutPrices.length}`)
    console.log(`   - Total d'articles sans prix: ${demandesWithoutPrices.reduce((sum, d) => sum + d.itemsSansPrix, 0)}`)
    
    // Étape 3 : Exécution en mode TEST d'abord
    console.log('\n⚠️  Exécution en MODE TEST (aucune modification en base)...')
    await reopenDemandes(demandesWithoutPrices, true)

    // Étape 4 : Demander confirmation pour l'exécution réelle
    console.log('\n' + '='.repeat(60))
    console.log('⚠️  ATTENTION : Pour exécuter réellement ce script:')
    console.log('   1. Vérifiez les demandes listées ci-dessus')
    console.log('   2. Modifiez la ligne dans main() : dryRun = false')
    console.log('   3. Relancez le script')
    console.log('='.repeat(60) + '\n')

    // Pour exécuter réellement, décommentez la ligne suivante et commentez celle du dessus
    // await reopenDemandes(demandesWithoutPrices, false)

  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution du script:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le script
main()
  .then(() => {
    console.log('✅ Script terminé avec succès\n')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })

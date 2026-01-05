/**
 * Script pour diagnostiquer le problème de l'utilisateur Aristide (super admin)
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkAristide() {
  console.log('\n🔍 Diagnostic de l\'utilisateur Aristide (super admin)...\n')

  try {
    // Rechercher l'utilisateur Aristide
    const aristide = await prisma.user.findFirst({
      where: {
        OR: [
          { prenom: { contains: 'Aristide', mode: 'insensitive' } },
          { nom: { contains: 'Aristide', mode: 'insensitive' } }
        ]
      },
      include: {
        projets: {
          include: {
            projet: true
          }
        }
      }
    })

    if (!aristide) {
      console.log('❌ Utilisateur Aristide non trouvé!\n')
      
      // Chercher tous les super admins
      const superAdmins = await prisma.user.findMany({
        where: { role: 'superadmin' }
      })

      console.log(`📋 Super admins trouvés: ${superAdmins.length}\n`)
      superAdmins.forEach(admin => {
        console.log(`   - ${admin.prenom} ${admin.nom} (${admin.phone})`)
      })
      
      return
    }

    console.log('✅ Utilisateur trouvé!\n')
    console.log('📋 Informations:')
    console.log(`   ID: ${aristide.id}`)
    console.log(`   Nom: ${aristide.prenom} ${aristide.nom}`)
    console.log(`   Téléphone: ${aristide.phone}`)
    console.log(`   Email: ${aristide.email || 'Non défini'}`)
    console.log(`   Rôle: ${aristide.role}`)
    console.log(`   Admin: ${aristide.isAdmin ? 'Oui' : 'Non'}`)
    console.log(`   Créé le: ${aristide.createdAt.toLocaleString('fr-FR')}`)
    console.log()

    // Vérifier les projets
    console.log(`📁 Projets assignés: ${aristide.projets.length}`)
    if (aristide.projets.length > 0) {
      aristide.projets.forEach(up => {
        console.log(`   - ${up.projet.nom}`)
      })
    } else {
      console.log('   ⚠️  PROBLÈME: Aucun projet assigné!')
      console.log('   💡 Un super admin devrait voir toutes les demandes même sans projet')
    }
    console.log()

    // Vérifier les demandes
    const totalDemandes = await prisma.demande.count()
    console.log(`📊 Total demandes dans la base: ${totalDemandes}`)

    // Demandes en attente de validation
    const demandesEnAttente = await prisma.demande.findMany({
      where: {
        status: {
          in: [
            'soumise',
            'en_attente_validation_conducteur',
            'en_attente_validation_responsable_travaux',
            'en_attente_validation_charge_affaire',
            'en_attente_preparation_appro',
            'en_attente_validation_logistique',
            'en_attente_reception_livreur',
            'en_attente_validation_finale_demandeur'
          ]
        }
      }
    })

    console.log(`📊 Demandes en attente: ${demandesEnAttente.length}`)
    console.log()

    // Analyser par statut
    const statusCount: Record<string, number> = {}
    demandesEnAttente.forEach(d => {
      statusCount[d.status] = (statusCount[d.status] || 0) + 1
    })

    console.log('📊 Répartition par statut:')
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`)
    })
    console.log()

    // Vérifier si le super admin devrait voir toutes les demandes
    if (aristide.role === 'superadmin') {
      console.log('✅ Aristide est bien super admin')
      console.log('💡 Il devrait voir TOUTES les demandes (pas de filtrage par projet)')
      console.log()

      if (aristide.projets.length === 0) {
        console.log('⚠️  PROBLÈME IDENTIFIÉ:')
        console.log('   Le super admin n\'a aucun projet assigné')
        console.log('   Le code frontend filtre peut-être par projet')
        console.log()
        console.log('🔧 SOLUTIONS POSSIBLES:')
        console.log('   1. Vérifier le code du dashboard admin')
        console.log('   2. S\'assurer que le filtrage par projet est désactivé pour superadmin')
        console.log('   3. Ou assigner tous les projets au super admin')
        console.log()
      }
    } else {
      console.log('❌ PROBLÈME: Aristide n\'est pas super admin!')
      console.log(`   Rôle actuel: ${aristide.role}`)
      console.log()
      console.log('🔧 CORRECTION: Mettre à jour le rôle en superadmin...')

      await prisma.user.update({
        where: { id: aristide.id },
        data: { 
          role: 'superadmin',
          isAdmin: true
        }
      })

      console.log('✅ Rôle mis à jour en superadmin!')
      console.log()
    }

    // Vérifier le code de filtrage
    console.log('🔍 VÉRIFICATION DU CODE:')
    console.log('   Fichier à vérifier: stores/useStore.ts')
    console.log('   Fonction: loadDemandes()')
    console.log('   Vérifier que le super admin voit toutes les demandes')
    console.log()

  } catch (error) {
    console.error('\n❌ ERREUR:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

checkAristide()
  .then(() => {
    console.log('✅ Diagnostic terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur lors du diagnostic:', error)
    process.exit(1)
  })

/**
 * Script pour diagnostiquer le problème de connexion de l'utilisateur Djamen
 */

import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function checkDjamen() {
  console.log('\n🔍 Diagnostic de l\'utilisateur Djamen...\n')

  try {
    // Rechercher l'utilisateur Djamen
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { prenom: { contains: 'Djamen', mode: 'insensitive' } },
          { nom: { contains: 'Djamen', mode: 'insensitive' } }
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

    if (users.length === 0) {
      console.log('❌ Aucun utilisateur trouvé avec le nom "Djamen"!\n')
      
      // Chercher tous les utilisateurs pour voir les noms disponibles
      const allUsers = await prisma.user.findMany({
        select: {
          id: true,
          prenom: true,
          nom: true,
          phone: true,
          role: true
        },
        take: 20
      })

      console.log('📋 Premiers utilisateurs dans la base:')
      allUsers.forEach(u => {
        console.log(`   - ${u.prenom} ${u.nom} (${u.phone}) - ${u.role}`)
      })
      console.log()
      
      return
    }

    console.log(`✅ ${users.length} utilisateur(s) trouvé(s):\n`)

    for (const user of users) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📋 Informations du compte:')
      console.log(`   ID: ${user.id}`)
      console.log(`   Nom: ${user.prenom} ${user.nom}`)
      console.log(`   Téléphone: ${user.phone}`)
      console.log(`   Email: ${user.email || 'Non défini'}`)
      console.log(`   Rôle: ${user.role}`)
      console.log(`   Admin: ${user.isAdmin ? 'Oui' : 'Non'}`)
      console.log(`   Créé le: ${user.createdAt.toLocaleString('fr-FR')}`)
      console.log(`   Mis à jour le: ${user.updatedAt.toLocaleString('fr-FR')}`)
      console.log()

      // Vérifier le mot de passe
      console.log('🔐 Vérification du mot de passe:')
      console.log(`   Hash: ${user.password.substring(0, 30)}...`)
      
      // Tester avec des mots de passe courants
      const commonPasswords = [
        user.phone.replace('+237', ''),
        'password',
        'Password123',
        'Temp123!',
        '123456',
        'djamen',
        'Djamen123'
      ]

      console.log('\n🔍 Test avec mots de passe courants:')
      let passwordWorks = false
      let workingPassword = ''

      for (const pwd of commonPasswords) {
        const isValid = await bcrypt.compare(pwd, user.password)
        console.log(`   ${pwd}: ${isValid ? '✅ FONCTIONNE' : '❌ Non'}`)
        if (isValid) {
          passwordWorks = true
          workingPassword = pwd
        }
      }
      console.log()

      // Vérifier les projets
      console.log(`📁 Projets assignés: ${user.projets.length}`)
      if (user.projets.length > 0) {
        console.log('   Premiers projets:')
        user.projets.slice(0, 5).forEach(up => {
          console.log(`   - ${up.projet.nom}`)
        })
        if (user.projets.length > 5) {
          console.log(`   ... et ${user.projets.length - 5} autres`)
        }
      } else {
        console.log('   ⚠️  Aucun projet assigné')
      }
      console.log()

      // Diagnostic final
      console.log('📊 DIAGNOSTIC:')
      
      if (!passwordWorks) {
        console.log('   ❌ PROBLÈME: Mot de passe inconnu ou non standard')
        console.log()
        console.log('🔧 SOLUTION:')
        console.log('   Réinitialiser le mot de passe avec le script ci-dessous')
        console.log()
      } else {
        console.log(`   ✅ Mot de passe fonctionnel: ${workingPassword}`)
        console.log()
        console.log('💡 INFORMATIONS DE CONNEXION:')
        console.log(`   Téléphone: ${user.phone.replace('+237', '')}`)
        console.log(`   Mot de passe: ${workingPassword}`)
        console.log()
      }

      if (user.projets.length === 0 && user.role !== 'superadmin') {
        console.log('   ⚠️  ATTENTION: Aucun projet assigné')
        console.log('   L\'utilisateur ne pourra pas voir de demandes')
        console.log()
      }
      console.log()
    }

  } catch (error) {
    console.error('\n❌ ERREUR:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

checkDjamen()
  .then(() => {
    console.log('✅ Diagnostic terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur lors du diagnostic:', error)
    process.exit(1)
  })

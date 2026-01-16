/**
 * Script pour diagnostiquer le problème de connexion de l'utilisateur 655813782
 */

import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function checkUser() {
  console.log('\n🔍 Diagnostic de l\'utilisateur 655813782...\n')

  try {
    // Rechercher l'utilisateur avec différentes variantes du numéro
    const phoneVariants = [
      '655813782',
      '+237655813782',
      '237655813782'
    ]

    console.log('📞 Recherche avec les variantes:')
    phoneVariants.forEach(v => console.log(`   - ${v}`))
    console.log()

    let user = null
    let foundWith = ''

    for (const phone of phoneVariants) {
      const found = await prisma.user.findUnique({
        where: { phone },
        include: {
          projets: {
            include: {
              projet: true
            }
          }
        }
      })

      if (found) {
        user = found
        foundWith = phone
        break
      }
    }

    if (!user) {
      console.log('❌ Utilisateur NON TROUVÉ avec aucune variante!\n')
      
      // Chercher tous les utilisateurs avec un numéro similaire
      const allUsers = await prisma.user.findMany({
        where: {
          phone: {
            contains: '655813782'
          }
        }
      })

      if (allUsers.length > 0) {
        console.log('⚠️  Utilisateurs avec numéro similaire trouvés:')
        allUsers.forEach(u => {
          console.log(`   - ${u.prenom} ${u.nom} (${u.phone})`)
        })
        console.log()
      }

      console.log('💡 SOLUTION: Créer l\'utilisateur avec le script create-user-655813782.ts')
      console.log()
      return
    }

    console.log(`✅ Utilisateur trouvé avec: ${foundWith}\n`)
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
      '655813782',
      'password',
      'Password123',
      'Temp123!',
      '123456'
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
      user.projets.forEach(up => {
        console.log(`   - ${up.projet.nom}`)
      })
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
      console.log('   1. Réinitialiser le mot de passe avec create-user-655813782.ts')
      console.log('   2. Ou utiliser l\'API de changement de mot de passe')
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

  } catch (error) {
    console.error('\n❌ ERREUR:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

checkUser()
  .then(() => {
    console.log('✅ Diagnostic terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur lors du diagnostic:', error)
    process.exit(1)
  })

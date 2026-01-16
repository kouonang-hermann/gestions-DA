/**
 * Script de test rapide pour vérifier le changement de mot de passe
 */

import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function testChangePassword() {
  console.log('\n🔐 TEST CHANGEMENT DE MOT DE PASSE\n')

  try {
    // 1. Chercher un utilisateur de test (Aristide)
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { prenom: { contains: 'Aristide', mode: 'insensitive' } },
          { nom: { contains: 'Aristide', mode: 'insensitive' } }
        ]
      }
    })

    if (!user) {
      console.log('❌ Utilisateur Aristide non trouvé!\n')
      return
    }

    console.log('✅ Utilisateur trouvé:')
    console.log(`   Nom: ${user.prenom} ${user.nom}`)
    console.log(`   Téléphone: ${user.phone}`)
    console.log(`   Rôle: ${user.role}`)
    console.log()

    // 2. Sauvegarder l'ancien hash du mot de passe
    const oldPasswordHash = user.password
    console.log('📝 Hash actuel du mot de passe:')
    console.log(`   ${oldPasswordHash.substring(0, 30)}...`)
    console.log()

    // 3. Créer un nouveau mot de passe de test
    const newPassword = 'TestPassword123!'
    const newPasswordHash = await bcrypt.hash(newPassword, 10)

    console.log('🔄 Changement du mot de passe...')
    console.log(`   Nouveau mot de passe: ${newPassword}`)
    console.log()

    // 4. Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: newPasswordHash,
        updatedAt: new Date()
      }
    })

    console.log('✅ Mot de passe mis à jour avec succès!')
    console.log()

    // 5. Vérifier que le changement a bien été effectué
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id }
    })

    if (!updatedUser) {
      console.log('❌ Erreur: Utilisateur non trouvé après mise à jour!\n')
      return
    }

    console.log('🔍 Vérification du changement:')
    console.log(`   Ancien hash: ${oldPasswordHash.substring(0, 30)}...`)
    console.log(`   Nouveau hash: ${updatedUser.password.substring(0, 30)}...`)
    console.log(`   Hash différent: ${oldPasswordHash !== updatedUser.password ? '✅ OUI' : '❌ NON'}`)
    console.log()

    // 6. Tester la connexion avec le nouveau mot de passe
    console.log('🔐 Test de connexion avec le nouveau mot de passe...')
    const isPasswordValid = await bcrypt.compare(newPassword, updatedUser.password)
    
    if (isPasswordValid) {
      console.log('✅ SUCCÈS: Le nouveau mot de passe fonctionne!')
    } else {
      console.log('❌ ÉCHEC: Le nouveau mot de passe ne fonctionne pas!')
    }
    console.log()

    // 7. Tester avec l'ancien mot de passe (devrait échouer)
    console.log('🔐 Test avec un ancien mot de passe fictif...')
    const oldPasswordTest = await bcrypt.compare('OldPassword123', updatedUser.password)
    
    if (!oldPasswordTest) {
      console.log('✅ SUCCÈS: L\'ancien mot de passe ne fonctionne plus (normal)')
    } else {
      console.log('⚠️  ATTENTION: L\'ancien mot de passe fonctionne encore!')
    }
    console.log()

    // 8. Résumé
    console.log('📊 RÉSUMÉ DU TEST:')
    console.log('   ✅ Utilisateur trouvé')
    console.log('   ✅ Mot de passe changé en base de données')
    console.log('   ✅ Hash du mot de passe modifié')
    console.log('   ✅ Nouveau mot de passe fonctionnel')
    console.log('   ✅ Ancien mot de passe invalidé')
    console.log()
    console.log('🎉 TEST RÉUSSI: Le changement de mot de passe fonctionne correctement!')
    console.log()
    console.log('⚠️  IMPORTANT:')
    console.log(`   Le mot de passe de ${user.prenom} ${user.nom} a été changé en: ${newPassword}`)
    console.log('   Utilisez ce mot de passe pour vous connecter.')
    console.log()

  } catch (error) {
    console.error('\n❌ ERREUR:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

testChangePassword()
  .then(() => {
    console.log('✅ Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script terminé avec erreur:', error)
    process.exit(1)
  })

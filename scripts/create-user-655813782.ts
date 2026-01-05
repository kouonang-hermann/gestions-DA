/**
 * Script pour réinitialiser le mot de passe de l'utilisateur 655813782
 */

import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function resetPassword() {
  console.log('\n🔐 RÉINITIALISATION DU MOT DE PASSE - 655813782\n')

  try {
    // Rechercher l'utilisateur
    const user = await prisma.user.findUnique({
      where: { phone: '655813782' }
    })

    if (!user) {
      console.log('❌ Utilisateur non trouvé!\n')
      return
    }

    console.log('✅ Utilisateur trouvé:')
    console.log(`   Nom: ${user.prenom} ${user.nom}`)
    console.log(`   Téléphone: ${user.phone}`)
    console.log(`   Email: ${user.email}`)
    console.log(`   Rôle: ${user.role}`)
    console.log()

    // Créer un nouveau mot de passe
    const newPassword = 'Temp123!'
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    console.log('🔄 Réinitialisation du mot de passe...')
    console.log(`   Nouveau mot de passe: ${newPassword}`)
    console.log()

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        updatedAt: new Date()
      }
    })

    console.log('✅ Mot de passe réinitialisé avec succès!')
    console.log()

    // Vérifier que le changement a bien été effectué
    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id }
    })

    if (!updatedUser) {
      console.log('❌ Erreur: Utilisateur non trouvé après mise à jour!\n')
      return
    }

    // Tester le nouveau mot de passe
    console.log('🔍 Vérification du nouveau mot de passe...')
    const isPasswordValid = await bcrypt.compare(newPassword, updatedUser.password)
    
    if (isPasswordValid) {
      console.log('✅ SUCCÈS: Le nouveau mot de passe fonctionne!')
    } else {
      console.log('❌ ÉCHEC: Le nouveau mot de passe ne fonctionne pas!')
    }
    console.log()

    // Résumé
    console.log('📊 RÉSUMÉ:')
    console.log('   ✅ Mot de passe réinitialisé')
    console.log('   ✅ Nouveau mot de passe vérifié')
    console.log()
    console.log('🔑 INFORMATIONS DE CONNEXION:')
    console.log(`   Téléphone: ${user.phone}`)
    console.log(`   Mot de passe: ${newPassword}`)
    console.log()
    console.log('⚠️  IMPORTANT:')
    console.log('   L\'utilisateur doit changer ce mot de passe après la première connexion')
    console.log()

  } catch (error) {
    console.error('\n❌ ERREUR:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

resetPassword()
  .then(() => {
    console.log('✅ Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script terminé avec erreur:', error)
    process.exit(1)
  })

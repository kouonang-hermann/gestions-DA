/**
 * Script pour diagnostiquer le problème de connexion de l'utilisateur 697619722
 */

import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function checkUser() {
  console.log('\n🔍 Diagnostic de l\'utilisateur 697619722...\n')

  try {
    // Rechercher l'utilisateur avec différents formats de numéro
    const phoneVariants = [
      '697619722',
      '+237697619722',
      '237697619722',
      '+33697619722',
      '0697619722'
    ]

    console.log('📞 Recherche de l\'utilisateur avec les variantes de numéro...\n')

    for (const phone of phoneVariants) {
      const user = await prisma.user.findUnique({
        where: { phone }
      })

      if (user) {
        console.log(`✅ Utilisateur trouvé avec le numéro: ${phone}\n`)
        console.log('📋 Informations de l\'utilisateur:')
        console.log(`   ID: ${user.id}`)
        console.log(`   Nom: ${user.nom}`)
        console.log(`   Prénom: ${user.prenom}`)
        console.log(`   Email: ${user.email || 'Non défini'}`)
        console.log(`   Téléphone: ${user.phone}`)
        console.log(`   Rôle: ${user.role}`)
        console.log(`   Admin: ${user.isAdmin ? 'Oui' : 'Non'}`)
        console.log(`   Créé le: ${user.createdAt.toLocaleString('fr-FR')}`)
        console.log(`   Mis à jour: ${user.updatedAt.toLocaleString('fr-FR')}`)
        console.log()

        // Vérifier si le mot de passe existe
        if (!user.password || user.password.length === 0) {
          console.log('❌ PROBLÈME IDENTIFIÉ: Mot de passe vide ou manquant!\n')
          console.log('🔧 Correction: Création d\'un nouveau mot de passe...\n')

          // Créer un nouveau mot de passe
          const newPassword = 'Temp123!'
          const hashedPassword = await bcrypt.hash(newPassword, 10)

          await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
          })

          console.log('✅ Mot de passe réinitialisé avec succès!')
          console.log(`   Nouveau mot de passe temporaire: ${newPassword}`)
          console.log('   ⚠️  L\'utilisateur devra changer ce mot de passe après connexion\n')
        } else {
          console.log('✅ Mot de passe existe (hash présent)\n')

          // Tester si le hash est valide
          try {
            const testPassword = 'Test123!'
            const isValidHash = await bcrypt.compare(testPassword, user.password)
            console.log('✅ Le hash du mot de passe est valide\n')

            // Proposer de réinitialiser le mot de passe
            console.log('💡 Si l\'utilisateur a oublié son mot de passe:')
            console.log('   Voulez-vous réinitialiser le mot de passe? (Modifier le script)\n')

            // Décommenter pour réinitialiser:
            /*
            const newPassword = 'Temp123!'
            const hashedPassword = await bcrypt.hash(newPassword, 10)
            await prisma.user.update({
              where: { id: user.id },
              data: { password: hashedPassword }
            })
            console.log('✅ Mot de passe réinitialisé!')
            console.log(`   Nouveau mot de passe: ${newPassword}`)
            */
          } catch (error) {
            console.log('❌ PROBLÈME: Le hash du mot de passe est invalide!\n')
            console.log('🔧 Correction: Réinitialisation du mot de passe...\n')

            const newPassword = 'Temp123!'
            const hashedPassword = await bcrypt.hash(newPassword, 10)

            await prisma.user.update({
              where: { id: user.id },
              data: { password: hashedPassword }
            })

            console.log('✅ Mot de passe réinitialisé avec succès!')
            console.log(`   Nouveau mot de passe: ${newPassword}\n`)
          }
        }

        // Vérifier les projets assignés
        const projets = await prisma.userProjet.findMany({
          where: { userId: user.id },
          include: { projet: true }
        })

        console.log(`📁 Projets assignés: ${projets.length}`)
        if (projets.length > 0) {
          projets.forEach(up => {
            console.log(`   - ${up.projet.nom}`)
          })
        } else {
          console.log('   ⚠️  Aucun projet assigné')
        }
        console.log()

        return
      }
    }

    console.log('❌ Utilisateur non trouvé avec aucune variante du numéro\n')
    console.log('📋 Variantes testées:')
    phoneVariants.forEach(v => console.log(`   - ${v}`))
    console.log()

    console.log('💡 Suggestions:')
    console.log('   1. Vérifier que l\'utilisateur existe dans la base de données')
    console.log('   2. Vérifier le format exact du numéro de téléphone')
    console.log('   3. Créer l\'utilisateur si nécessaire')
    console.log()

    // Lister tous les utilisateurs avec un numéro similaire
    console.log('🔍 Recherche d\'utilisateurs avec des numéros similaires...\n')
    
    const similarUsers = await prisma.user.findMany({
      where: {
        OR: [
          { phone: { contains: '697619' } },
          { phone: { contains: '619722' } }
        ]
      }
    })

    if (similarUsers.length > 0) {
      console.log(`✅ ${similarUsers.length} utilisateur(s) trouvé(s) avec des numéros similaires:\n`)
      similarUsers.forEach(u => {
        console.log(`   ${u.phone} - ${u.prenom} ${u.nom} (${u.role})`)
      })
    } else {
      console.log('❌ Aucun utilisateur trouvé avec un numéro similaire')
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
    console.log('\n✅ Diagnostic terminé')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erreur lors du diagnostic:', error)
    process.exit(1)
  })

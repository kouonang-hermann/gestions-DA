/**
 * Script pour hacher les mots de passe des utilisateurs créés manuellement
 * 
 * UTILISATION :
 * node scripts/hash-passwords.js
 * 
 * Ce script :
 * 1. Trouve tous les utilisateurs avec des mots de passe non hachés
 * 2. Hache leurs mots de passe avec bcrypt
 * 3. Met à jour la base de données
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function hashPasswords() {
  try {
    console.log('🔍 Recherche des utilisateurs avec mots de passe non hachés...\n')

    // Récupérer tous les utilisateurs
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nom: true,
        prenom: true,
        phone: true,
        password: true,
        role: true
      }
    })

    console.log(`📊 Total utilisateurs trouvés: ${users.length}\n`)

    let updatedCount = 0
    let alreadyHashedCount = 0

    for (const user of users) {
      // Vérifier si le mot de passe est déjà haché (commence par $2a$ ou $2b$)
      const isHashed = user.password.startsWith('$2a$') || user.password.startsWith('$2b$')

      if (isHashed) {
        console.log(`✅ ${user.nom} ${user.prenom} (${user.phone}) - Mot de passe déjà haché`)
        alreadyHashedCount++
      } else {
        console.log(`🔧 ${user.nom} ${user.prenom} (${user.phone}) - Hachage en cours...`)
        
        // Hacher le mot de passe
        const hashedPassword = await bcrypt.hash(user.password, 12)
        
        // Mettre à jour dans la base de données
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword }
        })
        
        console.log(`   ✅ Mot de passe haché et mis à jour`)
        updatedCount++
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📋 RÉSUMÉ :')
    console.log(`   - Total utilisateurs: ${users.length}`)
    console.log(`   - Déjà hachés: ${alreadyHashedCount}`)
    console.log(`   - Mis à jour: ${updatedCount}`)
    console.log('='.repeat(60))

    if (updatedCount > 0) {
      console.log('\n✅ Les utilisateurs peuvent maintenant se connecter avec leurs mots de passe !')
    } else {
      console.log('\n✅ Tous les mots de passe étaient déjà hachés correctement.')
    }

  } catch (error) {
    console.error('❌ Erreur lors du hachage des mots de passe:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le script
hashPasswords()
  .then(() => {
    console.log('\n✅ Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error)
    process.exit(1)
  })

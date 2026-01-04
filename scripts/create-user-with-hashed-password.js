/**
 * Script pour créer un utilisateur avec un mot de passe correctement haché
 * 
 * UTILISATION :
 * node scripts/create-user-with-hashed-password.js
 * 
 * Ce script vous permet de créer des utilisateurs directement dans la base
 * avec des mots de passe correctement hachés
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const readline = require('readline')

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

const roles = [
  'superadmin',
  'employe',
  'conducteur_travaux',
  'responsable_travaux',
  'responsable_logistique',
  'responsable_appro',
  'charge_affaire',
  'responsable_livreur'
]

async function createUser() {
  try {
    console.log('\n' + '='.repeat(60))
    console.log('👤 CRÉATION D\'UTILISATEUR AVEC MOT DE PASSE HACHÉ')
    console.log('='.repeat(60) + '\n')

    // Collecter les informations
    const nom = await question('Nom : ')
    const prenom = await question('Prénom : ')
    const phone = await question('Numéro de téléphone : ')
    const email = await question('Email (optionnel, appuyez sur Entrée pour ignorer) : ')
    const password = await question('Mot de passe : ')
    
    console.log('\nRôles disponibles :')
    roles.forEach((role, index) => {
      console.log(`  ${index + 1}. ${role}`)
    })
    const roleIndex = await question('\nChoisissez un rôle (1-8) : ')
    const role = roles[parseInt(roleIndex) - 1]

    if (!role) {
      console.log('❌ Rôle invalide')
      rl.close()
      return
    }

    const isAdminInput = await question('Est-ce un admin ? (o/n) : ')
    const isAdmin = isAdminInput.toLowerCase() === 'o'

    console.log('\n🔐 Hachage du mot de passe...')
    const hashedPassword = await bcrypt.hash(password, 12)

    console.log('💾 Création de l\'utilisateur dans la base de données...')

    const user = await prisma.user.create({
      data: {
        nom,
        prenom,
        phone,
        email: email || null,
        password: hashedPassword,
        role,
        isAdmin
      }
    })

    console.log('\n' + '='.repeat(60))
    console.log('✅ UTILISATEUR CRÉÉ AVEC SUCCÈS !')
    console.log('='.repeat(60))
    console.log(`ID: ${user.id}`)
    console.log(`Nom: ${user.nom} ${user.prenom}`)
    console.log(`Téléphone: ${user.phone}`)
    console.log(`Email: ${user.email || 'N/A'}`)
    console.log(`Rôle: ${user.role}`)
    console.log(`Admin: ${user.isAdmin ? 'Oui' : 'Non'}`)
    console.log(`Mot de passe: ✅ Correctement haché`)
    console.log('='.repeat(60))
    console.log('\n✅ L\'utilisateur peut maintenant se connecter avec son numéro de téléphone et son mot de passe !')

  } catch (error) {
    console.error('\n❌ Erreur lors de la création de l\'utilisateur:', error)
    if (error.code === 'P2002') {
      console.error('⚠️  Un utilisateur avec ce numéro de téléphone ou cet email existe déjà.')
    }
  } finally {
    rl.close()
    await prisma.$disconnect()
  }
}

// Exécuter le script
createUser()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error)
    process.exit(1)
  })

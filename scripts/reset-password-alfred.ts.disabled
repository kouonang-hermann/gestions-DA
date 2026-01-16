import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔐 Réinitialisation du mot de passe pour Alfred Yves MBOMA NDANDO EBELLE...\n')

  // Hash du nouveau mot de passe "Secure01"
  const newPassword = 'Secure01'
  const hashedPassword = await bcrypt.hash(newPassword, 12)

  // Mettre à jour le mot de passe
  const updatedUser = await prisma.user.update({
    where: {
      phone: '699425611'
    },
    data: {
      password: hashedPassword
    },
    select: {
      id: true,
      nom: true,
      prenom: true,
      phone: true,
      role: true,
    }
  })

  console.log('✅ Mot de passe réinitialisé avec succès !\n')
  console.log('📋 Informations de connexion :')
  console.log(`   Utilisateur: ${updatedUser.prenom} ${updatedUser.nom}`)
  console.log(`   Téléphone: ${updatedUser.phone}`)
  console.log(`   Rôle: ${updatedUser.role}`)
  console.log(`   Nouveau mot de passe: ${newPassword}`)
  console.log('\n🎉 L\'utilisateur peut maintenant se connecter avec :')
  console.log(`   Identifiant: ${updatedUser.phone}`)
  console.log(`   Mot de passe: ${newPassword}`)
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

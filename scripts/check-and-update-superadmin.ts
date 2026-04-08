/**
 * SCRIPT - MISE À JOUR EMAIL SUPER ADMIN
 * 
 * Met à jour l'email du Super Admin pour hermannfipa@gmail.com
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updateSuperAdminEmail() {
  try {
    console.log('🔍 Recherche du Super Admin...\n')

    // Trouver le Super Admin
    const superAdmin = await prisma.user.findFirst({
      where: { role: 'superadmin' }
    })

    if (!superAdmin) {
      console.log('❌ Aucun Super Admin trouvé')
      return
    }

    console.log('✅ Super Admin trouvé:')
    console.log(`   - Nom: ${superAdmin.nom} ${superAdmin.prenom}`)
    console.log(`   - Email actuel: ${superAdmin.email}`)
    console.log(`   - ID: ${superAdmin.id}\n`)

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: 'hermannfipa@gmail.com' }
    })

    if (existingUser && existingUser.id !== superAdmin.id) {
      console.log('⚠️  L\'email hermannfipa@gmail.com est déjà utilisé par:')
      console.log(`   - ${existingUser.nom} ${existingUser.prenom} (${existingUser.role})`)
      console.log(`   - ID: ${existingUser.id}\n`)
      
      // Changer le rôle de cet utilisateur en superadmin
      console.log('🔄 Changement du rôle en superadmin...')
      await prisma.user.update({
        where: { id: existingUser.id },
        data: { role: 'superadmin' }
      })
      
      console.log('✅ Rôle mis à jour avec succès!')
      console.log(`   hermannfipa@gmail.com est maintenant Super Admin\n`)
    } else {
      // Mettre à jour l'email du Super Admin actuel
      console.log('🔄 Mise à jour de l\'email...')
      await prisma.user.update({
        where: { id: superAdmin.id },
        data: { email: 'hermannfipa@gmail.com' }
      })
      
      console.log('✅ Email mis à jour avec succès!')
      console.log(`   Nouvel email: hermannfipa@gmail.com\n`)
    }

    // Vérifier la mise à jour
    const updatedAdmin = await prisma.user.findFirst({
      where: { 
        role: 'superadmin',
        email: 'hermannfipa@gmail.com'
      }
    })

    if (updatedAdmin) {
      console.log('✅ Vérification finale:')
      console.log(`   - Super Admin: ${updatedAdmin.nom} ${updatedAdmin.prenom}`)
      console.log(`   - Email: ${updatedAdmin.email}`)
      console.log(`   - Prêt pour recevoir les rapports analytiques! 📧\n`)
    }

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateSuperAdminEmail()

/**
 * Script de migration pour remplacer le rôle responsable_qhse par responsable_logistique
 * Ce script doit être exécuté directement avec Node.js
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrateQhseRole() {
  console.log('🔄 Début de la migration des rôles QHSE vers Logistique...')
  
  try {
    // Compter les utilisateurs avec le rôle responsable_qhse
    const qhseUsers = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM users WHERE role = 'responsable_qhse'
    `
    
    console.log(`📊 Utilisateurs avec rôle responsable_qhse trouvés: ${qhseUsers[0].count}`)
    
    if (qhseUsers[0].count > 0) {
      // Mettre à jour les utilisateurs
      const result = await prisma.$executeRaw`
        UPDATE users SET role = 'responsable_logistique' WHERE role = 'responsable_qhse'
      `
      
      console.log(`✅ ${result} utilisateur(s) mis à jour avec succès!`)
    } else {
      console.log('ℹ️ Aucun utilisateur avec le rôle responsable_qhse trouvé')
    }
    
    // Vérifier le résultat
    const logistiqueUsers = await prisma.$queryRaw`
      SELECT id, nom, prenom, email, role FROM users WHERE role = 'responsable_logistique'
    `
    
    console.log('\n📋 Utilisateurs avec rôle responsable_logistique:')
    logistiqueUsers.forEach(user => {
      console.log(`  - ${user.prenom} ${user.nom} (${user.email})`)
    })
    
    console.log('\n✅ Migration terminée avec succès!')
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter la migration
migrateQhseRole()
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })

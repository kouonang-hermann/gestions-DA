/**
 * Script de migration pour supprimer le rôle responsable_qhse
 * et transférer toutes les tâches au responsable_logistique
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function removeQhseRole() {
  console.log('🔄 Début de la suppression du rôle responsable_qhse...\n')
  
  try {
    // 1. Compter les utilisateurs avec le rôle responsable_qhse
    const qhseUsers = await prisma.$queryRaw`
      SELECT id, nom, prenom, email FROM users WHERE role = 'responsable_qhse'
    `
    
    console.log(`📊 Utilisateurs avec rôle responsable_qhse trouvés: ${qhseUsers.length}`)
    
    if (qhseUsers.length > 0) {
      console.log('\n👥 Liste des utilisateurs à migrer:')
      qhseUsers.forEach(user => {
        console.log(`  - ${user.prenom} ${user.nom} (${user.email})`)
      })
      
      // 2. Migrer les utilisateurs vers responsable_logistique
      const updateResult = await prisma.$executeRaw`
        UPDATE users 
        SET role = 'responsable_logistique' 
        WHERE role = 'responsable_qhse'
      `
      
      console.log(`\n✅ ${updateResult} utilisateur(s) migré(s) vers responsable_logistique`)
    } else {
      console.log('ℹ️ Aucun utilisateur avec le rôle responsable_qhse trouvé')
    }
    
    // 3. Vérifier s'il reste des références dans les demandes (validationQHSE)
    const demandesWithQhse = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM demandes 
      WHERE "validationQHSE" IS NOT NULL
    `
    
    if (demandesWithQhse[0].count > 0) {
      console.log(`\n📋 ${demandesWithQhse[0].count} demande(s) avec validationQHSE trouvée(s)`)
      console.log('🔄 Migration des champs de validation...')
      
      // Migrer validationQHSE vers validationLogistique
      await prisma.$executeRaw`
        UPDATE demandes 
        SET "validationLogistique" = "validationQHSE",
            "validationQHSE" = NULL
        WHERE "validationQHSE" IS NOT NULL
      `
      
      console.log('✅ Champs de validation migrés')
    }
    
    // 4. Vérifier l'historique
    const historyWithQhse = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM history_entries 
      WHERE action LIKE '%QHSE%' OR action LIKE '%responsable_qhse%'
    `
    
    if (historyWithQhse[0].count > 0) {
      console.log(`\n📜 ${historyWithQhse[0].count} entrée(s) d'historique avec QHSE trouvée(s)`)
      console.log('🔄 Mise à jour de l\'historique...')
      
      await prisma.$executeRaw`
        UPDATE history_entries 
        SET action = REPLACE(action, 'QHSE', 'Logistique')
        WHERE action LIKE '%QHSE%'
      `
      
      await prisma.$executeRaw`
        UPDATE history_entries 
        SET action = REPLACE(action, 'responsable_qhse', 'responsable_logistique')
        WHERE action LIKE '%responsable_qhse%'
      `
      
      console.log('✅ Historique mis à jour')
    }
    
    // 5. Résumé final
    console.log('\n📊 RÉSUMÉ DE LA MIGRATION:')
    console.log('─'.repeat(60))
    
    const finalLogistiqueUsers = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM users WHERE role = 'responsable_logistique'
    `
    
    const finalQhseUsers = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM users WHERE role = 'responsable_qhse'
    `
    
    console.log(`  Utilisateurs responsable_logistique: ${finalLogistiqueUsers[0].count}`)
    console.log(`  Utilisateurs responsable_qhse restants: ${finalQhseUsers[0].count}`)
    
    if (finalQhseUsers[0].count === 0) {
      console.log('\n✅ MIGRATION RÉUSSIE!')
      console.log('   Tous les utilisateurs QHSE ont été migrés vers Logistique')
      console.log('   Toutes les références QHSE ont été nettoyées')
    } else {
      console.log('\n⚠️ ATTENTION: Il reste des utilisateurs avec le rôle responsable_qhse')
    }
    
  } catch (error) {
    console.error('\n❌ Erreur lors de la migration:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter la migration
removeQhseRole()
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })

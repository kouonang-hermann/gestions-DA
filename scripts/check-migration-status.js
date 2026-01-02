/**
 * Script pour vérifier l'état de la migration QHSE → Logistique dans la base de données
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkMigrationStatus() {
  console.log('🔍 Vérification de l\'état de la migration QHSE → Logistique...\n')
  
  try {
    // 1. Vérifier les rôles utilisateurs
    console.log('📊 RÔLES UTILISATEURS:')
    console.log('─'.repeat(60))
    
    const roleStats = await prisma.$queryRaw`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role 
      ORDER BY role
    `
    
    roleStats.forEach(stat => {
      console.log(`  ${stat.role}: ${stat.count} utilisateur(s)`)
    })
    
    // Vérifier s'il reste des utilisateurs avec l'ancien rôle
    const qhseUsers = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM users WHERE role = 'responsable_qhse'
    `
    
    if (qhseUsers[0].count > 0) {
      console.log(`\n⚠️  ATTENTION: ${qhseUsers[0].count} utilisateur(s) avec l'ancien rôle 'responsable_qhse'`)
      console.log('   → Migration des rôles NON appliquée en base de données')
    } else {
      console.log('\n✅ Aucun utilisateur avec l\'ancien rôle responsable_qhse')
    }
    
    // 2. Vérifier les statuts de demandes
    console.log('\n📋 STATUTS DES DEMANDES:')
    console.log('─'.repeat(60))
    
    const statusStats = await prisma.$queryRaw`
      SELECT status, COUNT(*) as count 
      FROM demandes 
      GROUP BY status 
      ORDER BY status
    `
    
    statusStats.forEach(stat => {
      console.log(`  ${stat.status}: ${stat.count} demande(s)`)
    })
    
    // Vérifier s'il reste des demandes avec l'ancien statut
    const qhseStatuses = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM demandes WHERE status = 'en_attente_validation_qhse'
    `
    
    if (qhseStatuses[0].count > 0) {
      console.log(`\n⚠️  ATTENTION: ${qhseStatuses[0].count} demande(s) avec l'ancien statut 'en_attente_validation_qhse'`)
      console.log('   → Migration des statuts NON appliquée en base de données')
    } else {
      console.log('\n✅ Aucune demande avec l\'ancien statut en_attente_validation_qhse')
    }
    
    // 3. Résumé de la migration
    console.log('\n📊 RÉSUMÉ DE LA MIGRATION:')
    console.log('─'.repeat(60))
    
    const logistiqueUsers = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM users WHERE role = 'responsable_logistique'
    `
    
    const logistiqueStatuses = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM demandes WHERE status = 'en_attente_validation_logistique'
    `
    
    console.log(`  Utilisateurs responsable_logistique: ${logistiqueUsers[0].count}`)
    console.log(`  Demandes en_attente_validation_logistique: ${logistiqueStatuses[0].count}`)
    
    // 4. État du flow de validation
    console.log('\n🔄 FLOW DE VALIDATION ACTUEL:')
    console.log('─'.repeat(60))
    console.log('  MATÉRIEL:')
    console.log('    1. Conducteur Travaux → en_attente_validation_conducteur')
    console.log('    2. Responsable Travaux → en_attente_validation_responsable_travaux')
    console.log('    3. Chargé Affaire → en_attente_validation_charge_affaire')
    console.log('    4. Responsable Appro → en_attente_preparation_appro')
    console.log('    5. Responsable Logistique → en_attente_validation_logistique')
    console.log('    6. Demandeur → en_attente_validation_finale_demandeur')
    console.log('')
    console.log('  OUTILLAGE:')
    console.log('    1. Responsable Logistique → en_attente_validation_logistique')
    console.log('    2. Responsable Travaux → en_attente_validation_responsable_travaux')
    console.log('    3. Chargé Affaire → en_attente_validation_charge_affaire')
    console.log('    4. Responsable Appro → en_attente_preparation_appro')
    console.log('    5. Responsable Logistique → en_attente_validation_logistique')
    console.log('    6. Demandeur → en_attente_validation_finale_demandeur')
    
    // 5. Conclusion
    console.log('\n📝 CONCLUSION:')
    console.log('─'.repeat(60))
    
    if (qhseUsers[0].count > 0 || qhseStatuses[0].count > 0) {
      console.log('❌ MIGRATION NON APPLIQUÉE EN BASE DE DONNÉES')
      console.log('')
      console.log('Le nouveau flow de validation est défini dans le CODE mais')
      console.log('les DONNÉES en base utilisent encore l\'ancien système QHSE.')
      console.log('')
      console.log('Pour appliquer la migration, exécutez:')
      console.log('  node scripts/migrate-qhse-role.js')
      console.log('  OU')
      console.log('  Exécutez le SQL: prisma/migrations/migration_qhse_to_logistique.sql')
    } else {
      console.log('✅ MIGRATION APPLIQUÉE AVEC SUCCÈS')
      console.log('')
      console.log('Le nouveau flow de validation est ACTIF et FONCTIONNEL')
      console.log('dans le code ET dans la base de données.')
    }
    
  } catch (error) {
    console.error('\n❌ Erreur lors de la vérification:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter la vérification
checkMigrationStatus()
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })

// Script Node.js pour migrer les données QHSE vers Logistique
// Utilise Prisma pour se connecter à la base de données

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function migrateQHSEToLogistique() {
  console.log('🚀 Début de la migration QHSE → Logistique...\n')

  try {
    // 1. Migrer les rôles utilisateurs
    console.log('📝 Migration des rôles utilisateurs...')
    const usersUpdated = await prisma.$executeRaw`
      UPDATE users 
      SET role = 'responsable_logistique'::"UserRole"
      WHERE role = 'responsable_qhse'::"UserRole"
    `
    console.log(`✅ ${usersUpdated} utilisateur(s) migré(s)\n`)

    // 2. Migrer les statuts de demandes
    console.log('📝 Migration des statuts de demandes...')
    const demandesUpdated = await prisma.$executeRaw`
      UPDATE demandes 
      SET status = 'en_attente_validation_logistique'::"DemandeStatus"
      WHERE status = 'en_attente_validation_qhse'::"DemandeStatus"
    `
    console.log(`✅ ${demandesUpdated} demande(s) migrée(s)\n`)

    // 3. Migrer les entrées d'historique (ancien statut)
    console.log('📝 Migration des entrées d\'historique (ancienStatus)...')
    const historyOldUpdated = await prisma.$executeRaw`
      UPDATE history_entries 
      SET "ancienStatus" = 'en_attente_validation_logistique'::"DemandeStatus"
      WHERE "ancienStatus" = 'en_attente_validation_qhse'::"DemandeStatus"
    `
    console.log(`✅ ${historyOldUpdated} entrée(s) d'historique migrée(s)\n`)

    // 4. Migrer les entrées d'historique (nouveau statut)
    console.log('📝 Migration des entrées d\'historique (nouveauStatus)...')
    const historyNewUpdated = await prisma.$executeRaw`
      UPDATE history_entries 
      SET "nouveauStatus" = 'en_attente_validation_logistique'::"DemandeStatus"
      WHERE "nouveauStatus" = 'en_attente_validation_qhse'::"DemandeStatus"
    `
    console.log(`✅ ${historyNewUpdated} entrée(s) d'historique migrée(s)\n`)

    // Vérification finale
    console.log('🔍 Vérification finale...')
    
    const logistiqueUsers = await prisma.user.count({
      where: { role: 'responsable_logistique' }
    })
    console.log(`📊 Utilisateurs avec rôle 'responsable_logistique': ${logistiqueUsers}`)

    const logistiqueDemandes = await prisma.demande.count({
      where: { status: 'en_attente_validation_logistique' }
    })
    console.log(`📊 Demandes avec statut 'en_attente_validation_logistique': ${logistiqueDemandes}`)

    // Vérifier qu'il ne reste plus de données QHSE
    const qhseUsersRemaining = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM users WHERE role = 'responsable_qhse'::"UserRole"
    `
    const qhseDemandesRemaining = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM demandes WHERE status = 'en_attente_validation_qhse'::"DemandeStatus"
    `

    console.log(`\n⚠️  Utilisateurs QHSE restants: ${qhseUsersRemaining[0].count}`)
    console.log(`⚠️  Demandes QHSE restantes: ${qhseDemandesRemaining[0].count}`)

    if (qhseUsersRemaining[0].count === '0' && qhseDemandesRemaining[0].count === '0') {
      console.log('\n✅ Migration terminée avec succès!')
      console.log('👉 Vous pouvez maintenant exécuter: npx prisma db push')
    } else {
      console.log('\n⚠️  Attention: Il reste encore des données QHSE dans la base!')
    }

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter la migration
migrateQHSEToLogistique()
  .catch((error) => {
    console.error('❌ Erreur fatale:', error)
    process.exit(1)
  })

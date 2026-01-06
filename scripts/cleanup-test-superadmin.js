const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function cleanupTest() {
  console.log('🧹 NETTOYAGE DES DONNÉES DE TEST\n')
  
  try {
    // 1. Supprimer les items de demande
    console.log('📦 Suppression des items de demande...')
    const deletedItems = await prisma.itemDemande.deleteMany({
      where: { demandeId: 'test-demande-superadmin-001' }
    })
    console.log(`✅ ${deletedItems.count} item(s) supprimé(s)`)

    // 2. Supprimer les entrées d'historique
    console.log('\n📜 Suppression de l\'historique...')
    const deletedHistory = await prisma.historyEntry.deleteMany({
      where: { demandeId: 'test-demande-superadmin-001' }
    })
    console.log(`✅ ${deletedHistory.count} entrée(s) d'historique supprimée(s)`)

    // 3. Supprimer les notifications
    console.log('\n🔔 Suppression des notifications...')
    const deletedNotifications = await prisma.notification.deleteMany({
      where: { demandeId: 'test-demande-superadmin-001' }
    })
    console.log(`✅ ${deletedNotifications.count} notification(s) supprimée(s)`)

    // 4. Supprimer les signatures de validation
    console.log('\n✍️  Suppression des signatures de validation...')
    const deletedSignatures = await prisma.validationSignature.deleteMany({
      where: { demandeId: 'test-demande-superadmin-001' }
    })
    console.log(`✅ ${deletedSignatures.count} signature(s) supprimée(s)`)

    // 5. Supprimer la demande
    console.log('\n📋 Suppression de la demande...')
    await prisma.demande.delete({
      where: { id: 'test-demande-superadmin-001' }
    })
    console.log('✅ Demande supprimée')

    // 6. Supprimer l'article
    console.log('\n📦 Suppression de l\'article...')
    await prisma.article.delete({
      where: { id: 'test-article-001' }
    })
    console.log('✅ Article supprimé')

    // 7. Supprimer l'assignation utilisateur-projet
    console.log('\n🔗 Suppression de l\'assignation utilisateur-projet...')
    await prisma.userProjet.delete({
      where: {
        userId_projetId: {
          userId: 'test-employe-001',
          projetId: 'test-projet-superadmin'
        }
      }
    })
    console.log('✅ Assignation supprimée')

    // 8. Supprimer l'utilisateur
    console.log('\n👤 Suppression de l\'utilisateur...')
    await prisma.user.delete({
      where: { id: 'test-employe-001' }
    })
    console.log('✅ Utilisateur supprimé')

    // 9. Supprimer le projet
    console.log('\n📁 Suppression du projet...')
    await prisma.projet.delete({
      where: { id: 'test-projet-superadmin' }
    })
    console.log('✅ Projet supprimé')

    console.log('\n' + '='.repeat(60))
    console.log('✅ NETTOYAGE TERMINÉ AVEC SUCCÈS')
    console.log('='.repeat(60))
    console.log('\nToutes les données de test ont été supprimées.')
    
  } catch (error) {
    console.error('\n❌ ERREUR lors du nettoyage:')
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupTest()

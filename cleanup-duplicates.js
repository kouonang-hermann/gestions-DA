const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function cleanupDuplicates() {
  try {
    console.log('🧹 Nettoyage des doublons de signatures...')
    
    const demandeId = 'cmflgnxlg0003ty3ojpkktu71'
    
    // Supprimer toutes les signatures pour cette demande
    const deleted = await prisma.validationSignature.deleteMany({
      where: { demandeId }
    })
    
    console.log(`✅ ${deleted.count} signatures supprimées`)
    
    // Réinitialiser le statut de la demande
    const demande = await prisma.demande.findUnique({
      where: { id: demandeId },
      select: { type: true }
    })
    
    if (demande) {
      const newStatus = demande.type === 'materiel' 
        ? 'en_attente_validation_conducteur' 
        : 'en_attente_validation_qhse'
      
      await prisma.demande.update({
        where: { id: demandeId },
        data: { status: newStatus }
      })
      
      console.log(`🔄 Statut réinitialisé: ${newStatus}`)
    }
    
    console.log('✅ Nettoyage terminé')
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

cleanupDuplicates()

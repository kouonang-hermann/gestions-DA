import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Script de migration pour convertir les numéros de demandes
 * de DEM-YYYY-XXXX vers DA-M-YYYY-XXXX ou DA-O-YYYY-XXXX
 */
async function migrateDemandes() {
  console.log('🔄 Début de la migration des numéros de demandes...\n')

  try {
    // Récupérer toutes les demandes avec l'ancien format
    const demandes = await prisma.demande.findMany({
      where: {
        numero: {
          startsWith: 'DEM-'
        }
      },
      select: {
        id: true,
        numero: true,
        type: true
      }
    })

    console.log(`📊 ${demandes.length} demandes à migrer\n`)

    if (demandes.length === 0) {
      console.log('✅ Aucune demande à migrer. Toutes les demandes utilisent déjà le nouveau format.')
      return
    }

    let migratedCount = 0
    let errorCount = 0

    for (const demande of demandes) {
      try {
        // Extraire l'année et le numéro séquentiel de l'ancien format
        // Format: DEM-YYYY-XXXX ou DEM-YYYY-XXXX-timestamp
        const parts = demande.numero.split('-')
        
        if (parts.length < 3) {
          console.error(`❌ Format invalide pour ${demande.numero}`)
          errorCount++
          continue
        }

        const year = parts[1]
        const sequenceNumber = parts[2]
        const timestamp = parts.length > 3 ? `-${parts.slice(3).join('-')}` : ''
        
        // Déterminer le nouveau préfixe selon le type
        const typePrefix = demande.type === 'materiel' ? 'DA-M' : 'DA-O'
        
        // Construire le nouveau numéro
        const newNumero = `${typePrefix}-${year}-${sequenceNumber}${timestamp}`
        
        // Mettre à jour la demande
        await prisma.demande.update({
          where: { id: demande.id },
          data: { numero: newNumero }
        })
        
        console.log(`✅ ${demande.numero} → ${newNumero}`)
        migratedCount++
        
      } catch (error) {
        console.error(`❌ Erreur lors de la migration de ${demande.numero}:`, error)
        errorCount++
      }
    }

    console.log('\n📊 Résumé de la migration:')
    console.log(`   ✅ Migrées avec succès: ${migratedCount}`)
    console.log(`   ❌ Erreurs: ${errorCount}`)
    console.log(`   📋 Total: ${demandes.length}`)

    if (migratedCount > 0) {
      console.log('\n✨ Migration terminée avec succès!')
    }

  } catch (error) {
    console.error('❌ Erreur fatale lors de la migration:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter la migration
migrateDemandes()
  .catch((error) => {
    console.error('❌ Échec de la migration:', error)
    process.exit(1)
  })

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Script de migration pour convertir les numéros de demandes
 * vers un format incluant le code projet : DA-M-YYYY-PROJ-XXXX
 */
async function migrateDemandesByProject() {
  console.log('🔄 Début de la migration des numéros de demandes par projet...\n')

  try {
    // Récupérer toutes les demandes avec leurs projets
    const demandes = await prisma.demande.findMany({
      where: {
        numero: {
          not: {
            startsWith: 'BROUILLON-'
          }
        }
      },
      include: {
        projet: {
          select: { id: true, nom: true }
        }
      },
      orderBy: [
        { projetId: 'asc' },
        { type: 'asc' },
        { dateCreation: 'asc' }
      ]
    })

    console.log(`📊 ${demandes.length} demandes à migrer\n`)

    if (demandes.length === 0) {
      console.log('✅ Aucune demande à migrer.')
      return
    }

    // Grouper les demandes par projet et type pour la numérotation séquentielle
    const projectCounters: Record<string, number> = {}

    let migratedCount = 0
    let errorCount = 0

    for (const demande of demandes) {
      try {
        if (!demande.projet) {
          console.error(`❌ Projet non trouvé pour la demande ${demande.numero}`)
          errorCount++
          continue
        }

        // Créer un code projet court (3 premières lettres en majuscules)
        const projetCode = demande.projet.nom.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '')
        
        // Extraire l'année du numéro actuel ou utiliser l'année de création
        const year = demande.dateCreation.getFullYear()
        
        // Déterminer le préfixe selon le type
        const typePrefix = demande.type === 'materiel' ? 'DA-M' : 'DA-O'
        
        // Créer une clé unique pour le compteur (projet + type + année)
        const counterKey = `${demande.projetId}-${demande.type}-${year}`
        
        // Incrémenter le compteur pour ce projet/type/année
        if (!projectCounters[counterKey]) {
          projectCounters[counterKey] = 0
        }
        projectCounters[counterKey]++
        
        // Construire le nouveau numéro
        const newNumero = `${typePrefix}-${year}-${projetCode}-${String(projectCounters[counterKey]).padStart(4, '0')}`
        
        // Vérifier si le numéro existe déjà
        const existing = await prisma.demande.findFirst({
          where: {
            numero: newNumero,
            id: { not: demande.id }
          }
        })
        
        if (existing) {
          // Si le numéro existe, ajouter un suffixe
          const timestamp = Date.now().toString().slice(-4)
          const finalNumero = `${newNumero}-${timestamp}`
          
          await prisma.demande.update({
            where: { id: demande.id },
            data: { numero: finalNumero }
          })
          
          console.log(`✅ ${demande.numero} → ${finalNumero} (avec suffixe)`)
        } else {
          // Mettre à jour la demande
          await prisma.demande.update({
            where: { id: demande.id },
            data: { numero: newNumero }
          })
          
          console.log(`✅ ${demande.numero} → ${newNumero}`)
        }
        
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
      console.log('\n📝 Format des nouveaux numéros:')
      console.log('   - DA-M-2026-PRO-0001 (Demande Matériel, année 2026, projet PRO, numéro 1)')
      console.log('   - DA-O-2026-PRO-0001 (Demande Outillage, année 2026, projet PRO, numéro 1)')
      console.log('\n💡 Chaque projet a maintenant sa propre séquence de numérotation!')
    }

  } catch (error) {
    console.error('❌ Erreur fatale lors de la migration:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter la migration
migrateDemandesByProject()
  .catch((error) => {
    console.error('❌ Échec de la migration:', error)
    process.exit(1)
  })

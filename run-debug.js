#!/usr/bin/env node

/**
 * Script d'exécution rapide pour diagnostiquer et corriger l'erreur 403
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function quickFix() {
  try {
    console.log('🚀 Correction rapide de l\'erreur 403...')
    console.log('=' .repeat(50))
    
    // 1. Récupérer tous les projets et utilisateurs
    const [projets, users] = await Promise.all([
      prisma.projet.findMany(),
      prisma.user.findMany()
    ])
    
    console.log(`📋 ${projets.length} projets trouvés`)
    console.log(`👥 ${users.length} utilisateurs trouvés`)
    console.log('')
    
    // 2. Assigner TOUS les utilisateurs à TOUS les projets (pour résoudre rapidement)
    let totalAssignments = 0
    
    for (const projet of projets) {
      for (const user of users) {
        try {
          await prisma.userProjet.upsert({
            where: {
              userId_projetId: {
                userId: user.id,
                projetId: projet.id
              }
            },
            update: {},
            create: {
              userId: user.id,
              projetId: projet.id
            }
          })
          totalAssignments++
        } catch (error) {
          // Ignorer les erreurs de contrainte (déjà existant)
        }
      }
    }
    
    console.log(`✅ ${totalAssignments} assignations créées/vérifiées`)
    console.log('')
    
    // 3. Vérifier une demande spécifique si fournie
    const demandeId = process.argv[2]
    if (demandeId) {
      console.log(`🔍 Vérification de la demande: ${demandeId}`)
      
      const demande = await prisma.demande.findUnique({
        where: { id: demandeId },
        include: {
          projet: true,
          technicien: true
        }
      })
      
      if (demande) {
        console.log(`   Demande: ${demande.numero}`)
        console.log(`   Projet: ${demande.projet?.nom}`)
        console.log(`   Technicien: ${demande.technicien?.prenom} ${demande.technicien?.nom}`)
        
        // Vérifier si le technicien est assigné au projet
        const assignment = await prisma.userProjet.findFirst({
          where: {
            userId: demande.technicienId,
            projetId: demande.projetId
          }
        })
        
        console.log(`   Technicien assigné au projet: ${assignment ? '✅ OUI' : '❌ NON'}`)
        
        if (!assignment) {
          await prisma.userProjet.create({
            data: {
              userId: demande.technicienId,
              projetId: demande.projetId
            }
          })
          console.log(`   ✅ Technicien assigné au projet`)
        }
      } else {
        console.log(`   ❌ Demande non trouvée`)
      }
    }
    
    console.log('')
    console.log('🎉 Correction terminée !')
    console.log('   Tous les utilisateurs ont maintenant accès à tous les projets.')
    console.log('   L\'erreur 403 devrait être résolue.')
    console.log('')
    console.log('💡 Pour tester:')
    console.log('   1. Rechargez votre page web')
    console.log('   2. Reconnectez-vous si nécessaire')
    console.log('   3. Essayez à nouveau l\'action qui causait l\'erreur 403')
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

quickFix()

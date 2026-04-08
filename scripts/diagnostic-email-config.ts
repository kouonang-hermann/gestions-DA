/**
 * DIAGNOSTIC - CONFIGURATION EMAIL RAPPORTS ANALYTIQUES
 * 
 * Vérifie tous les éléments nécessaires pour l'envoi automatique
 */

import { prisma } from '../lib/prisma'
import { config } from 'dotenv'
import { resolve } from 'path'

// Charger les variables d'environnement
config({ path: resolve(__dirname, '..', '.env.local') })

async function diagnostic() {
  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║   🔍 DIAGNOSTIC CONFIGURATION EMAIL                   ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  let allGood = true

  // 1. Vérifier les variables d'environnement
  console.log('📋 1. VARIABLES D\'ENVIRONNEMENT')
  console.log('─────────────────────────────────────────────────────────')
  
  const emailUser = process.env.EMAIL_USER
  const emailPassword = process.env.EMAIL_PASSWORD
  const emailFrom = process.env.EMAIL_FROM
  
  if (emailUser) {
    console.log(`✅ EMAIL_USER: ${emailUser}`)
  } else {
    console.log('❌ EMAIL_USER: NON CONFIGURÉ')
    allGood = false
  }
  
  if (emailPassword) {
    console.log(`✅ EMAIL_PASSWORD: ${emailPassword.substring(0, 4)}******* (${emailPassword.length} caractères)`)
  } else {
    console.log('❌ EMAIL_PASSWORD: NON CONFIGURÉ')
    allGood = false
  }
  
  if (emailFrom) {
    console.log(`✅ EMAIL_FROM: ${emailFrom}`)
  } else {
    console.log('⚠️  EMAIL_FROM: Non configuré (optionnel)')
  }

  // 2. Vérifier le Super Admin dans la base de données
  console.log('\n📋 2. SUPER ADMIN DANS LA BASE DE DONNÉES')
  console.log('─────────────────────────────────────────────────────────')
  
  try {
    const superAdmin = await prisma.user.findFirst({
      where: { role: 'superadmin' }
    })

    if (superAdmin) {
      console.log(`✅ Super Admin trouvé:`)
      console.log(`   - Nom: ${superAdmin.nom}`)
      console.log(`   - Email: ${superAdmin.email}`)
      console.log(`   - ID: ${superAdmin.id}`)
      
      if (!superAdmin.email || superAdmin.email === 'admin@example.com') {
        console.log('⚠️  ATTENTION: Email par défaut détecté!')
        console.log('   Vous devez mettre à jour l\'email du Super Admin.')
        allGood = false
      }
    } else {
      console.log('❌ Aucun Super Admin trouvé dans la base de données')
      allGood = false
    }
  } catch (error) {
    console.log('❌ Erreur lors de la vérification du Super Admin:', error)
    allGood = false
  }

  // 3. Vérifier la connexion à la base de données
  console.log('\n📋 3. CONNEXION BASE DE DONNÉES')
  console.log('─────────────────────────────────────────────────────────')
  
  try {
    await prisma.$connect()
    console.log('✅ Connexion à la base de données réussie')
  } catch (error) {
    console.log('❌ Erreur de connexion à la base de données:', error)
    allGood = false
  }

  // 4. Vérifier l'endpoint API
  console.log('\n📋 4. ENDPOINT API')
  console.log('─────────────────────────────────────────────────────────')
  console.log('ℹ️  Endpoint configuré: /api/analytics/send-report')
  console.log('ℹ️  Méthode: GET (pour envoi au Super Admin)')
  console.log('ℹ️  Cron schedule: 0 7 * * * (7h00 UTC = 8h00 locale)')

  // 5. Résumé
  console.log('\n╔════════════════════════════════════════════════════════╗')
  if (allGood) {
    console.log('║   ✅ CONFIGURATION COMPLÈTE ET VALIDE                 ║')
  } else {
    console.log('║   ❌ PROBLÈMES DÉTECTÉS - VOIR CI-DESSUS              ║')
  }
  console.log('╚════════════════════════════════════════════════════════╝\n')

  // 6. Recommandations
  console.log('💡 PROCHAINES ÉTAPES:')
  console.log('─────────────────────────────────────────────────────────')
  
  if (!allGood) {
    console.log('1. Corriger les problèmes identifiés ci-dessus')
    console.log('2. Relancer ce diagnostic pour vérifier')
  } else {
    console.log('1. Tester l\'envoi manuel avec:')
    console.log('   npx tsx scripts/send-report-now.ts')
    console.log('')
    console.log('2. Si déployé sur Vercel:')
    console.log('   - Vérifier que les variables d\'environnement sont configurées')
    console.log('   - Vérifier les logs du cron job dans le dashboard Vercel')
    console.log('')
    console.log('3. Si le cron ne fonctionne pas:')
    console.log('   - Vérifier que vercel.json est bien commité')
    console.log('   - Redéployer l\'application')
  }

  await prisma.$disconnect()
}

diagnostic().catch(console.error)

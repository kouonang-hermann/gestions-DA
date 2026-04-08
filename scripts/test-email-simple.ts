/**
 * TEST SIMPLE - ENVOI DE RAPPORT ANALYTIQUE
 * 
 * Envoie le rapport à votre email pour tester
 * 
 * Usage: npx tsx scripts/test-email-simple.ts votre-email@gmail.com
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { sendAnalyticsReport } from '../lib/analytics-email-service'

// Charger les variables d'environnement depuis .env.local
config({ path: resolve(__dirname, '..', '.env.local') })

async function testEmail() {
  // Récupérer l'email depuis les arguments
  const emailDestination = process.argv[2] || 'hermannfipa@gmail.com'

  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║   📧 TEST ENVOI RAPPORT ANALYTIQUE                    ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  console.log(`📬 Destinataire: ${emailDestination}\n`)

  // Vérifier la configuration
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('❌ Configuration email manquante!\n')
    console.log('🔧 Lancez d\'abord la configuration:')
    console.log('   node scripts/setup-email.js\n')
    return
  }

  console.log('📧 Génération et envoi du rapport...\n')

  try {
    const result = await sendAnalyticsReport(emailDestination)

    if (result.success) {
      console.log('✅ SUCCÈS! Rapport envoyé avec succès!\n')
      console.log('📬 Vérifiez votre boîte email:')
      console.log(`   ${emailDestination}`)
      console.log('   (Vérifiez aussi les spams si nécessaire)\n')
      console.log('📊 Le rapport contient:')
      console.log('   • Tableau 1: Synthèse projets bloqués')
      console.log('   • Tableau 3: Articles non valorisés')
      console.log('   • Tableau 2: Top 20 articles restants')
      console.log('   • Résumé exécutif avec alertes\n')
    } else {
      console.error(`\n❌ ERREUR: ${result.error}\n`)
      console.log('💡 Vérifiez:')
      console.log('   • Mot de passe d\'application correct')
      console.log('   • Connexion internet active')
      console.log('   • Relancez: node scripts/setup-email.js\n')
    }

  } catch (error) {
    console.error('\n❌ ERREUR:', error)
  }
}

testEmail()

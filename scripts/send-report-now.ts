/**
 * ENVOI IMMÉDIAT DU RAPPORT ANALYTIQUE
 * 
 * Script tout-en-un qui configure et envoie le rapport en une seule commande
 * 
 * Usage: npx tsx scripts/send-report-now.ts
 */

import * as readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve))
}

async function sendReportNow() {
  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║   📧 ENVOI RAPPORT ANALYTIQUE - CONFIGURATION         ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  try {
    // Demander les informations
    console.log('📧 Email Gmail pour ENVOYER les rapports:')
    const emailFrom = await question('   (ex: hermannfipa@gmail.com): ')
    
    console.log('\n🔑 Mot de passe d\'application Gmail:')
    console.log('   💡 Obtenez-le sur: https://myaccount.google.com/apppasswords')
    const password = await question('   Mot de passe (16 caractères): ')
    
    console.log('\n📬 Email de DESTINATION (qui recevra le rapport):')
    const emailTo = await question('   (ex: hermannfipa@gmail.com): ')

    rl.close()

    // Configurer les variables d'environnement AVANT d'importer le service
    process.env.EMAIL_USER = emailFrom.trim()
    process.env.EMAIL_PASSWORD = password.trim().replace(/\s/g, '')
    process.env.EMAIL_FROM = `Gestion Demandes <${emailFrom.trim()}>`
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'

    // Importer le service APRÈS avoir configuré les variables d'environnement
    const { sendAnalyticsReport } = await import('../lib/analytics-email-service')

    console.log('\n📧 Génération et envoi du rapport...\n')

    // Envoyer le rapport
    const result = await sendAnalyticsReport(emailTo.trim())

    if (result.success) {
      console.log('╔════════════════════════════════════════════════════════╗')
      console.log('║   ✅ SUCCÈS! RAPPORT ENVOYÉ                           ║')
      console.log('╚════════════════════════════════════════════════════════╝\n')
      console.log(`📬 Vérifiez votre boîte email: ${emailTo.trim()}`)
      console.log('   (Vérifiez aussi les spams si nécessaire)\n')
      console.log('📊 Le rapport contient:')
      console.log('   • Tableau 1: Synthèse projets bloqués')
      console.log('   • Tableau 3: Articles non valorisés (priorité)')
      console.log('   • Tableau 2: Top 20 articles restants')
      console.log('   • Résumé exécutif avec alertes\n')
      
      console.log('💾 Pour sauvegarder cette configuration, créez un fichier .env.local:')
      console.log(`EMAIL_USER=${emailFrom.trim()}`)
      console.log(`EMAIL_PASSWORD=${password.trim().replace(/\s/g, '')}`)
      console.log(`EMAIL_FROM=Gestion Demandes <${emailFrom.trim()}>`)
      console.log('NEXT_PUBLIC_APP_URL=http://localhost:3000\n')
    } else {
      console.log('╔════════════════════════════════════════════════════════╗')
      console.log('║   ❌ ERREUR D\'ENVOI                                   ║')
      console.log('╚════════════════════════════════════════════════════════╝\n')
      console.log(`Erreur: ${result.error}\n`)
      console.log('💡 Vérifiez:')
      console.log('   • Le mot de passe d\'application est correct (16 caractères)')
      console.log('   • La validation en 2 étapes est activée sur Gmail')
      console.log('   • Vous avez une connexion internet\n')
    }

  } catch (error) {
    rl.close()
    console.error('\n❌ ERREUR:', error)
  }
}

sendReportNow()

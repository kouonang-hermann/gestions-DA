/**
 * SCRIPT DE TEST - ENVOI DU RAPPORT ANALYTIQUE
 * 
 * Ce script teste l'envoi du rapport analytique au Super Admin
 * 
 * Usage: npx tsx scripts/test-analytics-report.ts
 */

import { sendReportToSuperAdmin } from '../lib/analytics-email-service'

async function testReport() {
  console.log('📧 [TEST] Démarrage du test d\'envoi du rapport analytique...\n')

  try {
    const result = await sendReportToSuperAdmin()

    if (result.success) {
      console.log('\n✅ [TEST] Rapport envoyé avec succès!')
      console.log('📬 [TEST] Vérifiez votre boîte email (et les spams si nécessaire)')
    } else {
      console.error('\n❌ [TEST] Erreur lors de l\'envoi:', result.error)
    }

  } catch (error) {
    console.error('\n❌ [TEST] Erreur:', error)
  }
}

testReport()

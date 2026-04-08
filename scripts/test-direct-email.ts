/**
 * SCRIPT DE TEST - ENVOI DIRECT
 * 
 * Envoie le rapport directement à hermannfipa@gmail.com
 * IMPORTANT: Configurez vos credentials Gmail ci-dessous
 */

import { sendAnalyticsReport } from '../lib/analytics-email-service'

// ⚠️ CONFIGUREZ VOS CREDENTIALS ICI
const EMAIL_USER = 'hermannfipa@gmail.com'
const EMAIL_PASSWORD = 'VOTRE_MOT_DE_PASSE_APPLICATION_GMAIL' // 16 caractères

// Configurer temporairement les variables d'environnement
process.env.EMAIL_USER = EMAIL_USER
process.env.EMAIL_PASSWORD = EMAIL_PASSWORD
process.env.EMAIL_FROM = 'Gestion Demandes <noreply@gestion-materiel.com>'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'

async function testDirectEmail() {
  console.log('📧 [TEST] Envoi du rapport analytique à hermannfipa@gmail.com...\n')

  if (EMAIL_PASSWORD === 'VOTRE_MOT_DE_PASSE_APPLICATION_GMAIL') {
    console.error('❌ [ERREUR] Veuillez configurer votre mot de passe d\'application Gmail')
    console.log('\n📝 Instructions:')
    console.log('1. Ouvrez ce fichier: scripts/test-direct-email.ts')
    console.log('2. Remplacez VOTRE_MOT_DE_PASSE_APPLICATION_GMAIL par votre mot de passe')
    console.log('3. Relancez: npx tsx scripts/test-direct-email.ts\n')
    console.log('💡 Obtenir un mot de passe d\'application:')
    console.log('   https://myaccount.google.com/apppasswords\n')
    return
  }

  try {
    const result = await sendAnalyticsReport('hermannfipa@gmail.com')

    if (result.success) {
      console.log('\n✅ [SUCCÈS] Rapport envoyé avec succès!')
      console.log('📬 Vérifiez votre boîte email: hermannfipa@gmail.com')
      console.log('   (Vérifiez aussi les spams si nécessaire)\n')
    } else {
      console.error('\n❌ [ERREUR] Échec de l\'envoi:', result.error)
      console.log('\n💡 Vérifiez:')
      console.log('   - Mot de passe d\'application correct (16 caractères)')
      console.log('   - Validation en 2 étapes activée sur Gmail')
      console.log('   - Connexion internet active\n')
    }

  } catch (error) {
    console.error('\n❌ [ERREUR]:', error)
  }
}

testDirectEmail()

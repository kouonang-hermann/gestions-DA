/**
 * ENVOI DIRECT DU RAPPORT À M. ARISTIDE FOUTSAP
 * 
 * Script pour envoyer immédiatement le rapport au Super Admin
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Charger les variables d'environnement depuis .env.local
config({ path: resolve(__dirname, '..', '.env.local') })

// Importer le service APRÈS avoir configuré les variables d'environnement
import { sendAnalyticsReport } from '../lib/analytics-email-service'

async function sendToAristide() {
  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║   📧 ENVOI RAPPORT À M. ARISTIDE FOUTSAP              ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  console.log('📧 Destinataire: aristide.foutsap@instrumelec.com')
  console.log('📧 Expéditeur: hermannfipa@gmail.com')
  console.log('\n📊 Génération et envoi du rapport...\n')

  try {
    const result = await sendAnalyticsReport('aristide.foutsap@instrumelec.com')

    if (result.success) {
      console.log('╔════════════════════════════════════════════════════════╗')
      console.log('║   ✅ SUCCÈS! RAPPORT ENVOYÉ À M. ARISTIDE             ║')
      console.log('╚════════════════════════════════════════════════════════╝\n')
      console.log('📬 M. Aristide Foutsap devrait recevoir le rapport dans quelques instants.')
      console.log('💡 Demandez-lui de vérifier:')
      console.log('   - Sa boîte de réception')
      console.log('   - Ses courriers indésirables/spam')
      console.log('')
    } else {
      console.log('╔════════════════════════════════════════════════════════╗')
      console.log('║   ❌ ERREUR D\'ENVOI                                   ║')
      console.log('╚════════════════════════════════════════════════════════╝\n')
      console.log(`Erreur: ${result.error}\n`)
      console.log('💡 Vérifiez:')
      console.log('   • Les variables d\'environnement dans .env.local')
      console.log('   • Votre connexion internet')
      console.log('   • Le mot de passe d\'application Gmail')
    }
  } catch (error) {
    console.log('╔════════════════════════════════════════════════════════╗')
    console.log('║   ❌ ERREUR CRITIQUE                                  ║')
    console.log('╚════════════════════════════════════════════════════════╝\n')
    console.error(error)
  }
}

sendToAristide().catch(console.error)

/**
 * CONFIGURATION EMAIL - SCRIPT INTERACTIF
 * 
 * Ce script configure automatiquement l'envoi d'emails.
 * Vous n'aurez à le faire qu'UNE SEULE FOIS.
 * 
 * Usage: node scripts/setup-email.js
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function setup() {
  console.log('\n╔════════════════════════════════════════════════════════╗')
  console.log('║   📧 CONFIGURATION EMAIL - RAPPORTS ANALYTIQUES       ║')
  console.log('╚════════════════════════════════════════════════════════╝\n')

  console.log('Cette configuration ne doit être faite qu\'UNE SEULE FOIS.')
  console.log('Ensuite, tous les emails seront envoyés automatiquement.\n')

  // Demander l'email
  const email = await question('📧 Votre email Gmail (ex: hermannfipa@gmail.com): ')
  
  console.log('\n💡 Pour obtenir un mot de passe d\'application Gmail:')
  console.log('   1. Allez sur: https://myaccount.google.com/apppasswords')
  console.log('   2. Créez un mot de passe pour "Gestion Demandes"')
  console.log('   3. Copiez le mot de passe (16 caractères)\n')

  const password = await question('🔑 Mot de passe d\'application Gmail (16 caractères): ')

  // Créer le fichier .env.local
  const envContent = `# Configuration Email - Rapports Analytiques
EMAIL_USER=${email.trim()}
EMAIL_PASSWORD=${password.trim().replace(/\s/g, '')}
EMAIL_FROM=Gestion Demandes <noreply@gestion-materiel.com>
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Configuration générée le ${new Date().toLocaleString('fr-FR')}
`

  const envPath = path.join(__dirname, '..', '.env.local')
  fs.writeFileSync(envPath, envContent, 'utf8')

  console.log('\n✅ Configuration terminée avec succès!')
  console.log('📁 Fichier créé: .env.local\n')

  console.log('🎉 Vous pouvez maintenant:')
  console.log('   1. Tester l\'envoi: npx tsx scripts/test-analytics-report.ts')
  console.log('   2. Envoyer à n\'importe quel email via l\'API\n')

  rl.close()
}

setup().catch(error => {
  console.error('\n❌ Erreur:', error)
  rl.close()
  process.exit(1)
})

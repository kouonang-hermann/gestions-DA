const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Script de build sécurisé pour OneDrive');

// Fonction pour supprimer récursivement un dossier
function removeDir(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      console.log(`🗑️  Suppression de ${dirPath}`);
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`✅ ${dirPath} supprimé`);
    }
  } catch (error) {
    console.log(`⚠️  Impossible de supprimer ${dirPath}: ${error.message}`);
  }
}

// Nettoyer les dossiers de build
console.log('🧹 Nettoyage des dossiers de build...');
removeDir('.next');
removeDir('node_modules/.cache');

// Attendre un peu pour que OneDrive libère les fichiers
console.log('⏳ Attente de 2 secondes...');
setTimeout(() => {
  try {
    console.log('🔧 Génération du client Prisma...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    
    console.log('🏗️  Lancement du build Next.js...');
    execSync('npx next build', { stdio: 'inherit' });
    
    console.log('🎉 Build terminé avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors du build:', error.message);
    process.exit(1);
  }
}, 2000);

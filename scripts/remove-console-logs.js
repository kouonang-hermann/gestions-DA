const fs = require('fs');
const path = require('path');

// Dossiers à traiter
const foldersToClean = [
  'components',
  'app/api',
  'lib',
  'hooks'
];

// Patterns à supprimer
const patterns = [
  /console\.log\([^)]*\);?\s*/g,
  /console\.error\([^)]*\);?\s*/g,
  /console\.warn\([^)]*\);?\s*/g,
  /console\.info\([^)]*\);?\s*/g,
  /console\.debug\([^)]*\);?\s*/g,
];

let totalFilesProcessed = 0;
let totalLogsRemoved = 0;

function cleanFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let logsInFile = 0;

    patterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        logsInFile += matches.length;
        content = content.replace(pattern, '');
      }
    });

    // Nettoyer les lignes vides multiples
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      totalLogsRemoved += logsInFile;
      console.log(`✅ ${path.basename(filePath)}: ${logsInFile} logs supprimés`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Erreur avec ${filePath}:`, error.message);
    return false;
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Ignorer node_modules, .next, etc.
      if (!file.startsWith('.') && file !== 'node_modules') {
        processDirectory(filePath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      // Ignorer les fichiers de test et scripts
      if (!file.includes('test') && !file.includes('debug') && !file.includes('script')) {
        if (cleanFile(filePath)) {
          totalFilesProcessed++;
        }
      }
    }
  });
}

console.log('🧹 Nettoyage des console.log...\n');

foldersToClean.forEach(folder => {
  const folderPath = path.join(process.cwd(), folder);
  if (fs.existsSync(folderPath)) {
    console.log(`\n📁 Traitement de ${folder}/`);
    processDirectory(folderPath);
  }
});

console.log(`\n✨ Terminé !`);
console.log(`📊 ${totalFilesProcessed} fichiers modifiés`);
console.log(`🗑️  ${totalLogsRemoved} console.log supprimés`);

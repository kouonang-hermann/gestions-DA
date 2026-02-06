const fs = require('fs');
const path = require('path');

// Dossiers à traiter
const foldersToClean = [
  'components',
  'app/api',
  'lib',
  'hooks'
];

let totalFilesProcessed = 0;
let totalLogsRemoved = 0;

function cleanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const newLines = [];
    let logsInFile = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Vérifier si la ligne est un console.log complet (commence et se termine correctement)
      const isConsoleLog = 
        (trimmed.startsWith('console.log(') || 
         trimmed.startsWith('console.error(') || 
         trimmed.startsWith('console.warn(') || 
         trimmed.startsWith('console.info(') || 
         trimmed.startsWith('console.debug(')) &&
        (trimmed.endsWith(')') || trimmed.endsWith(');'));
      
      if (isConsoleLog) {
        logsInFile++;
        // Ne pas ajouter cette ligne au résultat
        continue;
      }
      
      newLines.push(line);
    }

    if (logsInFile > 0) {
      fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
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

console.log('🧹 Nettoyage SÉCURISÉ des console.log...\n');
console.log('⚠️  Ce script ne supprime QUE les lignes complètes de console.log\n');

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

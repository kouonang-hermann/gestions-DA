const bcrypt = require('bcryptjs');

// Générer le hash pour le mot de passe "Secure01"
const password = 'Secure01';
const saltRounds = 12; // Même valeur que dans lib/auth.ts

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('❌ Erreur lors du hashage:', err);
    process.exit(1);
  }
  
  console.log('\n✅ Hash généré avec succès!\n');
  console.log('Mot de passe:', password);
  console.log('Hash bcrypt:', hash);
  console.log('\n📋 Copiez ce hash dans votre script SQL:\n');
  console.log(`password: '${hash}'`);
  console.log('\n');
});

#!/usr/bin/env node

/**
 * Script pour seeder la base de données de production
 * Usage: node scripts/seed-production.js
 */

const { execSync } = require('child_process');

console.log('🌱 Début du seeding de la base de données de production...');

try {
  // Définir l'URL de la base de données de production
  // Remplacez par votre vraie URL de production
  const PRODUCTION_DATABASE_URL = process.env.DATABASE_URL;
  
  if (!PRODUCTION_DATABASE_URL) {
    throw new Error('❌ Variable DATABASE_URL non définie');
  }

  console.log('📡 Connexion à la base de données...');
  
  // Générer le client Prisma
  console.log('🔧 Génération du client Prisma...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Pousser le schéma vers la base
  console.log('📤 Synchronisation du schéma...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  
  // Exécuter le seed
  console.log('🌱 Exécution du seed...');
  execSync('npx prisma db seed', { stdio: 'inherit' });
  
  console.log('✅ Seeding terminé avec succès !');
  console.log('');
  console.log('👥 Comptes de test disponibles :');
  console.log('📧 admin@test.com / 🔑 admin123 (Super Admin)');
  console.log('📧 employe@test.com / 🔑 employe123 (Employé)');
  console.log('📧 conducteur@test.com / 🔑 conducteur123 (Conducteur)');
  console.log('📧 qhse@test.com / 🔑 qhse123 (QHSE)');
  console.log('📧 appro@test.com / 🔑 appro123 (Appro)');
  console.log('📧 charge@test.com / 🔑 charge123 (Chargé Affaire)');
  console.log('📧 logistique@test.com / 🔑 logistique123 (Logistique)');
  
} catch (error) {
  console.error('❌ Erreur lors du seeding :', error.message);
  process.exit(1);
}

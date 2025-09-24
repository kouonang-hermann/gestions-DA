#!/usr/bin/env node

/**
 * Script pour exporter les données depuis la base locale
 * Usage: node scripts/export-data.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Prisma client pour la base locale
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./dev.db' // Ajustez selon votre base locale
    }
  }
});

async function exportData() {
  try {
    console.log('📤 Début de l\'export des données...');

    // Export des utilisateurs
    const users = await prisma.user.findMany({
      include: {
        projets: true
      }
    });
    console.log(`👥 ${users.length} utilisateurs trouvés`);

    // Export des projets
    const projets = await prisma.projet.findMany({
      include: {
        utilisateurs: true
      }
    });
    console.log(`📋 ${projets.length} projets trouvés`);

    // Export des demandes
    const demandes = await prisma.demande.findMany({
      include: {
        items: true,
        historique: true
      }
    });
    console.log(`📝 ${demandes.length} demandes trouvées`);

    // Export des articles
    const articles = await prisma.article.findMany();
    console.log(`📦 ${articles.length} articles trouvés`);

    // Export des notifications
    const notifications = await prisma.notification.findMany();
    console.log(`🔔 ${notifications.length} notifications trouvées`);

    // Créer le dossier d'export
    const exportDir = path.join(__dirname, '../data-export');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    // Sauvegarder en JSON
    const exportData = {
      users,
      projets,
      demandes,
      articles,
      notifications,
      exportDate: new Date().toISOString()
    };

    const exportFile = path.join(exportDir, `data-export-${Date.now()}.json`);
    fs.writeFileSync(exportFile, JSON.stringify(exportData, null, 2));

    console.log(`✅ Export terminé : ${exportFile}`);
    console.log(`📊 Résumé :`);
    console.log(`   - ${users.length} utilisateurs`);
    console.log(`   - ${projets.length} projets`);
    console.log(`   - ${demandes.length} demandes`);
    console.log(`   - ${articles.length} articles`);
    console.log(`   - ${notifications.length} notifications`);

  } catch (error) {
    console.error('❌ Erreur lors de l\'export :', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();

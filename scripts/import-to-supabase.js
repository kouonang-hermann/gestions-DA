#!/usr/bin/env node

/**
 * Script pour importer les données vers Supabase
 * Usage: node scripts/import-to-supabase.js [fichier-export.json]
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Prisma client pour Supabase
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL // URL Supabase
    }
  }
});

async function importData(filePath) {
  try {
    console.log('📥 Début de l\'import vers Supabase...');

    // Lire le fichier d'export
    if (!fs.existsSync(filePath)) {
      throw new Error(`Fichier non trouvé : ${filePath}`);
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    console.log(`📂 Fichier chargé : ${data.users?.length || 0} utilisateurs, ${data.demandes?.length || 0} demandes`);

    // Import des utilisateurs
    if (data.users && data.users.length > 0) {
      console.log('👥 Import des utilisateurs...');
      for (const user of data.users) {
        await prisma.user.upsert({
          where: { email: user.email },
          update: {
            nom: user.nom,
            prenom: user.prenom,
            role: user.role,
            isAdmin: user.isAdmin || false
          },
          create: {
            id: user.id,
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            password: user.password,
            role: user.role,
            isAdmin: user.isAdmin || false,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt)
          }
        });
      }
      console.log(`✅ ${data.users.length} utilisateurs importés`);
    }

    // Import des projets
    if (data.projets && data.projets.length > 0) {
      console.log('📋 Import des projets...');
      for (const projet of data.projets) {
        await prisma.projet.upsert({
          where: { id: projet.id },
          update: {
            nom: projet.nom,
            description: projet.description,
            dateDebut: new Date(projet.dateDebut),
            dateFin: projet.dateFin ? new Date(projet.dateFin) : null,
            actif: projet.actif
          },
          create: {
            id: projet.id,
            nom: projet.nom,
            description: projet.description,
            dateDebut: new Date(projet.dateDebut),
            dateFin: projet.dateFin ? new Date(projet.dateFin) : null,
            createdBy: projet.createdBy,
            actif: projet.actif,
            createdAt: new Date(projet.createdAt)
          }
        });
      }
      console.log(`✅ ${data.projets.length} projets importés`);
    }

    // Import des articles
    if (data.articles && data.articles.length > 0) {
      console.log('📦 Import des articles...');
      for (const article of data.articles) {
        await prisma.article.upsert({
          where: { reference: article.reference },
          update: {
            nom: article.nom,
            description: article.description,
            unite: article.unite,
            type: article.type,
            stock: article.stock,
            prixUnitaire: article.prixUnitaire
          },
          create: {
            id: article.id,
            nom: article.nom,
            description: article.description,
            reference: article.reference,
            unite: article.unite,
            type: article.type,
            stock: article.stock,
            prixUnitaire: article.prixUnitaire,
            createdAt: new Date(article.createdAt),
            updatedAt: new Date(article.updatedAt)
          }
        });
      }
      console.log(`✅ ${data.articles.length} articles importés`);
    }

    // Import des demandes
    if (data.demandes && data.demandes.length > 0) {
      console.log('📝 Import des demandes...');
      for (const demande of data.demandes) {
        // Créer la demande
        const newDemande = await prisma.demande.upsert({
          where: { id: demande.id },
          update: {
            status: demande.status,
            commentaire: demande.commentaire,
            dateValidation: demande.dateValidation ? new Date(demande.dateValidation) : null
          },
          create: {
            id: demande.id,
            projetId: demande.projetId,
            demandeurId: demande.demandeurId,
            status: demande.status,
            commentaire: demande.commentaire,
            dateValidation: demande.dateValidation ? new Date(demande.dateValidation) : null,
            createdAt: new Date(demande.createdAt),
            updatedAt: new Date(demande.updatedAt)
          }
        });

        // Import des items de la demande
        if (demande.items && demande.items.length > 0) {
          for (const item of demande.items) {
            await prisma.demandeItem.upsert({
              where: { id: item.id },
              update: {
                quantiteDemandee: item.quantiteDemandee,
                quantiteValidee: item.quantiteValidee
              },
              create: {
                id: item.id,
                demandeId: item.demandeId,
                articleId: item.articleId,
                quantiteDemandee: item.quantiteDemandee,
                quantiteValidee: item.quantiteValidee,
                createdAt: new Date(item.createdAt),
                updatedAt: new Date(item.updatedAt)
              }
            });
          }
        }
      }
      console.log(`✅ ${data.demandes.length} demandes importées`);
    }

    console.log('🎉 Import terminé avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de l\'import :', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Récupérer le fichier depuis les arguments
const filePath = process.argv[2];
if (!filePath) {
  console.error('❌ Usage: node scripts/import-to-supabase.js [fichier-export.json]');
  process.exit(1);
}

importData(path.resolve(filePath));

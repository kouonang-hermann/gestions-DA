/**
 * Script pour réinitialiser complètement la base de données
 */

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function resetDatabase() {
  console.log('🔄 Réinitialisation de la base de données...')
  
  try {
    // Supprimer toutes les données dans l'ordre correct (relations)
    console.log('🗑️ Suppression des données existantes...')
    
    await prisma.historyEntry.deleteMany()
    await prisma.validationSignature.deleteMany()
    await prisma.sortieSignature.deleteMany()
    await prisma.itemDemande.deleteMany()
    await prisma.demande.deleteMany()
    await prisma.userProjet.deleteMany()
    await prisma.article.deleteMany()
    await prisma.projet.deleteMany()
    await prisma.user.deleteMany()
    
    console.log('✅ Données supprimées')
    
    // Recréer les utilisateurs de base
    console.log('👥 Création des utilisateurs...')
    
    const hashedPassword = await bcrypt.hash('admin123', 12)
    const employePassword = await bcrypt.hash('employe123', 12)
    const conducteurPassword = await bcrypt.hash('conducteur123', 12)
    const qhsePassword = await bcrypt.hash('qhse123', 12)
    const approPassword = await bcrypt.hash('appro123', 12)
    const chargePassword = await bcrypt.hash('charge123', 12)
    const logistiquePassword = await bcrypt.hash('logistique123', 12)
    
    const superAdmin = await prisma.user.create({
      data: {
        nom: 'Admin',
        prenom: 'Super',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'superadmin',
        isAdmin: true,
      }
    })
    
    const employe = await prisma.user.create({
      data: {
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'employe@test.com',
        password: employePassword,
        role: 'employe',
        isAdmin: false,
      }
    })
    
    const conducteur = await prisma.user.create({
      data: {
        nom: 'Martin',
        prenom: 'Pierre',
        email: 'conducteur@test.com',
        password: conducteurPassword,
        role: 'conducteur_travaux',
        isAdmin: false,
      }
    })
    
    const qhse = await prisma.user.create({
      data: {
        nom: 'Durand',
        prenom: 'Marie',
        email: 'qhse@test.com',
        password: qhsePassword,
        role: 'responsable_qhse',
        isAdmin: false,
      }
    })
    
    const appro = await prisma.user.create({
      data: {
        nom: 'Moreau',
        prenom: 'Paul',
        email: 'appro@test.com',
        password: approPassword,
        role: 'responsable_appro',
        isAdmin: false,
      }
    })
    
    const charge = await prisma.user.create({
      data: {
        nom: 'Bernard',
        prenom: 'Sophie',
        email: 'charge@test.com',
        password: chargePassword,
        role: 'charge_affaire',
        isAdmin: false,
      }
    })
    
    const logistique = await prisma.user.create({
      data: {
        nom: 'Petit',
        prenom: 'Luc',
        email: 'logistique@test.com',
        password: logistiquePassword,
        role: 'responsable_logistique',
        isAdmin: false,
      }
    })
    
    console.log('✅ Utilisateurs créés')
    
    // Créer un projet de test
    console.log('🏗️ Création du projet de test...')
    
    const projet = await prisma.projet.create({
      data: {
        nom: 'Projet Test',
        description: 'Projet de test pour les demandes de matériel et outillage',
        dateDebut: new Date(),
        dateFin: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // +1 an
        createdBy: superAdmin.id,
        actif: true,
      }
    })
    
    // Assigner tous les utilisateurs au projet
    await prisma.userProjet.createMany({
      data: [
        { userId: employe.id, projetId: projet.id },
        { userId: conducteur.id, projetId: projet.id },
        { userId: qhse.id, projetId: projet.id },
        { userId: appro.id, projetId: projet.id },
        { userId: charge.id, projetId: projet.id },
        { userId: logistique.id, projetId: projet.id },
      ]
    })
    
    console.log('✅ Projet créé et utilisateurs assignés')
    
    // Créer quelques articles de base
    console.log('📦 Création des articles de base...')
    
    await prisma.article.createMany({
      data: [
        {
          nom: 'Casque de sécurité',
          description: 'Casque de protection individuelle',
          reference: 'CAS-001',
          unite: 'pièce',
          type: 'materiel',
          stock: 50,
          prixUnitaire: 25.99
        },
        {
          nom: 'Perceuse électrique',
          description: 'Perceuse électrique 18V',
          reference: 'PER-001',
          unite: 'pièce',
          type: 'outillage',
          stock: 10,
          prixUnitaire: 149.99
        },
        {
          nom: 'Gants de protection',
          description: 'Gants de protection anti-coupure',
          reference: 'GAN-001',
          unite: 'paire',
          type: 'materiel',
          stock: 100,
          prixUnitaire: 12.50
        }
      ]
    })
    
    console.log('✅ Articles créés')
    
    console.log('\n🎉 Base de données réinitialisée avec succès!')
    console.log('\n📋 Comptes créés:')
    console.log('- SuperAdmin: admin@example.com / admin123')
    console.log('- Employé: employe@test.com / employe123')
    console.log('- Conducteur: conducteur@test.com / conducteur123')
    console.log('- QHSE: qhse@test.com / qhse123')
    console.log('- Appro: appro@test.com / appro123')
    console.log('- Chargé Affaires: charge@test.com / charge123')
    console.log('- Logistique: logistique@test.com / logistique123')
    
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error)
  } finally {
    await prisma.$disconnect()
  }
}

resetDatabase()

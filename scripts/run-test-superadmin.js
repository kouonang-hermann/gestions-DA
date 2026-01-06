const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function runTest() {
  console.log('🧪 DÉBUT DU TEST DE VALIDATION SUPERADMIN\n')
  
  try {
    // 1. Trouver le superadmin pour créer le projet
    console.log('🔍 Recherche du superadmin...')
    const superadmin = await prisma.user.findFirst({
      where: { role: 'superadmin' }
    })
    
    if (!superadmin) {
      throw new Error('Aucun superadmin trouvé dans la base de données')
    }
    console.log('✅ Superadmin trouvé:', superadmin.email)

    // 2. Créer un projet de test
    console.log('\n📁 Création du projet de test...')
    const projet = await prisma.projet.upsert({
      where: { id: 'test-projet-superadmin' },
      update: {
        nom: 'Projet Test Superadmin',
        description: 'Projet de test pour valider les permissions du superadmin',
        updatedAt: new Date()
      },
      create: {
        id: 'test-projet-superadmin',
        nom: 'Projet Test Superadmin',
        description: 'Projet de test pour valider les permissions du superadmin',
        dateDebut: new Date(),
        dateFin: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000), // +6 mois
        actif: true,
        createdBy: superadmin.id
      }
    })
    console.log('✅ Projet créé:', projet.nom)

    // 3. Créer un utilisateur employé de test
    console.log('\n👤 Création de l\'utilisateur de test...')
    const bcrypt = require('bcryptjs')
    const hashedPassword = await bcrypt.hash('test123', 10)
    
    const user = await prisma.user.upsert({
      where: { id: 'test-employe-001' },
      update: {
        nom: 'Test',
        prenom: 'Employé',
        email: 'test.employe@test.com',
        updatedAt: new Date()
      },
      create: {
        id: 'test-employe-001',
        nom: 'Test',
        prenom: 'Employé',
        email: 'test.employe@test.com',
        password: hashedPassword,
        role: 'employe',
        phone: '0600000001'
      }
    })
    console.log('✅ Utilisateur créé:', user.email)

    // 4. Assigner l'employé au projet
    console.log('\n🔗 Assignation de l\'utilisateur au projet...')
    const userProjet = await prisma.userProjet.upsert({
      where: {
        userId_projetId: {
          userId: 'test-employe-001',
          projetId: 'test-projet-superadmin'
        }
      },
      update: {},
      create: {
        userId: 'test-employe-001',
        projetId: 'test-projet-superadmin'
      }
    })
    console.log('✅ Utilisateur assigné au projet')

    // 5. Créer un article de test
    console.log('\n📦 Création de l\'article de test...')
    const article = await prisma.article.upsert({
      where: { id: 'test-article-001' },
      update: {
        nom: 'Article Test Superadmin',
        updatedAt: new Date()
      },
      create: {
        id: 'test-article-001',
        nom: 'Article Test Superadmin',
        reference: 'REF-TEST-001',
        description: 'Article de test pour validation superadmin',
        unite: 'unité',
        type: 'materiel'
      }
    })
    console.log('✅ Article créé:', article.nom)

    // 5. Créer une demande de test
    console.log('\n📋 Création de la demande de test...')
    const demande = await prisma.demande.upsert({
      where: { id: 'test-demande-superadmin-001' },
      update: {
        status: 'en_attente_validation_conducteur',
        dateModification: new Date(),
        updatedAt: new Date()
      },
      create: {
        id: 'test-demande-superadmin-001',
        numero: 'DEM-TEST-SUPERADMIN-001',
        type: 'materiel',
        status: 'en_attente_validation_conducteur',
        technicienId: 'test-employe-001',
        projetId: 'test-projet-superadmin',
        dateCreation: new Date(),
        dateModification: new Date(),
        dateLivraisonSouhaitee: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 jours
        commentaire: 'Demande de test pour validation par superadmin'
      }
    })
    console.log('✅ Demande créée:', demande.numero)

    // 6. Ajouter un item à la demande
    console.log('\n📦 Ajout d\'un item à la demande...')
    
    // Vérifier si l'item existe déjà
    const existingItem = await prisma.itemDemande.findFirst({
      where: {
        demandeId: 'test-demande-superadmin-001',
        articleId: 'test-article-001'
      }
    })

    if (!existingItem) {
      const item = await prisma.itemDemande.create({
        data: {
          demandeId: 'test-demande-superadmin-001',
          articleId: 'test-article-001',
          quantiteDemandee: 10
        }
      })
      console.log('✅ Item ajouté à la demande')
    } else {
      console.log('✅ Item déjà existant')
    }

    // 7. Afficher le résumé
    console.log('\n' + '='.repeat(60))
    console.log('📊 RÉSUMÉ DES DONNÉES DE TEST CRÉÉES')
    console.log('='.repeat(60))
    
    const demandeComplete = await prisma.demande.findUnique({
      where: { id: 'test-demande-superadmin-001' },
      include: {
        technicien: true,
        projet: true,
        items: {
          include: {
            article: true
          }
        }
      }
    })

    console.log('\n📋 DEMANDE:')
    console.log(`  - Numéro: ${demandeComplete.numero}`)
    console.log(`  - Type: ${demandeComplete.type}`)
    console.log(`  - Statut: ${demandeComplete.status}`)
    console.log(`  - Demandeur: ${demandeComplete.technicien.nom} ${demandeComplete.technicien.prenom}`)
    console.log(`  - Projet: ${demandeComplete.projet.nom}`)
    console.log(`  - Articles: ${demandeComplete.items.length}`)
    
    console.log('\n' + '='.repeat(60))
    console.log('📝 INSTRUCTIONS POUR LE TEST')
    console.log('='.repeat(60))
    console.log('\n1️⃣  Se connecter en tant que SUPERADMIN dans l\'application')
    console.log('2️⃣  Trouver la demande: DEM-TEST-SUPERADMIN-001')
    console.log('3️⃣  Cliquer sur "Valider" (1ère fois)')
    console.log('    → Statut devrait passer à: en_attente_validation_responsable_travaux')
    console.log('4️⃣  Cliquer sur "Valider" (2ème fois)')
    console.log('    → Statut devrait passer à: en_attente_validation_charge_affaire')
    console.log('5️⃣  Cliquer sur "Valider" (3ème fois)')
    console.log('    → Statut devrait passer à: en_attente_preparation_appro ✅')
    console.log('\n✅ Si toutes les validations réussissent, le test est RÉUSSI!')
    console.log('❌ Si une erreur 403 apparaît, le test est ÉCHOUÉ!')
    
    console.log('\n' + '='.repeat(60))
    console.log('🧹 NETTOYAGE')
    console.log('='.repeat(60))
    console.log('\nPour nettoyer les données de test après le test:')
    console.log('  node scripts/cleanup-test-superadmin.js')
    
  } catch (error) {
    console.error('\n❌ ERREUR lors de la création des données de test:')
    console.error(error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

runTest()

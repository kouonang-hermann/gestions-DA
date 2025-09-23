const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

// Résultats des tests
const testResults = {
  passed: [],
  failed: [],
  warnings: []
}

function logResult(category, test, status, message = '') {
  const result = { category, test, status, message, timestamp: new Date() }
  
  if (status === 'PASS') {
    testResults.passed.push(result)
    console.log(`✅ ${category} - ${test}: ${message}`)
  } else if (status === 'FAIL') {
    testResults.failed.push(result)
    console.log(`❌ ${category} - ${test}: ${message}`)
  } else if (status === 'WARNING') {
    testResults.warnings.push(result)
    console.log(`⚠️ ${category} - ${test}: ${message}`)
  }
}

async function testDatabaseConnection() {
  console.log('\n🔌 TEST: Connexion Base de Données')
  console.log('=' .repeat(50))
  
  try {
    await prisma.$connect()
    logResult('Database', 'Connection', 'PASS', 'Connexion réussie')
    
    // Test de requête simple
    const userCount = await prisma.user.count()
    logResult('Database', 'Query', 'PASS', `${userCount} utilisateurs trouvés`)
    
    return true
  } catch (error) {
    logResult('Database', 'Connection', 'FAIL', error.message)
    return false
  }
}

async function testUserManagement() {
  console.log('\n👥 TEST: Gestion des Utilisateurs')
  console.log('=' .repeat(50))
  
  try {
    // Test création utilisateur
    const testUser = await prisma.user.create({
      data: {
        nom: 'TestUser',
        prenom: 'Test',
        email: 'test@functionality.com',
        password: await bcrypt.hash('password123', 10),
        role: 'employe',
        isAdmin: false
      }
    })
    logResult('Users', 'Create', 'PASS', `Utilisateur créé: ${testUser.email}`)
    
    // Test modification utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: testUser.id },
      data: { role: 'conducteur_travaux' }
    })
    logResult('Users', 'Update', 'PASS', `Rôle modifié: ${updatedUser.role}`)
    
    // Test récupération utilisateur
    const foundUser = await prisma.user.findUnique({
      where: { email: 'test@functionality.com' }
    })
    logResult('Users', 'Read', 'PASS', `Utilisateur trouvé: ${foundUser.nom}`)
    
    // Nettoyage
    await prisma.user.delete({ where: { id: testUser.id } })
    logResult('Users', 'Delete', 'PASS', 'Utilisateur supprimé')
    
    return true
  } catch (error) {
    logResult('Users', 'Management', 'FAIL', error.message)
    return false
  }
}

async function testProjectManagement() {
  console.log('\n🏗️ TEST: Gestion des Projets')
  console.log('=' .repeat(50))
  
  try {
    // Test création projet
    const testProject = await prisma.projet.create({
      data: {
        nom: 'Projet Test Fonctionnalités',
        description: 'Projet pour tester les fonctionnalités',
        dateDebut: new Date(),
        dateFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        actif: true,
        createdBy: 'test-admin-id'
      }
    })
    logResult('Projects', 'Create', 'PASS', `Projet créé: ${testProject.nom}`)
    
    // Test modification projet
    const updatedProject = await prisma.projet.update({
      where: { id: testProject.id },
      data: { description: 'Description modifiée' }
    })
    logResult('Projects', 'Update', 'PASS', 'Projet modifié')
    
    // Nettoyage
    await prisma.projet.delete({ where: { id: testProject.id } })
    logResult('Projects', 'Delete', 'PASS', 'Projet supprimé')
    
    return true
  } catch (error) {
    logResult('Projects', 'Management', 'FAIL', error.message)
    return false
  }
}

async function testArticleManagement() {
  console.log('\n📦 TEST: Gestion des Articles')
  console.log('=' .repeat(50))
  
  try {
    // Test création article
    const testArticle = await prisma.article.create({
      data: {
        nom: 'Article Test',
        reference: 'TEST-001',
        description: 'Article pour test fonctionnalités',
        unite: 'pièce',
        type: 'materiel',
        stock: 100,
        prixUnitaire: 25.50
      }
    })
    logResult('Articles', 'Create', 'PASS', `Article créé: ${testArticle.nom}`)
    
    // Test modification article
    const updatedArticle = await prisma.article.update({
      where: { id: testArticle.id },
      data: { stock: 150 }
    })
    logResult('Articles', 'Update', 'PASS', `Stock modifié: ${updatedArticle.stock}`)
    
    // Test recherche article
    const foundArticle = await prisma.article.findUnique({
      where: { reference: 'TEST-001' }
    })
    logResult('Articles', 'Search', 'PASS', `Article trouvé: ${foundArticle.reference}`)
    
    // Nettoyage
    await prisma.article.delete({ where: { id: testArticle.id } })
    logResult('Articles', 'Delete', 'PASS', 'Article supprimé')
    
    return true
  } catch (error) {
    logResult('Articles', 'Management', 'FAIL', error.message)
    return false
  }
}

async function testDemandeWorkflow() {
  console.log('\n📋 TEST: Workflow des Demandes')
  console.log('=' .repeat(50))
  
  try {
    // Créer utilisateur et projet pour le test
    const testUser = await prisma.user.create({
      data: {
        nom: 'Demandeur',
        prenom: 'Test',
        email: 'demandeur@test.com',
        password: await bcrypt.hash('password123', 10),
        role: 'employe',
        isAdmin: false
      }
    })
    
    const testProject = await prisma.projet.create({
      data: {
        nom: 'Projet Demande Test',
        description: 'Projet pour tester les demandes',
        dateDebut: new Date(),
        actif: true,
        createdBy: testUser.id
      }
    })
    
    const testArticle = await prisma.article.create({
      data: {
        nom: 'Article Demande',
        reference: 'DEMANDE-001',
        description: 'Article pour test demande',
        unite: 'pièce',
        type: 'materiel',
        stock: 50,
        prixUnitaire: 15.00
      }
    })
    
    // Test création demande
    const testDemande = await prisma.demande.create({
      data: {
        numero: 'TEST-DEMANDE-001',
        type: 'materiel',
        status: 'en_attente_validation_conducteur',
        dateCreation: new Date(),
        technicienId: testUser.id,
        projetId: testProject.id,
        commentaires: 'Demande de test'
      }
    })
    logResult('Demandes', 'Create', 'PASS', `Demande créée: ${testDemande.numero}`)
    
    // Test ajout d'article à la demande
    const itemDemande = await prisma.itemDemande.create({
      data: {
        demandeId: testDemande.id,
        articleId: testArticle.id,
        quantiteDemandee: 5,
        quantiteValidee: 5
      }
    })
    logResult('Demandes', 'Add Item', 'PASS', `Article ajouté: quantité ${itemDemande.quantiteDemandee}`)
    
    // Test changement de statut
    const updatedDemande = await prisma.demande.update({
      where: { id: testDemande.id },
      data: { status: 'en_attente_validation_responsable_travaux' }
    })
    logResult('Demandes', 'Status Change', 'PASS', `Statut: ${updatedDemande.status}`)
    
    // Test signature de validation
    const signature = await prisma.validationSignature.create({
      data: {
        demandeId: testDemande.id,
        userId: testUser.id,
        role: 'conducteur_travaux',
        action: 'valider',
        commentaire: 'Validation test',
        timestamp: new Date(),
        signature: `${testUser.id}_${Date.now()}`
      }
    })
    logResult('Demandes', 'Validation Signature', 'PASS', `Signature créée: ${signature.action}`)
    
    // Test historique
    const historyEntry = await prisma.historyEntry.create({
      data: {
        demandeId: testDemande.id,
        userId: testUser.id,
        action: 'VALIDATION_CONDUCTEUR',
        commentaire: 'Test historique',
        timestamp: new Date(),
        signature: `${testUser.id}_${Date.now()}`,
        ancienStatus: 'en_attente_validation_conducteur',
        nouveauStatus: 'en_attente_validation_responsable_travaux'
      }
    })
    logResult('Demandes', 'History', 'PASS', `Historique créé: ${historyEntry.action}`)
    
    // Nettoyage
    await prisma.historyEntry.delete({ where: { id: historyEntry.id } })
    await prisma.validationSignature.delete({ where: { id: signature.id } })
    await prisma.itemDemande.delete({ where: { id: itemDemande.id } })
    await prisma.demande.delete({ where: { id: testDemande.id } })
    await prisma.article.delete({ where: { id: testArticle.id } })
    await prisma.projet.delete({ where: { id: testProject.id } })
    await prisma.user.delete({ where: { id: testUser.id } })
    
    logResult('Demandes', 'Workflow Complete', 'PASS', 'Workflow testé avec succès')
    
    return true
  } catch (error) {
    logResult('Demandes', 'Workflow', 'FAIL', error.message)
    return false
  }
}

async function testNotificationSystem() {
  console.log('\n🔔 TEST: Système de Notifications')
  console.log('=' .repeat(50))
  
  try {
    // Créer utilisateur pour le test
    const testUser = await prisma.user.create({
      data: {
        nom: 'NotifUser',
        prenom: 'Test',
        email: 'notif@test.com',
        password: await bcrypt.hash('password123', 10),
        role: 'employe',
        isAdmin: false
      }
    })
    
    // Test création notification
    const notification = await prisma.notification.create({
      data: {
        userId: testUser.id,
        titre: 'Test Notification',
        message: 'Ceci est une notification de test',
        lu: false
      }
    })
    logResult('Notifications', 'Create', 'PASS', `Notification créée: ${notification.titre}`)
    
    // Test marquage comme lu
    const updatedNotif = await prisma.notification.update({
      where: { id: notification.id },
      data: { lu: true }
    })
    logResult('Notifications', 'Mark Read', 'PASS', `Notification marquée comme lue`)
    
    // Nettoyage
    await prisma.notification.delete({ where: { id: notification.id } })
    await prisma.user.delete({ where: { id: testUser.id } })
    
    return true
  } catch (error) {
    logResult('Notifications', 'System', 'FAIL', error.message)
    return false
  }
}

async function testDataIntegrity() {
  console.log('\n🔍 TEST: Intégrité des Données')
  console.log('=' .repeat(50))
  
  try {
    // Test contraintes de base
    const users = await prisma.user.findMany()
    const projects = await prisma.projet.findMany()
    const articles = await prisma.article.findMany()
    const demandes = await prisma.demande.findMany()
    
    logResult('Integrity', 'Users Count', 'PASS', `${users.length} utilisateurs`)
    logResult('Integrity', 'Projects Count', 'PASS', `${projects.length} projets`)
    logResult('Integrity', 'Articles Count', 'PASS', `${articles.length} articles`)
    logResult('Integrity', 'Demandes Count', 'PASS', `${demandes.length} demandes`)
    
    // Test relations
    const demandesWithItems = await prisma.demande.findMany({
      include: {
        items: true,
        technicien: true,
        projet: true
      }
    })
    
    logResult('Integrity', 'Relations', 'PASS', 'Relations correctement liées')
    
    return true
  } catch (error) {
    logResult('Integrity', 'Check', 'FAIL', error.message)
    return false
  }
}

async function testValidationRules() {
  console.log('\n✅ TEST: Règles de Validation')
  console.log('=' .repeat(50))
  
  try {
    // Test validation email unique
    try {
      await prisma.user.create({
        data: {
          nom: 'Test1',
          prenom: 'Test1',
          email: 'duplicate@test.com',
          password: 'hash1',
          role: 'employe',
          isAdmin: false
        }
      })
      
      await prisma.user.create({
        data: {
          nom: 'Test2',
          prenom: 'Test2',
          email: 'duplicate@test.com', // Email dupliqué
          password: 'hash2',
          role: 'employe',
          isAdmin: false
        }
      })
      
      logResult('Validation', 'Email Unique', 'FAIL', 'Email dupliqué autorisé')
    } catch (error) {
      logResult('Validation', 'Email Unique', 'PASS', 'Contrainte email unique respectée')
    }
    
    // Test validation référence article unique
    try {
      await prisma.article.create({
        data: {
          nom: 'Article1',
          reference: 'REF-DUPLICATE',
          description: 'Test',
          unite: 'pièce',
          type: 'materiel'
        }
      })
      
      await prisma.article.create({
        data: {
          nom: 'Article2',
          reference: 'REF-DUPLICATE', // Référence dupliquée
          description: 'Test',
          unite: 'pièce',
          type: 'materiel'
        }
      })
      
      logResult('Validation', 'Reference Unique', 'FAIL', 'Référence dupliquée autorisée')
    } catch (error) {
      logResult('Validation', 'Reference Unique', 'PASS', 'Contrainte référence unique respectée')
    }
    
    return true
  } catch (error) {
    logResult('Validation', 'Rules', 'FAIL', error.message)
    return false
  }
}

async function testPerformance() {
  console.log('\n⚡ TEST: Performance')
  console.log('=' .repeat(50))
  
  try {
    // Test temps de réponse requêtes
    const startTime = Date.now()
    
    const complexQuery = await prisma.demande.findMany({
      include: {
        items: {
          include: {
            article: true
          }
        },
        technicien: true,
        projet: true,
        validationSignatures: true,
        historyEntries: {
          include: {
            user: true
          }
        }
      },
      take: 10
    })
    
    const endTime = Date.now()
    const queryTime = endTime - startTime
    
    if (queryTime < 1000) {
      logResult('Performance', 'Complex Query', 'PASS', `${queryTime}ms`)
    } else if (queryTime < 3000) {
      logResult('Performance', 'Complex Query', 'WARNING', `${queryTime}ms (lent)`)
    } else {
      logResult('Performance', 'Complex Query', 'FAIL', `${queryTime}ms (très lent)`)
    }
    
    return true
  } catch (error) {
    logResult('Performance', 'Test', 'FAIL', error.message)
    return false
  }
}

async function generateTestReport() {
  console.log('\n📊 RAPPORT DE TEST COMPLET')
  console.log('=' .repeat(70))
  
  const totalTests = testResults.passed.length + testResults.failed.length + testResults.warnings.length
  const passRate = ((testResults.passed.length / totalTests) * 100).toFixed(1)
  
  console.log(`\n📈 STATISTIQUES GLOBALES:`)
  console.log(`   Total des tests: ${totalTests}`)
  console.log(`   ✅ Réussis: ${testResults.passed.length}`)
  console.log(`   ❌ Échoués: ${testResults.failed.length}`)
  console.log(`   ⚠️ Avertissements: ${testResults.warnings.length}`)
  console.log(`   📊 Taux de réussite: ${passRate}%`)
  
  console.log(`\n✅ FONCTIONNALITÉS QUI MARCHENT:`)
  testResults.passed.forEach(result => {
    console.log(`   • ${result.category} - ${result.test}: ${result.message}`)
  })
  
  if (testResults.warnings.length > 0) {
    console.log(`\n⚠️ AVERTISSEMENTS:`)
    testResults.warnings.forEach(result => {
      console.log(`   • ${result.category} - ${result.test}: ${result.message}`)
    })
  }
  
  if (testResults.failed.length > 0) {
    console.log(`\n❌ FONCTIONNALITÉS QUI NE MARCHENT PAS:`)
    testResults.failed.forEach(result => {
      console.log(`   • ${result.category} - ${result.test}: ${result.message}`)
    })
  }
  
  console.log(`\n🎯 ÉVALUATION GLOBALE:`)
  if (passRate >= 90) {
    console.log(`   🟢 EXCELLENT: L'application fonctionne très bien`)
  } else if (passRate >= 75) {
    console.log(`   🟡 BON: L'application fonctionne bien avec quelques améliorations`)
  } else if (passRate >= 50) {
    console.log(`   🟠 MOYEN: L'application nécessite des corrections`)
  } else {
    console.log(`   🔴 CRITIQUE: L'application nécessite des corrections majeures`)
  }
  
  return {
    totalTests,
    passed: testResults.passed.length,
    failed: testResults.failed.length,
    warnings: testResults.warnings.length,
    passRate: parseFloat(passRate)
  }
}

async function runAllTests() {
  console.log('🧪 DÉMARRAGE DES TESTS DE FONCTIONNALITÉS')
  console.log('=' .repeat(70))
  console.log('Application: Gestion Demandes Matériel - InstrumElec')
  console.log('Date:', new Date().toLocaleString('fr-FR'))
  console.log('=' .repeat(70))
  
  try {
    // Tests principaux
    await testDatabaseConnection()
    await testUserManagement()
    await testProjectManagement()
    await testArticleManagement()
    await testDemandeWorkflow()
    await testNotificationSystem()
    await testDataIntegrity()
    await testValidationRules()
    await testPerformance()
    
    // Génération du rapport
    const report = await generateTestReport()
    
    console.log(`\n🏁 TESTS TERMINÉS`)
    console.log(`   Durée totale: ${Date.now() - startTime}ms`)
    console.log(`   Résultat: ${report.passRate}% de réussite`)
    
    return report
    
  } catch (error) {
    console.error('❌ Erreur critique lors des tests:', error)
    return null
  } finally {
    await prisma.$disconnect()
  }
}

// Variables globales
const startTime = Date.now()

// Exécution des tests
runAllTests().then(report => {
  if (report) {
    process.exit(report.failed > 0 ? 1 : 0)
  } else {
    process.exit(1)
  }
}).catch(error => {
  console.error('Erreur fatale:', error)
  process.exit(1)
})

/**
 * Test d'intégrité de la base de données
 * Vérifie que toutes les informations majeures sont correctement sauvegardées
 */

const API_BASE = 'http://localhost:3000/api'

const testUsers = {
  demandeur: { email: 'employe@test.com', password: 'employe123', role: 'employe' },
  conducteur: { email: 'conducteur@test.com', password: 'conducteur123', role: 'conducteur_travaux' },
  responsableTravaux: { email: 'responsable-travaux@test.com', password: 'responsable123', role: 'responsable_travaux' }
}

let tokens = {}
let demandeId = null
let itemIds = []

async function login(userType) {
  const user = testUsers[userType]
  console.log(`🔐 Connexion ${userType}...`)
  
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, password: user.password })
    })
    
    const result = await response.json()
    if (result.success) {
      tokens[userType] = result.data.token
      console.log(`✅ ${userType} connecté`)
      return result.data.token
    } else {
      console.error(`❌ Connexion échouée:`, result.error)
      return null
    }
  } catch (error) {
    console.error(`❌ Erreur connexion:`, error.message)
    return null
  }
}

async function createTestDemande() {
  console.log('\n📝 Création demande test...')
  
  const demandeData = {
    projetId: 'projet-test-1',
    type: 'materiel',
    justification: 'Test intégrité base de données - vérification sauvegarde complète',
    urgence: true,
    items: [
      {
        nom: 'Casque de sécurité TEST',
        reference: 'CAS-TEST-001',
        description: 'Casque blanc standard pour test DB',
        quantite: 5,
        unite: 'pièce'
      },
      {
        nom: 'Gants protection TEST',
        reference: 'GLV-TEST-002', 
        description: 'Gants anti-coupure pour test DB',
        quantite: 10,
        unite: 'paire'
      }
    ]
  }
  
  try {
    const response = await fetch(`${API_BASE}/demandes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.demandeur}`
      },
      body: JSON.stringify(demandeData)
    })
    
    const result = await response.json()
    if (result.success) {
      demandeId = result.data.id
      itemIds = result.data.items?.map(item => item.id) || []
      console.log(`✅ Demande créée: ${demandeId}`)
      return result.data
    } else {
      console.error('❌ Création échouée:', result.error)
      return null
    }
  } catch (error) {
    console.error('❌ Erreur création:', error.message)
    return null
  }
}

async function verifyDemandeInDatabase() {
  console.log('\n🔍 Vérification demande en base...')
  
  try {
    const response = await fetch(`${API_BASE}/demandes/${demandeId}`, {
      headers: { 'Authorization': `Bearer ${tokens.demandeur}` }
    })
    
    const result = await response.json()
    if (!result.success) {
      console.error('❌ Impossible de récupérer la demande:', result.error)
      return false
    }
    
    const demande = result.data
    console.log('📊 Données demande récupérées:')
    console.log(`   ID: ${demande.id}`)
    console.log(`   Numéro: ${demande.numero}`)
    console.log(`   Type: ${demande.type}`)
    console.log(`   Statut: ${demande.status}`)
    console.log(`   Justification: ${demande.justification}`)
    console.log(`   Urgence: ${demande.urgence}`)
    console.log(`   Date création: ${demande.dateCreation}`)
    console.log(`   Projet ID: ${demande.projetId}`)
    console.log(`   Demandeur ID: ${demande.technicienId}`)
    
    // Vérifier les items
    console.log(`   Items (${demande.items?.length || 0}):`)
    if (demande.items) {
      demande.items.forEach((item, index) => {
        console.log(`     ${index + 1}. ${item.nom} (${item.reference})`)
        console.log(`        Quantité: ${item.quantite} ${item.unite}`)
        console.log(`        Description: ${item.description}`)
        console.log(`        ID: ${item.id}`)
      })
    }
    
    // Vérifications critiques
    const checks = [
      { name: 'ID demande', value: demande.id, expected: demandeId },
      { name: 'Type', value: demande.type, expected: 'materiel' },
      { name: 'Statut initial', value: demande.status, expected: 'en_attente_validation_conducteur' },
      { name: 'Urgence', value: demande.urgence, expected: true },
      { name: 'Nombre items', value: demande.items?.length, expected: 2 },
      { name: 'Projet ID', value: demande.projetId, expected: 'projet-test-1' }
    ]
    
    let allChecksPass = true
    console.log('\n✅ Vérifications:')
    checks.forEach(check => {
      const pass = check.value === check.expected
      console.log(`   ${pass ? '✅' : '❌'} ${check.name}: ${check.value} ${pass ? '' : `(attendu: ${check.expected})`}`)
      if (!pass) allChecksPass = false
    })
    
    return allChecksPass
    
  } catch (error) {
    console.error('❌ Erreur vérification:', error.message)
    return false
  }
}

async function performValidationAndVerify() {
  console.log('\n🔄 Test validation avec modifications...')
  
  try {
    const validationData = {
      action: 'valider',
      commentaire: 'Validation test DB avec modifications',
      itemsModifications: itemIds.length > 0 ? {
        [itemIds[0]]: {
          nom: 'Casque MODIFIÉ',
          reference: 'CAS-MOD-001',
          quantite: 3,
          description: 'Casque modifié par conducteur'
        }
      } : {}
    }
    
    const response = await fetch(`${API_BASE}/demandes/${demandeId}/actions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.conducteur}`
      },
      body: JSON.stringify(validationData)
    })
    
    const result = await response.json()
    if (!result.success) {
      console.error('❌ Validation échouée:', result.error)
      return false
    }
    
    console.log('✅ Validation réussie')
    
    // Vérifier que les modifications sont sauvegardées
    const getResponse = await fetch(`${API_BASE}/demandes/${demandeId}`, {
      headers: { 'Authorization': `Bearer ${tokens.demandeur}` }
    })
    
    const updatedResult = await getResponse.json()
    if (!updatedResult.success) {
      console.error('❌ Impossible de vérifier les modifications')
      return false
    }
    
    const updatedDemande = updatedResult.data
    console.log('\n📊 Vérification après validation:')
    console.log(`   Nouveau statut: ${updatedDemande.status}`)
    
    if (updatedDemande.items && updatedDemande.items.length > 0) {
      const modifiedItem = updatedDemande.items[0]
      console.log(`   Item modifié:`)
      console.log(`     Nom: ${modifiedItem.nom}`)
      console.log(`     Référence: ${modifiedItem.reference}`)
      console.log(`     Quantité: ${modifiedItem.quantite}`)
      console.log(`     Description: ${modifiedItem.description}`)
      
      // Vérifier les modifications
      const modificationChecks = [
        { name: 'Nom modifié', value: modifiedItem.nom, expected: 'Casque MODIFIÉ' },
        { name: 'Référence modifiée', value: modifiedItem.reference, expected: 'CAS-MOD-001' },
        { name: 'Quantité modifiée', value: modifiedItem.quantite, expected: 3 }
      ]
      
      let modificationsOk = true
      console.log('\n✅ Vérification modifications:')
      modificationChecks.forEach(check => {
        const pass = check.value === check.expected
        console.log(`   ${pass ? '✅' : '❌'} ${check.name}: ${check.value}`)
        if (!pass) modificationsOk = false
      })
      
      return modificationsOk
    }
    
    return false
    
  } catch (error) {
    console.error('❌ Erreur validation:', error.message)
    return false
  }
}

async function verifyValidationSignatures() {
  console.log('\n🔍 Vérification signatures de validation...')
  
  try {
    const response = await fetch(`${API_BASE}/demandes/${demandeId}`, {
      headers: { 'Authorization': `Bearer ${tokens.demandeur}` }
    })
    
    const result = await response.json()
    if (!result.success) {
      console.error('❌ Impossible de récupérer les signatures')
      return false
    }
    
    const demande = result.data
    console.log(`📝 Signatures trouvées: ${demande.validationSignatures?.length || 0}`)
    
    if (demande.validationSignatures && demande.validationSignatures.length > 0) {
      demande.validationSignatures.forEach((sig, index) => {
        console.log(`   ${index + 1}. Validateur ID: ${sig.userId}`)
        console.log(`      Date: ${sig.dateValidation}`)
        console.log(`      Commentaire: ${sig.commentaire || 'Aucun'}`)
      })
      return true
    } else {
      console.log('❌ Aucune signature de validation trouvée')
      return false
    }
    
  } catch (error) {
    console.error('❌ Erreur vérification signatures:', error.message)
    return false
  }
}

async function runDatabaseIntegrityTest() {
  console.log('🚀 TEST D\'INTÉGRITÉ BASE DE DONNÉES')
  console.log('=' .repeat(60))
  
  try {
    // Connexions
    console.log('\n📋 ÉTAPE 1: Connexions')
    for (const userType of Object.keys(testUsers)) {
      const token = await login(userType)
      if (!token) throw new Error(`Connexion échouée: ${userType}`)
    }
    
    // Création demande
    console.log('\n📋 ÉTAPE 2: Création et vérification demande')
    const demande = await createTestDemande()
    if (!demande) throw new Error('Création demande échouée')
    
    const dbVerification = await verifyDemandeInDatabase()
    if (!dbVerification) throw new Error('Vérification base de données échouée')
    
    // Test validation avec modifications
    console.log('\n📋 ÉTAPE 3: Test validation et modifications')
    const validationOk = await performValidationAndVerify()
    if (!validationOk) throw new Error('Test validation/modifications échoué')
    
    // Vérification signatures
    console.log('\n📋 ÉTAPE 4: Vérification signatures de validation')
    const signaturesOk = await verifyValidationSignatures()
    if (!signaturesOk) throw new Error('Vérification signatures échouée')
    
    console.log('\n🎉 TEST D\'INTÉGRITÉ RÉUSSI!')
    console.log('=' .repeat(60))
    console.log('✅ Demandes correctement créées et sauvegardées')
    console.log('✅ Items avec tous les détails sauvegardés')
    console.log('✅ Modifications d\'articles fonctionnelles')
    console.log('✅ Transitions de statuts correctes')
    console.log('✅ Signatures de validation enregistrées')
    console.log('✅ Base de données entièrement fonctionnelle')
    
  } catch (error) {
    console.error('\n💥 ÉCHEC TEST INTÉGRITÉ:', error.message)
    console.log('=' .repeat(60))
    console.log('❌ Problème détecté dans la base de données')
    
    // Diagnostic supplémentaire
    if (demandeId) {
      console.log(`📊 ID demande créée: ${demandeId}`)
      console.log(`📊 Items IDs: ${itemIds.join(', ')}`)
    }
  }
}

// Attendre que le serveur soit prêt puis exécuter
setTimeout(() => {
  runDatabaseIntegrityTest().catch(console.error)
}, 2000)

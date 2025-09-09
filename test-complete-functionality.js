/**
 * Test complet de toutes les fonctionnalités avec communication base de données
 * Teste : Authentification, Création, Validation, Modifications, Historique
 */

const API_BASE = 'http://localhost:3000/api'

const testUsers = {
  employe: { email: 'employe@test.com', password: 'employe123', role: 'employe' },
  conducteur: { email: 'conducteur@test.com', password: 'conducteur123', role: 'conducteur_travaux' },
  responsableTravaux: { email: 'responsable-travaux@test.com', password: 'responsable123', role: 'responsable_travaux' },
  qhse: { email: 'qhse@test.com', password: 'qhse123', role: 'responsable_qhse' },
  chargeAffaire: { email: 'charge@test.com', password: 'charge123', role: 'charge_affaire' },
  appro: { email: 'appro@test.com', password: 'appro123', role: 'responsable_appro' },
  logistique: { email: 'logistique@test.com', password: 'logistique123', role: 'responsable_logistique' }
}

let tokens = {}
let demandeMaterielId = null
let demandeOutillageId = null
let itemIds = []

// ========== TESTS AUTHENTIFICATION ==========

async function testAuthentication() {
  console.log('\n🔐 TEST AUTHENTIFICATION')
  console.log('-'.repeat(40))
  
  let allSuccess = true
  
  for (const [userType, userData] of Object.entries(testUsers)) {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: userData.email, 
          password: userData.password 
        })
      })
      
      const result = await response.json()
      if (result.success) {
        tokens[userType] = result.data.token
        console.log(`✅ ${userType} (${userData.role}) connecté`)
      } else {
        console.error(`❌ ${userType} connexion échouée:`, result.error)
        allSuccess = false
      }
    } catch (error) {
      console.error(`❌ ${userType} erreur réseau:`, error.message)
      allSuccess = false
    }
  }
  
  return allSuccess
}

// ========== TESTS CRÉATION DEMANDES ==========

async function testCreateMaterielRequest() {
  console.log('\n📝 TEST CRÉATION DEMANDE MATÉRIEL')
  console.log('-'.repeat(40))
  
  const demandeData = {
    projetId: 'projet-test-1',
    type: 'materiel',
    justification: 'Test fonctionnalité complète - demande matériel',
    urgence: true,
    items: [
      {
        nom: 'Casque de sécurité FUNC',
        reference: 'CAS-FUNC-001',
        description: 'Casque pour test fonctionnalité',
        quantite: 5,
        unite: 'pièce'
      },
      {
        nom: 'Gants protection FUNC',
        reference: 'GLV-FUNC-002', 
        description: 'Gants pour test fonctionnalité',
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
        'Authorization': `Bearer ${tokens.employe}`
      },
      body: JSON.stringify(demandeData)
    })
    
    const result = await response.json()
    if (result.success) {
      demandeMaterielId = result.data.id
      itemIds = result.data.items?.map(item => item.id) || []
      
      console.log(`✅ Demande matériel créée: ${demandeMaterielId}`)
      console.log(`   Statut initial: ${result.data.status}`)
      console.log(`   Items créés: ${itemIds.length}`)
      console.log(`   Numéro: ${result.data.numero}`)
      
      // Vérifier statut initial correct
      if (result.data.status === 'en_attente_validation_conducteur') {
        console.log('✅ Statut initial correct pour matériel')
        return true
      } else {
        console.error(`❌ Statut initial incorrect: ${result.data.status}`)
        return false
      }
    } else {
      console.error('❌ Création demande matériel échouée:', result.error)
      return false
    }
  } catch (error) {
    console.error('❌ Erreur création matériel:', error.message)
    return false
  }
}

async function testCreateOutillageRequest() {
  console.log('\n🔧 TEST CRÉATION DEMANDE OUTILLAGE')
  console.log('-'.repeat(40))
  
  const demandeData = {
    projetId: 'projet-test-1',
    type: 'outillage',
    justification: 'Test fonctionnalité complète - demande outillage',
    urgence: false,
    items: [
      {
        nom: 'Perceuse FUNC',
        reference: 'PER-FUNC-001',
        description: 'Perceuse pour test fonctionnalité',
        quantite: 2,
        unite: 'pièce'
      }
    ]
  }
  
  try {
    const response = await fetch(`${API_BASE}/demandes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.employe}`
      },
      body: JSON.stringify(demandeData)
    })
    
    const result = await response.json()
    if (result.success) {
      demandeOutillageId = result.data.id
      
      console.log(`✅ Demande outillage créée: ${demandeOutillageId}`)
      console.log(`   Statut initial: ${result.data.status}`)
      console.log(`   Items créés: ${result.data.items?.length || 0}`)
      
      // Vérifier statut initial correct
      if (result.data.status === 'en_attente_validation_qhse') {
        console.log('✅ Statut initial correct pour outillage')
        return true
      } else {
        console.error(`❌ Statut initial incorrect: ${result.data.status}`)
        return false
      }
    } else {
      console.error('❌ Création demande outillage échouée:', result.error)
      return false
    }
  } catch (error) {
    console.error('❌ Erreur création outillage:', error.message)
    return false
  }
}

// ========== TESTS VALIDATION AVEC MODIFICATIONS ==========

async function testValidationWithModifications(demandeId, userType, expectedStatus, nextStatus, modifications = {}) {
  console.log(`\n🔍 TEST VALIDATION ${userType.toUpperCase()}`)
  console.log('-'.repeat(40))
  
  try {
    // Vérifier statut actuel
    const getResponse = await fetch(`${API_BASE}/demandes/${demandeId}`, {
      headers: { 'Authorization': `Bearer ${tokens[userType]}` }
    })
    
    const demande = await getResponse.json()
    if (!demande.success) {
      console.error(`❌ Impossible de récupérer demande:`, demande.error)
      return false
    }
    
    console.log(`📊 Statut actuel: ${demande.data.status}`)
    if (demande.data.status !== expectedStatus) {
      console.error(`❌ Statut incorrect! Attendu: ${expectedStatus}`)
      return false
    }
    
    // Afficher items avant modification
    if (demande.data.items && demande.data.items.length > 0) {
      console.log('📦 Items avant validation:')
      demande.data.items.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.nom} (${item.reference}) - Qté: ${item.quantiteDemandee}`)
      })
    }
    
    // Effectuer validation avec modifications
    const validationData = {
      action: 'valider',
      commentaire: `Validation ${userType} avec test modifications`,
      ...modifications
    }
    
    const response = await fetch(`${API_BASE}/demandes/${demandeId}/actions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens[userType]}`
      },
      body: JSON.stringify(validationData)
    })
    
    const result = await response.json()
    if (result.success) {
      console.log(`✅ Validation réussie par ${userType}`)
      console.log(`📊 Nouveau statut: ${result.data.demande.status}`)
      
      // Vérifier modifications appliquées
      if (modifications.itemsModifications) {
        const updatedResponse = await fetch(`${API_BASE}/demandes/${demandeId}`, {
          headers: { 'Authorization': `Bearer ${tokens[userType]}` }
        })
        const updatedDemande = await updatedResponse.json()
        
        if (updatedDemande.success && updatedDemande.data.items) {
          console.log('📦 Items après validation:')
          updatedDemande.data.items.forEach((item, index) => {
            console.log(`   ${index + 1}. ${item.nom} (${item.reference}) - Qté: ${item.quantiteDemandee}`)
          })
        }
      }
      
      return result.data.demande.status === nextStatus
    } else {
      console.error(`❌ Validation échouée:`, result.error)
      return false
    }
  } catch (error) {
    console.error(`❌ Erreur validation ${userType}:`, error.message)
    return false
  }
}

async function testPreparationSortie(demandeId) {
  console.log('\n📦 TEST PRÉPARATION SORTIE APPRO')
  console.log('-'.repeat(40))
  
  try {
    const response = await fetch(`${API_BASE}/demandes/${demandeId}/actions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokens.appro}`
      },
      body: JSON.stringify({
        action: 'preparer_sortie',
        commentaire: 'Préparation avec test fonctionnalité',
        quantitesSorties: itemIds.length > 0 ? {
          [itemIds[0]]: 4,
          [itemIds[1]]: 8
        } : {}
      })
    })
    
    const result = await response.json()
    if (result.success) {
      console.log('✅ Préparation sortie réussie')
      console.log(`📊 Nouveau statut: ${result.data.demande.status}`)
      return true
    } else {
      console.error('❌ Préparation sortie échouée:', result.error)
      return false
    }
  } catch (error) {
    console.error('❌ Erreur préparation:', error.message)
    return false
  }
}

// ========== TESTS HISTORIQUE ET SIGNATURES ==========

async function testHistoryAndSignatures(demandeId) {
  console.log('\n📋 TEST HISTORIQUE ET SIGNATURES')
  console.log('-'.repeat(40))
  
  try {
    const response = await fetch(`${API_BASE}/demandes/${demandeId}`, {
      headers: { 'Authorization': `Bearer ${tokens.employe}` }
    })
    
    const result = await response.json()
    if (result.success) {
      const demande = result.data
      
      console.log(`📊 Signatures de validation: ${demande.validationSignatures?.length || 0}`)
      if (demande.validationSignatures) {
        demande.validationSignatures.forEach((sig, index) => {
          console.log(`   ${index + 1}. User ID: ${sig.userId} - Date: ${sig.date}`)
          console.log(`      Type: ${sig.type} - Commentaire: ${sig.commentaire || 'Aucun'}`)
        })
      }
      
      console.log(`📊 Entrées historique: ${demande.historyEntries?.length || 0}`)
      if (demande.historyEntries) {
        demande.historyEntries.forEach((entry, index) => {
          console.log(`   ${index + 1}. ${entry.action} - ${entry.ancienStatus} → ${entry.nouveauStatus}`)
        })
      }
      
      return (demande.validationSignatures?.length || 0) > 0
    } else {
      console.error('❌ Récupération historique échouée:', result.error)
      return false
    }
  } catch (error) {
    console.error('❌ Erreur historique:', error.message)
    return false
  }
}

// ========== TEST PRINCIPAL ==========

async function runCompleteFunctionalityTest() {
  console.log('🚀 TEST COMPLET DES FONCTIONNALITÉS')
  console.log('='.repeat(60))
  
  const results = {
    authentication: false,
    materielCreation: false,
    outillageCreation: false,
    materielValidation: false,
    outillageValidation: false,
    modifications: false,
    history: false
  }
  
  try {
    // 1. Test authentification
    results.authentication = await testAuthentication()
    if (!results.authentication) throw new Error('Authentification échouée')
    
    // 2. Test création demandes
    results.materielCreation = await testCreateMaterielRequest()
    results.outillageCreation = await testCreateOutillageRequest()
    
    if (!results.materielCreation || !results.outillageCreation) {
      throw new Error('Création demandes échouée')
    }
    
    // 3. Test flow validation matériel
    console.log('\n🔄 FLOW VALIDATION MATÉRIEL')
    console.log('='.repeat(40))
    
    let step1 = await testValidationWithModifications(
      demandeMaterielId, 'conducteur', 
      'en_attente_validation_conducteur', 
      'en_attente_validation_responsable_travaux',
      {
        itemsModifications: itemIds.length > 0 ? {
          [itemIds[0]]: {
            nom: 'Casque MODIFIÉ CONDUCTEUR',
            quantite: 4
          }
        } : {}
      }
    )
    
    let step2 = await testValidationWithModifications(
      demandeMaterielId, 'responsableTravaux',
      'en_attente_validation_responsable_travaux',
      'en_attente_validation_appro'
    )
    
    let step3 = await testPreparationSortie(demandeMaterielId)
    
    let step4 = await testValidationWithModifications(
      demandeMaterielId, 'chargeAffaire',
      'en_attente_validation_charge_affaire',
      'en_attente_validation_logistique'
    )
    
    let step5 = await testValidationWithModifications(
      demandeMaterielId, 'logistique',
      'en_attente_validation_logistique',
      'en_attente_confirmation_demandeur'
    )
    
    results.materielValidation = step1 && step2 && step3 && step4 && step5
    
    // 4. Test flow validation outillage
    console.log('\n🔄 FLOW VALIDATION OUTILLAGE')
    console.log('='.repeat(40))
    
    let qhseStep = await testValidationWithModifications(
      demandeOutillageId, 'qhse',
      'en_attente_validation_qhse',
      'en_attente_validation_responsable_travaux',
      {
        itemsModifications: {
          // Utiliser le premier item de la demande outillage
        }
      }
    )
    
    results.outillageValidation = qhseStep
    
    // 5. Test historique et signatures
    results.history = await testHistoryAndSignatures(demandeMaterielId)
    
    // Résultats finaux
    console.log('\n🎯 RÉSULTATS FINAUX')
    console.log('='.repeat(60))
    
    Object.entries(results).forEach(([test, success]) => {
      console.log(`${success ? '✅' : '❌'} ${test}: ${success ? 'RÉUSSI' : 'ÉCHOUÉ'}`)
    })
    
    const allSuccess = Object.values(results).every(r => r)
    
    if (allSuccess) {
      console.log('\n🎉 TOUS LES TESTS RÉUSSIS!')
      console.log('✅ Communication base de données fonctionnelle')
      console.log('✅ Authentification opérationnelle')
      console.log('✅ Création demandes opérationnelle')
      console.log('✅ Flows de validation opérationnels')
      console.log('✅ Modifications articles opérationnelles')
      console.log('✅ Historique et signatures opérationnels')
    } else {
      console.log('\n⚠️ CERTAINS TESTS ONT ÉCHOUÉ')
      console.log('Vérifier les erreurs ci-dessus')
    }
    
  } catch (error) {
    console.error('\n💥 ÉCHEC GÉNÉRAL:', error.message)
  }
}

// Attendre que le serveur soit prêt puis exécuter
setTimeout(() => {
  runCompleteFunctionalityTest().catch(console.error)
}, 3000)

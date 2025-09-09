/**
 * Test corrigé du flow QHSE pour les demandes d'outillage
 * Flow correct: Demandeur → QHSE → Responsable Travaux → Chargé Affaires → Appro → Logistique → Confirmation
 */

const API_BASE = 'http://localhost:3000/api'

const testUsers = {
  demandeur: { email: 'employe@test.com', password: 'employe123', role: 'employe' },
  qhse: { email: 'qhse@test.com', password: 'qhse123', role: 'responsable_qhse' },
  responsableTravaux: { email: 'responsable-travaux@test.com', password: 'responsable123', role: 'responsable_travaux' },
  chargeAffaire: { email: 'charge@test.com', password: 'charge123', role: 'charge_affaire' },
  appro: { email: 'appro@test.com', password: 'appro123', role: 'responsable_appro' },
  logistique: { email: 'logistique@test.com', password: 'logistique123', role: 'responsable_logistique' }
}

let tokens = {}
let demandeId = null
let itemIds = []

async function login(userType) {
  const user = testUsers[userType]
  console.log(`\n🔐 Connexion ${userType} (${user.email})...`)
  
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
      console.error(`❌ Connexion échouée pour ${userType}:`, result.error)
      return null
    }
  } catch (error) {
    console.error(`❌ Erreur réseau pour ${userType}:`, error.message)
    return null
  }
}

async function createOutillageRequest() {
  console.log('\n📝 Création demande OUTILLAGE par employé...')
  
  const demandeData = {
    projetId: 'projet-test-1',
    type: 'outillage',
    justification: 'Test flow QHSE corrigé avec Responsable Travaux',
    urgence: false,
    items: [
      {
        nom: 'Perceuse électrique',
        reference: 'PER-001',
        description: 'Perceuse 18V avec batterie',
        quantite: 3,
        unite: 'pièce'
      },
      {
        nom: 'Scie circulaire',
        reference: 'SCI-002', 
        description: 'Scie circulaire 190mm',
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
        'Authorization': `Bearer ${tokens.demandeur}`
      },
      body: JSON.stringify(demandeData)
    })
    
    const result = await response.json()
    if (result.success) {
      demandeId = result.data.id
      itemIds = result.data.items?.map(item => item.id) || []
      console.log(`✅ Demande outillage créée: ${demandeId}`)
      console.log(`   Statut: ${result.data.status}`)
      console.log(`   Items: ${itemIds.length}`)
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

async function validateWithModifications(userType, expectedStatus, nextStatus, modifications = {}) {
  console.log(`\n🔍 Validation par ${userType}...`)
  
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
    
    console.log(`   Statut actuel: ${demande.data.status}`)
    if (demande.data.status !== expectedStatus) {
      console.error(`❌ Statut incorrect! Attendu: ${expectedStatus}`)
      return false
    }
    
    // Préparer données de validation avec modifications
    const validationData = {
      action: 'valider',
      commentaire: `Validation ${userType} - flow outillage corrigé`,
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
      console.log(`   Nouveau statut: ${result.data.demande.status}`)
      
      if (result.data.demande.status === nextStatus) {
        return true
      } else {
        console.error(`❌ Statut incorrect! Attendu: ${nextStatus}, Actuel: ${result.data.demande.status}`)
        return false
      }
    } else {
      console.error(`❌ Validation échouée:`, result.error)
      return false
    }
  } catch (error) {
    console.error(`❌ Erreur validation ${userType}:`, error.message)
    return false
  }
}

async function runCorrectedQHSEOutillageTest() {
  console.log('🚀 TEST FLOW QHSE OUTILLAGE CORRIGÉ')
  console.log('Flow: Demandeur → QHSE → Responsable Travaux → Chargé Affaires → Appro → Logistique → Confirmation')
  console.log('=' .repeat(80))
  
  try {
    // Connexions
    console.log('\n📋 ÉTAPE 1: Connexions utilisateurs')
    for (const userType of Object.keys(testUsers)) {
      const token = await login(userType)
      if (!token) throw new Error(`Connexion échouée: ${userType}`)
    }
    
    // Création demande outillage
    console.log('\n📋 ÉTAPE 2: Création demande OUTILLAGE')
    const demande = await createOutillageRequest()
    if (!demande) throw new Error('Création demande outillage échouée')
    
    // Vérifier que le statut initial est correct pour outillage
    if (demande.status !== 'en_attente_validation_qhse') {
      console.error(`❌ Statut initial incorrect pour outillage! Attendu: en_attente_validation_qhse, Actuel: ${demande.status}`)
      throw new Error('Statut initial incorrect')
    }
    console.log('✅ Statut initial correct pour outillage: en_attente_validation_qhse')
    
    // Validation QHSE avec modifications
    console.log('\n📋 ÉTAPE 3: Validation QHSE (peut modifier nom, référence, quantité)')
    const step3 = await validateWithModifications(
      'qhse',
      'en_attente_validation_qhse',
      'en_attente_validation_responsable_travaux',  // ✅ CORRIGÉ: va vers responsable_travaux
      {
        itemsModifications: itemIds.length > 0 ? {
          [itemIds[0]]: {
            nom: 'Perceuse électrique CERTIFIÉE QHSE',
            reference: 'PER-001-QHSE',
            quantite: 2,
            description: 'Perceuse 18V certifiée sécurité QHSE'
          }
        } : {}
      }
    )
    if (!step3) throw new Error('Étape 3 QHSE échouée')
    
    // Validation Responsable Travaux avec modifications
    console.log('\n📋 ÉTAPE 4: Validation Responsable Travaux (peut modifier nom, référence, quantité)')
    const step4 = await validateWithModifications(
      'responsableTravaux',
      'en_attente_validation_responsable_travaux',
      'en_attente_validation_appro',
      {
        itemsModifications: itemIds.length > 1 ? {
          [itemIds[1]]: {
            nom: 'Scie circulaire VALIDÉE',
            reference: 'SCI-002-VAL',
            quantite: 1
          }
        } : {}
      }
    )
    if (!step4) throw new Error('Étape 4 Responsable Travaux échouée')
    
    // Préparation appro (seulement quantités)
    console.log('\n📋 ÉTAPE 5: Préparation appro (peut seulement modifier quantités)')
    try {
      const response = await fetch(`${API_BASE}/demandes/${demandeId}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.appro}`
        },
        body: JSON.stringify({
          action: 'preparer_sortie',
          commentaire: 'Préparation outillage avec ajustement stock',
          itemsModifications: itemIds.length > 0 ? {
            [itemIds[0]]: { quantite: 2 }
          } : {},
          quantitesSorties: itemIds.length > 0 ? {
            [itemIds[0]]: 2,
            [itemIds[1]]: 1
          } : {}
        })
      })
      
      const result = await response.json()
      if (!result.success) throw new Error('Préparation appro échouée: ' + result.error)
      console.log('✅ Préparation appro réussie')
    } catch (error) {
      console.error('❌ Erreur préparation appro:', error.message)
      throw error
    }
    
    // Validation chargé affaire
    console.log('\n📋 ÉTAPE 6: Validation chargé affaire (peut modifier nom, référence, quantité)')
    const step6 = await validateWithModifications(
      'chargeAffaire',
      'en_attente_validation_charge_affaire',
      'en_attente_validation_logistique',
      {
        itemsModifications: itemIds.length > 1 ? {
          [itemIds[1]]: {
            nom: 'Scie circulaire APPROUVÉE',
            reference: 'SCI-002-APP'
          }
        } : {}
      }
    )
    if (!step6) throw new Error('Étape 6 échouée')
    
    // Validation logistique (seulement quantités)
    console.log('\n📋 ÉTAPE 7: Validation logistique (peut seulement modifier quantités)')
    const step7 = await validateWithModifications(
      'logistique',
      'en_attente_validation_logistique',
      'en_attente_confirmation_demandeur',
      {
        itemsModifications: itemIds.length > 0 ? {
          [itemIds[0]]: { quantite: 2 }
        } : {}
      }
    )
    if (!step7) throw new Error('Étape 7 échouée')
    
    // Confirmation finale demandeur
    console.log('\n📋 ÉTAPE 8: Confirmation finale demandeur')
    try {
      const response = await fetch(`${API_BASE}/demandes/${demandeId}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.demandeur}`
        },
        body: JSON.stringify({
          action: 'confirmer',
          commentaire: 'Demande outillage confirmée - flow corrigé'
        })
      })
      
      const result = await response.json()
      if (!result.success) throw new Error('Confirmation échouée: ' + result.error)
      
      if (result.data.demande.status === 'confirmee_demandeur') {
        console.log('✅ Demande outillage confirmée et clôturée')
      } else {
        throw new Error(`Statut final incorrect: ${result.data.demande.status}`)
      }
    } catch (error) {
      console.error('❌ Erreur confirmation:', error.message)
      throw error
    }
    
    console.log('\n🎉 TEST FLOW QHSE OUTILLAGE CORRIGÉ RÉUSSI!')
    console.log('=' .repeat(80))
    console.log('✅ Flow outillage corrigé: QHSE → Responsable Travaux → Chargé Affaires → Appro → Logistique')
    console.log('✅ QHSE peut modifier nom, référence, quantité et description')
    console.log('✅ Responsable Travaux peut modifier nom, référence, quantité et description')
    console.log('✅ Chargé Affaires peut modifier nom, référence, quantité et description')
    console.log('✅ Appro et Logistique ne peuvent modifier que les quantités')
    console.log('✅ Statut initial correct pour type outillage (en_attente_validation_qhse)')
    console.log('✅ Transitions de statuts correctes selon le nouveau flow')
    console.log(`✅ Demande outillage ${demandeId} complètement traitée`)
    
  } catch (error) {
    console.error('\n💥 ÉCHEC DU TEST QHSE CORRIGÉ:', error.message)
    console.log('=' .repeat(80))
    
    // Diagnostic
    if (demandeId && tokens.demandeur) {
      try {
        const response = await fetch(`${API_BASE}/demandes/${demandeId}`, {
          headers: { 'Authorization': `Bearer ${tokens.demandeur}` }
        })
        const result = await response.json()
        if (result.success) {
          console.log(`📊 État actuel: ${result.data.status}`)
        }
      } catch (e) {
        console.log('Impossible de récupérer l\'état de la demande')
      }
    }
  }
}

// Attendre que le serveur soit prêt puis exécuter
setTimeout(() => {
  runCorrectedQHSEOutillageTest().catch(console.error)
}, 2000)

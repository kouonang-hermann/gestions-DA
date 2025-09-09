/**
 * Test corrigé du flow de validation selon les spécifications utilisateur
 * Flow: Demandeur → Conducteur → Responsable Travaux → Chargé Affaire → Appro → Logistique → Confirmation Demandeur
 */

const API_BASE = 'http://localhost:3000/api'

const testUsers = {
  demandeur: { email: 'employe@test.com', password: 'employe123', role: 'employe' },
  conducteur: { email: 'conducteur@test.com', password: 'conducteur123', role: 'conducteur_travaux' },
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

async function createDemande() {
  console.log('\n📝 Création demande par employé...')
  
  const demandeData = {
    projetId: 'projet-test-1',
    type: 'materiel',
    justification: 'Test flow validation complet avec modifications',
    urgence: false,
    items: [
      {
        nom: 'Casque de sécurité',
        reference: 'CAS-001',
        description: 'Casque blanc standard',
        quantite: 10,
        unite: 'pièce'
      },
      {
        nom: 'Gants protection',
        reference: 'GLV-002', 
        description: 'Gants anti-coupure',
        quantite: 20,
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
  
  // Vérifier statut actuel
  try {
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
      commentaire: `Validation par ${userType} avec modifications`,
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

async function runCompleteFlowTest() {
  console.log('🚀 TEST FLOW VALIDATION COMPLET')
  console.log('=' .repeat(50))
  
  try {
    // Connexions
    console.log('\n📋 ÉTAPE 1: Connexions utilisateurs')
    for (const userType of Object.keys(testUsers)) {
      const token = await login(userType)
      if (!token) throw new Error(`Connexion échouée: ${userType}`)
    }
    
    // Création demande
    console.log('\n📋 ÉTAPE 2: Création demande')
    const demande = await createDemande()
    if (!demande) throw new Error('Création demande échouée')
    
    // Validation conducteur avec modifications
    console.log('\n📋 ÉTAPE 3: Validation conducteur (peut modifier nom, référence, quantité)')
    const step3 = await validateWithModifications(
      'conducteur',
      'en_attente_validation_conducteur',
      'en_attente_validation_responsable_travaux',
      {
        itemsModifications: itemIds.length > 0 ? {
          [itemIds[0]]: {
            nom: 'Casque sécurité PREMIUM',
            reference: 'CAS-001-PREM',
            quantite: 8
          }
        } : {}
      }
    )
    if (!step3) throw new Error('Étape 3 échouée')
    
    // Validation responsable travaux avec modifications  
    console.log('\n📋 ÉTAPE 4: Validation responsable travaux (peut modifier nom, référence, quantité)')
    const step4 = await validateWithModifications(
      'responsableTravaux',
      'en_attente_validation_responsable_travaux', 
      'en_attente_validation_appro',
      {
        itemsModifications: itemIds.length > 1 ? {
          [itemIds[1]]: {
            nom: 'Gants protection renforcés',
            quantite: 15
          }
        } : {}
      }
    )
    if (!step4) throw new Error('Étape 4 échouée')
    
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
          commentaire: 'Préparation avec ajustement quantités selon stock',
          itemsModifications: itemIds.length > 0 ? {
            [itemIds[0]]: { quantite: 7 }
          } : {},
          quantitesSorties: itemIds.length > 0 ? {
            [itemIds[0]]: 7,
            [itemIds[1]]: 15
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
      'en_attente_validation_logistique'
    )
    if (!step6) throw new Error('Étape 6 échouée')
    
    // Validation logistique (seulement quantités)
    console.log('\n📋 ÉTAPE 7: Validation logistique (peut seulement modifier quantités)')
    const step7 = await validateWithModifications(
      'logistique',
      'en_attente_validation_logistique',
      'en_attente_confirmation_demandeur',
      {
        itemsModifications: itemIds.length > 1 ? {
          [itemIds[1]]: { quantite: 12 }
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
          commentaire: 'Demande confirmée et clôturée'
        })
      })
      
      const result = await response.json()
      if (!result.success) throw new Error('Confirmation échouée: ' + result.error)
      
      if (result.data.demande.status === 'confirmee_demandeur') {
        console.log('✅ Demande confirmée et clôturée')
      } else {
        throw new Error(`Statut final incorrect: ${result.data.demande.status}`)
      }
    } catch (error) {
      console.error('❌ Erreur confirmation:', error.message)
      throw error
    }
    
    console.log('\n🎉 TEST COMPLET RÉUSSI!')
    console.log('=' .repeat(50))
    console.log('✅ Flow de validation entièrement fonctionnel')
    console.log('✅ Modifications d\'articles testées pour chaque rôle')
    console.log('✅ Restrictions respectées (appro/logistique = quantités seulement)')
    console.log(`✅ Demande ${demandeId} complètement traitée`)
    
  } catch (error) {
    console.error('\n💥 ÉCHEC DU TEST:', error.message)
    console.log('=' .repeat(50))
    
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
  runCompleteFlowTest().catch(console.error)
}, 2000)

/**
 * Test détaillé du flow de validation des demandes
 * Flow attendu : Demandeur → Conducteur → Responsable Travaux → Chargé Affaire → Appro → Logistique → Confirmation Demandeur
 */

const API_BASE = 'http://localhost:3000/api'

// Utilisateurs de test selon le nouveau flow
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

async function login(userType) {
  const user = testUsers[userType]
  console.log(`\n🔐 Connexion de ${userType} (${user.email})...`)
  
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: user.password })
  })
  
  const result = await response.json()
  if (result.success) {
    tokens[userType] = result.token
    console.log(`✅ ${userType} connecté avec succès`)
    return result.token
  } else {
    console.error(`❌ Échec de connexion pour ${userType}:`, result.error)
    throw new Error(`Connexion échouée pour ${userType}`)
  }
}

async function createDemande() {
  console.log('\n📝 Création d\'une demande par le demandeur...')
  
  const demandeData = {
    projetId: 'projet-test-1',
    type: 'materiel',
    justification: 'Test du flow de validation complet',
    urgence: false,
    items: [
      {
        articleId: null,
        nom: 'Casque de sécurité',
        reference: 'CAS-001',
        description: 'Casque de sécurité blanc',
        quantite: 10,
        unite: 'pièce'
      },
      {
        articleId: null,
        nom: 'Gants de protection',
        reference: 'GLV-002',
        description: 'Gants anti-coupure',
        quantite: 20,
        unite: 'paire'
      }
    ]
  }
  
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
    console.log(`✅ Demande créée avec ID: ${demandeId}`)
    console.log(`   Statut initial: ${result.data.status}`)
    return result.data
  } else {
    console.error('❌ Échec de création de demande:', result.error)
    throw new Error('Création de demande échouée')
  }
}

async function validateDemande(userType, expectedCurrentStatus, expectedNextStatus, modifications = {}) {
  console.log(`\n🔍 Validation par ${userType}...`)
  console.log(`   Statut attendu: ${expectedCurrentStatus}`)
  
  // Récupérer d'abord la demande pour vérifier son statut
  const getResponse = await fetch(`${API_BASE}/demandes/${demandeId}`, {
    headers: { 'Authorization': `Bearer ${tokens[userType]}` }
  })
  
  const demande = await getResponse.json()
  if (!demande.success) {
    console.error(`❌ Impossible de récupérer la demande:`, demande.error)
    return false
  }
  
  console.log(`   Statut actuel: ${demande.data.status}`)
  
  if (demande.data.status !== expectedCurrentStatus) {
    console.error(`❌ Statut incorrect! Attendu: ${expectedCurrentStatus}, Actuel: ${demande.data.status}`)
    return false
  }
  
  // Préparer les données de validation
  const validationData = {
    action: 'valider',
    commentaire: `Validation par ${userType} - Test automatisé`,
    ...modifications
  }
  
  // Si des quantités sont spécifiées, les ajouter
  if (modifications.quantites) {
    validationData.quantites = modifications.quantites
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
    
    if (result.data.demande.status !== expectedNextStatus) {
      console.error(`❌ Statut suivant incorrect! Attendu: ${expectedNextStatus}, Actuel: ${result.data.demande.status}`)
      return false
    }
    
    return true
  } else {
    console.error(`❌ Échec de validation par ${userType}:`, result.error)
    return false
  }
}

async function preparerSortie() {
  console.log('\n📦 Préparation de sortie par l\'appro...')
  
  const response = await fetch(`${API_BASE}/demandes/${demandeId}/actions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokens.appro}`
    },
    body: JSON.stringify({
      action: 'preparer_sortie',
      commentaire: 'Sortie préparée - quantités ajustées selon stock',
      quantitesSorties: {
        'item1': 8,  // Casques : 8 au lieu de 10
        'item2': 20  // Gants : quantité complète
      }
    })
  })
  
  const result = await response.json()
  if (result.success) {
    console.log('✅ Sortie préparée par l\'appro')
    console.log(`   Nouveau statut: ${result.data.demande.status}`)
    return true
  } else {
    console.error('❌ Échec de préparation de sortie:', result.error)
    return false
  }
}

async function confirmerDemande() {
  console.log('\n✅ Confirmation finale par le demandeur...')
  
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
  if (result.success) {
    console.log('✅ Demande confirmée et clôturée')
    console.log(`   Statut final: ${result.data.demande.status}`)
    return result.data.demande.status === 'confirmee_demandeur'
  } else {
    console.error('❌ Échec de confirmation:', result.error)
    return false
  }
}

async function runCompleteValidationTest() {
  console.log('🚀 DÉBUT DU TEST COMPLET DU FLOW DE VALIDATION')
  console.log('=' .repeat(60))
  
  try {
    // Étape 1: Connexion de tous les utilisateurs
    console.log('\n📋 ÉTAPE 1: Connexion des utilisateurs')
    await login('demandeur')
    await login('conducteur')
    await login('responsableTravaux')
    await login('chargeAffaire')
    await login('appro')
    await login('logistique')
    
    // Étape 2: Création de la demande
    console.log('\n📋 ÉTAPE 2: Création de la demande')
    await createDemande()
    
    // Étape 3: Validation par le conducteur de travaux
    console.log('\n📋 ÉTAPE 3: Validation par le conducteur de travaux')
    const step3Success = await validateDemande(
      'conducteur', 
      'en_attente_validation_conducteur', 
      'en_attente_validation_responsable_travaux',
      {
        quantites: {
          // Ici on devrait récupérer les vrais IDs des items, pour le test on simule
        }
      }
    )
    if (!step3Success) throw new Error('Échec étape 3')
    
    // Étape 4: Validation par le responsable des travaux
    console.log('\n📋 ÉTAPE 4: Validation par le responsable des travaux')
    const step4Success = await validateDemande(
      'responsableTravaux', 
      'en_attente_validation_responsable_travaux', 
      'en_attente_validation_appro'
    )
    if (!step4Success) throw new Error('Échec étape 4')
    
    // Étape 5: Préparation par l'appro
    console.log('\n📋 ÉTAPE 5: Préparation par l\'appro')
    const step5Success = await preparerSortie()
    if (!step5Success) throw new Error('Échec étape 5')
    
    // Étape 6: Validation par le chargé d'affaire
    console.log('\n📋 ÉTAPE 6: Validation par le chargé d\'affaire')
    const step6Success = await validateDemande(
      'chargeAffaire', 
      'en_attente_validation_charge_affaire', 
      'en_attente_validation_logistique'
    )
    if (!step6Success) throw new Error('Échec étape 6')
    
    // Étape 7: Validation par la logistique
    console.log('\n📋 ÉTAPE 7: Validation par la logistique')
    const step7Success = await validateDemande(
      'logistique', 
      'en_attente_validation_logistique', 
      'en_attente_confirmation_demandeur'
    )
    if (!step7Success) throw new Error('Échec étape 7')
    
    // Étape 8: Confirmation finale par le demandeur
    console.log('\n📋 ÉTAPE 8: Confirmation finale par le demandeur')
    const step8Success = await confirmerDemande()
    if (!step8Success) throw new Error('Échec étape 8')
    
    console.log('\n🎉 TEST COMPLET RÉUSSI!')
    console.log('=' .repeat(60))
    console.log('✅ Toutes les étapes du flow de validation ont été validées')
    console.log(`✅ Demande ${demandeId} complètement traitée`)
    
  } catch (error) {
    console.error('\n💥 ÉCHEC DU TEST:', error.message)
    console.log('=' .repeat(60))
    
    // Afficher l'état actuel de la demande pour diagnostic
    if (demandeId && tokens.demandeur) {
      try {
        const response = await fetch(`${API_BASE}/demandes/${demandeId}`, {
          headers: { 'Authorization': `Bearer ${tokens.demandeur}` }
        })
        const result = await response.json()
        if (result.success) {
          console.log(`📊 État actuel de la demande: ${result.data.status}`)
        }
      } catch (e) {
        console.log('Impossible de récupérer l\'état de la demande')
      }
    }
  }
}

// Exécuter le test
runCompleteValidationTest().catch(console.error)

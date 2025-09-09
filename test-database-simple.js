/**
 * Test simple de la base de données - vérification directe
 */

const API_BASE = 'http://localhost:3000/api'

async function testLogin() {
  console.log('🔐 Test connexion employé...')
  
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'employe@test.com', 
        password: 'employe123' 
      })
    })
    
    const result = await response.json()
    if (result.success) {
      console.log('✅ Connexion réussie')
      return result.data.token
    } else {
      console.error('❌ Connexion échouée:', result.error)
      return null
    }
  } catch (error) {
    console.error('❌ Erreur connexion:', error.message)
    return null
  }
}

async function testCreateDemande(token) {
  console.log('\n📝 Test création demande...')
  
  const demandeData = {
    projetId: 'projet-test-1',
    type: 'materiel',
    justification: 'Test simple base de données',
    urgence: false,
    items: [
      {
        nom: 'Test Article',
        reference: 'TEST-001',
        description: 'Article de test',
        quantite: 1,
        unite: 'pièce'
      }
    ]
  }
  
  try {
    const response = await fetch(`${API_BASE}/demandes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(demandeData)
    })
    
    const result = await response.json()
    if (result.success) {
      console.log('✅ Demande créée:', result.data.id)
      console.log('   Statut:', result.data.status)
      console.log('   Items:', result.data.items?.length || 0)
      return result.data.id
    } else {
      console.error('❌ Création échouée:', result.error)
      return null
    }
  } catch (error) {
    console.error('❌ Erreur création:', error.message)
    return null
  }
}

async function testGetDemande(token, demandeId) {
  console.log('\n🔍 Test récupération demande...')
  
  try {
    const response = await fetch(`${API_BASE}/demandes/${demandeId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    const result = await response.json()
    if (result.success) {
      const demande = result.data
      console.log('✅ Demande récupérée:')
      console.log('   ID:', demande.id)
      console.log('   Numéro:', demande.numero)
      console.log('   Type:', demande.type)
      console.log('   Statut:', demande.status)
      console.log('   Items:', demande.items?.length || 0)
      console.log('   Projet:', demande.projet?.nom || 'N/A')
      console.log('   Demandeur:', `${demande.technicien?.prenom} ${demande.technicien?.nom}`)
      
      return true
    } else {
      console.error('❌ Récupération échouée:', result.error)
      return false
    }
  } catch (error) {
    console.error('❌ Erreur récupération:', error.message)
    return false
  }
}

async function runSimpleTest() {
  console.log('🚀 TEST SIMPLE BASE DE DONNÉES')
  console.log('=' .repeat(40))
  
  try {
    // Test connexion
    const token = await testLogin()
    if (!token) throw new Error('Connexion échouée')
    
    // Test création
    const demandeId = await testCreateDemande(token)
    if (!demandeId) throw new Error('Création échouée')
    
    // Test récupération
    const getOk = await testGetDemande(token, demandeId)
    if (!getOk) throw new Error('Récupération échouée')
    
    console.log('\n🎉 TEST SIMPLE RÉUSSI!')
    console.log('✅ Connexion fonctionnelle')
    console.log('✅ Création demande fonctionnelle')
    console.log('✅ Sauvegarde en base fonctionnelle')
    console.log('✅ Récupération données fonctionnelle')
    
  } catch (error) {
    console.error('\n💥 ÉCHEC TEST SIMPLE:', error.message)
  }
}

// Attendre et exécuter
setTimeout(() => {
  runSimpleTest().catch(console.error)
}, 3000)

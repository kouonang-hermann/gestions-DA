/**
 * Test simplifié du flow de validation
 */

const API_BASE = 'http://localhost:3000/api'

async function testLogin() {
  console.log('🔐 Test de connexion...')
  
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
    console.log('Résultat connexion:', result)
    
    if (result.success) {
      console.log('✅ Connexion réussie')
      return result.token
    } else {
      console.log('❌ Échec connexion:', result.error)
      return null
    }
  } catch (error) {
    console.error('❌ Erreur réseau:', error.message)
    return null
  }
}

async function testCreateDemande(token) {
  console.log('\n📝 Test création demande...')
  
  try {
    const demandeData = {
      projetId: 'projet-test-1',
      type: 'materiel',
      justification: 'Test flow validation',
      urgence: false,
      items: [{
        nom: 'Casque test',
        reference: 'TEST-001',
        description: 'Test',
        quantite: 5,
        unite: 'pièce'
      }]
    }
    
    const response = await fetch(`${API_BASE}/demandes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(demandeData)
    })
    
    const result = await response.json()
    console.log('Résultat création:', result)
    
    if (result.success) {
      console.log('✅ Demande créée:', result.data.id)
      console.log('   Statut:', result.data.status)
      return result.data.id
    } else {
      console.log('❌ Échec création:', result.error)
      return null
    }
  } catch (error) {
    console.error('❌ Erreur création:', error.message)
    return null
  }
}

async function runSimpleTest() {
  console.log('🚀 TEST SIMPLE DU SYSTÈME')
  console.log('=' .repeat(40))
  
  // Test 1: Connexion
  const token = await testLogin()
  if (!token) {
    console.log('💥 Arrêt du test - connexion échouée')
    return
  }
  
  // Test 2: Création demande
  const demandeId = await testCreateDemande(token)
  if (!demandeId) {
    console.log('💥 Arrêt du test - création échouée')
    return
  }
  
  console.log('\n🎉 Tests de base réussis!')
  console.log(`✅ Token obtenu: ${token.substring(0, 20)}...`)
  console.log(`✅ Demande créée: ${demandeId}`)
}

runSimpleTest().catch(console.error)

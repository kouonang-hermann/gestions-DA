/**
 * Test manuel des fonctionnalités avec vérifications détaillées
 * Test étape par étape avec diagnostics
 */

const API_BASE = 'http://localhost:3000/api'

async function testServerConnection() {
  console.log('🌐 Test connexion serveur...')
  
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test', password: 'test' })
    })
    
    console.log(`📡 Statut réponse: ${response.status}`)
    const result = await response.json()
    console.log('📦 Réponse serveur:', JSON.stringify(result, null, 2))
    
    return response.status !== 500 // Même si login échoue, serveur répond
  } catch (error) {
    console.error('❌ Serveur inaccessible:', error.message)
    return false
  }
}

async function testEmployeLogin() {
  console.log('\n👤 Test connexion employé...')
  
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'employe@test.com', 
        password: 'employe123' 
      })
    })
    
    console.log(`📡 Statut: ${response.status}`)
    const result = await response.json()
    console.log('📦 Réponse:', JSON.stringify(result, null, 2))
    
    if (result.success && result.data?.token) {
      console.log('✅ Connexion employé réussie')
      return result.data.token
    } else {
      console.error('❌ Connexion employé échouée')
      return null
    }
  } catch (error) {
    console.error('❌ Erreur connexion employé:', error.message)
    return null
  }
}

async function testCreateDemande(token) {
  console.log('\n📝 Test création demande...')
  
  const demandeData = {
    projetId: 'projet-test-1',
    type: 'materiel',
    justification: 'Test manuel fonctionnalité',
    urgence: false,
    items: [
      {
        nom: 'Article Test Manuel',
        reference: 'ATM-001',
        description: 'Test manuel',
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
    
    console.log(`📡 Statut: ${response.status}`)
    const result = await response.json()
    console.log('📦 Réponse:', JSON.stringify(result, null, 2))
    
    if (result.success) {
      console.log('✅ Création demande réussie')
      console.log(`📋 ID: ${result.data.id}`)
      console.log(`📋 Statut: ${result.data.status}`)
      return result.data.id
    } else {
      console.error('❌ Création demande échouée')
      return null
    }
  } catch (error) {
    console.error('❌ Erreur création demande:', error.message)
    return null
  }
}

async function testGetDemande(token, demandeId) {
  console.log('\n🔍 Test récupération demande...')
  
  try {
    const response = await fetch(`${API_BASE}/demandes/${demandeId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    console.log(`📡 Statut: ${response.status}`)
    const result = await response.json()
    
    if (result.success) {
      console.log('✅ Récupération réussie')
      console.log('📋 Demande:', {
        id: result.data.id,
        numero: result.data.numero,
        status: result.data.status,
        type: result.data.type,
        itemsCount: result.data.items?.length || 0
      })
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

async function testGetAllDemandes(token) {
  console.log('\n📋 Test récupération toutes demandes...')
  
  try {
    const response = await fetch(`${API_BASE}/demandes`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    console.log(`📡 Statut: ${response.status}`)
    const result = await response.json()
    
    if (result.success) {
      console.log(`✅ Récupération réussie: ${result.data.length} demandes`)
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

async function runManualTest() {
  console.log('🧪 TEST MANUEL DES FONCTIONNALITÉS')
  console.log('='.repeat(50))
  
  // 1. Test connexion serveur
  const serverOk = await testServerConnection()
  if (!serverOk) {
    console.log('\n💥 Serveur non accessible - Arrêt des tests')
    return
  }
  
  // 2. Test connexion utilisateur
  const token = await testEmployeLogin()
  if (!token) {
    console.log('\n💥 Connexion utilisateur échouée - Arrêt des tests')
    return
  }
  
  // 3. Test création demande
  const demandeId = await testCreateDemande(token)
  if (!demandeId) {
    console.log('\n💥 Création demande échouée - Arrêt des tests')
    return
  }
  
  // 4. Test récupération demande
  const getOk = await testGetDemande(token, demandeId)
  if (!getOk) {
    console.log('\n💥 Récupération demande échouée')
  }
  
  // 5. Test récupération toutes demandes
  const getAllOk = await testGetAllDemandes(token)
  
  console.log('\n🎯 RÉSUMÉ DES TESTS')
  console.log('='.repeat(50))
  console.log(`✅ Serveur accessible: ${serverOk}`)
  console.log(`✅ Connexion utilisateur: ${!!token}`)
  console.log(`✅ Création demande: ${!!demandeId}`)
  console.log(`✅ Récupération demande: ${getOk}`)
  console.log(`✅ Liste demandes: ${getAllOk}`)
  
  if (serverOk && token && demandeId && getOk && getAllOk) {
    console.log('\n🎉 TOUS LES TESTS DE BASE RÉUSSIS!')
    console.log('✅ Communication base de données fonctionnelle')
  } else {
    console.log('\n⚠️ CERTAINS TESTS ONT ÉCHOUÉ')
  }
}

// Exécuter immédiatement
runManualTest().catch(console.error)

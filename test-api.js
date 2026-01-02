// Test de l'API demandes pour diagnostiquer l'erreur 500
const testAPI = async () => {
  try {
    console.log('🔍 Test de l\'API /api/demandes...')
    
    // Simuler un token (vous devrez utiliser un vrai token de votre session)
    const token = 'votre-token-ici'
    
    const response = await fetch('http://localhost:3000/api/demandes', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })
    
    console.log('📊 Status:', response.status)
    console.log('📊 Status Text:', response.statusText)
    
    const data = await response.json()
    console.log('📦 Données reçues:', JSON.stringify(data, null, 2))
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

testAPI()

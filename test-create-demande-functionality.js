/**
 * Test de la fonctionnalité de création de demandes après corrections
 */

const API_BASE = 'http://localhost:3000/api'

async function testCreateDemandeAfterFix() {
  console.log('🧪 TEST CRÉATION DEMANDE APRÈS CORRECTIONS')
  console.log('='.repeat(50))
  
  try {
    // 1. Connexion employé
    console.log('\n🔐 Connexion employé...')
    const loginResponse = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: 'employe@test.com', 
        password: 'employe123' 
      })
    })
    
    const loginResult = await loginResponse.json()
    if (!loginResult.success) {
      throw new Error('Connexion échouée: ' + loginResult.error)
    }
    
    const token = loginResult.data.token
    console.log('✅ Connexion réussie')
    
    // 2. Test création demande matériel AVEC date de livraison obligatoire
    console.log('\n📝 Test création demande matériel avec date...')
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    
    const demandeMaterielData = {
      projetId: 'projet-test-1',
      type: 'materiel',
      justification: 'Test après corrections - matériel avec date obligatoire',
      dateLivraisonSouhaitee: tomorrowStr,
      items: [
        {
          articleId: 'manual-test1',
          quantiteDemandee: 3,
          commentaire: 'Test article matériel',
          article: {
            nom: 'Casque Test Corrigé',
            description: 'Casque après corrections',
            reference: 'CAS-CORR-001',
            unite: 'pièce',
            type: 'materiel'
          }
        }
      ]
    }
    
    const materielResponse = await fetch(`${API_BASE}/demandes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(demandeMaterielData)
    })
    
    const materielResult = await materielResponse.json()
    if (materielResult.success) {
      console.log(`✅ Demande matériel créée: ${materielResult.data.id}`)
      console.log(`   Statut: ${materielResult.data.status}`)
      console.log(`   Items: ${materielResult.data.items?.length || 0}`)
    } else {
      console.error('❌ Création matériel échouée:', materielResult.error)
    }
    
    // 3. Test création demande outillage AVEC date de livraison
    console.log('\n🔧 Test création demande outillage avec date...')
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]
    
    const demandeOutillageData = {
      projetId: 'projet-test-1',
      type: 'outillage',
      justification: 'Test après corrections - outillage avec date',
      dateLivraisonSouhaitee: tomorrowStr,
      items: [
        {
          articleId: 'manual-test2',
          quantiteDemandee: 2,
          article: {
            nom: 'Perceuse Test Corrigée',
            description: 'Perceuse après corrections',
            reference: 'PER-CORR-001',
            unite: 'pièce',
            type: 'outillage'
          }
        }
      ]
    }
    
    const outillageResponse = await fetch(`${API_BASE}/demandes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(demandeOutillageData)
    })
    
    const outillageResult = await outillageResponse.json()
    if (outillageResult.success) {
      console.log(`✅ Demande outillage créée: ${outillageResult.data.id}`)
      console.log(`   Statut: ${outillageResult.data.status}`)
      console.log(`   Date livraison: ${outillageResult.data.dateLivraisonSouhaitee}`)
      console.log(`   Items: ${outillageResult.data.items?.length || 0}`)
    } else {
      console.error('❌ Création outillage échouée:', outillageResult.error)
    }
    
    // 4. Test validation des erreurs - sans date de livraison
    console.log('\n⚠️ Test validation sans date obligatoire...')
    
    const demandeSansDateData = {
      projetId: 'projet-test-1',
      type: 'materiel',
      justification: 'Test validation sans date',
      items: [
        {
          articleId: 'manual-test3',
          quantiteDemandee: 1,
          article: {
            nom: 'Test Sans Date',
            reference: 'SAN-001',
            unite: 'pièce',
            type: 'materiel'
          }
        }
      ]
    }
    
    const sansDateResponse = await fetch(`${API_BASE}/demandes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(demandeSansDateData)
    })
    
    const sansDateResult = await sansDateResponse.json()
    
    // 5. Test validation des erreurs - date dans le passé
    console.log('\n⚠️ Test validation date passée...')
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    
    const demandeErreurData = {
      projetId: 'projet-test-1',
      type: 'materiel',
      justification: 'Test validation erreur',
      dateLivraisonSouhaitee: yesterdayStr,
      items: [
        {
          articleId: 'manual-test4',
          quantiteDemandee: 1,
          article: {
            nom: 'Test Erreur',
            reference: 'ERR-001',
            unite: 'pièce',
            type: 'materiel'
          }
        }
      ]
    }
    
    const erreurResponse = await fetch(`${API_BASE}/demandes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(demandeErreurData)
    })
    
    const erreurResult = await erreurResponse.json()
    if (!erreurResult.success) {
      console.log('✅ Validation date passée fonctionne (erreur attendue)')
    } else {
      console.log('⚠️ Validation date passée ne fonctionne pas')
    }
    
    console.log('\n🎯 RÉSULTATS TESTS CRÉATION')
    console.log('='.repeat(50))
    console.log(`✅ Connexion: OK`)
    console.log(`✅ Création matériel avec date: ${materielResult.success ? 'OK' : 'ÉCHEC'}`)
    console.log(`✅ Création outillage avec date: ${outillageResult.success ? 'OK' : 'ÉCHEC'}`)
    console.log(`✅ Validation sans date (doit échouer): ${!sansDateResult.success ? 'OK' : 'ÉCHEC'}`)
    console.log(`✅ Validation date passée: ${!erreurResult.success ? 'OK' : 'ÉCHEC'}`)
    
    if (materielResult.success && outillageResult.success && !sansDateResult.success && !erreurResult.success) {
      console.log('\n🎉 TOUS LES TESTS RÉUSSIS!')
      console.log('✅ Corrections du modal create-demande fonctionnelles')
      console.log('✅ Date de livraison OBLIGATOIRE')
      console.log('✅ Validation des erreurs opérationnelle')
    } else {
      console.log('\n⚠️ CERTAINS TESTS ONT ÉCHOUÉ')
    }
    
  } catch (error) {
    console.error('\n💥 ERREUR GÉNÉRALE:', error.message)
  }
}

// Exécuter le test
setTimeout(() => {
  testCreateDemandeAfterFix().catch(console.error)
}, 2000)

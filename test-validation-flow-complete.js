/**
 * Script de test complet du flow de validation des demandes
 * Ce script teste le processus complet de création et validation d'une demande
 */

const API_BASE = 'http://localhost:3000/api'

// Utilisateurs de test
const USERS = {
  admin: { email: 'admin@test.com', password: 'admin123' },
  tech: { email: 'tech@test.com', password: 'tech123' },
  conducteur: { email: 'conducteur@test.com', password: 'conducteur123' },
  qhse: { email: 'qhse@test.com', password: 'qhse123' },
  appro: { email: 'appro@test.com', password: 'appro123' },
  charge: { email: 'charge@test.com', password: 'charge123' },
  logistique: { email: 'logistique@test.com', password: 'logistique123' }
}

let tokens = {}
let projetId = null
let demandeId = null

// Fonction utilitaire pour faire des requêtes API
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  })
  
  const data = await response.json()
  if (!response.ok) {
    throw new Error(`API Error: ${data.error || response.statusText}`)
  }
  
  return data
}

// Étape 1: Authentification de tous les utilisateurs
async function authenticateUsers() {
  console.log('🔐 Authentification des utilisateurs...')
  
  for (const [role, credentials] of Object.entries(USERS)) {
    try {
      const response = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      })
      
      if (response.success) {
        tokens[role] = response.data.token
        console.log(`✅ ${role}: Connecté`)
      } else {
        console.log(`❌ ${role}: Échec de connexion`)
      }
    } catch (error) {
      console.log(`❌ ${role}: Erreur - ${error.message}`)
    }
  }
}

// Étape 2: Création d'un projet par le superadmin
async function createProject() {
  console.log('\n📁 Création d\'un projet de test...')
  
  try {
    const response = await apiRequest('/projets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.admin}`
      },
      body: JSON.stringify({
        nom: 'Projet Test Validation Flow',
        description: 'Projet créé pour tester le flow de validation complet',
        dateDebut: '2024-01-01',
        dateFin: '2024-12-31',
        utilisateurs: [
          // Récupérer les IDs des utilisateurs depuis la base
          // Pour ce test, on utilisera les IDs du seed
        ]
      })
    })
    
    if (response.success) {
      projetId = response.data.id
      console.log(`✅ Projet créé: ${projetId}`)
    }
  } catch (error) {
    console.log(`❌ Erreur création projet: ${error.message}`)
  }
}

// Étape 3: Création d'une demande de matériel par le technicien
async function createDemandeMatériel() {
  console.log('\n📦 Création d\'une demande de matériel...')
  
  try {
    const response = await apiRequest('/demandes', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.tech}`
      },
      body: JSON.stringify({
        projetId: projetId,
        type: 'materiel',
        items: [{
          articleId: 'manual-test-1',
          quantiteDemandee: 5,
          commentaire: 'Test de validation flow',
          article: {
            nom: 'Casque de test',
            description: 'Casque pour test de validation',
            reference: 'TEST-001',
            unite: 'pièce',
            type: 'materiel'
          }
        }],
        commentaires: 'Demande créée pour tester le flow de validation',
        dateLivraisonSouhaitee: '2024-02-01'
      })
    })
    
    if (response.success) {
      demandeId = response.data.id
      console.log(`✅ Demande créée: ${demandeId}`)
      console.log(`   Statut initial: ${response.data.status}`)
    }
  } catch (error) {
    console.log(`❌ Erreur création demande: ${error.message}`)
  }
}

// Étape 4: Validation par le conducteur de travaux
async function validateByConducteur() {
  console.log('\n👷 Validation par le conducteur de travaux...')
  
  try {
    const response = await apiRequest(`/demandes/${demandeId}/actions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.conducteur}`
      },
      body: JSON.stringify({
        action: 'valider',
        commentaire: 'Validation conducteur - matériel approuvé'
      })
    })
    
    if (response.success) {
      console.log(`✅ Validation conducteur réussie`)
      console.log(`   Nouveau statut: ${response.data.demande.status}`)
    }
  } catch (error) {
    console.log(`❌ Erreur validation conducteur: ${error.message}`)
  }
}

// Étape 5: Préparation de sortie par l'appro
async function prepareSortieByAppro() {
  console.log('\n📋 Préparation de sortie par l\'appro...')
  
  try {
    const response = await apiRequest(`/demandes/${demandeId}/actions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.appro}`
      },
      body: JSON.stringify({
        action: 'preparer_sortie',
        commentaire: 'Matériel préparé et prêt pour sortie',
        quantitesSorties: {
          'item1': 5
        }
      })
    })
    
    if (response.success) {
      console.log(`✅ Préparation sortie réussie`)
      console.log(`   Nouveau statut: ${response.data.demande.status}`)
    }
  } catch (error) {
    console.log(`❌ Erreur préparation sortie: ${error.message}`)
  }
}

// Étape 6: Validation par le chargé d'affaire
async function validateByChargeAffaire() {
  console.log('\n💼 Validation par le chargé d\'affaire...')
  
  try {
    const response = await apiRequest(`/demandes/${demandeId}/actions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.charge}`
      },
      body: JSON.stringify({
        action: 'valider',
        commentaire: 'Validation chargé d\'affaire - préparation conforme'
      })
    })
    
    if (response.success) {
      console.log(`✅ Validation chargé d'affaire réussie`)
      console.log(`   Nouveau statut: ${response.data.demande.status}`)
    }
  } catch (error) {
    console.log(`❌ Erreur validation chargé d'affaire: ${error.message}`)
  }
}

// Étape 7: Validation par la logistique
async function validateByLogistique() {
  console.log('\n🚛 Validation par la logistique...')
  
  try {
    const response = await apiRequest(`/demandes/${demandeId}/actions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.logistique}`
      },
      body: JSON.stringify({
        action: 'valider',
        commentaire: 'Validation logistique - livraison programmée'
      })
    })
    
    if (response.success) {
      console.log(`✅ Validation logistique réussie`)
      console.log(`   Nouveau statut: ${response.data.demande.status}`)
    }
  } catch (error) {
    console.log(`❌ Erreur validation logistique: ${error.message}`)
  }
}

// Étape 8: Confirmation finale par le demandeur
async function confirmByDemandeur() {
  console.log('\n✅ Confirmation finale par le demandeur...')
  
  try {
    const response = await apiRequest(`/demandes/${demandeId}/actions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokens.tech}`
      },
      body: JSON.stringify({
        action: 'confirmer',
        commentaire: 'Matériel reçu et conforme'
      })
    })
    
    if (response.success) {
      console.log(`✅ Confirmation finale réussie`)
      console.log(`   Statut final: ${response.data.demande.status}`)
    }
  } catch (error) {
    console.log(`❌ Erreur confirmation finale: ${error.message}`)
  }
}

// Fonction principale de test
async function runCompleteValidationFlow() {
  console.log('🚀 Début du test complet du flow de validation\n')
  
  try {
    await authenticateUsers()
    await createProject()
    
    if (projetId) {
      await createDemandeMatériel()
      
      if (demandeId) {
        await validateByConducteur()
        await prepareSortieByAppro()
        await validateByChargeAffaire()
        await validateByLogistique()
        await confirmByDemandeur()
      }
    }
    
    console.log('\n🎉 Test du flow de validation terminé!')
    
  } catch (error) {
    console.error('\n💥 Erreur générale:', error.message)
  }
}

// Exécuter le test
runCompleteValidationFlow()

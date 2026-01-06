/**
 * Script de test automatisé pour le workflow de rejet avec retour arrière
 * 
 * Usage: node test-workflow-rejet.js
 * 
 * Prérequis:
 * - Serveur Next.js en cours d'exécution (npm run dev)
 * - Migration SQL appliquée
 * - Utilisateurs de test créés
 */

const BASE_URL = 'http://localhost:3000';

// Utilisateurs de test
const USERS = {
  employe: { phone: '0600000001', password: 'password123', role: 'employe' },
  conducteur: { phone: '0600000002', password: 'password123', role: 'conducteur_travaux' },
  respTravaux: { phone: '0600000003', password: 'password123', role: 'responsable_travaux' },
  chargeAffaire: { phone: '0600000004', password: 'password123', role: 'charge_affaire' },
  respAppro: { phone: '0600000005', password: 'password123', role: 'responsable_appro' },
};

let tokens = {};
let testDemandeId = null;

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logStep(step, message) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`ÉTAPE ${step}: ${message}`, 'cyan');
  log('='.repeat(60), 'cyan');
}

// Fonction pour faire une requête API
async function apiRequest(endpoint, method = 'GET', body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }
    
    return data;
  } catch (error) {
    throw new Error(`API Error: ${error.message}`);
  }
}

// Connexion d'un utilisateur
async function login(userKey) {
  logInfo(`Connexion de ${userKey}...`);
  const user = USERS[userKey];
  
  try {
    const data = await apiRequest('/api/auth/login', 'POST', {
      phone: user.phone,
      password: user.password,
    });
    
    tokens[userKey] = data.token;
    logSuccess(`${userKey} connecté avec succès`);
    return data.token;
  } catch (error) {
    logError(`Échec de connexion pour ${userKey}: ${error.message}`);
    throw error;
  }
}

// Créer une demande
async function createDemande(token, type = 'materiel') {
  logInfo('Création d\'une demande...');
  
  try {
    const data = await apiRequest('/api/demandes', 'POST', {
      type,
      projetId: 'projet-test-1', // À adapter selon vos données
      items: [
        {
          articleId: 'article-test-1',
          quantiteDemandee: 10,
          commentaire: 'Test workflow rejet',
        },
      ],
      dateLivraisonSouhaitee: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      commentaires: 'Demande de test pour workflow de rejet',
    }, token);
    
    testDemandeId = data.data.id;
    logSuccess(`Demande créée: ${data.data.numero} (ID: ${testDemandeId})`);
    logInfo(`Status initial: ${data.data.status}`);
    return data.data;
  } catch (error) {
    logError(`Échec de création: ${error.message}`);
    throw error;
  }
}

// Récupérer une demande
async function getDemande(demandeId, token) {
  try {
    const data = await apiRequest(`/api/demandes/${demandeId}`, 'GET', null, token);
    return data.data;
  } catch (error) {
    logError(`Échec de récupération: ${error.message}`);
    throw error;
  }
}

// Valider une demande
async function validateDemande(demandeId, token, commentaire = '') {
  logInfo('Validation de la demande...');
  
  try {
    const data = await apiRequest(`/api/demandes/${demandeId}`, 'PUT', {
      status: 'valider',
      commentaire,
    }, token);
    
    logSuccess(`Demande validée`);
    logInfo(`Nouveau status: ${data.data.status}`);
    return data.data;
  } catch (error) {
    logError(`Échec de validation: ${error.message}`);
    throw error;
  }
}

// Rejeter une demande
async function rejectDemande(demandeId, token, motif) {
  logInfo('Rejet de la demande...');
  
  try {
    const data = await apiRequest(`/api/demandes/${demandeId}`, 'PUT', {
      status: 'rejetee',
      commentaire: motif,
    }, token);
    
    logSuccess(`Demande rejetée`);
    logInfo(`Nouveau status: ${data.data.status}`);
    logInfo(`Nombre de rejets: ${data.data.nombreRejets}`);
    logInfo(`Status précédent: ${data.data.statusPrecedent}`);
    return data.data;
  } catch (error) {
    logError(`Échec de rejet: ${error.message}`);
    throw error;
  }
}

// Modifier une demande rejetée
async function modifyRejectedDemande(demandeId, token, modifications) {
  logInfo('Modification de la demande rejetée...');
  
  try {
    const data = await apiRequest(`/api/demandes/${demandeId}/modify`, 'PUT', modifications, token);
    
    logSuccess(`Demande modifiée et renvoyée`);
    logInfo(`Nouveau status: ${data.data.status}`);
    return data.data;
  } catch (error) {
    logError(`Échec de modification: ${error.message}`);
    throw error;
  }
}

// Vérifier les assertions
function assert(condition, message) {
  if (!condition) {
    logError(`ASSERTION ÉCHOUÉE: ${message}`);
    throw new Error(message);
  }
  logSuccess(`ASSERTION RÉUSSIE: ${message}`);
}

// Test principal
async function runTests() {
  log('\n' + '🧪 '.repeat(30), 'cyan');
  log('TEST DU WORKFLOW DE REJET AVEC RETOUR ARRIÈRE', 'cyan');
  log('🧪 '.repeat(30) + '\n', 'cyan');

  try {
    // ==================== ÉTAPE 1 ====================
    logStep(1, 'Connexion des utilisateurs');
    await login('employe');
    await login('conducteur');
    await login('respTravaux');
    await login('chargeAffaire');

    // ==================== ÉTAPE 2 ====================
    logStep(2, 'Création d\'une demande par l\'employé');
    const demande1 = await createDemande(tokens.employe);
    assert(demande1.status === 'en_attente_validation_conducteur', 
      'Status initial correct');

    // ==================== ÉTAPE 3 ====================
    logStep(3, 'Validation par le conducteur');
    const demande2 = await validateDemande(testDemandeId, tokens.conducteur, 
      'Validation conducteur OK');
    assert(demande2.status === 'en_attente_validation_responsable_travaux', 
      'Status après validation conducteur correct');

    // ==================== ÉTAPE 4 ====================
    logStep(4, 'REJET par le responsable des travaux');
    const demande3 = await rejectDemande(testDemandeId, tokens.respTravaux, 
      'Quantités trop élevées, réduire à 5 unités');
    
    assert(demande3.status === 'en_attente_validation_conducteur', 
      'Retour au statut précédent (conducteur)');
    assert(demande3.nombreRejets === 1, 
      'Compteur de rejets = 1');
    assert(demande3.statusPrecedent === 'en_attente_validation_responsable_travaux', 
      'Status précédent sauvegardé');

    // ==================== ÉTAPE 5 ====================
    logStep(5, 'Modification par le conducteur');
    const demande4 = await modifyRejectedDemande(testDemandeId, tokens.conducteur, {
      items: [
        {
          articleId: 'article-test-1',
          quantiteDemandee: 5, // Réduit de 10 à 5
          commentaire: 'Quantité ajustée selon demande',
        },
      ],
      commentaires: 'Modifications apportées suite au rejet',
    });
    
    assert(demande4.status === 'en_attente_validation_responsable_travaux', 
      'Renvoi au responsable des travaux');
    assert(demande4.nombreRejets === 1, 
      'Compteur de rejets conservé');
    assert(demande4.statusPrecedent === null, 
      'Status précédent réinitialisé');

    // ==================== ÉTAPE 6 ====================
    logStep(6, 'Validation par le responsable des travaux');
    const demande5 = await validateDemande(testDemandeId, tokens.respTravaux, 
      'Validation après modification OK');
    assert(demande5.status === 'en_attente_validation_charge_affaire', 
      'Progression vers chargé d\'affaire');

    // ==================== ÉTAPE 7 ====================
    logStep(7, 'DEUXIÈME REJET par le chargé d\'affaire');
    const demande6 = await rejectDemande(testDemandeId, tokens.chargeAffaire, 
      'Budget dépassé, réduire encore');
    
    assert(demande6.status === 'en_attente_validation_responsable_travaux', 
      'Retour au responsable des travaux');
    assert(demande6.nombreRejets === 2, 
      'Compteur de rejets = 2');

    // ==================== ÉTAPE 8 ====================
    logStep(8, 'Modification par le responsable des travaux');
    const demande7 = await modifyRejectedDemande(testDemandeId, tokens.respTravaux, {
      items: [
        {
          articleId: 'article-test-1',
          quantiteDemandee: 3, // Réduit de 5 à 3
          commentaire: 'Quantité réduite pour budget',
        },
      ],
      commentaires: 'Ajustement budgétaire',
    });
    
    assert(demande7.status === 'en_attente_validation_charge_affaire', 
      'Renvoi au chargé d\'affaire');
    assert(demande7.nombreRejets === 2, 
      'Compteur de rejets = 2 (conservé)');

    // ==================== ÉTAPE 9 ====================
    logStep(9, 'Validation finale par le chargé d\'affaire');
    const demande8 = await validateDemande(testDemandeId, tokens.chargeAffaire, 
      'Validation finale OK');
    assert(demande8.status === 'en_attente_preparation_appro', 
      'Progression vers appro');

    // ==================== RÉSULTAT ====================
    log('\n' + '✅ '.repeat(30), 'green');
    log('TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS !', 'green');
    log('✅ '.repeat(30) + '\n', 'green');

    logInfo('Résumé du test:');
    log(`  - Demande ID: ${testDemandeId}`, 'blue');
    log(`  - Nombre de rejets: 2`, 'blue');
    log(`  - Statut final: en_attente_preparation_appro`, 'blue');
    log(`  - Workflow complet testé avec succès`, 'blue');

  } catch (error) {
    log('\n' + '❌ '.repeat(30), 'red');
    log('ÉCHEC DES TESTS', 'red');
    log('❌ '.repeat(30) + '\n', 'red');
    logError(`Erreur: ${error.message}`);
    process.exit(1);
  }
}

// Lancer les tests
runTests().then(() => {
  log('\n✨ Tests terminés\n', 'cyan');
  process.exit(0);
}).catch((error) => {
  logError(`Erreur fatale: ${error.message}`);
  process.exit(1);
});

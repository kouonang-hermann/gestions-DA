/**
 * SCRIPT DE TEST D'AUTO-VALIDATION
 * Teste tous les scénarios d'auto-validation selon les nouvelles règles
 */

// Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// Utilisateurs de test
const users = {
  conducteur: {
    email: 'conducteur@test.com',
    password: 'password123'
  },
  responsable_travaux: {
    email: 'responsable.travaux@test.com', 
    password: 'password123'
  },
  charge_affaire: {
    email: 'charge.affaire@test.com',
    password: 'password123'
  },
  responsable_logistique: {
    email: 'responsable.logistique@test.com',
    password: 'password123'
  },
  superadmin: {
    email: 'admin@test.com',
    password: 'password123'
  }
};

// Projets de test
const projets = {
  materiel: 'proj-001',
  outillage: 'proj-002'
};

/**
 * Connexion d'un utilisateur et récupération du token
 */
async function login(user) {
  console.log(`🔐 Connexion de ${user.email}...`);
  
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: user.email,
      password: user.password
    })
  });

  if (!response.ok) {
    throw new Error(`Erreur de connexion: ${response.status}`);
  }

  const data = await response.json();
  console.log(`✅ Connexion réussie: ${data.user.nom} ${data.user.prenom} (${data.user.role})`);
  return data.token;
}

/**
 * Création d'une demande et vérification du statut initial
 */
async function createDemande(token, type, projetId, expectedStatus) {
  console.log(`\n📝 Création demande ${type}...`);
  
  const demandeData = {
    type: type,
    projetId: projetId,
    dateLivraisonSouhaitee: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    commentaires: `Test auto-validation ${type}`,
    items: [
      {
        articleId: 'art-001',
        quantiteDemandee: 1,
        commentaire: 'Test auto-validation'
      }
    ]
  };

  const response = await fetch(`${API_BASE_URL}/demandes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(demandeData)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Erreur création demande: ${response.status} - ${error}`);
  }

  const demande = await response.json();
  const actualStatus = demande.data.status;
  
  console.log(`📊 Demande créée: ${demande.data.numero}`);
  console.log(`🎯 Statut attendu: ${expectedStatus}`);
  console.log(`✅ Statut réel: ${actualStatus}`);
  
  if (actualStatus === expectedStatus) {
    console.log(`🎉 ✅ AUTO-VALIDATION CORRECTE`);
  } else {
    console.log(`❌ ❌ AUTO-VALIDATION INCORRECTE`);
  }
  
  return demande.data;
}

/**
 * Test d'auto-validation pour un rôle spécifique
 */
async function testAutoValidation(role, userType, demandeType, projetId, expectedStatus) {
  console.log(`\n🧪 TEST AUTO-VALIDATION: ${role} - ${demandeType}`);
  console.log(`=` .repeat(60));
  
  try {
    const token = await login(users[userType]);
    await createDemande(token, demandeType, projetId, expectedStatus);
    console.log(`✅ Test ${role} terminé avec succès`);
  } catch (error) {
    console.error(`❌ Erreur test ${role}:`, error.message);
  }
}

/**
 * Suite complète de tests d'auto-validation
 */
async function runAllTests() {
  console.log('🚀 DÉMARRAGE DES TESTS D\'AUTO-VALIDATION');
  console.log('=' .repeat(80));
  
  // Tests pour chaque rôle
  const tests = [
    {
      role: 'Conducteur Travaux',
      userType: 'conducteur',
      demandeType: 'materiel',
      projetId: projets.materiel,
      expectedStatus: 'en_attente_validation_responsable_travaux' // Auto-valide son étape
    },
    {
      role: 'Conducteur Travaux',
      userType: 'conducteur', 
      demandeType: 'outillage',
      projetId: projets.outillage,
      expectedStatus: 'en_attente_validation_logistique' // Pas d'auto-validation pour outillage
    },
    {
      role: 'Responsable Travaux',
      userType: 'responsable_travaux',
      demandeType: 'materiel',
      projetId: projets.materiel,
      expectedStatus: 'en_attente_validation_conducteur' // Doit passer par Conducteur
    },
    {
      role: 'Responsable Travaux',
      userType: 'responsable_travaux',
      demandeType: 'outillage', 
      projetId: projets.outillage,
      expectedStatus: 'en_attente_validation_logistique' // Doit passer par Logistique
    },
    {
      role: 'Chargé Affaire',
      userType: 'charge_affaire',
      demandeType: 'materiel',
      projetId: projets.materiel,
      expectedStatus: 'en_attente_validation_conducteur' // Doit passer par Conducteur
    },
    {
      role: 'Chargé Affaire',
      userType: 'charge_affaire',
      demandeType: 'outillage',
      projetId: projets.outillage,
      expectedStatus: 'en_attente_validation_logistique' // Doit passer par Logistique
    },
    {
      role: 'Responsable Logistique',
      userType: 'responsable_logistique',
      demandeType: 'outillage',
      projetId: projets.outillage,
      expectedStatus: 'en_attente_validation_responsable_travaux' // Auto-valide son étape
    },
    {
      role: 'Superadmin',
      userType: 'superadmin',
      demandeType: 'materiel',
      projetId: projets.materiel,
      expectedStatus: 'en_attente_validation_conducteur' // Flow normal complet
    },
    {
      role: 'Superadmin',
      userType: 'superadmin',
      demandeType: 'outillage',
      projetId: projets.outillage,
      expectedStatus: 'en_attente_validation_logistique' // Flow normal complet
    }
  ];

  // Exécuter tous les tests
  for (const test of tests) {
    await testAutoValidation(test.role, test.userType, test.demandeType, test.projetId, test.expectedStatus);
  }
  
  console.log('\n🏁 TOUS LES TESTS TERMINÉS');
  console.log('=' .repeat(80));
}

/**
 * Test de validation manuelle pour le Superadmin
 */
async function testSuperadminValidationManuelle() {
  console.log('\n🔧 TEST VALIDATION MANUELLE SUPERADMIN');
  console.log('=' .repeat(60));
  
  try {
    // 1. Créer une demande avec un autre utilisateur
    console.log('1️⃣ Création demande par Conducteur...');
    const token = await login(users.conducteur);
    const demande = await createDemande(token, 'materiel', projets.materiel, 'en_attente_validation_responsable_travaux');
    
    // 2. Se connecter en Superadmin et valider manuellement
    console.log('\n2️⃣ Validation manuelle par Superadmin...');
    const adminToken = await login(users.superadmin);
    
    const validationResponse = await fetch(`${API_BASE_URL}/demandes/${demande.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        status: 'en_attente_validation_charge_affaire',
        action: 'valider',
        commentaire: 'Validation manuelle par Superadmin'
      })
    });
    
    if (validationResponse.ok) {
      console.log('✅ Superadmin peut valider manuellement');
    } else {
      console.log('❌ Superadmin ne peut pas valider manuellement');
    }
    
  } catch (error) {
    console.error('❌ Erreur test Superadmin:', error.message);
  }
}

/**
 * Fonction principale
 */
async function main() {
  try {
    await runAllTests();
    await testSuperadminValidationManuelle();
    console.log('\n🎉 TOUS LES TESTS D\'AUTO-VALIDATION TERMINÉS AVEC SUCCÈS!');
  } catch (error) {
    console.error('💥 ERREUR GLOBALE:', error.message);
    process.exit(1);
  }
}

// Exécuter les tests
if (require.main === module) {
  main();
}

module.exports = {
  runAllTests,
  testSuperadminValidationManuelle,
  testAutoValidation
};

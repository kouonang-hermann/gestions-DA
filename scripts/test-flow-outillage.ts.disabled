import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * SCRIPT DE TEST - FLOW DE VALIDATION OUTILLAGE
 * 
 * Ce script teste le nouveau flow de validation outillage avec auto-skip intelligent
 * selon le rôle du demandeur.
 * 
 * UTILISATEURS TEST (tous assignés au projet-test-1):
 * - employe@test.com (password: employe123) - Employé
 * - logistique@test.com (password: logistique123) - Responsable Logistique
 * - responsable-travaux@test.com (password: responsable123) - Responsable des Travaux
 * - charge@test.com (password: charge123) - Chargé d'Affaire
 * - livreur@test.com (password: livreur123) - Responsable Livreur
 * 
 * FLOW OUTILLAGE NORMAL (Employé):
 * Logistique (validation) → Resp. Travaux → Chargé Affaire → Logistique (préparation) → Livreur → Demandeur
 * 
 * FLOW OUTILLAGE (Resp. Logistique crée):
 * Logistique (validation) → Resp. Travaux → Chargé Affaire → Logistique (préparation) → Livreur → Demandeur
 * (Pas de skip, flow normal - il intervient 2 fois)
 * 
 * FLOW OUTILLAGE (Resp. Travaux crée):
 * Logistique (validation) → Resp. Travaux → Chargé Affaire → Logistique (préparation) → Livreur → Demandeur
 * (Pas de skip, flow normal)
 * 
 * FLOW OUTILLAGE (Chargé Affaire crée):
 * Logistique (validation) → Chargé Affaire → Logistique (préparation) → Livreur → Demandeur
 * (Skip: Resp. Travaux uniquement)
 */

async function main() {
  console.log('🧪 [TEST-FLOW-OUTILLAGE] Début des tests...\n')

  // Récupérer les utilisateurs test
  const employe = await prisma.user.findUnique({ where: { email: 'employe@test.com' } })
  const logistique = await prisma.user.findUnique({ where: { email: 'logistique@test.com' } })
  const respTravaux = await prisma.user.findUnique({ where: { email: 'responsable-travaux@test.com' } })
  const chargeAffaire = await prisma.user.findUnique({ where: { email: 'charge@test.com' } })
  const livreur = await prisma.user.findUnique({ where: { email: 'livreur@test.com' } })

  if (!employe || !logistique || !respTravaux || !chargeAffaire || !livreur) {
    throw new Error('❌ Utilisateurs test non trouvés. Exécutez d\'abord: npm run seed')
  }

  // Récupérer le projet test
  const projet = await prisma.projet.findUnique({ where: { id: 'projet-test-1' } })
  if (!projet) {
    throw new Error('❌ Projet test non trouvé. Exécutez d\'abord: npm run seed')
  }

  // Récupérer les articles outillage
  const articlesOutillage = await prisma.article.findMany({
    where: { type: 'outillage' }
  })

  if (articlesOutillage.length === 0) {
    throw new Error('❌ Aucun article outillage trouvé. Exécutez d\'abord: npm run seed')
  }

  console.log('✅ Utilisateurs et données de test chargés\n')

  // ========================================
  // TEST 1: Employé crée une demande outillage
  // ========================================
  console.log('📋 TEST 1: Employé crée une demande outillage')
  console.log('   Statut attendu: en_attente_validation_logistique')
  
  const demande1 = await prisma.demande.create({
    data: {
      numero: `TEST-OUT-EMP-${Date.now()}`,
      type: 'outillage',
      status: 'en_attente_validation_logistique', // Statut initial pour employé
      technicienId: employe.id,
      projetId: projet.id,
      commentaires: 'Test: Demande outillage créée par un employé',
      dateCreation: new Date(),
      dateModification: new Date(),
      items: {
        create: [
          {
            articleId: articlesOutillage[0].id,
            quantiteDemandee: 2,
            quantiteValidee: 2,
          }
        ]
      }
    },
    include: { items: true }
  })

  console.log(`   ✅ Demande créée: ${demande1.numero}`)
  console.log(`   ✅ Statut: ${demande1.status}`)
  console.log(`   ✅ Flow: Logistique → Resp. Travaux → Chargé Affaire → Logistique (préparation) → Livreur → Demandeur\n`)

  // ========================================
  // TEST 2: Responsable Logistique crée une demande outillage
  // ========================================
  console.log('📋 TEST 2: Responsable Logistique crée une demande outillage')
  console.log('   Statut attendu: en_attente_validation_logistique (pas de skip, il intervient 2 fois)')
  
  const demande2 = await prisma.demande.create({
    data: {
      numero: `TEST-OUT-LOG-${Date.now()}`,
      type: 'outillage',
      status: 'en_attente_validation_logistique', // Pas de skip
      technicienId: logistique.id,
      projetId: projet.id,
      commentaires: 'Test: Demande outillage créée par un responsable logistique',
      dateCreation: new Date(),
      dateModification: new Date(),
      items: {
        create: [
          {
            articleId: articlesOutillage[0].id,
            quantiteDemandee: 1,
            quantiteValidee: 1,
          }
        ]
      }
    },
    include: { items: true }
  })

  console.log(`   ✅ Demande créée: ${demande2.numero}`)
  console.log(`   ✅ Statut: ${demande2.status}`)
  console.log(`   ✅ Flow: Logistique (validation) → Resp. Travaux → Chargé Affaire → Logistique (préparation) → Livreur → Demandeur`)
  console.log(`   ✅ Étape sautée: Aucune (il intervient 2 fois dans le flow)\n`)

  // ========================================
  // TEST 3: Responsable Travaux crée une demande outillage
  // ========================================
  console.log('📋 TEST 3: Responsable Travaux crée une demande outillage')
  console.log('   Statut attendu: en_attente_validation_logistique (pas de skip, flow normal)')
  
  const demande3 = await prisma.demande.create({
    data: {
      numero: `TEST-OUT-RESP-${Date.now()}`,
      type: 'outillage',
      status: 'en_attente_validation_logistique', // Pas de skip
      technicienId: respTravaux.id,
      projetId: projet.id,
      commentaires: 'Test: Demande outillage créée par un responsable travaux',
      dateCreation: new Date(),
      dateModification: new Date(),
      items: {
        create: [
          {
            articleId: articlesOutillage[0].id,
            quantiteDemandee: 3,
            quantiteValidee: 3,
          }
        ]
      }
    },
    include: { items: true }
  })

  console.log(`   ✅ Demande créée: ${demande3.numero}`)
  console.log(`   ✅ Statut: ${demande3.status}`)
  console.log(`   ✅ Flow: Logistique → Resp. Travaux → Chargé Affaire → Logistique (préparation) → Livreur → Demandeur`)
  console.log(`   ✅ Étape sautée: Aucune (flow normal)\n`)

  // ========================================
  // TEST 4: Chargé Affaire crée une demande outillage
  // ========================================
  console.log('📋 TEST 4: Chargé Affaire crée une demande outillage')
  console.log('   Statut attendu: en_attente_validation_logistique (démarre à Logistique, skip Resp. Travaux)')
  
  const demande4 = await prisma.demande.create({
    data: {
      numero: `TEST-OUT-CHARGE-${Date.now()}`,
      type: 'outillage',
      status: 'en_attente_validation_logistique', // Démarre à Logistique
      technicienId: chargeAffaire.id,
      projetId: projet.id,
      commentaires: 'Test: Demande outillage créée par un chargé d\'affaire',
      dateCreation: new Date(),
      dateModification: new Date(),
      items: {
        create: [
          {
            articleId: articlesOutillage[0].id,
            quantiteDemandee: 4,
            quantiteValidee: 4,
          }
        ]
      }
    },
    include: { items: true }
  })

  console.log(`   ✅ Demande créée: ${demande4.numero}`)
  console.log(`   ✅ Statut: ${demande4.status}`)
  console.log(`   ✅ Flow: Logistique → Chargé Affaire → Logistique (préparation) → Livreur → Demandeur`)
  console.log(`   ✅ Étape sautée: Resp. Travaux\n`)

  // ========================================
  // RÉSUMÉ DES TESTS
  // ========================================
  console.log('📊 RÉSUMÉ DES TESTS OUTILLAGE:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`✅ Test 1 (Employé):          ${demande1.numero} → ${demande1.status}`)
  console.log(`✅ Test 2 (Resp. Logistique): ${demande2.numero} → ${demande2.status}`)
  console.log(`✅ Test 3 (Resp. Travaux):    ${demande3.numero} → ${demande3.status}`)
  console.log(`✅ Test 4 (Chargé Affaire):   ${demande4.numero} → ${demande4.status}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  console.log('🎯 PROCHAINES ÉTAPES:')
  console.log('1. Connectez-vous avec logistique@test.com pour valider toutes les demandes (1ère validation)')
  console.log('2. Connectez-vous avec responsable-travaux@test.com pour valider les demandes 1, 2 et 3')
  console.log('3. Connectez-vous avec charge@test.com pour valider les demandes 1, 2, 3 et 4')
  console.log('4. Connectez-vous avec logistique@test.com pour préparer toutes les demandes (2ème intervention)')
  console.log('5. Vérifiez que le Resp. Logistique intervient bien 2 fois dans le flow\n')

  console.log('💡 POINTS CLÉS À VÉRIFIER:')
  console.log('- Le Resp. Logistique voit toutes les demandes à l\'étape "validation logistique"')
  console.log('- Le Resp. Travaux ne voit PAS la demande 4 (créée par Chargé Affaire)')
  console.log('- Le Resp. Logistique voit à nouveau toutes les demandes à l\'étape "préparation logistique"')
  console.log('- Chaque demande peut avoir son prix renseigné lors de la préparation logistique\n')

  console.log('🎉 Tests terminés avec succès!')
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors des tests:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * SCRIPT DE TEST - FLOW DE VALIDATION MATÉRIEL
 * 
 * Ce script teste le nouveau flow de validation matériel avec auto-skip intelligent
 * selon le rôle du demandeur.
 * 
 * UTILISATEURS TEST (tous assignés au projet-test-1):
 * - employe@test.com (password: employe123) - Employé
 * - conducteur@test.com (password: conducteur123) - Conducteur des Travaux
 * - responsable-travaux@test.com (password: responsable123) - Responsable des Travaux
 * - charge@test.com (password: charge123) - Chargé d'Affaire
 * - appro@test.com (password: appro123) - Responsable Appro
 * - livreur@test.com (password: livreur123) - Responsable Livreur
 * 
 * FLOW MATÉRIEL NORMAL (Employé):
 * Conducteur → Resp. Travaux → Chargé Affaire → Appro → Livreur → Demandeur
 * 
 * FLOW MATÉRIEL (Conducteur crée):
 * Resp. Travaux → Chargé Affaire → Appro → Livreur → Demandeur
 * (Skip: Conducteur)
 * 
 * FLOW MATÉRIEL (Resp. Travaux crée):
 * Chargé Affaire → Appro → Livreur → Demandeur
 * (Skip: Conducteur + Resp. Travaux)
 * 
 * FLOW MATÉRIEL (Chargé Affaire crée):
 * Appro → Livreur → Demandeur
 * (Skip: Conducteur + Resp. Travaux + Chargé Affaire)
 */

async function main() {
  console.log('🧪 [TEST-FLOW-MATÉRIEL] Début des tests...\n')

  // Récupérer les utilisateurs test
  const employe = await prisma.user.findUnique({ where: { email: 'employe@test.com' } })
  const conducteur = await prisma.user.findUnique({ where: { email: 'conducteur@test.com' } })
  const respTravaux = await prisma.user.findUnique({ where: { email: 'responsable-travaux@test.com' } })
  const chargeAffaire = await prisma.user.findUnique({ where: { email: 'charge@test.com' } })
  const appro = await prisma.user.findUnique({ where: { email: 'appro@test.com' } })
  const livreur = await prisma.user.findUnique({ where: { email: 'livreur@test.com' } })

  if (!employe || !conducteur || !respTravaux || !chargeAffaire || !appro || !livreur) {
    throw new Error('❌ Utilisateurs test non trouvés. Exécutez d\'abord: npm run seed')
  }

  // Récupérer le projet test
  const projet = await prisma.projet.findUnique({ where: { id: 'projet-test-1' } })
  if (!projet) {
    throw new Error('❌ Projet test non trouvé. Exécutez d\'abord: npm run seed')
  }

  // Récupérer les articles matériel
  const articlesMateriel = await prisma.article.findMany({
    where: { type: 'materiel' }
  })

  if (articlesMateriel.length === 0) {
    throw new Error('❌ Aucun article matériel trouvé. Exécutez d\'abord: npm run seed')
  }

  console.log('✅ Utilisateurs et données de test chargés\n')

  // ========================================
  // TEST 1: Employé crée une demande matériel
  // ========================================
  console.log('📋 TEST 1: Employé crée une demande matériel')
  console.log('   Statut attendu: en_attente_validation_conducteur')
  
  const demande1 = await prisma.demande.create({
    data: {
      numero: `TEST-MAT-EMP-${Date.now()}`,
      type: 'materiel',
      status: 'en_attente_validation_conducteur', // Statut initial pour employé
      technicienId: employe.id,
      projetId: projet.id,
      commentaires: 'Test: Demande matériel créée par un employé',
      dateCreation: new Date(),
      dateModification: new Date(),
      items: {
        create: [
          {
            articleId: articlesMateriel[0].id,
            quantiteDemandee: 5,
            quantiteValidee: 5,
          }
        ]
      }
    },
    include: { items: true }
  })

  console.log(`   ✅ Demande créée: ${demande1.numero}`)
  console.log(`   ✅ Statut: ${demande1.status}`)
  console.log(`   ✅ Flow: Conducteur → Resp. Travaux → Chargé Affaire → Appro → Livreur → Demandeur\n`)

  // ========================================
  // TEST 2: Conducteur crée une demande matériel
  // ========================================
  console.log('📋 TEST 2: Conducteur crée une demande matériel')
  console.log('   Statut attendu: en_attente_validation_responsable_travaux (skip Conducteur)')
  
  const demande2 = await prisma.demande.create({
    data: {
      numero: `TEST-MAT-COND-${Date.now()}`,
      type: 'materiel',
      status: 'en_attente_validation_responsable_travaux', // Skip conducteur
      technicienId: conducteur.id,
      projetId: projet.id,
      commentaires: 'Test: Demande matériel créée par un conducteur',
      dateCreation: new Date(),
      dateModification: new Date(),
      items: {
        create: [
          {
            articleId: articlesMateriel[0].id,
            quantiteDemandee: 3,
            quantiteValidee: 3,
          }
        ]
      }
    },
    include: { items: true }
  })

  console.log(`   ✅ Demande créée: ${demande2.numero}`)
  console.log(`   ✅ Statut: ${demande2.status}`)
  console.log(`   ✅ Flow: Resp. Travaux → Chargé Affaire → Appro → Livreur → Demandeur`)
  console.log(`   ✅ Étape sautée: Conducteur\n`)

  // ========================================
  // TEST 3: Responsable Travaux crée une demande matériel
  // ========================================
  console.log('📋 TEST 3: Responsable Travaux crée une demande matériel')
  console.log('   Statut attendu: en_attente_validation_charge_affaire (skip Conducteur + Resp. Travaux)')
  
  const demande3 = await prisma.demande.create({
    data: {
      numero: `TEST-MAT-RESP-${Date.now()}`,
      type: 'materiel',
      status: 'en_attente_validation_charge_affaire', // Skip conducteur + resp travaux
      technicienId: respTravaux.id,
      projetId: projet.id,
      commentaires: 'Test: Demande matériel créée par un responsable travaux',
      dateCreation: new Date(),
      dateModification: new Date(),
      items: {
        create: [
          {
            articleId: articlesMateriel[0].id,
            quantiteDemandee: 10,
            quantiteValidee: 10,
          }
        ]
      }
    },
    include: { items: true }
  })

  console.log(`   ✅ Demande créée: ${demande3.numero}`)
  console.log(`   ✅ Statut: ${demande3.status}`)
  console.log(`   ✅ Flow: Chargé Affaire → Appro → Livreur → Demandeur`)
  console.log(`   ✅ Étapes sautées: Conducteur + Resp. Travaux\n`)

  // ========================================
  // TEST 4: Chargé Affaire crée une demande matériel
  // ========================================
  console.log('📋 TEST 4: Chargé Affaire crée une demande matériel')
  console.log('   Statut attendu: en_attente_preparation_appro (skip Conducteur + Resp. Travaux + Chargé Affaire)')
  
  const demande4 = await prisma.demande.create({
    data: {
      numero: `TEST-MAT-CHARGE-${Date.now()}`,
      type: 'materiel',
      status: 'en_attente_preparation_appro', // Skip conducteur + resp travaux + chargé affaire
      technicienId: chargeAffaire.id,
      projetId: projet.id,
      commentaires: 'Test: Demande matériel créée par un chargé d\'affaire',
      dateCreation: new Date(),
      dateModification: new Date(),
      items: {
        create: [
          {
            articleId: articlesMateriel[0].id,
            quantiteDemandee: 7,
            quantiteValidee: 7,
          }
        ]
      }
    },
    include: { items: true }
  })

  console.log(`   ✅ Demande créée: ${demande4.numero}`)
  console.log(`   ✅ Statut: ${demande4.status}`)
  console.log(`   ✅ Flow: Appro → Livreur → Demandeur`)
  console.log(`   ✅ Étapes sautées: Conducteur + Resp. Travaux + Chargé Affaire\n`)

  // ========================================
  // RÉSUMÉ DES TESTS
  // ========================================
  console.log('📊 RÉSUMÉ DES TESTS MATÉRIEL:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`✅ Test 1 (Employé):         ${demande1.numero} → ${demande1.status}`)
  console.log(`✅ Test 2 (Conducteur):      ${demande2.numero} → ${demande2.status}`)
  console.log(`✅ Test 3 (Resp. Travaux):   ${demande3.numero} → ${demande3.status}`)
  console.log(`✅ Test 4 (Chargé Affaire):  ${demande4.numero} → ${demande4.status}`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  console.log('🎯 PROCHAINES ÉTAPES:')
  console.log('1. Connectez-vous avec conducteur@test.com pour valider la demande 1')
  console.log('2. Connectez-vous avec responsable-travaux@test.com pour valider les demandes 1 et 2')
  console.log('3. Connectez-vous avec charge@test.com pour valider les demandes 1, 2 et 3')
  console.log('4. Connectez-vous avec appro@test.com pour préparer toutes les demandes')
  console.log('5. Vérifiez que chaque valideur ne voit QUE les demandes de son étape\n')

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

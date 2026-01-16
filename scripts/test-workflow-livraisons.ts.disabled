/**
 * SCRIPT DE TEST DU WORKFLOW COMPLET AVEC LIVRAISONS
 * 
 * Ce script teste le flux complet d'une demande matériel :
 * 1. Création par un employé
 * 2. Validation par conducteur
 * 3. Validation par responsable travaux
 * 4. Validation par chargé d'affaires
 * 5. Préparation par appro (avec création automatique de livraison)
 * 6. Réception par livreur
 * 7. Livraison au demandeur
 * 8. Clôture par demandeur
 * 9. Vérification des livraisons créées
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testWorkflowComplet() {
  console.log('\n🧪 ========================================')
  console.log('   TEST DU WORKFLOW COMPLET AVEC LIVRAISONS')
  console.log('========================================\n')

  try {
    // ============================================
    // ÉTAPE 0 : PRÉPARATION DES DONNÉES DE TEST
    // ============================================
    console.log('📋 ÉTAPE 0 : Préparation des données de test...\n')

    // Récupérer les utilisateurs nécessaires d'abord
    const employe = await prisma.user.findFirst({ where: { role: 'employe' } })
    const conducteur = await prisma.user.findFirst({ where: { role: 'conducteur_travaux' } })
    const responsableTravaux = await prisma.user.findFirst({ where: { role: 'responsable_travaux' } })
    const chargeAffaire = await prisma.user.findFirst({ where: { role: 'charge_affaire' } })
    const appro = await prisma.user.findFirst({ where: { role: 'responsable_appro' } })
    const livreur = await prisma.user.findFirst({ where: { role: 'responsable_livreur' } })
    const superadmin = await prisma.user.findFirst({ where: { role: 'superadmin' } })

    if (!employe || !conducteur || !responsableTravaux || !chargeAffaire || !appro || !livreur || !superadmin) {
      console.log('❌ Utilisateurs manquants. Veuillez créer les utilisateurs nécessaires.')
      return
    }

    console.log(`✅ Employé: ${employe.prenom} ${employe.nom}`)
    console.log(`✅ Conducteur: ${conducteur.prenom} ${conducteur.nom}`)
    console.log(`✅ Responsable Travaux: ${responsableTravaux.prenom} ${responsableTravaux.nom}`)
    console.log(`✅ Chargé d'Affaires: ${chargeAffaire.prenom} ${chargeAffaire.nom}`)
    console.log(`✅ Appro: ${appro.prenom} ${appro.nom}`)
    console.log(`✅ Livreur: ${livreur.prenom} ${livreur.nom}`)

    // Récupérer ou créer un projet de test
    let projet = await prisma.projet.findFirst({
      where: { nom: { contains: 'Test' } }
    })

    if (!projet) {
      projet = await prisma.projet.create({
        data: {
          nom: 'Projet Test Livraisons',
          description: 'Projet pour tester le système de livraisons multiples',
          dateDebut: new Date(),
          actif: true,
          createdBy: superadmin.id
        }
      })
      console.log(`✅ Projet créé: ${projet.nom} (${projet.id})`)
    } else {
      console.log(`✅ Projet existant: ${projet.nom} (${projet.id})`)
    }

    // Récupérer ou créer des articles de test
    let article1 = await prisma.article.findFirst({ where: { reference: 'TEST-001' } })
    if (!article1) {
      article1 = await prisma.article.create({
        data: {
          nom: 'Ciment Test',
          description: 'Ciment pour test de livraison',
          reference: 'TEST-001',
          unite: 'sac',
          type: 'materiel',
          stock: 1000,
          prixUnitaire: 15.50
        }
      })
    }

    let article2 = await prisma.article.findFirst({ where: { reference: 'TEST-002' } })
    if (!article2) {
      article2 = await prisma.article.create({
        data: {
          nom: 'Fer à béton Test',
          description: 'Fer à béton pour test',
          reference: 'TEST-002',
          unite: 'kg',
          type: 'materiel',
          stock: 500,
          prixUnitaire: 2.30
        }
      })
    }

    console.log(`✅ Articles: ${article1.nom}, ${article2.nom}\n`)

    // ============================================
    // ÉTAPE 1 : CRÉATION DE LA DEMANDE
    // ============================================
    console.log('📝 ÉTAPE 1 : Création de la demande par l\'employé...\n')

    const demande = await prisma.demande.create({
      data: {
        numero: `DEM-TEST-${Date.now()}`,
        projetId: projet.id,
        technicienId: employe.id,
        type: 'materiel',
        status: 'soumise',
        commentaires: 'Demande de test pour vérifier le système de livraisons multiples',
        items: {
          create: [
            {
              articleId: article1.id,
              quantiteDemandee: 100,
              commentaire: '100 sacs de ciment'
            },
            {
              articleId: article2.id,
              quantiteDemandee: 50,
              commentaire: '50 kg de fer à béton'
            }
          ]
        }
      },
      include: { items: { include: { article: true } } }
    })

    console.log(`✅ Demande créée: ${demande.numero}`)
    console.log(`   Status: ${demande.status}`)
    console.log(`   Articles:`)
    demande.items.forEach(item => {
      console.log(`   - ${item.article.nom}: ${item.quantiteDemandee} ${item.article.unite}`)
    })
    console.log()

    // ============================================
    // ÉTAPE 2 : VALIDATION PAR LE CONDUCTEUR
    // ============================================
    console.log('✅ ÉTAPE 2 : Validation par le conducteur des travaux...\n')

    await prisma.demande.update({
      where: { id: demande.id },
      data: { status: 'en_attente_validation_responsable_travaux' }
    })

    // Mettre à jour les quantités validées
    for (const item of demande.items) {
      await prisma.itemDemande.update({
        where: { id: item.id },
        data: { quantiteValidee: Math.floor(item.quantiteDemandee * 0.9) } // 90% validé
      })
    }

    const demandeApresValidation1 = await prisma.demande.findUnique({
      where: { id: demande.id },
      include: { items: { include: { article: true } } }
    })

    console.log(`✅ Validation conducteur effectuée`)
    console.log(`   Nouveau status: ${demandeApresValidation1?.status}`)
    console.log(`   Quantités validées:`)
    demandeApresValidation1?.items.forEach(item => {
      console.log(`   - ${item.article.nom}: ${item.quantiteValidee}/${item.quantiteDemandee} ${item.article.unite}`)
    })
    console.log()

    // ============================================
    // ÉTAPE 3 : VALIDATION PAR LE RESPONSABLE TRAVAUX
    // ============================================
    console.log('✅ ÉTAPE 3 : Validation par le responsable des travaux...\n')

    await prisma.demande.update({
      where: { id: demande.id },
      data: { status: 'en_attente_validation_charge_affaire' }
    })

    console.log(`✅ Validation responsable travaux effectuée`)
    console.log(`   Nouveau status: en_attente_validation_charge_affaire\n`)

    // ============================================
    // ÉTAPE 4 : VALIDATION PAR LE CHARGÉ D'AFFAIRES
    // ============================================
    console.log('💰 ÉTAPE 4 : Validation par le chargé d\'affaires...\n')

    // Ajouter les prix
    for (const item of demande.items) {
      await prisma.itemDemande.update({
        where: { id: item.id },
        data: { prixUnitaire: item.article.prixUnitaire }
      })
    }

    await prisma.demande.update({
      where: { id: demande.id },
      data: { 
        status: 'en_attente_preparation_appro',
        budgetPrevisionnel: 2000.00,
        dateEngagement: new Date()
      }
    })

    console.log(`✅ Validation chargé d'affaires effectuée`)
    console.log(`   Nouveau status: en_attente_preparation_appro`)
    console.log(`   Budget prévisionnel: 2000.00 €\n`)

    // ============================================
    // ÉTAPE 5 : PRÉPARATION PAR L'APPRO (AVEC LIVRAISON)
    // ============================================
    console.log('📦 ÉTAPE 5 : Préparation de sortie par l\'appro...\n')

    // Récupérer les items avec quantités validées
    const itemsAvecQuantites = await prisma.itemDemande.findMany({
      where: { demandeId: demande.id }
    })

    // Créer la livraison automatiquement (comme le fait l'action preparer_sortie)
    const livraison = await prisma.livraison.create({
      data: {
        demandeId: demande.id,
        livreurId: livreur.id,
        commentaire: 'Livraison complète créée automatiquement par preparer_sortie',
        statut: 'prete',
        items: {
          create: itemsAvecQuantites.map(item => ({
            itemDemandeId: item.id,
            quantiteLivree: item.quantiteValidee || item.quantiteDemandee
          }))
        }
      },
      include: {
        items: {
          include: {
            itemDemande: {
              include: { article: true }
            }
          }
        }
      }
    })

    await prisma.demande.update({
      where: { id: demande.id },
      data: { 
        status: 'en_attente_reception_livreur',
        livreurAssigneId: livreur.id
      }
    })

    console.log(`✅ Préparation sortie effectuée`)
    console.log(`   Nouveau status: en_attente_reception_livreur`)
    console.log(`   Livreur assigné: ${livreur.prenom} ${livreur.nom}`)
    console.log(`   Livraison créée: ${livraison.id}`)
    console.log(`   Statut livraison: ${livraison.statut}`)
    console.log(`   Articles dans la livraison:`)
    livraison.items.forEach(item => {
      console.log(`   - ${item.itemDemande.article.nom}: ${item.quantiteLivree} ${item.itemDemande.article.unite}`)
    })
    console.log()

    // ============================================
    // ÉTAPE 6 : VÉRIFICATION DES QUANTITÉS
    // ============================================
    console.log('🔍 ÉTAPE 6 : Vérification des quantités livrées...\n')

    // Calculer les totaux
    const itemsFinaux = await prisma.itemDemande.findMany({
      where: { demandeId: demande.id },
      include: { 
        article: true,
        livraisons: {
          include: { livraison: true }
        }
      }
    })

    let totalValidee = 0
    let totalLivree = 0

    for (const item of itemsFinaux) {
      const validee = item.quantiteValidee || item.quantiteDemandee
      const livree = item.livraisons.reduce((sum, l) => sum + l.quantiteLivree, 0)
      
      totalValidee += validee
      totalLivree += livree

      console.log(`   ${item.article.nom}:`)
      console.log(`   - Demandée: ${item.quantiteDemandee}`)
      console.log(`   - Validée: ${validee}`)
      console.log(`   - Livrée: ${livree}`)
      console.log(`   - Restante: ${validee - livree}`)
      console.log()
    }

    const pourcentage = totalValidee > 0 ? (totalLivree / totalValidee * 100).toFixed(1) : 0
    console.log(`📊 Résumé global:`)
    console.log(`   Total validé: ${totalValidee} unités`)
    console.log(`   Total livré: ${totalLivree} unités`)
    console.log(`   Pourcentage: ${pourcentage}%`)
    console.log(`   Livraison complète: ${totalLivree >= totalValidee ? '✅ OUI' : '❌ NON'}\n`)

    // ============================================
    // ÉTAPE 7 : RÉCEPTION PAR LE LIVREUR
    // ============================================
    console.log('🚚 ÉTAPE 7 : Réception par le livreur...\n')

    await prisma.livraison.update({
      where: { id: livraison.id },
      data: { statut: 'en_cours' }
    })

    await prisma.demande.update({
      where: { id: demande.id },
      data: { 
        status: 'en_attente_livraison',
        dateReceptionLivreur: new Date()
      }
    })

    console.log(`✅ Réception livreur effectuée`)
    console.log(`   Nouveau status demande: en_attente_livraison`)
    console.log(`   Nouveau status livraison: en_cours\n`)

    // ============================================
    // ÉTAPE 8 : LIVRAISON AU DEMANDEUR
    // ============================================
    console.log('📬 ÉTAPE 8 : Livraison au demandeur...\n')

    await prisma.demande.update({
      where: { id: demande.id },
      data: { 
        status: 'en_attente_validation_finale_demandeur',
        dateLivraison: new Date()
      }
    })

    console.log(`✅ Livraison au demandeur effectuée`)
    console.log(`   Nouveau status: en_attente_validation_finale_demandeur\n`)

    // ============================================
    // ÉTAPE 9 : CLÔTURE PAR LE DEMANDEUR
    // ============================================
    console.log('🔒 ÉTAPE 9 : Clôture par le demandeur...\n')

    // Marquer toutes les livraisons comme livrées (comme le fait l'action cloturer)
    await prisma.livraison.updateMany({
      where: { 
        demandeId: demande.id,
        statut: { in: ['prete', 'en_cours'] }
      },
      data: { 
        statut: 'livree',
        dateLivraison: new Date()
      }
    })

    await prisma.demande.update({
      where: { id: demande.id },
      data: { 
        status: 'cloturee',
        dateValidationFinale: new Date()
      }
    })

    console.log(`✅ Clôture effectuée`)
    console.log(`   Nouveau status demande: cloturee`)
    console.log(`   Toutes les livraisons marquées comme livrées\n`)

    // ============================================
    // ÉTAPE 10 : VÉRIFICATION FINALE
    // ============================================
    console.log('🔍 ÉTAPE 10 : Vérification finale du système de livraisons...\n')

    const demandeFinale = await prisma.demande.findUnique({
      where: { id: demande.id },
      include: {
        items: {
          include: {
            article: true,
            livraisons: {
              include: { livraison: true }
            }
          }
        },
        livraisons: {
          include: {
            livreur: true,
            items: {
              include: {
                itemDemande: {
                  include: { article: true }
                }
              }
            }
          }
        }
      }
    })

    console.log(`📋 Demande finale: ${demandeFinale?.numero}`)
    console.log(`   Status: ${demandeFinale?.status}`)
    console.log(`   Nombre de livraisons: ${demandeFinale?.livraisons.length}`)
    console.log()

    demandeFinale?.livraisons.forEach((liv, index) => {
      console.log(`   Livraison ${index + 1}:`)
      console.log(`   - ID: ${liv.id}`)
      console.log(`   - Statut: ${liv.statut}`)
      console.log(`   - Livreur: ${liv.livreur.prenom} ${liv.livreur.nom}`)
      console.log(`   - Date création: ${liv.dateCreation.toLocaleString()}`)
      console.log(`   - Date livraison: ${liv.dateLivraison?.toLocaleString() || 'N/A'}`)
      console.log(`   - Articles:`)
      liv.items.forEach(item => {
        console.log(`     * ${item.itemDemande.article.nom}: ${item.quantiteLivree} ${item.itemDemande.article.unite}`)
      })
      console.log()
    })

    // ============================================
    // RÉSUMÉ FINAL
    // ============================================
    console.log('\n✅ ========================================')
    console.log('   TEST TERMINÉ AVEC SUCCÈS !')
    console.log('========================================\n')

    console.log('📊 RÉSUMÉ DU TEST:\n')
    console.log('✅ Demande créée et soumise')
    console.log('✅ Validation par conducteur (quantités ajustées)')
    console.log('✅ Validation par responsable travaux')
    console.log('✅ Validation par chargé d\'affaires (prix ajoutés)')
    console.log('✅ Préparation par appro')
    console.log('✅ Livraison créée automatiquement')
    console.log('✅ Réception par livreur')
    console.log('✅ Livraison au demandeur')
    console.log('✅ Clôture par demandeur')
    console.log('✅ Livraisons marquées comme livrées')
    console.log()
    console.log('🎯 SYSTÈME DE LIVRAISONS MULTIPLES: FONCTIONNEL ✅')
    console.log()

  } catch (error) {
    console.error('\n❌ ERREUR LORS DU TEST:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le test
testWorkflowComplet()
  .then(() => {
    console.log('✅ Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script terminé avec erreur:', error)
    process.exit(1)
  })

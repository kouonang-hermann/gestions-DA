/**
 * Script pour ajouter les projets Instrumelec dans la base de données
 * 
 * UTILISATION :
 * node scripts/seed-projets.js
 * 
 * Ce script crée 29 projets dans la base de données
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const projets = [
  {
    nom: "CONSO",
    description: "Frais généraux Instrumelec",
    dateDebut: new Date("2026-01-01"),
    dateFin: new Date("2030-12-21"),
    localisation: "Siège Instrumelec",
    actif: true
  },
  {
    nom: "MINTP – SINOHYDRO",
    description: "Électricité courant fort immeuble devant abriter les services centraux du Ministère des Travaux Publics",
    dateDebut: new Date("2026-01-01"),
    dateFin: new Date("2030-12-21"),
    localisation: "Yaoundé, Cameroun",
    actif: true
  },
  {
    nom: "CCA – BONANJO",
    description: "Travaux de courant fort SCI-AFG",
    dateDebut: new Date("2026-01-01"),
    dateFin: new Date("2030-12-21"),
    localisation: "Bonanjo, Douala",
    actif: true
  },
  {
    nom: "IMMEUBLE SIEGE CARTE ROSE",
    description: "Construction de l'immeuble siège BNCR CEMAC",
    dateDebut: new Date("2026-01-01"),
    dateFin: new Date("2030-12-21"),
    localisation: "Cameroun",
    actif: true
  },
  {
    nom: "SANDAGA",
    description: "Construction d'un immeuble R+14",
    dateDebut: new Date("2026-01-01"),
    dateFin: new Date("2030-12-21"),
    localisation: "Cameroun",
    actif: true
  },
  {
    nom: "TOTAL – RETROFIT ABONGMBANG",
    description: "Retrofit des installations solaires d'Abongmbang",
    dateDebut: new Date("2026-01-01"),
    dateFin: new Date("2030-12-21"),
    localisation: "Abongmbang, Cameroun",
    actif: true
  },
  {
    nom: "TOTAL B2B FRONIUS",
    description: "Fourniture de matériel B2B – équipements Fronius",
    dateDebut: new Date("2026-01-01"),
    dateFin: new Date("2030-12-21"),
    localisation: "Cameroun",
    actif: true
  },
  {
    nom: "TOTAL COFFRET ATEX",
    description: "Fourniture et pose de coffrets ATEX pour kits d'additivation",
    dateDebut: new Date("2026-01-01"),
    dateFin: new Date("2030-12-21"),
    localisation: "Cameroun",
    actif: true
  },
  {
    nom: "TOTAL SOLARISATION 2022",
    description: "Travaux de solarisation – campagne 2022",
    dateDebut: new Date("2026-01-01"),
    dateFin: new Date("2030-12-21"),
    localisation: "Cameroun",
    actif: true
  },
  {
    nom: "CURIO",
    description: "Projet CURIO",
    dateDebut: new Date("2026-01-01"),
    dateFin: new Date("2030-12-21"),
    localisation: "Cameroun",
    actif: true
  },
  {
    nom: "TOTAL SOLARISATION NYOM",
    description: "Solarisation de la station-service TOTAL NYOM",
    dateDebut: new Date("2026-01-01"),
    dateFin: new Date("2030-12-21"),
    localisation: "Nyom, Cameroun",
    actif: true
  },
  {
    nom: "TRADEX MISE EN CONFORMITÉ SSI",
    description: "Mise en conformité du système de sécurité incendie TRADEX",
    dateDebut: new Date("2026-01-01"),
    dateFin: new Date("2030-12-21"),
    localisation: "Cameroun",
    actif: true
  },
  {
    nom: "BONAMOUSSADI MALL",
    description: "Travaux électriques courant fort – Bonamoussadi Mall",
    dateDebut: new Date("2026-01-01"),
    dateFin: new Date("2030-12-21"),
    localisation: "Douala, Cameroun",
    actif: true
  },
  {
    nom: "CONGELCAM CAFETERIAT",
    description: "Aménagement de la cafétéria Congelcam",
    dateDebut: new Date("2026-01-01"),
    dateFin: new Date("2030-12-21"),
    localisation: "Cameroun",
    actif: true
  },
  {
    nom: "BENEFICIAL FOURNITURE 2 GE",
    description: "Fourniture, livraison et installation de deux groupes électrogènes",
    dateDebut: new Date("2026-01-01"),
    dateFin: new Date("2030-12-21"),
    localisation: "Cameroun",
    actif: true
  },
  {
    nom: "TGBT BEAC",
    description: "Remplacement des tableaux généraux basse tension (TGBT) de l'immeuble siège",
    dateDebut: new Date("2026-01-01"),
    dateFin: new Date("2030-12-21"),
    localisation: "Cameroun",
    actif: true
  },
  {
    nom: "CAMILLA",
    description: "Projet Camilla",
    dateDebut: new Date("2026-01-01"),
    dateFin: new Date("2030-12-21"),
    localisation: "Cameroun",
    actif: true
  },
  {
    nom: "TOTAL FOURNITURE MAT DEPOT BONABERIE",
    description: "Fourniture et installation des mâts au dépôt TOTAL de Bonabérie",
    dateDebut: new Date("2026-01-01"),
    dateFin: new Date("2030-12-21"),
    localisation: "Bonabérie, Douala",
    actif: true
  },
  {
    nom: "NEO INDUSTRY MAGASIN PDR",
    description: "Construction et aménagement du magasin de pièces de rechange",
    dateDebut: new Date("2026-01-01"),
    dateFin: new Date("2030-12-21"),
    localisation: "Kekem, Cameroun",
    actif: true
  },
  {
    nom: "NEO INDUSTRY MAGASIN FEVES",
    description: "Construction et aménagement du magasin de fèves",
    dateDebut: new Date("2026-01-01"),
    dateFin: new Date("2030-12-21"),
    localisation: "Kekem, Cameroun",
    actif: true
  },
  {
    nom: "CONGELCAM RDC & LEVEL 1",
    description: "Travaux d'électricité au RDC et au Level 1 du siège Congelcam",
    dateDebut: new Date("2026-01-01"),
    dateFin: new Date("2030-12-21"),
    localisation: "Cameroun",
    actif: true
  },
  {
    nom: "NEO INDUSTRY EXTENSION",
    description: "Projet d'extension de l'usine NEO Industry",
    dateDebut: new Date("2026-01-01"),
    dateFin: new Date("2030-12-21"),
    localisation: "Kekem, Cameroun",
    actif: true
  },
  {
    nom: "TOTAL CORRECTION MONITORING CENTRE",
    description: "Correction des problèmes de monitoring – Région Centre",
    dateDebut: new Date("2026-01-01"),
    dateFin: new Date("2030-12-21"),
    localisation: "Région Centre, Cameroun",
    actif: true
  },
  {
    nom: "TOTAL CORRECTION MONITORING LITTORAL & SUD-OUEST",
    description: "Correction des problèmes de monitoring – Régions Littoral et Sud-Ouest",
    dateDebut: new Date("2026-01-01"),
    dateFin: new Date("2030-12-21"),
    localisation: "Littoral & Sud-Ouest, Cameroun",
    actif: true
  },
  {
    nom: "TOTAL TAWAAL SANGMELIMA",
    description: "Reprise du projet TAWAAL Sangmélima – lot électricité",
    dateDebut: new Date("2026-01-01"),
    dateFin: new Date("2030-12-21"),
    localisation: "Sangmélima, Cameroun",
    actif: true
  },
  {
    nom: "ORANGE SOLARISATION EDEA & KRIBI",
    description: "Solarisation des sites ORANGE à Edéa et Kribi",
    dateDebut: new Date("2026-01-01"),
    dateFin: new Date("2030-12-21"),
    localisation: "Edéa & Kribi, Cameroun",
    actif: true
  },
  {
    nom: "HOTEL KRYSTAL YAOUNDE",
    description: "Travaux d'électricité courant fort et courant faible – Hôtel Krystal",
    dateDebut: new Date("2026-01-01"),
    dateFin: new Date("2030-12-21"),
    localisation: "Yaoundé, Cameroun",
    actif: true
  },
  {
    nom: "NEO INDUSTRY REMPLACEMENT BATTERIES DE COMPENSATION",
    description: "Remplacement des batteries de compensation automatiques",
    dateDebut: new Date("2026-01-01"),
    dateFin: new Date("2030-12-21"),
    localisation: "Cameroun",
    actif: true
  },
  {
    nom: "CONGELCAM MAGASIN AKWA",
    description: "Travaux de canalisations secondaires et principales – magasin Congelcam Akwa",
    dateDebut: new Date("2026-01-01"),
    dateFin: new Date("2030-12-21"),
    localisation: "Akwa, Douala",
    actif: true
  }
]

async function seedProjets() {
  try {
    console.log('🚀 Début de la création des projets...\n')

    let createdCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const projetData of projets) {
      try {
        // Vérifier si le projet existe déjà
        const existingProjet = await prisma.projet.findFirst({
          where: { nom: projetData.nom }
        })

        if (existingProjet) {
          console.log(`⚠️  Projet "${projetData.nom}" existe déjà - ignoré`)
          skippedCount++
          continue
        }

        // Créer le projet
        const projet = await prisma.projet.create({
          data: projetData
        })

        console.log(`✅ Projet créé: ${projet.nom}`)
        console.log(`   📍 Localisation: ${projet.localisation}`)
        console.log(`   📅 Période: ${projet.dateDebut.toLocaleDateString('fr-FR')} → ${projet.dateFin?.toLocaleDateString('fr-FR') || 'Non définie'}`)
        console.log(`   ℹ️  Description: ${projet.description.substring(0, 60)}${projet.description.length > 60 ? '...' : ''}`)
        console.log('')

        createdCount++
      } catch (error) {
        console.error(`❌ Erreur lors de la création du projet "${projetData.nom}":`, error)
        errorCount++
      }
    }

    console.log('\n' + '='.repeat(80))
    console.log('📊 RÉSUMÉ DE LA CRÉATION DES PROJETS :')
    console.log('='.repeat(80))
    console.log(`   ✅ Projets créés avec succès: ${createdCount}`)
    console.log(`   ⚠️  Projets déjà existants (ignorés): ${skippedCount}`)
    console.log(`   ❌ Erreurs rencontrées: ${errorCount}`)
    console.log(`   📦 Total de projets traités: ${projets.length}`)
    console.log('='.repeat(80))

    if (createdCount > 0) {
      console.log('\n✅ Les projets ont été créés avec succès dans la base de données !')
      console.log('💡 Vous pouvez maintenant les voir dans l\'interface admin.')
    } else if (skippedCount === projets.length) {
      console.log('\n✅ Tous les projets existent déjà dans la base de données.')
    } else {
      console.log('\n⚠️  Certains projets n\'ont pas pu être créés. Vérifiez les erreurs ci-dessus.')
    }

  } catch (error) {
    console.error('❌ Erreur fatale lors de la création des projets:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Exécuter le script
seedProjets()
  .then(() => {
    console.log('\n✅ Script terminé avec succès')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error)
    process.exit(1)
  })

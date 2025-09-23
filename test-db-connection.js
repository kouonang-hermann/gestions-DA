const { PrismaClient } = require('@prisma/client')

async function testDB() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔍 Test de connexion à la base de données...')
    
    // Test de base
    const userCount = await prisma.user.count()
    console.log(`✅ Utilisateurs trouvés: ${userCount}`)
    
    // Test des projets
    const projetCount = await prisma.projet.count()
    console.log(`✅ Projets trouvés: ${projetCount}`)
    
    // Test des relations UserProjet
    const userProjetCount = await prisma.userProjet.count()
    console.log(`✅ Relations UserProjet trouvées: ${userProjetCount}`)
    
    // Test de la requête problématique
    console.log('\n🔍 Test de la requête GET /api/projets...')
    const projets = await prisma.projet.findMany({
      include: {
        createur: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true
          }
        },
        utilisateurs: {
          include: {
            user: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                email: true,
                role: true
              }
            }
          }
        },
        _count: {
          select: {
            demandes: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`✅ Requête projets réussie: ${projets.length} projets`)
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDB()

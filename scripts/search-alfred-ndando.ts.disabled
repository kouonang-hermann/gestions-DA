import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔍 Recherche de l\'utilisateur Alfred Yves MBOMA NDANDO EBELLE...\n')

  // Recherche avec différentes combinaisons de noms
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { nom: { contains: 'NDANDO', mode: 'insensitive' } },
        { nom: { contains: 'MBOMA', mode: 'insensitive' } },
        { nom: { contains: 'EBELLE', mode: 'insensitive' } },
        { prenom: { contains: 'Alfred', mode: 'insensitive' } },
        { prenom: { contains: 'Yves', mode: 'insensitive' } },
        { prenom: { contains: 'NDANDO', mode: 'insensitive' } },
        { prenom: { contains: 'MBOMA', mode: 'insensitive' } },
      ]
    },
    select: {
      id: true,
      nom: true,
      prenom: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
    }
  })

  if (users.length === 0) {
    console.log('❌ Aucun utilisateur trouvé avec ces critères de recherche\n')
    console.log('🔍 Recherche de tous les utilisateurs contenant "Alfred" ou "Ndando"...\n')
    
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        phone: true,
        role: true,
      }
    })
    
    console.log(`📋 Total d'utilisateurs dans la base : ${allUsers.length}\n`)
    
    if (allUsers.length > 0) {
      console.log('Liste de tous les utilisateurs :')
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.prenom} ${user.nom}`)
        console.log(`   Téléphone: ${user.phone}`)
        console.log(`   Email: ${user.email}`)
        console.log(`   Rôle: ${user.role}`)
        console.log('')
      })
    }
  } else {
    console.log(`✅ ${users.length} utilisateur(s) trouvé(s) :\n`)
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.prenom} ${user.nom}`)
      console.log(`   📱 Téléphone: ${user.phone}`)
      console.log(`   📧 Email: ${user.email}`)
      console.log(`   👤 Rôle: ${user.role}`)
      console.log(`   🆔 ID: ${user.id}`)
      console.log(`   📅 Créé le: ${user.createdAt.toLocaleDateString('fr-FR')}`)
      console.log('')
    })
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Configuration optimisée pour Vercel Postgres + environnements serverless
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

// Gestion du lifecycle des connexions pour serverless
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Hook de nettoyage pour fermer les connexions proprement
if (typeof window === 'undefined') {
  // Côté serveur uniquement
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}

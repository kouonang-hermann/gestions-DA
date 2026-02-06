import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    // Test simple de connexion à la base de données
    const userCount = await prisma.user.count()
    
    // Vérifier si les utilisateurs de test existent
    const testUsers = await prisma.user.findMany({
      where: {
        email: {
          endsWith: '@test.com'
        }
      },
      select: {
        email: true,
        role: true
      }
    })

    return NextResponse.json({
      success: true,
      database_connected: true,
      total_users: userCount,
      test_users: testUsers,
      message: userCount === 0 ? 'Base de données vide - seed requis' : 'Base de données OK'
    })

  } catch (error) {
    return NextResponse.json({ 
      success: false,
      database_connected: false,
      error: 'Erreur de connexion à la base de données',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 })
  }
}

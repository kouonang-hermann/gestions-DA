import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withAuth } from '@/lib/middleware'

export const GET = withAuth(async (request: NextRequest, currentUser: any) => {
  try {
    
    // Construire le filtre selon le rôle de l'utilisateur
    let whereClause: any = {
      status: {
        in: ['cloturee']  // Commençons par seulement ce statut qui existe sûrement
      }
    }

    // Si ce n'est pas un superadmin ou admin, filtrer par technicienId
    if (currentUser.role !== 'superadmin' && !currentUser.isAdmin) {
      whereClause.technicienId = currentUser.id
    }
    
    // Récupérer toutes les demandes qui ont suivi le flow complet de validation
    const validatedRequests = await prisma.demande.findMany({
      where: whereClause,
      include: {
        technicien: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            role: true
          }
        },
        projet: {
          select: {
            id: true,
            nom: true,
            description: true
          }
        },
        items: {
          include: {
            article: {
              select: {
                id: true,
                nom: true,
                description: true,
                unite: true
              }
            }
          }
        },
        validationSignatures: {
          include: {
            user: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                role: true
              }
            }
          },
          orderBy: {
            date: 'asc'
          }
        },
        history: {
          include: {
            user: {
              select: {
                id: true,
                nom: true,
                prenom: true,
                role: true
              }
            }
          },
          orderBy: {
            timestamp: 'asc'
          }
        }
      },
      orderBy: {
        dateCreation: 'desc'
      }
    })

    // Transformer les données pour inclure les étapes de validation
    const requestsWithValidationSteps = validatedRequests.map((request: any) => {
      try {
        const validationSteps = request.validationSignatures.map((signature: any) => {
          return {
            role: signature.type,
            validator: `${signature.user.nom} ${signature.user.prenom}`,
            date: signature.date.toISOString(),
            status: 'validee'
          }
        })

        return {
          ...request,
          demandeur: request.technicien, // Corriger la relation
          validationSteps,
          statut: request.status // Mapper status vers statut pour compatibilité
        }
      } catch (mappingError) {
        console.error('Error mapping request:', request.id, mappingError)
        return {
          ...request,
          demandeur: request.technicien,
          validationSteps: [],
          statut: request.status
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: requestsWithValidationSteps
    })

  } catch (error: any) {
    console.error('=== DETAILED ERROR LOG ===')
    console.error('Error name:', error.name)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    
    if (error.name === 'JsonWebTokenError') {
      console.error('JWT malformed error:', error)
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erreur de token JWT' 
        },
        { status: 401 }
      )
    } else {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Erreur lors de la récupération de l\'historique des demandes validées',
          details: error.message
        },
        { status: 500 }
      )
    }
  }
})

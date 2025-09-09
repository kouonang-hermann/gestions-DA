import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { withAuth } from '@/lib/middleware'

const prisma = new PrismaClient()

async function GET(request: NextRequest, { user }: { user: any }) {
  try {
    // Récupérer toutes les demandes avec le statut "confirmee_demandeur" (flow complet)
    const validatedRequests = await (prisma.demande.findMany as any)({
      where: {
        status: 'confirmee_demandeur'
      },
      include: {
        user: {
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
        signatures: {
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
            createdAt: 'asc'
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
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transformer les données pour inclure les étapes de validation avec quantités
    const requestsWithValidationSteps = validatedRequests.map((request: any) => {
      const validationSteps = request.signatures.map((signature: any) => {
        // Récupérer les quantités validées depuis les données de signature
        let quantities: { [key: string]: number } = {}
        
        // Si les quantités sont stockées dans les données de signature
        if (signature.data && typeof signature.data === 'object') {
          const signatureData = signature.data as any
          if (signatureData.quantities) {
            quantities = signatureData.quantities
          }
        }
        
        // Sinon, utiliser les quantités actuelles des items
        if (Object.keys(quantities).length === 0) {
          request.items.forEach((item: any) => {
            quantities[item.id] = item.quantite
          })
        }

        return {
          role: signature.user.role,
          validator: `${signature.user.nom} ${signature.user.prenom}`,
          date: signature.createdAt.toISOString(),
          quantities,
          status: 'validee'
        }
      })

      return {
        ...request,
        demandeur: request.user, // Renommer user en demandeur pour la compatibilité
        validationSteps
      }
    })

    return NextResponse.json({
      success: true,
      data: requestsWithValidationSteps
    })

  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique des demandes validées:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors de la récupération de l\'historique des demandes validées' 
      },
      { status: 500 }
    )
  }
}

const AuthenticatedGET = withAuth(GET)
export { AuthenticatedGET as GET }

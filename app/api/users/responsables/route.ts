import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

/**
 * GET /api/users/responsables
 * Récupère la liste des utilisateurs pouvant être responsables hiérarchiques
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    
    if (!currentUser) {
      return NextResponse.json({ 
        success: false, 
        error: "Non autorisé" 
      }, { status: 401 })
    }

    // Récupérer les utilisateurs avec des rôles de responsables
    const responsables = await prisma.user.findMany({
      where: {
        role: {
          in: [
            "superadmin",
            "conducteur_travaux",
            "responsable_travaux",
            "charge_affaire",
            "responsable_appro",
            "responsable_logistique"
          ]
        }
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        phone: true,
        role: true,
        service: true
      },
      orderBy: [
        { nom: "asc" },
        { prenom: "asc" }
      ]
    })

    return NextResponse.json({ 
      success: true, 
      data: responsables 
    })

  } catch (error: any) {
    console.error("❌ [API USERS RESPONSABLES] Erreur GET:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

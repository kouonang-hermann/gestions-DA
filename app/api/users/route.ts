import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword, requireAuth, hasPermission } from "@/lib/auth"
import { withPermission } from "@/lib/middleware"
import { registerSchema } from "@/lib/validations"

/**
 * GET /api/users - Récupère les utilisateurs
 */
export const GET = async (request: NextRequest) => {
  try {
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: 401 })
    }

    const currentUser = authResult.user
    if (!hasPermission(currentUser, "read_users")) {
      return NextResponse.json({ success: false, error: "Accès non autorisé" }, { status: 403 })
    }
    const users = await prisma.user.findMany({
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        phone: true,
        role: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
        projets: {
          select: {
            projet: {
              select: {
                id: true,
                nom: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: users,
    })
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

/**
 * POST /api/users - Crée un nouvel utilisateur
 */
export const POST = async (request: NextRequest) => {
  try {
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: 401 })
    }

    const currentUser = authResult.user
    if (!hasPermission(currentUser, "create_user")) {
      return NextResponse.json({ success: false, error: "Accès non autorisé" }, { status: 403 })
    }
    const body = await request.json()
    
    // Validation des données
    const validatedData = registerSchema.parse(body)

    // Vérifier si l'email existe déjà (seulement si fourni et non vide)
    const emailToCheck = validatedData.email?.trim()
    if (emailToCheck && emailToCheck !== '') {
      const existingUser = await prisma.user.findUnique({
        where: { email: emailToCheck }
      })

      if (existingUser) {
        return NextResponse.json({ success: false, error: "Cet email est déjà utilisé" }, { status: 400 })
      }
    }

    // Vérifier si le téléphone existe déjà (obligatoire)
    const existingPhone = await prisma.user.findFirst({ where: { phone: validatedData.phone } })
    if (existingPhone) {
      return NextResponse.json({ success: false, error: "Ce numéro de téléphone est déjà utilisé" }, { status: 400 })
    }

    // Hash du mot de passe
    const hashedPassword = await hashPassword(validatedData.password)

    // Créer l'utilisateur
    const newUser = await prisma.user.create({
      data: {
        nom: validatedData.nom,
        prenom: validatedData.prenom,
        email: emailToCheck && emailToCheck !== '' ? emailToCheck : undefined,
        phone: validatedData.phone,
        password: hashedPassword,
        role: validatedData.role as any,
        isAdmin: validatedData.isAdmin || validatedData.role === "superadmin" || false,
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        phone: true,
        role: true,
        isAdmin: true,
        createdAt: true,
      }
    })

    // Assigner aux projets si spécifiés
    if (validatedData.projets && validatedData.projets.length > 0) {
      await prisma.userProjet.createMany({
        data: validatedData.projets.map((projetId: string) => ({
          userId: newUser.id,
          projetId,
        })),
        skipDuplicates: true,
      })
    }

    return NextResponse.json(
      {
        success: true,
        data: newUser,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ success: false, error: "Données invalides", details: error }, { status: 400 })
    }
    
    console.error("Erreur lors de la création de l'utilisateur:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

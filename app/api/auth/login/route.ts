import { type NextRequest, NextResponse } from "next/server"
import { authenticateUser } from "@/lib/auth"
import { generateToken } from "@/lib/jwt"

/**
 * POST /api/auth/login - Authentification utilisateur
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const identifier = body.identifier || body.email // compat: accepter encore `email`
    const password = body.password

    if (!identifier || !password) {
      return NextResponse.json({ success: false, error: "Identifiant et mot de passe requis" }, { status: 400 })
    }

    const user = await authenticateUser(identifier, password)

    if (!user) {
      return NextResponse.json({ success: false, error: "Identifiants invalides" }, { status: 401 })
    }

    // Générer un token JWT sécurisé
    const token = generateToken(user)

    // Retourner l'utilisateur sans le mot de passe
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({
      success: true,
      data: {
        user: userWithoutPassword,
        token,
      },
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

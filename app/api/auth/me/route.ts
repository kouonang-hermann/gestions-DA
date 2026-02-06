import { type NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"

/**
 * GET /api/auth/me - Récupère les informations de l'utilisateur connecté
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (!authResult.success) {
      return NextResponse.json({ success: false, error: authResult.error }, { status: 401 })
    }

    const user = authResult.user

    return NextResponse.json({
      success: true,
      data: user,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "./auth"

/**
 * Middleware d'authentification pour les API routes
 */
export function withAuth(
  handler: (request: NextRequest, user: any, context?: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context?: any) => {
    try {
      console.log(`🔐 [MIDDLEWARE] Vérification authentification pour ${request.method} ${request.url}`)
      
      const authHeader = request.headers.get("authorization")
      console.log(`🔐 [MIDDLEWARE] Header Authorization: ${authHeader ? 'présent' : 'absent'}`)
      
      const user = await getCurrentUser(request)
      console.log(`🔐 [MIDDLEWARE] Utilisateur récupéré: ${user ? `${user.nom} (${user.role})` : 'null'}`)
      
      if (!user) {
        console.log(`❌ [MIDDLEWARE] Authentification échouée`)
        return NextResponse.json(
          { success: false, error: "Non authentifié" },
          { status: 401 }
        )
      }

      console.log(`✅ [MIDDLEWARE] Authentification réussie, appel du handler`)
      return await handler(request, user, context)
    } catch (error) {
      console.error("❌ [MIDDLEWARE] Erreur middleware auth:", error)
      return NextResponse.json(
        { success: false, error: "Erreur d'authentification" },
        { status: 500 }
      )
    }
  }
}

/**
 * Middleware pour vérifier les permissions
 */
export function withPermission(
  requiredRoles: string[],
  handler: (request: NextRequest, user: any) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      const user = await getCurrentUser(request)
      
      if (!user) {
        return NextResponse.json(
          { success: false, error: "Non authentifié" },
          { status: 401 }
        )
      }

      if (!requiredRoles.includes(user.role)) {
        return NextResponse.json(
          { success: false, error: "Permissions insuffisantes" },
          { status: 403 }
        )
      }

      return await handler(request, user)
    } catch (error) {
      console.error("Erreur middleware permission:", error)
      return NextResponse.json(
        { success: false, error: "Erreur d'authentification" },
        { status: 500 }
      )
    }
  }
}

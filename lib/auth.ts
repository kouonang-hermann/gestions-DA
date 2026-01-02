import type { NextRequest } from "next/server"
import type { User } from "@prisma/client"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"
import { verifyToken, extractTokenFromHeader, type JWTPayload } from "./jwt"

/**
 * Authentifie un utilisateur avec numéro de téléphone et mot de passe
 */
export async function authenticateUser(identifier: string, password: string): Promise<any | null> {
  try {
    // Recherche uniquement par numéro de téléphone
    const user = await prisma.user.findFirst({
      where: {
        phone: identifier,
      },
      include: {
        projets: {
          select: {
            projetId: true
          }
        }
      }
    })

    if (!user) return null

    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) return null

    // Transformer les projets en tableau d'IDs
    const userWithProjets = {
      ...user,
      projets: user.projets.map((p: { projetId: string }) => p.projetId)
    }

    return userWithProjets
  } catch (error) {
    console.error("Erreur lors de l'authentification:", error)
    return null
  }
}

/**
 * Récupère un utilisateur par son ID
 */
export async function getUserById(id: string): Promise<any | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        projets: {
          select: {
            projetId: true
          }
        }
      }
    })

    if (!user) return null

    // Transformer les projets en tableau d'IDs
    const userWithProjets = {
      ...user,
      projets: user.projets.map(p => p.projetId)
    }

    return userWithProjets
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error)
    return null
  }
}

/**
 * Récupère tous les utilisateurs
 */
export async function getAllUsers(): Promise<User[]> {
  try {
    return await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    })
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error)
    return []
  }
}

/**
 * Extrait l'utilisateur depuis le token JWT dans les headers
 */
export async function getCurrentUser(request: NextRequest): Promise<User | null> {
  try {
    const authHeader = request.headers.get("authorization")
    const token = extractTokenFromHeader(authHeader)
    
    if (!token) return null

    const payload = verifyToken(token)
    if (!payload) return null

    return await getUserById(payload.userId)
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur courant:", error)
    return null
  }
}

/**
 * Hash un mot de passe
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12)
}

/**
 * Middleware d'authentification pour les routes API
 */
export async function requireAuth(request: NextRequest): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const authHeader = request.headers.get("authorization")
    const token = extractTokenFromHeader(authHeader)
    
    if (!token) {
      return { success: false, error: "Token manquant" }
    }

    const payload = verifyToken(token)
    if (!payload) {
      return { success: false, error: "Token invalide" }
    }

    const user = await getUserById(payload.userId)
    if (!user) {
      return { success: false, error: "Utilisateur non trouvé" }
    }

    return { success: true, user }
  } catch (error) {
    console.error("Erreur d'authentification:", error)
    return { success: false, error: "Erreur d'authentification" }
  }
}

/**
 * Vérifie si l'utilisateur a les permissions pour une action
 */
export function hasPermission(user: any, action: string): boolean {
  if (!user) return false

  switch (action) {
    case "create_project":
      return user.role === "superadmin" || user.isAdmin

    case "create_user":
      return user.role === "superadmin" || user.isAdmin

    case "read_users":
      // Permettre la lecture des utilisateurs pour les rôles qui en ont besoin pour le filtrage
      return ["superadmin", "responsable_travaux", "charge_affaire", "responsable_livreur", "responsable_appro", "responsable_logistique", "conducteur_travaux"].includes(user.role) || user.isAdmin

    case "assign_admin":
      return user.role === "superadmin"

    case "create_demande":
      return ["superadmin", "employe", "conducteur_travaux", "responsable_travaux", "responsable_logistique", "responsable_appro", "charge_affaire", "responsable_livreur"].includes(user.role)

    case "validate_materiel":
      return user.role === "conducteur_travaux" || user.role === "superadmin"

    case "validate_outillage":
      return user.role === "responsable_logistique" || user.role === "superadmin"

    case "manage_sortie":
      return user.role === "responsable_appro" || user.role === "superadmin"

    case "validate_preparation":
      return user.role === "charge_affaire" || user.role === "superadmin"

    case "final_validation":
      return user.role === "employe" || user.role === "superadmin"

    default:
      return false
  }
}

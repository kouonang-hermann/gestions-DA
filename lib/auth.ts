import type { NextRequest } from "next/server"
import type { User } from "@prisma/client"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"
import { verifyToken, extractTokenFromHeader, type JWTPayload } from "./jwt"

// ============================================================================
// MODE DÉVELOPPEMENT - Utilisateurs de test quand la DB n'est pas accessible
// ============================================================================
const TEST_USERS = [
  {
    id: "test-superadmin-1",
    nom: "Admin",
    prenom: "Super",
    email: "admin@test.com",
    phone: "0600000000",
    password: "admin123", // Mot de passe en clair pour le mode test
    role: "superadmin" as const,
    isAdmin: true,
    projets: ["projet-test-1", "projet-test-2"],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "test-employe-1",
    nom: "Dupont",
    prenom: "Jean",
    email: "jean.dupont@test.com",
    phone: "0611111111",
    password: "employe123",
    role: "employe" as const,
    isAdmin: false,
    projets: ["projet-test-1"],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "test-conducteur-1",
    nom: "Martin",
    prenom: "Pierre",
    email: "pierre.martin@test.com",
    phone: "0622222222",
    password: "conducteur123",
    role: "conducteur_travaux" as const,
    isAdmin: false,
    projets: ["projet-test-1", "projet-test-2"],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "test-responsable-travaux-1",
    nom: "Bernard",
    prenom: "Michel",
    email: "michel.bernard@test.com",
    phone: "0633333333",
    password: "responsable123",
    role: "responsable_travaux" as const,
    isAdmin: false,
    projets: ["projet-test-1", "projet-test-2"],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "test-charge-affaire-1",
    nom: "Petit",
    prenom: "Sophie",
    email: "sophie.petit@test.com",
    phone: "0644444444",
    password: "charge123",
    role: "charge_affaire" as const,
    isAdmin: false,
    projets: ["projet-test-1"],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "test-appro-1",
    nom: "Leroy",
    prenom: "Antoine",
    email: "antoine.leroy@test.com",
    phone: "0655555555",
    password: "appro123",
    role: "responsable_appro" as const,
    isAdmin: false,
    projets: ["projet-test-1", "projet-test-2"],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "test-logistique-1",
    nom: "Moreau",
    prenom: "Claire",
    email: "claire.moreau@test.com",
    phone: "0666666666",
    password: "logistique123",
    role: "responsable_logistique" as const,
    isAdmin: false,
    projets: ["projet-test-1"],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

// Variable pour tracker si on est en mode fallback
let isDbOffline = false

/**
 * Authentifie un utilisateur avec numéro de téléphone et mot de passe
 * Avec fallback vers les utilisateurs de test si la DB n'est pas accessible
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

    isDbOffline = false // DB accessible
    return userWithProjets
  } catch (error) {
    
    // FALLBACK MODE: Si la DB n'est pas accessible, utiliser les utilisateurs de test
    isDbOffline = true
    
    const testUser = TEST_USERS.find(u => u.phone === identifier)
    if (!testUser) {
      return null
    }
    
    // En mode test, vérification simple du mot de passe
    if (testUser.password !== password) {
      return null
    }
    
    return testUser
  }
}

/**
 * Récupère un utilisateur par son ID
 * Avec fallback vers les utilisateurs de test si la DB n'est pas accessible
 */
export async function getUserById(id: string): Promise<any | null> {
  // Si on est en mode offline, utiliser les utilisateurs de test
  if (isDbOffline) {
    const testUser = TEST_USERS.find(u => u.id === id)
    return testUser || null
  }
  
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
    
    // Fallback vers les utilisateurs de test
    isDbOffline = true
    const testUser = TEST_USERS.find(u => u.id === id)
    return testUser || null
  }
}

/**
 * Récupère tous les utilisateurs
 * Avec fallback vers les utilisateurs de test si la DB n'est pas accessible
 */
export async function getAllUsers(): Promise<any[]> {
  // Si on est en mode offline, utiliser les utilisateurs de test
  if (isDbOffline) {
    return TEST_USERS
  }
  
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' }
    })
    return users
  } catch (error) {
    // Fallback vers les utilisateurs de test
    isDbOffline = true
    return TEST_USERS
  }
}

/**
 * Exporte la variable isDbOffline pour les autres modules
 */
export function isDatabaseOffline(): boolean {
  return isDbOffline
}

/**
 * Exporte les utilisateurs de test pour les autres modules
 */
export function getTestUsers() {
  return TEST_USERS
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

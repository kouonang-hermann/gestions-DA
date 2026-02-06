import type { NextRequest } from "next/server"
import type { User } from "@/types"
import { verifyToken, extractTokenFromHeader } from "./jwt"

// Données utilisateurs locales (simulation de base de données)
// NOTE: L'authentification se fait par numéro de téléphone (format: 6XXXXXXXX)
const localUsers: User[] = [
  {
    id: "user-1",
    nom: "Admin",
    prenom: "Super",
    email: "admin@instrumelec.com",
    phone: "600000001",
    role: "superadmin",
    isAdmin: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    projets: ["projet-1", "projet-2", "projet-3"]
  },
  {
    id: "user-2", 
    nom: "Dupont",
    prenom: "Jean",
    email: "jean.dupont@instrumelec.com",
    phone: "600000002",
    role: "employe",
    isAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    projets: ["projet-1", "projet-2"]
  },
  {
    id: "user-3",
    nom: "Martin",
    prenom: "Pierre",
    email: "pierre.martin@instrumelec.com",
    phone: "600000003",
    role: "conducteur_travaux",
    isAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    projets: ["projet-1", "projet-3"]
  },
  {
    id: "user-4",
    nom: "Bernard",
    prenom: "Marie",
    email: "marie.bernard@instrumelec.com",
    phone: "600000004",
    role: "responsable_logistique",
    isAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    projets: ["projet-2", "projet-3"]
  },
  {
    id: "user-5",
    nom: "Durand",
    prenom: "Paul",
    email: "paul.durand@instrumelec.com",
    phone: "600000005",
    role: "responsable_travaux",
    isAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    projets: ["projet-1"]
  }
]

/**
 * Authentifie un utilisateur avec numéro de téléphone et mot de passe (mode local)
 */
export async function authenticateUserLocal(phone: string, password: string): Promise<User | null> {
  try {
    
    // En mode local, on accepte n'importe quel mot de passe pour simplifier
    // Recherche par numéro de téléphone uniquement
    const user = localUsers.find(u => u.phone === phone)
    
    if (!user) {
      return null
    }

    return user
  } catch (error) {
    return null
  }
}

/**
 * Récupère un utilisateur par son ID (mode local)
 */
export async function getUserByIdLocal(id: string): Promise<User | null> {
  try {
    const user = localUsers.find(u => u.id === id)
    
    if (!user) {
      return null
    }

    return user
  } catch (error) {
    return null
  }
}

/**
 * Récupère tous les utilisateurs (mode local)
 */
export async function getAllUsersLocal(): Promise<User[]> {
  try {
    return [...localUsers]
  } catch (error) {
    return []
  }
}

/**
 * Extrait l'utilisateur depuis le token JWT dans les headers (mode local)
 */
export async function getCurrentUserLocal(request: NextRequest): Promise<User | null> {
  try {
    const authHeader = request.headers.get("authorization")
    const token = extractTokenFromHeader(authHeader)
    
    if (!token) {
      return null
    }

    const payload = verifyToken(token)
    if (!payload) {
      return null
    }

    const user = await getUserByIdLocal(payload.userId)
    if (user) {
    }
    
    return user
  } catch (error) {
    return null
  }
}

/**
 * Middleware d'authentification pour les routes API (mode local)
 */
export async function requireAuthLocal(request: NextRequest): Promise<{ success: boolean; user?: User; error?: string }> {
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

    const user = await getUserByIdLocal(payload.userId)
    if (!user) {
      return { success: false, error: "Utilisateur non trouvé" }
    }

    return { success: true, user }
  } catch (error) {
    return { success: false, error: "Erreur d'authentification" }
  }
}

/**
 * Vérifie si l'utilisateur a les permissions pour une action (mode local)
 */
export function hasPermissionLocal(user: User, action: string): boolean {
  if (!user) return false

  switch (action) {
    case "create_project":
      return user.role === "superadmin" || user.isAdmin

    case "create_user":
      return user.role === "superadmin" || user.isAdmin

    case "assign_admin":
      return user.role === "superadmin"

    case "create_demande":
      return ["superadmin", "employe", "conducteur_travaux", "responsable_travaux", "responsable_appro", "charge_affaire", "responsable_logistique"].includes(user.role)

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

    case "cloturer":
      return true // Tous les utilisateurs peuvent clôturer leurs propres demandes

    default:
      return false
  }
}

/**
 * Ajoute un utilisateur (mode local)
 */
export async function addUserLocal(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
  const newUser: User = {
    ...userData,
    id: `user-${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  localUsers.push(newUser)
  
  return newUser
}

/**
 * Met à jour un utilisateur (mode local)
 */
export async function updateUserLocal(userId: string, updates: Partial<User>): Promise<User | null> {
  const userIndex = localUsers.findIndex(u => u.id === userId)
  
  if (userIndex === -1) {
    return null
  }
  
  localUsers[userIndex] = {
    ...localUsers[userIndex],
    ...updates,
    updatedAt: new Date()
  }
  
  return localUsers[userIndex]
}

/**
 * Exporte les utilisateurs locaux pour utilisation externe
 */
export function getLocalUsers(): User[] {
  return [...localUsers]
}

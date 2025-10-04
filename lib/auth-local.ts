import type { NextRequest } from "next/server"
import type { User } from "@/types"
import { verifyToken, extractTokenFromHeader } from "./jwt"

// Données utilisateurs locales (simulation de base de données)
const localUsers: User[] = [
  {
    id: "user-1",
    nom: "Admin",
    prenom: "Super",
    email: "admin@instrumelec.com",
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
    role: "responsable_qhse",
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
    role: "responsable_travaux",
    isAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    projets: ["projet-1"]
  }
]

/**
 * Authentifie un utilisateur avec email/password (mode local)
 */
export async function authenticateUserLocal(email: string, password: string): Promise<User | null> {
  try {
    console.log(`[LOCAL AUTH] Tentative de connexion pour: ${email}`)
    
    // En mode local, on accepte n'importe quel mot de passe pour simplifier
    const user = localUsers.find(u => u.email === email)
    
    if (!user) {
      console.log(`[LOCAL AUTH] Utilisateur non trouvé: ${email}`)
      return null
    }

    console.log(`[LOCAL AUTH] Connexion réussie pour: ${user.nom} ${user.prenom} (${user.role})`)
    return user
  } catch (error) {
    console.error("[LOCAL AUTH] Erreur lors de l'authentification:", error)
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
      console.log(`[LOCAL AUTH] Utilisateur non trouvé avec ID: ${id}`)
      return null
    }

    return user
  } catch (error) {
    console.error("[LOCAL AUTH] Erreur lors de la récupération de l'utilisateur:", error)
    return null
  }
}

/**
 * Récupère tous les utilisateurs (mode local)
 */
export async function getAllUsersLocal(): Promise<User[]> {
  try {
    console.log(`[LOCAL AUTH] Récupération de ${localUsers.length} utilisateurs`)
    return [...localUsers]
  } catch (error) {
    console.error("[LOCAL AUTH] Erreur lors de la récupération des utilisateurs:", error)
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
      console.log("[LOCAL AUTH] Aucun token fourni")
      return null
    }

    const payload = verifyToken(token)
    if (!payload) {
      console.log("[LOCAL AUTH] Token invalide")
      return null
    }

    const user = await getUserByIdLocal(payload.userId)
    if (user) {
      console.log(`[LOCAL AUTH] Utilisateur récupéré: ${user.nom} ${user.prenom}`)
    }
    
    return user
  } catch (error) {
    console.error("[LOCAL AUTH] Erreur lors de la récupération de l'utilisateur courant:", error)
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
      console.log("[LOCAL AUTH] Token manquant")
      return { success: false, error: "Token manquant" }
    }

    const payload = verifyToken(token)
    if (!payload) {
      console.log("[LOCAL AUTH] Token invalide")
      return { success: false, error: "Token invalide" }
    }

    const user = await getUserByIdLocal(payload.userId)
    if (!user) {
      console.log(`[LOCAL AUTH] Utilisateur non trouvé avec ID: ${payload.userId}`)
      return { success: false, error: "Utilisateur non trouvé" }
    }

    console.log(`[LOCAL AUTH] Authentification réussie pour: ${user.nom} ${user.prenom}`)
    return { success: true, user }
  } catch (error) {
    console.error("[LOCAL AUTH] Erreur d'authentification:", error)
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
      return ["superadmin", "employe", "conducteur_travaux", "responsable_travaux", "responsable_qhse", "responsable_appro", "charge_affaire", "responsable_logistique"].includes(user.role)

    case "validate_materiel":
      return user.role === "conducteur_travaux" || user.role === "superadmin"

    case "validate_outillage":
      return user.role === "responsable_qhse" || user.role === "superadmin"

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
  console.log(`[LOCAL AUTH] Utilisateur ajouté: ${newUser.nom} ${newUser.prenom}`)
  
  return newUser
}

/**
 * Met à jour un utilisateur (mode local)
 */
export async function updateUserLocal(userId: string, updates: Partial<User>): Promise<User | null> {
  const userIndex = localUsers.findIndex(u => u.id === userId)
  
  if (userIndex === -1) {
    console.log(`[LOCAL AUTH] Utilisateur non trouvé pour mise à jour: ${userId}`)
    return null
  }
  
  localUsers[userIndex] = {
    ...localUsers[userIndex],
    ...updates,
    updatedAt: new Date()
  }
  
  console.log(`[LOCAL AUTH] Utilisateur mis à jour: ${localUsers[userIndex].nom} ${localUsers[userIndex].prenom}`)
  return localUsers[userIndex]
}

/**
 * Exporte les utilisateurs locaux pour utilisation externe
 */
export function getLocalUsers(): User[] {
  return [...localUsers]
}

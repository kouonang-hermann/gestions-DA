import jwt from 'jsonwebtoken'
import type { User } from '@prisma/client'

const JWT_SECRET: string = process.env.JWT_SECRET || 'fallback-secret-key'
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d'

export interface JWTPayload {
  userId: string
  phone: string
  email?: string | null
  role: string
}

/**
 * Génère un token JWT pour un utilisateur
 */
export function generateToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    phone: user.phone,
    email: user.email,
    role: user.role,
  }

  return jwt.sign(payload, JWT_SECRET)
}

/**
 * Vérifie et décode un token JWT
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch (error) {
    return null
  }
}

/**
 * Extrait le token depuis les headers Authorization
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}

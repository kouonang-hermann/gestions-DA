import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import type { HistoryEntry } from "@/types"
import crypto from "crypto"

/**
 * GET /api/historique - Récupère l'historique filtrable
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const projetId = searchParams.get("projetId")
    const dateDebut = searchParams.get("dateDebut")
    const dateFin = searchParams.get("dateFin")
    const userId = searchParams.get("userId")
    const action = searchParams.get("action")

    let whereClause: any = {}

    // Filtrer selon les projets accessibles à l'utilisateur
    if (currentUser.role !== "superadmin") {
      // Récupérer les projets où l'utilisateur est assigné
      const userProjets = await prisma.userProjet.findMany({
        where: { userId: currentUser.id },
        select: { projetId: true }
      })
      const projetIds = userProjets.map(up => up.projetId)
      
      if (projetIds.length > 0) {
        whereClause.demande = {
          projetId: { in: projetIds }
        }
      } else {
        // Si l'utilisateur n'est assigné à aucun projet, ne voir que ses propres actions
        whereClause.userId = currentUser.id
      }
    }

    // Filtres additionnels
    if (projetId) {
      whereClause.demande = {
        ...whereClause.demande,
        projetId: projetId
      }
    }

    if (dateDebut) {
      whereClause.timestamp = {
        ...whereClause.timestamp,
        gte: new Date(dateDebut)
      }
    }

    if (dateFin) {
      const fin = new Date(dateFin)
      fin.setHours(23, 59, 59, 999)
      whereClause.timestamp = {
        ...whereClause.timestamp,
        lte: fin
      }
    }

    if (userId) {
      whereClause.userId = userId
    }

    if (action) {
      whereClause.action = {
        contains: action,
        mode: 'insensitive'
      }
    }

    const historyEntries = await prisma.historyEntry.findMany({
      where: whereClause,
      include: {
        user: {
          select: { id: true, nom: true, prenom: true, role: true }
        },
        demande: {
          select: { 
            id: true, 
            numero: true, 
            type: true,
            projet: {
              select: { id: true, nom: true }
            }
          }
        }
      },
      orderBy: { timestamp: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: historyEntries,
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

/**
 * POST /api/historique - Ajoute une entrée à l'historique
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    }

    const { demandeId, action, ancienStatus, nouveauStatus, commentaire } = await request.json()

    if (!demandeId || !action) {
      return NextResponse.json({ success: false, error: "Données manquantes" }, { status: 400 })
    }

    const historyEntry = await prisma.historyEntry.create({
      data: {
        id: crypto.randomUUID(),
        demandeId,
        userId: currentUser.id,
        action,
        ancienStatus: ancienStatus || null,
        nouveauStatus: nouveauStatus || null,
        commentaire: commentaire || null,
        signature: `${currentUser.id}-${Date.now()}-${action}`,
      },
      include: {
        user: {
          select: { id: true, nom: true, prenom: true, role: true }
        },
        demande: {
          select: { 
            id: true, 
            numero: true, 
            type: true,
            projet: {
              select: { id: true, nom: true }
            }
          }
        }
      }
    })

    return NextResponse.json(
      {
        success: true,
        data: historyEntry,
      },
      { status: 201 },
    )
  } catch (error) {
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

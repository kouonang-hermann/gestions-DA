import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import jwt from "jsonwebtoken"

const prisma = new PrismaClient()
const JWT_SECRET = process.env.JWT_SECRET || "votre-secret-jwt-super-securise"

// Fonction pour vérifier l'authentification
async function requireAuth(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.substring(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string }
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        role: true
      }
    })
    return user
  } catch (error) {
    return null
  }
}

// Générer un numéro de demande unique
async function generateNumero(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `ABS-${year}-`
  
  const lastDemande = await prisma.demandeConge.findFirst({
    where: {
      numero: {
        startsWith: prefix
      }
    },
    orderBy: {
      dateCreation: "desc"
    }
  })

  let nextNumber = 1
  if (lastDemande) {
    const lastNumber = parseInt(lastDemande.numero.split("-")[2])
    nextNumber = lastNumber + 1
  }

  return `${prefix}${nextNumber.toString().padStart(4, "0")}`
}

// GET - Récupérer les demandes d'absence
export async function GET(request: NextRequest) {
  try {
    const currentUser = await requireAuth(request)
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      )
    }

    // Récupérer les demandes de l'utilisateur connecté
    const demandes = await prisma.demandeConge.findMany({
      where: {
        employeId: currentUser.id
      },
      include: {
        superieurHierarchique: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true
          }
        }
      },
      orderBy: {
        dateCreation: "desc"
      }
    })

    return NextResponse.json({
      success: true,
      data: demandes
    })
  } catch (error) {
    console.error("Erreur GET /api/absences:", error)
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

// POST - Créer une nouvelle demande d'absence
export async function POST(request: NextRequest) {
  try {
    const currentUser = await requireAuth(request)
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      typeAbsence,
      motif,
      dateDebut,
      dateFin,
      nombreJours,
      superieurHierarchiqueId,
      commentaireEmploye
    } = body

    // Validation des données
    if (!typeAbsence || !motif || !dateDebut || !dateFin || !nombreJours || !superieurHierarchiqueId) {
      return NextResponse.json(
        { success: false, error: "Données manquantes" },
        { status: 400 }
      )
    }

    // Vérifier que le supérieur existe
    const superieur = await prisma.user.findUnique({
      where: { id: superieurHierarchiqueId }
    })

    if (!superieur) {
      return NextResponse.json(
        { success: false, error: "Supérieur hiérarchique non trouvé" },
        { status: 404 }
      )
    }

    // Générer le numéro de demande
    const numero = await generateNumero()

    // Créer la demande
    const demande = await prisma.demandeConge.create({
      data: {
        numero,
        employeId: currentUser.id,
        superieurHierarchiqueId,
        typeAbsence,
        motif,
        dateDebut: new Date(dateDebut),
        dateFin: new Date(dateFin),
        nombreJours,
        status: "soumise",
        commentaireEmploye,
        dateSoumission: new Date()
      },
      include: {
        superieurHierarchique: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: demande
    })
  } catch (error) {
    console.error("Erreur POST /api/absences:", error)
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

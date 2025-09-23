import { type NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createArticleSchema } from "@/lib/validations"

/**
 * GET /api/articles - Récupère les articles
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const search = searchParams.get("search")

    let whereClause: any = {}

    // Filtrer par type si spécifié
    if (type) {
      whereClause.type = type
    }

    // Filtrer par recherche si spécifiée
    if (search) {
      whereClause.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } }
      ]
    }

    const articles = await prisma.article.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: articles,
    })
  } catch (error) {
    console.error("Erreur lors de la récupération des articles:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

/**
 * POST /api/articles - Crée un nouvel article
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser || currentUser.role !== "superadmin") {
      return NextResponse.json({ success: false, error: "Accès non autorisé" }, { status: 403 })
    }

    const body = await request.json()
    
    // Validation des données
    const validatedData = createArticleSchema.parse(body)

    // Vérifier si la référence existe déjà
    const existingArticle = await prisma.article.findUnique({
      where: { reference: validatedData.reference }
    })

    if (existingArticle) {
      return NextResponse.json({ success: false, error: "Cette référence existe déjà" }, { status: 400 })
    }

    const newArticle = await prisma.article.create({
      data: {
        nom: validatedData.nom,
        description: validatedData.description,
        reference: validatedData.reference,
        type: validatedData.type,
        unite: validatedData.unite,
        stock: validatedData.stock || null,
        prixUnitaire: validatedData.prixUnitaire || null,
      }
    })

    return NextResponse.json(
      {
        success: true,
        data: newArticle,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ success: false, error: "Données invalides", details: error }, { status: 400 })
    }
    
    console.error("Erreur lors de la création de l'article:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

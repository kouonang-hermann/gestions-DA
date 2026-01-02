import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { requireAuth } from "@/lib/auth"

const prisma = new PrismaClient()

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: "Non authentifié" },
        { status: 401 }
      )
    }
    
    const currentUser = authResult.user
    
    // Vérifier que l'utilisateur a les permissions (conducteur, responsable travaux, chargé affaires)
    const allowedRoles = ["conducteur_travaux", "responsable_travaux", "charge_affaire"]
    if (!allowedRoles.includes(currentUser.role)) {
      return NextResponse.json(
        { success: false, error: "Non autorisé" },
        { status: 403 }
      )
    }

    const { nom, reference } = await request.json()
    const params = await context.params
    const articleId = params.id

    // Vérifier que l'article existe
    const article = await prisma.article.findUnique({
      where: { id: articleId }
    })

    if (!article) {
      return NextResponse.json(
        { success: false, error: "Article non trouvé" },
        { status: 404 }
      )
    }

    // Mettre à jour l'article dans le catalogue
    const updatedArticle = await prisma.article.update({
      where: { id: articleId },
      data: {
        nom: nom || article.nom,
        reference: reference || article.reference
      }
    })

    console.log(`✅ [UPDATE-ARTICLE] Article ${updatedArticle.reference} mis à jour par ${currentUser.nom}`)

    return NextResponse.json({
      success: true,
      message: "Article mis à jour avec succès",
      article: updatedArticle
    })
  } catch (error) {
    console.error("❌ [UPDATE-ARTICLE] Erreur:", error)
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    )
  }
}

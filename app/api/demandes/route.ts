import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, hasPermission } from "@/lib/auth"
import { createDemandeSchema } from "@/lib/validations"

/**
 * Détermine le statut initial d'une demande selon son type
 */
function getInitialStatus(type: "materiel" | "outillage"): string {
  if (type === "materiel") {
    return "en_attente_validation_conducteur"
  } else {
    return "en_attente_validation_qhse"
  }
}

/**
 * Détermine le prochain statut selon le statut actuel et le rôle
 */
function getNextStatus(currentStatus: string, userRole: string): string | null {
  const transitions: Record<string, Record<string, string>> = {
    "en_attente_validation_conducteur": {
      "conducteur_travaux": "en_attente_validation_responsable_travaux"
    },
    "en_attente_validation_responsable_travaux": {
      "responsable_travaux": "en_attente_validation_charge_affaire"
    },
    "en_attente_validation_qhse": {
      "responsable_qhse": "en_attente_validation_responsable_travaux"
    },
    "en_attente_validation_charge_affaire": {
      "charge_affaire": "en_attente_preparation_appro"
    },
    "en_attente_preparation_appro": {
      "responsable_appro": "en_attente_validation_logistique"
    },
    "en_attente_validation_logistique": {
      "responsable_logistique": "en_attente_validation_finale_demandeur"
    },
    "en_attente_validation_finale_demandeur": {
      "employe": "confirmee_demandeur"
    }
  }

  return transitions[currentStatus]?.[userRole] || null
}

/**
 * GET /api/demandes - Récupère les demandes selon le rôle
 */
export const GET = async (request: NextRequest) => {
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: authResult.error }, { status: 401 })
  }

  const currentUser = authResult.user
  try {
    const { searchParams } = new URL(request.url)
    const projetId = searchParams.get("projetId")
    const status = searchParams.get("status")
    const type = searchParams.get("type")

    // Construire la requête selon le rôle
    let whereClause: any = {}

    switch (currentUser.role) {
      case "superadmin":
        // Voit toutes les demandes
        break

      case "employe":
        // Voit ses propres demandes + celles des projets où il est assigné
        const userProjets = await prisma.userProjet.findMany({
          where: { userId: currentUser.id },
          select: { projetId: true }
        })
        const projetIds = userProjets.map((up: any) => up.projetId)
        
        whereClause = {
          OR: [
            { technicienId: currentUser.id },
            { projetId: { in: projetIds } }
          ]
        }
        break

      case "conducteur_travaux":
        // Voit les demandes de matériel des projets où il est assigné
        const conducteurProjets = await prisma.userProjet.findMany({
          where: { userId: currentUser.id },
          select: { projetId: true }
        })
        whereClause = {
          type: "materiel",
          projetId: { in: conducteurProjets.map((up: any) => up.projetId) }
        }
        break

      case "responsable_qhse":
        // Voit les demandes d'outillage des projets où il est assigné
        const qhseProjets = await prisma.userProjet.findMany({
          where: { userId: currentUser.id },
          select: { projetId: true }
        })
        whereClause = {
          type: "outillage",
          projetId: { in: qhseProjets.map((up: any) => up.projetId) }
        }
        break

      case "responsable_travaux":
        // Voit les demandes de matériel des projets où il est assigné
        const responsableProjets = await prisma.userProjet.findMany({
          where: { userId: currentUser.id },
          select: { projetId: true }
        })
        whereClause = {
          type: "materiel",
          projetId: { in: responsableProjets.map((up: any) => up.projetId) }
        }
        break

      case "responsable_appro":
      case "charge_affaire":
      case "responsable_logistique":
        // Voient les demandes des projets où ils sont assignés
        const approProjets = await prisma.userProjet.findMany({
          where: { userId: currentUser.id },
          select: { projetId: true }
        })
        whereClause = {
          projetId: { in: approProjets.map((up: any) => up.projetId) }
        }
        break

      default:
        whereClause = { id: "impossible" } // Aucune demande
    }

    // Filtres additionnels
    if (projetId) {
      whereClause.projetId = projetId
    }

    if (status) {
      whereClause.status = status
    }

    if (type) {
      whereClause.type = type
    }

    const demandes = await prisma.demande.findMany({
      where: whereClause,
      include: {
        projet: {
          select: { id: true, nom: true }
        },
        technicien: {
          select: { id: true, nom: true, prenom: true, email: true }
        },
        items: {
          include: {
            article: true
          }
        }
      },
      orderBy: { dateCreation: 'desc' }
    })

    return NextResponse.json({
      success: true,
      data: demandes,
    })
  } catch (error) {
    console.error("Erreur lors de la récupération des demandes:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

/**
 * POST /api/demandes - Crée une nouvelle demande
 * Tous les rôles peuvent créer des demandes selon la mémoire
 */
export const POST = async (request: NextRequest) => {
  const authResult = await requireAuth(request)
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: authResult.error }, { status: 401 })
  }

  const currentUser = authResult.user
  try {
    // Vérifier les permissions - tous les rôles peuvent créer des demandes
    if (!hasPermission(currentUser, "create_demande")) {
      return NextResponse.json({ success: false, error: "Accès non autorisé" }, { status: 403 })
    }

    const body = await request.json()
    
    // Validation des données
    const validatedData = createDemandeSchema.parse(body)

    // Vérifier que l'utilisateur a accès au projet (uniquement assigné)
    const projet = await prisma.projet.findFirst({
      where: {
        id: validatedData.projetId,
        utilisateurs: { some: { userId: currentUser.id } }
      }
    })

    if (!projet && currentUser.role !== "superadmin") {
      return NextResponse.json({ success: false, error: "Vous n'avez pas accès à ce projet" }, { status: 403 })
    }

    // Générer un numéro de demande
    const year = new Date().getFullYear()
    const count = await prisma.demande.count()
    const numero = `DEM-${year}-${String(count + 1).padStart(4, "0")}`

    // Déterminer le statut initial selon le type de demande
    const initialStatus = getInitialStatus(validatedData.type)

    // Traiter les articles - créer ceux qui n'existent pas
    const processedItems = []
    
    for (const item of validatedData.items) {
      let articleId = item.articleId
      
      // Si c'est un article manuel (commence par "manual-"), le créer d'abord
      if (item.articleId.startsWith('manual-') && item.article) {
        // Vérifier si l'article existe déjà avec cette référence
        const existingArticle = await prisma.article.findUnique({
          where: { reference: item.article.reference }
        })
        
        if (existingArticle) {
          articleId = existingArticle.id
        } else {
          const newArticle = await prisma.article.create({
            data: {
              nom: item.article.nom,
              description: item.article.description || '',
              reference: item.article.reference,
              unite: item.article.unite,
              type: validatedData.type,
              stock: null,
              prixUnitaire: null,
            }
          })
          articleId = newArticle.id
        }
      }
      
      processedItems.push({
        articleId,
        quantiteDemandee: item.quantiteDemandee,
        commentaire: item.commentaire || null,
      })
    }

    // Créer la demande avec ses items
    const newDemande = await prisma.demande.create({
      data: {
        numero,
        projetId: validatedData.projetId,
        technicienId: currentUser.id,
        type: validatedData.type,
        status: initialStatus as any,
        commentaires: validatedData.commentaires,
        dateLivraisonSouhaitee: validatedData.dateLivraisonSouhaitee ? new Date(validatedData.dateLivraisonSouhaitee) : null,
        items: {
          create: processedItems
        }
      },
      include: {
        projet: {
          select: { id: true, nom: true }
        },
        technicien: {
          select: { id: true, nom: true, prenom: true, email: true }
        },
        items: {
          include: {
            article: true
          }
        }
      }
    })

    // Créer une entrée dans l'historique
    await prisma.historyEntry.create({
      data: {
        demandeId: newDemande.id,
        userId: currentUser.id,
        action: "Création de la demande",
        nouveauStatus: initialStatus as any,
        signature: `creation-${Date.now()}`,
      }
    })

    return NextResponse.json(
      {
        success: true,
        data: newDemande,
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ success: false, error: "Données invalides", details: error }, { status: 400 })
    }
    
    console.error("Erreur lors de la création de la demande:", error)
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 })
  }
}

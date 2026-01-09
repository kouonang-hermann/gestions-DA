import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, hasPermission } from "@/lib/auth"
import { createDemandeSchema } from "@/lib/validations"

/**
 * Détermine le statut initial d'une demande selon son type et le rôle du créateur
 * La demande saute automatiquement les étapes de validation où le créateur pourrait valider
 */
function getInitialStatus(type: "materiel" | "outillage", creatorRole: string): string {
  console.log(`🎬 [INITIAL-STATUS] Type: ${type}, Créateur: ${creatorRole}`)
  
  // Flow complet pour chaque type avec les rôles valideurs
  const flows = {
    materiel: [
      { status: "en_attente_validation_conducteur", role: "conducteur_travaux" },
      { status: "en_attente_validation_responsable_travaux", role: "responsable_travaux" },
      { status: "en_attente_validation_charge_affaire", role: "charge_affaire" },
      { status: "en_attente_preparation_appro", role: "responsable_appro" },
      { status: "en_attente_reception_livreur", role: "responsable_livreur" },
      { status: "en_attente_livraison", role: "responsable_livreur" },
      { status: "en_attente_validation_finale_demandeur", role: "employe" }
    ],
    outillage: [
      { status: "en_attente_validation_logistique", role: "responsable_logistique" },
      { status: "en_attente_validation_responsable_travaux", role: "responsable_travaux" },
      { status: "en_attente_validation_charge_affaire", role: "charge_affaire" },
      { status: "en_attente_preparation_logistique", role: "responsable_logistique" },
      { status: "en_attente_reception_livreur", role: "responsable_livreur" },
      { status: "en_attente_livraison", role: "responsable_livreur" },
      { status: "en_attente_validation_finale_demandeur", role: "employe" }
    ]
  }

  // Mapping des rôles qui peuvent sauter leur propre étape UNIQUEMENT
  // Chaque rôle liste UNIQUEMENT l'étape qu'il peut valider (donc qu'il doit sauter quand il crée)
  const skipRules: Record<string, string[]> = {
    // Conducteur peut valider l'étape "conducteur" uniquement
    "conducteur_travaux": ["en_attente_validation_conducteur"],
    
    // Responsable Logistique peut valider l'étape "Logistique" (1ère validation) ET "Préparation Logistique"
    "responsable_logistique": [
      "en_attente_validation_logistique",
      "en_attente_preparation_logistique"
    ],
    
    // Responsable travaux peut valider UNIQUEMENT l'étape "responsable travaux"
    // Il ne peut PAS sauter les étapes précédentes (conducteur, logistique)
    "responsable_travaux": [
      "en_attente_validation_responsable_travaux"
    ],
    
    // Chargé affaires peut valider UNIQUEMENT l'étape "chargé affaires"
    // Il ne peut PAS sauter les étapes précédentes
    "charge_affaire": [
      "en_attente_validation_charge_affaire"
    ],
    
    // Superadmin ne saute AUCUNE étape (pas d'auto-validation)
    // Ses demandes suivent le flow normal complet
    "superadmin": []
  }

  const flow = flows[type]
  const stepsToSkip = skipRules[creatorRole] || []
  
  console.log(`📋 [INITIAL-STATUS] Étapes à sauter pour ${creatorRole}:`, stepsToSkip)
  
  // Trouver la première étape qui n'est pas dans la liste des étapes à sauter
  for (const step of flow) {
    if (!stepsToSkip.includes(step.status)) {
      console.log(`✅ [INITIAL-STATUS] Statut initial déterminé: ${step.status}`)
      return step.status
    }
  }
  
  // Si toutes les étapes sont sautées, aller à la validation finale
  console.log(`⚠️ [INITIAL-STATUS] Toutes les étapes sautées, va à validation finale`)
  return "en_attente_validation_finale_demandeur"
}

/**
 * Détermine le prochain statut selon le statut actuel et le rôle
 */
function getNextStatus(currentStatus: string, userRole: string, demandeType?: string): string | null {
  const transitions: Record<string, Record<string, string>> = {
    "en_attente_validation_conducteur": {
      "conducteur_travaux": "en_attente_validation_responsable_travaux"
    },
    "en_attente_validation_responsable_travaux": {
      "responsable_travaux": "en_attente_validation_charge_affaire"
    },
    "en_attente_validation_logistique": {
      "responsable_logistique": "en_attente_validation_responsable_travaux"
    },
    "en_attente_validation_charge_affaire": {
      "charge_affaire": "en_attente_preparation_appro"
    },
    "en_attente_preparation_appro": {
      "responsable_appro": "en_attente_reception_livreur"
    },
    "en_attente_preparation_logistique": {
      "responsable_logistique": "en_attente_reception_livreur"
    },
    "en_attente_reception_livreur": {
      "responsable_livreur": "en_attente_livraison"
    },
    "en_attente_livraison": {
      "responsable_livreur": "en_attente_validation_finale_demandeur"
    },
    "en_attente_validation_finale_demandeur": {
      "employe": "confirmee_demandeur"
    }
  }

  // Cas spécial : Chargé d'affaire valide différemment selon le type de demande
  if (currentStatus === "en_attente_validation_charge_affaire" && userRole === "charge_affaire") {
    return demandeType === "outillage" ? "en_attente_preparation_logistique" : "en_attente_preparation_appro"
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
        // L'employé ne voit QUE ses propres demandes (pas celles des autres sur ses projets)
        console.log(`👤 [API-DEMANDES] Employé ${currentUser.nom} ${currentUser.prenom}:`)
        console.log(`   - ID: ${currentUser.id}`)
        console.log(`   - Filtre: technicienId = ${currentUser.id}`)
        
        whereClause = {
          technicienId: currentUser.id
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

      case "responsable_logistique":
        // Voit les demandes d'outillage des projets où il est assigné
        const logistiqueProjets = await prisma.userProjet.findMany({
          where: { userId: currentUser.id },
          select: { projetId: true }
        })
        whereClause = {
          type: "outillage",
          projetId: { in: logistiqueProjets.map((up: any) => up.projetId) }
        }
        break

      case "responsable_travaux":
        // Voit les demandes matériel ET outillage des projets où il est assigné
        const responsableProjets = await prisma.userProjet.findMany({
          where: { userId: currentUser.id },
          select: { projetId: true }
        })
        whereClause = {
          projetId: { in: responsableProjets.map((up: any) => up.projetId) }
        }
        break

      case "responsable_appro":
      case "charge_affaire":
      case "responsable_livreur":
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

    console.log(`📊 [API-DEMANDES] ${demandes.length} demande(s) trouvée(s) pour ${currentUser.role}`)

    // Filtrer les données financières pour les non-superadmin
    const filteredDemandes = demandes.map((demande: any) => {
      if (currentUser.role === 'superadmin') {
        // Le superadmin voit tout, y compris les prix
        return demande
      } else {
        // Les autres utilisateurs ne voient PAS les prix
        return {
          ...demande,
          coutTotal: undefined, // Masquer le coût total
          items: demande.items.map((item: any) => ({
            ...item,
            prixUnitaire: undefined // Masquer le prix unitaire
          }))
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: filteredDemandes,
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

    // Interdire la création de demande sur un projet inactif ou terminé
    const projetDetails = await prisma.projet.findUnique({
      where: { id: validatedData.projetId },
      select: { actif: true, dateFin: true, nom: true }
    })

    const now = new Date()
    if (!projetDetails) {
      return NextResponse.json({ success: false, error: "Projet introuvable" }, { status: 404 })
    }
    if (!projetDetails.actif || (projetDetails.dateFin && projetDetails.dateFin < now)) {
      return NextResponse.json({ 
        success: false, 
        error: `Le projet "${projetDetails.nom}" est terminé ou inactif. Vous ne pouvez plus y créer de demande.` 
      }, { status: 400 })
    }

    // Générer un numéro de demande
    const year = new Date().getFullYear()
    const count = await prisma.demande.count()
    const numero = `DEM-${year}-${String(count + 1).padStart(4, "0")}`

    // Déterminer le statut initial selon le type de demande et le rôle du créateur
    const initialStatus = getInitialStatus(validatedData.type, currentUser.role)

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

    // Créer une entrée dans l'historique pour la création
    await prisma.historyEntry.create({
      data: {
        demandeId: newDemande.id,
        userId: currentUser.id,
        action: "Création de la demande",
        nouveauStatus: initialStatus as any,
        signature: `creation-${Date.now()}`,
      }
    })

    // Créer des entrées d'historique pour les étapes sautées
    const flows = {
      materiel: [
        { status: "en_attente_validation_conducteur", role: "conducteur_travaux", label: "Validation Conducteur" },
        { status: "en_attente_validation_responsable_travaux", role: "responsable_travaux", label: "Validation Responsable Travaux" },
        { status: "en_attente_validation_charge_affaire", role: "charge_affaire", label: "Validation Chargé Affaire" },
        { status: "en_attente_preparation_appro", role: "responsable_appro", label: "Préparation Appro" },
        { status: "en_attente_validation_livreur", role: "responsable_livreur", label: "Validation Livreur" },
        { status: "en_attente_validation_finale_demandeur", role: "employe", label: "Validation Finale Demandeur" }
      ],
      outillage: [
        { status: "en_attente_validation_logistique", role: "responsable_logistique", label: "Validation Logistique" },
        { status: "en_attente_validation_responsable_travaux", role: "responsable_travaux", label: "Validation Responsable Travaux" },
        { status: "en_attente_validation_charge_affaire", role: "charge_affaire", label: "Validation Chargé Affaire" },
        { status: "en_attente_preparation_logistique", role: "responsable_logistique", label: "Préparation Logistique" },
        { status: "en_attente_reception_livreur", role: "responsable_livreur", label: "Réception Livreur" },
        { status: "en_attente_livraison", role: "responsable_livreur", label: "Livraison" },
        { status: "en_attente_validation_finale_demandeur", role: "employe", label: "Validation Finale Demandeur" }
      ]
    }

    const flow = flows[validatedData.type as keyof typeof flows]
    
    // Créer des entrées pour chaque étape sautée
    for (const step of flow) {
      if (step.role === currentUser.role && step.status !== initialStatus) {
        await prisma.historyEntry.create({
          data: {
            demandeId: newDemande.id,
            userId: currentUser.id,
            action: `Auto-validation: ${step.label}`,
            nouveauStatus: step.status as any,
            commentaire: `Étape automatiquement validée car le créateur (${currentUser.role}) correspond au valideur de cette étape`,
            signature: `auto-skip-${step.status}-${Date.now()}`,
          }
        })
      }
      
      // Arrêter quand on atteint le statut initial (première étape non sautée)
      if (step.status === initialStatus) {
        break
      }
    }

    // Envoyer une notification au premier validateur
    const { notificationService } = await import('@/services/notificationService')
    const users = await prisma.user.findMany({
      include: {
        projets: {
          include: {
            projet: true
          }
        }
      }
    })
    
    // Transformer les données pour le service de notification
    const transformedUsers = users.map(u => ({
      ...u,
      projets: u.projets.map(up => up.projet.id)
    }))
    
    await notificationService.handleStatusChange(
      newDemande as any,
      'soumise' as any,
      initialStatus as any,
      transformedUsers as any
    )

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

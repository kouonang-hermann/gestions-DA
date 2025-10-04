import { type NextRequest, NextResponse } from "next/server"
import { requireAuthLocal, hasPermissionLocal } from "@/lib/auth-local"
import type { Demande, DemandeStatus, User } from "@/types"

// Données locales simulées
const localDemandes: Demande[] = [
  {
    id: "demande-1",
    numero: "DA-2024-001",
    projetId: "projet-1",
    projet: {
      id: "projet-1",
      nom: "Rénovation Bâtiment A",
      description: "Rénovation complète du bâtiment A",
      dateDebut: new Date("2024-01-01"),
      dateFin: new Date("2024-12-31"),
      createdBy: "user-1",
      utilisateurs: ["user-1", "user-2", "user-3"],
      actif: true,
      createdAt: new Date()
    },
    technicienId: "user-2",
    type: "materiel",
    items: [
      {
        id: "item-1",
        articleId: "article-1",
        quantiteDemandee: 10,
        quantiteValidee: 10,
        quantiteSortie: 10,
        quantiteRecue: 10,
        commentaire: "Livré complet"
      }
    ],
    status: "confirmee_demandeur",
    dateCreation: new Date("2024-01-15"),
    dateModification: new Date("2024-01-20"),
    commentaires: "Demande de matériel pour rénovation",
    validationLogistique: undefined,
    validationResponsableTravaux: undefined
  },
  {
    id: "demande-2", 
    numero: "DA-2024-002",
    projetId: "projet-1",
    projet: {
      id: "projet-1",
      nom: "Rénovation Bâtiment A",
      description: "Rénovation complète du bâtiment A",
      dateDebut: new Date("2024-01-01"),
      dateFin: new Date("2024-12-31"),
      createdBy: "user-1",
      utilisateurs: ["user-1", "user-2", "user-3"],
      actif: true,
      createdAt: new Date()
    },
    technicienId: "user-2",
    type: "outillage",
    items: [
      {
        id: "item-2",
        articleId: "article-2", 
        quantiteDemandee: 5,
        quantiteValidee: 5,
        quantiteSortie: 5,
        commentaire: "En cours de livraison"
      }
    ],
    status: "en_attente_validation_finale_demandeur",
    dateCreation: new Date("2024-01-16"),
    dateModification: new Date("2024-01-21"),
    commentaires: "Demande d'outillage spécialisé",
    validationLogistique: undefined,
    validationResponsableTravaux: undefined
  },
  {
    id: "demande-3",
    numero: "DA-2024-003", 
    projetId: "projet-2",
    projet: {
      id: "projet-2",
      nom: "Installation Électrique",
      description: "Installation électrique complète",
      dateDebut: new Date("2024-02-01"),
      dateFin: new Date("2024-06-30"),
      createdBy: "user-1",
      utilisateurs: ["user-1", "user-4"],
      actif: true,
      createdAt: new Date()
    },
    technicienId: "user-3",
    type: "materiel",
    items: [
      {
        id: "item-3",
        articleId: "article-3",
        quantiteDemandee: 20,
        quantiteValidee: 18,
        commentaire: "Quantité ajustée"
      }
    ],
    status: "en_attente_preparation_appro",
    dateCreation: new Date("2024-02-05"),
    dateModification: new Date("2024-02-10"),
    commentaires: "Matériel électrique urgent",
    validationLogistique: undefined,
    validationResponsableTravaux: undefined
  }
]

/**
 * Détermine le statut initial d'une demande selon son type
 */
function getInitialStatus(type: "materiel" | "outillage"): DemandeStatus {
  if (type === "materiel") {
    return "en_attente_validation_conducteur"
  } else {
    return "en_attente_validation_qhse"
  }
}

/**
 * Détermine le prochain statut selon le statut actuel et le rôle
 */
function getNextStatus(currentStatus: DemandeStatus, userRole: string): DemandeStatus | null {
  const transitions: Record<string, Record<string, DemandeStatus>> = {
    "en_attente_validation_conducteur": {
      "conducteur_travaux": "en_attente_validation_responsable_travaux"
    },
    "en_attente_validation_responsable_travaux": {
      "responsable_travaux": "en_attente_preparation_appro"
    },
    "en_attente_validation_qhse": {
      "responsable_qhse": "en_attente_validation_responsable_travaux"
    },
    "en_attente_preparation_appro": {
      "responsable_appro": "en_attente_validation_charge_affaire"
    },
    "en_attente_validation_charge_affaire": {
      "charge_affaire": "en_attente_validation_logistique"
    },
    "en_attente_validation_logistique": {
      "responsable_logistique": "en_attente_validation_finale_demandeur"
    },
    "en_attente_validation_finale_demandeur": {
      "employe": "confirmee_demandeur"
    },
    "confirmee_demandeur": {
      "employe": "cloturee"
    }
  }

  return transitions[currentStatus]?.[userRole] || null
}

/**
 * GET /api/demandes - Récupère les demandes selon le rôle (mode local)
 */
export const GET = async (request: NextRequest) => {
  console.log("[LOCAL API] GET /api/demandes - Début")
  
  const authResult = await requireAuthLocal(request)
  if (!authResult.success) {
    console.log("[LOCAL API] Authentification échouée:", authResult.error)
    return NextResponse.json({ success: false, error: authResult.error }, { status: 401 })
  }

  const currentUser = authResult.user!
  console.log(`[LOCAL API] Utilisateur authentifié: ${currentUser.nom} ${currentUser.prenom} (${currentUser.role})`)

  try {
    const { searchParams } = new URL(request.url)
    const projetId = searchParams.get("projetId")
    const status = searchParams.get("status")
    const type = searchParams.get("type")

    console.log(`[LOCAL API] Filtres: projetId=${projetId}, status=${status}, type=${type}`)

    // Filtrer les demandes selon le rôle
    let filteredDemandes = [...localDemandes]

    switch (currentUser.role) {
      case "superadmin":
        // Voit toutes les demandes
        console.log("[LOCAL API] SuperAdmin - Accès à toutes les demandes")
        break

      case "employe":
        // Voit ses propres demandes + celles des projets où il est assigné
        filteredDemandes = localDemandes.filter(demande => 
          demande.technicienId === currentUser.id || 
          currentUser.projets.includes(demande.projetId)
        )
        console.log(`[LOCAL API] Employé - ${filteredDemandes.length} demandes accessibles`)
        break

      case "conducteur_travaux":
        // Voit les demandes de matériel des projets où il est assigné
        filteredDemandes = localDemandes.filter(demande =>
          demande.type === "materiel" && 
          currentUser.projets.includes(demande.projetId)
        )
        console.log(`[LOCAL API] Conducteur - ${filteredDemandes.length} demandes matériel`)
        break

      case "responsable_qhse":
        // Voit les demandes d'outillage des projets où il est assigné
        filteredDemandes = localDemandes.filter(demande =>
          demande.type === "outillage" && 
          currentUser.projets.includes(demande.projetId)
        )
        console.log(`[LOCAL API] QHSE - ${filteredDemandes.length} demandes outillage`)
        break

      case "responsable_travaux":
      case "responsable_appro":
      case "charge_affaire":
      case "responsable_logistique":
        // Voient les demandes des projets où ils sont assignés
        filteredDemandes = localDemandes.filter(demande =>
          currentUser.projets.includes(demande.projetId)
        )
        console.log(`[LOCAL API] ${currentUser.role} - ${filteredDemandes.length} demandes de projets`)
        break

      default:
        filteredDemandes = []
        console.log(`[LOCAL API] Rôle non reconnu: ${currentUser.role}`)
    }

    // Appliquer les filtres supplémentaires
    if (projetId) {
      filteredDemandes = filteredDemandes.filter(d => d.projetId === projetId)
    }
    if (status) {
      filteredDemandes = filteredDemandes.filter(d => d.status === status)
    }
    if (type) {
      filteredDemandes = filteredDemandes.filter(d => d.type === type)
    }

    console.log(`[LOCAL API] Résultat final: ${filteredDemandes.length} demandes`)

    return NextResponse.json({
      success: true,
      data: filteredDemandes
    })

  } catch (error) {
    console.error("[LOCAL API] Erreur lors de la récupération des demandes:", error)
    return NextResponse.json({
      success: false,
      error: "Erreur lors de la récupération des demandes"
    }, { status: 500 })
  }
}

/**
 * POST /api/demandes - Crée une nouvelle demande (mode local)
 */
export const POST = async (request: NextRequest) => {
  console.log("[LOCAL API] POST /api/demandes - Début")
  
  const authResult = await requireAuthLocal(request)
  if (!authResult.success) {
    return NextResponse.json({ success: false, error: authResult.error }, { status: 401 })
  }

  const currentUser = authResult.user!

  if (!hasPermissionLocal(currentUser, "create_demande")) {
    return NextResponse.json({
      success: false,
      error: "Permissions insuffisantes"
    }, { status: 403 })
  }

  try {
    const body = await request.json()
    console.log("[LOCAL API] Données reçues:", body)

    // Créer une nouvelle demande
    const newDemande: Demande = {
      id: `demande-${Date.now()}`,
      numero: `DA-${new Date().getFullYear()}-${String(localDemandes.length + 1).padStart(3, '0')}`,
      projetId: body.projetId,
      technicienId: currentUser.id,
      type: body.type,
      items: body.items || [],
      status: body.status || getInitialStatus(body.type),
      dateCreation: new Date(),
      dateModification: new Date(),
      commentaires: body.commentaires || "",
      validationLogistique: undefined,
      validationResponsableTravaux: undefined
    }

    localDemandes.push(newDemande)
    console.log(`[LOCAL API] Demande créée: ${newDemande.numero}`)

    return NextResponse.json({
      success: true,
      data: { demande: newDemande }
    })

  } catch (error) {
    console.error("[LOCAL API] Erreur lors de la création de la demande:", error)
    return NextResponse.json({
      success: false,
      error: "Erreur lors de la création de la demande"
    }, { status: 500 })
  }
}

/**
 * Exporte les demandes locales pour utilisation externe
 */
export function getLocalDemandes(): Demande[] {
  return [...localDemandes]
}

/**
 * Ajoute une demande locale
 */
export function addLocalDemande(demande: Demande): void {
  localDemandes.push(demande)
}

/**
 * Met à jour une demande locale
 */
export function updateLocalDemande(demandeId: string, updates: Partial<Demande>): Demande | null {
  const index = localDemandes.findIndex(d => d.id === demandeId)
  if (index === -1) return null
  
  localDemandes[index] = {
    ...localDemandes[index],
    ...updates,
    dateModification: new Date()
  }
  
  return localDemandes[index]
}

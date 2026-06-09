import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

/**
 * GET /api/conges
 * Récupère les demandes de congés selon le rôle de l'utilisateur
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    
    if (!currentUser) {
      return NextResponse.json({ 
        success: false, 
        error: "Non autorisé" 
      }, { status: 401 })
    }

    const role = currentUser.role as string

    // Inclusions communes
    const includeRelations = {
      employe: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          phone: true,
          service: true
        }
      },
      responsable: {
        select: {
          id: true,
          nom: true,
          prenom: true,
          email: true,
          phone: true
        }
      }
    } as const

    let demandes

    // Super Admin, RH et DG voient toutes les demandes
    if (role === "superadmin" || role === "responsable_rh" || role === "directeur_general") {
      demandes = await prisma.demandeConge.findMany({
        include: includeRelations,
        orderBy: { dateCreation: "desc" }
      })
    }
    // Tous les autres utilisateurs voient :
    //  - leurs propres demandes (employeId)
    //  - les demandes dont ils sont le responsable hiérarchique assigné (responsableId)
    // Cela couvre tous les rôles autorisés à être responsables (responsable_travaux,
    // charge_affaire, conducteur_travaux, responsable_appro, responsable_logistique, etc.)
    else {
      demandes = await prisma.demandeConge.findMany({
        where: {
          OR: [
            { employeId: currentUser.id },
            { responsableId: currentUser.id }
          ]
        },
        include: includeRelations,
        orderBy: { dateCreation: "desc" }
      })
    }

    return NextResponse.json({ 
      success: true, 
      data: demandes 
    })

  } catch (error: any) {
    console.error("❌ [API CONGES] Erreur GET:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

/**
 * POST /api/conges
 * Crée une nouvelle demande de congé
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    
    if (!currentUser) {
      return NextResponse.json({ 
        success: false, 
        error: "Non autorisé" 
      }, { status: 401 })
    }

    const body = await request.json()
    const {
      matricule,
      anciennete,
      responsableId,
      typeConge,
      autresPrecision,
      dateDebut,
      dateFin,
      contactPersonnelNom,
      contactPersonnelTel,
      contactAutreNom,
      contactAutreTel
    } = body

    // Validation des champs requis
    if (!matricule || !anciennete || !responsableId || !typeConge || !dateDebut || !dateFin) {
      return NextResponse.json({ 
        success: false, 
        error: "Champs requis manquants" 
      }, { status: 400 })
    }

    if (!contactPersonnelNom || !contactPersonnelTel) {
      return NextResponse.json({ 
        success: false, 
        error: "Contact personnel requis" 
      }, { status: 400 })
    }

    // Récupérer les infos du responsable
    const responsable = await prisma.user.findUnique({
      where: { id: responsableId },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        phone: true
      }
    })

    if (!responsable) {
      return NextResponse.json({ 
        success: false, 
        error: "Responsable non trouvé" 
      }, { status: 404 })
    }

    // Calculer le nombre de jours
    const debut = new Date(dateDebut)
    const fin = new Date(dateFin)
    const diffTime = Math.abs(fin.getTime() - debut.getTime())
    const nombreJours = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 // +1 pour inclure le dernier jour

    // Générer le numéro de demande
    const year = new Date().getFullYear()
    const count = await prisma.demandeConge.count()
    const numero = `DC-${year}-${String(count + 1).padStart(4, "0")}`

    // Créer la demande
    const demande = await prisma.demandeConge.create({
      data: {
        numero,
        employeId: currentUser.id,
        matricule,
        anciennete,
        responsableId,
        responsableNom: `${responsable.prenom} ${responsable.nom}`,
        responsableTel: responsable.phone,
        responsableEmail: responsable.email || "",
        typeConge,
        autresPrecision: typeConge === "autres" ? autresPrecision : null,
        dateDebut: new Date(dateDebut),
        dateFin: new Date(dateFin),
        nombreJours,
        contactPersonnelNom,
        contactPersonnelTel,
        contactAutreNom,
        contactAutreTel,
        status: "brouillon"
      },
      include: {
        employe: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            phone: true,
            service: true
          }
        },
        responsable: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            phone: true
          }
        }
      }
    })

    console.log(`✅ [API CONGES] Demande créée: ${numero}`)

    return NextResponse.json({ 
      success: true, 
      data: demande 
    }, { status: 201 })

  } catch (error: any) {
    console.error("❌ [API CONGES] Erreur POST:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

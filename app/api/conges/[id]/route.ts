import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

/**
 * GET /api/conges/[id]
 * Récupère une demande de congé par son ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser(request)
    
    if (!currentUser) {
      return NextResponse.json({ 
        success: false, 
        error: "Non autorisé" 
      }, { status: 401 })
    }

    const { id } = await params

    const demande = await prisma.demandeConge.findUnique({
      where: { id },
      include: {
        employe: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            email: true,
            phone: true,
            service: true,
            matricule: true
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

    if (!demande) {
      return NextResponse.json({ 
        success: false, 
        error: "Demande non trouvée" 
      }, { status: 404 })
    }

    // Vérifier les permissions
    const canView = 
      currentUser.role === "superadmin" ||
      currentUser.role === "responsable_rh" ||
      demande.employeId === currentUser.id ||
      demande.responsableId === currentUser.id

    if (!canView) {
      return NextResponse.json({ 
        success: false, 
        error: "Non autorisé" 
      }, { status: 403 })
    }

    return NextResponse.json({ 
      success: true, 
      data: demande 
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
 * PATCH /api/conges/[id]
 * Met à jour une demande de congé (soumission, validation, rejet)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser(request)
    
    if (!currentUser) {
      return NextResponse.json({ 
        success: false, 
        error: "Non autorisé" 
      }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { action, commentaire, resteJours } = body

    const demande = await prisma.demandeConge.findUnique({
      where: { id }
    })

    if (!demande) {
      return NextResponse.json({ 
        success: false, 
        error: "Demande non trouvée" 
      }, { status: 404 })
    }

    let updateData: any = {}

    switch (action) {
      case "soumettre":
        // L'employé soumet sa demande
        if (demande.employeId !== currentUser.id) {
          return NextResponse.json({ 
            success: false, 
            error: "Non autorisé" 
          }, { status: 403 })
        }

        updateData = {
          status: "soumise",
          dateSoumission: new Date(),
          signatureEmploye: {
            userId: currentUser.id,
            date: new Date(),
            signature: `signature_${currentUser.id}_${Date.now()}`
          }
        }
        break

      case "valider_hierarchique":
        // Le responsable hiérarchique valide et peut modifier les dates
        if (demande.responsableId !== currentUser.id && currentUser.role !== "superadmin") {
          return NextResponse.json({ 
            success: false, 
            error: "Non autorisé" 
          }, { status: 403 })
        }

        const { dateDebutModifiee: dateDebutResp, dateFinModifiee: dateFinResp } = body

        let nombreJoursModifieResp = demande.nombreJours
        if (dateDebutResp && dateFinResp) {
          const debut = new Date(dateDebutResp)
          const fin = new Date(dateFinResp)
          nombreJoursModifieResp = Math.ceil((fin.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24)) + 1
        }

        updateData = {
          status: "en_attente_validation_rh",
          dateDebutFinale: dateDebutResp ? new Date(dateDebutResp) : demande.dateDebut,
          dateFinFinale: dateFinResp ? new Date(dateFinResp) : demande.dateFin,
          nombreJoursFinal: nombreJoursModifieResp,
          signatureResponsable: {
            userId: currentUser.id,
            date: new Date(),
            signature: `signature_${currentUser.id}_${Date.now()}`,
            commentaire: commentaire || null,
            dateDebutModifiee: dateDebutResp || null,
            dateFinModifiee: dateFinResp || null,
            nombreJoursModifie: dateDebutResp && dateFinResp ? nombreJoursModifieResp : null
          }
        }
        break

      case "valider_rh":
        // Le RH valide, peut modifier les dates et renseigne le reste de jours
        if (currentUser.role !== "responsable_rh" && currentUser.role !== "superadmin" && currentUser.role !== "directeur_general") {
          return NextResponse.json({ 
            success: false, 
            error: "Non autorisé" 
          }, { status: 403 })
        }

        if (resteJours === undefined || resteJours === null) {
          return NextResponse.json({ 
            success: false, 
            error: "Le reste de jours est requis" 
          }, { status: 400 })
        }

        const { dateDebutModifiee: dateDebutRH, dateFinModifiee: dateFinRH } = body

        // Utiliser les dates finales si elles existent, sinon les dates originales
        const dateDebutActuelle = demande.dateDebutFinale || demande.dateDebut
        const dateFinActuelle = demande.dateFinFinale || demande.dateFin

        let nombreJoursModifieRH = demande.nombreJoursFinal || demande.nombreJours
        if (dateDebutRH && dateFinRH) {
          const debut = new Date(dateDebutRH)
          const fin = new Date(dateFinRH)
          nombreJoursModifieRH = Math.ceil((fin.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24)) + 1
        }

        updateData = {
          status: "en_attente_visa_dg",
          resteJours: parseInt(resteJours),
          dateDebutFinale: dateDebutRH ? new Date(dateDebutRH) : dateDebutActuelle,
          dateFinFinale: dateFinRH ? new Date(dateFinRH) : dateFinActuelle,
          nombreJoursFinal: nombreJoursModifieRH,
          signatureRH: {
            userId: currentUser.id,
            date: new Date(),
            signature: `signature_${currentUser.id}_${Date.now()}`,
            commentaire: commentaire || null,
            dateDebutModifiee: dateDebutRH || null,
            dateFinModifiee: dateFinRH || null,
            nombreJoursModifie: dateDebutRH && dateFinRH ? nombreJoursModifieRH : null,
            resteJours: parseInt(resteJours)
          }
        }
        break

      case "valider_dg":
        // Le DG donne le visa final et peut modifier les dates
        if (currentUser.role !== "superadmin" && currentUser.role !== "directeur_general") {
          return NextResponse.json({ 
            success: false, 
            error: "Non autorisé - Seul le DG peut donner le visa final" 
          }, { status: 403 })
        }

        const { dateDebutModifiee: dateDebutDG, dateFinModifiee: dateFinDG } = body

        // Utiliser les dates finales si elles existent, sinon les dates originales
        const dateDebutActuelleDG = demande.dateDebutFinale || demande.dateDebut
        const dateFinActuelleDG = demande.dateFinFinale || demande.dateFin

        let nombreJoursModifieDG = demande.nombreJoursFinal || demande.nombreJours
        if (dateDebutDG && dateFinDG) {
          const debut = new Date(dateDebutDG)
          const fin = new Date(dateFinDG)
          nombreJoursModifieDG = Math.ceil((fin.getTime() - debut.getTime()) / (1000 * 60 * 60 * 24)) + 1
        }

        updateData = {
          status: "approuvee",
          dateValidation: new Date(),
          dateDebutFinale: dateDebutDG ? new Date(dateDebutDG) : dateDebutActuelleDG,
          dateFinFinale: dateFinDG ? new Date(dateFinDG) : dateFinActuelleDG,
          nombreJoursFinal: nombreJoursModifieDG,
          signatureDG: {
            userId: currentUser.id,
            date: new Date(),
            signature: `signature_${currentUser.id}_${Date.now()}`,
            commentaire: commentaire || null,
            dateDebutModifiee: dateDebutDG || null,
            dateFinModifiee: dateFinDG || null,
            nombreJoursModifie: dateDebutDG && dateFinDG ? nombreJoursModifieDG : null
          }
        }
        break

      case "rejeter":
        // Rejet possible à n'importe quelle étape par les validateurs
        const canReject = 
          (currentUser.role as string) === "directeur_general" ||
          (demande.status === "soumise" && demande.responsableId === currentUser.id) ||
          (demande.status === "en_attente_validation_rh" && currentUser.role === "responsable_rh") ||
          (demande.status === "en_attente_visa_dg" && (currentUser.role as string) === "directeur_general")

        if (!canReject) {
          return NextResponse.json({ 
            success: false, 
            error: "Non autorisé" 
          }, { status: 403 })
        }

        if (!commentaire) {
          return NextResponse.json({ 
            success: false, 
            error: "Un motif de rejet est requis" 
          }, { status: 400 })
        }

        updateData = {
          status: "rejetee",
          rejetMotif: commentaire
        }
        break

      case "annuler":
        // L'employé peut annuler sa demande si elle n'est pas encore approuvée
        if (demande.employeId !== currentUser.id) {
          return NextResponse.json({ 
            success: false, 
            error: "Non autorisé" 
          }, { status: 403 })
        }

        if (demande.status === "approuvee") {
          return NextResponse.json({ 
            success: false, 
            error: "Impossible d'annuler une demande approuvée" 
          }, { status: 400 })
        }

        updateData = {
          status: "annulee"
        }
        break

      default:
        return NextResponse.json({ 
          success: false, 
          error: "Action non reconnue" 
        }, { status: 400 })
    }

    const demandeUpdated = await prisma.demandeConge.update({
      where: { id },
      data: updateData,
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

    console.log(`✅ [API CONGES] Demande ${demande.numero} - Action: ${action}`)

    return NextResponse.json({ 
      success: true, 
      data: demandeUpdated 
    })

  } catch (error: any) {
    console.error("❌ [API CONGES] Erreur PATCH:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

/**
 * DELETE /api/conges/[id]
 * Supprime une demande de congé (uniquement brouillon)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser(request)
    
    if (!currentUser) {
      return NextResponse.json({ 
        success: false, 
        error: "Non autorisé" 
      }, { status: 401 })
    }

    const { id } = await params

    const demande = await prisma.demandeConge.findUnique({
      where: { id }
    })

    if (!demande) {
      return NextResponse.json({ 
        success: false, 
        error: "Demande non trouvée" 
      }, { status: 404 })
    }

    // Seul l'employé ou le super admin peut supprimer
    if (demande.employeId !== currentUser.id && currentUser.role !== "superadmin") {
      return NextResponse.json({ 
        success: false, 
        error: "Non autorisé" 
      }, { status: 403 })
    }

    // Seules les demandes brouillon peuvent être supprimées
    if (demande.status !== "brouillon") {
      return NextResponse.json({ 
        success: false, 
        error: "Seules les demandes en brouillon peuvent être supprimées" 
      }, { status: 400 })
    }

    await prisma.demandeConge.delete({
      where: { id }
    })

    console.log(`✅ [API CONGES] Demande ${demande.numero} supprimée`)

    return NextResponse.json({ 
      success: true, 
      message: "Demande supprimée" 
    })

  } catch (error: any) {
    console.error("❌ [API CONGES] Erreur DELETE:", error)
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 })
  }
}

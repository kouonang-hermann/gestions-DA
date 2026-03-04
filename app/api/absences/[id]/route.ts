import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

/**
 * GET /api/absences/[id]
 * Récupère une demande d'absence par son ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser(request)

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 401 })
    }

    const { id } = await params

    const demande = (await prisma.demandeAbsence.findUnique({
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
        }
      }
    })) as any

    if (!demande) {
      return NextResponse.json({ success: false, error: "Demande non trouvée" }, { status: 404 })
    }

    const responsable = await prisma.user.findUnique({
      where: { id: demande.responsableId },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        phone: true
      }
    })

    const canView =
      currentUser.role === "superadmin" ||
      currentUser.role === "responsable_rh" ||
      (currentUser.role as string) === "directeur_general" ||
      demande.employeId === currentUser.id ||
      demande.responsableId === currentUser.id

    if (!canView) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...demande,
        responsable
      }
    })
  } catch (error: any) {
    console.error("❌ [API ABSENCES] Erreur GET [id]:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * PATCH /api/absences/[id]
 * Met à jour une demande d'absence (soumission, validation, rejet)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser(request)

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { action, commentaire } = body

    const demande = (await prisma.demandeAbsence.findUnique({
      where: { id }
    })) as any

    if (!demande) {
      return NextResponse.json({ success: false, error: "Demande non trouvée" }, { status: 404 })
    }

    let updateData: any = {}

    switch (action) {
      case "valider": {
        const currentStatus = String(demande.status)
        let newStatus: any = demande.status
        let signatureField: any = {}

        if (currentStatus === "en_attente_validation_hierarchique") {
          if (demande.responsableId !== currentUser.id && currentUser.role !== "superadmin") {
            return NextResponse.json(
              {
                success: false,
                error: "Non autorisé - Vous n'êtes pas le responsable hiérarchique de cette demande"
              },
              { status: 403 }
            )
          }
          newStatus = "en_attente_validation_rh"
          signatureField = {
            signatureResponsable: {
              userId: currentUser.id,
              date: new Date(),
              signature: `signature_${currentUser.id}_${Date.now()}`,
              commentaire: commentaire || null
            }
          }
        } else if (currentStatus === "en_attente_validation_rh") {
          if (currentUser.role !== "responsable_rh" && currentUser.role !== "superadmin") {
            return NextResponse.json(
              {
                success: false,
                error: "Non autorisé - Vous devez être Responsable RH"
              },
              { status: 403 }
            )
          }
          newStatus = "en_attente_visa_dg"
          signatureField = {
            signatureRH: {
              userId: currentUser.id,
              date: new Date(),
              signature: `signature_${currentUser.id}_${Date.now()}`,
              commentaire: commentaire || null
            }
          }
        } else if (currentStatus === "en_attente_visa_dg") {
          if ((currentUser.role as string) !== "directeur_general" && currentUser.role !== "superadmin") {
            return NextResponse.json(
              {
                success: false,
                error: "Non autorisé - Vous devez être Directeur Général"
              },
              { status: 403 }
            )
          }
          newStatus = "approuvee"
          signatureField = {
            signatureDG: {
              userId: currentUser.id,
              date: new Date(),
              signature: `signature_${currentUser.id}_${Date.now()}`,
              commentaire: commentaire || null
            },
            dateValidation: new Date()
          }
        } else {
          return NextResponse.json(
            {
              success: false,
              error: "Cette demande ne peut pas être validée dans son état actuel"
            },
            { status: 400 }
          )
        }

        updateData = {
          status: newStatus,
          dateDebutFinale: demande.dateDebutFinale || demande.dateDebut,
          dateFinFinale: demande.dateFinFinale || demande.dateFin,
          nombreJoursFinal: demande.nombreJoursFinal || demande.nombreJours,
          ...signatureField
        }
        break
      }

      case "rejeter": {
        if (!commentaire || String(commentaire).trim() === "") {
          return NextResponse.json(
            { success: false, error: "Le motif du rejet est obligatoire" },
            { status: 400 }
          )
        }

        const currentStatus = String(demande.status)
        if (currentStatus === "en_attente_validation_hierarchique") {
          if (demande.responsableId !== currentUser.id && currentUser.role !== "superadmin") {
            return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 403 })
          }
        } else if (currentStatus === "en_attente_validation_rh") {
          if (currentUser.role !== "responsable_rh" && currentUser.role !== "superadmin") {
            return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 403 })
          }
        } else if (currentStatus === "en_attente_visa_dg") {
          if ((currentUser.role as string) !== "directeur_general" && currentUser.role !== "superadmin") {
            return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 403 })
          }
        }

        updateData = {
          status: "rejetee",
          rejetMotif: commentaire
        }
        break
      }

      case "soumettre": {
        if (demande.employeId !== currentUser.id) {
          return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 403 })
        }

        updateData = {
          status: "en_attente_validation_hierarchique",
          dateSoumission: new Date(),
          signatureEmploye: {
            userId: currentUser.id,
            date: new Date(),
            signature: `signature_${currentUser.id}_${Date.now()}`
          }
        }
        break
      }

      case "annuler": {
        if (demande.employeId !== currentUser.id && currentUser.role !== "superadmin") {
          return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 403 })
        }

        if (demande.status === "approuvee") {
          return NextResponse.json(
            { success: false, error: "Impossible d'annuler une demande approuvée" },
            { status: 400 }
          )
        }

        updateData = {
          status: "annulee"
        }
        break
      }

      case "valider_hierarchique": {
        if (demande.responsableId !== currentUser.id && currentUser.role !== "superadmin") {
          return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 403 })
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
      }

      case "valider_rh": {
        if (currentUser.role !== "responsable_rh" && currentUser.role !== "superadmin" && (currentUser.role as string) !== "directeur_general") {
          return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 403 })
        }

        const { dateDebutModifiee: dateDebutRH, dateFinModifiee: dateFinRH } = body

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
            nombreJoursModifie: dateDebutRH && dateFinRH ? nombreJoursModifieRH : null
          }
        }
        break
      }

      case "valider_dg": {
        if (currentUser.role !== "superadmin" && (currentUser.role as string) !== "directeur_general") {
          return NextResponse.json(
            { success: false, error: "Non autorisé - Seul le DG peut donner le visa final" },
            { status: 403 }
          )
        }

        const { dateDebutModifiee: dateDebutDG, dateFinModifiee: dateFinDG } = body

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
      }

      default:
        return NextResponse.json({ success: false, error: "Action non reconnue" }, { status: 400 })
    }

    const demandeUpdated = (await prisma.demandeAbsence.update({
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
        }
      }
    })) as any

    const responsable = await prisma.user.findUnique({
      where: { id: (demandeUpdated as any).responsableId },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        phone: true
      }
    })

    console.log(`✅ [API ABSENCES] Demande ${demande.numero} - Action: ${action}`)

    return NextResponse.json({
      success: true,
      data: {
        ...demandeUpdated,
        responsable
      }
    })
  } catch (error: any) {
    console.error("❌ [API ABSENCES] Erreur PATCH [id]:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/absences/[id]
 * Supprime une demande d'absence (uniquement brouillon)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser(request)

    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 401 })
    }

    const { id } = await params

    const demande = await prisma.demandeAbsence.findUnique({
      where: { id }
    })

    if (!demande) {
      return NextResponse.json({ success: false, error: "Demande non trouvée" }, { status: 404 })
    }

    if (demande.employeId !== currentUser.id && currentUser.role !== "superadmin") {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 403 })
    }

    if (demande.status !== "brouillon") {
      return NextResponse.json(
        { success: false, error: "Seules les demandes en brouillon peuvent être supprimées" },
        { status: 400 }
      )
    }

    await prisma.demandeAbsence.delete({
      where: { id }
    })

    console.log(`✅ [API ABSENCES] Demande ${demande.numero} supprimée`)

    return NextResponse.json({ success: true, message: "Demande supprimée" })
  } catch (error: any) {
    console.error("❌ [API ABSENCES] Erreur DELETE [id]:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

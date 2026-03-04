import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

// GET - Récupérer les demandes d'absence
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Non autorisé" },
        { status: 401 }
      )
    }

    let demandes

    if (currentUser.role === "responsable_rh" || (currentUser.role as string) === "directeur_general") {
      demandes = (await prisma.demandeAbsence.findMany({
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
        },
        orderBy: { dateCreation: "desc" }
      })) as any
    } else if (["responsable_travaux", "charge_affaire", "conducteur_travaux"].includes(currentUser.role)) {
      demandes = (await (prisma.demandeAbsence as any).findMany({
        where: {
          OR: [{ employeId: currentUser.id }, { responsableId: currentUser.id }]
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
          }
        },
        orderBy: { dateCreation: "desc" }
      })) as any
    } else {
      demandes = (await prisma.demandeAbsence.findMany({
        where: { employeId: currentUser.id },
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
        },
        orderBy: { dateCreation: "desc" }
      })) as any
    }

    const responsableIds: string[] = Array.from(
      new Set(
        (demandes || [])
          .map((d: any) => d?.responsableId)
          .filter((id: any): id is string => typeof id === "string" && id.length > 0)
      )
    )

    const responsables = await prisma.user.findMany({
      where: { id: { in: responsableIds } },
      select: {
        id: true,
        nom: true,
        prenom: true,
        email: true,
        phone: true
      }
    })

    const responsablesById = new Map(responsables.map((r) => [r.id, r]))

    const demandesEnriched = (demandes || []).map((d: any) => ({
      ...d,
      responsable: d?.responsableId ? responsablesById.get(d.responsableId) || null : null
    }))

    return NextResponse.json({ success: true, data: demandesEnriched })
  } catch (error) {
    console.error("❌ [API ABSENCES] Erreur GET:", error)
    return NextResponse.json({ success: false, error: (error as any).message }, { status: 500 })
  }
}

// POST - Créer une nouvelle demande d'absence
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Non autorisé" },
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
      responsableId,
      commentaireEmploye
    } = body

    // Validation des données
    if (!typeAbsence || !motif || !dateDebut || !dateFin || !nombreJours || !responsableId) {
      return NextResponse.json({ success: false, error: "Champs requis manquants" }, { status: 400 })
    }

    // Vérifier que le responsable existe
    const responsable = await prisma.user.findUnique({
      where: { id: responsableId }
    })

    if (!responsable) {
      return NextResponse.json(
        { success: false, error: "Responsable non trouvé" },
        { status: 404 }
      )
    }

    // Générer le numéro de demande
    const year = new Date().getFullYear()
    const count = await prisma.demandeAbsence.count()
    const numero = `DA-ABS-${year}-${String(count + 1).padStart(4, "0")}`

    // Créer la demande
    const demande = (await (prisma.demandeAbsence as any).create({
      data: {
        numero,
        employeId: currentUser.id,
        responsableId,
        typeAbsence,
        motif,
        dateDebut: new Date(dateDebut),
        dateFin: new Date(dateFin),
        nombreJours,
        status: "brouillon" as any
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
        }
      }
    })) as any

    return NextResponse.json(
      {
        success: true,
        data: {
          ...demande,
          responsable: {
            id: responsable.id,
            nom: responsable.nom,
            prenom: responsable.prenom,
            email: responsable.email,
            phone: (responsable as any).phone || null
          }
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("❌ [API ABSENCES] Erreur POST:", error)
    return NextResponse.json({ success: false, error: (error as any).message }, { status: 500 })
  }
}

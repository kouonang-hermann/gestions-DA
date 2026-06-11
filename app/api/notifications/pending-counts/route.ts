import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

/**
 * GET /api/notifications/pending-counts
 *
 * Renvoie le nombre de demandes en attente d'action pour l'utilisateur connecté.
 * Utilisé pour afficher les pastilles (badges) permanents dans la navbar.
 *
 * Logique :
 *  - conges  : demandes au statut correspondant à l'étape de l'utilisateur
 *  - absences: idem
 *
 * Étapes selon le rôle :
 *  - Responsable hiérarchique : status = en_attente_validation_hierarchique ET responsableId = currentUser.id
 *  - responsable_rh           : status = en_attente_validation_rh
 *  - directeur_general        : status = en_attente_visa_dg
 *  - superadmin               : voit tous les en_attente_* cumulés
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 401 })
    }

    const userId = currentUser.id
    const role = currentUser.role as string

    // Construire les filtres en fonction du rôle (uniquement pour les congés ;
    // les absences passent par $queryRaw plus bas)
    const congeFilters: any[] = []

    // Toute personne peut être responsable hiérarchique d'un employé,
    // donc on regarde TOUJOURS les demandes "en attente hiérarchique" qui lui sont assignées
    congeFilters.push({
      status: "en_attente_validation_hierarchique",
      responsableId: userId,
    })

    if (role === "responsable_rh" || role === "superadmin") {
      congeFilters.push({ status: "en_attente_validation_rh" })
    }

    if (role === "directeur_general" || role === "superadmin") {
      congeFilters.push({ status: "en_attente_visa_dg" })
    }

    // ℹ️ Pour les ABSENCES on utilise $queryRaw : le client Prisma généré peut avoir
    // un enum AbsenceStatus out-of-sync avec le schéma (les valeurs
    // en_attente_validation_hierarchique / en_attente_validation_rh / en_attente_visa_dg
    // existent en base mais pas toujours dans le client TS). Le SQL brut contourne
    // la validation enum côté client.
    // Helper : exécute une promesse de comptage en isolant les erreurs DB
    // (ex. colonne manquante en cours de migration). Renvoie 0 et logge l'erreur
    // au lieu de faire crasher toute l'API (et donc le client qui appelle ce
    // endpoint en boucle pour les badges navbar).
    const safeCount = async (
      label: string,
      promise: Promise<number>
    ): Promise<number> => {
      try {
        return await promise
      } catch (err: any) {
        console.error(`[API PENDING-COUNTS] ${label} échoué :`, err?.message || err)
        return 0
      }
    }

    const countAbsencesByStatus = async (
      statusValue: string,
      responsableFilter?: string
    ): Promise<number> => {
      const rows = responsableFilter
        ? await prisma.$queryRaw<{ count: bigint }[]>`
            SELECT COUNT(*)::bigint AS count
            FROM "public"."demandes_absences"
            WHERE "status"::text = ${statusValue}
              AND "responsableId" = ${responsableFilter}
          `
        : await prisma.$queryRaw<{ count: bigint }[]>`
            SELECT COUNT(*)::bigint AS count
            FROM "public"."demandes_absences"
            WHERE "status"::text = ${statusValue}
          `
      return Number(rows[0]?.count ?? 0)
    }

    // Détail par étape (utile pour des tooltips détaillés)
    const [
      congesHierarchique,
      congesRh,
      congesDg,
      absencesHierarchique,
      absencesRh,
      absencesDg,
    ] = await Promise.all([
      safeCount(
        "conges.hierarchique",
        prisma.demandeConge.count({
          where: { status: "en_attente_validation_hierarchique", responsableId: userId },
        })
      ),
      role === "responsable_rh" || role === "superadmin"
        ? safeCount(
            "conges.rh",
            prisma.demandeConge.count({ where: { status: "en_attente_validation_rh" } })
          )
        : Promise.resolve(0),
      role === "directeur_general" || role === "superadmin"
        ? safeCount(
            "conges.dg",
            prisma.demandeConge.count({ where: { status: "en_attente_visa_dg" } })
          )
        : Promise.resolve(0),
      safeCount(
        "absences.hierarchique",
        countAbsencesByStatus("en_attente_validation_hierarchique", userId)
      ),
      role === "responsable_rh" || role === "superadmin"
        ? safeCount(
            "absences.rh",
            countAbsencesByStatus("en_attente_validation_rh")
          )
        : Promise.resolve(0),
      role === "directeur_general" || role === "superadmin"
        ? safeCount(
            "absences.dg",
            countAbsencesByStatus("en_attente_visa_dg")
          )
        : Promise.resolve(0),
    ])

    const congesPending = await safeCount(
      "conges.total",
      prisma.demandeConge.count({ where: { OR: congeFilters } })
    )
    const absencesPending = absencesHierarchique + absencesRh + absencesDg

    return NextResponse.json({
      success: true,
      data: {
        conges: {
          total: congesPending,
          hierarchique: congesHierarchique,
          rh: congesRh,
          dg: congesDg,
        },
        absences: {
          total: absencesPending,
          hierarchique: absencesHierarchique,
          rh: absencesRh,
          dg: absencesDg,
        },
      },
    })
  } catch (error: any) {
    console.error("❌ [API PENDING-COUNTS] Erreur :", error)
    return NextResponse.json(
      { success: false, error: error.message || "Erreur serveur" },
      { status: 500 }
    )
  }
}

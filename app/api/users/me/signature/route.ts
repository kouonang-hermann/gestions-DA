import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

/**
 * Endpoints de gestion de la signature numerique de l'utilisateur connecte.
 *
 * - GET    : recupere la signature actuelle (null si jamais cree)
 * - PATCH  : cree ou remplace la signature
 * - DELETE : supprime la signature
 *
 * La signature est stockee en TEXT (data URL base64 PNG) dans User.signature.
 * Elle est unique par utilisateur et reutilisee sur tous les documents qu'il
 * signe (demandes congs/absences, demandes materiel/outillage, bons de
 * sortie/livraison).
 *
 * Securite : chaque utilisateur ne peut modifier QUE sa propre signature
 * (resolue depuis le JWT, pas via un parametre d'URL).
 */

const MAX_SIGNATURE_BYTES = 200_000 // ~150 KB en base64 = ~110 KB binaire, large pour un canvas
const DATA_URL_PNG_PREFIX = "data:image/png;base64,"

// ---------------------------------------------------------------------------
// GET /api/users/me/signature
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Non autorise" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: {
        signature: true,
        signatureUpdatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        signature: user?.signature ?? null,
        signatureUpdatedAt: user?.signatureUpdatedAt ?? null,
        hasSignature: Boolean(user?.signature),
      },
    })
  } catch (error: any) {
    console.error("[API users/me/signature] GET error:", error)
    return NextResponse.json(
      { success: false, error: error.message ?? "Erreur serveur" },
      { status: 500 }
    )
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/users/me/signature
// Body : { signature: "data:image/png;base64,iVBORw0KGgo..." }
// ---------------------------------------------------------------------------
export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Non autorise" },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => null)
    const signature = body?.signature

    // Validation : data URL PNG base64 non vide
    if (typeof signature !== "string" || !signature.startsWith(DATA_URL_PNG_PREFIX)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Format invalide : la signature doit etre un data URL PNG base64 (data:image/png;base64,...)",
        },
        { status: 400 }
      )
    }

    const base64Part = signature.slice(DATA_URL_PNG_PREFIX.length)
    if (base64Part.length === 0) {
      return NextResponse.json(
        { success: false, error: "Signature vide" },
        { status: 400 }
      )
    }

    if (signature.length > MAX_SIGNATURE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: `Signature trop volumineuse (max ${MAX_SIGNATURE_BYTES} caracteres)`,
        },
        { status: 413 }
      )
    }

    // Validation legere du base64 (caracteres autorises uniquement)
    if (!/^[A-Za-z0-9+/=]+$/.test(base64Part)) {
      return NextResponse.json(
        { success: false, error: "Donnees base64 invalides" },
        { status: 400 }
      )
    }

    const updated = await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        signature,
        signatureUpdatedAt: new Date(),
      },
      select: {
        signature: true,
        signatureUpdatedAt: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        signature: updated.signature,
        signatureUpdatedAt: updated.signatureUpdatedAt,
        hasSignature: true,
      },
    })
  } catch (error: any) {
    console.error("[API users/me/signature] PATCH error:", error)
    return NextResponse.json(
      { success: false, error: error.message ?? "Erreur serveur" },
      { status: 500 }
    )
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/users/me/signature
// ---------------------------------------------------------------------------
export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser(request)
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Non autorise" },
        { status: 401 }
      )
    }

    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        signature: null,
        signatureUpdatedAt: null,
      },
    })

    return NextResponse.json({
      success: true,
      data: { hasSignature: false },
    })
  } catch (error: any) {
    console.error("[API users/me/signature] DELETE error:", error)
    return NextResponse.json(
      { success: false, error: error.message ?? "Erreur serveur" },
      { status: 500 }
    )
  }
}

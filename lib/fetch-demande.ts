import { useStore } from "@/stores/useStore"

/**
 * Récupère une demande complète et enrichie (avec les images de signature) depuis
 * `GET /api/demandes/[id]`.
 *
 * Utilisé UNIQUEMENT au moment de générer un PDF : les signatures base64 ne sont plus
 * embarquées dans la liste `GET /api/demandes` (optimisation de bande passante Vercel),
 * elles sont donc chargées à la demande ici.
 *
 * En cas d'échec, retourne `null` : l'appelant peut alors se rabattre sur la demande
 * déjà présente en mémoire (le PDF reste généré, éventuellement sans image de signature).
 */
export async function fetchDemandeById(id: string): Promise<any | null> {
  try {
    const token = useStore.getState().token
    const res = await fetch(`/api/demandes/${id}`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
    const data = await res.json()
    if (data?.success && data.data) return data.data
    return null
  } catch {
    return null
  }
}

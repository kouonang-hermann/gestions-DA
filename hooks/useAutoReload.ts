"use client"

import { useEffect, useRef } from "react"
import { useStore } from "@/stores/useStore"

// Cache global pour éviter les appels multiples entre dashboards
// OPTIMISÉ: Augmenté de 30s à 60s pour réduire les appels API sur Vercel
let lastGlobalLoad = 0
const CACHE_DURATION = 60000 // 60 secondes de cache

/**
 * Hook personnalisé pour le rechargement automatique des données
 * OPTIMISÉ: Utilise un cache global pour éviter les appels API redondants
 */
export function useAutoReload(dashboardName: string) {
  const { currentUser, loadDemandes, demandes, users, projets } = useStore()
  const hasLoadedRef = useRef(false)

  // Rechargement automatique au montage - UNIQUEMENT si cache expiré
  useEffect(() => {
    const reloadIfNeeded = async () => {
      if (!currentUser?.id || !currentUser?.nom) return
      
      const now = Date.now()
      
      // Si données déjà en cache et pas expirées, ne pas recharger
      if (demandes.length > 0 && now - lastGlobalLoad < CACHE_DURATION) {
        return
      }
      
      // Éviter les appels multiples pour le même composant
      if (hasLoadedRef.current) return
      hasLoadedRef.current = true
      
      try {
        // Charger uniquement les demandes (essentiel)
        await loadDemandes()
        lastGlobalLoad = Date.now()
      } catch (error) {
        // Ignorer silencieusement
      }
    }

    const timer = setTimeout(reloadIfNeeded, 500)
    return () => {
      clearTimeout(timer)
      hasLoadedRef.current = false
    }
  }, [currentUser?.id, loadDemandes, demandes.length])

  // Fonction de rechargement manuel - force le rechargement
  const handleManualReload = async () => {
    try {
      await loadDemandes()
      lastGlobalLoad = Date.now()
    } catch (error) {
      // Ignorer silencieusement
    }
  }

  return {
    handleManualReload
  }
}

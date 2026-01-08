"use client"

import { useEffect, useState } from "react"
import { useStore } from "@/stores/useStore"

/**
 * Hook pour gérer l'hydratation Zustand avec Next.js
 * 
 * Ce hook résout le problème de mismatch d'hydratation qui se produit
 * lorsque Zustand persist est utilisé avec Next.js :
 * - Le serveur ne connaît pas l'état persisté dans localStorage
 * - Le client charge l'état persisté
 * - Cela crée un mismatch entre le rendu serveur et client
 * 
 * Solution : Attendre que le composant soit monté côté client
 * avant d'afficher les données du store
 */
export function useHydration() {
  const [hydrated, setHydrated] = useState(false)
  const hasHydrated = useStore((state) => state._hasHydrated)

  useEffect(() => {
    // Ce code ne s'exécute que côté client
    // On attend que Zustand soit hydraté depuis localStorage
    if (hasHydrated) {
      setHydrated(true)
    } else {
      // Fallback : si onRehydrateStorage n'est pas appelé après 100ms, on force
      const timeout = setTimeout(() => {
        setHydrated(true)
      }, 100)
      return () => clearTimeout(timeout)
    }
  }, [hasHydrated])

  return hydrated
}

/**
 * Hook alternatif qui retourne un état et une fonction de chargement
 * Utilise directement l'état du store Zustand
 */
export function useStoreHydration() {
  const hasHydrated = useStore((state) => state._hasHydrated)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    if (hasHydrated) {
      setIsHydrated(true)
    } else {
      // Fallback : forcer l'hydratation après un court délai
      const timeout = setTimeout(() => {
        setIsHydrated(true)
      }, 100)
      return () => clearTimeout(timeout)
    }
  }, [hasHydrated])

  return { isHydrated }
}

export default useHydration

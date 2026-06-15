"use client"

import { useState, useEffect, useCallback } from "react"

const MOBILE_BREAKPOINT = 768

/**
 * Hook optimisé pour détecter si l'appareil est mobile
 * - Vérification SSR sécurisée (typeof window !== 'undefined')
 * - Support des appareils tactiles (pointer: coarse)
 * - Debounce pour éviter les re-renders excessifs sur resize
 */
export function useIsMobile() {
  // Fonction de détection initiale sécurisée
  const getInitialState = useCallback((): boolean => {
    if (typeof window === 'undefined') return false
    
    // Détection par media query (taille d'écran)
    const isSmallScreen = window.innerWidth < MOBILE_BREAKPOINT
    
    // Détection par type de pointeur (tactile)
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches
    
    // Considérer comme mobile si petit écran OU appareil tactile
    return isSmallScreen || isTouchDevice
  }, [])

  const [isMobile, setIsMobile] = useState<boolean>(getInitialState)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // Marquer comme monté (évite les erreurs d'hydratation)
    setIsMounted(true)
    
    // Vérification SSR
    if (typeof window === 'undefined') return

    let resizeTimeout: ReturnType<typeof setTimeout> | null = null

    const checkMobile = () => {
      // Debounce pour éviter les calculs excessifs sur resize
      if (resizeTimeout) clearTimeout(resizeTimeout)
      
      resizeTimeout = setTimeout(() => {
        const isSmallScreen = window.innerWidth < MOBILE_BREAKPOINT
        const isTouchDevice = window.matchMedia('(pointer: coarse)').matches
        setIsMobile(isSmallScreen || isTouchDevice)
      }, 100) // 100ms debounce
    }

    // Vérification initiale
    checkMobile()

    // Écouteurs d'événements avec options passive (optimisation mobile)
    window.addEventListener('resize', checkMobile, { passive: true })
    
    // Écouteur pour changement d'orientation (mobile)
    window.addEventListener('orientationchange', checkMobile, { passive: true })

    return () => {
      if (resizeTimeout) clearTimeout(resizeTimeout)
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('orientationchange', checkMobile)
    }
  }, [])

  // Retourner false pendant le SSR, puis la vraie valeur après montage
  // Cela évite les erreurs d'hydratation React
  return isMounted ? isMobile : false
}

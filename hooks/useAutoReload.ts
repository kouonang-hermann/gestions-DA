"use client"

import { useEffect } from "react"
import { useStore } from "@/stores/useStore"

/**
 * Hook personnalisé pour le rechargement automatique des données
 * Utilisé par tous les dashboards des valideurs
 */
export function useAutoReload(dashboardName: string) {
  const { currentUser, loadDemandes, loadUsers, loadProjets } = useStore()

  // Rechargement automatique au montage du composant
  useEffect(() => {
    const reloadAllData = async () => {
      if (currentUser && currentUser.id && currentUser.nom) {
        try {
          // Recharger les données essentielles d'abord
          await loadDemandes()
          
          // Charger les utilisateurs (ignorer l'erreur si pas autorisé - normal pour les employés)
          try {
            await loadUsers()
          } catch (error) {
            // Ignorer l'erreur - normal pour les employés
          }
          
          // Attendre un peu plus avant de charger les projets
          await new Promise(resolve => setTimeout(resolve, 200))
          
          // Charger les projets en dernier et ignorer les erreurs d'authentification
          try {
            await loadProjets()
          } catch (error) {
            // Ignorer l'erreur d'authentification temporaire
          }
        } catch (error) {
          console.error(`❌ [${dashboardName}] Erreur lors du rechargement:`, error)
        }
      }
    }

    // Attendre un délai plus long pour s'assurer que l'utilisateur est complètement chargé
    const timer = setTimeout(reloadAllData, 1000)
    return () => clearTimeout(timer)
  }, [currentUser?.id, loadDemandes, loadUsers, loadProjets, dashboardName])

  // Fonction de rechargement manuel
  const handleManualReload = async () => {
    try {
      // Recharger les demandes (essentiel)
      await loadDemandes()
      
      // Recharger les utilisateurs (ignorer si pas autorisé)
      try {
        await loadUsers()
      } catch (error) {
        // Ignorer l'erreur
      }
      
      // Recharger les projets (ignorer si erreur)
      try {
        await loadProjets()
      } catch (error) {
        // Ignorer l'erreur
      }
    } catch (error) {
      console.error(`❌ [${dashboardName}] Erreur lors du rechargement manuel:`, error)
    }
  }

  return {
    handleManualReload
  }
}

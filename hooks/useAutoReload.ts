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
        console.log(`🔄 [${dashboardName}] Rechargement automatique des données pour ${currentUser.nom} (${currentUser.role})`)
        
        try {
          // Recharger les données essentielles d'abord
          console.log(`🔄 [${dashboardName}] Chargement des demandes...`)
          await loadDemandes()
          
          // Charger les utilisateurs (ignorer l'erreur si pas autorisé - normal pour les employés)
          console.log(`🔄 [${dashboardName}] Chargement des utilisateurs...`)
          try {
            await loadUsers()
          } catch (error) {
            console.warn(`⚠️ [${dashboardName}] Chargement utilisateurs non autorisé (normal pour certains rôles)`)
          }
          
          // Attendre un peu plus avant de charger les projets pour s'assurer que l'auth est stable
          await new Promise(resolve => setTimeout(resolve, 200))
          
          // Charger les projets en dernier et ignorer les erreurs d'authentification
          console.log(`🔄 [${dashboardName}] Chargement des projets...`)
          try {
            await loadProjets()
          } catch (error) {
            console.warn(`⚠️ [${dashboardName}] Erreur lors du chargement des projets (ignorée)`)
          }
          
          console.log(`✅ [${dashboardName}] Rechargement terminé`)
        } catch (error) {
          console.error(`❌ [${dashboardName}] Erreur lors du rechargement:`, error)
        }
      } else {
        console.log(`⏳ [${dashboardName}] En attente de l'authentification complète...`)
      }
    }

    // Attendre un délai plus long pour s'assurer que l'utilisateur est complètement chargé
    const timer = setTimeout(reloadAllData, 1000)
    return () => clearTimeout(timer)
  }, [currentUser?.id, loadDemandes, loadUsers, loadProjets, dashboardName])

  // Fonction de rechargement manuel
  const handleManualReload = async () => {
    console.log(`🔄 [${dashboardName}] Rechargement manuel déclenché`)
    
    try {
      // Recharger les demandes (essentiel)
      await loadDemandes()
      
      // Recharger les utilisateurs (ignorer si pas autorisé)
      try {
        await loadUsers()
      } catch (error) {
        console.warn(`⚠️ [${dashboardName}] Chargement utilisateurs non autorisé`)
      }
      
      // Recharger les projets (ignorer si erreur)
      try {
        await loadProjets()
      } catch (error) {
        console.warn(`⚠️ [${dashboardName}] Erreur chargement projets`)
      }
      
      console.log(`✅ [${dashboardName}] Rechargement manuel terminé avec succès`)
    } catch (error) {
      console.error(`❌ [${dashboardName}] Erreur lors du rechargement manuel:`, error)
    }
  }

  return {
    handleManualReload
  }
}

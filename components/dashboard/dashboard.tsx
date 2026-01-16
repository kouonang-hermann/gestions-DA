"use client"

import { useStore } from "@/stores/useStore"
import SuperAdminDashboard from "./super-admin-dashboard"
import EmployeDashboard from "./employe-dashboard"
import ConducteurDashboard from "./conducteur-dashboard"
import ResponsableTravauxDashboard from "./responsable-travaux-dashboard"
import ApproDashboard from "./appro-dashboard"
import ChargeAffaireDashboard from "./charge-affaire-dashboard"
import ResponsableLogistiqueDashboard from "./responsable-logistique-dashboard"
import ResponsableLivreurDashboard from "./responsable-livreur-dashboard"

export default function Dashboard() {
  const { currentUser } = useStore()

  if (!currentUser) {
    return (
      <div className="container mx-auto px-6 py-6">
        <div className="text-center p-8 text-gray-500">
          Erreur : Utilisateur non connecté
        </div>
      </div>
    )
  }

  const renderDashboard = () => {
    console.log(`🔍 [DASHBOARD-ROUTER] Rôle utilisateur: ${currentUser.role}`)
    
    try {
      switch (currentUser.role) {
        case "superadmin":
          console.log("➡️ [DASHBOARD-ROUTER] Chargement SuperAdminDashboard")
          return <SuperAdminDashboard />
        case "employe":
          console.log("➡️ [DASHBOARD-ROUTER] Chargement EmployeDashboard")
          return <EmployeDashboard />
        case "conducteur_travaux":
          console.log("➡️ [DASHBOARD-ROUTER] Chargement ConducteurDashboard")
          return <ConducteurDashboard />
        case "responsable_travaux":
          console.log("➡️ [DASHBOARD-ROUTER] Chargement ResponsableTravauxDashboard")
          return <ResponsableTravauxDashboard />
        case "responsable_logistique":
          console.log("➡️ [DASHBOARD-ROUTER] Chargement ResponsableLogistiqueDashboard")
          return <ResponsableLogistiqueDashboard />
        case "responsable_appro":
          console.log("➡️ [DASHBOARD-ROUTER] Chargement ApproDashboard")
          return <ApproDashboard />
        case "charge_affaire":
          console.log("➡️ [DASHBOARD-ROUTER] Chargement ChargeAffaireDashboard")
          return <ChargeAffaireDashboard />
        case "responsable_livreur":
          console.log("➡️ [DASHBOARD-ROUTER] Chargement ResponsableLivreurDashboard")
          return <ResponsableLivreurDashboard />
        default:
          return (
            <div className="p-6 text-center text-gray-500">
              Rôle non reconnu: {currentUser.role}
              <br />
              <small className="text-gray-400">Rôles disponibles: superadmin, employe, conducteur_travaux, responsable_travaux, responsable_logistique, responsable_appro, charge_affaire, responsable_livreur</small>
            </div>
          )
      }
    } catch (error) {
      console.error("Erreur lors du rendu du dashboard:", error)
      return (
        <div className="p-6 text-center text-red-500">
          Erreur lors du chargement du tableau de bord
        </div>
      )
    }
  }

  return (
    <>

      <div className="container mx-auto px-6 py-6">{renderDashboard()}</div>
    </>
  )
}

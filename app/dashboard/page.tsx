"use client"

import { useEffect } from "react"
import { useStore } from "@/stores/useStore"
import { useRouter } from "next/navigation"
import { useHydration } from "@/hooks/useHydration"
import EmployeDashboard from "@/components/dashboard/employe-dashboard"
import SuperAdminDashboard from "@/components/dashboard/super-admin-dashboard"
import ConducteurDashboard from "@/components/dashboard/conducteur-dashboard"
import ResponsableTravauxDashboard from "@/components/dashboard/responsable-travaux-dashboard"
import ChargeAffaireDashboard from "@/components/dashboard/charge-affaire-dashboard"
import ApproDashboard from "@/components/dashboard/appro-dashboard"
import ResponsableLogistiqueDashboard from "@/components/dashboard/responsable-logistique-dashboard"
import ResponsableLivreurDashboard from "@/components/dashboard/responsable-livreur-dashboard"

export default function DashboardPage() {
  const { currentUser, isAuthenticated } = useStore()
  const router = useRouter()
  const isHydrated = useHydration()

  useEffect(() => {
    // Attendre l'hydratation avant de rediriger
    if (isHydrated && (!isAuthenticated || !currentUser)) {
      router.push("/")
      return
    }
  }, [isAuthenticated, currentUser, router, isHydrated])

  // Attendre l'hydratation
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-600">Chargement de l'application...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Redirection...</span>
      </div>
    )
  }

  // Afficher le dashboard selon le rôle de l'utilisateur
  switch (currentUser.role) {
    case "superadmin":
      return <SuperAdminDashboard />
    case "conducteur_travaux":
      return <ConducteurDashboard />
    case "responsable_travaux":
      return <ResponsableTravauxDashboard />
    case "responsable_logistique":
      return <ResponsableLogistiqueDashboard />
    case "charge_affaire":
      return <ChargeAffaireDashboard />
    case "responsable_appro":
      return <ApproDashboard />
    case "responsable_livreur":
      return <ResponsableLivreurDashboard />
    case "employe":
    default:
      return <EmployeDashboard />
  }
}

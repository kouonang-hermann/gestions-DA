"use client"

import { useEffect } from "react"
import { useStore } from "@/stores/useStore"
import { useRouter } from "next/navigation"
import EmployeDashboard from "@/components/dashboard/employe-dashboard"
import SuperAdminDashboard from "@/components/dashboard/super-admin-dashboard"
import ConducteurDashboard from "@/components/dashboard/conducteur-dashboard"
import ResponsableTravauxDashboard from "@/components/dashboard/responsable-travaux-dashboard"
import QHSEDashboard from "@/components/dashboard/qhse-dashboard"
import ChargeAffaireDashboard from "@/components/dashboard/charge-affaire-dashboard"
import ApproDashboard from "@/components/dashboard/appro-dashboard"
import ResponsableLogistiqueDashboard from "@/components/dashboard/responsable-logistique-dashboard"

export default function DashboardPage() {
  const { currentUser, isAuthenticated } = useStore()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated || !currentUser) {
      router.push("/")
      return
    }
  }, [isAuthenticated, currentUser, router])

  if (!isAuthenticated || !currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Chargement...</span>
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
      return <QHSEDashboard />
    case "charge_affaire":
      return <ChargeAffaireDashboard />
    case "responsable_appro":
      return <ApproDashboard />
    case "responsable_livreur":
      return <ResponsableLogistiqueDashboard />
    case "employe":
    default:
      return <EmployeDashboard />
  }
}

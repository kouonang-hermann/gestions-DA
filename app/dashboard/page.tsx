"use client"

import { useEffect } from "react"
import { useStore } from "@/stores/useStore"
import { useRouter } from "next/navigation"
import EmployeDashboard from "@/components/dashboard/employe-dashboard"
import SuperAdminDashboard from "@/components/dashboard/super-admin-dashboard"

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
  if (currentUser.role === "superadmin") {
    return <SuperAdminDashboard />
  }

  return <EmployeDashboard />
}

"use client"

import { useStore } from "@/stores/useStore"
import LoginForm from "@/components/auth/login-form"
import Navbar from "@/components/layout/navbar"
import Dashboard from "@/components/dashboard/dashboard"
import { useHydration } from "@/hooks/useHydration"

export default function HomePage() {
  const { isAuthenticated } = useStore()
  const isHydrated = useHydration()

  // Attendre que l'hydratation soit terminée avant d'afficher quoi que ce soit
  // Cela évite le mismatch entre le rendu serveur et client
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-600">Chargement de l'application...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginForm />
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Dashboard />
    </div>
  )
}

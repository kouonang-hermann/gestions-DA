"use client"

import { useStore } from "@/stores/useStore"
import Navbar from "./navbar"
import { TooltipProvider } from "@/components/ui/tooltip"

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useStore()
  
  // Afficher la Navbar uniquement si l'utilisateur est authentifié
  const showNavbar = isAuthenticated
  
  return (
    <TooltipProvider delayDuration={200}>
      {showNavbar && <Navbar />}
      {children}
    </TooltipProvider>
  )
}

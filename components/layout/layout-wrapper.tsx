"use client"

import { useStore } from "@/stores/useStore"
import Navbar from "./navbar"

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useStore()
  
  // Afficher la Navbar uniquement si l'utilisateur est authentifié
  const showNavbar = isAuthenticated
  
  return (
    <>
      {showNavbar && <Navbar />}
      {children}
    </>
  )
}

"use client"

import { useStore } from "@/stores/useStore"
import Navbar from "./navbar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { SignatureProvider } from "@/hooks/use-ensure-signature"
import MobileInjectorWrapper from "@/components/mobile/mobile-injector-wrapper"

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useStore()
  
  // Afficher la Navbar uniquement si l'utilisateur est authentifié
  const showNavbar = isAuthenticated
  
  return (
    <TooltipProvider delayDuration={200}>
      <SignatureProvider>
        <MobileInjectorWrapper />
        {showNavbar && <Navbar />}
        {children}
      </SignatureProvider>
    </TooltipProvider>
  )
}

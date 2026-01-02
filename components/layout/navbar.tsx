"use client"

import { Bell, LogOut, Settings, Menu, X, KeyRound } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useStore } from "@/stores/useStore"
import InstrumElecLogo from "@/components/ui/instrumelec-logo"
import Link from "next/link"
import ChangePasswordModal from "@/components/modals/change-password-modal"

const roleLabels: Record<string, string> = {
  superadmin: "Super Administrateur",
  employe: "Employé",
  technicien: "Technicien",
  conducteur_travaux: "Conducteur de Travaux",
  responsable_travaux: "Responsable Travaux",
  responsable_logistique: "Responsable Logistique",
  responsable_appro: "Responsable Approvisionnements",
  charge_affaire: "Chargé d'Affaire",
  responsable_livreur: "Responsable Livreur",
}

export default function Navbar() {
  const { currentUser, logout, notifications, startNotificationPolling, stopNotificationPolling } = useStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false)
  const router = useRouter()

  // Démarrer le polling des notifications au montage du composant
  useEffect(() => {
    if (currentUser) {
      const intervalId = startNotificationPolling()
      
      // Nettoyer l'intervalle au démontage
      return () => {
        if (intervalId) {
          stopNotificationPolling(intervalId)
        }
      }
    }
  }, [currentUser, startNotificationPolling, stopNotificationPolling])

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <nav className="border-b bg-white border-gray-200 shadow-sm sticky top-0 z-40">
      <div className="flex h-14 sm:h-16 items-center px-4 sm:px-6 justify-between">
        <div className="flex items-center space-x-3 sm:space-x-6">
          <Link href="/" className="flex items-center space-x-2">
            <InstrumElecLogo size="sm" showText={false} />
            <span className="text-lg sm:text-xl font-bold text-gray-800 hidden sm:block">Gestion Demandes</span>
            <span className="text-sm font-bold text-gray-800 sm:hidden">GDM</span>
          </Link>

          {currentUser && (
            <div className="hidden lg:flex items-center space-x-1 text-sm text-gray-600">
              <span>Connecté en tant que</span>
              <span className="font-medium text-blue-600">{roleLabels[currentUser.role]}</span>
            </div>
          )}
        </div>

        {/* Desktop Navigation */}
        <div className="hidden sm:flex items-center space-x-2 sm:space-x-4">
          {currentUser?.role === "superadmin" && (
            <Button asChild variant="outline" size="sm" className="border-gray-300 hover:bg-gray-50 bg-transparent">
              <Link href="/admin">
                <Settings className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">Administration</span>
                <span className="md:hidden">Admin</span>
              </Link>
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative hover:bg-gray-100"
                onClick={() => router.push('/notifications')}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-white border-gray-200">
              <DropdownMenuLabel className="text-gray-800">Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-200" />
              {notifications.length === 0 ? (
                <div className="p-4 text-sm text-gray-500 text-center">Aucune notification</div>
              ) : (
                notifications.slice(0, 5).map((notification) => (
                  <DropdownMenuItem key={notification.id} className="flex flex-col items-start p-4 hover:bg-gray-50">
                    <div className="font-medium text-gray-800">{notification.title}</div>
                    <div className="text-sm text-gray-600">{notification.message}</div>
                    <div className="text-xs text-gray-400 mt-1">{notification.timestamp.toLocaleString()}</div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {currentUser?.prenom?.[0]}
                      {currentUser?.nom?.[0]}
                    </span>
                  </div>
                  <span className="hidden lg:block text-gray-700">
                    {currentUser?.prenom} {currentUser?.nom}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border-gray-200">
              <DropdownMenuLabel className="text-gray-800">
                <div>
                  <div className="font-medium">
                    {currentUser?.prenom} {currentUser?.nom}
                  </div>
                  <div className="text-sm font-normal text-gray-600">{currentUser && roleLabels[currentUser.role]}</div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-200" />
              <DropdownMenuItem onClick={() => setChangePasswordModalOpen(true)} className="hover:bg-blue-50">
                <KeyRound className="mr-2 h-4 w-4" />
                Changer mot de passe
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout} className="text-red-600 hover:bg-red-50">
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Navigation */}
        <div className="sm:hidden">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle className="text-left">Menu</SheetTitle>
              </SheetHeader>
              
              <div className="mt-6 space-y-4">
                {/* User Info */}
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {currentUser?.prenom?.[0]}
                      {currentUser?.nom?.[0]}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">
                      {currentUser?.prenom} {currentUser?.nom}
                    </div>
                    <div className="text-sm text-gray-600">{currentUser && roleLabels[currentUser.role]}</div>
                  </div>
                </div>

                {/* Notifications */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-800">Notifications</h3>
                    {unreadCount > 0 && (
                      <Badge className="bg-red-500 text-white">{unreadCount}</Badge>
                    )}
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <div className="text-sm text-gray-500 text-center py-4">Aucune notification</div>
                    ) : (
                      notifications.slice(0, 3).map((notification) => (
                        <div key={notification.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="font-medium text-sm text-gray-800">{notification.title}</div>
                          <div className="text-xs text-gray-600 mt-1">{notification.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Admin Link */}
                {currentUser?.role === "superadmin" && (
                  <Button asChild variant="outline" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                    <Link href="/admin">
                      <Settings className="h-4 w-4 mr-2" />
                      Administration
                    </Link>
                  </Button>
                )}

                {/* Change Password */}
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => {
                    setChangePasswordModalOpen(true)
                    setMobileMenuOpen(false)
                  }}
                >
                  <KeyRound className="h-4 w-4 mr-2" />
                  Changer mot de passe
                </Button>

                {/* Logout */}
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => {
                    logout()
                    setMobileMenuOpen(false)
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnexion
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Modal de changement de mot de passe */}
      <ChangePasswordModal
        isOpen={changePasswordModalOpen}
        onClose={() => setChangePasswordModalOpen(false)}
      />
    </nav>
  )
}

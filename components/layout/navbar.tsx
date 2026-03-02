"use client"

import { Bell, LogOut, Settings, Menu, X, KeyRound, BarChart3, FileText, DollarSign, Laptop, Calendar, UserX, ClipboardList, FileBarChart } from "lucide-react"
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
import { CongesModal } from "@/components/conges/conges-modal"
import AbsenceActionsModal from "@/components/absence/absence-actions-modal"
import CreateAbsenceModal from "@/components/absence/create-absence-modal"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

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
  responsable_rh: "Responsable RH",
  directeur_general: "Directeur Général",
}

export default function Navbar() {
  const { currentUser, logout, notifications, startNotificationPolling, stopNotificationPolling } = useStore()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false)
  const [congesModalOpen, setCongesModalOpen] = useState(false)
  const [absenceActionsModalOpen, setAbsenceActionsModalOpen] = useState(false)
  const [createAbsenceModalOpen, setCreateAbsenceModalOpen] = useState(false)
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
        <div className="hidden sm:flex items-center gap-2 overflow-x-auto max-w-[calc(100vw-400px)] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {/* Boutons pour tous les utilisateurs */}
          {currentUser && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="outline" size="sm" className="border-0 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 hover:from-blue-200 hover:via-purple-200 hover:to-pink-200 shadow-sm hover:shadow-md transition-all duration-300 whitespace-nowrap flex-shrink-0">
                    <Link href="/dashboard" className="font-medium text-gray-700">
                      <FileText className="h-4 w-4 mr-1.5" />
                      <span>DA</span>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={6}>
                  Demandes d'achat
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="outline" size="sm" className="border-0 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 hover:from-blue-200 hover:via-purple-200 hover:to-pink-200 shadow-sm hover:shadow-md transition-all duration-300 whitespace-nowrap flex-shrink-0">
                    <Link href="/d-paye" className="font-medium text-gray-700">
                      <DollarSign className="h-4 w-4 mr-1.5" />
                      <span>D-paye</span>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={6}>
                  Demandes de paye
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="outline" size="sm" className="border-0 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 hover:from-blue-200 hover:via-purple-200 hover:to-pink-200 shadow-sm hover:shadow-md transition-all duration-300 whitespace-nowrap flex-shrink-0">
                    <Link href="/dit" className="font-medium text-gray-700">
                      <Laptop className="h-4 w-4 mr-1.5" />
                      <span>DIT</span>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={6}>
                  Demandes IT
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="outline" size="sm" className="border-0 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 hover:from-blue-200 hover:via-purple-200 hover:to-pink-200 shadow-sm hover:shadow-md transition-all duration-300 whitespace-nowrap flex-shrink-0">
                    <Link href="/d-conges" className="font-medium text-gray-700">
                      <Calendar className="h-4 w-4 mr-1.5" />
                      <span>D-congés</span>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={6}>
                  Demandes de congés
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="outline" size="sm" className="border-0 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 hover:from-blue-200 hover:via-purple-200 hover:to-pink-200 shadow-sm hover:shadow-md transition-all duration-300 whitespace-nowrap flex-shrink-0">
                    <Link href="/d-absence" className="font-medium text-gray-700">
                      <UserX className="h-4 w-4 mr-1.5" />
                      <span>D-absence</span>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={6}>
                  Demandes d'absence
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="outline" size="sm" className="border-0 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 hover:from-blue-200 hover:via-purple-200 hover:to-pink-200 shadow-sm hover:shadow-md transition-all duration-300 whitespace-nowrap flex-shrink-0">
                    <Link href="/rapport-journalier" className="font-medium text-gray-700">
                      <ClipboardList className="h-4 w-4 mr-1.5" />
                      <span>Rapport J.</span>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={6}>
                  Rapport journalier
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="outline" size="sm" className="border-0 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 hover:from-blue-200 hover:via-purple-200 hover:to-pink-200 shadow-sm hover:shadow-md transition-all duration-300 whitespace-nowrap flex-shrink-0">
                    <Link href="/rapport-mensuel" className="font-medium text-gray-700">
                      <FileBarChart className="h-4 w-4 mr-1.5" />
                      <span>Rapport M.</span>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={6}>
                  Rapport mensuel
                </TooltipContent>
              </Tooltip>
            </>
          )}

          {currentUser?.role === "superadmin" && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="outline" size="sm" className="border-0 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 hover:from-blue-200 hover:via-purple-200 hover:to-pink-200 shadow-sm hover:shadow-md transition-all duration-300 whitespace-nowrap flex-shrink-0">
                    <Link href="/finance" className="font-medium text-gray-700">
                      <BarChart3 className="h-4 w-4 mr-1.5" />
                      <span>Analyse</span>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={6}>
                  Accéder au tableau de bord financier
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild variant="outline" size="sm" className="border-0 bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 hover:from-blue-200 hover:via-purple-200 hover:to-pink-200 shadow-sm hover:shadow-md transition-all duration-300 whitespace-nowrap flex-shrink-0">
                    <Link href="/admin" className="font-medium text-gray-700">
                      <Settings className="h-4 w-4 mr-1.5" />
                      <span>Admin</span>
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" sideOffset={6}>
                  Gestion des utilisateurs, projets et paramètres
                </TooltipContent>
              </Tooltip>
            </>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="relative hover:bg-gray-100"
                onClick={() => router.push('/notifications')}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-red-500 text-white border-2 border-white animate-pulse">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Badge>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6}>
              Notifications
            </TooltipContent>
          </Tooltip>

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
                      <Badge className="bg-red-500 text-white animate-pulse">{unreadCount}</Badge>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      router.push('/notifications')
                      setMobileMenuOpen(false)
                    }}
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Voir toutes les notifications
                  </Button>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <div className="text-sm text-gray-500 text-center py-4">Aucune notification</div>
                    ) : (
                      notifications.slice(0, 3).map((notification) => (
                        <div 
                          key={notification.id} 
                          className={`p-3 rounded-lg cursor-pointer ${notification.read ? 'bg-gray-50' : 'bg-blue-50 border border-blue-200'}`}
                          onClick={() => {
                            router.push('/notifications')
                            setMobileMenuOpen(false)
                          }}
                        >
                          <div className={`font-medium text-sm ${notification.read ? 'text-gray-800' : 'text-gray-900'}`}>
                            {notification.title || notification.titre}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">{notification.message}</div>
                          {!notification.read && !notification.lu && (
                            <Badge className="mt-2 bg-blue-600 text-white text-[10px]">Nouveau</Badge>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Boutons pour tous les utilisateurs */}
                {currentUser && (
                  <>
                    <Button asChild variant="outline" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                      <Link href="/dashboard">
                        <FileText className="h-4 w-4 mr-2" />
                        DA
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                      <Link href="/d-paye">
                        <DollarSign className="h-4 w-4 mr-2" />
                        D-paye
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                      <Link href="/dit">
                        <Laptop className="h-4 w-4 mr-2" />
                        DIT
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                      <Link href="/d-conges">
                        <Calendar className="h-4 w-4 mr-2" />
                        D-congés
                      </Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      onClick={() => {
                        setMobileMenuOpen(false)
                        setAbsenceActionsModalOpen(true)
                      }}
                    >
                      <UserX className="h-4 w-4 mr-2" />
                      D-absence
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                      <Link href="/rapport-journalier">
                        <ClipboardList className="h-4 w-4 mr-2" />
                        Rapport journalier
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                      <Link href="/rapport-mensuel">
                        <FileBarChart className="h-4 w-4 mr-2" />
                        Rapport mensuel
                      </Link>
                    </Button>
                  </>
                )}

                {/* Admin Link */}
                {currentUser?.role === "superadmin" && (
                  <>
                    <Button asChild variant="outline" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                      <Link href="/finance">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Analyse
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start" onClick={() => setMobileMenuOpen(false)}>
                      <Link href="/admin">
                        <Settings className="h-4 w-4 mr-2" />
                        Administration
                      </Link>
                    </Button>
                  </>
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

      {/* Modal de gestion des congés */}
      <CongesModal
        open={congesModalOpen}
        onOpenChange={setCongesModalOpen}
      />

      {/* Modal de choix d'action pour les absences */}
      <AbsenceActionsModal
        open={absenceActionsModalOpen}
        onOpenChange={setAbsenceActionsModalOpen}
        onCreateNew={() => {
          setAbsenceActionsModalOpen(false)
          setCreateAbsenceModalOpen(true)
        }}
        onViewExisting={() => {
          setAbsenceActionsModalOpen(false)
          router.push("/d-absence")
        }}
      />

      {/* Modal de création de demande d'absence */}
      <CreateAbsenceModal
        open={createAbsenceModalOpen}
        onOpenChange={setCreateAbsenceModalOpen}
        onSuccess={() => {
          setCreateAbsenceModalOpen(false)
          router.push("/d-absence")
        }}
      />
    </nav>
  )
}

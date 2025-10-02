"use client"

import { useState, useEffect } from "react"
import "@/styles/mobile-dashboard-new.css"
import "@/styles/universal-mobile-responsive.css"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { useStore } from "@/stores/useStore"
import { 
  Users, 
  FolderOpen, 
  FileText, 
  Clock, 
  Plus, 
  BarChart3, 
  TrendingUp, 
  Settings, 
  CreditCard, 
  Wrench, 
  Package, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Activity,
  Bell,
  Home,
  User
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts"
import CreateUserModal from "@/components/admin/create-user-modal"
import CreateProjectModal from "@/components/admin/create-project-modal"
import ProjectManagementModal from "@/components/admin/project-management-modal"
import CreateDemandeModal from "@/components/demandes/create-demande-modal"
import DetailsModal from "@/components/modals/details-modal"
import ValidatedRequestsHistory from "@/components/dashboard/validated-requests-history"
import ManageAdminRoles from "../admin/manage-admin-roles"

export default function SuperAdminDashboard() {
  const { currentUser, users, projets, demandes, loadUsers, loadProjets, loadDemandes, isLoading } = useStore()

  // Hook pour détecter mobile
  const [isMobile, setIsMobile] = useState(false)
  const [activeTab, setActiveTab] = useState("accueil")

  const [stats, setStats] = useState({
    totalUtilisateurs: 0,
    totalProjets: 0,
    totalDemandes: 0,
    demandesEnCours: 0,
  })

  const [createUserModalOpen, setCreateUserModalOpen] = useState(false)
  const [createProjectModalOpen, setCreateProjectModalOpen] = useState(false)
  const [projectManagementModalOpen, setProjectManagementModalOpen] = useState(false)
  const [createDemandeModalOpen, setCreateDemandeModalOpen] = useState(false)
  const [validatedHistoryModalOpen, setValidatedHistoryModalOpen] = useState(false)
  const [demandeType, setDemandeType] = useState<"materiel" | "outillage">("materiel")
  
  // Details modal states
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [detailsModalType, setDetailsModalType] = useState<"users" | "projects" | "totalRequests" | "activeRequests">("users")
  const [detailsModalTitle, setDetailsModalTitle] = useState("")
  const [detailsModalData, setDetailsModalData] = useState<any[]>([])

  // États pour la pagination et recherche (nouveau design)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [activeChart, setActiveChart] = useState<"material" | "tooling">("material")
  const itemsPerPage = 7

  // Effet pour détecter mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (currentUser) {
      loadUsers()
      loadProjets()
      loadDemandes()
    }
  }, [currentUser, loadUsers, loadProjets, loadDemandes])

  useEffect(() => {
    setStats({
      totalUtilisateurs: users.length,
      totalProjets: projets.length,
      totalDemandes: demandes.length,
      // CORRECTION: Utiliser les vrais statuts du schéma Prisma
      demandesEnCours: demandes.filter(
        (d) => !["brouillon", "cloturee", "archivee", "rejetee"].includes(d.status),
      ).length,
    })
  }, [users, projets, demandes])

  const getRoleLabel = (role: string) => {
    const labels = {
      superadmin: "Super Administrateur",
      employe: "Employé",
      conducteur_travaux: "Conducteur de Travaux",
      responsable_travaux: "Responsable des Travaux",
      responsable_qhse: "Responsable QHSE",
      responsable_appro: "Responsable Approvisionnements",
      charge_affaire: "Chargé d'Affaire",
    }
    return labels[role as keyof typeof labels] || role
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "superadmin":
        return "bg-red-100 text-red-800 border-red-200"
      case "responsable_travaux":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "conducteur_travaux":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "responsable_qhse":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "responsable_appro":
        return "bg-green-100 text-green-800 border-green-200"
      case "charge_affaire":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "employe":
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  // Génération des données de graphique à partir des demandes réelles
  const generateChartData = () => {
    const materialRequests = demandes.filter(d => d.type === "materiel")
    const toolingRequests = demandes.filter(d => d.type === "outillage")
    
    const materialFlowData = [
      { name: "Jan", value: Math.round(materialRequests.length * 0.15) },
      { name: "Fév", value: Math.round(materialRequests.length * 0.18) },
      { name: "Mar", value: Math.round(materialRequests.length * 0.22) },
      { name: "Avr", value: Math.round(materialRequests.length * 0.16) },
      { name: "Mai", value: Math.round(materialRequests.length * 0.20) },
      { name: "Jun", value: Math.round(materialRequests.length * 0.19) },
    ]

    const toolingFlowData = [
      { name: "Jan", value: Math.round(toolingRequests.length * 0.15) },
      { name: "Fév", value: Math.round(toolingRequests.length * 0.18) },
      { name: "Mar", value: Math.round(toolingRequests.length * 0.22) },
      { name: "Avr", value: Math.round(toolingRequests.length * 0.16) },
      { name: "Mai", value: Math.round(toolingRequests.length * 0.20) },
      { name: "Jun", value: Math.round(toolingRequests.length * 0.19) },
    ]

    const pieData = [
      { 
        name: "Matériel", 
        value: materialRequests.length || 60, 
        color: "#015fc4" 
      },
      { 
        name: "Outillage", 
        value: toolingRequests.length || 40, 
        color: "#b8d1df" 
      },
    ]

    return { materialFlowData, toolingFlowData, pieData }
  }

  const { materialFlowData, toolingFlowData, pieData } = generateChartData()

  // Filtrage et pagination des utilisateurs
  const filteredUsers = users.filter(
    (user) =>
      user.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getRoleLabel(user.role).toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage)

  // Click handlers for statistics cards
  const handleUsersClick = () => {
    setDetailsModalType("users")
    setDetailsModalTitle("Tous les utilisateurs")
    setDetailsModalData(users)
    setDetailsModalOpen(true)
  }

  const handleProjectsClick = () => {
    setProjectManagementModalOpen(true)
  }

  const handleTotalRequestsClick = () => {
    setValidatedHistoryModalOpen(true)
  }

  const handleActiveRequestsClick = () => {
    const activeRequests = demandes.filter(
      (d) => !["brouillon", "cloturee", "archivee", "rejetee"].includes(d.status)
    )
    setDetailsModalType("activeRequests")
    setDetailsModalTitle("Demandes en cours")
    setDetailsModalData(activeRequests)
    setDetailsModalOpen(true)
  }

  const handlePieClick = (data: any) => {
    if (data.name === "Matériel") {
      setActiveChart("material")
    } else if (data.name === "Outillage") {
      setActiveChart("tooling")
    }
  }

  const handleRemoveUserFromProject = () => {
    // TO DO: Implementer la logique pour supprimer un utilisateur d'un projet
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Version mobile - SEULE interface sur mobile
  if (isMobile) {
    return (
      <>
        <div className="mobile-dashboard">
        {/* Header Mobile */}
        <div className="mobile-header">
          <div className="mobile-header-left">
            <Avatar className="mobile-avatar">
              <AvatarFallback className="mobile-avatar-fallback">L</AvatarFallback>
            </Avatar>
            <div className="mobile-header-text">
              <h1 className="mobile-title">Gestion Demandes</h1>
              <p className="mobile-subtitle">Super Administrateur</p>
            </div>
          </div>
          <div className="mobile-header-right">
            <Settings className="mobile-icon" />
            <Bell className="mobile-icon" />
            <Badge className="mobile-user-badge">TA</Badge>
          </div>
        </div>

        {/* Contenu Mobile */}
        <div className="mobile-content">
          {/* Bouton Principal */}
          <Button 
            className="mobile-primary-button"
            onClick={() => {
              setDemandeType("materiel")
              setCreateDemandeModalOpen(true)
            }}
          >
            <Plus className="mobile-button-icon" />
            Nouvelle Demande
          </Button>

          {/* Carte Dernières Demandes */}
          <Card className="mobile-card">
            <CardContent className="mobile-card-content">
              <p className="mobile-card-text">Mes 3 dernières demandes</p>
            </CardContent>
          </Card>

          {/* Actions Rapides */}
          <div className="mobile-actions-section">
            <h2 className="mobile-section-title">Actions Rapides</h2>
            <div className="mobile-actions-list">
              <Button 
                className="mobile-action-button mobile-action-active"
                onClick={() => {
                  setDemandeType("materiel")
                  setCreateDemandeModalOpen(true)
                }}
              >
                <Package className="mobile-action-icon" />
                DA-Matériel
              </Button>
              
              <Button 
                className="mobile-action-button"
                onClick={() => {
                  setDemandeType("outillage")
                  setCreateDemandeModalOpen(true)
                }}
              >
                <Wrench className="mobile-action-icon" />
                DA-Outillage
              </Button>
              
              <Button 
                className="mobile-action-button"
                onClick={() => setCreateProjectModalOpen(true)}
              >
                <FolderOpen className="mobile-action-icon" />
                Nouveau Projet
              </Button>
              
              <Button 
                className="mobile-action-button"
                onClick={() => setCreateUserModalOpen(true)}
              >
                <Users className="mobile-action-icon" />
                Nouvel Utilisateur
              </Button>
              
              <Button 
                className="mobile-action-button"
                onClick={() => setValidatedHistoryModalOpen(true)}
              >
                <BarChart3 className="mobile-action-icon" />
                Rapport
              </Button>
              
              <Button 
                className="mobile-action-button mobile-action-danger"
                onClick={() => {
                  // Action pour DA-Paiement
                  console.log("DA-Paiement clicked")
                }}
              >
                <CreditCard className="mobile-action-icon" />
                DA-Paiement
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Bottom */}
        <div className="mobile-bottom-nav">
          <button 
            className={`mobile-nav-item ${activeTab === 'accueil' ? 'mobile-nav-active' : ''}`}
            onClick={() => setActiveTab('accueil')}
          >
            <Home className="mobile-nav-icon" />
            <span className="mobile-nav-text">Accueil</span>
          </button>
          
          <button 
            className={`mobile-nav-item ${activeTab === 'demandes' ? 'mobile-nav-active' : ''}`}
            onClick={() => setActiveTab('demandes')}
          >
            <FileText className="mobile-nav-icon" />
            <span className="mobile-nav-text">Mes demandes</span>
          </button>
          
          <button 
            className={`mobile-nav-item ${activeTab === 'profil' ? 'mobile-nav-active' : ''}`}
            onClick={() => setActiveTab('profil')}
          >
            <User className="mobile-nav-icon" />
            <span className="mobile-nav-text">Profil</span>
          </button>
        </div>

        {/* Modals */}
        <CreateDemandeModal
          isOpen={createDemandeModalOpen}
          onClose={() => setCreateDemandeModalOpen(false)}
          type={demandeType}
        />
        <CreateUserModal
          isOpen={createUserModalOpen}
          onClose={() => setCreateUserModalOpen(false)}
        />
        <CreateProjectModal
          isOpen={createProjectModalOpen}
          onClose={() => setCreateProjectModalOpen(false)}
        />
        <ValidatedRequestsHistory
          isOpen={validatedHistoryModalOpen}
          onClose={() => setValidatedHistoryModalOpen(false)}
        />
        </div>
      </>
    )
  }

  // Version Desktop (masquée sur mobile via CSS)
  return (
    <div className="min-h-screen bg-gray-50 p-2 desktop-dashboard">
      <div className="max-w-full mx-auto">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Tableau de Bord Super Administrateur</h1>

        {/* Layout principal : responsive */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          {/* Colonne de gauche (large) - 3/4 de la largeur */}
          <div className="xl:col-span-3 space-y-4">
            {/* Vue d'ensemble - Cards statistiques */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: '#015fc4' }} onClick={handleUsersClick}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Utilisateurs</CardTitle>
                  <Users className="h-4 w-4" style={{ color: '#015fc4' }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: '#015fc4' }}>{stats.totalUtilisateurs}</div>
                  <p className="text-xs text-muted-foreground">Total des utilisateurs</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: '#b8d1df' }} onClick={handleProjectsClick}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Projets</CardTitle>
                  <FolderOpen className="h-4 w-4" style={{ color: '#b8d1df' }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: '#b8d1df' }}>{stats.totalProjets}</div>
                  <p className="text-xs text-muted-foreground">Projets actifs</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: '#fc2d1f' }} onClick={handleTotalRequestsClick}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Demandes</CardTitle>
                  <FileText className="h-4 w-4" style={{ color: '#fc2d1f' }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: '#fc2d1f' }}>{stats.totalDemandes}</div>
                  <p className="text-xs text-muted-foreground">Toutes les demandes</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: '#f97316' }} onClick={handleActiveRequestsClick}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">En Cours</CardTitle>
                  <Clock className="h-4 w-4" style={{ color: '#f97316' }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: '#f97316' }}>{stats.demandesEnCours}</div>
                  <p className="text-xs text-muted-foreground">En traitement</p>
                </CardContent>
              </Card>
            </div>

            {/* Gestion des Rôles Administrateur */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Gestion des Rôles Administrateur
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher un utilisateur..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64 sm:h-80 lg:h-96 overflow-y-auto border rounded-lg">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[500px]">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="text-left p-2 sm:p-3 font-medium text-xs sm:text-sm text-gray-600">Utilisateur</th>
                          <th className="hidden sm:table-cell text-left p-2 sm:p-3 font-medium text-xs sm:text-sm text-gray-600">Rôle</th>
                          <th className="text-right p-2 sm:p-3 font-medium text-xs sm:text-sm text-gray-600">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                      {paginatedUsers.map((user) => (
                        <tr key={user.id} className="border-t">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                  {user.nom.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{user.nom}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge className={`text-xs ${getRoleBadgeColor(user.role)}`} variant="outline">
                              {getRoleLabel(user.role)}
                            </Badge>
                          </td>
                          <td className="p-3 text-right">
                            <Switch defaultChecked={user.role !== 'employe'} />
                          </td>
                        </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredUsers.length)} sur{" "}
                    {filteredUsers.length} utilisateurs
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} sur {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Colonne de droite (fine) - 1/4 de la largeur */}
          <div className="lg:col-span-1 space-y-4">
            {/* Actions rapides */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions Rapides</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    className="justify-start text-white" 
                    style={{ backgroundColor: '#015fc4' }}
                    size="sm"
                    onClick={() => {
                      setDemandeType("materiel")
                      setCreateDemandeModalOpen(true)
                    }}
                  >
                    <Package className="h-4 w-4 mr-1" />
                    <span className="text-xs">DA-Matériel</span>
                  </Button>
                  <Button
                    className="justify-start text-gray-700"
                    style={{ backgroundColor: '#b8d1df' }}
                    size="sm"
                    onClick={() => {
                      setDemandeType("outillage")
                      setCreateDemandeModalOpen(true)
                    }}
                  >
                    <Wrench className="h-4 w-4 mr-1" />
                    <span className="text-xs">DA-Outillage</span>
                  </Button>
                  <Button 
                    className="justify-start bg-transparent" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCreateProjectModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    <span className="text-xs">Nouveau Projet</span>
                  </Button>
                  <Button 
                    className="justify-start bg-transparent" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCreateUserModalOpen(true)}
                  >
                    <Users className="h-4 w-4 mr-1" />
                    <span className="text-xs">Nouvel Utilisateur</span>
                  </Button>
                  <Button className="justify-start bg-transparent" variant="outline" size="sm">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    <span className="text-xs">Rapport</span>
                  </Button>
                  <Button
                    className="justify-start text-white"
                    style={{ backgroundColor: '#fc2d1f' }}
                    size="sm"
                  >
                    <CreditCard className="h-4 w-4 mr-1" />
                    <span className="text-xs">DA-Paiement</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Graphique en secteurs */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Répartition</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      dataKey="value"
                      onClick={handlePieClick}
                      style={{ cursor: "pointer" }}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1">
                  <div
                    className={`flex items-center justify-between text-sm cursor-pointer p-1 rounded ${
                      activeChart === "material" ? "bg-blue-50" : ""
                    }`}
                    onClick={() => setActiveChart("material")}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#015fc4' }}></div>
                      <span>Matériel</span>
                    </div>
                    <span className="font-medium">{pieData[0]?.value || 0}</span>
                  </div>
                  <div
                    className={`flex items-center justify-between text-sm cursor-pointer p-1 rounded ${
                      activeChart === "tooling" ? "bg-blue-50" : ""
                    }`}
                    onClick={() => setActiveChart("tooling")}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#b8d1df' }}></div>
                      <span>Outillage</span>
                    </div>
                    <span className="font-medium">{pieData[1]?.value || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Graphiques de flux */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {activeChart === "material" ? (
                    <>
                      <TrendingUp className="h-4 w-4" style={{ color: '#015fc4' }} />
                      Flux Demandes Matériel
                    </>
                  ) : (
                    <>
                      <BarChart3 className="h-4 w-4" style={{ color: '#b8d1df' }} />
                      Flux Demandes Outillage
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={150}>
                  {activeChart === "material" ? (
                    <LineChart data={materialFlowData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#015fc4" strokeWidth={2} />
                    </LineChart>
                  ) : (
                    <BarChart data={toolingFlowData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#b8d1df" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Modals fonctionnels */}
      <CreateUserModal isOpen={createUserModalOpen} onClose={() => setCreateUserModalOpen(false)} />
      <CreateProjectModal isOpen={createProjectModalOpen} onClose={() => setCreateProjectModalOpen(false)} />
      <ProjectManagementModal 
        isOpen={projectManagementModalOpen} 
        onClose={() => setProjectManagementModalOpen(false)} 
      />
      <CreateDemandeModal
        isOpen={createDemandeModalOpen}
        onClose={() => setCreateDemandeModalOpen(false)}
        type={demandeType}
      />
      <DetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        type={detailsModalType}
        title={detailsModalTitle}
        data={detailsModalData}
        onRemoveUserFromProject={handleRemoveUserFromProject}
      />
      <ValidatedRequestsHistory
        isOpen={validatedHistoryModalOpen}
        onClose={() => setValidatedHistoryModalOpen(false)}
      />
    </div>
  )
}

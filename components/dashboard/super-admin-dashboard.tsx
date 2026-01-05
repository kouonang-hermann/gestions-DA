"use client"

import { useState, useEffect } from "react"
import "@/styles/mobile-dashboard-new.css"
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
  User,
  DollarSign
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
import SharedDemandesSection from "@/components/dashboard/shared-demandes-section"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import FinancialDashboard from "@/components/admin/financial-dashboard"
import ChangeUserRoleModal from "@/components/admin/change-user-role-modal"
import type { User as UserType } from "@/types"

export default function SuperAdminDashboard() {
  const { currentUser, users, projets, demandes, isLoading, loadUsers, loadProjets, loadDemandes } = useStore()

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

  // Modale personnalisée pour demandes en cours
  const [enCoursModalOpen, setEnCoursModalOpen] = useState(false)
  
  // Modale tableau de bord financier
  const [financialModalOpen, setFinancialModalOpen] = useState(false)
  
  // Modale gestion des rôles admin
  const [adminRolesModalOpen, setAdminRolesModalOpen] = useState(false)
  
  // Modale changement de rôle utilisateur
  const [changeRoleModalOpen, setChangeRoleModalOpen] = useState(false)
  const [selectedUserForRoleChange, setSelectedUserForRoleChange] = useState<UserType | null>(null)

  // États pour les filtres financiers
  const [financePeriode, setFinancePeriode] = useState<"all" | "month" | "quarter" | "year">("all")
  const [financeType, setFinanceType] = useState<"all" | "materiel" | "outillage">("all")
  const [financeStatut, setFinanceStatut] = useState<"all" | "chiffrees" | "non_chiffrees">("all")

  // États pour la pagination et recherche (nouveau design)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 7

  // État pour les graphiques
  const [activeChart, setActiveChart] = useState<"material" | "tooling">("material")

  // Effet pour détecter mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Chargement automatique des données au montage du composant
  useEffect(() => {
    const loadAllData = async () => {
      console.log("🔄 [SUPER-ADMIN] Chargement initial des données...")
      await Promise.all([
        loadUsers(),
        loadProjets(),
        loadDemandes()
      ])
      console.log("✅ [SUPER-ADMIN] Données chargées avec succès")
    }
    
    if (currentUser) {
      loadAllData()
    }
  }, [currentUser, loadUsers, loadProjets, loadDemandes])

  // Mise à jour des stats quand les données changent
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
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.phone && user.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
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

  const handleCardClick = (type: string, title: string) => {
    if (type === "enCours") {
      setEnCoursModalOpen(true)
    } else {
      console.log(`Clic sur carte ${type}: ${title}`)
    }
  }

  // Fonction pour obtenir les demandes en cours
  // Pour super admin : TOUTES les demandes en attente
  // Pour autres utilisateurs : leurs propres demandes en cours
  const getMesDemandesEnCours = () => {
    if (!currentUser) return []
    
    // Super admin voit TOUTES les demandes en attente (pas seulement les siennes)
    if (currentUser.role === 'superadmin') {
      return demandes.filter(
        (demande) =>
          ![
            "brouillon", 
            "cloturee", 
            "rejetee", 
            "archivee"
          ].includes(demande.status)
      )
    }
    
    // Autres utilisateurs voient uniquement leurs propres demandes
    return demandes.filter(
      (demande) =>
        demande.technicienId === currentUser.id &&
        ![
          "brouillon", 
          "cloturee", 
          "rejetee", 
          "archivee"
        ].includes(demande.status)
    )
  }

  const handleRemoveUserFromProject = () => {
    // TO DO: Implementer la logique pour supprimer un utilisateur d'un projet
  }

  const handleChangeUserRole = (user: UserType) => {
    setSelectedUserForRoleChange(user)
    setChangeRoleModalOpen(true)
  }

  const handleRoleChanged = async () => {
    console.log("🔄 Rechargement des utilisateurs après changement de rôle...")
    await loadUsers()
    console.log("✅ Utilisateurs rechargés")
    setDetailsModalOpen(false)
    setChangeRoleModalOpen(false)
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

              {/* Carte Gestion des Rôles Admin */}
              <Card 
                className="border-l-4 cursor-pointer hover:shadow-md transition-shadow bg-purple-50" 
                style={{ borderLeftColor: '#8b5cf6' }} 
                onClick={() => setAdminRolesModalOpen(true)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-700">Rôles Admin</CardTitle>
                  <Settings className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-700">
                    {users.filter(u => u.role !== 'employe').length}
                  </div>
                  <p className="text-xs text-purple-600">Utilisateurs avec rôles</p>
                </CardContent>
              </Card>
            </div>

            {/* Vue d'ensemble - Cards statistiques (2ème ligne) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Composant partagé pour les demandes en cours (sans clôture pour super admin) */}
              <SharedDemandesSection onCardClick={handleCardClick} hideClotureSection={true} />
            </div>

            {/* Section Finance - Version enrichie */}
            <Card className="h-fit">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Finance
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setFinancialModalOpen(true)}
                  className="text-green-600 border-green-300 hover:bg-green-50"
                >
                  Voir détails complets
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Filtres financiers */}
                <div className="flex flex-wrap gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 font-medium">Période:</label>
                    <select 
                      value={financePeriode} 
                      onChange={(e) => setFinancePeriode(e.target.value as any)}
                      className="text-xs border rounded px-2 py-1 bg-white"
                    >
                      <option value="all">Tout</option>
                      <option value="month">Ce mois</option>
                      <option value="quarter">Ce trimestre</option>
                      <option value="year">Cette année</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 font-medium">Type:</label>
                    <select 
                      value={financeType} 
                      onChange={(e) => setFinanceType(e.target.value as any)}
                      className="text-xs border rounded px-2 py-1 bg-white"
                    >
                      <option value="all">Tout</option>
                      <option value="materiel">Matériel</option>
                      <option value="outillage">Outillage</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 font-medium">Statut:</label>
                    <select 
                      value={financeStatut} 
                      onChange={(e) => setFinanceStatut(e.target.value as any)}
                      className="text-xs border rounded px-2 py-1 bg-white"
                    >
                      <option value="all">Tout</option>
                      <option value="chiffrees">Chiffrées</option>
                      <option value="non_chiffrees">Non chiffrées</option>
                    </select>
                  </div>
                </div>

                {/* Tableau des coûts par projet */}
                {(() => {
                  // Appliquer les filtres sur les demandes
                  const now = new Date()
                  const demandesFiltrees = demandes.filter(d => {
                    // Filtre par type
                    if (financeType !== "all" && d.type !== financeType) return false
                    
                    // Filtre par statut (chiffrées ou non)
                    if (financeStatut === "chiffrees" && (!d.coutTotal || d.coutTotal === 0)) return false
                    if (financeStatut === "non_chiffrees" && d.coutTotal && d.coutTotal > 0) return false
                    
                    // Filtre par période (utilise dateEngagement si disponible, sinon dateCreation)
                    const dateRef = d.dateEngagement ? new Date(d.dateEngagement) : new Date(d.dateCreation)
                    if (financePeriode === "month") {
                      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
                      if (dateRef < startOfMonth) return false
                    } else if (financePeriode === "quarter") {
                      const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
                      if (dateRef < quarterStart) return false
                    } else if (financePeriode === "year") {
                      const startOfYear = new Date(now.getFullYear(), 0, 1)
                      if (dateRef < startOfYear) return false
                    }
                    
                    return true
                  })
                  
                  return (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium text-gray-700">Détail des coûts par projet</h4>
                        <span className="text-xs text-gray-500">{demandesFiltrees.length} demande(s) filtrée(s)</span>
                      </div>
                  <div className="max-h-48 overflow-y-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100 sticky top-0">
                        <tr>
                          <th className="text-left p-2 font-medium text-gray-600">Projet</th>
                          <th className="text-center p-2 font-medium text-gray-600">Demandes</th>
                          <th className="text-center p-2 font-medium text-gray-600">Matériel</th>
                          <th className="text-center p-2 font-medium text-gray-600">Outillage</th>
                          <th className="text-right p-2 font-medium text-gray-600">Coût Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projets.map(projet => {
                          const projetDemandes = demandesFiltrees.filter(d => d.projetId === projet.id)
                          const coutMateriel = projetDemandes.filter(d => d.type === 'materiel').reduce((sum, d) => sum + (d.coutTotal || 0), 0)
                          const coutOutillage = projetDemandes.filter(d => d.type === 'outillage').reduce((sum, d) => sum + (d.coutTotal || 0), 0)
                          const coutTotal = coutMateriel + coutOutillage
                          
                          if (projetDemandes.length === 0) return null
                          
                          return (
                            <tr key={projet.id} className="border-t hover:bg-gray-50">
                              <td className="p-2">
                                <div className="flex items-center gap-2">
                                  <FolderOpen className="h-4 w-4 text-gray-400" />
                                  <span className="font-medium">{projet.nom}</span>
                                </div>
                              </td>
                              <td className="p-2 text-center">
                                <Badge variant="outline" className="text-xs">
                                  {projetDemandes.length}
                                </Badge>
                              </td>
                              <td className="p-2 text-center text-blue-600">
                                {coutMateriel > 0 ? `${coutMateriel.toLocaleString('fr-FR')} €` : '-'}
                              </td>
                              <td className="p-2 text-center text-purple-600">
                                {coutOutillage > 0 ? `${coutOutillage.toLocaleString('fr-FR')} €` : '-'}
                              </td>
                              <td className="p-2 text-right font-bold text-green-700">
                                {coutTotal > 0 ? `${coutTotal.toLocaleString('fr-FR')} €` : '-'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot className="bg-green-50 font-bold">
                        <tr>
                          <td className="p-2">TOTAL</td>
                          <td className="p-2 text-center">{demandesFiltrees.length}</td>
                          <td className="p-2 text-center text-blue-700">
                            {demandesFiltrees.filter(d => d.type === 'materiel').reduce((sum, d) => sum + (d.coutTotal || 0), 0).toLocaleString('fr-FR')} €
                          </td>
                          <td className="p-2 text-center text-purple-700">
                            {demandesFiltrees.filter(d => d.type === 'outillage').reduce((sum, d) => sum + (d.coutTotal || 0), 0).toLocaleString('fr-FR')} €
                          </td>
                          <td className="p-2 text-right text-green-800">
                            {demandesFiltrees.reduce((sum, d) => sum + (d.coutTotal || 0), 0).toLocaleString('fr-FR')} €
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                    </div>
                  )
                })()}

                {/* Graphiques améliorés */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Répartition par type - Version améliorée */}
                  <div className="bg-white border rounded-lg p-4 shadow-sm">
                    <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Package className="h-4 w-4 text-blue-600" />
                      Répartition des coûts par type
                    </h4>
                    {(() => {
                      const coutMateriel = demandes.filter(d => d.type === 'materiel').reduce((sum, d) => sum + (d.coutTotal || 0), 0)
                      const coutOutillage = demandes.filter(d => d.type === 'outillage').reduce((sum, d) => sum + (d.coutTotal || 0), 0)
                      const total = coutMateriel + coutOutillage
                      const pctMateriel = total > 0 ? Math.round((coutMateriel / total) * 100) : 0
                      const pctOutillage = total > 0 ? Math.round((coutOutillage / total) * 100) : 0
                      
                      return (
                        <div className="space-y-4">
                          {/* Barre de progression visuelle */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-600">
                              <span>Matériel</span>
                              <span className="font-bold text-blue-700">{pctMateriel}%</span>
                            </div>
                            <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full flex items-center justify-end pr-2 text-white text-xs font-bold transition-all duration-500"
                                style={{ width: `${Math.max(pctMateriel, 5)}%`, backgroundColor: '#015fc4' }}
                              >
                                {coutMateriel > 0 && `${coutMateriel.toLocaleString('fr-FR')} €`}
                              </div>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-xs text-gray-600">
                              <span>Outillage</span>
                              <span className="font-bold text-cyan-700">{pctOutillage}%</span>
                            </div>
                            <div className="h-6 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full flex items-center justify-end pr-2 text-gray-800 text-xs font-bold transition-all duration-500"
                                style={{ width: `${Math.max(pctOutillage, 5)}%`, backgroundColor: '#b8d1df' }}
                              >
                                {coutOutillage > 0 && `${coutOutillage.toLocaleString('fr-FR')} €`}
                              </div>
                            </div>
                          </div>
                          
                          {/* Total */}
                          <div className="pt-2 border-t flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Total</span>
                            <span className="text-lg font-bold text-green-700">{total.toLocaleString('fr-FR')} €</span>
                          </div>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Top projets - Version améliorée */}
                  <div className="bg-white border rounded-lg p-4 shadow-sm">
                    <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-green-600" />
                      Top 5 projets par coût
                    </h4>
                    {(() => {
                      const topProjets = projets
                        .map(p => ({
                          id: p.id,
                          name: p.nom,
                          cout: demandes.filter(d => d.projetId === p.id).reduce((sum, d) => sum + (d.coutTotal || 0), 0),
                          nbDemandes: demandes.filter(d => d.projetId === p.id).length
                        }))
                        .sort((a, b) => b.cout - a.cout)
                        .slice(0, 5)
                      
                      const maxCout = Math.max(...topProjets.map(p => p.cout), 1)
                      
                      return (
                        <div className="space-y-3">
                          {topProjets.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">Aucun projet avec des coûts</p>
                          ) : (
                            topProjets.map((projet, index) => (
                              <div key={projet.id} className="space-y-1">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="flex items-center gap-2">
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                      index === 0 ? 'bg-yellow-500' : 
                                      index === 1 ? 'bg-gray-400' : 
                                      index === 2 ? 'bg-orange-400' : 'bg-gray-300'
                                    }`}>
                                      {index + 1}
                                    </span>
                                    <span className="font-medium text-gray-700 truncate max-w-[120px]" title={projet.name}>
                                      {projet.name}
                                    </span>
                                  </span>
                                  <span className="text-gray-500">
                                    {projet.nbDemandes} demande{projet.nbDemandes > 1 ? 's' : ''}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
                                    <div 
                                      className="h-full rounded transition-all duration-500"
                                      style={{ 
                                        width: `${(projet.cout / maxCout) * 100}%`, 
                                        backgroundColor: index === 0 ? '#22c55e' : index === 1 ? '#4ade80' : '#86efac'
                                      }}
                                    />
                                  </div>
                                  <span className="text-xs font-bold text-green-700 min-w-[80px] text-right">
                                    {projet.cout.toLocaleString('fr-FR')} €
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )
                    })()}
                  </div>
                </div>

                {/* Indicateurs de Performance */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-purple-600" />
                    Indicateurs de Performance
                  </h4>
                  {(() => {
                    const demandesChiffrees = demandes.filter(d => d.coutTotal && d.coutTotal > 0)
                    const demandesCloses = demandes.filter(d => d.status === 'cloturee')
                    const demandesValidees = demandes.filter(d => !['brouillon', 'rejetee', 'archivee'].includes(d.status))
                    
                    // Calcul délai moyen (simulation avec dates de création)
                    const delaiMoyen = demandesCloses.length > 0 
                      ? Math.round(demandesCloses.reduce((sum, d) => {
                          const created = new Date(d.dateCreation).getTime()
                          const now = Date.now()
                          return sum + (now - created) / (1000 * 60 * 60 * 24)
                        }, 0) / demandesCloses.length)
                      : 0
                    
                    const tauxApprobation = demandes.length > 0 
                      ? Math.round((demandesValidees.length / demandes.length) * 100)
                      : 0
                    
                    const coutMoyenMateriel = demandesChiffrees.filter(d => d.type === 'materiel').length > 0
                      ? Math.round(demandesChiffrees.filter(d => d.type === 'materiel').reduce((sum, d) => sum + (d.coutTotal || 0), 0) / demandesChiffrees.filter(d => d.type === 'materiel').length)
                      : 0
                    
                    const coutMoyenOutillage = demandesChiffrees.filter(d => d.type === 'outillage').length > 0
                      ? Math.round(demandesChiffrees.filter(d => d.type === 'outillage').reduce((sum, d) => sum + (d.coutTotal || 0), 0) / demandesChiffrees.filter(d => d.type === 'outillage').length)
                      : 0
                    
                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-white p-3 rounded-lg border-l-4 border-blue-500">
                          <p className="text-xs text-gray-600 mb-1">Délai Moyen</p>
                          <p className="text-2xl font-bold text-blue-700">{delaiMoyen}</p>
                          <p className="text-xs text-gray-500">jours</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border-l-4 border-green-500">
                          <p className="text-xs text-gray-600 mb-1">Taux Approbation</p>
                          <p className="text-2xl font-bold text-green-700">{tauxApprobation}%</p>
                          <p className="text-xs text-gray-500">{demandesValidees.length}/{demandes.length}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border-l-4 border-purple-500">
                          <p className="text-xs text-gray-600 mb-1">Coût Moy. Matériel</p>
                          <p className="text-xl font-bold text-purple-700">{coutMoyenMateriel.toLocaleString('fr-FR')} €</p>
                          <p className="text-xs text-gray-500">par demande</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border-l-4 border-cyan-500">
                          <p className="text-xs text-gray-600 mb-1">Coût Moy. Outillage</p>
                          <p className="text-xl font-bold text-cyan-700">{coutMoyenOutillage.toLocaleString('fr-FR')} €</p>
                          <p className="text-xs text-gray-500">par demande</p>
                        </div>
                      </div>
                    )
                  })()}
                </div>

                {/* Évolution Temporelle */}
                <div className="bg-white border rounded-lg p-4 shadow-sm">
                  <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    Évolution des Coûts (6 derniers mois)
                  </h4>
                  {(() => {
                    // Générer les 6 derniers mois
                    const mois = []
                    const now = new Date()
                    for (let i = 5; i >= 0; i--) {
                      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
                      mois.push({
                        mois: date.toLocaleDateString('fr-FR', { month: 'short' }),
                        moisComplet: date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
                        annee: date.getFullYear(),
                        moisNum: date.getMonth()
                      })
                    }
                    
                    // Calculer les coûts par mois
                    const donneesMois = mois.map(m => {
                      const demandesMois = demandes.filter(d => {
                        const dateDemande = new Date(d.dateCreation)
                        return dateDemande.getMonth() === m.moisNum && dateDemande.getFullYear() === m.annee
                      })
                      
                      const coutMateriel = demandesMois.filter(d => d.type === 'materiel').reduce((sum, d) => sum + (d.coutTotal || 0), 0)
                      const coutOutillage = demandesMois.filter(d => d.type === 'outillage').reduce((sum, d) => sum + (d.coutTotal || 0), 0)
                      const coutTotal = coutMateriel + coutOutillage
                      
                      return {
                        ...m,
                        materiel: coutMateriel,
                        outillage: coutOutillage,
                        total: coutTotal,
                        nbDemandes: demandesMois.length
                      }
                    })
                    
                    const maxCout = Math.max(...donneesMois.map(d => d.total), 1)
                    
                    // Calcul de l'évolution
                    const moisActuel = donneesMois[donneesMois.length - 1]
                    const moisPrecedent = donneesMois[donneesMois.length - 2]
                    const evolution = moisPrecedent.total > 0 
                      ? Math.round(((moisActuel.total - moisPrecedent.total) / moisPrecedent.total) * 100)
                      : 0
                    
                    return (
                      <div className="space-y-4">
                        {/* Analyse comparative */}
                        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                          <div>
                            <p className="text-xs text-gray-600">Évolution vs mois dernier</p>
                            <p className={`text-lg font-bold ${evolution >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {evolution >= 0 ? '↑' : '↓'} {Math.abs(evolution)}%
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-600">Ce mois</p>
                            <p className="text-lg font-bold text-gray-800">{moisActuel.total.toLocaleString('fr-FR')} €</p>
                          </div>
                        </div>
                        
                        {/* Graphique en barres */}
                        <div className="space-y-2">
                          {donneesMois.map((data, index) => (
                            <div key={index} className="space-y-1">
                              <div className="flex justify-between items-center text-xs">
                                <span className="font-medium text-gray-700 w-16">{data.mois}</span>
                                <span className="text-gray-500">{data.nbDemandes} demande{data.nbDemandes > 1 ? 's' : ''}</span>
                                <span className="font-bold text-green-700 w-24 text-right">
                                  {data.total.toLocaleString('fr-FR')} €
                                </span>
                              </div>
                              <div className="flex gap-1 h-6">
                                {/* Barre Matériel */}
                                <div 
                                  className="bg-blue-500 rounded-l transition-all duration-500 flex items-center justify-center text-white text-xs font-bold"
                                  style={{ width: `${(data.materiel / maxCout) * 100}%` }}
                                  title={`Matériel: ${data.materiel.toLocaleString('fr-FR')} €`}
                                >
                                  {data.materiel > maxCout * 0.1 && `${(data.materiel / 1000).toFixed(0)}k`}
                                </div>
                                {/* Barre Outillage */}
                                <div 
                                  className="bg-cyan-400 rounded-r transition-all duration-500 flex items-center justify-center text-gray-800 text-xs font-bold"
                                  style={{ width: `${(data.outillage / maxCout) * 100}%` }}
                                  title={`Outillage: ${data.outillage.toLocaleString('fr-FR')} €`}
                                >
                                  {data.outillage > maxCout * 0.1 && `${(data.outillage / 1000).toFixed(0)}k`}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                        
                        {/* Légende */}
                        <div className="flex justify-center gap-4 text-xs pt-2 border-t">
                          <span className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded bg-blue-500"></div>
                            Matériel
                          </span>
                          <span className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded bg-cyan-400"></div>
                            Outillage
                          </span>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Colonne de droite (fine) - 1/4 de la largeur */}
          <div className="xl:col-span-1 space-y-3 sm:space-y-4 order-1 xl:order-2">
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
        onChangeUserRole={handleChangeUserRole}
      />
      <ChangeUserRoleModal
        isOpen={changeRoleModalOpen}
        onClose={() => setChangeRoleModalOpen(false)}
        user={selectedUserForRoleChange}
        onRoleChanged={handleRoleChanged}
      />
      <ValidatedRequestsHistory
        isOpen={validatedHistoryModalOpen}
        onClose={() => setValidatedHistoryModalOpen(false)}
      />

      {/* Modale Tableau de Bord Financier */}
      <Dialog open={financialModalOpen} onOpenChange={setFinancialModalOpen}>
        <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto p-3 sm:p-6">
          <VisuallyHidden>
            <DialogTitle>Tableau de Bord Financier</DialogTitle>
          </VisuallyHidden>
          <FinancialDashboard onClose={() => setFinancialModalOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Modale Gestion des Rôles Admin */}
      <Dialog open={adminRolesModalOpen} onOpenChange={setAdminRolesModalOpen}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto p-3 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-purple-600" />
              Gestion des Rôles Administrateur
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
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
                            <AvatarFallback className="bg-purple-100 text-purple-700">
                              {user.nom.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm">{user.nom}</p>
                            <p className="text-xs text-gray-500">{user.phone || user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="hidden sm:table-cell p-3">
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
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
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
          </div>
        </DialogContent>
      </Dialog>

      {/* Modale personnalisée pour les demandes en cours */}
      <Dialog open={enCoursModalOpen} onOpenChange={setEnCoursModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mes demandes en cours</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {getMesDemandesEnCours().length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Aucune demande en cours</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {getMesDemandesEnCours().map((demande) => (
                  <Card key={demande.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-2">
                          <Badge variant="outline" className="font-mono">
                            {demande.numero}
                          </Badge>
                          <Badge 
                            variant={demande.type === "materiel" ? "default" : "secondary"}
                            className={demande.type === "materiel" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}
                          >
                            {demande.type === "materiel" ? "Matériel" : "Outillage"}
                          </Badge>
                          <Badge 
                            variant="outline"
                            className={
                              demande.status === "en_attente_validation_finale_demandeur" ? "bg-green-100 text-green-800" :
                              demande.status.includes("en_attente") ? "bg-orange-100 text-orange-800" :
                              "bg-gray-100 text-gray-800"
                            }
                          >
                            {demande.status === "en_attente_validation_finale_demandeur" ? "Prêt à clôturer" :
                             demande.status.includes("en_attente") ? "En cours" :
                             demande.status}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>Projet:</strong> {demande.projetId}</p>
                          <p><strong>Date de création:</strong> {new Date(demande.dateCreation).toLocaleDateString('fr-FR')}</p>
                          {demande.commentaires && (
                            <p><strong>Commentaires:</strong> {demande.commentaires}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-sm text-gray-500">
                          {new Date(demande.dateCreation).toLocaleDateString('fr-FR')}
                        </div>
                        {demande.status === "en_attente_validation_finale_demandeur" && (
                          <Button 
                            size="sm" 
                            className="bg-green-500 hover:bg-green-600 text-white"
                            onClick={() => {
                              // Logique de clôture
                              console.log('Clôturer la demande:', demande.id)
                            }}
                          >
                            Clôturer
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

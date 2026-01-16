"use client"

import { useState, useEffect } from "react"
import "@/styles/dashboard-layout.css"
import "@/styles/mobile-dashboard.css"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { useStore } from "@/stores/useStore"
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Plus, 
  FileText, 
  Users,
  FolderOpen,
  Settings,
  Search,
  Wrench,
  BarChart3,
  TrendingUp,
  Bell,
  Home,
  User,
  Archive,
  CreditCard,
  Smartphone
} from 'lucide-react'
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
import CreateDemandeModal from "@/components/demandes/create-demande-modal"
import { UserRequestsChart } from "@/components/charts/user-requests-chart"
import UserDetailsModal from "@/components/modals/user-details-modal"
import MesDemandesACloturer from "@/components/demandes/mes-demandes-a-cloturer"
import MesDemandesEnAttente from "@/components/demandes/mes-demandes-en-attente"
import MesLivraisonsSection from "@/components/dashboard/mes-livraisons-section"
import ValidatedRequestsHistory from "@/components/dashboard/validated-requests-history"
import ValidationReceptionList from "@/components/dashboard/validation-reception-list"
import ValidatedDemandesModal from "@/components/modals/validated-demandes-modal"
import DemandesCategoryModal from "@/components/modals/demandes-category-modal"
import UniversalClosureModal from "@/components/modals/universal-closure-modal"
import { useAutoReload } from "@/hooks/useAutoReload"

export default function EmployeDashboard() {
  const { currentUser, demandes, projets, isLoading } = useStore()
  
  const [stats, setStats] = useState({
    total: 0,
    enCours: 0,
    validees: 0,
    brouillons: 0,
    rejetees: 0,
  })

  const [createDemandeModalOpen, setCreateDemandeModalOpen] = useState(false)
  const [demandeType, setDemandeType] = useState<"materiel" | "outillage">("materiel")
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [detailsModalType, setDetailsModalType] = useState<"total" | "enCours" | "validees" | "brouillons" | "rejetees">("total")
  const [detailsModalTitle, setDetailsModalTitle] = useState("")
  const [validatedHistoryModalOpen, setValidatedHistoryModalOpen] = useState(false)
  const [validatedDemandesModalOpen, setValidatedDemandesModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeChart, setActiveChart] = useState<"material" | "tooling">("material")
  const [universalClosureModalOpen, setUniversalClosureModalOpen] = useState(false)
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    livraisons: false,
    cloture: false,
    projets: false
  })

  const { handleManualReload } = useAutoReload("EMPLOYE")

  // Fonction pour obtenir les demandes selon le rôle
  const getDemandesForRole = () => {
    if (!currentUser || !demandes) return []

    switch (currentUser.role) {
      case "conducteur_travaux":
        // Demandes matériel qu'il doit valider ou qu'il a validées
        return demandes.filter(d => 
          d.type === "materiel" && (
            d.status === "en_attente_validation_conducteur" ||
            d.status === "soumise" ||
            ["en_attente_validation_logistique", "en_attente_validation_responsable_travaux", "en_attente_validation_charge_affaire", "en_attente_preparation_appro", "en_attente_validation_livreur", "en_attente_validation_finale_demandeur", "confirmee_demandeur", "cloturee", "archivee"].includes(d.status)
          )
        )
      
      case "responsable_logistique":
        // Demandes outillage qu'il doit valider ou qu'il a validées
        return demandes.filter(d => 
          d.type === "outillage" && (
            d.status === "en_attente_validation_logistique" ||
            ["en_attente_validation_responsable_travaux", "en_attente_validation_charge_affaire", "en_attente_preparation_appro", "en_attente_validation_logistique", "en_attente_validation_finale_demandeur", "confirmee_demandeur", "cloturee", "archivee"].includes(d.status)
          )
        )
      
      case "responsable_travaux":
        // Demandes qu'il doit valider ou qu'il a validées
        return demandes.filter(d => 
          d.status === "en_attente_validation_responsable_travaux" ||
          ["en_attente_validation_charge_affaire", "en_attente_preparation_appro", "en_attente_validation_logistique", "en_attente_validation_finale_demandeur", "confirmee_demandeur", "cloturee", "archivee"].includes(d.status)
        )
      
      case "charge_affaire":
        // Demandes qu'il doit valider ou qu'il a validées
        return demandes.filter(d => 
          d.status === "en_attente_validation_charge_affaire" ||
          ["en_attente_preparation_appro", "en_attente_validation_logistique", "en_attente_validation_finale_demandeur", "confirmee_demandeur", "cloturee", "archivee"].includes(d.status)
        )
      
      case "responsable_appro":
        // Demandes qu'il doit traiter ou qu'il a traitées
        return demandes.filter(d => 
          d.status === "en_attente_preparation_appro" ||
          ["en_attente_validation_logistique", "en_attente_validation_finale_demandeur", "confirmee_demandeur", "cloturee", "archivee"].includes(d.status)
        )
      
      case "responsable_logistique":
        // Demandes qu'il doit valider ou qu'il a validées
        return demandes.filter(d => 
          d.status === "en_attente_validation_logistique" ||
          ["en_attente_validation_finale_demandeur", "confirmee_demandeur", "cloturee", "archivee"].includes(d.status)
        )
      
      default:
        // Pour les employés normaux, leurs propres demandes
        return demandes.filter(d => d.technicienId === currentUser.id)
    }
  }

  // Calcul des statistiques selon le rôle
  useEffect(() => {
    if (currentUser && demandes) {
      const demandesForRole = getDemandesForRole()

      if (["conducteur_travaux", "responsable_logistique", "responsable_travaux", "charge_affaire", "responsable_appro", "responsable_livreur"].includes(currentUser.role)) {
        // Pour les rôles de validation
        setStats({
          total: demandesForRole.length,
          enCours: demandesForRole.filter((d) => {
            const enAttenteStatuses = [
              "en_attente_validation_conducteur",
              "en_attente_validation_logistique", 
              "en_attente_validation_responsable_travaux",
              "en_attente_validation_charge_affaire",
              "en_attente_preparation_appro",
              "en_attente_validation_logistique"
            ]
            return enAttenteStatuses.includes(d.status)
          }).length,
          validees: demandesForRole.filter((d) => ["cloturee", "archivee", "confirmee_demandeur", "en_attente_validation_finale_demandeur"].includes(d.status)).length,
          brouillons: 0, // Les validateurs ne voient pas les brouillons
          rejetees: 0, // Les validateurs ne voient pas les demandes rejetées
        })
      } else {
        // Pour les employés normaux
        const mesDemandes = demandesForRole
        setStats({
          total: mesDemandes.length,
          enCours: mesDemandes.filter((d) => ![
            "brouillon", 
            "cloturee", 
            "rejetee", 
            "archivee"
          ].includes(d.status)).length,
          validees: mesDemandes.filter((d) => ["cloturee", "archivee"].includes(d.status)).length,
          brouillons: mesDemandes.filter((d) => d.status === "brouillon").length,
          rejetees: mesDemandes.filter((d) => d.status === "rejetee").length,
        })
      }
    }
  }, [currentUser?.id, demandes])

  const getStatusColor = (status: string) => {
    const colors = {
      brouillon: "bg-gray-500",
      soumise: "bg-blue-500",
      en_attente_validation_conducteur: "bg-orange-500",
      en_attente_validation_logistique: "bg-orange-500", 
      en_attente_validation_responsable_travaux: "bg-orange-500",
      en_attente_validation_charge_affaire: "bg-orange-500",
      en_attente_preparation_appro: "bg-purple-500",
      en_attente_validation_livreur: "bg-purple-500",
      en_attente_reception_livreur: "bg-blue-500",
      en_attente_livraison: "bg-orange-500",
      en_attente_validation_reception_demandeur: "bg-yellow-500",
      en_attente_validation_finale_demandeur: "bg-emerald-500",
      renvoyee_vers_appro: "bg-red-500",
      cloturee_partiellement: "bg-green-400",
      confirmee_demandeur: "bg-green-500",
      cloturee: "bg-green-600",
      rejetee: "bg-red-500",
      archivee: "bg-gray-600",
    }
    return colors[status as keyof typeof colors] || "bg-gray-500"
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      brouillon: "Brouillon",
      soumise: "Soumise",
      en_attente_validation_conducteur: "En attente validation conducteur",
      en_attente_validation_logistique: "En attente validation Logistique",
      en_attente_validation_responsable_travaux: "En attente validation responsable travaux",
      en_attente_validation_charge_affaire: "En attente validation chargé d'affaire",
      en_attente_preparation_appro: "En attente préparation appro",
      en_attente_validation_livreur: "En attente validation livreur",
      en_attente_reception_livreur: "En attente réception livreur",
      en_attente_livraison: "En cours de livraison",
      en_attente_validation_reception_demandeur: "Validation réception",
      en_attente_validation_finale_demandeur: "Prêt à clôturer",
      renvoyee_vers_appro: "Renvoyée vers appro",
      cloturee_partiellement: "Clôturée partiellement",
      confirmee_demandeur: "Confirmée",
      cloturee: "Clôturée",
      rejetee: "Rejetée",
      archivee: "Archivée",
    }
    return labels[status as keyof typeof labels] || status
  }

  // Early returns AFTER all hooks
  if (!currentUser) {
    return (
      <div className="text-center p-8 text-red-500">
        Erreur : Utilisateur non connecté
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Chargement du tableau de bord...</span>
      </div>
    )
  }

  const mesProjetIds = currentUser.projets || []
  const mesProjets = projets.filter((p) => mesProjetIds.includes(p.id)) || []
  const demandesForRole = getDemandesForRole()
  const demandesValidationFinale = demandesForRole.filter(d => d.status === "en_attente_validation_finale_demandeur")

  // Fonction pour filtrer les demandes selon la catégorie et le rôle
  const getFilteredDemandes = (type: "total" | "enCours" | "validees" | "brouillons" | "rejetees") => {
    const demandesToFilter = demandesForRole

    switch (type) {
      case "total":
        return demandesToFilter
      case "enCours":
        if (["conducteur_travaux", "responsable_logistique", "responsable_travaux", "charge_affaire", "responsable_appro", "responsable_livreur"].includes(currentUser?.role || "")) {
          // Pour les validateurs : demandes en attente de leur validation
          const enAttenteStatuses = [
            "en_attente_validation_conducteur",
            "en_attente_validation_logistique", 
            "en_attente_validation_responsable_travaux",
            "en_attente_validation_charge_affaire",
            "en_attente_preparation_appro",
            "en_attente_validation_logistique"
          ]
          return demandesToFilter.filter((d) => enAttenteStatuses.includes(d.status))
        } else {
          // Pour les employés : demandes en cours de traitement
          return demandesToFilter.filter((d) => ![
            "brouillon", 
            "cloturee", 
            "rejetee", 
            "archivee"
          ].includes(d.status))
        }
      case "validees":
        if (["conducteur_travaux", "responsable_logistique", "responsable_travaux", "charge_affaire", "responsable_appro", "responsable_livreur"].includes(currentUser?.role || "")) {
          // Pour les validateurs : demandes qu'ils ont validées (passées à l'étape suivante)
          return demandesToFilter.filter((d) => ["cloturee", "archivee", "confirmee_demandeur", "en_attente_validation_finale_demandeur"].includes(d.status))
        } else {
          // Pour les employés : leurs demandes clôturées
          return demandesToFilter.filter((d) => ["cloturee", "archivee"].includes(d.status))
        }
      case "brouillons":
        // Seuls les employés ont des brouillons
        if (["conducteur_travaux", "responsable_logistique", "responsable_travaux", "charge_affaire", "responsable_appro", "responsable_livreur"].includes(currentUser?.role || "")) {
          return [] // Les validateurs ne voient pas les brouillons
        } else {
          return demandesToFilter.filter((d) => d.status === "brouillon")
        }
      case "rejetees":
        // Seuls les employés voient leurs demandes rejetées
        if (["conducteur_travaux", "responsable_logistique", "responsable_travaux", "charge_affaire", "responsable_appro", "responsable_livreur"].includes(currentUser?.role || "")) {
          return [] // Les validateurs ne voient pas les demandes rejetées
        } else {
          return demandesToFilter.filter((d) => d.status === "rejetee")
        }
      default:
        return []
    }
  }

  const handleCardClick = (type: "total" | "enCours" | "validees" | "brouillons" | "rejetees", title: string) => {
    // Pour les rôles de validation, afficher le modal spécialisé pour les demandes validées
    if (type === "validees" && currentUser && [
      "conducteur_travaux", 
      "responsable_logistique", 
      "responsable_travaux", 
      "charge_affaire", 
      "responsable_appro", 
      "responsable_logistique"
    ].includes(currentUser.role)) {
      setValidatedDemandesModalOpen(true)
    } else {
      setDetailsModalType(type)
      setDetailsModalTitle(title)
      setDetailsModalOpen(true)
    }
  }

  // Génération des données de graphique
  const generateChartData = () => {
    const materialRequests = demandesForRole.filter(d => d.type === "materiel")
    const toolingRequests = demandesForRole.filter(d => d.type === "outillage")
    
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

  const handlePieClick = (data: any) => {
    if (data.name === "Matériel") {
      setActiveChart("material")
    } else if (data.name === "Outillage") {
      setActiveChart("tooling")
    }
  }

  // Fonction pour obtenir les 3 dernières demandes pour mobile
  const getLastThreeRequests = () => {
    const demandesToShow = demandesForRole
      .sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime())
      .slice(0, 3)
    return demandesToShow
  }

  // Fonction pour obtenir les initiales de l'utilisateur
  const getUserInitials = (user: any) => {
    if (!user) return "U"
    const firstName = user.prenom || user.nom || "U"
    const lastName = user.nom || ""
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  // Fonction pour formater le statut pour mobile
  const getStatusForMobile = (status: string) => {
    const statusMap = {
      brouillon: { label: "Brouillon", class: "status-brouillon" },
      soumise: { label: "Soumise", class: "status-soumise" },
      en_attente_validation_conducteur: { label: "En cours", class: "status-en-cours" },
      en_attente_validation_logistique: { label: "En cours", class: "status-en-cours" },
      en_attente_validation_responsable_travaux: { label: "En cours", class: "status-en-cours" },
      en_attente_validation_charge_affaire: { label: "En cours", class: "status-en-cours" },
      en_attente_preparation_appro: { label: "En cours", class: "status-en-cours" },
      en_attente_validation_livreur: { label: "En cours", class: "status-en-cours" },
      en_attente_validation_finale_demandeur: { label: "Validée", class: "status-validee" },
      confirmee_demandeur: { label: "Validée", class: "status-validee" },
      cloturee: { label: "Validée", class: "status-validee" },
      rejetee: { label: "Rejetée", class: "status-rejetee" },
      archivee: { label: "Validée", class: "status-validee" },
    }
    return statusMap[status as keyof typeof statusMap] || { label: status, class: "status-brouillon" }
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Demandes à clôturer pour mobile
  const demandesACloturerMobile = demandes.filter(d => 
    d.technicienId === currentUser?.id && 
    d.status === "en_attente_validation_finale_demandeur"
  )

  // Livraisons assignées pour mobile
  const livraisonsAssigneesMobile = demandes.filter(d => 
    d.livreurAssigneId === currentUser?.id &&
    ["en_attente_validation_livreur", "en_cours_livraison"].includes(d.status)
  )

  // Composant Mobile Dashboard
  const MobileDashboard = () => (
    <div className="mobile-dashboard">
      {/* Header Mobile */}
      <div className="mobile-header">
        <div className="mobile-header-left">
          <div className="mobile-logo">
            L
          </div>
          <div className="mobile-header-title">
            <h1>Gestion Demandes</h1>
            <p>{currentUser?.role === "employe" ? "Employé" : 
               currentUser?.role === "conducteur_travaux" ? "Conducteur Travaux" :
               currentUser?.role === "responsable_logistique" ? "Responsable Logistique" :
               currentUser?.role === "responsable_travaux" ? "Responsable Travaux" :
               currentUser?.role === "charge_affaire" ? "Chargé d'Affaire" :
               currentUser?.role === "responsable_appro" ? "Responsable Appro" :
               currentUser?.role === "responsable_livreur" ? "Responsable Livreur" :
               "Utilisateur"}</p>
          </div>
        </div>
        <div className="mobile-header-actions">
          <div className="mobile-header-icon" onClick={handleManualReload}>
            <Settings size={18} />
          </div>
          <div className="mobile-header-icon">
            <Bell size={18} />
          </div>
          <div className="mobile-avatar">
            {getUserInitials(currentUser)}
          </div>
        </div>
      </div>

      {/* Contenu Mobile */}
      <div className="mobile-content">
        {/* Cartes Statistiques */}
        <div className="mobile-stats-grid">
          <div 
            className="mobile-stat-card stat-total"
            onClick={() => handleCardClick("total", "Toutes mes demandes")}
          >
            <div className="mobile-stat-card-header">
              <span className="mobile-stat-card-title">Total</span>
              <FileText className="mobile-stat-card-icon" />
            </div>
            <div className="mobile-stat-card-value">{stats.total}</div>
            <div className="mobile-stat-card-desc">Mes demandes</div>
          </div>

          <div 
            className="mobile-stat-card stat-encours"
            onClick={() => handleCardClick("enCours", "Mes demandes en cours")}
          >
            <div className="mobile-stat-card-header">
              <span className="mobile-stat-card-title">En cours</span>
              <Clock className="mobile-stat-card-icon" />
            </div>
            <div className="mobile-stat-card-value">{stats.enCours}</div>
            <div className="mobile-stat-card-desc">En traitement</div>
          </div>

          <div 
            className="mobile-stat-card stat-validees"
            onClick={() => handleCardClick("validees", "Mes demandes validées")}
          >
            <div className="mobile-stat-card-header">
              <span className="mobile-stat-card-title">Validées</span>
              <CheckCircle className="mobile-stat-card-icon" />
            </div>
            <div className="mobile-stat-card-value">{stats.validees}</div>
            <div className="mobile-stat-card-desc">Terminées</div>
          </div>

          <div 
            className="mobile-stat-card stat-brouillons"
            onClick={() => handleCardClick("brouillons", "Mes brouillons")}
          >
            <div className="mobile-stat-card-header">
              <span className="mobile-stat-card-title">Brouillons</span>
              <Package className="mobile-stat-card-icon" />
            </div>
            <div className="mobile-stat-card-value">{stats.brouillons}</div>
            <div className="mobile-stat-card-desc">Non soumis</div>
          </div>
        </div>

        {/* Actions Rapides */}
        <div className="mobile-section">
          <h2 className="mobile-section-title">Actions Rapides</h2>
          <div className="mobile-quick-actions">
            <button 
              className="mobile-quick-action-btn btn-materiel"
              onClick={() => {
                setDemandeType("materiel")
                setCreateDemandeModalOpen(true)
              }}
            >
              <div className="mobile-quick-action-icon">
                <Package size={20} />
              </div>
              <div className="mobile-quick-action-text">
                <div className="mobile-quick-action-title">Nouvelle demande matériel</div>
                <div className="mobile-quick-action-desc">Créer une DA matériel</div>
              </div>
            </button>

            <button 
              className="mobile-quick-action-btn btn-outillage"
              onClick={() => {
                setDemandeType("outillage")
                setCreateDemandeModalOpen(true)
              }}
            >
              <div className="mobile-quick-action-icon">
                <Wrench size={20} />
              </div>
              <div className="mobile-quick-action-text">
                <div className="mobile-quick-action-title">Nouvelle demande outillage</div>
                <div className="mobile-quick-action-desc">Créer une DA outillage</div>
              </div>
            </button>

            <button 
              className="mobile-quick-action-btn btn-cloture"
              onClick={() => setUniversalClosureModalOpen(true)}
            >
              <div className="mobile-quick-action-icon">
                <CheckCircle size={20} />
              </div>
              <div className="mobile-quick-action-text">
                <div className="mobile-quick-action-title">Clôturer mes demandes</div>
                <div className="mobile-quick-action-desc">{demandesACloturerMobile.length} demande(s) à clôturer</div>
              </div>
            </button>
          </div>
        </div>

        {/* Section Livraisons Assignées */}
        {livraisonsAssigneesMobile.length > 0 && (
          <div className="mobile-expandable-section">
            <div 
              className="mobile-expandable-header"
              onClick={() => toggleSection('livraisons')}
            >
              <div className="mobile-expandable-header-left">
                <div className="mobile-expandable-icon icon-livraison">
                  <Package size={18} />
                </div>
                <div>
                  <div className="mobile-expandable-title">Livraisons assignées</div>
                  <div className="mobile-expandable-subtitle">Matériel à livrer</div>
                </div>
              </div>
              <span className="mobile-expandable-badge badge-warning">
                {livraisonsAssigneesMobile.length}
              </span>
            </div>
            {expandedSections.livraisons && (
              <div className="mobile-expandable-content">
                <div className="mobile-item-list">
                  {livraisonsAssigneesMobile.slice(0, 3).map((demande) => (
                    <div key={demande.id} className="mobile-item-card">
                      <div className="mobile-item-header">
                        <span className="mobile-item-title">{demande.numero}</span>
                        <span className="mobile-item-badge" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>
                          {demande.type === "materiel" ? "Matériel" : "Outillage"}
                        </span>
                      </div>
                      <div className="mobile-item-details">
                        <span className="mobile-item-detail">
                          <Clock size={12} />
                          {new Date(demande.dateCreation).toLocaleDateString('fr-FR')}
                        </span>
                        <span className="mobile-item-detail">
                          <Package size={12} />
                          {demande.items?.length || 0} article(s)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Section Demandes à Clôturer */}
        {demandesACloturerMobile.length > 0 && (
          <div className="mobile-expandable-section">
            <div 
              className="mobile-expandable-header"
              onClick={() => toggleSection('cloture')}
            >
              <div className="mobile-expandable-header-left">
                <div className="mobile-expandable-icon icon-cloture">
                  <CheckCircle size={18} />
                </div>
                <div>
                  <div className="mobile-expandable-title">À clôturer</div>
                  <div className="mobile-expandable-subtitle">Confirmer la réception</div>
                </div>
              </div>
              <span className="mobile-expandable-badge badge-success">
                {demandesACloturerMobile.length}
              </span>
            </div>
            {expandedSections.cloture && (
              <div className="mobile-expandable-content">
                <div className="mobile-item-list">
                  {demandesACloturerMobile.slice(0, 3).map((demande) => (
                    <div key={demande.id} className="mobile-item-card">
                      <div className="mobile-item-header">
                        <span className="mobile-item-title">{demande.numero}</span>
                        <span className="mobile-item-badge" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>
                          Prêt
                        </span>
                      </div>
                      <div className="mobile-item-details">
                        <span className="mobile-item-detail">
                          <Clock size={12} />
                          {new Date(demande.dateCreation).toLocaleDateString('fr-FR')}
                        </span>
                        <span className="mobile-item-detail">
                          <Package size={12} />
                          {demande.items?.length || 0} article(s)
                        </span>
                      </div>
                      <div className="mobile-item-actions">
                        <button 
                          className="mobile-item-btn mobile-item-btn-success"
                          onClick={(e) => {
                            e.stopPropagation()
                            setUniversalClosureModalOpen(true)
                          }}
                        >
                          <CheckCircle size={14} />
                          Clôturer
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Section Mes Projets */}
        {mesProjets.length > 0 && (
          <div className="mobile-expandable-section">
            <div 
              className="mobile-expandable-header"
              onClick={() => toggleSection('projets')}
            >
              <div className="mobile-expandable-header-left">
                <div className="mobile-expandable-icon icon-projets">
                  <FolderOpen size={18} />
                </div>
                <div>
                  <div className="mobile-expandable-title">Mes projets</div>
                  <div className="mobile-expandable-subtitle">Projets assignés</div>
                </div>
              </div>
              <span className="mobile-expandable-badge">
                {mesProjets.length}
              </span>
            </div>
            {expandedSections.projets && (
              <div className="mobile-expandable-content">
                <div className="mobile-item-list" style={{ paddingTop: '8px' }}>
                  {mesProjets.map((projet) => (
                    <div key={projet.id} className="mobile-projet-item">
                      <div className="mobile-projet-icon">
                        <FolderOpen size={16} />
                      </div>
                      <div className="mobile-projet-info">
                        <div className="mobile-projet-name">{projet.nom}</div>
                        <div className="mobile-projet-desc">{projet.description}</div>
                      </div>
                      <span className={`mobile-projet-status ${projet.actif ? 'status-actif' : 'status-inactif'}`}>
                        {projet.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mes 3 dernières demandes */}
        <div className="mobile-section">
          <h2 className="mobile-section-title">Dernières demandes</h2>
          <div className="mobile-demandes-list">
            {getLastThreeRequests().length > 0 ? (
              getLastThreeRequests().map((demande) => {
                const statusInfo = getStatusForMobile(demande.status)
                return (
                  <div key={demande.id} className="mobile-demande-item">
                    <div className="mobile-demande-header">
                      <h3 className="mobile-demande-title">
                        {demande.numero} - {demande.type === "materiel" ? "Matériel" : "Outillage"}
                      </h3>
                      <span className={`mobile-demande-status ${statusInfo.class}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="mobile-demande-info">
                      {new Date(demande.dateCreation).toLocaleDateString('fr-FR')} • {demande.items?.length || 0} article(s)
                    </p>
                  </div>
                )
              })
            ) : (
              <p className="mobile-demande-info">Aucune demande récente</p>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Bottom */}
      <div className="mobile-bottom-nav">
        <div className="mobile-nav-item active">
          <Home className="mobile-nav-icon" />
          <span className="mobile-nav-label">Accueil</span>
        </div>
        <div 
          className="mobile-nav-item"
          onClick={() => handleCardClick("total", "Toutes mes demandes")}
        >
          <Archive className="mobile-nav-icon" />
          <span className="mobile-nav-label">Demandes</span>
          {stats.total > 0 && (
            <span className="mobile-nav-badge">{stats.total}</span>
          )}
        </div>
        <div 
          className="mobile-nav-item"
          onClick={() => {
            setDemandeType("materiel")
            setCreateDemandeModalOpen(true)
          }}
        >
          <Plus className="mobile-nav-icon" />
          <span className="mobile-nav-label">Créer</span>
        </div>
        <div 
          className="mobile-nav-item"
          onClick={() => setUniversalClosureModalOpen(true)}
        >
          <CheckCircle className="mobile-nav-icon" />
          <span className="mobile-nav-label">Clôturer</span>
          {demandesACloturerMobile.length > 0 && (
            <span className="mobile-nav-badge">{demandesACloturerMobile.length}</span>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Interface Mobile */}
      <MobileDashboard />
      
      {/* Interface Desktop */}
      <div className="desktop-dashboard dashboard-fullscreen bg-gray-50 flex flex-col">
        <div className="flex-1 flex flex-col m-0 p-0 w-full">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 px-2 sm:px-4 py-3 mb-0 bg-white shadow-sm border-b">Tableau de Bord Employé</h1>

        {/* Layout principal : pleine largeur avec distribution équilibrée */}
        <div className="flex-1 grid grid-cols-1 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4 h-full p-2 sm:p-4 m-0 w-full">
          {/* Colonne de gauche (large) - 3/4 de la largeur */}
          <div className="xl:col-span-3 flex flex-col justify-between space-y-3 sm:space-y-4 h-full order-2 xl:order-1">
            {/* Vue d'ensemble - Cards statistiques */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
              <Card className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: '#015fc4' }} onClick={() => handleCardClick("total", "Toutes mes demandes")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total demandes</CardTitle>
                  <FileText className="h-4 w-4" style={{ color: '#015fc4' }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: '#015fc4' }}>{stats.total}</div>
                  <p className="text-xs text-muted-foreground">Toutes mes demandes</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: '#f97316' }} onClick={() => handleCardClick("enCours", "Mes demandes en cours")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">En cours</CardTitle>
                  <Clock className="h-4 w-4" style={{ color: '#f97316' }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: '#f97316' }}>{stats.enCours}</div>
                  <p className="text-xs text-muted-foreground">En traitement</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: '#22c55e' }} onClick={() => handleCardClick("validees", "Mes demandes validées")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Validées</CardTitle>
                  <CheckCircle className="h-4 w-4" style={{ color: '#22c55e' }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: '#22c55e' }}>{stats.validees}</div>
                  <p className="text-xs text-muted-foreground">Demandes validées</p>
                </CardContent>
              </Card>

              <Card 
                className={`border-l-4 cursor-pointer hover:shadow-md transition-shadow ${stats.rejetees > 0 ? 'animate-pulse' : ''}`} 
                style={{ 
                  borderLeftColor: '#fc2d1f',
                  backgroundColor: stats.rejetees > 0 ? 'rgba(252, 45, 31, 0.05)' : 'white'
                }} 
                onClick={() => handleCardClick("rejetees", "Mes demandes rejetées")}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Rejetées</CardTitle>
                  <XCircle className="h-4 w-4" style={{ color: '#fc2d1f' }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: '#fc2d1f' }}>{stats.rejetees}</div>
                  <p className="text-xs text-muted-foreground">À revoir</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: '#6b7280' }} onClick={() => handleCardClick("brouillons", "Mes brouillons")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Brouillons</CardTitle>
                  <Package className="h-4 w-4" style={{ color: '#6b7280' }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: '#6b7280' }}>{stats.brouillons}</div>
                  <p className="text-xs text-muted-foreground">En brouillon</p>
                </CardContent>
              </Card>
            </div>

            {/* Section des livraisons assignées */}
            <MesLivraisonsSection />

            {/* Mes demandes en attente de validation conducteur */}
            <MesDemandesEnAttente />

            {/* Validation de réception des demandes livrées */}
            <ValidationReceptionList />

            {/* Mes demandes à clôturer */}
            <MesDemandesACloturer />

            {/* Mes projets - Tableau fixe scrollable */}
            {mesProjets.length > 0 && (
              <Card className="flex-1 flex flex-col min-h-0">
                <CardHeader className="flex-shrink-0">
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                    <FolderOpen className="h-5 w-5" />
                    Mes projets ({mesProjets.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0 flex flex-col min-h-0">
                    {/* Tableau fixe scrollable - Responsive */}
                    <div className="flex-1 overflow-hidden border border-gray-200 rounded-lg flex flex-col">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Projet
                              </th>
                              <th className="hidden sm:table-cell px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Description
                              </th>
                              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date début
                              </th>
                              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Statut
                              </th>
                            </tr>
                          </thead>
                        </table>
                      </div>
                      {/* Corps du tableau avec scroll vertical fixe */}
                      <div className="overflow-y-auto max-h-[300px] sm:max-h-[400px] lg:max-h-[500px] bg-white">
                        <table className="min-w-full divide-y divide-gray-200">
                          <tbody className="divide-y divide-gray-200">
                            {mesProjets.map((projet, index) => (
                              <tr 
                                key={projet.id} 
                                className={`hover:bg-gray-50 transition-colors ${
                                  index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                                }`}
                              >
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <FolderOpen className="h-4 w-4 mr-2" style={{ color: '#015fc4' }} />
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">
                                        {projet.nom}
                                      </div>
                                      {/* Description visible sur mobile */}
                                      <div className="sm:hidden text-xs text-gray-500 mt-1 truncate max-w-[120px]">
                                        {projet.description}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="hidden sm:table-cell px-3 sm:px-6 py-4">
                                  <div className="text-sm text-gray-600 max-w-xs truncate" title={projet.description}>
                                    {projet.description}
                                  </div>
                                </td>
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                  <div className="text-xs sm:text-sm text-gray-500">
                                    {new Date(projet.dateDebut).toLocaleDateString('fr-FR')}
                                  </div>
                                </td>
                                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                                  <Badge 
                                    className="text-xs font-medium px-2 py-1 rounded-full"
                                    style={{
                                      backgroundColor: projet.actif ? "#dcfce7" : "#f3f4f6",
                                      color: projet.actif ? "#166534" : "#374151",
                                      border: `1px solid ${projet.actif ? "#166534" : "#374151"}20`
                                    }}
                                  >
                                    {projet.actif ? "Actif" : "Inactif"}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Colonne de droite (fine) - 1/4 de la largeur */}
          <div className="xl:col-span-1 flex flex-col justify-between space-y-3 sm:space-y-4 h-full order-1 xl:order-2">
            {/* Actions rapides */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions Rapides</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2">
                  <Button 
                    className="justify-start text-white" 
                    style={{ backgroundColor: '#015fc4' }}
                    size="sm"
                    onClick={() => {
                      setDemandeType("materiel")
                      setCreateDemandeModalOpen(true)
                    }}
                  >
                    <Package className="h-4 w-4 mr-2" />
                    <span className="text-sm">Nouvelle demande matériel</span>
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
                    <Wrench className="h-4 w-4 mr-2" />
                    <span className="text-sm">Nouvelle demande outillage</span>
                  </Button>
                  <Button
                    className="justify-start text-white"
                    style={{ backgroundColor: '#16a34a' }}
                    size="sm"
                    onClick={() => setUniversalClosureModalOpen(true)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span className="text-sm">Clôturer mes demandes</span>
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

      {/* Modals fonctionnels - Partagés entre mobile et desktop */}
      <CreateDemandeModal
        isOpen={createDemandeModalOpen}
        onClose={() => setCreateDemandeModalOpen(false)}
        type={demandeType}
      />
      <DemandesCategoryModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        demandes={getFilteredDemandes(detailsModalType)}
        title={detailsModalTitle}
        categoryType={detailsModalType}
        currentUser={currentUser}
      />
      <ValidatedRequestsHistory
        isOpen={validatedHistoryModalOpen}
        onClose={() => setValidatedHistoryModalOpen(false)}
      />
      <ValidatedDemandesModal
        isOpen={validatedDemandesModalOpen}
        onClose={() => setValidatedDemandesModalOpen(false)}
        currentUser={currentUser}
      />
      <UniversalClosureModal
        isOpen={universalClosureModalOpen}
        onClose={() => setUniversalClosureModalOpen(false)}
      />
      </div>
    </>
  )
}
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  Truck,
  Users,
  FolderOpen,
  Settings,
  Search,
  Wrench,
  BarChart3,
  TrendingUp,
  DollarSign,
  Activity,
  Edit,
  Trash2,
  Eye,
  X
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
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
} from "recharts"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { DecideurButton } from "@/components/shared/decideur-button"
import CreateDemandeModal from "@/components/demandes/create-demande-modal"
import ValidationPreparationList from "@/components/charge-affaire/validation-preparation-list"
import ValidationDemandesList from "@/components/validation/validation-demandes-list"
import { UserRequestsChart } from "@/components/charts/user-requests-chart"
import UserDetailsModal from "@/components/modals/user-details-modal"
import MesDemandesACloturer from "@/components/demandes/mes-demandes-a-cloturer"
import UniversalClosureModal from "@/components/modals/universal-closure-modal"
import ValidatedRequestsHistory from "@/components/dashboard/validated-requests-history"
import MesLivraisonsSection from "@/components/dashboard/mes-livraisons-section"
import LivraisonsCard from "@/components/dashboard/livraisons-card"
import { useAutoReload } from "@/hooks/useAutoReload"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

export default function ChargeAffaireDashboard() {
  const { currentUser, demandes, projets, users, isLoading } = useStore()
  const { handleManualReload } = useAutoReload("CHARGE-AFFAIRE")

  // Fonctions helper pour résoudre les noms
  const getProjetNom = (demande: any) => {
    if (demande.projet?.nom) return demande.projet.nom
    if (demande.projetId) {
      const projet = projets.find(p => p.id === demande.projetId)
      if (projet?.nom) return projet.nom
      return demande.projetId.length > 15 ? `${demande.projetId.substring(0, 8)}...` : demande.projetId
    }
    return "Non spécifié"
  }

  const getDemandeurNom = (demande: any) => {
    if (demande.technicien?.prenom && demande.technicien?.nom) {
      return `${demande.technicien.prenom} ${demande.technicien.nom}`
    }
    if (demande.technicienId) {
      const user = users.find(u => u.id === demande.technicienId)
      if (user) return `${user.prenom} ${user.nom}`
      return demande.technicienId.length > 15 ? `${demande.technicienId.substring(0, 8)}...` : demande.technicienId
    }
    return "Non spécifié"
  }

  const [stats, setStats] = useState({
    total: 0,
    aValider: 0,
    enCours: 0,
    validees: 0,
    rejetees: 0,
  })

  const [createDemandeModalOpen, setCreateDemandeModalOpen] = useState(false)
  const [demandeType, setDemandeType] = useState<"materiel" | "outillage">("materiel")
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [detailsModalType, setDetailsModalType] = useState<"total" | "aValider" | "enCours" | "validees" | "rejetees">("total")
  const [detailsModalTitle, setDetailsModalTitle] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [activeChart, setActiveChart] = useState<"material" | "tooling">("material")
  const [universalClosureModalOpen, setUniversalClosureModalOpen] = useState(false)
  const [validatedHistoryModalOpen, setValidatedHistoryModalOpen] = useState(false)
  
  // États pour l'édition et la suppression
  const [editDemandeOpen, setEditDemandeOpen] = useState(false)
  const [demandeToEdit, setDemandeToEdit] = useState<any>(null)
  const [demandeToDelete, setDemandeToDelete] = useState<any>(null)
  
  // États pour les filtres financiers
  const [financePeriode, setFinancePeriode] = useState<"all" | "month" | "quarter" | "year">("all")
  const [financeType, setFinanceType] = useState<"all" | "materiel" | "outillage">("all")
  const [financeStatut, setFinanceStatut] = useState<"all" | "chiffrees" | "non_chiffrees">("all")

  // Données chargées automatiquement par useDataLoader

  useEffect(() => {
    if (currentUser) {
      // Mes demandes personnelles
      const mesDemandesCA = demandes.filter((d) => d.technicienId === currentUser.id)

      // HISTORIQUE COMPLET : Inclure uniquement les demandes validées PAR MOI
      const demandesValidees = demandes.filter((d) => {
        // Vérifier que c'est MOI qui ai validé cette demande (signature obligatoire)
        return d.validationChargeAffaire?.userId === currentUser.id &&
          [
            "en_attente_preparation_appro",
            "en_attente_validation_logistique",
            "en_attente_validation_finale_demandeur",
            "confirmee_demandeur",
            "cloturee",
            "rejetee"
          ].includes(d.status)
      })

      console.log(`📊 [CHARGE-AFFAIRE-DASHBOARD] Statistiques validations pour ${currentUser.nom}:`, {
        totalValidees: demandesValidees.length,
        demandesAvecMaSignature: demandesValidees.length,
        enCours: demandesValidees.filter(d => !["cloturee", "rejetee", "confirmee_demandeur"].includes(d.status)).length,
        terminees: demandesValidees.filter(d => ["cloturee", "confirmee_demandeur"].includes(d.status)).length,
        rejetees: demandesValidees.filter(d => d.status === "rejetee").length
      })

      setStats({
        // Total = MES demandes créées
        total: mesDemandesCA.length,
        // À valider = Demandes à valider (rôle validateur)
        aValider: demandes.filter((d) => d.status === "en_attente_validation_charge_affaire").length,
        // En cours = MES demandes en cours
        enCours: mesDemandesCA.filter((d) => ![
            "brouillon", 
            "cloturee", 
            "rejetee", 
            "archivee"
          ].includes(d.status)
        ).length,
        // Validées = Demandes que J'AI validées
        validees: demandesValidees.length,
        // Rejetées = MES demandes rejetées
        rejetees: mesDemandesCA.filter((d) => d.status === "rejetee").length,
      })
    }
  }, [currentUser, demandes])

  const mesDemandes = currentUser ? demandes.filter((d) => d.technicienId === currentUser.id) : []

  // Fonction pour filtrer les demandes selon la catégorie
  const getFilteredDemandes = (type: "total" | "aValider" | "enCours" | "validees" | "rejetees") => {
    switch (type) {
      case "total":
        // MES demandes personnelles
        return mesDemandes
      case "aValider":
        // Demandes à valider (rôle validateur)
        return demandes.filter((d) => d.status === "en_attente_validation_charge_affaire")
      case "enCours":
        // MES demandes en cours (en tant que demandeur)
        return mesDemandes.filter((d) => ![
          "brouillon", 
          "cloturee", 
          "rejetee", 
          "archivee"
        ].includes(d.status))
      case "validees":
        // HISTORIQUE COMPLET : Uniquement les demandes validées PAR MOI (signature obligatoire)
        return currentUser ? demandes.filter((d) => 
          d.validationChargeAffaire?.userId === currentUser.id &&
          [
            "en_attente_preparation_appro",
            "en_attente_validation_logistique",
            "en_attente_validation_finale_demandeur",
            "confirmee_demandeur",
            "cloturee",
            "rejetee"
          ].includes(d.status)
        ) : []
      case "rejetees":
        // MES demandes rejetées
        return mesDemandes.filter((d) => d.status === "rejetee")
      default:
        return []
    }
  }

  const handleCardClick = (type: "total" | "aValider" | "enCours" | "validees" | "rejetees", title: string) => {
    if (type === "total") {
      setValidatedHistoryModalOpen(true)
    } else {
      setDetailsModalType(type)
      setDetailsModalTitle(title)
      setDetailsModalOpen(true)
    }
  }

  // Fonction pour modifier une demande
  const handleModifier = (demande: any) => {
    setDemandeToEdit(demande)
    setEditDemandeOpen(true)
  }

  // Fonction pour supprimer une demande
  const handleSupprimer = async (demande: any) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la demande ${demande.numero} ?`)) {
      try {
        const { deleteDemande } = useStore.getState()
        await deleteDemande(demande.id)
        alert("Demande supprimée avec succès")
      } catch (error) {
        alert("Erreur lors de la suppression de la demande")
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Génération des données de graphique
  const generateChartData = () => {
    const materialRequests = mesDemandes.filter(d => d.type === "materiel")
    const toolingRequests = mesDemandes.filter(d => d.type === "outillage")
    
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

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 md:p-6">
      <div className="max-w-full mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Tableau de Bord Chargé Affaire</h1>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                onClick={handleManualReload}
                variant="outline"
                className="bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 w-full sm:w-auto"
                size="sm"
              >
                🔄 Actualiser
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={6}>
              Recharger les données (demandes, statistiques)
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Layout principal : deux colonnes */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-3 sm:gap-4">
          {/* Colonne de gauche (large) - 3/4 de la largeur */}
          <div className="xl:col-span-3 space-y-3 sm:space-y-4 order-2 xl:order-1">
            {/* Vue d'ensemble - Cards statistiques */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: '#015fc4' }} onClick={() => handleCardClick("total", "Mes demandes")}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Mes demandes</CardTitle>
                      <Package className="h-4 w-4" style={{ color: '#015fc4' }} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" style={{ color: '#015fc4' }}>{mesDemandes.length}</div>
                      <p className="text-xs text-muted-foreground">Mes demandes créées</p>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>
                  Ouvrir la liste de tes demandes créées
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: '#f97316' }} onClick={() => handleCardClick("aValider", "Demandes à valider")}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">En attente</CardTitle>
                      <Clock className="h-4 w-4" style={{ color: '#f97316' }} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" style={{ color: '#f97316' }}>{stats.aValider}</div>
                      <p className="text-xs text-muted-foreground">À valider par moi</p>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>
                  Voir les demandes en attente de ta validation
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: '#3b82f6' }} onClick={() => handleCardClick("enCours", "Mes demandes en cours")}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">En cours</CardTitle>
                      <Clock className="h-4 w-4" style={{ color: '#3b82f6' }} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" style={{ color: '#3b82f6' }}>{stats.enCours}</div>
                      <p className="text-xs text-muted-foreground">Matériel et outillage</p>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>
                  Voir tes demandes encore en traitement
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: '#22c55e' }} onClick={() => handleCardClick("validees", "Demandes que j'ai validées")}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Validées</CardTitle>
                      <CheckCircle className="h-4 w-4" style={{ color: '#22c55e' }} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" style={{ color: '#22c55e' }}>{stats.validees}</div>
                      <p className="text-xs text-muted-foreground">Validées par moi</p>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>
                  Accéder à l’historique des demandes que tu as validées
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Card className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: '#fc2d1f' }} onClick={() => handleCardClick("rejetees", "Mes demandes rejetées")}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Rejetées</CardTitle>
                      <XCircle className="h-4 w-4" style={{ color: '#fc2d1f' }} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" style={{ color: '#fc2d1f' }}>{stats.rejetees}</div>
                      <p className="text-xs text-muted-foreground">Refusées</p>
                    </CardContent>
                  </Card>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8}>
                  Voir tes demandes rejetées
                </TooltipContent>
              </Tooltip>

              {/* Carte Livraisons - Affichée uniquement si l'utilisateur est assigné comme livreur */}
              <LivraisonsCard />
            </div>

            {/* Section des livraisons assignées */}
            <MesLivraisonsSection />

            {/* Liste des demandes à valider */}
            <ValidationDemandesList type="materiel" title="Demandes de matériel à valider" />
            <ValidationDemandesList type="outillage" title="Demandes d'outillage à valider" />
            
            {/* Mes demandes à clôturer */}
            <MesDemandesACloturer />
            
            {/* Section Finance */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Finance
                </CardTitle>
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
                {/* NOTE: Les coûts affichés représentent les QUANTITÉS RESTANTES à livrer (quantité validée - quantité livrée) */}
                {/* Cela permet de connaître le coût de ce qui reste à livrer suite aux ruptures de stock magasin */}
                {(() => {
                  const now = new Date()
                  const demandesFiltrees = demandes.filter(d => {
                    if (financeType !== "all" && d.type !== financeType) return false
                    if (financeStatut === "chiffrees" && (!d.coutTotal || d.coutTotal === 0)) return false
                    if (financeStatut === "non_chiffrees" && d.coutTotal && d.coutTotal > 0) return false
                    
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
                                    {coutMateriel > 0 ? `${coutMateriel.toLocaleString('fr-FR')} FCFA` : '-'}
                                  </td>
                                  <td className="p-2 text-center text-purple-600">
                                    {coutOutillage > 0 ? `${coutOutillage.toLocaleString('fr-FR')} FCFA` : '-'}
                                  </td>
                                  <td className="p-2 text-right font-bold text-green-700">
                                    {coutTotal > 0 ? `${coutTotal.toLocaleString('fr-FR')} FCFA` : '-'}
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
                                {demandesFiltrees.filter(d => d.type === 'materiel').reduce((sum, d) => sum + (d.coutTotal || 0), 0).toLocaleString('fr-FR')} FCFA
                              </td>
                              <td className="p-2 text-center text-purple-700">
                                {demandesFiltrees.filter(d => d.type === 'outillage').reduce((sum, d) => sum + (d.coutTotal || 0), 0).toLocaleString('fr-FR')} FCFA
                              </td>
                              <td className="p-2 text-right text-green-800">
                                {demandesFiltrees.reduce((sum, d) => sum + (d.coutTotal || 0), 0).toLocaleString('fr-FR')} FCFA
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )
                })()}

                {/* Graphiques */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Répartition par type */}
                  {/* NOTE: Coûts basés sur les quantités restantes à livrer */}
                  <div className="bg-white border rounded-lg p-4 shadow-sm">
                    <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Package className="h-4 w-4 text-blue-600" />
                      Répartition des coûts par type (Quantités restantes)
                    </h4>
                    {(() => {
                      const coutMateriel = demandes.filter(d => d.type === 'materiel').reduce((sum, d) => sum + (d.coutTotal || 0), 0)
                      const coutOutillage = demandes.filter(d => d.type === 'outillage').reduce((sum, d) => sum + (d.coutTotal || 0), 0)
                      const total = coutMateriel + coutOutillage
                      const pctMateriel = total > 0 ? Math.round((coutMateriel / total) * 100) : 0
                      const pctOutillage = total > 0 ? Math.round((coutOutillage / total) * 100) : 0
                      
                      return (
                        <div className="space-y-4">
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
                                {coutMateriel > 0 && `${coutMateriel.toLocaleString('fr-FR')} FCFA`}
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
                                {coutOutillage > 0 && `${coutOutillage.toLocaleString('fr-FR')} FCFA`}
                              </div>
                            </div>
                          </div>
                          
                          <div className="pt-2 border-t flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Total</span>
                            <span className="text-lg font-bold text-green-700">{total.toLocaleString('fr-FR')} FCFA</span>
                          </div>
                        </div>
                      )
                    })()}
                  </div>

                  {/* Top 5 projets */}
                  {/* NOTE: Coûts basés sur les quantités restantes à livrer */}
                  <div className="bg-white border rounded-lg p-4 shadow-sm">
                    <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-green-600" />
                      Top 5 projets par coût (Quantités restantes)
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
                                    {projet.cout.toLocaleString('fr-FR')} FCFA
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
                {/* NOTE: Indicateurs basés sur les coûts des quantités restantes à livrer */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-purple-600" />
                    Indicateurs de Performance (Quantités restantes)
                  </h4>
                  {(() => {
                    const demandesChiffrees = demandes.filter(d => d.coutTotal && d.coutTotal > 0)
                    const tauxApprobation = demandes.length > 0 ? Math.round((demandesChiffrees.length / demandes.length) * 100) : 0
                    const coutMoyenMateriel = demandesChiffrees.filter(d => d.type === 'materiel').length > 0
                      ? Math.round(demandesChiffrees.filter(d => d.type === 'materiel').reduce((sum, d) => sum + (d.coutTotal || 0), 0) / demandesChiffrees.filter(d => d.type === 'materiel').length)
                      : 0
                    const coutMoyenOutillage = demandesChiffrees.filter(d => d.type === 'outillage').length > 0
                      ? Math.round(demandesChiffrees.filter(d => d.type === 'outillage').reduce((sum, d) => sum + (d.coutTotal || 0), 0) / demandesChiffrees.filter(d => d.type === 'outillage').length)
                      : 0
                    
                    return (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-700">2</div>
                          <div className="text-xs text-gray-600">jours</div>
                          <div className="text-xs font-medium text-gray-700 mt-1">Délai Moyen</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-700">{tauxApprobation}%</div>
                          <div className="text-xs text-gray-600">{demandesChiffrees.length}/{demandes.length}</div>
                          <div className="text-xs font-medium text-gray-700 mt-1">Taux Approbation</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-700">{coutMoyenMateriel.toLocaleString('fr-FR')} €</div>
                          <div className="text-xs text-gray-600">par demande</div>
                          <div className="text-xs font-medium text-gray-700 mt-1">Coût Moy. Matériel</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-cyan-700">{coutMoyenOutillage.toLocaleString('fr-FR')} €</div>
                          <div className="text-xs text-gray-600">par demande</div>
                          <div className="text-xs font-medium text-gray-700 mt-1">Coût Moy. Outillage</div>
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
                <div className="grid grid-cols-1 gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
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
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={6}>
                      Créer une nouvelle demande de matériel
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
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
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={6}>
                      Créer une nouvelle demande d’outillage
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        className="justify-start text-white"
                        style={{ backgroundColor: '#16a34a' }}
                        size="sm"
                        onClick={() => setUniversalClosureModalOpen(true)}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        <span className="text-sm">Clôturer mes demandes</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={6}>
                      Confirmer la réception et clôturer les demandes prêtes
                    </TooltipContent>
                  </Tooltip>

                  <DecideurButton />
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
                    <RechartsTooltip />
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
                      <RechartsTooltip />
                      <Line type="monotone" dataKey="value" stroke="#015fc4" strokeWidth={2} />
                    </LineChart>
                  ) : (
                    <BarChart data={toolingFlowData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis fontSize={12} />
                      <RechartsTooltip />
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
      <CreateDemandeModal
        isOpen={createDemandeModalOpen}
        onClose={() => setCreateDemandeModalOpen(false)}
        type={demandeType}
      />
      {/* Modale personnalisée pour les détails des demandes */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[80vh] p-4 sm:p-6" showCloseButton={false}>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>{detailsModalTitle}</DialogTitle>
              <Button
                onClick={() => setDetailsModalOpen(false)}
                className="absolute top-4 right-4 rounded-full p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-red-600 hover:text-white hover:bg-red-600 transition-all focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none z-50 border border-red-600"
                variant="ghost"
                size="sm"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </DialogHeader>
          
          <div className="space-y-4 overflow-y-auto" style={{maxHeight: 'calc(80vh - 120px)'}}>
            {getFilteredDemandes(detailsModalType).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Aucune demande trouvée pour cette catégorie</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {getFilteredDemandes(detailsModalType).map((demande) => (
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
                        
                        <table className="text-sm text-gray-600 w-full">
                          <tbody>
                            <tr>
                              <td className="font-semibold pr-2 py-0.5 whitespace-nowrap align-top w-24">Projet:</td>
                              <td className="py-0.5 break-all">{getProjetNom(demande)}</td>
                            </tr>
                            <tr>
                              <td className="font-semibold pr-2 py-0.5 whitespace-nowrap align-top w-24">Demandeur:</td>
                              <td className="py-0.5 break-all">{getDemandeurNom(demande)}</td>
                            </tr>
                            <tr>
                              <td className="font-semibold pr-2 py-0.5 whitespace-nowrap align-top w-24">Date:</td>
                              <td className="py-0.5">{new Date(demande.dateCreation).toLocaleDateString('fr-FR')}</td>
                            </tr>
                            {demande.commentaires && (
                              <tr>
                                <td className="font-semibold pr-2 py-0.5 whitespace-nowrap align-top w-24">Commentaires:</td>
                                <td className="py-0.5 break-all">{demande.commentaires}</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-blue-600 hover:text-blue-700"
                            onClick={() => {
                              // Voir les détails - peut ouvrir DemandeDetailsModal si besoin
                            }}
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-green-600 hover:text-green-700"
                            onClick={() => handleModifier(demande)}
                            title="Modifier la demande"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleSupprimer(demande)}
                            title="Supprimer la demande"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {demande.status === "en_attente_validation_finale_demandeur" && (
                          <Button 
                            size="sm" 
                            className="bg-green-500 hover:bg-green-600 text-white"
                            onClick={() => {
                              // Ici on peut ajouter la logique de clôture
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
      <UniversalClosureModal
        isOpen={universalClosureModalOpen}
        onClose={() => setUniversalClosureModalOpen(false)}
      />
      <ValidatedRequestsHistory
        isOpen={validatedHistoryModalOpen}
        onClose={() => setValidatedHistoryModalOpen(false)}
      />
      
      {/* Modale d'édition */}
      {demandeToEdit && (
        <CreateDemandeModal
          isOpen={editDemandeOpen}
          onClose={() => {
            setEditDemandeOpen(false)
            setDemandeToEdit(null)
          }}
          type={demandeToEdit.type}
          existingDemande={demandeToEdit}
        />
      )}
    </div>
  )
}

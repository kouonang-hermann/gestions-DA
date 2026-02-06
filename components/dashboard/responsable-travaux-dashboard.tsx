"use client"

import { useState, useEffect } from "react"
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
  FileText, 
  Eye, 
  Plus,
  Users,
  FolderOpen,
  Settings,
  Search,
  Wrench,
  BarChart3,
  TrendingUp
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
import ValidationDemandesList from "@/components/validation/validation-demandes-list"
import DemandeDetailsModal from "@/components/modals/demande-details-modal"
import CreateDemandeModal from "@/components/demandes/create-demande-modal"
import RequestsFlowChart from "@/components/charts/requests-flow-chart"
import MesDemandesACloturer from "@/components/demandes/mes-demandes-a-cloturer"
import UniversalClosureModal from "@/components/modals/universal-closure-modal"
import UserDetailsModal from "@/components/modals/user-details-modal"
import ValidatedRequestsHistory from "@/components/dashboard/validated-requests-history"
import LivraisonsAEffectuer from "@/components/dashboard/livraisons-a-effectuer"
import { useAutoReload } from "@/hooks/useAutoReload"
import type { Demande } from "@/types"

export default function ResponsableTravauxDashboard() {
  const { currentUser, demandes, projets, isLoading } = useStore()
  const { handleManualReload } = useAutoReload("RESPONSABLE-TRAVAUX")

  const [stats, setStats] = useState({
    total: 0,
    enAttente: 0,
    enCours: 0,
    validees: 0,
    rejetees: 0,
  })

  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null)
  const [createDemandeModalOpen, setCreateDemandeModalOpen] = useState(false)
  const [demandeType, setDemandeType] = useState<"materiel" | "outillage">("materiel")
  const [searchTerm, setSearchTerm] = useState("")
  const [activeChart, setActiveChart] = useState<"material" | "tooling">("material")
  const [universalClosureModalOpen, setUniversalClosureModalOpen] = useState(false)
  const [userDetailsModalOpen, setUserDetailsModalOpen] = useState(false)
  const [userDetailsModalType, setUserDetailsModalType] = useState<"total" | "enAttente" | "enCours" | "validees" | "rejetees">("total")
  const [userDetailsModalTitle, setUserDetailsModalTitle] = useState("")
  const [validatedHistoryModalOpen, setValidatedHistoryModalOpen] = useState(false)

  // Calcul des statistiques
  useEffect(() => {
    if (currentUser) {
      // Filtrer les demandes (matériel + outillage) qui nécessitent la validation du responsable des travaux
      // ET qui sont dans les projets assignés à l'utilisateur
      const demandesAValider = demandes.filter((d) => 
        // Filtrer par projet si l'utilisateur a des projets assignés
        (!currentUser.projets || currentUser.projets.length === 0 || currentUser.projets.includes(d.projetId))
      )

      // HISTORIQUE COMPLET : Inclure uniquement les demandes validées PAR MOI (signature obligatoire)
      const demandesValidees = demandesAValider.filter((d) => 
        d.validationResponsableTravaux?.userId === currentUser.id &&
        [
          "en_attente_validation_charge_affaire", 
          "en_attente_preparation_appro",
          "en_attente_validation_logistique",
          "en_attente_validation_finale_demandeur",
          "confirmee_demandeur",
          "cloturee",
          "rejetee"
        ].includes(d.status)
      )

      console.log(`📊 [RESPONSABLE-TRAVAUX-DASHBOARD] Statistiques validations pour ${currentUser.nom}:`, {
        totalValidees: demandesValidees.length,
        enCours: demandesValidees.filter(d => !["cloturee", "rejetee", "confirmee_demandeur"].includes(d.status)).length,
        terminees: demandesValidees.filter(d => ["cloturee", "confirmee_demandeur"].includes(d.status)).length,
        rejetees: demandesValidees.filter(d => d.status === "rejetee").length
      })

      // Mes demandes personnelles
      const mesDemandes = demandes.filter((d) => d.technicienId === currentUser.id)

      setStats({
        // Total = MES demandes créées
        total: mesDemandes.length,
        // En attente = Demandes à valider dans mes projets (rôle validateur)
        enAttente: demandesAValider.filter((d) => d.status === "en_attente_validation_responsable_travaux").length,
        // En cours = MES demandes en cours
        enCours: mesDemandes.filter((d) => ![
            "brouillon", 
            "cloturee", 
            "rejetee", 
            "archivee"
          ].includes(d.status)
        ).length,
        // Validées = Demandes que J'AI validées
        validees: demandesValidees.length,
        // Rejetées = MES demandes rejetées
        rejetees: mesDemandes.filter((d) => d.status === "rejetee").length,
      })
    }
  }, [currentUser?.id, demandes])

  const handleViewDetails = (demande: Demande) => {
    setSelectedDemande(demande)
    setDetailsModalOpen(true)
  }

  const mesDemandes = currentUser ? demandes.filter((d) => d.technicienId === currentUser.id) : []

  // Fonction pour obtenir les demandes selon le type de carte
  const getDemandesForType = (type: "total" | "enAttente" | "enCours" | "validees" | "rejetees") => {
    if (!currentUser) return []

    const demandesFiltered = demandes.filter((d) => 
      (!currentUser.projets || currentUser.projets.length === 0 || currentUser.projets.includes(d.projetId))
    )

    switch (type) {
      case "total":
        return mesDemandes
      case "enAttente":
        return demandesFiltered.filter((d) => d.status === "en_attente_validation_responsable_travaux")
      case "enCours":
        return demandesFiltered.filter((d) => 
          d.validationResponsableTravaux?.userId === currentUser.id &&
          ![
            "brouillon", 
            "cloturee", 
            "rejetee", 
            "archivee"
          ].includes(d.status)
        )
      case "validees":
        return demandesFiltered.filter((d) => 
          d.validationResponsableTravaux?.userId === currentUser.id &&
          [
            "en_attente_validation_charge_affaire", 
            "en_attente_preparation_appro",
            "en_attente_validation_logistique",
            "en_attente_validation_finale_demandeur",
            "confirmee_demandeur",
            "cloturee",
            "rejetee"
          ].includes(d.status)
        )
      case "rejetees":
        return mesDemandes.filter((d) => d.status === "rejetee")
      default:
        return []
    }
  }

  const handleCardClick = (type: "total" | "enAttente" | "enCours" | "validees" | "rejetees", title: string) => {
    setUserDetailsModalType(type)
    setUserDetailsModalTitle(title)
    setUserDetailsModalOpen(true)
  }

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

  const demandesEnAttente = demandes.filter((d) => 
    d.status === "en_attente_validation_responsable_travaux" &&
    // Filtrer par projet si l'utilisateur a des projets assignés
    (!currentUser?.projets || currentUser.projets.length === 0 || currentUser.projets.includes(d.projetId))
  )

  // Génération des données de graphique
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
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Tableau de Bord Responsable Travaux</h1>
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
                  <Card className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: '#f97316' }} onClick={() => handleCardClick("enAttente", "Demandes à valider")}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">En attente</CardTitle>
                      <Clock className="h-4 w-4" style={{ color: '#f97316' }} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" style={{ color: '#f97316' }}>{stats.enAttente}</div>
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
            </div>

            {/* Livraisons à effectuer */}
            <LivraisonsAEffectuer />

            {/* Liste des demandes à valider */}
            <ValidationDemandesList type="materiel" title="Demandes de matériel à valider" />
            <ValidationDemandesList type="outillage" title="Demandes d'outillage à valider" />
            
            {/* Mes demandes à clôturer */}
            <MesDemandesACloturer />
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
      <DemandeDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false)
          setSelectedDemande(null)
        }}
        demandeId={selectedDemande?.id || null}
        mode="view"
      />
      <UniversalClosureModal
        isOpen={universalClosureModalOpen}
        onClose={() => setUniversalClosureModalOpen(false)}
      />
      <UserDetailsModal
        isOpen={userDetailsModalOpen}
        onClose={() => setUserDetailsModalOpen(false)}
        title={userDetailsModalTitle}
        data={getDemandesForType(userDetailsModalType)}
        type={userDetailsModalType}
      />
      <ValidatedRequestsHistory
        isOpen={validatedHistoryModalOpen}
        onClose={() => setValidatedHistoryModalOpen(false)}
      />
    </div>
  )
}

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
  Tooltip,
  BarChart,
  Bar,
} from "recharts"
import DemandeDetailsModal from "@/components/modals/demande-details-modal"
import CreateDemandeModal from "@/components/demandes/create-demande-modal"
import RequestsFlowChart from "@/components/charts/requests-flow-chart"
import MesDemandesACloturer from "@/components/demandes/mes-demandes-a-cloturer"
import ValidationDemandesList from "@/components/validation/validation-demandes-list"
import UserDetailsModal from "@/components/modals/user-details-modal"
import ValidatedRequestsHistory from "@/components/dashboard/validated-requests-history"
import UniversalClosureModal from "@/components/modals/universal-closure-modal"
import LivraisonsAEffectuer from "@/components/dashboard/livraisons-a-effectuer"
import type { Demande } from "@/types"
import { useAutoReload } from "@/hooks/useAutoReload"

export default function ConducteurDashboard() {
  const { currentUser, demandes, isLoading } = useStore()
  const { handleManualReload } = useAutoReload("CONDUCTEUR")

  const [stats, setStats] = useState({
    total: 0,
    enAttente: 0,
    enCours: 0,
    validees: 0,
    rejetees: 0,
  })

  const [createDemandeModalOpen, setCreateDemandeModalOpen] = useState(false)
  const [demandeType, setDemandeType] = useState<"materiel" | "outillage">("materiel")
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [detailsModalType, setDetailsModalType] = useState<"total" | "enAttente" | "enCours" | "validees" | "rejetees">("total")
  const [detailsModalTitle, setDetailsModalTitle] = useState("")
  const [validatedHistoryModalOpen, setValidatedHistoryModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeChart, setActiveChart] = useState<"material" | "tooling">("material")
  const [universalClosureModalOpen, setUniversalClosureModalOpen] = useState(false)

  // Données chargées automatiquement par useDataLoader

  useEffect(() => {
    if (currentUser && currentUser.projets) {
      // Mes demandes personnelles (en tant que demandeur)
      const mesDemandesConducteur = demandes.filter((d) => d.technicienId === currentUser.id)
      
      // Demandes matériel que je dois valider en tant que conducteur
      const demandesAValiderConducteur = demandes.filter((d) => 
        d.type === "materiel" && 
        currentUser.projets.includes(d.projetId) &&
        d.technicienId !== currentUser.id && // Pas mes propres demandes
        ["soumise", "en_attente_validation_conducteur"].includes(d.status)
      )
      
      // Demandes que j'ai validées en tant que conducteur (demandes matériel dans mes projets)
      // HISTORIQUE COMPLET : Inclut toutes les demandes validées, même terminées ou rejetées
      const demandesValideesConducteur = demandes.filter((d) => 
        d.type === "materiel" && 
        currentUser.projets.includes(d.projetId) &&
        d.technicienId !== currentUser.id && // Pas mes propres demandes
        (
          // Méthode 1 : Si signature de validation existe (traçabilité exacte)
          d.validationConducteur?.userId === currentUser.id ||
          // Méthode 2 : Basé sur les statuts (toutes demandes ayant passé l'étape conducteur)
          (
            !d.validationConducteur && // Pas encore de signature système
            [
              "en_attente_validation_responsable_travaux",
              "en_attente_validation_charge_affaire", 
              "en_attente_preparation_appro",
              "en_attente_validation_logistique",
              "en_attente_validation_finale_demandeur",
              "confirmee_demandeur",
              "cloturee",
              "rejetee" // AJOUT : Inclure les demandes rejetées après validation
            ].includes(d.status)
          )
        )
      )

      console.log(`📊 [CONDUCTEUR-DASHBOARD] Statistiques validations pour ${currentUser.nom}:`, {
        totalValidees: demandesValideesConducteur.length,
        avecSignature: demandesValideesConducteur.filter(d => d.validationConducteur?.userId === currentUser.id).length,
        parStatut: demandesValideesConducteur.filter(d => !d.validationConducteur).length
      })

      setStats({
        total: mesDemandesConducteur.length,
        // En attente = Demandes matériel que je dois valider
        enAttente: demandesAValiderConducteur.length,
        // En cours = MES demandes personnelles (matériel ET outillage) en cours
        enCours: mesDemandesConducteur.filter((d) => ![
          "brouillon", 
          "cloturee", 
          "rejetee", 
          "archivee"
        ].includes(d.status)).length,
        // Validées = Demandes que J'AI VALIDÉES en tant que conducteur
        validees: demandesValideesConducteur.length,
        // Rejetées = MES demandes rejetées
        rejetees: mesDemandesConducteur.filter((d) => d.status === "rejetee").length,
      })
    }
  }, [currentUser, demandes])

  const mesDemandes = currentUser ? demandes.filter((d) => d.technicienId === currentUser.id) : []

  // Fonction pour obtenir les demandes selon le type de carte
  const getDemandesForType = (type: "total" | "enAttente" | "enCours" | "validees" | "rejetees") => {
    if (!currentUser) return []

    switch (type) {
      case "total":
        // Mes demandes personnelles (pas besoin de vérifier les projets)
        return mesDemandes
      case "enAttente":
        // Demandes matériel que je dois valider en tant que conducteur (besoin des projets)
        if (!currentUser.projets) return []
        return demandes.filter((d) => 
          d.type === "materiel" && 
          currentUser.projets.includes(d.projetId) &&
          d.technicienId !== currentUser.id && // Pas mes propres demandes
          ["soumise", "en_attente_validation_conducteur"].includes(d.status)
        )
      case "enCours":
        // Mes demandes personnelles (matériel ET outillage) en cours (pas besoin de vérifier les projets)
        return mesDemandes.filter((d) => ![
          "brouillon", "cloturee", "rejetee", "archivee"
        ].includes(d.status))
      case "validees":
        // Demandes que j'ai validées en tant que conducteur (HISTORIQUE COMPLET)
        if (!currentUser.projets) return []
        return demandes.filter((d) => 
          d.type === "materiel" && 
          currentUser.projets.includes(d.projetId) &&
          d.technicienId !== currentUser.id &&
          (
            d.validationConducteur?.userId === currentUser.id ||
            (
              !d.validationConducteur &&
              [
                "en_attente_validation_responsable_travaux",
                "en_attente_validation_charge_affaire", 
                "en_attente_preparation_appro",
                "en_attente_validation_logistique",
                "en_attente_validation_finale_demandeur",
                "confirmee_demandeur",
                "cloturee",
                "rejetee" // Inclure historique complet
              ].includes(d.status)
            )
          )
        )
      case "rejetees":
        // Mes demandes rejetées (pas besoin de vérifier les projets)
        return mesDemandes.filter((d) => d.status === "rejetee")
      default:
        return []
    }
  }


  const handleCardClick = (type: "total" | "enAttente" | "enCours" | "validees" | "rejetees", title: string) => {
    if (type === "total") {
      setValidatedHistoryModalOpen(true)
    } else if (type === "enCours") {
      // Afficher les demandes en cours ET les demandes à clôturer
      setDetailsModalType(type)
      setDetailsModalTitle("Mes demandes en cours et à clôturer")
      setDetailsModalOpen(true)
    } else {
      setDetailsModalType(type)
      setDetailsModalTitle(title)
      setDetailsModalOpen(true)
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
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Tableau de Bord Conducteur</h1>
          <Button 
            onClick={handleManualReload}
            variant="outline"
            className="bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 w-full sm:w-auto"
            size="sm"
          >
            🔄 Actualiser
          </Button>
        </div>

        {/* Layout principal : deux colonnes */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-3 sm:gap-4">
          {/* Colonne de gauche (large) - 3/4 de la largeur */}
          <div className="xl:col-span-3 space-y-3 sm:space-y-4 order-2 xl:order-1">
            {/* Vue d'ensemble - Cards statistiques */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
              <Card className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: '#015fc4' }} onClick={() => handleCardClick("total", "Mes demandes")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Mes demandes</CardTitle>
                  <Package className="h-4 w-4" style={{ color: '#015fc4' }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: '#015fc4' }}>{stats.total}</div>
                  <p className="text-xs text-muted-foreground">Mes demandes créées</p>
                </CardContent>
              </Card>

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
            </div>

            {/* Livraisons à effectuer */}
            <LivraisonsAEffectuer />

            {/* Liste des demandes à valider */}
            <ValidationDemandesList type="materiel" title="Demandes de matériel à valider" />
            
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

      {/* Modals fonctionnels */}
      <CreateDemandeModal
        isOpen={createDemandeModalOpen}
        onClose={() => setCreateDemandeModalOpen(false)}
        type={demandeType}
      />
      <UserDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title={detailsModalTitle}
        data={getDemandesForType(detailsModalType)}
        type={detailsModalType}
      />
      <ValidatedRequestsHistory
        isOpen={validatedHistoryModalOpen}
        onClose={() => setValidatedHistoryModalOpen(false)}
      />
      <UniversalClosureModal
        isOpen={universalClosureModalOpen}
        onClose={() => setUniversalClosureModalOpen(false)}
      />
    </div>
  )
}

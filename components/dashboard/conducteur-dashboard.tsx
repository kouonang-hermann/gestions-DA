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
import CreateDemandeModal from "@/components/demandes/create-demande-modal"
import ValidationDemandesList from "@/components/validation/validation-demandes-list"
import { UserRequestsChart } from "@/components/charts/user-requests-chart"
import UserDetailsModal from "@/components/modals/user-details-modal"
import ValidatedRequestsHistory from "@/components/dashboard/validated-requests-history"
import DemandeClotureCard from "@/components/demandes/demande-cloture-card"

export default function ConducteurDashboard() {
  const { currentUser, demandes, loadDemandes, isLoading } = useStore()

  const [stats, setStats] = useState({
    total: 0,
    enAttente: 0,
    validees: 0,
    rejetees: 0,
  })

  const [createDemandeModalOpen, setCreateDemandeModalOpen] = useState(false)
  const [demandeType, setDemandeType] = useState<"materiel" | "outillage">("materiel")
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [detailsModalType, setDetailsModalType] = useState<"total" | "enAttente" | "validees" | "rejetees">("total")
  const [detailsModalTitle, setDetailsModalTitle] = useState("")
  const [validatedHistoryModalOpen, setValidatedHistoryModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeChart, setActiveChart] = useState<"material" | "tooling">("material")

  useEffect(() => {
    if (currentUser) {
      loadDemandes()
    }
  }, [currentUser, loadDemandes])

  useEffect(() => {
    if (currentUser && currentUser.projets) {
      const demandesMateriels = demandes.filter(
        (d) => d.type === "materiel" && currentUser.projets.includes(d.projetId)
      )

      setStats({
        total: demandesMateriels.length,
        enAttente: demandesMateriels.filter((d) => d.status === "en_attente_validation_conducteur").length,
        // CORRECTION: Utiliser les vrais statuts après validation conducteur
        validees: demandesMateriels.filter((d) => [
          "en_attente_validation_responsable_travaux",
          "en_attente_validation_charge_affaire", 
          "en_attente_preparation_appro",
          "en_attente_validation_logistique",
          "en_attente_validation_finale_demandeur",
          "cloturee"
        ].includes(d.status)).length,
        rejetees: demandesMateriels.filter((d) => d.status === "rejetee").length,
      })
    }
  }, [currentUser, demandes])

  const mesDemandes = currentUser ? demandes.filter((d) => d.technicienId === currentUser.id) : []
  // NOUVEAU: Demandes personnelles prêtes à clôturer
  const demandesValidationFinale = mesDemandes.filter(d => d.status === "en_attente_validation_finale_demandeur")

  const handleCardClick = (type: "total" | "enAttente" | "validees" | "rejetees", title: string) => {
    if (type === "total") {
      setValidatedHistoryModalOpen(true)
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
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="max-w-full mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Tableau de Bord Conducteur</h1>

        {/* Layout principal : deux colonnes */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Colonne de gauche (large) - 3/4 de la largeur */}
          <div className="lg:col-span-3 space-y-4">
            {/* Vue d'ensemble - Cards statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: '#015fc4' }} onClick={() => handleCardClick("total", "Toutes les demandes")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total demandes</CardTitle>
                  <Package className="h-4 w-4" style={{ color: '#015fc4' }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: '#015fc4' }}>{stats.total}</div>
                  <p className="text-xs text-muted-foreground">Toutes les demandes</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: '#f97316' }} onClick={() => handleCardClick("enAttente", "Demandes en attente")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">En attente</CardTitle>
                  <Clock className="h-4 w-4" style={{ color: '#f97316' }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: '#f97316' }}>{stats.enAttente}</div>
                  <p className="text-xs text-muted-foreground">À valider</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: '#22c55e' }} onClick={() => handleCardClick("validees", "Demandes validées")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Validées</CardTitle>
                  <CheckCircle className="h-4 w-4" style={{ color: '#22c55e' }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: '#22c55e' }}>{stats.validees}</div>
                  <p className="text-xs text-muted-foreground">Demandes validées</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: '#fc2d1f' }} onClick={() => handleCardClick("rejetees", "Demandes rejetées")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Rejetées</CardTitle>
                  <XCircle className="h-4 w-4" style={{ color: '#fc2d1f' }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: '#fc2d1f' }}>{stats.rejetees}</div>
                  <p className="text-xs text-muted-foreground">Demandes rejetées</p>
                </CardContent>
              </Card>
            </div>

            {/* Liste des demandes à valider */}
            <ValidationDemandesList type="materiel" title="Demandes de matériel à valider" />

            {/* Demandes personnelles prêtes à clôturer */}
            {demandesValidationFinale.length > 0 && (
              <Card className="bg-emerald-50 border-emerald-200">
                <CardHeader>
                  <CardTitle className="text-emerald-800 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Mes demandes prêtes à clôturer ({demandesValidationFinale.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {demandesValidationFinale.map((demande) => (
                      <DemandeClotureCard 
                        key={demande.id} 
                        demande={demande} 
                        onCloture={() => loadDemandes()} 
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Colonne de droite (fine) - 1/4 de la largeur */}
          <div className="lg:col-span-1 space-y-4">
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
        data={mesDemandes}
        type={detailsModalType}
      />
      <ValidatedRequestsHistory
        isOpen={validatedHistoryModalOpen}
        onClose={() => setValidatedHistoryModalOpen(false)}
      />
    </div>
  )
}

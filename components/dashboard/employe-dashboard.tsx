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
import { UserRequestsChart } from "@/components/charts/user-requests-chart"
import UserDetailsModal from "@/components/modals/user-details-modal"
import ValidatedRequestsHistory from "@/components/dashboard/validated-requests-history"

export default function EmployeDashboard() {
  const { currentUser, demandes, projets, loadDemandes, loadProjets, isLoading } = useStore()

  const [stats, setStats] = useState({
    total: 0,
    enCours: 0,
    validees: 0,
    brouillons: 0,
  })

  const [createDemandeModalOpen, setCreateDemandeModalOpen] = useState(false)
  const [demandeType, setDemandeType] = useState<"materiel" | "outillage">("materiel")
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [detailsModalType, setDetailsModalType] = useState<"total" | "enCours" | "validees" | "brouillons">("total")
  const [detailsModalTitle, setDetailsModalTitle] = useState("")
  const [validatedHistoryModalOpen, setValidatedHistoryModalOpen] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeChart, setActiveChart] = useState<"material" | "tooling">("material")

  // Chargement initial des données
  useEffect(() => {
    if (currentUser && !dataLoaded) {
      const loadInitialData = async () => {
        try {
          console.log("Chargement des données pour l'employé...")
          await Promise.all([
            loadProjets(),
            loadDemandes()
          ])
          setDataLoaded(true)
          console.log("Données chargées avec succès")
        } catch (error) {
          console.error("Erreur lors du chargement initial:", error)
        }
      }
      loadInitialData()
    }
  }, [currentUser?.id, dataLoaded])

  // Calcul des statistiques
  useEffect(() => {
    if (currentUser && demandes) {
      const mesDemandes = demandes.filter((d) => d.technicienId === currentUser.id)

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
      })
    }
  }, [currentUser?.id, demandes])

  const getStatusColor = (status: string) => {
    const colors = {
      brouillon: "bg-gray-500",
      soumise: "bg-blue-500",
      en_attente_validation_conducteur: "bg-orange-500",
      en_attente_validation_qhse: "bg-orange-500", 
      en_attente_validation_responsable_travaux: "bg-orange-500",
      en_attente_validation_charge_affaire: "bg-orange-500",
      en_attente_preparation_appro: "bg-purple-500",
      en_attente_validation_logistique: "bg-purple-500",
      en_attente_validation_finale_demandeur: "bg-emerald-500", // Prêt à clôturer
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
      en_attente_validation_qhse: "En attente validation QHSE",
      en_attente_validation_responsable_travaux: "En attente validation responsable travaux",
      en_attente_validation_charge_affaire: "En attente validation chargé d'affaire",
      en_attente_preparation_appro: "En attente préparation appro",
      en_attente_validation_logistique: "En attente validation logistique",
      en_attente_validation_finale_demandeur: "Prêt à clôturer", // Le demandeur peut clôturer
      confirmee_demandeur: "Confirmée",
      cloturee: "Clôturée",
      rejetee: "Rejetée",
      archivee: "Archivée",
    }
    return labels[status as keyof typeof labels] || status
  }

  if (!currentUser) {
    return (
      <div className="text-center p-8 text-red-500">
        Erreur : Utilisateur non connecté
      </div>
    )
  }

  if (isLoading || !dataLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        <span className="ml-2">Chargement du tableau de bord...</span>
      </div>
    )
  }

  const mesProjetIds = currentUser.projets || []
  const mesProjets = projets.filter((p) => mesProjetIds.includes(p.id)) || []
  const mesDemandes = demandes.filter((d) => d.technicienId === currentUser.id) || []
  const demandesValidationFinale = mesDemandes.filter(d => d.status === "en_attente_validation_finale_demandeur")

  const handleCardClick = (type: "total" | "enCours" | "validees" | "brouillons", title: string) => {
    if (type === "total") {
      setValidatedHistoryModalOpen(true)
    } else {
      setDetailsModalType(type)
      setDetailsModalTitle(title)
      setDetailsModalOpen(true)
    }
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
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4 lg:p-6">
      <div className="max-w-full mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">Tableau de Bord Employé</h1>

        {/* Layout principal : responsive */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
          {/* Colonne de gauche (large) - 3/4 de la largeur */}
          <div className="xl:col-span-3 space-y-4">
            {/* Vue d'ensemble - Cards statistiques */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

            {/* Mes projets - Tableau fixe scrollable */}
            {mesProjets.length > 0 && (
              <Card className="h-fit">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-gray-800">
                    <FolderOpen className="h-5 w-5" />
                    Mes projets ({mesProjets.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Tableau fixe scrollable - Responsive */}
                    <div className="overflow-hidden border border-gray-200 rounded-lg">
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
          <div className="xl:col-span-1 space-y-4">
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
 
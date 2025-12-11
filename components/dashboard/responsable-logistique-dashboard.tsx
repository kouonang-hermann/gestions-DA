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
  Truck,
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
import ValidationLogistiqueList from "@/components/logistique/validation-logistique-list"
import MesDemandesACloturer from "@/components/demandes/mes-demandes-a-cloturer"
import { useAutoReload } from "@/hooks/useAutoReload"

export default function ResponsableLogistiqueDashboard() {
  const { currentUser, demandes, projets, isLoading } = useStore()
  const { handleManualReload } = useAutoReload("RESPONSABLE-LOGISTIQUE")

  const [stats, setStats] = useState({
    total: 0,
    enCours: 0,
    validees: 0,
    enAttenteValidation: 0,
  })

  const [createDemandeModalOpen, setCreateDemandeModalOpen] = useState(false)
  const [demandeType, setDemandeType] = useState<"materiel" | "outillage">("materiel")
  const [showUserModal, setShowUserModal] = useState(false)
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null)
  const [filterTitle, setFilterTitle] = useState("")
  const [showValidationList, setShowValidationList] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeChart, setActiveChart] = useState<"material" | "tooling">("material")

  // Données chargées automatiquement par useDataLoader

  useEffect(() => {
    if (demandes.length > 0 && currentUser) {
      // Filtrer les demandes des projets où le responsable logistique travaille
      // Si pas de projets assignés, voir toutes les demandes (comportement superadmin)
      const mesDemandesLogistique = demandes.filter((d) => 
        !currentUser.projets || 
        currentUser.projets.length === 0 || 
        currentUser.projets.includes(d.projetId)
      )
      
      const total = mesDemandesLogistique.length
      const enCours = mesDemandesLogistique.filter(d => 
        d.status === "en_attente_validation_logistique"
      ).length
      const validees = mesDemandesLogistique.filter(d => 
        d.status === "en_attente_validation_finale_demandeur" ||
        d.status === "cloturee"
      ).length
      const enAttenteValidation = mesDemandesLogistique.filter(d => 
        d.status === "en_attente_validation_logistique"
      ).length

      console.log(`🔍 [LOGISTIQUE-DASHBOARD] Statistiques pour ${currentUser.nom}:`)
      console.log(`  - Projets utilisateur: [${currentUser.projets?.join(', ') || 'aucun'}]`)
      console.log(`  - Total demandes dans mes projets: ${total}`)
      console.log(`  - Demandes à valider (logistique): ${enAttenteValidation}`)
      console.log(`  - Demandes en cours: ${enCours}`)
      console.log(`  - Demandes validées: ${validees}`)

      setStats({
        total,
        enCours,
        validees,
        enAttenteValidation,
      })
    }
  }, [demandes, currentUser])

  const handleCardClick = (filter: string, title: string) => {
    if (filter === "enAttenteValidation") {
      setShowValidationList(true)
    } else {
      setSelectedFilter(filter)
      setFilterTitle(title)
      setShowValidationList(false)
    }
  }

  const getFilteredDemandes = () => {
    if (!currentUser) return []
    
    // Filtrer d'abord par projets du responsable logistique
    // Si pas de projets assignés, voir toutes les demandes
    const mesDemandesLogistique = demandes.filter((d) => 
      !currentUser.projets || 
      currentUser.projets.length === 0 || 
      currentUser.projets.includes(d.projetId)
    )
    
    if (!selectedFilter) return mesDemandesLogistique

    switch (selectedFilter) {
      case "total":
        return mesDemandesLogistique
      case "enCours":
        return mesDemandesLogistique.filter(d => d.status === "en_attente_validation_logistique")
      case "validees":
        return mesDemandesLogistique.filter(d => 
          d.status === "en_attente_validation_finale_demandeur" ||
          d.status === "cloturee"
        )
      case "enAttenteValidation":
        return mesDemandesLogistique.filter(d => d.status === "en_attente_validation_logistique")
      default:
        return mesDemandesLogistique
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "brouillon":
        return <Badge variant="secondary">Brouillon</Badge>
      case "soumise":
        return <Badge variant="outline">Soumise</Badge>
      case "en_attente_validation_conducteur":
        return <Badge className="bg-yellow-100 text-yellow-800">En attente conducteur</Badge>
      case "en_attente_validation_qhse":
        return <Badge className="bg-yellow-100 text-yellow-800">En attente QHSE</Badge>
      case "en_attente_preparation_appro":
        return <Badge className="bg-yellow-100 text-yellow-800">En attente préparation appro</Badge>
      case "en_attente_validation_charge_affaire":
        return <Badge className="bg-yellow-100 text-yellow-800">En attente chargé affaire</Badge>
      case "en_attente_validation_logistique":
        return <Badge className="bg-orange-100 text-orange-800">À valider (Logistique)</Badge>
      case "en_attente_validation_finale_demandeur":
        return <Badge className="bg-purple-100 text-purple-800">En attente validation finale</Badge>
      case "confirmee_demandeur":
        return <Badge className="bg-green-100 text-green-800">Confirmée</Badge>
      case "rejetee":
        return <Badge variant="destructive">Rejetée</Badge>
      case "cloturee":
        return <Badge className="bg-green-100 text-green-800">Clôturée</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-6 py-6">
          <div className="text-center p-8 text-gray-500">
            Chargement...
          </div>
        </div>
      </div>
    )
  }

  // Génération des données de graphique
  const generateChartData = () => {
    const filteredDemandes = getFilteredDemandes()
    const materialRequests = filteredDemandes.filter(d => d.type === "materiel")
    const toolingRequests = filteredDemandes.filter(d => d.type === "outillage")
    
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord Responsable Logistique</h1>
          <div className="flex space-x-2">
            <Button 
              onClick={handleManualReload}
              variant="outline"
              className="bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
            >
              🔄 Actualiser
            </Button>
            {showValidationList && (
              <Button 
                variant="outline" 
                onClick={() => setShowValidationList(false)}
              >
                Retour au tableau de bord
              </Button>
            )}
          </div>
        </div>

        {/* Afficher soit le dashboard soit la liste de validation */}
        {showValidationList ? (
          <ValidationLogistiqueList />
        ) : (
          <>
            {/* Layout principal : deux colonnes */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Colonne de gauche (large) - 3/4 de la largeur */}
              <div className="lg:col-span-3 space-y-4">
                {/* Vue d'ensemble - Cards statistiques (4 cartes sur 1 ligne) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: '#015fc4' }} onClick={() => handleCardClick("total", "Toutes mes demandes")}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
                      <FileText className="h-4 w-4" style={{ color: '#015fc4' }} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" style={{ color: '#015fc4' }}>{stats.total}</div>
                      <p className="text-xs text-muted-foreground">Demandes</p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: '#f97316' }} onClick={() => handleCardClick("enAttenteValidation", "Demandes à valider")}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">À valider</CardTitle>
                      <Clock className="h-4 w-4" style={{ color: '#f97316' }} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" style={{ color: '#f97316' }}>{stats.enAttenteValidation}</div>
                      <p className="text-xs text-muted-foreground">Logistique</p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: '#b8d1df' }} onClick={() => handleCardClick("enCours", "Demandes en cours")}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">En cours</CardTitle>
                      <Truck className="h-4 w-4" style={{ color: '#b8d1df' }} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" style={{ color: '#b8d1df' }}>{stats.enCours}</div>
                      <p className="text-xs text-muted-foreground">Transport</p>
                    </CardContent>
                  </Card>

                  <Card className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: '#22c55e' }} onClick={() => handleCardClick("validees", "Demandes validées")}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Validées</CardTitle>
                      <CheckCircle className="h-4 w-4" style={{ color: '#22c55e' }} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" style={{ color: '#22c55e' }}>{stats.validees}</div>
                      <p className="text-xs text-muted-foreground">Terminées</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Mes demandes à clôturer */}
                <MesDemandesACloturer />

                {/* Liste des demandes */}
                <Card>
                  <CardHeader>
                    <CardTitle>
                      {selectedFilter ? filterTitle : "Toutes les demandes"}
                      {selectedFilter && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setSelectedFilter(null)}
                          className="ml-2"
                        >
                          Voir tout
                        </Button>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {getFilteredDemandes().length === 0 ? (
                        <p className="text-center text-gray-500 py-8">
                          Aucune demande trouvée
                        </p>
                      ) : (
                        getFilteredDemandes().slice(0, 8).map((demande) => (
                          <div key={demande.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <Package className="h-5 w-5 text-gray-400" />
                                <div>
                                  <p className="font-medium">{demande.numero}</p>
                                  <p className="text-sm text-gray-600">
                                    {demande.projet?.nom} • {demande.items?.length || 0} articles
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Créée le {new Date(demande.dateCreation).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              {getStatusBadge(demande.status)}
                              <Badge variant="outline" className="capitalize">
                                {demande.type}
                              </Badge>
                            </div>
                          </div>
                        ))
                      )}
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
          </>
        )}
      </div>

      {/* Modals fonctionnels */}
      <CreateDemandeModal 
        isOpen={createDemandeModalOpen}
        onClose={() => setCreateDemandeModalOpen(false)}
        type={demandeType}
      />
      <UserDetailsModal 
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title="Mon profil"
        data={currentUser ? [currentUser] : []}
        type="total"
      />
    </div>
  )
}

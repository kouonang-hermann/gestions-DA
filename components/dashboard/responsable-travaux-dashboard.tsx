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
  Tooltip,
  BarChart,
  Bar,
} from "recharts"
import ValidationDemandesList from "@/components/validation/validation-demandes-list"
import DemandeDetailsModal from "@/components/modals/demande-details-modal"
import CreateDemandeModal from "@/components/demandes/create-demande-modal"
import RequestsFlowChart from "@/components/charts/requests-flow-chart"
import type { Demande } from "@/types"

export default function ResponsableTravauxDashboard() {
  const { currentUser, demandes, projets, isLoading, loadDemandes, loadUsers, loadProjets } = useStore()

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

  // Rechargement automatique des données au montage du composant
  useEffect(() => {
    const reloadAllData = async () => {
      if (currentUser) {
        console.log(`🔄 [RESPONSABLE-TRAVAUX] Rechargement automatique des données pour ${currentUser.nom}`)
        
        try {
          // Recharger toutes les données en parallèle
          await Promise.all([
            loadDemandes(),
            loadUsers(),
            loadProjets()
          ])
          
          console.log(`✅ [RESPONSABLE-TRAVAUX] Toutes les données rechargées avec succès`)
        } catch (error) {
          console.error(`❌ [RESPONSABLE-TRAVAUX] Erreur lors du rechargement:`, error)
        }
      }
    }

    // Recharger les données au montage du composant
    reloadAllData()
  }, [currentUser?.id, loadDemandes, loadUsers, loadProjets])

  // Calcul des statistiques
  useEffect(() => {
    if (currentUser && demandes) {
      // Filtrer les demandes (matériel + outillage) qui nécessitent la validation du responsable des travaux
      // ET qui sont dans les projets assignés à l'utilisateur
      const demandesAValider = demandes.filter((d) => 
        // Filtrer par projet si l'utilisateur a des projets assignés
        (!currentUser.projets || currentUser.projets.length === 0 || currentUser.projets.includes(d.projetId))
      )

      console.log(`🔍 [RESPONSABLE-TRAVAUX-DASHBOARD] Filtrage pour ${currentUser.role}:`)
      console.log(`  - Projets utilisateur: [${currentUser.projets?.join(', ') || 'aucun'}]`)
      console.log(`  - Demandes dans projets: ${demandesAValider.length}/${demandes.length}`)

      setStats({
        total: demandesAValider.length,
        enAttente: demandesAValider.filter((d) => d.status === "en_attente_validation_responsable_travaux").length,
        enCours: demandes.filter((d) => 
          d.technicienId === currentUser.id && ![
            "brouillon", 
            "cloturee", 
            "rejetee", 
            "archivee"
          ].includes(d.status)
        ).length,
        validees: demandesAValider.filter((d) => 
          [
            "en_attente_validation_charge_affaire", 
            "en_attente_preparation_appro",
            "en_attente_validation_logistique",
            "en_attente_validation_finale_demandeur",
            "cloturee"
          ].includes(d.status)
        ).length,
        rejetees: demandesAValider.filter((d) => d.status === "rejetee").length,
      })

      console.log(`  - En attente: ${demandesAValider.filter((d) => d.status === "en_attente_validation_responsable_travaux").length}`)
    }
  }, [currentUser?.id, demandes])

  const handleViewDetails = (demande: Demande) => {
    setSelectedDemande(demande)
    setDetailsModalOpen(true)
  }

  const handleManualReload = async () => {
    console.log(`🔄 [RESPONSABLE-TRAVAUX] Rechargement manuel déclenché`)
    
    try {
      // Recharger toutes les données en parallèle
      await Promise.all([
        loadDemandes(),
        loadUsers(),
        loadProjets()
      ])
      
      console.log(`✅ [RESPONSABLE-TRAVAUX] Rechargement manuel terminé avec succès`)
    } catch (error) {
      console.error(`❌ [RESPONSABLE-TRAVAUX] Erreur lors du rechargement manuel:`, error)
    }
  }

  const handleCardClick = (type: "total" | "enAttente" | "validees" | "rejetees") => {
    // Pour l'instant, on peut juste logger ou ouvrir une modal de détails
    console.log(`Carte cliquée: ${type}`)
    // TODO: Implémenter l'ouverture d'une modal avec les détails des demandes filtrées
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
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="max-w-full mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord Responsable Travaux</h1>
          <div className="flex space-x-2">
            <Button 
              onClick={handleManualReload}
              variant="outline"
              className="bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
            >
              🔄 Actualiser
            </Button>
          </div>
        </div>

        {/* Layout principal : deux colonnes */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Colonne de gauche (large) - 3/4 de la largeur */}
          <div className="lg:col-span-3 space-y-4">
            {/* Vue d'ensemble - Cards statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: '#015fc4' }} onClick={() => handleCardClick("total")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total demandes matériel</CardTitle>
                  <FileText className="h-4 w-4" style={{ color: '#015fc4' }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: '#015fc4' }}>{stats.total}</div>
                  <p className="text-xs text-muted-foreground">Demandes matériel</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: '#f97316' }} onClick={() => handleCardClick("enAttente")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">En attente validation</CardTitle>
                  <Clock className="h-4 w-4" style={{ color: '#f97316' }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: '#f97316' }}>{stats.enAttente}</div>
                  <p className="text-xs text-muted-foreground">À valider</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: '#22c55e' }} onClick={() => handleCardClick("validees")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Validées</CardTitle>
                  <CheckCircle className="h-4 w-4" style={{ color: '#22c55e' }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: '#22c55e' }}>{stats.validees}</div>
                  <p className="text-xs text-muted-foreground">Demandes validées</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: '#fc2d1f' }} onClick={() => handleCardClick("rejetees")}>
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


            {/* Liste des demandes en attente de validation */}
            {demandesEnAttente.length > 0 && (
              <Card className="bg-orange-50 border-orange-200">
                <CardHeader>
                  <CardTitle className="text-orange-800">
                    Demandes en attente de validation ({demandesEnAttente.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <ValidationDemandesList
                      type="materiel"
                      title="Demandes de matériel à valider"
                    />
                    <ValidationDemandesList
                      type="outillage"
                      title="Demandes d'outillage à valider"
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Message si aucune demande en attente */}
            {demandesEnAttente.length === 0 && (
              <Card className="bg-gray-50 border-gray-200">
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    Aucune demande en attente
                  </h3>
                  <p className="text-gray-600">
                    Toutes les demandes de matériel ont été traitées.
                  </p>
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
      <DemandeDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false)
          setSelectedDemande(null)
        }}
        demande={selectedDemande}
        onValidate={async (action, quantites) => {
          // La validation sera gérée par le composant ValidationDemandesList
          setDetailsModalOpen(false)
          setSelectedDemande(null)
          // Données rechargées automatiquement par useDataLoader
        }}
        canValidate={selectedDemande?.status === "en_attente_validation_responsable_travaux"}
      />
    </div>
  )
}

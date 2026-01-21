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
  Truck, 
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
import SortiePreparationList from "@/components/appro/sortie-preparation-list"
import CreateDemandeModal from "@/components/demandes/create-demande-modal"
import { UserRequestsChart } from "@/components/charts/user-requests-chart"
import UserDetailsModal from "@/components/modals/user-details-modal"
import MesDemandesACloturer from "@/components/demandes/mes-demandes-a-cloturer"
import UniversalClosureModal from "@/components/modals/universal-closure-modal"
import LivraisonsAEffectuer from "@/components/dashboard/livraisons-a-effectuer"
import SousDemandesList from "@/components/dashboard/sous-demandes-list"
import { useAutoReload } from "@/hooks/useAutoReload"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import DemandeDetailModal from "@/components/demandes/demande-detail-modal"
import { Eye } from 'lucide-react'

export default function ApproDashboard() {
  const { currentUser, demandes, projets, users, isLoading, executeAction, loadDemandes } = useStore()
  const { handleManualReload } = useAutoReload("APPRO")

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
    aPreparer: 0,
    enCours: 0,
    preparees: 0,
    livrees: 0,
  })

  const [createDemandeModalOpen, setCreateDemandeModalOpen] = useState(false)
  const [demandeType, setDemandeType] = useState<"materiel" | "outillage">("materiel")
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [detailsModalType, setDetailsModalType] = useState<"total" | "aPreparer" | "enCours" | "preparees" | "livrees">("total")
  const [detailsModalTitle, setDetailsModalTitle] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [activeChart, setActiveChart] = useState<"material" | "tooling">("material")
  const [universalClosureModalOpen, setUniversalClosureModalOpen] = useState(false)
  const [selectedDemandeId, setSelectedDemandeId] = useState<string | null>(null)
  const [demandeDetailOpen, setDemandeDetailOpen] = useState(false)

  // Données chargées automatiquement par useDataLoader

  useEffect(() => {
    if (currentUser) {
      // Filtrer les demandes par projet si l'utilisateur a des projets assignés
      const demandesFiltered = demandes.filter((d) => 
        (!currentUser.projets || currentUser.projets.length === 0 || currentUser.projets.includes(d.projetId))
      )

      // 1. TOTAL DEMANDES MATÉRIEL CONCERNANT L'APPRO (dans le flow Appro)
      // Toutes les demandes matériel qui sont passées ou vont passer par l'Appro
      const demandesAppro = demandesFiltered.filter((d) => 
        d.type === "materiel" && [
          "en_attente_preparation_appro",      // À préparer
          "en_attente_reception_livreur",      // Préparées, chez le livreur
          "en_attente_livraison",              // En cours de livraison
          "en_attente_validation_finale_demandeur", // Livrées, en attente validation
          "cloturee"                           // Clôturées
        ].includes(d.status)
      )

      // 2. DEMANDES À PRÉPARER (en attente de préparation par l'Appro - MATÉRIEL UNIQUEMENT)
      const demandesATraiter = demandesFiltered.filter((d) => 
        d.type === "materiel" && d.status === "en_attente_preparation_appro"
      )
      
      // 3. DEMANDES PRÉPARÉES PAR MOI (préparées par l'Appro connecté - MATÉRIEL UNIQUEMENT)
      // Utilise la signature sortieAppro pour identifier les demandes préparées par cet Appro
      const demandesPreparees = demandesFiltered.filter((d) => 
        d.type === "materiel" && 
        d.status === "en_attente_reception_livreur" &&
        d.sortieAppro?.userId === currentUser.id
      )
      
      // 4. DEMANDES EN COURS DE LIVRAISON (MATÉRIEL UNIQUEMENT)
      const demandesEnLivraison = demandesFiltered.filter((d) => 
        d.type === "materiel" && d.status === "en_attente_livraison"
      )

      // 5. DEMANDES LIVRÉES (en attente validation finale ou clôturées - MATÉRIEL UNIQUEMENT)
      const demandesLivrees = demandesFiltered.filter((d) => 
        d.type === "materiel" && [
          "en_attente_validation_finale_demandeur",
          "cloturee"
        ].includes(d.status)
      )

      // 6. MES DEMANDES PERSONNELLES EN COURS (en tant que demandeur)
      const mesDemandesCreees = demandesFiltered.filter((d) => d.technicienId === currentUser.id)
      const mesDemandesEnCours = mesDemandesCreees.filter((d) => ![
        "brouillon", 
        "cloturee", 
        "rejetee", 
        "archivee"
      ].includes(d.status))

      console.log(`🔍 [APPRO-DASHBOARD] Statistiques calculées:`)
      console.log(`  - Total demandes Appro (matériel): ${demandesAppro.length}`)
      console.log(`  - À préparer: ${demandesATraiter.length}`)
      console.log(`  - Préparées (chez livreur): ${demandesPreparees.length}`)
      console.log(`  - En livraison: ${demandesEnLivraison.length}`)
      console.log(`  - Livrées: ${demandesLivrees.length}`)
      console.log(`  - Mes demandes en cours: ${mesDemandesEnCours.length}`)

      setStats({
        total: demandesAppro.length,           // Total demandes matériel dans le flow Appro
        aPreparer: demandesATraiter.length,    // À préparer par moi
        enCours: mesDemandesEnCours.length,    // MES demandes personnelles en cours
        preparees: demandesPreparees.length,   // Préparées, chez le livreur
        livrees: demandesLivrees.length,       // Livrées (validation finale + clôturées)
      })
    }
  }, [currentUser, demandes])

  const mesDemandes = currentUser ? demandes.filter((d) => d.technicienId === currentUser.id) : []

  const handleCardClick = (type: "total" | "aPreparer" | "enCours" | "preparees" | "livrees", title: string) => {
    setDetailsModalType(type)
    setDetailsModalTitle(title)
    setDetailsModalOpen(true)
  }

  // Fonction de validation pour la modale
  const handleValidation = async (demandeId: string) => {
    try {
      const commentaire = prompt("Commentaire (optionnel):")
      const success = await executeAction(demandeId, "valider", { commentaire: commentaire || "" })
      if (success) {
        await loadDemandes()
        setDemandeDetailOpen(false)
        setSelectedDemandeId(null)
      }
    } catch (error) {
      console.error("Erreur lors de la validation:", error)
      alert("Erreur lors de la validation")
    }
  }

  // Fonction pour obtenir les demandes selon le type de carte
  const getDemandesByType = (type: "total" | "aPreparer" | "enCours" | "preparees" | "livrees") => {
    if (!currentUser) return []

    const demandesFiltered = demandes.filter((d) => 
      (!currentUser.projets || currentUser.projets.length === 0 || currentUser.projets.includes(d.projetId))
    )

    switch (type) {
      case "total":
        // Total demandes matériel concernant l'Appro (dans le flow Appro)
        return demandesFiltered.filter((d) => 
          d.type === "materiel" && [
            "en_attente_preparation_appro",
            "en_attente_reception_livreur",
            "en_attente_livraison",
            "en_attente_validation_finale_demandeur",
            "cloturee"
          ].includes(d.status)
        )
      
      case "aPreparer":
        // Demandes à préparer (en tant qu'Appro - MATÉRIEL UNIQUEMENT)
        return demandesFiltered.filter((d) => 
          d.type === "materiel" && d.status === "en_attente_preparation_appro"
        )
      
      case "enCours":
        // MES demandes personnelles en cours (comme demandeur)
        return demandesFiltered.filter((d) => 
          d.technicienId === currentUser.id && ![
            "brouillon", 
            "cloturee", 
            "rejetee", 
            "archivee"
          ].includes(d.status)
        )
      
      case "preparees":
        // Demandes préparées PAR MOI (l'Appro connecté), chez le livreur (MATÉRIEL UNIQUEMENT)
        return demandesFiltered.filter((d) => 
          d.type === "materiel" && 
          d.status === "en_attente_reception_livreur" &&
          d.sortieAppro?.userId === currentUser.id
        )
      
      case "livrees":
        // Demandes livrées (en attente validation finale + clôturées - MATÉRIEL UNIQUEMENT)
        return demandesFiltered.filter((d) => 
          d.type === "materiel" && [
            "en_attente_validation_finale_demandeur",
            "cloturee"
          ].includes(d.status)
        )
      
      default:
        return []
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
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Tableau de Bord Appro</h1>
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
              <Card className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: '#015fc4' }} onClick={() => handleCardClick("total", "Total demandes matériel Appro")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Appro</CardTitle>
                  <Package className="h-4 w-4" style={{ color: '#015fc4' }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: '#015fc4' }}>{stats.total}</div>
                  <p className="text-xs text-muted-foreground">Matériel (flow Appro)</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: '#f97316' }} onClick={() => handleCardClick("aPreparer", "Demandes à préparer")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">À préparer</CardTitle>
                  <Clock className="h-4 w-4" style={{ color: '#f97316' }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: '#f97316' }}>{stats.aPreparer}</div>
                  <p className="text-xs text-muted-foreground">Matériel à préparer</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: '#3b82f6' }} onClick={() => handleCardClick("enCours", "Mes demandes personnelles en cours")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Mes demandes</CardTitle>
                  <Clock className="h-4 w-4" style={{ color: '#3b82f6' }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: '#3b82f6' }}>{stats.enCours}</div>
                  <p className="text-xs text-muted-foreground">En cours (demandeur)</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: '#8b5cf6' }} onClick={() => handleCardClick("preparees", "Demandes préparées (chez livreur)")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Préparées</CardTitle>
                  <Truck className="h-4 w-4" style={{ color: '#8b5cf6' }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: '#8b5cf6' }}>{stats.preparees}</div>
                  <p className="text-xs text-muted-foreground">Chez le livreur</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: '#22c55e' }} onClick={() => handleCardClick("livrees", "Demandes livrées")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Livrées</CardTitle>
                  <CheckCircle className="h-4 w-4" style={{ color: '#22c55e' }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: '#22c55e' }}>{stats.livrees}</div>
                  <p className="text-xs text-muted-foreground">Livrées/Clôturées</p>
                </CardContent>
              </Card>
            </div>


            {/* Livraisons à effectuer */}
            <LivraisonsAEffectuer />

            {/* Anomalies de livraison - Sous-demandes et demandes renvoyées (matériel uniquement) */}
            <SousDemandesList type="materiel" />

            {/* Liste des demandes à préparer */}
            <SortiePreparationList />
            
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
      {/* Modale de détails des demandes */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{detailsModalTitle}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 sm:space-y-4 overflow-y-auto" style={{maxHeight: 'calc(85vh - 120px)'}}>
            {getDemandesByType(detailsModalType).length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-gray-500">
                <Package className="mx-auto h-10 w-10 sm:h-12 sm:w-12 mb-3 sm:mb-4 opacity-50" />
                <p className="text-sm sm:text-base">Aucune demande trouvée pour cette catégorie</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:gap-4">
                {getDemandesByType(detailsModalType).map((demande) => (
                  <Card key={demande.id} className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            {demande.numero}
                          </Badge>
                          <Badge 
                            variant={demande.type === "materiel" ? "default" : "secondary"}
                            className={`text-xs ${demande.type === "materiel" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}
                          >
                            {demande.type === "materiel" ? "Matériel" : "Outillage"}
                          </Badge>
                          <Badge 
                            variant="outline"
                            className={`text-xs ${
                              demande.status === "en_attente_preparation_appro" ? "bg-orange-100 text-orange-800" :
                              demande.status === "en_attente_validation_logistique" ? "bg-blue-100 text-blue-800" :
                              demande.status === "en_attente_validation_finale_demandeur" ? "bg-green-100 text-green-800" :
                              "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {demande.status === "en_attente_preparation_appro" ? "À préparer" :
                             demande.status === "en_attente_validation_logistique" ? "En attente logistique" :
                             demande.status === "en_attente_validation_finale_demandeur" ? "En attente livraison" :
                             demande.status}
                          </Badge>
                        </div>
                        
                        <table className="text-xs sm:text-sm text-gray-600 w-full">
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
                      
                      <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDemandeId(demande.id)
                            setDemandeDetailOpen(true)
                          }}
                          title="Voir les détails complets"
                          className="flex-1 sm:flex-none"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          <span className="hidden xs:inline">Détails</span>
                        </Button>
                        {demande.status === "en_attente_preparation_appro" && (
                          <Badge className="bg-orange-500 text-white text-xs">
                            Action requise
                          </Badge>
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
      <DemandeDetailModal
        isOpen={demandeDetailOpen}
        onClose={() => {
          setDemandeDetailOpen(false)
          setSelectedDemandeId(null)
        }}
        demandeId={selectedDemandeId}
        mode="view"
        canValidate={true}
        onValidate={handleValidation}
      />
    </div>
  )
}

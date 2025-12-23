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
  TrendingUp,
  Eye
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
import UniversalClosureModal from "@/components/modals/universal-closure-modal"
import { useAutoReload } from "@/hooks/useAutoReload"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import DemandeDetailModal from "@/components/demandes/demande-detail-modal"

export default function ResponsableLogistiqueDashboard() {
  const { currentUser, demandes, projets, isLoading } = useStore()
  const { handleManualReload } = useAutoReload("RESPONSABLE-LOGISTIQUE")

  const [stats, setStats] = useState({
    total: 0,
    aValider: 0,
    enCours: 0,
    validees: 0,
    livrees: 0,
  })

  const [createDemandeModalOpen, setCreateDemandeModalOpen] = useState(false)
  const [demandeType, setDemandeType] = useState<"materiel" | "outillage">("materiel")
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [detailsModalType, setDetailsModalType] = useState<"total" | "aValider" | "enCours" | "validees" | "livrees">("total")
  const [detailsModalTitle, setDetailsModalTitle] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [activeChart, setActiveChart] = useState<"material" | "tooling">("material")
  const [universalClosureModalOpen, setUniversalClosureModalOpen] = useState(false)
  const [selectedDemandeId, setSelectedDemandeId] = useState<string | null>(null)
  const [demandeDetailOpen, setDemandeDetailOpen] = useState(false)

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
      
      // 1. MES DEMANDES CRÉÉES (en tant que demandeur)
      const mesDemandesCreees = mesDemandesLogistique.filter((d) => d.technicienId === currentUser.id)

      // 2. DEMANDES À VALIDER (en tant que Logistique dans le flow)
      const demandesAValider = mesDemandesLogistique.filter((d) => d.status === "en_attente_validation_logistique")
      
      // 3. DEMANDES EN COURS (validées par logistique, en attente demandeur)
      const demandesEnCours = mesDemandesLogistique.filter((d) => d.status === "en_attente_validation_finale_demandeur")
      
      // 4. DEMANDES VALIDÉES (confirmées ou clôturées)
      const demandesValidees = mesDemandesLogistique.filter((d) => 
        d.status === "confirmee_demandeur" || d.status === "cloturee"
      )

      // 5. MES DEMANDES EN COURS (comme employé)
      const mesDemandesEnCoursEmploye = mesDemandesCreees.filter((d) => ![
        "brouillon", 
        "cloturee", 
        "rejetee", 
        "archivee"
      ].includes(d.status))

      console.log(`🔍 [LOGISTIQUE-DASHBOARD] Statistiques pour ${currentUser.nom} (${currentUser.role}):`)
      console.log(`  - Projets utilisateur: [${currentUser.projets?.join(', ') || 'aucun'}]`)
      console.log(`  - Total demandes émises par moi: ${mesDemandesCreees.length}`)
      console.log(`  - Demandes à valider (flow Logistique): ${demandesAValider.length}`)
      console.log(`  - Demandes en cours (en attente demandeur): ${demandesEnCours.length}`)
      console.log(`  - Demandes validées (terminées): ${demandesValidees.length}`)
      console.log(`  - Mes demandes en cours: ${mesDemandesEnCoursEmploye.length}`)

      setStats({
        total: mesDemandesCreees.length, // MES demandes créées
        aValider: demandesAValider.length, // Demandes que JE dois valider
        enCours: demandesEnCours.length, // En attente validation finale demandeur
        validees: demandesValidees.length, // Confirmées ou clôturées
        livrees: mesDemandesEnCoursEmploye.length, // MES demandes en cours (comme employé)
      })
    }
  }, [demandes, currentUser])

  const handleCardClick = (type: "total" | "aValider" | "enCours" | "validees" | "livrees", title: string) => {
    setDetailsModalType(type)
    setDetailsModalTitle(title)
    setDetailsModalOpen(true)
  }

  // Fonction pour obtenir les demandes selon le type de carte
  const getDemandesByType = (type: "total" | "aValider" | "enCours" | "validees" | "livrees") => {
    if (!currentUser) return []

    const demandesFiltered = demandes.filter((d) => 
      (!currentUser.projets || currentUser.projets.length === 0 || currentUser.projets.includes(d.projetId))
    )

    switch (type) {
      case "total":
        // MES demandes créées (en tant que demandeur)
        return demandesFiltered.filter((d) => d.technicienId === currentUser.id)
      
      case "aValider":
        // Demandes à valider (en tant que Logistique)
        return demandesFiltered.filter((d) => d.status === "en_attente_validation_logistique")
      
      case "enCours":
        // Demandes en cours (en attente validation finale demandeur)
        return demandesFiltered.filter((d) => d.status === "en_attente_validation_finale_demandeur")
      
      case "validees":
        // Demandes validées (confirmées ou clôturées)
        return demandesFiltered.filter((d) => 
          d.status === "confirmee_demandeur" || d.status === "cloturee"
        )
      
      case "livrees":
        // MES demandes en cours (comme employé)
        return demandesFiltered.filter((d) => 
          d.technicienId === currentUser.id && ![
            "brouillon", 
            "cloturee", 
            "rejetee", 
            "archivee"
          ].includes(d.status)
        )
      
      default:
        return []
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

  const mesDemandes = currentUser ? demandes.filter((d) => d.technicienId === currentUser.id) : []

  // Génération des données de graphique
  const generateChartData = () => {
    const materialRequests = mesDemandes.filter((d) => d.type === "materiel")
    const toolingRequests = mesDemandes.filter((d) => d.type === "outillage")
    
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
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Tableau de Bord Logistique</h1>
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
            {/* Vue d'ensemble - Cards statistiques (5 cartes sur 1 ligne) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4">
              <Card className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: '#015fc4' }} onClick={() => handleCardClick("total", "Mes demandes émises")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total demandes</CardTitle>
                  <Package className="h-4 w-4" style={{ color: '#015fc4' }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: '#015fc4' }}>{stats.total}</div>
                  <p className="text-xs text-muted-foreground">Émises par moi</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: '#f97316' }} onClick={() => handleCardClick("aValider", "Demandes à valider")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">À valider</CardTitle>
                  <Clock className="h-4 w-4" style={{ color: '#f97316' }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: '#f97316' }}>{stats.aValider}</div>
                  <p className="text-xs text-muted-foreground">À valider par moi</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: '#3b82f6' }} onClick={() => handleCardClick("enCours", "Demandes en cours")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">En cours</CardTitle>
                  <Truck className="h-4 w-4" style={{ color: '#3b82f6' }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: '#3b82f6' }}>{stats.enCours}</div>
                  <p className="text-xs text-muted-foreground">En attente demandeur</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: '#8b5cf6' }} onClick={() => handleCardClick("validees", "Demandes validées")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Validées</CardTitle>
                  <CheckCircle className="h-4 w-4" style={{ color: '#8b5cf6' }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: '#8b5cf6' }}>{stats.validees}</div>
                  <p className="text-xs text-muted-foreground">Terminées</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: '#22c55e' }} onClick={() => handleCardClick("livrees", "Mes demandes en cours")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Mes demandes</CardTitle>
                  <FileText className="h-4 w-4" style={{ color: '#22c55e' }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: '#22c55e' }}>{stats.livrees}</div>
                  <p className="text-xs text-muted-foreground">En cours</p>
                </CardContent>
              </Card>
            </div>

            {/* Liste des demandes à valider */}
            <ValidationLogistiqueList />
            
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
        <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] overflow-y-auto p-3 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">{detailsModalTitle}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 sm:space-y-4">
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
                              demande.status === "en_attente_validation_logistique" ? "bg-orange-100 text-orange-800" :
                              demande.status === "en_attente_validation_finale_demandeur" ? "bg-blue-100 text-blue-800" :
                              demande.status === "confirmee_demandeur" || demande.status === "cloturee" ? "bg-green-100 text-green-800" :
                              "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {demande.status === "en_attente_validation_logistique" ? "À valider" :
                             demande.status === "en_attente_validation_finale_demandeur" ? "En attente demandeur" :
                             demande.status === "confirmee_demandeur" ? "Confirmée" :
                             demande.status === "cloturee" ? "Clôturée" :
                             demande.status}
                          </Badge>
                        </div>
                        
                        <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                          <p><strong>Projet:</strong> {demande.projetId}</p>
                          <p><strong>Demandeur:</strong> {demande.technicienId}</p>
                          <p><strong>Date:</strong> {new Date(demande.dateCreation).toLocaleDateString('fr-FR')}</p>
                          {demande.commentaires && (
                            <p className="truncate"><strong>Commentaires:</strong> {demande.commentaires}</p>
                          )}
                        </div>
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
                          Détails
                        </Button>
                        {demande.status === "en_attente_validation_logistique" && (
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
      />
    </div>
  )
}

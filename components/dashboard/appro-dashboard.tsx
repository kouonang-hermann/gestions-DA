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
import { useAutoReload } from "@/hooks/useAutoReload"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

export default function ApproDashboard() {
  const { currentUser, demandes, isLoading } = useStore()
  const { handleManualReload } = useAutoReload("APPRO")

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

  // Données chargées automatiquement par useDataLoader

  useEffect(() => {
    if (currentUser) {
      // Filtrer les demandes par projet si l'utilisateur a des projets assignés
      const demandesFiltered = demandes.filter((d) => 
        (!currentUser.projets || currentUser.projets.length === 0 || currentUser.projets.includes(d.projetId))
      )

      // 1. MES DEMANDES CRÉÉES (en tant que demandeur)
      const mesDemandesCreees = demandesFiltered.filter((d) => d.technicienId === currentUser.id)

      // 2. DEMANDES À TRAITER (en tant qu'Appro dans le flow)
      const demandesATraiter = demandesFiltered.filter((d) => d.status === "en_attente_preparation_appro")
      
      // 3. DEMANDES PRÉPARÉES (préparées par moi, en attente logistique)
      const demandesPreparees = demandesFiltered.filter((d) => d.status === "en_attente_validation_logistique")
      
      // 4. DEMANDES EN ATTENTE DE LIVRAISON (validées logistique, en attente demandeur)
      const demandesEnAttenteLivraison = demandesFiltered.filter((d) => 
        d.status === "en_attente_validation_finale_demandeur"
      )

      // 5. MES DEMANDES EN COURS (comme employé)
      const mesDemandesEnCours = mesDemandesCreees.filter((d) => ![
        "brouillon", 
        "cloturee", 
        "rejetee", 
        "archivee"
      ].includes(d.status))

      console.log(`🔍 [APPRO-DASHBOARD] Statistiques pour ${currentUser.nom} (${currentUser.role}):`)
      console.log(`  - Projets utilisateur: [${currentUser.projets?.join(', ') || 'aucun'}]`)
      console.log(`  - Total demandes émises par moi: ${mesDemandesCreees.length}`)
      console.log(`  - Demandes à préparer (flow Appro): ${demandesATraiter.length}`)
      console.log(`  - Mes demandes en cours: ${mesDemandesEnCours.length}`)
      console.log(`  - Demandes préparées (en attente logistique): ${demandesPreparees.length}`)
      console.log(`  - Demandes en attente de livraison: ${demandesEnAttenteLivraison.length}`)

      setStats({
        total: mesDemandesCreees.length, // MES demandes créées
        aPreparer: demandesATraiter.length, // Demandes que JE dois préparer
        enCours: mesDemandesEnCours.length, // MES demandes en cours (comme employé)
        preparees: demandesPreparees.length, // Demandes que J'AI préparées
        livrees: demandesEnAttenteLivraison.length, // En attente de livraison
      })
    }
  }, [currentUser, demandes])

  const mesDemandes = currentUser ? demandes.filter((d) => d.technicienId === currentUser.id) : []

  const handleCardClick = (type: "total" | "aPreparer" | "enCours" | "preparees" | "livrees", title: string) => {
    setDetailsModalType(type)
    setDetailsModalTitle(title)
    setDetailsModalOpen(true)
  }

  // Fonction pour obtenir les demandes selon le type de carte
  const getDemandesByType = (type: "total" | "aPreparer" | "enCours" | "preparees" | "livrees") => {
    if (!currentUser) return []

    const demandesFiltered = demandes.filter((d) => 
      (!currentUser.projets || currentUser.projets.length === 0 || currentUser.projets.includes(d.projetId))
    )

    switch (type) {
      case "total":
        // MES demandes créées (en tant que demandeur)
        return demandesFiltered.filter((d) => d.technicienId === currentUser.id)
      
      case "aPreparer":
        // Demandes à préparer (en tant qu'Appro)
        return demandesFiltered.filter((d) => d.status === "en_attente_preparation_appro")
      
      case "enCours":
        // MES demandes en cours (comme employé)
        return demandesFiltered.filter((d) => 
          d.technicienId === currentUser.id && ![
            "brouillon", 
            "cloturee", 
            "rejetee", 
            "archivee"
          ].includes(d.status)
        )
      
      case "preparees":
        // Demandes préparées (en attente logistique)
        return demandesFiltered.filter((d) => d.status === "en_attente_validation_logistique")
      
      case "livrees":
        // Demandes en attente de livraison
        return demandesFiltered.filter((d) => d.status === "en_attente_validation_finale_demandeur")
      
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
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="max-w-full mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord Appro</h1>
          <Button 
            onClick={handleManualReload}
            variant="outline"
            className="bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100"
          >
            🔄 Actualiser
          </Button>
        </div>

        {/* Layout principal : deux colonnes */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Colonne de gauche (large) - 3/4 de la largeur */}
          <div className="lg:col-span-3 space-y-4">
            {/* Vue d'ensemble - Cards statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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

              <Card className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: '#f97316' }} onClick={() => handleCardClick("aPreparer", "Demandes à préparer")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">À préparer</CardTitle>
                  <Clock className="h-4 w-4" style={{ color: '#f97316' }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: '#f97316' }}>{stats.aPreparer}</div>
                  <p className="text-xs text-muted-foreground">À préparer par moi</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: '#3b82f6' }} onClick={() => handleCardClick("enCours", "Mes demandes en cours")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">En cours</CardTitle>
                  <Clock className="h-4 w-4" style={{ color: '#3b82f6' }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: '#3b82f6' }}>{stats.enCours}</div>
                  <p className="text-xs text-muted-foreground">Mes demandes en cours</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: '#b8d1df' }} onClick={() => handleCardClick("preparees", "Demandes préparées")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Préparées</CardTitle>
                  <Truck className="h-4 w-4" style={{ color: '#b8d1df' }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: '#b8d1df' }}>{stats.preparees}</div>
                  <p className="text-xs text-muted-foreground">Préparées par moi</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftColor: '#22c55e' }} onClick={() => handleCardClick("livrees", "En attente de livraison")}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">En attente livraison</CardTitle>
                  <CheckCircle className="h-4 w-4" style={{ color: '#22c55e' }} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" style={{ color: '#22c55e' }}>{stats.livrees}</div>
                  <p className="text-xs text-muted-foreground">Prêtes à livrer</p>
                </CardContent>
              </Card>
            </div>


            {/* Liste des demandes à préparer */}
            <SortiePreparationList />
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
      {/* Modale de détails des demandes */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailsModalTitle}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {getDemandesByType(detailsModalType).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Aucune demande trouvée pour cette catégorie</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {getDemandesByType(detailsModalType).map((demande) => (
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
                              demande.status === "en_attente_preparation_appro" ? "bg-orange-100 text-orange-800" :
                              demande.status === "en_attente_validation_logistique" ? "bg-blue-100 text-blue-800" :
                              demande.status === "en_attente_validation_finale_demandeur" ? "bg-green-100 text-green-800" :
                              "bg-gray-100 text-gray-800"
                            }
                          >
                            {demande.status === "en_attente_preparation_appro" ? "À préparer" :
                             demande.status === "en_attente_validation_logistique" ? "En attente logistique" :
                             demande.status === "en_attente_validation_finale_demandeur" ? "En attente livraison" :
                             demande.status}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-gray-600 space-y-1">
                          <p><strong>Projet:</strong> {demande.projetId}</p>
                          <p><strong>Demandeur:</strong> {demande.technicienId}</p>
                          <p><strong>Date de création:</strong> {new Date(demande.dateCreation).toLocaleDateString('fr-FR')}</p>
                          {demande.commentaires && (
                            <p><strong>Commentaires:</strong> {demande.commentaires}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2">
                        <div className="text-sm text-gray-500">
                          {new Date(demande.dateCreation).toLocaleDateString('fr-FR')}
                        </div>
                        {demande.status === "en_attente_preparation_appro" && (
                          <Badge className="bg-orange-500 text-white">
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
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useStore } from "@/stores/useStore"
import { Package, Clock, CheckCircle, XCircle, Plus, FileText, ChevronDown, ChevronRight } from 'lucide-react'
import InstrumElecLogo from "@/components/ui/instrumelec-logo"
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
  const [projetsExpanded, setProjetsExpanded] = useState(false)

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

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center space-x-4">
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card 
          className="bg-blue-50 border-blue-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleCardClick("total", "Toutes mes demandes")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total demandes</p>
                <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-orange-50 border-orange-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleCardClick("enCours", "Mes demandes en cours")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">En cours</p>
                <p className="text-2xl font-bold text-orange-800">{stats.enCours}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-green-50 border-green-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleCardClick("validees", "Mes demandes validées")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Validées</p>
                <p className="text-2xl font-bold text-green-800">{stats.validees}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-gray-50 border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleCardClick("brouillons", "Mes brouillons")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Brouillons</p>
                <p className="text-2xl font-bold text-gray-600">{stats.brouillons}</p>
              </div>
              <Package className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <Card className="bg-gray-50 border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-800">Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => {
                setDemandeType("materiel")
                setCreateDemandeModalOpen(true)
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle demande de matériel
            </Button>
            <Button
              onClick={() => {
                setDemandeType("outillage")
                setCreateDemandeModalOpen(true)
              }}
              className="bg-teal-600 hover:bg-teal-700 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle demande d'outillage
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Mes projets */}
      {mesProjets.length > 0 && (
        <Card className="bg-gray-50 border-gray-200">
          <CardHeader 
            className="cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => setProjetsExpanded(!projetsExpanded)}
          >
            <CardTitle className="flex items-center justify-between text-gray-800">
              <span>Mes projets ({mesProjets.length})</span>
              {projetsExpanded ? (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronRight className="h-5 w-5 text-gray-500" />
              )}
            </CardTitle>
          </CardHeader>
          {projetsExpanded && (
            <CardContent className="animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mesProjets.map((projet) => (
                  <div key={projet.id} className="bg-white p-4 rounded-lg border border-gray-200">
                    <h3 className="font-medium text-gray-800">{projet.nom}</h3>
                    <p className="text-sm text-gray-600 mt-1">{projet.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-500">
                        Début: {new Date(projet.dateDebut).toLocaleDateString()}
                      </span>
                      <Badge className={projet.actif ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                        {projet.actif ? "Actif" : "Inactif"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Graphiques des demandes utilisateur */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UserRequestsChart
          title="Mes demandes de matériel"
          type="materiel"
          userRequests={mesDemandes}
          className="bg-green-50 border-green-200"
        />
        <UserRequestsChart
          title="Mes demandes d'outillage"
          type="outillage"
          userRequests={mesDemandes}
          className="bg-blue-50 border-blue-200"
        />
      </div>

      {/* Modal de création de demande */}
      <CreateDemandeModal
        isOpen={createDemandeModalOpen}
        onClose={() => setCreateDemandeModalOpen(false)}
        type={demandeType}
      />

      {/* Modal des détails */}
      <UserDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title={detailsModalTitle}
        data={mesDemandes}
        type={detailsModalType}
      />
      
      {/* Modal de l'historique des demandes validées */}
      <ValidatedRequestsHistory
        isOpen={validatedHistoryModalOpen}
        onClose={() => setValidatedHistoryModalOpen(false)}
      />
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useStore } from "@/stores/useStore"
import { Package, Clock, CheckCircle, XCircle, FileText, Eye } from 'lucide-react'
import InstrumElecLogo from "@/components/ui/instrumelec-logo"
import ValidationDemandesList from "@/components/validation/validation-demandes-list"
import DemandeDetailsModal from "@/components/modals/demande-details-modal"
import type { Demande } from "@/types"

export default function ResponsableTravauxDashboard() {
  const { currentUser, demandes, projets, loadDemandes, loadProjets, isLoading } = useStore()

  const [stats, setStats] = useState({
    total: 0,
    enAttente: 0,
    validees: 0,
    rejetees: 0,
  })

  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null)
  const [dataLoaded, setDataLoaded] = useState(false)

  // Chargement initial des données
  useEffect(() => {
    if (currentUser && !dataLoaded) {
      const loadInitialData = async () => {
        try {
          console.log("Chargement des données pour le responsable des travaux...")
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
      // Filtrer les demandes de matériel qui nécessitent la validation du responsable des travaux
      const demandesMaterielles = demandes.filter((d) => d.type === "materiel")

      setStats({
        total: demandesMaterielles.length,
        enAttente: demandesMaterielles.filter((d) => d.status === "en_attente_validation_responsable_travaux").length,
        validees: demandesMaterielles.filter((d) => 
          ["en_attente_validation_appro", "en_attente_validation_charge_affaire", "en_attente_validation_logistique", "en_attente_confirmation_demandeur", "confirmee_demandeur"].includes(d.status)
        ).length,
        rejetees: demandesMaterielles.filter((d) => d.status === "rejetee").length,
      })
    }
  }, [currentUser?.id, demandes])

  const handleViewDetails = (demande: Demande) => {
    setSelectedDemande(demande)
    setDetailsModalOpen(true)
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
  const demandesEnAttente = demandes.filter((d) => 
    d.status === "en_attente_validation_responsable_travaux" && 
    d.type === "materiel" &&
    mesProjetIds.includes(d.projetId)
  )

  return (
    <div className="space-y-6">
      {/* En-tête avec logo InstrumElec */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <InstrumElecLogo size="sm" />
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord - Responsable des Travaux</h1>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total demandes matériel</p>
                <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">En attente validation</p>
                <p className="text-2xl font-bold text-orange-800">{stats.enAttente}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
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

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Rejetées</p>
                <p className="text-2xl font-bold text-red-800">{stats.rejetees}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
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
            <ValidationDemandesList
              type="materiel"
              title="Demandes de matériel à valider"
            />
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

      {/* Modal des détails */}
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
          // Recharger les données
          await loadDemandes()
        }}
        canValidate={selectedDemande?.status === "en_attente_validation_responsable_travaux"}
      />
    </div>
  )
}

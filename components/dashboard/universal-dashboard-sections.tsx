"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useStore } from "@/stores/useStore"
import { 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Plus,
  FileText,
  Eye,
  User
} from 'lucide-react'
import type { Demande, DemandeType, UserRole } from "@/types"
import CreateDemandeModal from "@/components/demandes/create-demande-modal"
import MesDemandesACloturer from "@/components/demandes/mes-demandes-a-cloturer"
import DemandeDetailModal from "@/components/demandes/demande-detail-modal"

interface UniversalDashboardSectionsProps {
  userRole: UserRole
  title: string
}

export default function UniversalDashboardSections({ userRole, title }: UniversalDashboardSectionsProps) {
  const { currentUser, demandes, canUserValidateStep, getValidationFlow } = useStore()
  
  // États pour les sections
  const [mesDemandesCreees, setMesDemandesCreees] = useState<Demande[]>([])
  const [demandesAValider, setDemandesAValider] = useState<Demande[]>([])
  const [createDemandeModalOpen, setCreateDemandeModalOpen] = useState(false)
  const [demandeType, setDemandeType] = useState<DemandeType>("materiel")
  const [demandeDetailsOpen, setDemandeDetailsOpen] = useState(false)
  const [selectedDemandeId, setSelectedDemandeId] = useState<string | null>(null)

  // Statistiques pour "Mes demandes créées"
  const [statsCreees, setStatsCreees] = useState({
    total: 0,
    enCours: 0,
    validees: 0,
    rejetees: 0
  })

  // Statistiques pour "Demandes à valider"
  const [statsAValider, setStatsAValider] = useState({
    total: 0,
    materiel: 0,
    outillage: 0,
    urgent: 0
  })

  // Calculer mes demandes créées
  useEffect(() => {
    if (currentUser && demandes) {
      const mesDemandesFiltered = demandes.filter(d => d.technicienId === currentUser.id)
      setMesDemandesCreees(mesDemandesFiltered)

      // Calculer les statistiques
      setStatsCreees({
        total: mesDemandesFiltered.length,
        enCours: mesDemandesFiltered.filter(d => 
          !["cloturee", "rejetee", "archivee"].includes(d.status)
        ).length,
        validees: mesDemandesFiltered.filter(d => d.status === "cloturee").length,
        rejetees: mesDemandesFiltered.filter(d => d.status === "rejetee").length
      })
    }
  }, [currentUser, demandes])

  // Calculer les demandes à valider selon le rôle
  useEffect(() => {
    if (currentUser && demandes) {
      const demandesFiltered = demandes.filter(d => {
        // Filtrer par projet si l'utilisateur a des projets assignés
        const isInProject = !currentUser.projets || currentUser.projets.length === 0 || 
                           currentUser.projets.includes(d.projetId)
        
        if (!isInProject) return false

        // Vérifier si l'utilisateur peut valider cette étape pour ce type de demande
        return canUserValidateStep(currentUser.role, d.type, d.status)
      })

      setDemandesAValider(demandesFiltered)

      // Calculer les statistiques
      setStatsAValider({
        total: demandesFiltered.length,
        materiel: demandesFiltered.filter(d => d.type === "materiel").length,
        outillage: demandesFiltered.filter(d => d.type === "outillage").length,
        urgent: demandesFiltered.filter(d => 
          // Considérer comme urgent si créé il y a plus de 3 jours
          new Date().getTime() - new Date(d.dateCreation).getTime() > 3 * 24 * 60 * 60 * 1000
        ).length
      })
    }
  }, [currentUser, demandes, canUserValidateStep])

  const getStatusColor = (status: string) => {
    const colors = {
      "brouillon": "bg-gray-100 text-gray-800",
      "soumise": "bg-blue-100 text-blue-800",
      "en_attente_validation_conducteur": "bg-yellow-100 text-yellow-800",
      "en_attente_validation_qhse": "bg-orange-100 text-orange-800",
      "en_attente_validation_responsable_travaux": "bg-purple-100 text-purple-800",
      "en_attente_validation_charge_affaire": "bg-indigo-100 text-indigo-800",
      "en_attente_preparation_appro": "bg-cyan-100 text-cyan-800",
      "en_attente_validation_logistique": "bg-teal-100 text-teal-800",
      "en_attente_validation_finale_demandeur": "bg-green-100 text-green-800",
      "cloturee": "bg-green-100 text-green-800",
      "rejetee": "bg-red-100 text-red-800",
      "archivee": "bg-gray-100 text-gray-800"
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      "brouillon": "Brouillon",
      "soumise": "Soumise",
      "en_attente_validation_conducteur": "En attente conducteur",
      "en_attente_validation_qhse": "En attente QHSE",
      "en_attente_validation_responsable_travaux": "En attente resp. travaux",
      "en_attente_validation_charge_affaire": "En attente chargé affaire",
      "en_attente_preparation_appro": "En préparation appro",
      "en_attente_validation_logistique": "En attente logistique",
      "en_attente_validation_finale_demandeur": "En attente clôture",
      "cloturee": "Clôturée",
      "rejetee": "Rejetée",
      "archivee": "Archivée"
    }
    return labels[status as keyof typeof labels] || status
  }

  return (
    <div className="space-y-6">
      {/* Section 1: Mes Demandes Créées */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: '#015fc4' }}>
            <User className="h-5 w-5" />
            Mes Demandes Créées
          </h2>
          <Button
            onClick={() => {
              setDemandeType("materiel")
              setCreateDemandeModalOpen(true)
            }}
            className="bg-[#015fc4] hover:bg-[#014a9c] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle Demande
          </Button>
        </div>

        {/* Cartes statistiques - Mes demandes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-l-4" style={{ borderLeftColor: '#015fc4' }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
              <FileText className="h-4 w-4" style={{ color: '#015fc4' }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" style={{ color: '#015fc4' }}>
                {statsCreees.total}
              </div>
              <p className="text-xs text-muted-foreground">
                demandes créées
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">En cours</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {statsCreees.enCours}
              </div>
              <p className="text-xs text-muted-foreground">
                en validation
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Validées</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {statsCreees.validees}
              </div>
              <p className="text-xs text-muted-foreground">
                clôturées
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rejetées</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {statsCreees.rejetees}
              </div>
              <p className="text-xs text-muted-foreground">
                refusées
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Liste des demandes créées */}
        {mesDemandesCreees.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mes Dernières Demandes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {mesDemandesCreees.slice(0, 5).map((demande) => (
                  <div key={demande.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{demande.numero}</span>
                        <Badge variant="outline" className={getStatusColor(demande.status)}>
                          {getStatusLabel(demande.status)}
                        </Badge>
                        <Badge variant="outline">
                          {demande.type === "materiel" ? "📦 Matériel" : "🔨 Outillage"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Créée le {new Date(demande.dateCreation).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedDemandeId(demande.id)
                        setDemandeDetailsOpen(true)
                      }}
                      title="Voir les détails"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Section clôture */}
        <MesDemandesACloturer />
      </div>

      {/* Section 2: Demandes à Valider */}
      {statsAValider.total > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold flex items-center gap-2" style={{ color: '#015fc4' }}>
            <CheckCircle className="h-5 w-5" />
            Demandes à Valider ({title})
          </h2>

          {/* Cartes statistiques - À valider */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4" style={{ borderLeftColor: '#fc2d1f' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">À valider</CardTitle>
                <Clock className="h-4 w-4" style={{ color: '#fc2d1f' }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: '#fc2d1f' }}>
                  {statsAValider.total}
                </div>
                <p className="text-xs text-muted-foreground">
                  demandes en attente
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4" style={{ borderLeftColor: '#015fc4' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Matériel</CardTitle>
                <Package className="h-4 w-4" style={{ color: '#015fc4' }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: '#015fc4' }}>
                  {statsAValider.materiel}
                </div>
                <p className="text-xs text-muted-foreground">
                  demandes matériel
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4" style={{ borderLeftColor: '#b8d1df' }}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Outillage</CardTitle>
                <Package className="h-4 w-4" style={{ color: '#b8d1df' }} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" style={{ color: '#b8d1df' }}>
                  {statsAValider.outillage}
                </div>
                <p className="text-xs text-muted-foreground">
                  demandes outillage
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-orange-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Urgent</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {statsAValider.urgent}
                </div>
                <p className="text-xs text-muted-foreground">
                  + de 3 jours
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Liste des demandes à valider */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Demandes en Attente de Validation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {demandesAValider.slice(0, 5).map((demande) => (
                  <div key={demande.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{demande.numero}</span>
                        <Badge variant="outline" className={getStatusColor(demande.status)}>
                          {getStatusLabel(demande.status)}
                        </Badge>
                        <Badge variant="outline">
                          {demande.type === "materiel" ? "📦 Matériel" : "🔨 Outillage"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Par {demande.technicien?.nom} - {new Date(demande.dateCreation).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedDemandeId(demande.id)
                          setDemandeDetailsOpen(true)
                        }}
                        title="Voir les détails"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de création */}
      <CreateDemandeModal
        isOpen={createDemandeModalOpen}
        onClose={() => setCreateDemandeModalOpen(false)}
        type={demandeType}
      />

      {/* Modal de détails de demande */}
      <DemandeDetailModal
        isOpen={demandeDetailsOpen}
        onClose={() => {
          setDemandeDetailsOpen(false)
          setSelectedDemandeId(null)
        }}
        demandeId={selectedDemandeId}
        mode="view"
      />
    </div>
  )
}

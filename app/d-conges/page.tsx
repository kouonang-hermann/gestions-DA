"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Calendar, Plus, Filter, FileText, CheckCircle, XCircle, Clock, Download, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { useStore } from "@/stores/useStore"
import { NouvelleDemandeModal } from "@/components/conges/nouvelle-demande-modal"
import { downloadCongePDF } from "@/lib/conge-pdf-generator"
import DemandeCongeDetailsModal from "@/components/conges/demande-conge-details-modal"
import type { DemandeConge } from "@/types"

export default function DCongesPage() {
  const router = useRouter()
  const { currentUser } = useStore()
  const [demandes, setDemandes] = useState<DemandeConge[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")
  const [nouvelleDemandeOpen, setNouvelleDemandeOpen] = useState(false)
  const [selectedDemande, setSelectedDemande] = useState<DemandeConge | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  useEffect(() => {
    loadDemandes()
  }, [])

  const loadDemandes = async () => {
    setLoading(true)
    try {
      const token = useStore.getState().token
      const response = await fetch("/api/conges", {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      })
      const data = await response.json()
      if (data.success) {
        setDemandes(data.data)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des demandes:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      brouillon: { label: "Brouillon", variant: "secondary" },
      soumise: { label: "Soumise", variant: "default" },
      en_attente_validation_hierarchique: { label: "En attente responsable", variant: "outline" },
      en_attente_validation_rh: { label: "En attente RH", variant: "outline" },
      en_attente_visa_dg: { label: "En attente DG", variant: "outline" },
      approuvee: { label: "Approuvée", variant: "default" },
      rejetee: { label: "Rejetée", variant: "destructive" },
      annulee: { label: "Annulée", variant: "secondary" }
    }
    const config = statusConfig[status] || { label: status, variant: "default" }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      annuel: "Congés annuel",
      maladie: "Congés maladie",
      parental: "Congés de parental",
      recuperation: "Congés pour récupération",
      autres: "Autres"
    }
    return types[type] || type
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR")
  }

  const filteredDemandes = demandes.filter(d => {
    if (filterStatus !== "all" && d.status !== filterStatus) return false
    if (filterType !== "all" && d.typeConge !== filterType) return false
    return true
  })

  const stats = {
    total: demandes.length,
    enAttente: demandes.filter(d => d.status.includes("attente")).length,
    approuvees: demandes.filter(d => d.status === "approuvee").length,
    rejetees: demandes.filter(d => d.status === "rejetee").length
  }

  const handleDownloadPDF = async (demande: DemandeConge) => {
    setDownloadingId(demande.id)
    try {
      downloadCongePDF(demande as any)
    } catch (error) {
      console.error('Erreur téléchargement PDF:', error)
      alert('Erreur lors de la génération du PDF')
    } finally {
      setDownloadingId(null)
    }
  }

  const handleViewDetails = (demande: DemandeConge) => {
    setSelectedDemande(demande)
    setDetailsModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Mes Demandes de Congés
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Gestion et suivi de vos demandes de congés
              </p>
            </div>
          </div>
          <Button
            onClick={() => setNouvelleDemandeOpen(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nouvelle demande
          </Button>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">En attente</p>
                  <p className="text-2xl font-bold">{stats.enAttente}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approuvées</p>
                  <p className="text-2xl font-bold">{stats.approuvees}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rejetées</p>
                  <p className="text-2xl font-bold">{stats.rejetees}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              <CardTitle>Filtres</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Statut</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="brouillon">Brouillon</SelectItem>
                    <SelectItem value="soumise">Soumise</SelectItem>
                    <SelectItem value="en_attente_validation_hierarchique">En attente responsable</SelectItem>
                    <SelectItem value="en_attente_validation_rh">En attente RH</SelectItem>
                    <SelectItem value="en_attente_visa_dg">En attente DG</SelectItem>
                    <SelectItem value="approuvee">Approuvée</SelectItem>
                    <SelectItem value="rejetee">Rejetée</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Type de congé</label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="annuel">Congés annuel</SelectItem>
                    <SelectItem value="maladie">Congés maladie</SelectItem>
                    <SelectItem value="parental">Congés de parental</SelectItem>
                    <SelectItem value="recuperation">Congés pour récupération</SelectItem>
                    <SelectItem value="autres">Autres</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liste des demandes */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des demandes ({filteredDemandes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">Chargement...</div>
            ) : filteredDemandes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Aucune demande trouvée
              </div>
            ) : (
              <div className="space-y-4">
                {filteredDemandes.map((demande) => (
                  <div
                    key={demande.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-lg">{demande.numero}</span>
                          {getStatusBadge(demande.status)}
                        </div>
                        <p className="text-sm text-gray-600">
                          {getTypeLabel(demande.typeConge)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          Créée le {formatDate(demande.dateCreation)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Période</p>
                        <p className="font-medium">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          {formatDate(demande.dateDebut)} → {formatDate(demande.dateFin)}
                        </p>
                        <p className="text-gray-500">{demande.nombreJours} jour(s)</p>
                      </div>

                      {demande.responsable && (
                        <div>
                          <p className="text-gray-600">Responsable</p>
                          <p className="font-medium">
                            {demande.responsable.prenom} {demande.responsable.nom}
                          </p>
                        </div>
                      )}

                      {currentUser?.role !== "employe" && demande.employe && (
                        <div>
                          <p className="text-gray-600">Employé</p>
                          <p className="font-medium">
                            {demande.employe.prenom} {demande.employe.nom}
                          </p>
                          {demande.employe.service && (
                            <p className="text-gray-500">{demande.employe.service}</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4 pt-4 border-t">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDetails(demande)}
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Voir détails
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleDownloadPDF(demande)}
                        disabled={downloadingId === demande.id}
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {downloadingId === demande.id ? 'Téléchargement...' : 'Télécharger PDF'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <NouvelleDemandeModal
        open={nouvelleDemandeOpen}
        onOpenChange={(open) => {
          setNouvelleDemandeOpen(open)
          if (!open) {
            loadDemandes() // Recharger après création
          }
        }}
      />

      <DemandeCongeDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false)
          setSelectedDemande(null)
        }}
        demande={selectedDemande}
      />
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  User,
  Package,
  Wrench,
  Calendar,
  FileText,
  Eye,
  Search,
  Filter,
  X,
  ArrowUpDown,
} from "lucide-react"
import type { Demande, HistoryEntry } from "@/types"
import PurchaseRequestDetailsModal from "@/components/modals/purchase-request-details-modal"
import { useStore } from "@/stores/useStore"

interface ValidatedRequestsHistoryProps {
  isOpen: boolean
  onClose: () => void
}

interface DemandeWithHistory extends Demande {
  history: HistoryEntry[]
  validationSteps: ValidationStep[]
}

interface ValidationStep {
  role: string
  validator: string
  date: string
  status: string
}

export default function ValidatedRequestsHistory({ isOpen, onClose }: ValidatedRequestsHistoryProps) {
  const { users } = useStore()
  const [validatedRequests, setValidatedRequests] = useState<DemandeWithHistory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<DemandeWithHistory | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)

  // États pour la recherche, les filtres et le tri (identiques au modal "En cours")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterMonth, setFilterMonth] = useState<string>("")
  const [filterUser, setFilterUser] = useState<string>("")
  const [filterProjet, setFilterProjet] = useState<string>("")
  const [sortBy, setSortBy] = useState<"date" | "numero" | "statut" | "type">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")

  useEffect(() => {
    if (isOpen) {
      fetchValidatedRequests()
    }
  }, [isOpen])

  const fetchValidatedRequests = async () => {
    setIsLoading(true)
    try {
      const token = useStore.getState().token

      // Check localStorage as fallback
      const localToken = localStorage.getItem('token')

      const finalToken = token || localToken

      if (!finalToken) {
        setError('Non authentifié')
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/demandes/validated-history', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${finalToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setValidatedRequests(data.data || [])
      } else {
        setError(`Erreur lors du chargement de l'historique: ${response.statusText}`)
      }
    } catch (error) {
    } finally {
      setIsLoading(false)
    }
  }

  // === Filtrage et tri (même logique que DemandesCategoryModal "En cours") ===
  let filteredDemandes = validatedRequests.filter((demande) =>
    demande.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
    demande.projet?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    demande.technicien?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    demande.technicien?.prenom.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Filtre par mois
  if (filterMonth) {
    filteredDemandes = filteredDemandes.filter((d) => {
      const demandeDate = new Date(d.dateCreation)
      const [year, month] = filterMonth.split("-")
      return (
        demandeDate.getFullYear() === parseInt(year) &&
        demandeDate.getMonth() === parseInt(month) - 1
      )
    })
  }

  // Filtre par demandeur
  if (filterUser) {
    filteredDemandes = filteredDemandes.filter((d) => d.technicienId === filterUser)
  }

  // Filtre par projet
  if (filterProjet) {
    filteredDemandes = filteredDemandes.filter((d) => d.projetId === filterProjet)
  }

  // Liste unique des projets présents
  const projetsDisponibles = Array.from(
    new Map(
      validatedRequests
        .filter((d) => d.projet)
        .map((d) => [d.projetId, { id: d.projetId, nom: d.projet?.nom || "N/A" }])
    ).values()
  ).sort((a, b) => a.nom.localeCompare(b.nom))

  // Tri
  filteredDemandes = [...filteredDemandes].sort((a, b) => {
    let comparison = 0
    switch (sortBy) {
      case "date":
        comparison = new Date(a.dateCreation).getTime() - new Date(b.dateCreation).getTime()
        break
      case "numero":
        comparison = a.numero.localeCompare(b.numero)
        break
      case "statut":
        comparison = a.status.localeCompare(b.status)
        break
      case "type":
        comparison = a.type.localeCompare(b.type)
        break
    }
    return sortOrder === "asc" ? comparison : -comparison
  })

  // === Couleurs et labels (logique propre à "Toutes les demandes") ===
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'cloturee':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'confirmee_demandeur':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'en_attente_validation_finale_demandeur':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'rejetee':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'cloturee':
        return 'Clôturée'
      case 'confirmee_demandeur':
        return 'Confirmée'
      case 'en_attente_validation_finale_demandeur':
        return 'Livrée - En attente de clôture'
      case 'rejetee':
        return 'Rejetée'
      default:
        return status
    }
  }

  const getTypeIcon = (type: string) =>
    type === "materiel" ? <Package className="h-4 w-4" /> : <Wrench className="h-4 w-4" />

  const getTypeColor = (type: string) =>
    type === "materiel"
      ? { bg: "#dbeafe", text: "#015fc4" }
      : { bg: "#f3e8ff", text: "#7c3aed" }

  const openRequestDetails = (request: DemandeWithHistory) => {
    setSelectedRequest(request)
    setDetailsModalOpen(true)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto p-3 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2 text-base sm:text-xl">
              <FileText className="h-5 w-5 text-blue-600" />
              <span className="truncate">Toutes les demandes</span>
              <Badge variant="outline" className="ml-0 sm:ml-2 text-xs">
                {filteredDemandes.length} demande{filteredDemandes.length > 1 ? 's' : ''}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Vue d'ensemble de toutes les demandes du système
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Barre de recherche */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>
              </div>

              {/* Filtres et Tri */}
              <div className="space-y-3">
                <div className="flex flex-wrap gap-3">
                  {/* Filtre par mois */}
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      <Filter className="h-3 w-3 inline mr-1" />
                      Filtrer par mois
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="month"
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        className="bg-white text-sm"
                      />
                      {filterMonth && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFilterMonth("")}
                          className="px-2"
                          title="Effacer le filtre"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Filtre par demandeur */}
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      <Filter className="h-3 w-3 inline mr-1" />
                      Filtrer par demandeur
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={filterUser}
                        onChange={(e) => setFilterUser(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="">Tous les demandeurs</option>
                        {users
                          .filter((u) => validatedRequests.some((d) => d.technicienId === u.id))
                          .sort((a, b) => `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`))
                          .map((user) => (
                            <option key={user.id} value={user.id}>
                              {user.prenom} {user.nom}
                            </option>
                          ))}
                      </select>
                      {filterUser && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFilterUser("")}
                          className="px-2"
                          title="Effacer le filtre"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Filtre par projet */}
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                      <Filter className="h-3 w-3 inline mr-1" />
                      Filtrer par projet
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={filterProjet}
                        onChange={(e) => setFilterProjet(e.target.value)}
                        className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="">Tous les projets</option>
                        {projetsDisponibles.map((projet) => (
                          <option key={projet.id} value={projet.id}>
                            {projet.nom}
                          </option>
                        ))}
                      </select>
                      {filterProjet && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setFilterProjet("")}
                          className="px-2"
                          title="Effacer le filtre"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Boutons de tri */}
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={sortBy === "date" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (sortBy === "date") {
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                      } else {
                        setSortBy("date")
                        setSortOrder("desc")
                      }
                    }}
                    className="text-xs"
                  >
                    <ArrowUpDown className="h-3 w-3 mr-1" />
                    Date {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
                  </Button>
                  <Button
                    variant={sortBy === "numero" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (sortBy === "numero") {
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                      } else {
                        setSortBy("numero")
                        setSortOrder("asc")
                      }
                    }}
                    className="text-xs"
                  >
                    <ArrowUpDown className="h-3 w-3 mr-1" />
                    Numéro {sortBy === "numero" && (sortOrder === "asc" ? "↑" : "↓")}
                  </Button>
                  <Button
                    variant={sortBy === "statut" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (sortBy === "statut") {
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                      } else {
                        setSortBy("statut")
                        setSortOrder("asc")
                      }
                    }}
                    className="text-xs"
                  >
                    <ArrowUpDown className="h-3 w-3 mr-1" />
                    Statut {sortBy === "statut" && (sortOrder === "asc" ? "↑" : "↓")}
                  </Button>
                  <Button
                    variant={sortBy === "type" ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (sortBy === "type") {
                        setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                      } else {
                        setSortBy("type")
                        setSortOrder("asc")
                      }
                    }}
                    className="text-xs"
                  >
                    <ArrowUpDown className="h-3 w-3 mr-1" />
                    Type {sortBy === "type" && (sortOrder === "asc" ? "↑" : "↓")}
                  </Button>
                </div>
              </div>

              {/* Tableau des demandes */}
              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-[60vh] overflow-y-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-gray-50 z-10">
                      <TableRow>
                        <TableHead>Numéro</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Projet</TableHead>
                        <TableHead className="hidden sm:table-cell">Demandeur</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead className="hidden md:table-cell">Date création</TableHead>
                        <TableHead className="hidden lg:table-cell">Articles</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDemandes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                            {searchTerm ? "Aucune demande trouvée pour cette recherche" : "Aucune demande trouvée"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredDemandes.map((request) => {
                          const typeColor = getTypeColor(request.type)
                          return (
                            <TableRow key={request.id} className="hover:bg-gray-50">
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  {getTypeIcon(request.type)}
                                  {request.numero}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className="text-xs font-medium px-2 py-1"
                                  style={{
                                    backgroundColor: typeColor.bg,
                                    color: typeColor.text,
                                    border: `1px solid ${typeColor.text}20`,
                                  }}
                                >
                                  {request.type === "materiel" ? "Matériel" : "Outillage"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="max-w-[150px] truncate" title={request.projet?.nom}>
                                  {request.projet?.nom || "N/A"}
                                </div>
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                <div className="flex items-center gap-2 text-sm">
                                  <User className="h-4 w-4 text-gray-500" />
                                  {request.technicien?.prenom} {request.technicien?.nom}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge className={`text-xs ${getStatusColor(request.status)}`}>
                                  {getStatusLabel(request.status)}
                                </Badge>
                              </TableCell>
                              <TableCell className="hidden md:table-cell text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(request.dateCreation).toLocaleDateString('fr-FR')}
                                </div>
                              </TableCell>
                              <TableCell className="hidden lg:table-cell">
                                <div className="text-sm text-gray-600">
                                  {request.items?.length || 0} article{(request.items?.length || 0) > 1 ? 's' : ''}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openRequestDetails(request)}
                                  className="flex items-center justify-center w-8 h-8 p-0 hover:bg-blue-50 hover:border-blue-200"
                                  title="Voir les détails"
                                >
                                  <Eye className="h-4 w-4 text-blue-600" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Statistiques rapides */}
              {filteredDemandes.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Statistiques rapides</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold text-lg" style={{ color: '#015fc4' }}>
                          {filteredDemandes.filter((d) => d.type === "materiel").length}
                        </div>
                        <div className="text-gray-600">Matériel</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-lg" style={{ color: '#7c3aed' }}>
                          {filteredDemandes.filter((d) => d.type === "outillage").length}
                        </div>
                        <div className="text-gray-600">Outillage</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-lg text-gray-700">
                          {filteredDemandes.reduce((total, d) => total + (d.items?.length || 0), 0)}
                        </div>
                        <div className="text-gray-600">Articles total</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-lg text-gray-700">
                          {new Set(filteredDemandes.map((d) => d.projetId)).size}
                        </div>
                        <div className="text-gray-600">Projets</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal des détails de la demande avec format professionnel */}
      <PurchaseRequestDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        demande={selectedRequest}
      />
    </>
  )
}

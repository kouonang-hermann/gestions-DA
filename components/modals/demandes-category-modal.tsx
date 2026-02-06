"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  Eye, 
  Edit,
  Trash2,
  Search, 
  Calendar, 
  Package, 
  Wrench, 
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Filter,
  X,
  ArrowUpDown
} from "lucide-react"
import type { Demande } from "@/types"
import DemandeDetailsModal from "@/components/modals/demande-details-modal"
import CreateDemandeModal from "@/components/demandes/create-demande-modal"
import EditDemandeModal from "@/components/admin/edit-demande-modal"
import { useStore } from "@/stores/useStore"
import { toast } from "sonner"

interface DemandesCategoryModalProps {
  isOpen: boolean
  onClose: () => void
  demandes: Demande[]
  title: string
  categoryType: "total" | "enCours" | "validees" | "brouillons" | "rejetees"
  currentUser: any
}

export default function DemandesCategoryModal({
  isOpen,
  onClose,
  demandes,
  title,
  categoryType,
  currentUser
}: DemandesCategoryModalProps) {
  const { deleteDemande, loadDemandes, users } = useStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterMonth, setFilterMonth] = useState<string>("")
  const [filterUser, setFilterUser] = useState<string>("")
  const [sortBy, setSortBy] = useState<"date" | "numero" | "statut" | "type">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null)
  const [demandeDetailsOpen, setDemandeDetailsOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [demandeToDelete, setDemandeToDelete] = useState<Demande | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [demandeToEdit, setDemandeToEdit] = useState<Demande | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filtrer et trier les demandes
  let filteredDemandes = demandes.filter(demande => 
    demande.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
    demande.projet?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    demande.technicien?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    demande.technicien?.prenom.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Appliquer le filtre par mois
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
  
  // Appliquer le filtre par utilisateur
  if (filterUser) {
    filteredDemandes = filteredDemandes.filter((d) => d.technicienId === filterUser)
  }

  // Appliquer le tri
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

  const getStatusColor = (status: string) => {
    const colors = {
      brouillon: { bg: "#f3f4f6", text: "#374151" },
      soumise: { bg: "#dbeafe", text: "#1e40af" },
      en_attente_validation_conducteur: { bg: "#fef3c7", text: "#92400e" },
      en_attente_validation_logistique: { bg: "#fef3c7", text: "#92400e" },
      en_attente_validation_responsable_travaux: { bg: "#fef3c7", text: "#92400e" },
      en_attente_validation_charge_affaire: { bg: "#fef3c7", text: "#92400e" },
      en_attente_preparation_appro: { bg: "#f3e8ff", text: "#7c3aed" },
      en_attente_validation_finale_demandeur: { bg: "#dcfce7", text: "#166534" },
      confirmee_demandeur: { bg: "#dcfce7", text: "#166534" },
      cloturee: { bg: "#dcfce7", text: "#166534" },
      rejetee: { bg: "#fecaca", text: "#dc2626" },
      archivee: { bg: "#f3f4f6", text: "#374151" },
    }
    return colors[status as keyof typeof colors] || { bg: "#f3f4f6", text: "#374151" }
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      brouillon: "Brouillon",
      soumise: "Soumise",
      en_attente_validation_conducteur: "En attente validation conducteur",
      en_attente_validation_logistique: "En attente validation logistique",
      en_attente_validation_responsable_travaux: "En attente validation responsable travaux",
      en_attente_validation_charge_affaire: "En attente validation chargé d'affaire",
      en_attente_preparation_appro: "En attente préparation appro",
      en_attente_validation_finale_demandeur: "Prêt à clôturer",
      confirmee_demandeur: "Confirmée",
      cloturee: "Clôturée",
      rejetee: "Rejetée",
      archivee: "Archivée",
    }
    return labels[status as keyof typeof labels] || status
  }

  const getTypeIcon = (type: string) => {
    return type === "materiel" ? <Package className="h-4 w-4" /> : <Wrench className="h-4 w-4" />
  }

  const getTypeColor = (type: string) => {
    return type === "materiel" 
      ? { bg: "#dbeafe", text: "#015fc4" }
      : { bg: "#f3e8ff", text: "#7c3aed" }
  }

  const handleViewDetails = (demande: Demande) => {
    // Si l'utilisateur peut modifier cette demande, ouvrir en mode édition
    // Sinon, ouvrir en mode lecture seule (détails)
    if (canModifyDemande(demande)) {
      setDemandeToEdit(demande)
      setEditModalOpen(true)
    } else {
      setSelectedDemande(demande)
      setDemandeDetailsOpen(true)
    }
  }

  const handleEditDemande = (demande: Demande) => {
    setDemandeToEdit(demande)
    setEditModalOpen(true)
  }

  const handleDeleteDemande = (demande: Demande) => {
    setDemandeToDelete(demande)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!demandeToDelete) return
    
    setIsDeleting(true)
    try {
      const success = await deleteDemande(demandeToDelete.id)
      
      if (success) {
        toast.success(`Demande ${demandeToDelete.numero} supprimée avec succès`)
        await loadDemandes()
        setDeleteConfirmOpen(false)
        setDemandeToDelete(null)
      } else {
        toast.error("Erreur lors de la suppression de la demande")
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression de la demande")
    } finally {
      setIsDeleting(false)
    }
  }

  // Fonction pour déterminer si une demande peut être modifiée/supprimée
  const canModifyDemande = (demande: Demande) => {
    // Superadmin peut modifier n'importe quelle demande
    if (currentUser?.role === "superadmin") {
      return true
    }
    
    // Le demandeur peut modifier ses propres demandes UNIQUEMENT avant la première validation
    // - Demande matériel : modifiable jusqu'à validation par le conducteur (inclus en_attente_validation_conducteur)
    // - Demande outillage : modifiable jusqu'à validation par le responsable logistique (inclus en_attente_validation_logistique)
    if (demande.technicienId === currentUser?.id) {
      const modifiableStatusesMateriel = [
        "brouillon", 
        "soumise", 
        "en_attente_validation_conducteur"
      ]
      const modifiableStatusesOutillage = [
        "brouillon", 
        "soumise", 
        "en_attente_validation_logistique"
      ]
      
      if (demande.type === "materiel" && modifiableStatusesMateriel.includes(demande.status)) {
        return true
      }
      if (demande.type === "outillage" && modifiableStatusesOutillage.includes(demande.status)) {
        return true
      }
    }
    
    // Les valideurs peuvent modifier les demandes qu'ils doivent valider
    // Conducteur peut modifier les demandes matériel en attente de sa validation
    if (currentUser?.role === "conducteur_travaux" && 
        demande.type === "materiel" && 
        demande.status === "en_attente_validation_conducteur") {
      return true
    }
    
    // Responsable logistique peut modifier les demandes outillage en attente de sa validation
    if (currentUser?.role === "responsable_logistique" && 
        demande.type === "outillage" && 
        demande.status === "en_attente_validation_logistique") {
      return true
    }
    
    // Responsable travaux peut modifier les demandes en attente de sa validation
    if (currentUser?.role === "responsable_travaux" && 
        demande.status === "en_attente_validation_responsable_travaux") {
      return true
    }
    
    // Chargé d'affaire peut modifier les demandes en attente de sa validation
    if (currentUser?.role === "charge_affaire" && 
        demande.status === "en_attente_validation_charge_affaire") {
      return true
    }
    
    return false
  }

  const canDeleteDemande = (demande: Demande) => {
    // Superadmin peut supprimer n'importe quelle demande
    if (currentUser?.role === "superadmin") {
      return true
    }
    
    // Le demandeur peut supprimer ses propres demandes UNIQUEMENT avant la première validation
    // - Demande matériel : supprimable jusqu'à validation par le conducteur (inclus en_attente_validation_conducteur)
    // - Demande outillage : supprimable jusqu'à validation par le responsable logistique (inclus en_attente_validation_logistique)
    if (demande.technicienId === currentUser?.id) {
      const deletableStatusesMateriel = [
        "brouillon", 
        "soumise", 
        "en_attente_validation_conducteur"
      ]
      const deletableStatusesOutillage = [
        "brouillon", 
        "soumise", 
        "en_attente_validation_logistique"
      ]
      
      if (demande.type === "materiel" && deletableStatusesMateriel.includes(demande.status)) {
        return true
      }
      if (demande.type === "outillage" && deletableStatusesOutillage.includes(demande.status)) {
        return true
      }
    }
    
    // Les valideurs peuvent supprimer les demandes qu'ils doivent valider
    // Conducteur peut supprimer les demandes matériel en attente de sa validation
    if (currentUser?.role === "conducteur_travaux" && 
        demande.type === "materiel" && 
        demande.status === "en_attente_validation_conducteur") {
      return true
    }
    
    // Responsable logistique peut supprimer les demandes outillage en attente de sa validation
    if (currentUser?.role === "responsable_logistique" && 
        demande.type === "outillage" && 
        demande.status === "en_attente_validation_logistique") {
      return true
    }
    
    // Responsable travaux peut supprimer les demandes en attente de sa validation
    if (currentUser?.role === "responsable_travaux" && 
        demande.status === "en_attente_validation_responsable_travaux") {
      return true
    }
    
    // Chargé d'affaire peut supprimer les demandes en attente de sa validation
    if (currentUser?.role === "charge_affaire" && 
        demande.status === "en_attente_validation_charge_affaire") {
      return true
    }
    
    return false
  }

  const getCategoryIcon = () => {
    switch (categoryType) {
      case "total":
        return <FileText className="h-5 w-5" style={{ color: '#015fc4' }} />
      case "enCours":
        return <Clock className="h-5 w-5" style={{ color: '#f97316' }} />
      case "validees":
        return <CheckCircle className="h-5 w-5" style={{ color: '#22c55e' }} />
      case "brouillons":
        return <AlertCircle className="h-5 w-5" style={{ color: '#6b7280' }} />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto p-3 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2 text-base sm:text-xl">
              {getCategoryIcon()}
              <span className="truncate">{title}</span>
              <Badge variant="outline" className="ml-0 sm:ml-2 text-xs">
                {filteredDemandes.length} demande{filteredDemandes.length > 1 ? 's' : ''}
              </Badge>
            </DialogTitle>
          </DialogHeader>

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
                        .filter(u => demandes.some(d => d.technicienId === u.id))
                        .sort((a, b) => `${a.prenom} ${a.nom}`.localeCompare(`${b.prenom} ${b.nom}`))
                        .map(user => (
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
                          {searchTerm ? "Aucune demande trouvée pour cette recherche" : "Aucune demande dans cette catégorie"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDemandes.map((demande) => {
                        const statusColor = getStatusColor(demande.status)
                        const typeColor = getTypeColor(demande.type)
                        
                        return (
                          <TableRow 
                            key={demande.id} 
                            className="hover:bg-gray-50 cursor-pointer"
                            onDoubleClick={() => {
                              // Permettre la modification par double-clic si l'utilisateur peut modifier cette demande
                              if (canModifyDemande(demande)) {
                                handleEditDemande(demande)
                              }
                            }}
                            title={canModifyDemande(demande) ? "Double-cliquez pour modifier" : ""}
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {getTypeIcon(demande.type)}
                                {demande.numero}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                className="text-xs font-medium px-2 py-1"
                                style={{
                                  backgroundColor: typeColor.bg,
                                  color: typeColor.text,
                                  border: `1px solid ${typeColor.text}20`
                                }}
                              >
                                {demande.type === "materiel" ? "Matériel" : "Outillage"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-[150px] truncate" title={demande.projet?.nom}>
                                {demande.projet?.nom || "N/A"}
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <div className="text-sm">
                                {demande.technicien?.prenom} {demande.technicien?.nom}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                className="text-xs font-medium px-2 py-1"
                                style={{
                                  backgroundColor: statusColor.bg,
                                  color: statusColor.text,
                                  border: `1px solid ${statusColor.text}20`
                                }}
                              >
                                {getStatusLabel(demande.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(demande.dateCreation).toLocaleDateString('fr-FR')}
                              </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <div className="text-sm text-gray-600">
                                {demande.items?.length || 0} article{(demande.items?.length || 0) > 1 ? 's' : ''}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {/* Bouton Voir */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewDetails(demande)}
                                  className="flex items-center justify-center w-8 h-8 p-0 hover:bg-blue-50 hover:border-blue-200"
                                  title="Voir les détails"
                                >
                                  <Eye className="h-4 w-4 text-blue-600" />
                                </Button>

                                {/* Bouton Modifier */}
                                {canModifyDemande(demande) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditDemande(demande)}
                                    className="flex items-center justify-center w-8 h-8 p-0 hover:bg-orange-50 hover:border-orange-200"
                                    title="Modifier la demande"
                                  >
                                    <Edit className="h-4 w-4 text-orange-600" />
                                  </Button>
                                )}

                                {/* Bouton Supprimer */}
                                {canDeleteDemande(demande) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteDemande(demande)}
                                    className="flex items-center justify-center w-8 h-8 p-0 hover:bg-red-50 hover:border-red-200"
                                    title="Supprimer la demande"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                )}
                              </div>
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
                        {filteredDemandes.filter(d => d.type === "materiel").length}
                      </div>
                      <div className="text-gray-600">Matériel</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-lg" style={{ color: '#7c3aed' }}>
                        {filteredDemandes.filter(d => d.type === "outillage").length}
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
                        {new Set(filteredDemandes.map(d => d.projetId)).size}
                      </div>
                      <div className="text-gray-600">Projets</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de détails de demande */}
      <DemandeDetailsModal
        isOpen={demandeDetailsOpen}
        onClose={() => {
          setDemandeDetailsOpen(false)
          setSelectedDemande(null)
        }}
        demandeId={selectedDemande?.id || null}
        mode="view"
      />

      {/* Modal de modification de demande */}
      <CreateDemandeModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setDemandeToEdit(null)
          loadDemandes()
        }}
        type={demandeToEdit?.type}
        existingDemande={demandeToEdit}
      />

      {/* Modal de confirmation de suppression */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Confirmer la suppression
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-gray-700">
              Êtes-vous sûr de vouloir supprimer la demande{" "}
              <span className="font-semibold text-gray-900">
                {demandeToDelete?.numero}
              </span>{" "}
              ?
            </p>
            
            {demandeToDelete && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {getTypeIcon(demandeToDelete.type)}
                  <span className="font-medium">
                    {demandeToDelete.type === "materiel" ? "Matériel" : "Outillage"}
                  </span>
                  <span>•</span>
                  <span>{demandeToDelete.projet?.nom}</span>
                  <span>•</span>
                  <span>{demandeToDelete.items?.length || 0} article(s)</span>
                </div>
              </div>
            )}
            
            <p className="text-sm text-red-600">
              ⚠️ Cette action est irréversible.
            </p>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteConfirmOpen(false)
                  setDemandeToDelete(null)
                }}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modale d'édition pour le super admin */}
      <EditDemandeModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false)
          setDemandeToEdit(null)
        }}
        demande={demandeToEdit}
      />
    </>
  )
}

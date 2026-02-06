"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useStore } from "@/stores/useStore"
import { CheckCircle, XCircle, Eye, Package, Edit, Trash2, Filter, ChevronLeft, ChevronRight, ArrowUpDown, X } from "lucide-react"
import type { Demande, DemandeType } from "@/types"
import DemandeDetailsModal from "@/components/modals/demande-details-modal"
import CreateDemandeModal from "@/components/demandes/create-demande-modal"

interface ValidationDemandesListProps {
  type?: DemandeType // Optionnel pour afficher les deux types
  title: string
}

export default function ValidationDemandesList({ type, title }: ValidationDemandesListProps) {
  const { currentUser, demandes, loadDemandes, executeAction, isLoading, error, projets, users } = useStore()
  const [demandesAValider, setDemandesAValider] = useState<Demande[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [demandeToEdit, setDemandeToEdit] = useState<Demande | null>(null)
  
  // États pour filtres, tri et pagination
  const [filterMonth, setFilterMonth] = useState<string>("")
  const [filterUser, setFilterUser] = useState<string>("")
  const [sortBy, setSortBy] = useState<"date" | "numero" | "statut" | "type">("date")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // OPTIMISÉ: Ne charger que si les demandes ne sont pas déjà en cache
  // Le parent dashboard charge déjà les données, éviter les appels redondants
  useEffect(() => {
    if (currentUser && demandes.length === 0) {
      if (type) {
        loadDemandes({ type })
      } else {
        loadDemandes()
      }
    }
  }, [currentUser?.id, type, demandes.length]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (currentUser) {
      let statusToFilter = ""
      
      // Déterminer le statut à filtrer selon le rôle
      if (currentUser.role === "conducteur_travaux") {
        statusToFilter = "en_attente_validation_conducteur"
      } else if (currentUser.role === "responsable_travaux") {
        statusToFilter = "en_attente_validation_responsable_travaux"
      } else if (currentUser.role === "responsable_logistique") {
        statusToFilter = "en_attente_validation_logistique"
      } else if (currentUser.role === "charge_affaire") {
        statusToFilter = "en_attente_validation_charge_affaire"
      } else if (currentUser.role === "responsable_livreur") {
        statusToFilter = "en_attente_validation_livreur"
      } else if (currentUser.role === "superadmin") {
        // Super admin peut valider n'importe quelle demande en attente
        statusToFilter = "all_pending"
      }
      
      let filtered = currentUser.role === "superadmin"
        ? demandes.filter(
            (d) => (type ? d.type === type : true) && 
                   ![
                     "brouillon", 
                     "cloturee", 
                     "rejetee", 
                     "archivee"
                   ].includes(d.status)
          )
        : demandes.filter(
            (d) => (type ? d.type === type : true) && 
                   d.status === statusToFilter &&
                   // Filtrer par projet si l'utilisateur a des projets assignés
                   (!currentUser.projets || currentUser.projets.length === 0 || currentUser.projets.includes(d.projetId))
          )
      
      // Appliquer le filtre par mois
      if (filterMonth) {
        filtered = filtered.filter((d) => {
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
        filtered = filtered.filter((d) => d.technicienId === filterUser)
      }
      
      // Appliquer le tri
      filtered.sort((a, b) => {
        let comparison = 0
        
        switch (sortBy) {
          case "date":
            comparison = new Date(a.dateCreation).getTime() - new Date(b.dateCreation).getTime()
            break
          case "numero":
            comparison = a.numero.localeCompare(b.numero)
            break
          case "statut":
            comparison = getStatusLabel(a.status).localeCompare(getStatusLabel(b.status))
            break
          case "type":
            comparison = a.type.localeCompare(b.type)
            break
        }
        
        return sortOrder === "asc" ? comparison : -comparison
      })
      
      setDemandesAValider(filtered)
      setCurrentPage(1) // Réinitialiser à la première page lors d'un changement de filtre
    }
  }, [currentUser, demandes, type, filterMonth, filterUser, sortBy, sortOrder, projets, users])

  const handleValidation = async (demandeId: string, action: "valider" | "rejeter") => {
    setActionLoading(demandeId)

    try {
      const commentaire =
        action === "rejeter" ? prompt("Motif du rejet (obligatoire):") : prompt("Commentaire (optionnel):")

      if (action === "rejeter" && !commentaire) {
        alert("Le motif du rejet est obligatoire")
        setActionLoading(null)
        return
      }

      const apiAction = action === "valider" ? "valider" : "rejeter"

      const success = await executeAction(demandeId, apiAction, { commentaire })
      if (success) {
        // Recharger les demandes
        await loadDemandes({ type })
        // Fermer le modal si ouvert
        setDetailsModalOpen(false)
        setSelectedDemande(null)
      } else {
        alert(error || "Erreur lors de l'action")
      }
    } catch (err) {
      alert("Erreur lors de l'action")
    } finally {
      setActionLoading(null)
    }
  }

  const handleViewDetails = (demande: Demande) => {
    setSelectedDemande(demande)
    setDetailsModalOpen(true)
  }

  const handleModalValidation = async (action: "valider" | "rejeter" | "annuler" | "valider_sortie" | "cloturer", quantites?: { [itemId: string]: number }, commentaire?: string) => {
    if (!selectedDemande) return
    
    setActionLoading(selectedDemande.id)
    
    try {
      // Pour ce composant, on traite "valider_sortie" et "cloturer" comme "valider"
      // L'action "annuler" n'est pas applicable ici (réservée au demandeur)
      const normalizedAction = (action === "valider_sortie" || action === "cloturer") ? "valider" : action

      if (normalizedAction !== "annuler") {
        await executeAction(selectedDemande.id, normalizedAction, { quantites, commentaire })
        setDetailsModalOpen(false)
        setSelectedDemande(null)
      }
    } catch (error) {
    } finally {
      setActionLoading(null)
    }
  }

  const handleItemRemoved = () => {
    // Recharger les demandes après suppression d'un article
    if (type) {
      loadDemandes({ type })
    } else {
      loadDemandes()
    }
    setDetailsModalOpen(false)
    setSelectedDemande(null)
  }

  // Vérifier si l'utilisateur peut supprimer des articles
  const canRemoveItems = () => {
    if (!currentUser) return false
    return ["conducteur_travaux", "responsable_travaux", "charge_affaire"].includes(currentUser.role)
  }

  // Fonction pour modifier une demande
  const handleModifier = (demande: Demande) => {
    setDemandeToEdit(demande)
    setEditModalOpen(true)
  }

  // Fonction pour supprimer une demande
  const handleSupprimer = async (demande: Demande) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la demande ${demande.numero} ?`)) {
      try {
        const { deleteDemande } = useStore.getState()
        await deleteDemande(demande.id)
        alert("Demande supprimée avec succès")
        // Recharger les demandes
        if (type) {
          loadDemandes({ type })
        } else {
          loadDemandes()
        }
      } catch (error) {
        alert("Erreur lors de la suppression de la demande")
      }
    }
  }

  // Fonction pour obtenir le label du statut en français
  const getStatusLabel = (status: string): string => {
    const statusLabels: Record<string, string> = {
      "soumise": "Soumise",
      "en_attente_validation_conducteur": "Attente validation conducteur",
      "en_attente_validation_logistique": "Attente validation logistique",
      "en_attente_validation_responsable_travaux": "Attente validation resp. travaux",
      "en_attente_validation_charge_affaire": "Attente validation chargé d'affaire",
      "en_attente_preparation_appro": "Attente préparation appro",
      "en_attente_reception_livreur": "Attente réception livreur",
      "en_attente_livraison": "Attente livraison",
      "en_attente_validation_finale_demandeur": "Attente validation finale",
      "en_attente_preparation_logistique": "Attente préparation logistique",
      "cloturee": "Clôturée",
      "rejetee": "Rejetée",
      "brouillon": "Brouillon",
      "archivee": "Archivée"
    }
    return statusLabels[status] || status
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Calculer la pagination
  const totalPages = Math.ceil(demandesAValider.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedDemandes = demandesAValider.slice(startIndex, startIndex + itemsPerPage)
  
  const handleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(newSortBy)
      setSortOrder("desc")
    }
  }

  return (
    <Card className="bg-gray-50 border-gray-200">
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <CardTitle className="text-gray-800">{title}</CardTitle>
          <div className="text-sm text-gray-600">
            {demandesAValider.length} demande{demandesAValider.length > 1 ? "s" : ""}
          </div>
        </div>
        
        {/* Filtres et options de tri */}
        <div className="mt-4 space-y-3">
          {/* Filtres */}
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
            
            {/* Filtre par utilisateur */}
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
                    ))
                  }
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
          
          {/* Options de tri */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={sortBy === "date" ? "default" : "outline"}
              size="sm"
              onClick={() => handleSort("date")}
              className="text-xs"
            >
              <ArrowUpDown className="h-3 w-3 mr-1" />
              Date {sortBy === "date" && (sortOrder === "asc" ? "↑" : "↓")}
            </Button>
            <Button
              variant={sortBy === "numero" ? "default" : "outline"}
              size="sm"
              onClick={() => handleSort("numero")}
              className="text-xs"
            >
              <ArrowUpDown className="h-3 w-3 mr-1" />
              Numéro {sortBy === "numero" && (sortOrder === "asc" ? "↑" : "↓")}
            </Button>
            <Button
              variant={sortBy === "statut" ? "default" : "outline"}
              size="sm"
              onClick={() => handleSort("statut")}
              className="text-xs"
            >
              <ArrowUpDown className="h-3 w-3 mr-1" />
              Statut {sortBy === "statut" && (sortOrder === "asc" ? "↑" : "↓")}
            </Button>
            <Button
              variant={sortBy === "type" ? "default" : "outline"}
              size="sm"
              onClick={() => handleSort("type")}
              className="text-xs"
            >
              <ArrowUpDown className="h-3 w-3 mr-1" />
              Type {sortBy === "type" && (sortOrder === "asc" ? "↑" : "↓")}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {demandesAValider.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Aucune demande en attente de validation</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {paginatedDemandes.map((demande) => (
              <div
                key={demande.id}
                className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-medium text-gray-800 text-sm sm:text-base">{demande.numero}</h3>
                      <Badge className="bg-blue-500 text-white text-xs whitespace-normal break-words max-w-full">
                        {getStatusLabel(demande.status)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {demande.type === "materiel" ? "Matériel" : "Outillage"}
                      </Badge>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">
                      {demande.items.length} article{demande.items.length > 1 ? "s" : ""} • Créée le{" "}
                      {demande.dateCreation ? new Date(demande.dateCreation).toLocaleDateString() : "—"}
                    </p>
                    {demande.commentaires && (
                      <p className="text-xs sm:text-sm text-blue-600 bg-blue-50 p-2 rounded truncate">
                        <strong>Commentaire:</strong> {demande.commentaires}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleModifier(demande)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 flex-1 sm:flex-none"
                      title="Modifier la demande"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleSupprimer(demande)}
                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 flex-1 sm:flex-none"
                      title="Supprimer la demande"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleValidation(demande.id, "valider")}
                      disabled={actionLoading === demande.id}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 flex-1 sm:flex-none"
                    >
                      {actionLoading === demande.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                      ) : (
                        <CheckCircle className="h-4 w-4 sm:mr-2" />
                      )}
                      <span className="hidden sm:inline">Valider</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleValidation(demande.id, "rejeter")}
                      disabled={actionLoading === demande.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-1 sm:flex-none"
                    >
                      {actionLoading === demande.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <XCircle className="h-4 w-4 sm:mr-2" />
                      )}
                      <span className="hidden sm:inline">Rejeter</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewDetails(demande)}
                      className="text-gray-600 hover:text-gray-700 hover:bg-gray-50 flex-1 sm:flex-none"
                      title="Voir les détails"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              ))}
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  Page {currentPage} sur {totalPages} ({demandesAValider.length} demande{demandesAValider.length > 1 ? "s" : ""})
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Modal de détails */}
      <DemandeDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false)
          setSelectedDemande(null)
        }}
        demandeId={selectedDemande?.id || null}
        mode="view"
        canValidate={true}
        onValidate={(demandeId) => handleValidation(demandeId, "valider")}
      />
      
      {/* Modale d'édition */}
      {demandeToEdit && (
        <CreateDemandeModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false)
            setDemandeToEdit(null)
          }}
          type={demandeToEdit.type}
          existingDemande={demandeToEdit}
        />
      )}
    </Card>
  )
}

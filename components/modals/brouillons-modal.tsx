"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { 
  Edit,
  Trash2,
  Send,
  Search, 
  Calendar, 
  Package, 
  Wrench,
  AlertCircle,
  FileText
} from "lucide-react"
import type { Demande } from "@/types"
import DemandeFormModal from "@/components/demandes/demande-form-modal"
import { useStore } from "@/stores/useStore"

interface BrouillonsModalProps {
  isOpen: boolean
  onClose: () => void
  demandes: Demande[]
  currentUser: any
}

export default function BrouillonsModal({
  isOpen,
  onClose,
  demandes,
  currentUser
}: BrouillonsModalProps) {
  const { loadDemandes } = useStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [demandeToEdit, setDemandeToEdit] = useState<Demande | null>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [demandeToDelete, setDemandeToDelete] = useState<Demande | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null)

  // Filtrer les demandes selon le terme de recherche
  const filteredDemandes = demandes.filter(demande => 
    demande.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
    demande.projet?.nom.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getTypeIcon = (type: string) => {
    return type === "materiel" ? <Package className="h-4 w-4" /> : <Wrench className="h-4 w-4" />
  }

  const getTypeColor = (type: string) => {
    return type === "materiel" 
      ? { bg: "#dbeafe", text: "#015fc4" }
      : { bg: "#f3e8ff", text: "#7c3aed" }
  }

  const handleEditDemande = (e: React.MouseEvent, demande: Demande) => {
    e.stopPropagation()
    setDemandeToEdit(demande)
    setEditModalOpen(true)
  }

  const handleEditClose = async () => {
    setEditModalOpen(false)
    setDemandeToEdit(null)
    await loadDemandes()
  }

  const handleDeleteDemande = (e: React.MouseEvent, demande: Demande) => {
    e.stopPropagation()
    setDemandeToDelete(demande)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!demandeToDelete) return
    
    setIsDeleting(true)
    try {
      
      const response = await fetch(`/api/demandes/${demandeToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (result.success) {
        await loadDemandes()
        setDeleteConfirmOpen(false)
        setDemandeToDelete(null)
      } else {
        alert(result.error || 'Erreur lors de la suppression du brouillon')
      }
    } catch (error) {
      alert('Erreur lors de la suppression du brouillon')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSubmitDemande = async (e: React.MouseEvent, demande: Demande) => {
    e.stopPropagation()
    setIsSubmitting(demande.id)
    try {
      
      const response = await fetch(`/api/demandes/${demande.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (result.success) {
        alert(`✅ Brouillon soumis avec succès!\nNouveau numéro: ${result.data.numero}`)
        await loadDemandes()
      } else {
        alert(result.error || 'Erreur lors de la soumission du brouillon')
      }
    } catch (error) {
      alert('Erreur lors de la soumission du brouillon')
    } finally {
      setIsSubmitting(null)
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto p-3 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2 text-base sm:text-xl">
              <FileText className="h-5 w-5" style={{ color: '#6b7280' }} />
              <span className="truncate">Mes brouillons</span>
              <Badge variant="outline" className="ml-0 sm:ml-2 text-xs">
                {filteredDemandes.length} brouillon{filteredDemandes.length > 1 ? 's' : ''}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Barre de recherche */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un brouillon..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
            </div>

            {/* Message d'information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Vos brouillons en cours d'édition</p>
                  <p className="text-xs">
                    Ces demandes ont été sauvegardées mais pas encore soumises. 
                    Vous pouvez les modifier, les supprimer ou les envoyer pour validation.
                  </p>
                </div>
              </div>
            </div>

            {/* Tableau des brouillons */}
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-[50vh] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-gray-50 z-10">
                    <TableRow>
                      <TableHead>Numéro</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Projet</TableHead>
                      <TableHead className="hidden md:table-cell">Date création</TableHead>
                      <TableHead className="hidden lg:table-cell">Articles</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDemandes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                          {searchTerm ? "Aucun brouillon trouvé pour cette recherche" : "Aucun brouillon en cours"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDemandes.map((demande) => {
                        const typeColor = getTypeColor(demande.type)
                        
                        return (
                          <TableRow key={demande.id} className="hover:bg-gray-50">
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
                                {/* Bouton Modifier */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => handleEditDemande(e, demande)}
                                  className="flex items-center justify-center w-8 h-8 p-0 hover:bg-orange-50 hover:border-orange-200 cursor-pointer"
                                  title="Modifier le brouillon"
                                >
                                  <Edit className="h-4 w-4 text-orange-600" />
                                </Button>

                                {/* Bouton Supprimer */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => handleDeleteDemande(e, demande)}
                                  className="flex items-center justify-center w-8 h-8 p-0 hover:bg-red-50 hover:border-red-200 cursor-pointer"
                                  title="Supprimer le brouillon"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>

                                {/* Bouton Envoyer */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => handleSubmitDemande(e, demande)}
                                  disabled={isSubmitting === demande.id}
                                  className="flex items-center justify-center w-8 h-8 p-0 hover:bg-green-50 hover:border-green-200 cursor-pointer disabled:cursor-not-allowed"
                                  title="Envoyer la demande"
                                >
                                  {isSubmitting === demande.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                                  ) : (
                                    <Send className="h-4 w-4 text-green-600" />
                                  )}
                                </Button>
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
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal d'édition de brouillon */}
      <DemandeFormModal
        isOpen={editModalOpen}
        onClose={handleEditClose}
        demande={demandeToEdit}
        mode="edit"
        type={demandeToEdit?.type}
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
              Êtes-vous sûr de vouloir supprimer le brouillon{" "}
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
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                {isDeleting ? 'Suppression...' : 'Supprimer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Eye, Edit, Trash2, CheckCircle } from "lucide-react"
import { useStore } from "@/stores/useStore"
import DemandeDetailModal from "@/components/demandes/demande-detail-modal"
import CreateDemandeModal from "@/components/demandes/create-demande-modal"

interface UserDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  data: any[]
  type: "total" | "enCours" | "validees" | "rejetees" | "brouillons" | "enAttente" | "aPreparer" | "preparees" | "livrees" | "aValider"
}

export default function UserDetailsModal({ isOpen, onClose, title, data, type }: UserDetailsModalProps) {
  const { executeAction, loadDemandes, projets, users, deleteDemande } = useStore()
  
  // Fonctions helper pour résoudre les noms à partir des IDs
  // Utilise les relations embarquées en priorité, puis le store, puis tronque l'ID
  const getProjetNom = (item: any) => {
    // 1. Utiliser la relation embarquée si disponible
    if (item.projet?.nom) return item.projet.nom
    // 2. Chercher dans le store
    if (item.projetId) {
      const projet = projets.find(p => p.id === item.projetId)
      if (projet?.nom) return projet.nom
      // 3. Tronquer l'ID
      return item.projetId.length > 15 ? `${item.projetId.substring(0, 8)}...` : item.projetId
    }
    return "Non spécifié"
  }
  
  const getDemandeurNom = (item: any) => {
    // 1. Utiliser la relation embarquée si disponible
    if (item.technicien?.prenom && item.technicien?.nom) {
      return `${item.technicien.prenom} ${item.technicien.nom}`
    }
    // 2. Chercher dans le store
    if (item.technicienId) {
      const user = users.find(u => u.id === item.technicienId)
      if (user) return `${user.prenom} ${user.nom}`
      // 3. Tronquer l'ID
      return item.technicienId.length > 15 ? `${item.technicienId.substring(0, 8)}...` : item.technicienId
    }
    return "Non spécifié"
  }
  const [clotureLoading, setClotureLoading] = useState<string | null>(null)
  const [commentaires, setCommentaires] = useState<{ [key: string]: string }>({})
  const [showCommentaire, setShowCommentaire] = useState<{ [key: string]: boolean }>({})
  const [selectedDemande, setSelectedDemande] = useState<any>(null)
  const [demandeDetailsOpen, setDemandeDetailsOpen] = useState(false)
  const [editDemandeOpen, setEditDemandeOpen] = useState(false)
  const [demandeToEdit, setDemandeToEdit] = useState<any>(null)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "brouillon":
        return "bg-gray-500"
      case "soumise":
        return "bg-blue-500"
      case "en_attente_validation_conducteur":
      case "en_attente_validation_logistique":
      case "en_attente_validation_responsable_travaux":
      case "en_attente_validation_charge_affaire":
        return "bg-orange-500"
      case "en_attente_preparation_appro":
      case "en_attente_validation_logistique":
        return "bg-purple-500"
      case "en_attente_validation_finale_demandeur":
        return "bg-emerald-500"
      case "confirmee_demandeur":
        return "bg-green-500"
      case "cloturee":
        return "bg-green-600"
      case "rejetee":
        return "bg-red-500"
      case "archivee":
        return "bg-gray-600"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "brouillon":
        return "Brouillon"
      case "soumise":
        return "Soumise"
      case "en_attente_validation_conducteur":
        return "En attente validation conducteur"
      case "en_attente_validation_logistique":
        return "En attente validation logistique"
      case "en_attente_validation_responsable_travaux":
        return "En attente validation responsable travaux"
      case "en_attente_validation_charge_affaire":
        return "En attente validation chargé d'affaire"
      case "en_attente_preparation_appro":
        return "En attente préparation appro"
      case "en_attente_validation_logistique":
        return "En attente validation logistique"
      case "en_attente_validation_finale_demandeur":
        return "Prêt à clôturer"
      case "confirmee_demandeur":
        return "Confirmée"
      case "cloturee":
        return "Clôturée"
      case "rejetee":
        return "Rejetée"
      case "archivee":
        return "Archivée"
      default:
        return status
    }
  }

  // CORRECTION: Faire confiance aux données déjà filtrées par le dashboard
  // Le re-filtrage causait des problèmes car chaque dashboard a sa propre logique
  const filteredData = data

  const handleCloture = async (demandeId: string) => {
    setClotureLoading(demandeId)
    try {
      const commentaire = commentaires[demandeId]?.trim() || "Demande clôturée par le demandeur"
      
      // Utiliser "cloturer" au lieu de "validation_finale_demandeur" pour supporter tous les rôles
      const success = await executeAction(demandeId, "cloturer", { 
        commentaire 
      })
      
      if (success) {
        alert("Demande clôturée avec succès !")
        await loadDemandes()
        // Réinitialiser les états
        setCommentaires(prev => ({ ...prev, [demandeId]: "" }))
        setShowCommentaire(prev => ({ ...prev, [demandeId]: false }))
      } else {
        alert("Erreur lors de la clôture de la demande")
      }
    } catch (error) {
      console.error("Erreur lors de la clôture:", error)
      alert("Erreur lors de la clôture de la demande")
    } finally {
      setClotureLoading(null)
    }
  }

  const handleRenvoyer = async (demandeId: string) => {
    setClotureLoading(demandeId)
    try {
      const success = await executeAction(demandeId, "renvoyer", {})
      
      if (success) {
        alert("Demande renvoyée avec succès ! Elle est maintenant en attente de validation.")
        await loadDemandes()
        onClose()
      } else {
        alert("Erreur lors du renvoi de la demande")
      }
    } catch (error) {
      console.error("Erreur lors du renvoi:", error)
      alert("Erreur lors du renvoi de la demande")
    } finally {
      setClotureLoading(null)
    }
  }

  const handleModifier = (demande: any) => {
    // Ouvrir la modale de création en mode édition pour toutes les demandes
    setDemandeToEdit(demande)
    setEditDemandeOpen(true)
  }

  const handleSupprimer = async (demande: any) => {
    // Demander confirmation avant de supprimer
    const confirmation = confirm(
      `Êtes-vous sûr de vouloir supprimer la demande ${demande.numero} ?\n\nCette action est irréversible.`
    )
    
    if (!confirmation) return
    
    try {
      const success = await deleteDemande(demande.id)
      
      if (success) {
        alert(`Demande ${demande.numero} supprimée avec succès`)
        await loadDemandes()
        // Si c'était la dernière demande, fermer la modale
        if (data.length <= 1) {
          onClose()
        }
      } else {
        alert("Erreur lors de la suppression de la demande")
      }
    } catch (error) {
      console.error("Erreur suppression:", error)
      alert("Erreur lors de la suppression de la demande")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">{title} ({filteredData.length})</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-5 overflow-y-auto" style={{maxHeight: 'calc(85vh - 120px)'}}>
          {filteredData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Aucun élément trouvé</p>
            </div>
          ) : (
            filteredData.map((item) => (
              <div
                key={item.id}
                className="bg-white p-4 rounded-lg border-2 border-gray-300 hover:border-blue-400 hover:shadow-lg transition-all"
                style={{overflow: 'hidden', maxWidth: '100%'}}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4" style={{maxWidth: '100%'}}>
                  <div className="flex-1" style={{minWidth: 0, maxWidth: '100%', overflow: 'hidden'}}>
                    {/* En-tête avec numéro et badges */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <h3 className="font-semibold text-gray-900 text-base">{item.numero}</h3>
                      <Badge className={`${getStatusColor(item.status)} text-white text-xs`}>
                        {getStatusLabel(item.status)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {item.type === "materiel" ? "Matériel" : "Outillage"}
                      </Badge>
                    </div>
                    
                    {/* Informations principales */}
                    <table className="text-sm mb-3" style={{width: '100%', tableLayout: 'fixed'}}>
                      <tbody>
                        <tr>
                          <td className="font-medium text-gray-500 pr-3 py-1 whitespace-nowrap align-top" style={{width: '96px'}}>Projet:</td>
                          <td className="text-gray-900 py-1" style={{wordBreak: 'break-all', overflow: 'hidden'}}>{getProjetNom(item)}</td>
                        </tr>
                        <tr>
                          <td className="font-medium text-gray-500 pr-3 py-1 whitespace-nowrap align-top" style={{width: '96px'}}>Demandeur:</td>
                          <td className="text-gray-900 py-1" style={{wordBreak: 'break-all', overflow: 'hidden'}}>{getDemandeurNom(item)}</td>
                        </tr>
                        <tr>
                          <td className="font-medium text-gray-500 pr-3 py-1 whitespace-nowrap align-top" style={{width: '96px'}}>Date:</td>
                          <td className="text-gray-900 py-1">{new Date(item.dateCreation).toLocaleDateString()}</td>
                        </tr>
                      </tbody>
                    </table>
                    {item.commentaires && (
                      <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded break-words">
                        <strong>Commentaires:</strong> {item.commentaires}
                      </p>
                    )}
                    {item.dateLivraisonSouhaitee && (
                      <p className="text-sm text-green-600">
                        <strong>Livraison souhaitée:</strong> {new Date(item.dateLivraisonSouhaitee).toLocaleDateString()}
                      </p>
                    )}
                    {item.rejetMotif && (
                      <p className="text-sm text-red-600 bg-red-50 p-2 rounded mt-2 break-words">
                        <strong>Motif du rejet:</strong> {item.rejetMotif}
                      </p>
                    )}
                    
                    {/* NOUVEAU: Section pour renvoyer une demande rejetée */}
                    {item.status === "rejetee" && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                        <p className="text-sm text-red-800 font-medium mb-2">
                          ❌ Demande rejetée - Vous pouvez la modifier et la renvoyer
                        </p>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleModifier(item)}
                            variant="outline"
                            size="sm"
                            className="text-blue-600 hover:text-blue-700 border-blue-300 text-xs"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Modifier
                          </Button>
                          <Button
                            onClick={() => handleRenvoyer(item.id)}
                            disabled={clotureLoading === item.id}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-xs"
                            size="sm"
                          >
                            {clotureLoading === item.id ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                            ) : null}
                            Renvoyer la demande
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* NOUVEAU: Section de clôture pour les demandes prêtes */}
                    {item.status === "en_attente_validation_finale_demandeur" && (
                      <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded">
                        <p className="text-sm text-emerald-800 font-medium mb-2">
                          ✅ Demande prête à clôturer
                        </p>
                        
                        {showCommentaire[item.id] && (
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Commentaire de clôture (optionnel)
                            </label>
                            <Textarea
                              value={commentaires[item.id] || ""}
                              onChange={(e) => setCommentaires(prev => ({ ...prev, [item.id]: e.target.value }))}
                              placeholder="Ajoutez un commentaire sur la réception..."
                              className="min-h-[60px] text-sm"
                            />
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          {!showCommentaire[item.id] ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowCommentaire(prev => ({ ...prev, [item.id]: true }))}
                                className="text-gray-600 hover:text-gray-700 text-xs"
                              >
                                Ajouter commentaire
                              </Button>
                              <Button
                                onClick={() => handleCloture(item.id)}
                                disabled={clotureLoading === item.id}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                                size="sm"
                              >
                                {clotureLoading === item.id ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                ) : (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                )}
                                Clôturer
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setShowCommentaire(prev => ({ ...prev, [item.id]: false }))
                                  setCommentaires(prev => ({ ...prev, [item.id]: "" }))
                                }}
                                disabled={clotureLoading === item.id}
                                className="text-xs"
                              >
                                Annuler
                              </Button>
                              <Button
                                onClick={() => handleCloture(item.id)}
                                disabled={clotureLoading === item.id}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                                size="sm"
                              >
                                {clotureLoading === item.id ? (
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                                ) : (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                )}
                                Clôturer avec commentaire
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-blue-600 hover:text-blue-700"
                      onClick={() => {
                        setSelectedDemande(item)
                        setDemandeDetailsOpen(true)
                      }}
                      title="Voir les détails"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {/* Boutons de modification et suppression disponibles pour toutes les demandes */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-green-600 hover:text-green-700"
                      onClick={() => handleModifier(item)}
                      title="Modifier la demande"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleSupprimer(item)}
                      title="Supprimer la demande"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bouton de fermeture */}
        <div className="flex justify-center pt-4 border-t mt-4">
          <Button variant="outline" onClick={onClose} className="min-w-[120px]">
            Fermer
          </Button>
        </div>
      </DialogContent>
      
      {/* Modale de modification de la demande */}
      {selectedDemande && (
        <DemandeDetailModal
          isOpen={demandeDetailsOpen}
          onClose={() => {
            setDemandeDetailsOpen(false)
            setSelectedDemande(null)
          }}
          demandeId={selectedDemande.id}
          mode="view"
        />
      )}
      
      {/* Modale d'édition */}
      {demandeToEdit && (
        <CreateDemandeModal
          isOpen={editDemandeOpen}
          onClose={() => {
            setEditDemandeOpen(false)
            setDemandeToEdit(null)
            // Ne pas fermer la modale parente pour permettre de voir les changements
          }}
          type={demandeToEdit.type}
          existingDemande={demandeToEdit}
        />
      )}
    </Dialog>
  )
}

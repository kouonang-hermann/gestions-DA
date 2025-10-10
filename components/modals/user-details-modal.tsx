"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Eye, Edit, Trash2, CheckCircle } from "lucide-react"
import { useStore } from "@/stores/useStore"

interface UserDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  data: any[]
  type: "total" | "enCours" | "validees" | "rejetees" | "brouillons" | "enAttente" | "aPreparer" | "preparees" | "livrees" | "aValider"
}

export default function UserDetailsModal({ isOpen, onClose, title, data, type }: UserDetailsModalProps) {
  const { executeAction, loadDemandes } = useStore()
  const [clotureLoading, setClotureLoading] = useState<string | null>(null)
  const [commentaires, setCommentaires] = useState<{ [key: string]: string }>({})
  const [showCommentaire, setShowCommentaire] = useState<{ [key: string]: boolean }>({})

  const getStatusColor = (status: string) => {
    switch (status) {
      case "brouillon":
        return "bg-gray-500"
      case "soumise":
        return "bg-blue-500"
      case "en_attente_validation_conducteur":
      case "en_attente_validation_qhse":
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
      case "en_attente_validation_qhse":
        return "En attente validation QHSE"
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

  // Pas de filtrage supplémentaire pour "enCours" car déjà filtré par le dashboard
  // Les autres types peuvent nécessiter un filtrage supplémentaire pour compatibilité
  const filteredData = data.filter(item => {
    switch (type) {
      case "total":
      case "enCours":
        // Faire confiance aux données déjà filtrées du dashboard
        return true
      case "validees":
        return ["cloturee", "archivee"].includes(item.status)
      case "rejetees":
        return item.status === "rejetee"
      case "brouillons":
        return item.status === "brouillon"
      case "enAttente":
        return item.status === "soumise"
      case "aPreparer":
        return ["en_attente_validation_conducteur", "en_attente_validation_qhse"].includes(item.status)
      case "preparees":
        return item.status === "en_attente_preparation_appro"
      case "livrees":
        return ["cloturee", "archivee"].includes(item.status)
      case "aValider":
        return item.status === "en_attente_validation_finale_demandeur"
      default:
        return true
    }
  })

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title} ({filteredData.length})</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {filteredData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Aucun élément trouvé</p>
            </div>
          ) : (
            filteredData.map((item) => (
              <div
                key={item.id}
                className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-gray-800">{item.numero}</h3>
                      <Badge className={`${getStatusColor(item.status)} text-white text-xs`}>
                        {getStatusLabel(item.status)}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {item.type === "materiel" ? "Matériel" : "Outillage"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {item.items?.length || 0} article{(item.items?.length || 0) > 1 ? "s" : ""} • Créée le{" "}
                      {new Date(item.dateCreation).toLocaleDateString()}
                    </p>
                    {item.commentaires && (
                      <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                        <strong>Commentaire:</strong> {item.commentaires}
                      </p>
                    )}
                    {item.dateLivraisonSouhaitee && (
                      <p className="text-sm text-green-600">
                        <strong>Livraison souhaitée:</strong> {new Date(item.dateLivraisonSouhaitee).toLocaleDateString()}
                      </p>
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
                    <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-700">
                      <Eye className="h-4 w-4" />
                    </Button>
                    {/* Masquer les boutons de modification et suppression pour les demandes en cours */}
                    {type !== "enCours" && (
                      <>
                        <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Calendar, User, Building, Package, AlertCircle, Trash2 } from "lucide-react"
import type { Demande } from "@/types"
import PurchaseRequestCard from "@/components/demandes/purchase-request-card"
import RemoveItemConfirmationModal from "@/components/modals/remove-item-confirmation-modal"

interface DemandeDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  demande: Demande | null
  onValidate?: (action: "valider" | "rejeter" | "valider_sortie", quantites?: { [itemId: string]: number }, commentaire?: string) => void
  canValidate?: boolean
  onItemRemoved?: () => void
  canRemoveItems?: boolean
  validationAction?: "valider" | "valider_sortie"
  validationLabel?: string
}

export default function DemandeDetailsModal({ 
  isOpen, 
  onClose, 
  demande, 
  onValidate,
  canValidate = false,
  onItemRemoved,
  canRemoveItems = false,
  validationAction = "valider",
  validationLabel = "Valider"
}: DemandeDetailsModalProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [quantitesValidees, setQuantitesValidees] = useState<{ [itemId: string]: number }>({})
  const [quantitesOriginales, setQuantitesOriginales] = useState<{ [itemId: string]: number }>({})
  const [commentaire, setCommentaire] = useState("")
  const [showCommentaireError, setShowCommentaireError] = useState(false)
  const [removeItemModalOpen, setRemoveItemModalOpen] = useState(false)
  const [itemToRemove, setItemToRemove] = useState<any>(null)
  const [removeItemLoading, setRemoveItemLoading] = useState(false)

  // Initialiser les quantités validées avec les quantités demandées
  useEffect(() => {
    if (demande) {
      const initialQuantites: { [itemId: string]: number } = {}
      const originalesQuantites: { [itemId: string]: number } = {}
      demande.items.forEach(item => {
        const quantite = item.quantiteValidee || item.quantiteDemandee
        initialQuantites[item.id] = quantite
        originalesQuantites[item.id] = quantite
      })
      setQuantitesValidees(initialQuantites)
      setQuantitesOriginales(originalesQuantites)
      setCommentaire("")
      setShowCommentaireError(false)
    }
  }, [demande])

  if (!demande) return null

  const handleQuantiteChange = (itemId: string, value: string) => {
    const numValue = parseInt(value) || 0
    setQuantitesValidees(prev => ({
      ...prev,
      [itemId]: numValue
    }))
    // Réinitialiser l'erreur de commentaire quand l'utilisateur modifie
    setShowCommentaireError(false)
  }

  // Vérifier si des modifications ont été apportées
  const hasModifications = () => {
    return Object.keys(quantitesValidees).some(itemId => 
      quantitesValidees[itemId] !== quantitesOriginales[itemId]
    )
  }

  const handleAction = async (action: "valider" | "rejeter" | "valider_sortie") => {
    if (!onValidate) return
    
    // Si validation avec modifications, commentaire obligatoire
    if (action === "valider" && hasModifications() && !commentaire.trim()) {
      setShowCommentaireError(true)
      return
    }
    
    setActionLoading(action)
    try {
      await onValidate(
        action, 
        action === "valider" ? quantitesValidees : undefined,
        commentaire.trim() || undefined
      )
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "en_attente_validation_conducteur":
      case "en_attente_validation_qhse":
      case "en_attente_validation_responsable_travaux":
      case "en_attente_preparation_appro":
      case "en_attente_validation_charge_affaire":
      case "en_attente_validation_logistique":
      case "en_attente_validation_finale_demandeur":
        return "bg-orange-100 text-orange-800"
      case "confirmee_demandeur":
      case "cloturee":
        return "bg-green-100 text-green-800"
      case "rejetee":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      "brouillon": "Brouillon",
      "soumise": "Soumise",
      "en_attente_validation_conducteur": "En attente validation conducteur",
      "en_attente_validation_qhse": "En attente validation QHSE",
      "en_attente_validation_responsable_travaux": "En attente validation responsable travaux",
      "en_attente_validation_charge_affaire": "En attente validation chargé d'affaire",
      "en_attente_preparation_appro": "En attente préparation appro",
      "en_attente_validation_logistique": "En attente validation logistique",
      "en_attente_validation_finale_demandeur": "En attente validation finale demandeur",
      "confirmee_demandeur": "Confirmée par le demandeur",
      "cloturee": "Clôturée",
      "rejetee": "Rejetée",
      "archivee": "Archivée"
    }
    return statusMap[status] || status
  }

  // Fonction pour ouvrir le modal de suppression d'article
  const handleRemoveItem = (item: any) => {
    setItemToRemove(item)
    setRemoveItemModalOpen(true)
  }

  // Fonction pour confirmer la suppression d'article
  const handleConfirmRemoveItem = async (justification: string) => {
    if (!itemToRemove || !demande) return

    setRemoveItemLoading(true)
    try {
      const response = await fetch(`/api/demandes/${demande.id}/remove-item`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          itemId: itemToRemove.id,
          justification
        }),
      })

      const result = await response.json()

      if (result.success) {
        alert(result.message)
        onItemRemoved?.()
        setRemoveItemModalOpen(false)
        setItemToRemove(null)
      } else {
        alert(`Erreur: ${result.error}`)
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de l'article:", error)
      alert("Erreur lors de la suppression de l'article")
    } finally {
      setRemoveItemLoading(false)
    }
  }

  // Vérifier si un article peut être supprimé
  const canRemoveItem = (item: any) => {
    if (!canRemoveItems || !demande) return false
    
    // Vérifier qu'il reste plus d'un article
    if (demande.items.length <= 1) return false
    
    // Vérifier le statut de la demande
    const allowedStatuses = [
      "en_attente_validation_conducteur",
      "en_attente_validation_responsable_travaux", 
      "en_attente_validation_charge_affaire"
    ]
    
    return allowedStatuses.includes(demande.status)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center bg-gray-800 text-white py-3 px-4 rounded mb-4">
            Demande {demande.type === "materiel" ? "Matériel" : "Outillage"} de {demande.technicien ? `${demande.technicien.prenom} ${demande.technicien.nom}` : 'N/A'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informations générales - Format compact */}
          <div className="bg-gray-50 p-4 rounded border">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Date de création:</span>
                <p>{new Date(demande.dateCreation).toLocaleDateString('fr-FR')}</p>
              </div>
              
              <div>
                <span className="font-medium text-gray-600">Client:</span>
                <p>{demande.technicien ? `${demande.technicien.prenom} ${demande.technicien.nom}` : 'N/A'}</p>
              </div>

              <div>
                <span className="font-medium text-gray-600">Projet:</span>
                <p>{demande.projet?.nom || 'N/A'}</p>
              </div>

              {demande.dateLivraisonSouhaitee && (
                <div>
                  <span className="font-medium text-gray-600">Date souhaitée:</span>
                  <p>{new Date(demande.dateLivraisonSouhaitee).toLocaleDateString('fr-FR')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Tableau des articles - Format compact et éditable */}
          <div className="border rounded">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="font-bold text-center border-r">Référence</TableHead>
                  <TableHead className="font-bold text-center border-r">Désignation</TableHead>
                  <TableHead className="font-bold text-center border-r">Unité</TableHead>
                  <TableHead className="font-bold text-center border-r">Qté demandée</TableHead>
                  <TableHead className="font-bold text-center border-r">Qté validée</TableHead>
                  <TableHead className="font-bold text-center border-r">Date 1</TableHead>
                  <TableHead className="font-bold text-center">Date 2</TableHead>
                  {canRemoveItems && (
                    <TableHead className="font-bold text-center">Supprimer</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {demande.items.map((item, index) => (
                  <TableRow key={index} className="border-b">
                    <TableCell className="font-medium text-center border-r p-2">
                      {item.article?.reference || 'N/A'}
                    </TableCell>
                    <TableCell className="text-center border-r p-2">
                      {item.article?.nom || 'N/A'}
                    </TableCell>
                    <TableCell className="text-center border-r p-2">
                      {item.article?.unite || 'N/A'}
                    </TableCell>
                    <TableCell className="text-center border-r p-2">
                      {item.quantiteDemandee}
                    </TableCell>
                    <TableCell className="text-center border-r p-2">
                      {canValidate ? (
                        <Input
                          type="number"
                          min="0"
                          max={item.quantiteDemandee}
                          value={quantitesValidees[item.id] || item.quantiteDemandee}
                          onChange={(e) => handleQuantiteChange(item.id, e.target.value)}
                          className="w-16 h-8 text-center"
                        />
                      ) : (
                        item.quantiteValidee || item.quantiteDemandee
                      )}
                    </TableCell>
                    <TableCell className="text-center border-r p-2">
                      {demande.dateCreation ? new Date(demande.dateCreation).toLocaleDateString('fr-FR') : '-'}
                    </TableCell>
                    <TableCell className="text-center p-2">
                      {demande.dateLivraisonSouhaitee ? new Date(demande.dateLivraisonSouhaitee).toLocaleDateString('fr-FR') : '-'}
                    </TableCell>
                    {canRemoveItems && (
                      <TableCell className="text-center p-2">
                        {canRemoveItem(item) ? (
                          <Button
                            onClick={() => handleRemoveItem(item)}
                            variant="destructive"
                            className="px-4"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </Button>
                        ) : (
                          <span className="text-gray-500">Non autorisé</span>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Champ commentaire - Affiché si modifications ou si peut valider */}
          {canValidate && (
            <div className="space-y-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Commentaire {hasModifications() && <span className="text-red-500">*</span>}
                  {hasModifications() && <span className="text-xs text-red-500 ml-1">(obligatoire car modifications apportées)</span>}
                </label>
                <Textarea
                  value={commentaire}
                  onChange={(e) => {
                    setCommentaire(e.target.value)
                    setShowCommentaireError(false)
                  }}
                  placeholder={hasModifications() ? "Veuillez expliquer les modifications apportées..." : "Commentaire optionnel..."}
                  className={`min-h-[80px] ${showCommentaireError ? 'border-red-500' : ''}`}
                />
                {showCommentaireError && (
                  <div className="flex items-center mt-2 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    Un commentaire est obligatoire lorsque vous modifiez les quantités
                  </div>
                )}
              </div>

              {/* Actions de validation */}
              <div className="flex justify-center gap-4">
                <Button
                  onClick={() => handleAction(validationAction)}
                  disabled={actionLoading !== null}
                  className="bg-green-600 hover:bg-green-700 text-white px-6"
                >
                  {actionLoading === validationAction ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  {validationLabel}
                </Button>
                
                <Button
                  onClick={() => handleAction("rejeter")}
                  disabled={actionLoading !== null}
                  variant="destructive"
                  className="px-6"
                >
                  {actionLoading === "rejeter" ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Rejeter
                </Button>
              </div>
            </div>
          )}

          {/* Bouton fermer */}
          <div className="flex justify-center pt-4">
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
      {removeItemModalOpen && (
        <RemoveItemConfirmationModal
          isOpen={removeItemModalOpen}
          onClose={() => setRemoveItemModalOpen(false)}
          item={itemToRemove}
          demandeNumero={demande?.numero || ""}
          onConfirm={handleConfirmRemoveItem}
          isLoading={removeItemLoading}
        />
      )}
    </Dialog>
  )
}

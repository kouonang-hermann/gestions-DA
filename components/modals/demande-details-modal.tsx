"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Calendar, User, Building, Package, AlertCircle, Trash2, DollarSign, Save } from "lucide-react"
import type { Demande } from "@/types"
import PurchaseRequestCard from "@/components/demandes/purchase-request-card"
import RemoveItemConfirmationModal from "@/components/modals/remove-item-confirmation-modal"
import { useStore } from "@/stores/useStore"

interface DemandeDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  demande: Demande | null
  onValidate?: (action: "valider" | "rejeter" | "annuler" | "valider_sortie" | "cloturer", quantites?: { [itemId: string]: number }, commentaire?: string) => void
  canValidate?: boolean
  onItemRemoved?: () => void
  canRemoveItems?: boolean
  validationAction?: "valider" | "valider_sortie" | "cloturer"
  validationLabel?: string
  canEditPrices?: boolean // Pour le responsable appro
  onPricesUpdated?: () => void
  showDeliveryColumns?: boolean // Pour afficher les colonnes de livraison (livreur, logistique)
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
  validationLabel = "Valider",
  canEditPrices = false,
  onPricesUpdated,
  showDeliveryColumns = false
}: DemandeDetailsModalProps) {
  const { token, currentUser } = useStore()
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [quantitesValidees, setQuantitesValidees] = useState<{ [itemId: string]: number }>({})
  const [quantitesOriginales, setQuantitesOriginales] = useState<{ [itemId: string]: number }>({})
  const [commentaire, setCommentaire] = useState("")
  const [showCommentaireError, setShowCommentaireError] = useState(false)
  const [removeItemModalOpen, setRemoveItemModalOpen] = useState(false)
  const [itemToRemove, setItemToRemove] = useState<any>(null)
  const [removeItemLoading, setRemoveItemLoading] = useState(false)
  
  // États pour la gestion des prix (responsable appro)
  const [prixUnitaires, setPrixUnitaires] = useState<{ [itemId: string]: string }>({})
  const [pricesLoading, setPricesLoading] = useState(false)
  const [pricesSuccess, setPricesSuccess] = useState(false)
  const [pricesError, setPricesError] = useState("")
  
  // États pour la gestion des quantités livrées (responsable appro)
  const [quantitesLivrees, setQuantitesLivrees] = useState<{ [itemId: string]: string }>({})
  const [deliveryLoading, setDeliveryLoading] = useState(false)
  const [deliverySuccess, setDeliverySuccess] = useState(false)
  const [deliveryError, setDeliveryError] = useState("")
  
  // États pour la gestion du budget prévisionnel (chargé d'affaires)
  const [budgetPrevisionnel, setBudgetPrevisionnel] = useState<string>("")
  const [budgetLoading, setBudgetLoading] = useState(false)
  const [budgetSuccess, setBudgetSuccess] = useState(false)
  const [budgetError, setBudgetError] = useState("")

  // États pour l'édition des articles (conducteur, responsable travaux, chargé affaires, QHSE)
  const [editingArticle, setEditingArticle] = useState<{ itemId: string, field: 'nom' | 'reference' } | null>(null)
  const [articleEdits, setArticleEdits] = useState<{ [itemId: string]: { nom?: string, reference?: string } }>({})
  const [articleUpdateLoading, setArticleUpdateLoading] = useState(false)
  
  // États pour l'édition des dates
  const [editingDate, setEditingDate] = useState<{ field: 'date1' | 'date2' } | null>(null)
  const [dateEdits, setDateEdits] = useState<{ date1?: string, date2?: string }>({})
  const [dateUpdateLoading, setDateUpdateLoading] = useState(false)

  // Initialiser les quantités validées avec les quantités demandées
  useEffect(() => {
    if (demande) {
      const initialQuantites: { [itemId: string]: number } = {}
      const originalesQuantites: { [itemId: string]: number } = {}
      const initialPrix: { [itemId: string]: string } = {}
      
      const initialLivrees: { [itemId: string]: string } = {}
      
      const initialArticleEdits: { [itemId: string]: { nom?: string, reference?: string } } = {}
      
      demande.items.forEach(item => {
        const quantite = item.quantiteValidee || item.quantiteDemandee
        initialQuantites[item.id] = quantite
        originalesQuantites[item.id] = quantite
        initialPrix[item.id] = item.prixUnitaire?.toString() || ""
        initialLivrees[item.id] = item.quantiteSortie?.toString() || ""
        initialArticleEdits[item.id] = {
          nom: item.article?.nom || "",
          reference: item.article?.reference || ""
        }
      })
      
      // Initialiser les dates
      setDateEdits({
        date1: demande.dateCreation ? new Date(demande.dateCreation).toISOString().split('T')[0] : '',
        date2: demande.dateLivraisonSouhaitee ? new Date(demande.dateLivraisonSouhaitee).toISOString().split('T')[0] : ''
      })
      setQuantitesValidees(initialQuantites)
      setQuantitesOriginales(originalesQuantites)
      setPrixUnitaires(initialPrix)
      setQuantitesLivrees(initialLivrees)
      setArticleEdits(initialArticleEdits)
      setCommentaire("")
      setShowCommentaireError(false)
      setPricesSuccess(false)
      setPricesError("")
      setDeliverySuccess(false)
      setDeliveryError("")
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

  // Gestion des prix unitaires
  const handlePrixChange = (itemId: string, value: string) => {
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setPrixUnitaires(prev => ({
        ...prev,
        [itemId]: value
      }))
      setPricesError("")
      setPricesSuccess(false)
    }
  }

  // Gestion des quantités livrées
  const handleQuantiteLivreeChange = (itemId: string, value: string) => {
    if (value === "" || /^\d+$/.test(value)) {
      setQuantitesLivrees(prev => ({
        ...prev,
        [itemId]: value
      }))
      setDeliveryError("")
      setDeliverySuccess(false)
    }
  }

  // Calculer la quantité restante pour un article
  const calculateQuantiteRestante = (item: any) => {
    const quantiteValidee = item.quantiteValidee || item.quantiteDemandee
    const quantiteLivree = parseInt(quantitesLivrees[item.id] || "0") || 0
    return Math.max(0, quantiteValidee - quantiteLivree)
  }

  // Enregistrer les quantités livrées
  const handleSaveDelivery = async () => {
    setDeliveryLoading(true)
    setDeliveryError("")

    try {
      const itemsData = demande.items.map(item => ({
        itemId: item.id,
        quantiteSortie: parseInt(quantitesLivrees[item.id] || "0") || 0
      }))

      const response = await fetch(`/api/demandes/${demande.id}/update-delivery`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ items: itemsData }),
      })

      const result = await response.json()

      if (result.success) {
        setDeliverySuccess(true)
        onPricesUpdated?.()
      } else {
        setDeliveryError(result.error || "Erreur lors de l'enregistrement")
      }
    } catch (err) {
      console.error("Erreur:", err)
      setDeliveryError("Erreur de connexion")
    } finally {
      setDeliveryLoading(false)
    }
  }

  // Gérer l'édition des articles
  const handleArticleEdit = (itemId: string, field: 'nom' | 'reference', value: string) => {
    setArticleEdits(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value
      }
    }))
  }

  // Sauvegarder la modification d'un article
  const handleSaveArticleEdit = async (itemId: string, articleId: string) => {
    setArticleUpdateLoading(true)
    
    try {
      const edits = articleEdits[itemId]
      if (!edits) return

      const response = await fetch(`/api/articles/${articleId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          nom: edits.nom,
          reference: edits.reference
        }),
      })

      const result = await response.json()

      if (result.success) {
        setEditingArticle(null)
        onPricesUpdated?.() // Recharger les données
      }
    } catch (err) {
      console.error("Erreur:", err)
    } finally {
      setArticleUpdateLoading(false)
    }
  }
  
  // Gérer l'édition des dates
  const handleDateEdit = (field: 'date1' | 'date2', value: string) => {
    setDateEdits(prev => ({
      ...prev,
      [field]: value
    }))
  }
  
  // Sauvegarder la modification d'une date
  const handleSaveDateEdit = async (field: 'date1' | 'date2') => {
    setDateUpdateLoading(true)
    
    try {
      const dateValue = dateEdits[field]
      if (!dateValue) return
      
      const fieldMap = {
        'date1': 'dateCreation',
        'date2': 'dateLivraisonSouhaitee'
      }

      const response = await fetch(`/api/demandes/${demande.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          [fieldMap[field]]: new Date(dateValue).toISOString()
        }),
      })

      const result = await response.json()

      if (result.success) {
        setEditingDate(null)
        onPricesUpdated?.() // Recharger les données
      }
    } catch (err) {
      console.error("Erreur:", err)
    } finally {
      setDateUpdateLoading(false)
    }
  }

  // Vérifier si l'utilisateur peut éditer les articles et dates
  const canEditArticles = () => {
    if (!currentUser || !demande) return false
    
    const allowedRoles = ["conducteur_travaux", "responsable_logistique", "responsable_travaux", "charge_affaire"]
    if (!allowedRoles.includes(currentUser.role)) return false
    
    // Vérifier si l'utilisateur est à son étape de validation
    const roleToStatusMap: Record<string, string> = {
      "conducteur_travaux": "en_attente_validation_conducteur",
      "responsable_logistique": "en_attente_validation_logistique",
      "responsable_travaux": "en_attente_validation_responsable_travaux",
      "charge_affaire": "en_attente_validation_charge_affaire"
    }
    
    return demande.status === roleToStatusMap[currentUser.role]
  }

  // Calculer le coût total
  const calculateCoutTotal = () => {
    let total = 0
    demande.items.forEach(item => {
      const prix = parseFloat(prixUnitaires[item.id] || "0")
      const quantite = item.quantiteValidee || item.quantiteDemandee
      if (!isNaN(prix) && prix > 0) {
        total += prix * quantite
      }
    })
    return total
  }

  // Vérifier si tous les prix sont renseignés
  const allPricesFilled = () => {
    return demande.items.every(item => {
      const prix = parseFloat(prixUnitaires[item.id] || "0")
      return !isNaN(prix) && prix > 0
    })
  }

  // Enregistrer les prix
  const handleSavePrices = async () => {
    if (!allPricesFilled()) {
      setPricesError("Veuillez renseigner tous les prix")
      return
    }

    setPricesLoading(true)
    setPricesError("")

    try {
      const itemsData = demande.items.map(item => ({
        itemId: item.id,
        prixUnitaire: parseFloat(prixUnitaires[item.id])
      }))

      const response = await fetch(`/api/demandes/${demande.id}/update-prices`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ items: itemsData }),
      })

      const result = await response.json()

      if (result.success) {
        setPricesSuccess(true)
        onPricesUpdated?.()
      } else {
        setPricesError(result.error || "Erreur lors de l'enregistrement")
      }
    } catch (err) {
      console.error("Erreur:", err)
      setPricesError("Erreur de connexion")
    } finally {
      setPricesLoading(false)
    }
  }

  // Formater le prix
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + " FCFA"
  }

  const handleAction = async (action: "valider" | "rejeter" | "annuler" | "valider_sortie" | "cloturer") => {
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
      case "brouillon":
        return "bg-gray-100 text-gray-800"
      case "soumise":
        return "bg-blue-100 text-blue-800"
      case "en_attente_validation_conducteur":
      case "en_attente_validation_logistique":
      case "en_attente_validation_responsable_travaux":
      case "en_attente_validation_charge_affaire":
      case "en_attente_preparation_appro":
      case "en_attente_validation_logistique":
      case "en_attente_validation_finale_demandeur":
        return "bg-orange-100 text-orange-800"
      case "confirmee_demandeur":
      case "cloturee":
        return "bg-green-100 text-green-800"
      case "rejetee":
        return "bg-red-100 text-red-800"
      case "archivee":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      "brouillon": "Brouillon",
      "soumise": "Soumise",
      "en_attente_validation_conducteur": "En attente validation conducteur",
      "en_attente_validation_logistique": "En attente validation logistique",
      "en_attente_validation_responsable_travaux": "En attente validation responsable travaux",
      "en_attente_validation_charge_affaire": "En attente validation chargé d'affaire",
      "en_attente_preparation_appro": "En attente préparation appro",
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
          "Authorization": `Bearer ${token}`,
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
      <DialogContent className="w-[95vw] max-w-5xl max-h-[95vh] overflow-y-auto p-2 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-sm sm:text-xl font-bold text-center bg-gray-800 text-white py-2 sm:py-3 px-2 sm:px-4 rounded mb-4">
            <span className="hidden sm:inline">Demande {demande.type === "materiel" ? "Matériel" : "Outillage"} de {demande.technicien ? `${demande.technicien.prenom} ${demande.technicien.nom}` : 'N/A'}</span>
            <span className="sm:hidden">DA-{demande.numero}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informations générales - Format compact */}
          <div className="bg-gray-50 p-2 sm:p-4 rounded border">
            <div className="grid grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
              <div>
                <span className="font-medium text-gray-600">Date de création:</span>
                <p>{demande.dateCreation ? new Date(demande.dateCreation).toLocaleDateString('fr-FR') : '—'}</p>
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
                  <p>{demande.dateLivraisonSouhaitee ? new Date(demande.dateLivraisonSouhaitee).toLocaleDateString('fr-FR') : '—'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Tableau des articles - Format compact et éditable */}
          <div className="border rounded overflow-x-auto">
            <Table className="min-w-[600px]">
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="font-bold text-center border-r">Référence</TableHead>
                  <TableHead className="font-bold text-center border-r">Désignation</TableHead>
                  <TableHead className="font-bold text-center border-r">Unité</TableHead>
                  <TableHead className="font-bold text-center border-r">Qté demandée</TableHead>
                  <TableHead className="font-bold text-center border-r">Qté validée</TableHead>
                  {(canEditPrices || showDeliveryColumns) && (
                    <TableHead className="font-bold text-center border-r bg-blue-50 text-blue-800">Qté livrée</TableHead>
                  )}
                  {(canEditPrices || showDeliveryColumns) && (
                    <TableHead className="font-bold text-center border-r bg-orange-50 text-orange-800">Qté restante</TableHead>
                  )}
                  {canEditPrices && (
                    <TableHead className="font-bold text-center border-r bg-green-50 text-green-800">Prix unitaire (FCFA)</TableHead>
                  )}
                  {canEditPrices && (
                    <TableHead className="font-bold text-center border-r bg-green-50 text-green-800">Sous-total</TableHead>
                  )}
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
                      {canEditArticles() && editingArticle?.itemId === item.id && editingArticle?.field === 'reference' ? (
                        <Input
                          type="text"
                          value={articleEdits[item.id]?.reference || ''}
                          onChange={(e) => handleArticleEdit(item.id, 'reference', e.target.value)}
                          onBlur={() => handleSaveArticleEdit(item.id, item.article?.id || '')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveArticleEdit(item.id, item.article?.id || '')
                            }
                            if (e.key === 'Escape') {
                              setEditingArticle(null)
                            }
                          }}
                          className="w-full h-8 text-center"
                          autoFocus
                        />
                      ) : (
                        <span 
                          onClick={() => canEditArticles() && setEditingArticle({ itemId: item.id, field: 'reference' })}
                          className={canEditArticles() ? "cursor-pointer hover:bg-gray-100 px-2 py-1 rounded" : ""}
                        >
                          {articleEdits[item.id]?.reference || item.article?.reference || 'N/A'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center border-r p-2">
                      {canEditArticles() && editingArticle?.itemId === item.id && editingArticle?.field === 'nom' ? (
                        <Input
                          type="text"
                          value={articleEdits[item.id]?.nom || ''}
                          onChange={(e) => handleArticleEdit(item.id, 'nom', e.target.value)}
                          onBlur={() => handleSaveArticleEdit(item.id, item.article?.id || '')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveArticleEdit(item.id, item.article?.id || '')
                            }
                            if (e.key === 'Escape') {
                              setEditingArticle(null)
                            }
                          }}
                          className="w-full h-8 text-center"
                          autoFocus
                        />
                      ) : (
                        <span 
                          onClick={() => canEditArticles() && setEditingArticle({ itemId: item.id, field: 'nom' })}
                          className={canEditArticles() ? "cursor-pointer hover:bg-gray-100 px-2 py-1 rounded" : ""}
                        >
                          {articleEdits[item.id]?.nom || item.article?.nom || 'N/A'}
                        </span>
                      )}
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
                    {(canEditPrices || showDeliveryColumns) && (
                      <TableCell className="text-center border-r p-2 bg-blue-50">
                        {currentUser?.role === "responsable_appro" ? (
                          <Input
                            type="text"
                            inputMode="numeric"
                            value={quantitesLivrees[item.id] || ""}
                            onChange={(e) => handleQuantiteLivreeChange(item.id, e.target.value)}
                            placeholder="0"
                            className="w-16 h-8 text-center"
                          />
                        ) : (
                          <span className="font-medium text-blue-700">
                            {item.quantiteSortie || 0}
                          </span>
                        )}
                      </TableCell>
                    )}
                    {(canEditPrices || showDeliveryColumns) && (
                      <TableCell className="text-center border-r p-2 bg-orange-50">
                        <span className="font-medium text-orange-700">
                          {calculateQuantiteRestante(item)}
                        </span>
                      </TableCell>
                    )}
                    {canEditPrices && (
                      <TableCell className="text-center border-r p-2 bg-green-50">
                        <Input
                          type="text"
                          inputMode="decimal"
                          value={prixUnitaires[item.id] || ""}
                          onChange={(e) => handlePrixChange(item.id, e.target.value)}
                          placeholder="0"
                          className="w-24 h-8 text-center"
                        />
                      </TableCell>
                    )}
                    {canEditPrices && (
                      <TableCell className="text-center border-r p-2 bg-green-50 font-medium text-green-700">
                        {(() => {
                          const prix = parseFloat(prixUnitaires[item.id] || "0")
                          const quantite = item.quantiteValidee || item.quantiteDemandee
                          const sousTotal = !isNaN(prix) && prix > 0 ? prix * quantite : 0
                          return sousTotal > 0 ? formatPrice(sousTotal) : "-"
                        })()}
                      </TableCell>
                    )}
                    <TableCell className="text-center border-r p-2">
                      {canEditArticles() && editingDate?.field === 'date1' ? (
                        <Input
                          type="date"
                          value={dateEdits.date1 || ''}
                          onChange={(e) => handleDateEdit('date1', e.target.value)}
                          onBlur={() => handleSaveDateEdit('date1')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveDateEdit('date1')
                            }
                            if (e.key === 'Escape') {
                              setEditingDate(null)
                            }
                          }}
                          className="w-full h-8 text-center"
                          autoFocus
                        />
                      ) : (
                        <span 
                          onClick={() => canEditArticles() && setEditingDate({ field: 'date1' })}
                          className={canEditArticles() ? "cursor-pointer hover:bg-gray-100 px-2 py-1 rounded" : ""}
                        >
                          {dateEdits.date1 ? new Date(dateEdits.date1).toLocaleDateString('fr-FR') : '-'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center p-2">
                      {canEditArticles() && editingDate?.field === 'date2' ? (
                        <Input
                          type="date"
                          value={dateEdits.date2 || ''}
                          onChange={(e) => handleDateEdit('date2', e.target.value)}
                          onBlur={() => handleSaveDateEdit('date2')}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveDateEdit('date2')
                            }
                            if (e.key === 'Escape') {
                              setEditingDate(null)
                            }
                          }}
                          className="w-full h-8 text-center"
                          autoFocus
                        />
                      ) : (
                        <span 
                          onClick={() => canEditArticles() && setEditingDate({ field: 'date2' })}
                          className={canEditArticles() ? "cursor-pointer hover:bg-gray-100 px-2 py-1 rounded" : ""}
                        >
                          {dateEdits.date2 ? new Date(dateEdits.date2).toLocaleDateString('fr-FR') : '-'}
                        </span>
                      )}
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

          {/* Section quantités livrées - Pour responsable appro */}
          {canEditPrices && currentUser?.role === "responsable_appro" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-800">Gestion des quantités livrées</span>
              </div>

              {deliveryError && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {deliveryError}
                </div>
              )}

              {deliverySuccess && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  Quantités livrées enregistrées avec succès !
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveDelivery}
                  disabled={deliveryLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {deliveryLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Enregistrer les quantités livrées
                </Button>
              </div>
            </div>
          )}

          {/* Section prix total et bouton enregistrer - Pour responsable appro */}
          {canEditPrices && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-800">Coût total estimé:</span>
                </div>
                <span className="text-xl font-bold text-green-700">
                  {formatPrice(calculateCoutTotal())}
                </span>
              </div>

              {pricesError && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {pricesError}
                </div>
              )}

              {pricesSuccess && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  Prix enregistrés avec succès !
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  onClick={handleSavePrices}
                  disabled={pricesLoading || !allPricesFilled()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {pricesLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Enregistrer les prix
                </Button>
              </div>
            </div>
          )}

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

          {/* Bouton d'annulation pour le demandeur */}
          {currentUser?.id === demande.technicienId && 
           ["brouillon", "soumise", "en_attente_validation_conducteur", "en_attente_validation_logistique"].includes(demande.status) && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-600" />
                <span className="font-semibold text-orange-800">Annuler cette demande</span>
              </div>
              <p className="text-sm text-gray-600">
                Vous pouvez annuler cette demande tant qu'elle n'a pas été validée par un niveau supérieur.
              </p>
              <div className="flex justify-center">
                <Button
                  onClick={() => handleAction("annuler")}
                  disabled={actionLoading !== null}
                  variant="destructive"
                  className="px-6"
                >
                  {actionLoading === "annuler" ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Annuler la demande
                </Button>
              </div>
            </div>
          )}

          {/* Bouton confirmation réception livreur */}
          {demande.status === "en_attente_reception_livreur" && 
           demande.livreurAssigneId === currentUser?.id && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-indigo-600" />
                <span className="font-semibold text-indigo-800">Confirmer la réception du matériel</span>
              </div>
              <p className="text-sm text-gray-600">
                En confirmant, vous attestez avoir réceptionné le matériel préparé par l'appro.
              </p>
              <div className="flex justify-center">
                <Button
                  onClick={async () => {
                    setActionLoading("confirmer_reception")
                    try {
                      const response = await fetch(`/api/demandes/${demande.id}/actions`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          "Authorization": `Bearer ${token}`,
                        },
                        body: JSON.stringify({ 
                          action: "confirmer_reception_livreur"
                        }),
                      })

                      const result = await response.json()

                      if (result.success) {
                        onPricesUpdated?.()
                        onClose()
                      } else {
                        alert(result.error || "Erreur lors de la confirmation")
                      }
                    } catch (error) {
                      console.error("Erreur:", error)
                      alert("Erreur de connexion")
                    } finally {
                      setActionLoading(null)
                    }
                  }}
                  disabled={actionLoading !== null}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-8"
                >
                  {actionLoading === "confirmer_reception" ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Confirmer la réception
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

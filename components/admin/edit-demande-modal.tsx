"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Save, X, Plus, Trash2, AlertCircle } from "lucide-react"
import { useStore } from "@/stores/useStore"
import type { Demande, ItemDemande } from "@/types"

interface EditDemandeModalProps {
  isOpen: boolean
  onClose: () => void
  demande: Demande | null
}

export default function EditDemandeModal({ isOpen, onClose, demande }: EditDemandeModalProps) {
  const { currentUser, projets, users, updateDemande, token } = useStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // États pour les champs de la demande
  const [formData, setFormData] = useState({
    type: "materiel" as "materiel" | "outillage",
    projetId: "",
    technicienId: "",
    dateLivraisonSouhaitee: "",
    commentaires: "",
  })

  // État pour les articles
  const [items, setItems] = useState<Array<{
    id?: string
    articleId?: string
    reference: string
    nom: string
    unite: string
    quantiteDemandee: number
    quantiteValidee?: number
    prixUnitaire?: number
  }>>([])

  // Charger les données de la demande
  useEffect(() => {
    if (demande && isOpen) {
      setFormData({
        type: demande.type,
        projetId: demande.projetId,
        technicienId: demande.technicienId,
        dateLivraisonSouhaitee: demande.dateLivraisonSouhaitee 
          ? new Date(demande.dateLivraisonSouhaitee).toISOString().split('T')[0] 
          : "",
        commentaires: demande.commentaires || "",
      })

      // Charger les articles
      if (demande.items && demande.items.length > 0) {
        setItems(demande.items.map(item => ({
          id: item.id,
          articleId: item.articleId,
          reference: item.article?.reference || "",
          nom: item.article?.nom || "",
          unite: item.article?.unite || "pièce",
          quantiteDemandee: item.quantiteDemandee,
          quantiteValidee: item.quantiteValidee,
          prixUnitaire: item.prixUnitaire,
        })))
      } else {
        setItems([{
          reference: "",
          nom: "",
          unite: "pièce",
          quantiteDemandee: 1,
        }])
      }

      setError(null)
    }
  }, [demande, isOpen])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleItemChange = (index: number, field: string, value: any) => {
    setItems(prev => {
      const newItems = [...prev]
      newItems[index] = { ...newItems[index], [field]: value }
      return newItems
    })
  }

  const handleAddItem = () => {
    setItems(prev => [...prev, {
      reference: "",
      nom: "",
      unite: "pièce",
      quantiteDemandee: 1,
    }])
  }

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index))
    }
  }

  const handleSave = async () => {
    if (!demande) return

    // Validation
    if (!formData.projetId) {
      setError("Veuillez sélectionner un projet")
      return
    }

    if (!formData.technicienId) {
      setError("Veuillez sélectionner un demandeur")
      return
    }

    if (items.length === 0 || items.some(item => !item.nom)) {
      setError("Veuillez remplir tous les articles (nom obligatoire)")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/demandes/${demande.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: formData.type,
          projetId: formData.projetId,
          technicienId: formData.technicienId,
          dateLivraisonSouhaitee: formData.dateLivraisonSouhaitee || null,
          commentaires: formData.commentaires,
          items: items.map(item => ({
            id: item.id,
            reference: item.reference,
            nom: item.nom,
            unite: item.unite,
            quantiteDemandee: item.quantiteDemandee,
            quantiteValidee: item.quantiteValidee,
            prixUnitaire: item.prixUnitaire,
          }))
        })
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Erreur lors de la modification de la demande")
      }

      // Recharger les demandes
      await useStore.getState().loadDemandes()
      
      onClose()
    } catch (err) {
      console.error("Erreur lors de la modification:", err)
      setError(err instanceof Error ? err.message : "Erreur lors de la modification")
    } finally {
      setIsLoading(false)
    }
  }

  if (!demande) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            Modifier la demande {demande.numero}
            <Badge variant={demande.type === "materiel" ? "default" : "secondary"}>
              {demande.type === "materiel" ? "Matériel" : "Outillage"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Informations générales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Type de demande</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "materiel" | "outillage") => handleInputChange("type", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="materiel">Matériel</SelectItem>
                  <SelectItem value="outillage">Outillage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="projet">Projet *</Label>
              <Select
                value={formData.projetId}
                onValueChange={(value) => handleInputChange("projetId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un projet" />
                </SelectTrigger>
                <SelectContent>
                  {projets.map((projet) => (
                    <SelectItem key={projet.id} value={projet.id}>
                      {projet.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="demandeur">Demandeur *</Label>
              <Select
                value={formData.technicienId}
                onValueChange={(value) => handleInputChange("technicienId", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un demandeur" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.prenom} {user.nom} ({user.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dateLivraison">Date de livraison souhaitée</Label>
              <Input
                id="dateLivraison"
                type="date"
                value={formData.dateLivraisonSouhaitee}
                onChange={(e) => handleInputChange("dateLivraisonSouhaitee", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="commentaires">Commentaires</Label>
            <Textarea
              id="commentaires"
              value={formData.commentaires}
              onChange={(e) => handleInputChange("commentaires", e.target.value)}
              placeholder="Commentaires additionnels..."
              rows={2}
            />
          </div>

          {/* Articles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Articles</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddItem}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Ajouter un article
              </Button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto border rounded p-3">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded border">
                  <div className="col-span-3">
                    <Label className="text-xs">Référence (optionnelle)</Label>
                    <Input
                      value={item.reference}
                      onChange={(e) => handleItemChange(index, "reference", e.target.value)}
                      placeholder="Optionnel"
                      className="text-sm"
                    />
                  </div>

                  <div className="col-span-4">
                    <Label className="text-xs">Nom de l'article *</Label>
                    <Input
                      value={item.nom}
                      onChange={(e) => handleItemChange(index, "nom", e.target.value)}
                      placeholder="Nom de l'article"
                      className="text-sm"
                    />
                  </div>

                  <div className="col-span-2">
                    <Label className="text-xs">Unité</Label>
                    <Select
                      value={item.unite}
                      onValueChange={(value) => handleItemChange(index, "unite", value)}
                    >
                      <SelectTrigger className="text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pièce">Pièce</SelectItem>
                        <SelectItem value="kg">Kg</SelectItem>
                        <SelectItem value="m">Mètre</SelectItem>
                        <SelectItem value="m²">M²</SelectItem>
                        <SelectItem value="m³">M³</SelectItem>
                        <SelectItem value="L">Litre</SelectItem>
                        <SelectItem value="boîte">Boîte</SelectItem>
                        <SelectItem value="carton">Carton</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-2">
                    <Label className="text-xs">Quantité *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantiteDemandee}
                      onChange={(e) => handleItemChange(index, "quantiteDemandee", parseInt(e.target.value) || 1)}
                      className="text-sm"
                    />
                  </div>

                  <div className="col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                      disabled={items.length === 1}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-[#015fc4] hover:bg-[#014a9b]"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer les modifications
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

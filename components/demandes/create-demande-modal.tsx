"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from "@/stores/useStore"
import { Plus, Trash2, Save, Loader2, Copy, Upload, FileSpreadsheet, X, Download } from 'lucide-react'
import type { DemandeType, ItemDemande } from "@/types"
import { downloadExcelTemplate, parseExcelFile, validateExcelItems } from '@/lib/excel-utils'

interface CreateDemandeModalProps {
  isOpen: boolean
  onClose: () => void
  type?: DemandeType
  existingDemande?: any // Demande existante à modifier (pour les demandes rejetées)
}

interface ManualItem {
  id: string
  nom: string
  description: string
  reference: string
  unite: string
  quantiteDemandee: number
  commentaire: string
}

export default function CreateDemandeModal({ isOpen, onClose, type = "materiel", existingDemande }: CreateDemandeModalProps) {
  const { currentUser, projets, createDemande, loadProjets, isLoading, executeAction, loadDemandes, token } = useStore()
  
  const DRAFT_KEY = `demande_draft_${type}_${currentUser?.id}`
  const isEditMode = !!existingDemande
  
  const [formData, setFormData] = useState({
    projetId: "",
    type: type as DemandeType,
    items: [] as ManualItem[],
    commentaires: "",
    dateLivraisonSouhaitee: "",
  })
  
  const [error, setError] = useState("")
  const [hasDraft, setHasDraft] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [importingExcel, setImportingExcel] = useState(false)

  // Charger le brouillon depuis localStorage au montage
  useEffect(() => {
    if (isOpen) {
      loadProjets()
      
      // Si on modifie une demande existante, charger ses données
      if (existingDemande) {
        const items = existingDemande.items?.map((item: any) => ({
          id: item.id,
          nom: item.article?.nom || "",
          description: item.article?.description || "",
          reference: item.article?.reference || "",
          unite: item.article?.unite || "pièce",
          quantiteDemandee: item.quantiteDemandee || 1,
          commentaire: item.commentaire || "",
        })) || []
        
        setFormData({
          projetId: existingDemande.projetId || "",
          type: existingDemande.type || type,
          items: items,
          commentaires: existingDemande.commentaires || "",
          dateLivraisonSouhaitee: existingDemande.dateLivraisonSouhaitee 
            ? new Date(existingDemande.dateLivraisonSouhaitee).toISOString().split('T')[0] 
            : "",
        })
        setHasDraft(false)
        return
      }
      
      // Essayer de charger un brouillon existant
      const savedDraft = localStorage.getItem(DRAFT_KEY)
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft)
          setFormData(draft)
          setHasDraft(true)
        } catch (e) {
          setFormData({
            projetId: "",
            type: type,
            items: [],
            commentaires: "",
            dateLivraisonSouhaitee: "",
          })
          setHasDraft(false)
        }
      } else {
        setFormData({
          projetId: "",
          type: type,
          items: [],
          commentaires: "",
          dateLivraisonSouhaitee: "",
        })
        setHasDraft(false)
      }
      setError("")
    }
  }, [isOpen, type, loadProjets, DRAFT_KEY])

  // Sauvegarder automatiquement le brouillon à chaque modification
  useEffect(() => {
    if (isOpen && (formData.projetId || formData.items.length > 0 || formData.commentaires)) {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(formData))
      setHasDraft(true)
    }
  }, [formData, isOpen, DRAFT_KEY])

  const addNewItem = () => {
    const newItem: ManualItem = {
      id: Date.now().toString(),
      nom: "",
      description: "",
      reference: "",
      unite: "pièce",
      quantiteDemandee: 1,
      commentaire: "",
    }

    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem],
    }))
  }

  const updateItem = (itemId: string, field: keyof ManualItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId ? { ...item, [field]: value } : item
      ),
    }))
  }

  const removeItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId),
    }))
  }
  
  const duplicateItem = (itemId: string) => {
    const itemToDuplicate = formData.items.find(item => item.id === itemId)
    if (!itemToDuplicate) return
    
    const duplicatedItem: ManualItem = {
      ...itemToDuplicate,
      id: Date.now().toString(),
    }
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, duplicatedItem],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.projetId || formData.items.length === 0 || !formData.dateLivraisonSouhaitee) {
      setError("Veuillez sélectionner un projet, ajouter au moins un article et spécifier une date de livraison")
      return
    }

    // Validation de la date de livraison
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time to start of day for comparison
    const deliveryDate = new Date(formData.dateLivraisonSouhaitee)
    deliveryDate.setHours(0, 0, 0, 0) // Reset time for proper comparison
    if (deliveryDate < today) {
      setError("La date de livraison ne peut pas être dans le passé")
      return
    }

    // Validation des articles
    for (const item of formData.items) {
      if (!item.nom.trim() || !item.unite.trim()) {
        setError("Tous les articles doivent avoir un nom et une unité")
        return
      }
      if (item.quantiteDemandee <= 0) {
        setError("La quantité doit être supérieure à 0")
        return
      }
    }

    // Si on est en mode édition, mettre à jour la demande
    if (isEditMode && existingDemande) {
      try {
        
        // Mettre à jour les données de la demande
        const response = await fetch(`/api/demandes/${existingDemande.id}/update-items`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            projetId: formData.projetId,
            commentaires: formData.commentaires,
            dateLivraisonSouhaitee: formData.dateLivraisonSouhaitee,
            items: formData.items.map(item => ({
              articleId: `manual-${item.id}`,
              quantiteDemandee: item.quantiteDemandee,
              commentaire: item.commentaire || undefined,
              article: {
                nom: item.nom,
                description: item.description,
                reference: item.reference,
                unite: item.unite,
                type: formData.type,
              }
            }))
          })
        })

        if (!response.ok) {
          const errorData = await response.json()
          setError(errorData.error || "Erreur lors de la mise à jour de la demande")
          return
        }

        const updateResult = await response.json()

        // Recharger les demandes et fermer la modale
        await loadDemandes()
        alert("✅ Demande modifiée avec succès !")
        onClose()
      } catch (error) {
        setError("Erreur lors de la modification de la demande")
      }
      return
    }

    // Mode création normale
    // Convertir les items manuels en format attendu par l'API
    const items = formData.items.map(item => ({
      articleId: `manual-${item.id}`,
      quantiteDemandee: item.quantiteDemandee,
      commentaire: item.commentaire || undefined,
      article: {
        nom: item.nom,
        description: item.description,
        reference: item.reference,
        unite: item.unite,
        type: formData.type,
      }
    })) as any

    const success = await createDemande({
      projetId: formData.projetId,
      type: formData.type,
      items,
      commentaires: formData.commentaires,
      dateLivraisonSouhaitee: new Date(formData.dateLivraisonSouhaitee),
      fichiersJoints: uploadedFiles,
    })

    if (success) {
      // Supprimer le brouillon après création réussie
      localStorage.removeItem(DRAFT_KEY)
      onClose()
    }
  }

  const clearDraft = () => {
    if (confirm("Voulez-vous vraiment supprimer ce brouillon ?")) {
      localStorage.removeItem(DRAFT_KEY)
      setFormData({
        projetId: "",
        type: type,
        items: [],
        commentaires: "",
        dateLivraisonSouhaitee: "",
      })
      setHasDraft(false)
    }
  }

  // Tous les projets actifs et non terminés sont disponibles pour créer une demande
  const now = new Date()
  const mesProjets = projets.filter(p => {
    const fin = p?.dateFin ? new Date(p.dateFin as any) : null
    const notEnded = !fin || fin >= now
    return p.actif && notEnded
  })

  const unites = ["pièce", "kg", "m", "m²", "m³", "L", "sac", "barre", "rouleau", "boîte", "paquet"]

  // Fonction pour télécharger le template Excel
  const handleDownloadTemplate = () => {
    try {
      downloadExcelTemplate()
    } catch (error) {
      alert('Erreur lors du téléchargement du template')
    }
  }

  // Fonction pour importer depuis Excel
  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImportingExcel(true)
    setError('')

    try {
      // Parser le fichier Excel
      const items = await parseExcelFile(file)

      // Valider les items
      const validation = validateExcelItems(items)
      if (!validation.isValid) {
        setError(`Erreur dans le fichier Excel:\n${validation.errors.join('\n')}`)
        setImportingExcel(false)
        return
      }

      // Convertir les items Excel en items de formulaire
      const newItems = items.map(item => ({
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        nom: item.nom,
        description: item.description,
        reference: item.reference,
        unite: item.unite || 'pièce',
        quantiteDemandee: item.quantite,
        commentaire: '',
      }))

      // Ajouter aux items existants
      setFormData(prev => ({
        ...prev,
        items: [...prev.items, ...newItems]
      }))

      alert(`✅ ${newItems.length} article(s) importé(s) avec succès !`)
    } catch (error: any) {
      setError(error.message || 'Erreur lors de l\'import du fichier Excel')
    } finally {
      setImportingExcel(false)
      e.target.value = '' // Reset input
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-base sm:text-lg">
                {isEditMode ? "Modifier la demande rejetée" : `Nouvelle demande de ${type === "materiel" ? "matériel" : "outillage"}`}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                {isEditMode ? "Modifiez votre demande et renvoyez-la pour validation" : "Créez une nouvelle demande"}
              </DialogDescription>
            </div>
            {hasDraft && (
              <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md border border-blue-200">
                <Save className="h-4 w-4" />
                <span className="text-xs font-medium">Brouillon sauvegardé</span>
              </div>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle>Informations générales</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="projet" className="block text-sm font-medium mb-2">
                  Projet *
                </label>
                <select
                  id="projet"
                  value={formData.projetId}
                  onChange={(e) => setFormData(prev => ({ ...prev, projetId: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="">Sélectionnez un projet</option>
                  {mesProjets.map(projet => (
                    <option key={projet.id} value={projet.id}>
                      {projet.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="dateLivraisonSouhaitee" className="block text-sm font-medium mb-2">
                  Date de livraison souhaitée *
                </label>
                <input
                  type="date"
                  id="dateLivraisonSouhaitee"
                  value={formData.dateLivraisonSouhaitee}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateLivraisonSouhaitee: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div>
                <label htmlFor="commentaires" className="block text-sm font-medium mb-2">
                  Commentaires généraux (optionnel)
                </label>
                <textarea
                  id="commentaires"
                  value={formData.commentaires}
                  onChange={(e) => setFormData(prev => ({ ...prev, commentaires: e.target.value }))}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Commentaires sur la demande..."
                />
              </div>

              {/* Téléversement de fichiers Excel */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Fichiers Excel (optionnel)
                </label>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <label className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-center gap-2 h-10 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 transition-colors">
                        <Upload className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {uploadingFiles ? "Téléversement..." : "Téléverser des fichiers Excel"}
                        </span>
                      </div>
                      <input
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        multiple
                        className="hidden"
                        disabled={uploadingFiles}
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || [])
                          if (files.length === 0) return

                          setUploadingFiles(true)
                          try {
                            const formData = new FormData()
                            files.forEach(file => formData.append('files', file))

                            const response = await fetch('/api/upload', {
                              method: 'POST',
                              headers: {
                                'Authorization': `Bearer ${token}`,
                              },
                              body: formData,
                            })

                            const result = await response.json()
                            if (result.success) {
                              setUploadedFiles(prev => [...prev, ...result.files])
                            } else {
                              alert(result.error || 'Erreur lors du téléversement')
                            }
                          } catch (error) {
                            alert('Erreur lors du téléversement des fichiers')
                          } finally {
                            setUploadingFiles(false)
                            e.target.value = '' // Reset input
                          }
                        }}
                      />
                    </label>
                  </div>

                  {/* Liste des fichiers téléversés */}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-600">
                        {uploadedFiles.length} fichier(s) téléversé(s)
                      </p>
                      <div className="space-y-1">
                        {uploadedFiles.map((fileUrl, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-md">
                            <FileSpreadsheet className="h-4 w-4 text-green-600" />
                            <span className="flex-1 text-sm text-green-800 truncate">
                              {fileUrl.split('/').pop()}
                            </span>
                            <button
                              type="button"
                              onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== index))}
                              className="p-1 hover:bg-green-100 rounded transition-colors"
                            >
                              <X className="h-4 w-4 text-green-600" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-gray-500">
                    Formats acceptés: .xlsx, .xls, .csv
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Articles */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Articles demandés ({formData.items.length})</CardTitle>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadTemplate}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger template Excel
                  </Button>
                  <label className="cursor-pointer">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={importingExcel}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      asChild
                    >
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        {importingExcel ? 'Import en cours...' : 'Importer depuis Excel'}
                      </span>
                    </Button>
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      className="hidden"
                      disabled={importingExcel}
                      onChange={handleImportExcel}
                    />
                  </label>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {formData.items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Aucun article ajouté</p>
                  <p className="text-sm">Cliquez sur "Ajouter un article" pour commencer</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <div key={item.id} className="border rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-gray-800">Article {index + 1}</h4>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => duplicateItem(item.id)}
                            className="text-blue-600 hover:text-blue-700"
                            title="Dupliquer cet article"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="text-red-600 hover:text-red-700"
                            title="Supprimer cet article"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Nom de l'article *
                          </label>
                          <input
                            type="text"
                            value={item.nom}
                            onChange={(e) => updateItem(item.id, "nom", e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            placeholder="Ex: Casque de sécurité"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Référence
                          </label>
                          <input
                            type="text"
                            value={item.reference}
                            onChange={(e) => updateItem(item.id, "reference", e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            placeholder="Ex: CAS-001"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Unité *
                          </label>
                          <select
                            value={item.unite}
                            onChange={(e) => updateItem(item.id, "unite", e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            required
                          >
                            {unites.map(unite => (
                              <option key={unite} value={unite}>
                                {unite}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">
                            Quantité *
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.quantiteDemandee}
                            onChange={(e) => {
                              const value = e.target.value
                              if (value === "") {
                                updateItem(item.id, "quantiteDemandee", "")
                              } else {
                                const num = parseInt(value)
                                if (!isNaN(num) && num >= 0) {
                                  updateItem(item.id, "quantiteDemandee", num)
                                }
                              }
                            }}
                            onBlur={(e) => {
                              if (e.target.value === "" || parseInt(e.target.value) < 1) {
                                updateItem(item.id, "quantiteDemandee", 1)
                              }
                            }}
                            className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            required
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium mb-1">
                            Description
                          </label>
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateItem(item.id, "description", e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            placeholder="Description détaillée de l'article"
                          />
                        </div>

                        <div className="lg:col-span-3">
                          <label className="block text-sm font-medium mb-1">
                            Commentaire
                          </label>
                          <input
                            type="text"
                            value={item.commentaire}
                            onChange={(e) => updateItem(item.id, "commentaire", e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            placeholder="Commentaire spécifique pour cet article"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <Button type="button" onClick={addNewItem} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un article
              </Button>
              {(formData.projetId || formData.items.length > 0 || formData.commentaires) && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={clearDraft}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer le brouillon
                </Button>
              )}
            </div>
            <div className="flex space-x-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading || formData.items.length === 0}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="h-4 w-4 mr-2" />
                {isEditMode ? "Modifier" : "Créer la demande"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

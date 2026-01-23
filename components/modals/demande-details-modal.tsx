"use client"

import { useEffect, useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Loader2, CheckCircle, Save } from "lucide-react"
import { Input } from "@/components/ui/input"
import type { Demande } from "@/types"
import { useStore } from "@/stores/useStore"
import { generatePurchaseRequestPDF, generateBonLivraisonPDF, generateBonSortiePDF } from "@/lib/pdf-generator"
import { PDFTypeSelector, type PDFType } from "@/components/demandes/pdf-type-selector"

interface DemandeDetailModalProps {
  isOpen: boolean
  onClose: () => void
  demandeId: string | null
  mode: "view" | "edit"
  showDeliveryColumns?: boolean
  canValidate?: boolean
  onValidate?: (demandeId: string) => void
}

export default function DemandeDetailModal({ 
  isOpen, 
  onClose, 
  demandeId,
  mode,
  canValidate = false,
  onValidate
}: DemandeDetailModalProps) {
  const { demandes, currentUser, executeAction, loadDemandes } = useStore()
  const [demande, setDemande] = useState<Demande | null>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // État pour les quantités livrées et prix en mode édition
  const [quantitesLivrees, setQuantitesLivrees] = useState<{ [itemId: string]: string }>({})
  const [prixUnitaires, setPrixUnitaires] = useState<{ [itemId: string]: string }>({})

  useEffect(() => {
    console.log('🔍 [MODAL] useEffect déclenché:', { demandeId, demandesCount: demandes.length, mode })
    if (demandeId && demandes.length > 0) {
      const foundDemande = demandes.find(d => d.id === demandeId)
      console.log('🔍 [MODAL] Demande trouvée:', foundDemande ? { id: foundDemande.id, numero: foundDemande.numero, status: foundDemande.status } : 'NON TROUVÉE')
      setDemande(foundDemande || null)
      
      // Initialiser les valeurs éditables
      if (foundDemande && mode === "edit") {
        const initialQtes: { [itemId: string]: string } = {}
        const initialPrix: { [itemId: string]: string } = {}
        foundDemande.items.forEach(item => {
          initialQtes[item.id] = (item.quantiteSortie || item.quantiteRecue || 0).toString()
          initialPrix[item.id] = item.prixUnitaire?.toString() || ""
        })
        setQuantitesLivrees(initialQtes)
        setPrixUnitaires(initialPrix)
      }
    } else {
      setDemande(null)
    }
  }, [demandeId, demandes, mode])

  if (!demande) return null

  // Déterminer si on doit afficher les colonnes de livraison selon le statut
  // Ces colonnes ne sont visibles qu'après la préparation logistique
  const showDeliveryColumns = ![
    "brouillon", 
    "soumise", 
    "en_attente_validation_conducteur",
    "en_attente_validation_responsable_travaux",
    "en_attente_validation_charge_affaire",
    "en_attente_validation_logistique"
  ].includes(demande.status)
  
  // Déterminer si on peut éditer les quantités et prix (mode edit + rôles appropriés)
  const canEdit = mode === "edit" && currentUser && (
    currentUser.role === "responsable_logistique" ||
    currentUser.role === "responsable_appro" ||
    currentUser.role === "superadmin"
  )
  
  // Afficher les colonnes éditables pour logistique/appro même avant préparation
  const showEditableColumns = canEdit || showDeliveryColumns

  // Déterminer si on doit afficher la colonne Qté validée
  const showValidatedColumn = ![
    "brouillon", 
    "soumise", 
    "en_attente_validation_conducteur"
  ].includes(demande.status)

  // Récupérer tous les commentaires des validations
  const getAllComments = () => {
    const comments: string[] = []
    
    if (demande.validationConducteur?.commentaire) {
      comments.push(`Conducteur: ${demande.validationConducteur.commentaire}`)
    }
    if (demande.validationResponsableTravaux?.commentaire) {
      comments.push(`Responsable Travaux: ${demande.validationResponsableTravaux.commentaire}`)
    }
    if (demande.validationChargeAffaire?.commentaire) {
      comments.push(`Chargé d'Affaire: ${demande.validationChargeAffaire.commentaire}`)
    }
    if (demande.validationLogistique?.commentaire) {
      comments.push(`Logistique: ${demande.validationLogistique.commentaire}`)
    }
    if (demande.sortieAppro?.commentaire) {
      comments.push(`Appro: ${demande.sortieAppro.commentaire}`)
    }
    if (demande.validationLivreur?.commentaire) {
      comments.push(`Livreur: ${demande.validationLivreur.commentaire}`)
    }
    if (demande.validationFinale?.commentaire) {
      comments.push(`Validation finale: ${demande.validationFinale.commentaire}`)
    }
    if (demande.commentaires) {
      comments.push(`Demandeur: ${demande.commentaires}`)
    }
    if (demande.rejetMotif) {
      comments.push(`Motif de rejet: ${demande.rejetMotif}`)
    }
    
    return comments
  }

  const allComments = getAllComments()

  // Créer une clé stable pour les items basée sur leurs IDs
  const itemsKey = useMemo(() => {
    return demande?.items.map(item => item.id).join(',') || ''
  }, [demande?.id])

  // Calculer automatiquement le total en temps réel
  const totalCalcule = useMemo(() => {
    if (!demande) return 0
    
    let total = 0
    demande.items.forEach(item => {
      const qteLivree = canEdit 
        ? parseFloat(quantitesLivrees[item.id] || "0") || 0 
        : (item.quantiteSortie || item.quantiteRecue || 0)
      const prix = canEdit 
        ? parseFloat(prixUnitaires[item.id] || "0") || 0 
        : (item.prixUnitaire || 0)
      total += qteLivree * prix
    })
    
    console.log('💰 [TOTAL] Calcul automatique:', {
      total,
      canEdit,
      nbItems: demande.items.length,
      prixSaisis: Object.keys(prixUnitaires).length,
      qtesSaisies: Object.keys(quantitesLivrees).length
    })
    
    return total
  }, [demande?.id, itemsKey, quantitesLivrees, prixUnitaires, canEdit])

  // Fonction pour télécharger le PDF selon le type choisi
  const handleDownloadPDF = async (type: PDFType) => {
    console.log('🔍 [PDF] Début génération PDF:', { type, demandeId: demande?.id, demandeNumero: demande?.numero })
    
    if (!demande) {
      console.error('❌ [PDF] Aucune demande disponible')
      alert('Erreur: Aucune demande sélectionnée')
      return
    }
    
    setIsGeneratingPDF(true)
    try {
      console.log('📄 [PDF] Génération du type:', type)
      switch (type) {
        case 'demande':
          await generatePurchaseRequestPDF(demande)
          console.log('✅ [PDF] Demande d\'achat générée avec succès')
          break
        case 'bon_livraison':
          await generateBonLivraisonPDF(demande)
          console.log('✅ [PDF] Bon de livraison généré avec succès')
          break
        case 'bon_sortie':
          await generateBonSortiePDF(demande)
          console.log('✅ [PDF] Bon de sortie généré avec succès')
          break
      }
    } catch (error) {
      console.error('❌ [PDF] Erreur lors de la génération du PDF:', error)
      alert('Erreur lors de la génération du PDF. Veuillez réessayer.')
    } finally {
      setIsGeneratingPDF(false)
      console.log('🏁 [PDF] Fin génération PDF')
    }
  }

  // Vérifier si la demande est validée (peut être téléchargée)
  // Toutes les demandes peuvent être téléchargées sauf les brouillons
  const canDownload = demande && demande.status !== "brouillon"
  
  console.log('🔍 [MODAL] État du bouton PDF:', { 
    canDownload, 
    demandeStatus: demande?.status, 
    isGeneratingPDF,
    mode 
  })

  // Vérifier si l'utilisateur peut valider cette demande
  const canUserValidate = canValidate && demande && currentUser && (
    (demande.status === "en_attente_validation_conducteur" && currentUser.role === "conducteur_travaux") ||
    (demande.status === "en_attente_validation_logistique" && currentUser.role === "responsable_logistique") ||
    (demande.status === "en_attente_validation_responsable_travaux" && currentUser.role === "responsable_travaux") ||
    (demande.status === "en_attente_validation_charge_affaire" && currentUser.role === "charge_affaire") ||
    (demande.status === "en_attente_preparation_appro" && currentUser.role === "responsable_appro") ||
    (demande.status === "en_attente_preparation_logistique" && currentUser.role === "responsable_logistique") ||
    currentUser.role === "superadmin"
  )

  // Fonction pour valider la demande
  const handleValidate = async () => {
    if (!demande || !onValidate) return
    
    setIsValidating(true)
    try {
      await onValidate(demande.id)
      onClose()
    } catch (error) {
      console.error('Erreur lors de la validation:', error)
    } finally {
      setIsValidating(false)
    }
  }
  
  // Fonction pour sauvegarder les quantités livrées et prix
  const handleSaveQuantitesEtPrix = async () => {
    if (!demande) return
    
    setIsSaving(true)
    try {
      // Préparer les données
      const itemsData: { itemId: string; quantiteLivree: number; prixUnitaire: number | null }[] = []
      
      demande.items.forEach(item => {
        const qteLivree = parseFloat(quantitesLivrees[item.id] || "0")
        const prix = parseFloat(prixUnitaires[item.id] || "0")
        
        itemsData.push({
          itemId: item.id,
          quantiteLivree: isNaN(qteLivree) ? 0 : qteLivree,
          prixUnitaire: isNaN(prix) || prix <= 0 ? null : prix
        })
      })
      
      // Appeler l'API pour mettre à jour
      const success = await executeAction(demande.id, "update_quantites_prix", { items: itemsData })
      
      if (success) {
        // Forcer le rechargement en réinitialisant le timestamp
        useStore.setState({ lastDemandesLoad: 0 })
        
        // Recharger les demandes
        await loadDemandes()
        
        // Attendre que le store soit complètement mis à jour
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Recharger la demande depuis le store mis à jour
        const updatedDemande = demandes.find(d => d.id === demande.id)
        if (updatedDemande) {
          console.log('📊 Demande rechargée:', updatedDemande)
          console.log('💰 Coût total:', updatedDemande.coutTotal)
          console.log('📦 Items avec prix:', updatedDemande.items.map(i => ({ 
            id: i.id, 
            prixUnitaire: i.prixUnitaire,
            quantiteSortie: i.quantiteSortie 
          })))
          
          setDemande(updatedDemande)
          
          // Réinitialiser les valeurs éditables avec les nouvelles données
          const newQtes: { [itemId: string]: string } = {}
          const newPrix: { [itemId: string]: string } = {}
          updatedDemande.items.forEach(item => {
            newQtes[item.id] = (item.quantiteSortie || item.quantiteRecue || 0).toString()
            newPrix[item.id] = item.prixUnitaire?.toString() || ""
          })
          setQuantitesLivrees(newQtes)
          setPrixUnitaires(newPrix)
        }
        
        alert("Quantités et prix enregistrés avec succès")
      } else {
        alert("Erreur lors de l'enregistrement")
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      alert('Erreur lors de la sauvegarde. Veuillez réessayer.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto p-3 sm:p-4 md:p-6">
        {/* En-tête avec titre */}
        <DialogHeader>
          <DialogTitle className="text-base sm:text-xl font-bold text-center bg-[#015fc4] text-white py-3 px-4 rounded-t">
            Demande {demande.type === "materiel" ? "Matériel" : "Outillage"} de {demande.technicien ? `${demande.technicien.prenom} ${demande.technicien.nom}` : 'N/A'}
          </DialogTitle>
        </DialogHeader>

        <div id="demande-details-content" className="space-y-4 mt-4">
          {/* Section informations générales */}
          <div className="bg-gray-50 p-4 rounded border border-gray-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold text-gray-700">Date de création:</span>
                <p className="text-gray-900">{demande.dateCreation ? new Date(demande.dateCreation).toLocaleDateString('fr-FR') : '—'}</p>
              </div>
              
              <div>
                <span className="font-semibold text-gray-700">Client:</span>
                <p className="text-gray-900">{demande.technicien ? `${demande.technicien.prenom} ${demande.technicien.nom}` : 'N/A'}</p>
              </div>

              <div>
                <span className="font-semibold text-gray-700">Projet:</span>
                <p className="text-gray-900">{demande.projet?.nom || 'N/A'}</p>
              </div>

              <div>
                <span className="font-semibold text-gray-700">Date souhaitée:</span>
                <p className="text-gray-900">{demande.dateLivraisonSouhaitee ? new Date(demande.dateLivraisonSouhaitee).toLocaleDateString('fr-FR') : '—'}</p>
              </div>
            </div>
          </div>

          {/* Tableau des articles avec scroll */}
          <div className="border border-gray-300 rounded">
            <div className="overflow-x-auto">
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow className="border-b-2 border-gray-400">
                      <TableHead className="font-bold text-center border border-gray-300 py-3 text-xs sm:text-sm bg-white">Référence</TableHead>
                      <TableHead className="font-bold text-center border border-gray-300 py-3 text-xs sm:text-sm bg-white">Désignation</TableHead>
                      <TableHead className="font-bold text-center border border-gray-300 py-3 text-xs sm:text-sm bg-white">Unité</TableHead>
                      <TableHead className="font-bold text-center border border-gray-300 py-3 text-xs sm:text-sm bg-white">Qté demandée</TableHead>
                      
                      {showValidatedColumn && (
                        <TableHead className="font-bold text-center border border-gray-300 py-3 text-xs sm:text-sm bg-white">Qté validée</TableHead>
                      )}
                      
                      {showEditableColumns && (
                        <>
                          <TableHead className="font-bold text-center border border-gray-300 py-3 text-xs sm:text-sm bg-blue-50 text-blue-600">
                            Qté livrée {canEdit && <span className="text-red-500">*</span>}
                          </TableHead>
                          <TableHead className="font-bold text-center border border-gray-300 py-3 text-xs sm:text-sm bg-orange-50 text-orange-600">Qté restante</TableHead>
                          <TableHead className="font-bold text-center border border-gray-300 py-3 text-xs sm:text-sm bg-green-50 text-green-600">
                            Prix unit. (FCFA) {canEdit && <span className="text-red-500">*</span>}
                          </TableHead>
                        </>
                      )}
                      
                      <TableHead className="font-bold text-center border border-gray-300 py-3 text-xs sm:text-sm bg-white">Date 1</TableHead>
                      <TableHead className="font-bold text-center border border-gray-300 py-3 text-xs sm:text-sm bg-white">Date 2</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {demande.items.map((item, index) => {
                      const qteValidee = item.quantiteValidee || item.quantiteDemandee
                      // Utiliser la valeur saisie si en mode édition, sinon la valeur enregistrée
                      const qteLivreeSaisie = canEdit ? parseFloat(quantitesLivrees[item.id] || "0") || 0 : (item.quantiteSortie || item.quantiteRecue || 0)
                      const qteRestante = Math.max(0, qteValidee - qteLivreeSaisie)
                      const prixUnitaire = canEdit ? prixUnitaires[item.id] : (item.prixUnitaire?.toString() || "")

                      return (
                        <TableRow key={index} className="border-b hover:bg-gray-50">
                          <TableCell className="text-center border border-gray-300 p-3 text-xs sm:text-sm">
                            {item.article?.reference || '----'}
                          </TableCell>
                          <TableCell className="text-center border border-gray-300 p-3 text-xs sm:text-sm">
                            {item.article?.nom || 'Article inconnu'}
                          </TableCell>
                          <TableCell className="text-center border border-gray-300 p-3 text-xs sm:text-sm">
                            {item.article?.unite || 'pièce'}
                          </TableCell>
                          <TableCell className="text-center border border-gray-300 p-3 text-xs sm:text-sm font-medium">
                            {item.quantiteDemandee}
                          </TableCell>
                          
                          {showValidatedColumn && (
                            <TableCell className="text-center border border-gray-300 p-3 text-xs sm:text-sm font-medium">
                              {qteValidee}
                            </TableCell>
                          )}
                          
                          {showEditableColumns && (
                            <>
                              <TableCell className="text-center border border-gray-300 p-1 text-xs sm:text-sm bg-blue-50">
                                {canEdit ? (
                                  <Input
                                    type="number"
                                    min="0"
                                    max={qteValidee}
                                    step="1"
                                    className="w-20 h-8 text-center mx-auto text-blue-600 font-semibold"
                                    value={quantitesLivrees[item.id] || ""}
                                    onChange={(e) => setQuantitesLivrees(prev => ({
                                      ...prev,
                                      [item.id]: e.target.value
                                    }))}
                                    placeholder="0"
                                  />
                                ) : (
                                  <span className="font-semibold text-blue-600">{qteLivreeSaisie}</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center border border-gray-300 p-3 text-xs sm:text-sm bg-orange-50">
                                <span className={`font-semibold ${qteRestante > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                  {qteRestante}
                                </span>
                              </TableCell>
                              <TableCell className="text-center border border-gray-300 p-1 text-xs sm:text-sm bg-green-50">
                                {canEdit ? (
                                  <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    className="w-24 h-8 text-center mx-auto text-green-600 font-semibold"
                                    value={prixUnitaires[item.id] || ""}
                                    onChange={(e) => setPrixUnitaires(prev => ({
                                      ...prev,
                                      [item.id]: e.target.value
                                    }))}
                                    placeholder="0.00"
                                  />
                                ) : (
                                  <span className="font-semibold text-green-600">
                                    {prixUnitaire ? `${parseFloat(prixUnitaire).toFixed(0)} FCFA` : '-'}
                                  </span>
                                )}
                              </TableCell>
                            </>
                          )}
                          
                          <TableCell className="text-center border border-gray-300 p-3 text-xs sm:text-sm">
                            {demande.dateCreation ? new Date(demande.dateCreation).toLocaleDateString('fr-FR') : '-'}
                          </TableCell>
                          <TableCell className="text-center border border-gray-300 p-3 text-xs sm:text-sm">
                            {demande.dateLivraisonSouhaitee ? new Date(demande.dateLivraisonSouhaitee).toLocaleDateString('fr-FR') : '-'}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* Section Prix Total */}
          {showEditableColumns && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-700">💰 Prix Total de la demande :</span>
                <span className="text-2xl font-bold text-green-600">
                  {(() => {
                    // Utiliser le coût total enregistré si disponible et pas en mode édition
                    const displayTotal = !canEdit && demande.coutTotal ? demande.coutTotal : totalCalcule
                    return `${displayTotal.toFixed(0)} FCFA`
                  })()}
                </span>
              </div>
              {demande.coutTotal && !canEdit ? (
                <p className="text-sm text-gray-500 mt-1">Coût total enregistré</p>
              ) : canEdit && (
                <p className="text-sm text-blue-600 mt-1">✨ Calcul automatique en temps réel</p>
              )}
            </div>
          )}

          {/* Section Commentaires */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Commentaire
            </label>
            <div className="min-h-[100px] border border-gray-300 rounded p-3 bg-gray-50">
              {allComments.length > 0 ? (
                <div className="space-y-2 text-sm text-gray-700">
                  {allComments.map((comment, index) => (
                    <p key={index} className="border-b border-gray-200 pb-2 last:border-b-0">
                      {comment}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 italic text-sm">Commentaire optionnel...</p>
              )}
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex flex-col sm:flex-row justify-center gap-2 sm:gap-3 pt-4">
            {canEdit && (
              <Button 
                onClick={handleSaveQuantitesEtPrix}
                disabled={isSaving}
                className="w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-2 bg-green-600 hover:bg-green-700 text-white rounded flex items-center justify-center gap-2 min-h-[48px] text-sm sm:text-base"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span className="hidden sm:inline">Enregistrement...</span>
                    <span className="sm:hidden">Enregistrement...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span className="hidden sm:inline">Enregistrer Qté & Prix</span>
                    <span className="sm:hidden">Enregistrer</span>
                  </>
                )}
              </Button>
            )}
            {canDownload && (
              <PDFTypeSelector
                onSelect={handleDownloadPDF}
                isGenerating={isGeneratingPDF}
                className="w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-2"
              />
            )}
            {canUserValidate && (
              <Button 
                onClick={handleValidate}
                disabled={isValidating}
                className="w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-2 bg-purple-600 hover:bg-purple-700 text-white rounded flex items-center justify-center gap-2 min-h-[48px] text-sm sm:text-base font-semibold"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    Validation...
                  </>
                ) : (
                  <>
                    <CheckCircle size={16} />
                    Valider
                  </>
                )}
              </Button>
            )}
            <Button 
              onClick={onClose}
              className="w-full sm:w-auto px-4 sm:px-8 py-3 sm:py-2 bg-gray-600 hover:bg-gray-700 text-white rounded min-h-[48px] text-sm sm:text-base"
            >
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

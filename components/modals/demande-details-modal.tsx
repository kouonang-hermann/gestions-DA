"use client"

import { useEffect, useState } from "react"
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
  // État pour les quantités validées (pour les valideurs)
  const [quantitesValidees, setQuantitesValidees] = useState<{ [itemId: string]: string }>({})

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
        const initialQtesValidees: { [itemId: string]: string } = {}
        foundDemande.items.forEach(item => {
          initialQtes[item.id] = (item.quantiteSortie || item.quantiteRecue || 0).toString()
          initialPrix[item.id] = item.prixUnitaire?.toString() || ""
          initialQtesValidees[item.id] = (item.quantiteValidee || item.quantiteDemandee).toString()
        })
        setQuantitesLivrees(initialQtes)
        setPrixUnitaires(initialPrix)
        setQuantitesValidees(initialQtesValidees)
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
  
  // Déterminer si on peut éditer les quantités validées (valideurs)
  const canEditValidatedQty = mode === "edit" && currentUser && demande && (
    (demande.status === "en_attente_validation_conducteur" && currentUser.role === "conducteur_travaux") ||
    (demande.status === "en_attente_validation_logistique" && currentUser.role === "responsable_logistique") ||
    (demande.status === "en_attente_validation_responsable_travaux" && currentUser.role === "responsable_travaux") ||
    (demande.status === "en_attente_validation_charge_affaire" && currentUser.role === "charge_affaire") ||
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

  // Calculer automatiquement le total en temps réel (calcul direct sans useMemo)
  const calculerTotal = () => {
    if (!demande) return 0
    
    let total = 0
    console.log('💰 [CALCUL-TOTAL] Début du calcul du coût total')
    console.log(`   - Mode édition: ${canEdit}`)
    console.log(`   - Nombre d'items: ${demande.items.length}`)
    
    demande.items.forEach((item, index) => {
      // En mode édition, utiliser les valeurs saisies OU les valeurs enregistrées comme fallback
      const qteLivree = canEdit 
        ? (parseFloat(quantitesLivrees[item.id]) || item.quantiteSortie || item.quantiteRecue || 0)
        : (item.quantiteSortie || item.quantiteRecue || 0)
      
      const prix = canEdit 
        ? (parseFloat(prixUnitaires[item.id]) || item.prixUnitaire || 0)
        : (item.prixUnitaire || 0)
      
      console.log(`   📦 Item ${index + 1} (${item.article?.nom || 'N/A'}):`)
      console.log(`      - Qté livrée saisie: ${quantitesLivrees[item.id] || 'vide'}`)
      console.log(`      - Qté livrée DB: ${item.quantiteSortie || item.quantiteRecue || 0}`)
      console.log(`      - Qté utilisée: ${qteLivree}`)
      console.log(`      - Prix saisi: ${prixUnitaires[item.id] || 'vide'}`)
      console.log(`      - Prix DB: ${item.prixUnitaire || 0}`)
      console.log(`      - Prix utilisé: ${prix}`)
      
      // Ne calculer que si prix ET quantité sont > 0 (comme l'API)
      if (prix > 0 && qteLivree > 0) {
        const contribution = qteLivree * prix
        total += contribution
        console.log(`      ✅ Contribution: ${qteLivree} × ${prix} = ${contribution} FCFA`)
      } else {
        console.log(`      ⚠️ Ignoré (prix ou quantité = 0)`)
      }
    })
    
    console.log(`💰 [CALCUL-TOTAL] Total calculé: ${total} FCFA`)
    return total
  }

  const totalCalcule = calculerTotal()

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
  
  // Fonction pour sauvegarder les quantités validées (pour les valideurs)
  const handleSaveQuantitesValidees = async () => {
    if (!demande) return
    
    setIsSaving(true)
    try {
      // Préparer les données des quantités validées
      const itemsData: { itemId: string; quantiteValidee: number }[] = []
      let hasError = false
      
      demande.items.forEach(item => {
        const qteStr = quantitesValidees[item.id] || item.quantiteDemandee.toString()
        const qteValidee = parseFloat(qteStr)
        
        // Validation de la quantité
        if (isNaN(qteValidee) || qteValidee < 0 || qteValidee > item.quantiteDemandee) {
          console.error(`❌ Quantité validée invalide pour item ${item.id}: ${qteStr}`)
          hasError = true
        }
        
        itemsData.push({
          itemId: item.id,
          quantiteValidee: isNaN(qteValidee) ? item.quantiteDemandee : qteValidee
        })
      })
      
      if (hasError) {
        alert("❌ Erreur: Certaines quantités validées sont invalides. Veuillez vérifier vos saisies.")
        setIsSaving(false)
        return
      }
      
      console.log('📤 Envoi des quantités validées à l\'API:', itemsData)
      
      // Appeler l'API pour mettre à jour les quantités validées
      const success = await executeAction(demande.id, "update_validated_quantities", { items: itemsData })
      
      if (success) {
        console.log('✅ Quantités validées enregistrées avec succès')
        
        // Recharger les demandes
        await loadDemandes()
        
        // Attendre que le store soit mis à jour
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Recharger la demande depuis le store
        const updatedDemande = demandes.find(d => d.id === demande.id)
        if (updatedDemande) {
          setDemande(updatedDemande)
          
          // Réinitialiser les valeurs
          const newQtesValidees: { [itemId: string]: string } = {}
          updatedDemande.items.forEach(item => {
            newQtesValidees[item.id] = (item.quantiteValidee || item.quantiteDemandee).toString()
          })
          setQuantitesValidees(newQtesValidees)
          
          alert(`✅ Quantités validées enregistrées avec succès!`)
        }
      } else {
        console.error('❌ Erreur lors de l\'enregistrement des quantités validées')
        const errorMsg = useStore.getState().error || "Erreur inconnue"
        alert(`❌ Erreur lors de l\'enregistrement:\n${errorMsg}`)
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des quantités validées:', error)
      alert('Erreur lors de la sauvegarde. Veuillez réessayer.')
    } finally {
      setIsSaving(false)
    }
  }
  
  // Fonction pour sauvegarder les quantités livrées et prix
  const handleSaveQuantitesEtPrix = async () => {
    if (!demande) return
    
    setIsSaving(true)
    try {
      // Préparer les données
      const itemsData: { itemId: string; quantiteLivree: number; prixUnitaire: number | null }[] = []
      let hasQuantityError = false
      let hasPriceError = false
      
      demande.items.forEach(item => {
        const qteStr = quantitesLivrees[item.id] || "0"
        const prixStr = prixUnitaires[item.id] || ""
        
        const qteLivree = parseFloat(qteStr)
        const prix = prixStr ? parseFloat(prixStr) : null
        
        // Validation de la quantité
        if (isNaN(qteLivree) || qteLivree < 0) {
          console.error(`❌ Quantité invalide pour item ${item.id}: ${qteStr}`)
          hasQuantityError = true
        }
        
        // Validation du prix (optionnel mais doit être >= 0 si fourni)
        if (prixStr && (isNaN(prix as number) || (prix as number) < 0)) {
          console.error(`❌ Prix invalide pour item ${item.id}: ${prixStr}`)
          hasPriceError = true
        }
        
        itemsData.push({
          itemId: item.id,
          quantiteLivree: isNaN(qteLivree) ? 0 : qteLivree,
          prixUnitaire: prix !== null && !isNaN(prix) && prix >= 0 ? prix : null
        })
        
        console.log(`📦 Item ${item.article?.nom || item.id}: qté=${qteLivree}, prix=${prix}`)
      })
      
      // Afficher les erreurs de validation
      if (hasQuantityError) {
        alert("❌ Erreur: Certaines quantités sont invalides. Veuillez vérifier vos saisies.")
        setIsSaving(false)
        return
      }
      
      if (hasPriceError) {
        alert("⚠️ Attention: Certains prix sont invalides et seront ignorés.")
      }
      
      console.log('📤 Envoi des données à l\'API:', itemsData)
      
      // Appeler l'API pour mettre à jour
      const success = await executeAction(demande.id, "update_quantites_prix", { items: itemsData })
      
      if (success) {
        console.log('✅ API a retourné success=true')
        
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
          
          // Message de succès détaillé
          const itemsAvecPrix = updatedDemande.items.filter(i => i.prixUnitaire && i.prixUnitaire > 0).length
          const totalItems = updatedDemande.items.length
          
          if (itemsAvecPrix === totalItems) {
            alert(`✅ Quantités et prix enregistrés avec succès!\n💰 Coût total: ${updatedDemande.coutTotal?.toLocaleString('fr-FR')} FCFA`)
          } else if (itemsAvecPrix > 0) {
            alert(`✅ Quantités enregistrées avec succès!\n⚠️ Prix enregistrés pour ${itemsAvecPrix}/${totalItems} articles\n💰 Coût total: ${updatedDemande.coutTotal?.toLocaleString('fr-FR')} FCFA`)
          } else {
            alert(`✅ Quantités enregistrées avec succès!\n⚠️ Aucun prix n'a été enregistré. Veuillez saisir les prix.`)
          }
        } else {
          console.error('❌ Demande non trouvée après rechargement')
          alert("✅ Données enregistrées mais erreur de rechargement. Veuillez rafraîchir la page.")
        }
      } else {
        console.error('❌ API a retourné success=false')
        const errorMsg = useStore.getState().error || "Erreur inconnue"
        alert(`❌ Erreur lors de l'enregistrement:\n${errorMsg}`)
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
          <div className="relative">
            <DialogTitle className="text-base sm:text-xl font-bold text-center bg-[#015fc4] text-white py-3 px-4 rounded-t">
              Demande {demande.type === "materiel" ? "Matériel" : "Outillage"} de {demande.technicien ? `${demande.technicien.prenom} ${demande.technicien.nom}` : 'N/A'}
            </DialogTitle>
            {/* Affichage du livreur assigné en haut à droite */}
            {demande.livreurAssigne && (
              <div className="absolute top-2 right-4 bg-white text-[#015fc4] px-3 py-1 rounded-full text-xs sm:text-sm font-semibold border-2 border-white shadow-md">
                🚚 Livreur: {demande.livreurAssigne.prenom} {demande.livreurAssigne.nom}
              </div>
            )}
          </div>
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
                            <TableCell className="text-center border border-gray-300 p-1 text-xs sm:text-sm font-medium bg-purple-50">
                              {canEditValidatedQty ? (
                                <Input
                                  type="number"
                                  min="0"
                                  max={item.quantiteDemandee}
                                  step="1"
                                  className="w-20 h-8 text-center mx-auto text-purple-600 font-semibold"
                                  value={quantitesValidees[item.id] || ""}
                                  onChange={(e) => {
                                    const value = e.target.value
                                    setQuantitesValidees(prev => ({
                                      ...prev,
                                      [item.id]: value
                                    }))
                                  }}
                                  onBlur={(e) => {
                                    const value = e.target.value
                                    if (value === "" || parseFloat(value) < 0) {
                                      setQuantitesValidees(prev => ({
                                        ...prev,
                                        [item.id]: item.quantiteDemandee.toString()
                                      }))
                                    }
                                  }}
                                  placeholder={item.quantiteDemandee.toString()}
                                />
                              ) : (
                                <span className="font-semibold text-purple-600">{qteValidee}</span>
                              )}
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
                                    onChange={(e) => {
                                      const value = e.target.value
                                      setQuantitesLivrees(prev => ({
                                        ...prev,
                                        [item.id]: value
                                      }))
                                    }}
                                    onBlur={(e) => {
                                      const value = e.target.value
                                      if (value === "" || parseFloat(value) < 0) {
                                        setQuantitesLivrees(prev => ({
                                          ...prev,
                                          [item.id]: "0"
                                        }))
                                      }
                                    }}
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
                                    onChange={(e) => {
                                      const value = e.target.value
                                      setPrixUnitaires(prev => ({
                                        ...prev,
                                        [item.id]: value
                                      }))
                                    }}
                                    onBlur={(e) => {
                                      const value = e.target.value
                                      if (value !== "" && parseFloat(value) < 0) {
                                        setPrixUnitaires(prev => ({
                                          ...prev,
                                          [item.id]: "0"
                                        }))
                                      }
                                    }}
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
            {canEditValidatedQty && (
              <Button 
                onClick={handleSaveQuantitesValidees}
                disabled={isSaving}
                className="w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-2 bg-purple-600 hover:bg-purple-700 text-white rounded flex items-center justify-center gap-2 min-h-[48px] text-sm sm:text-base"
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
                    <span className="hidden sm:inline">Enregistrer Qté Validées</span>
                    <span className="sm:hidden">Enregistrer Qté</span>
                  </>
                )}
              </Button>
            )}
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

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
  const { currentUser, demandes, projets, executeAction, users, loadDemandes } = useStore()
  const [demande, setDemande] = useState<Demande | null>(null)
  const [isLoadingDemande, setIsLoadingDemande] = useState(false)

  const [isSaving, setIsSaving] = useState(false)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isValidating, setIsValidating] = useState(false)

  const [quantitesValidees, setQuantitesValidees] = useState<Record<string, string>>({})
  const [quantitesLivrees, setQuantitesLivrees] = useState<Record<string, string>>({})
  const [prixUnitaires, setPrixUnitaires] = useState<Record<string, string>>({})

  const [activeDemandeId, setActiveDemandeId] = useState<string | null>(demandeId)

  const [demandeStack, setDemandeStack] = useState<string[]>([])

  useEffect(() => {
    setActiveDemandeId(demandeId)
  }, [demandeId])

  // ... (rest of the code remains the same)

  useEffect(() => {
    if (activeDemandeId && demandes.length > 0) {
      const foundDemande = demandes.find(d => d.id === activeDemandeId)
      setDemande(foundDemande || null)

      // Initialiser les valeurs éditables
      // ... (rest of the code remains the same)
    } else {
      setDemande(null)
    }
  }, [activeDemandeId, demandes, mode])

  useEffect(() => {
    const fetchDemande = async () => {
      if (!activeDemandeId) return
      if (demande) return

      setIsLoadingDemande(true)
      try {
        const token = useStore.getState().token
        const res = await fetch(`/api/demandes/${activeDemandeId}`, {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` })
          }
        })

        const data = await res.json()
        if (data?.success && data.data) {
          setDemande(data.data)
        }
      } catch (e) {
      } finally {
        setIsLoadingDemande(false)
      }
    }

    fetchDemande()
  }, [activeDemandeId, demande])

  if (!demande) {
    if (!isOpen) return null

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Détails de la demande</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-3 text-gray-600">Chargement de la demande...</span>
          </div>
        </DialogContent>
      </Dialog>
    )
  }



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

  const canSeePricesForDemande = (d: Demande) => {

    if (currentUser?.role === "superadmin") return true

    if (d.type === "materiel" && currentUser?.role === "responsable_appro") return true

    if (d.type === "outillage" && currentUser?.role === "responsable_logistique") return true

    return false

  }



  const canEdit = mode === "edit" && currentUser && demande && (

    (currentUser.role === "responsable_appro" && demande.type === "materiel") ||

    (currentUser.role === "responsable_logistique" && demande.type === "outillage") ||

    currentUser.role === "superadmin"

  )

  

  // Déterminer si on peut éditer les quantités validées (valideurs)

  const canEditValidatedQty = currentUser && demande && (

    (demande.status === "en_attente_validation_conducteur" && currentUser.role === "conducteur_travaux") ||

    (demande.status === "en_attente_validation_logistique" && currentUser.role === "responsable_logistique") ||

    (demande.status === "en_attente_validation_responsable_travaux" && currentUser.role === "responsable_travaux") ||

    (demande.status === "en_attente_validation_charge_affaire" && currentUser.role === "charge_affaire") ||

    currentUser.role === "superadmin"

  )

  

  // Afficher les colonnes éditables pour logistique/appro même avant préparation

  const showEditableColumns = canEdit || showDeliveryColumns



  const hasAnyPrice = (demande.items || []).some((i: any) => i.prixUnitaire !== null && i.prixUnitaire !== undefined)
  const showPriceColumns = mode === "view" ? hasAnyPrice : (canSeePricesForDemande(demande) && showEditableColumns)



  // Déterminer si on doit afficher la colonne Qté validée

  const showValidatedColumn = ![

    "brouillon",

    "soumise",

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



  const calculerTotalRestantPourDemande = (d: Demande) => {

    let total = 0

    for (const item of d.items || []) {

      const prix = Number(item.prixUnitaire || 0)

      if (prix <= 0) continue

      const quantiteValidee = item.quantiteValidee || item.quantiteDemandee

      const quantiteLivree = item.quantiteSortie || item.quantiteRecue || 0

      const quantiteRestante = Math.max(0, quantiteValidee - quantiteLivree)

      if (quantiteRestante <= 0) continue

      total += quantiteRestante * prix

    }

    return total

  }



  const sousDemandes = demande && demande.typeDemande !== "sous_demande"

    ? demandes.filter(d => d.demandeParentId === demande.id)

    : []



  const coutSousDemandesTotal = sousDemandes.reduce((sum, d) => sum + calculerTotalRestantPourDemande(d), 0)



  const handleOpenSousDemande = (childId: string) => {

    if (!demande) return

    setDemandeStack(prev => [...prev, demande.id])

    setActiveDemandeId(childId)

  }



  const handleGoBack = () => {

    setDemandeStack(prev => {

      if (prev.length === 0) return prev

      const copy = [...prev]

      const last = copy.pop()!

      setActiveDemandeId(last)

      return copy

    })

  }



  // Calculer automatiquement le total en temps réel basé sur les QUANTITÉS RESTANTES

  // Cela permet de connaître le coût de ce qui reste à livrer (rupture de stock magasin)

  const calculerTotal = () => {

    if (!demande) return 0

    

    let total = 0

    

    demande.items.forEach((item, index) => {

      // En mode édition, utiliser les valeurs saisies OU les valeurs enregistrées comme fallback

      const qteLivree = canEdit 

        ? (parseFloat(quantitesLivrees[item.id]) || item.quantiteSortie || item.quantiteRecue || 0)

        : (item.quantiteSortie || item.quantiteRecue || 0)

      

      const prix = canEdit 

        ? (parseFloat(prixUnitaires[item.id]) || item.prixUnitaire || 0)

        : (item.prixUnitaire || 0)

      

      // Calculer la quantité restante (quantité validée - quantité livrée)

      const quantiteValidee = item.quantiteValidee || item.quantiteDemandee

      const quantiteRestante = Math.max(0, quantiteValidee - qteLivree)

      

      

      // Calculer le coût basé sur la quantité RESTANTE

      if (prix > 0 && quantiteRestante > 0) {

        const contribution = quantiteRestante * prix

        total += contribution

      } else if (quantiteRestante === 0) {

      } else {

      }

    })

    

    return total

  }



  const totalCalcule = calculerTotal()



  // Fonction pour télécharger le PDF selon le type choisi

  const handleDownloadPDF = async (type: PDFType) => {

    

    if (!demande) {

      alert('Erreur: Aucune demande sélectionnée')

      return

    }

    

    setIsGeneratingPDF(true)

    try {

      switch (type) {

        case 'demande':

          await generatePurchaseRequestPDF(demande, users)

          break

        case 'bon_livraison':

          await generateBonLivraisonPDF(demande)

          break

        case 'bon_sortie':

          await generateBonSortiePDF(demande)

          break

      }

    } catch (error) {

      alert('Erreur lors de la génération du PDF. Veuillez réessayer.')

    } finally {

      setIsGeneratingPDF(false)

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

      

      

      // Appeler l'API pour mettre à jour les quantités validées

      const success = await executeAction(demande.id, "update_validated_quantities", { items: itemsData })

      

      if (success) {

        

        // Recharger les demandes

        await loadDemandes()

        

        // Attendre que le store soit mis à jour

        await new Promise(resolve => setTimeout(resolve, 500))

        

        // Recharger la demande depuis le store

        const updatedDemande = useStore.getState().demandes.find(d => d.id === demande.id)

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

        const errorMsg = useStore.getState().error || "Erreur inconnue"

        alert(`❌ Erreur lors de l\'enregistrement:\n${errorMsg}`)

      }

    } catch (error) {

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

          hasQuantityError = true

        }

        

        // Validation du prix (optionnel mais doit être >= 0 si fourni)

        if (prixStr && (isNaN(prix as number) || (prix as number) < 0)) {

          hasPriceError = true

        }

        

        itemsData.push({

          itemId: item.id,

          quantiteLivree: isNaN(qteLivree) ? 0 : qteLivree,

          prixUnitaire: prix !== null && !isNaN(prix) && prix >= 0 ? prix : null

        })

        

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

        const updatedDemande = useStore.getState().demandes.find(d => d.id === demande.id)

        if (updatedDemande) {

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

          alert("✅ Données enregistrées mais erreur de rechargement. Veuillez rafraîchir la page.")

        }

      } else {

        const errorMsg = useStore.getState().error || "Erreur inconnue"

        alert(`❌ Erreur lors de l'enregistrement:\n${errorMsg}`)

      }

    } catch (error) {

      alert('Erreur lors de la sauvegarde. Veuillez réessayer.')

    } finally {

      setIsSaving(false)

    }

  }



  return (

    <Dialog open={isOpen} onOpenChange={onClose}>

      <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto p-3 sm:p-4 md:p-6" showCloseButton={false}>

        {/* En-tête avec titre */}

        <DialogHeader>

          <div className="relative">

            <DialogTitle className="text-base sm:text-xl font-bold text-center bg-[#015fc4] text-white py-3 px-4 rounded-t">

              Demande {demande.type === "materiel" ? "Matériel" : "Outillage"} de {demande.technicien ? `${demande.technicien.prenom} ${demande.technicien.nom}` : 'N/A'}

            </DialogTitle>

            {demandeStack.length > 0 && (

              <div className="absolute top-2 left-4">

                <Button variant="outline" size="sm" onClick={handleGoBack}>

                  Retour

                </Button>

              </div>

            )}

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



          {demande.typeDemande !== "sous_demande" && sousDemandes.length > 0 && showPriceColumns && (

            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">

                <div className="text-sm font-semibold text-gray-700">

                  Coût total des sous-demandes

                </div>

                <div className="text-xl font-bold text-green-600">

                  {coutSousDemandesTotal.toLocaleString('fr-FR')} FCFA

                </div>

              </div>

              <div className="mt-3 flex flex-wrap gap-2">

                {sousDemandes.map((sd) => (

                  <Button

                    key={sd.id}

                    variant="outline"

                    size="sm"

                    onClick={() => handleOpenSousDemande(sd.id)}

                    className="bg-white"

                  >

                    {sd.numero} ({calculerTotalRestantPourDemande(sd).toLocaleString('fr-FR')} FCFA)

                  </Button>

                ))}

              </div>

            </div>

          )}



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

                          {showPriceColumns && (

                            <TableHead className="font-bold text-center border border-gray-300 py-3 text-xs sm:text-sm bg-green-50 text-green-600">

                              Prix unit. (FCFA) {canEdit && <span className="text-red-500">*</span>}

                            </TableHead>

                          )}

                        </>

                      )}

                      {!showEditableColumns && (

                        <TableHead className="font-bold text-center border border-gray-300 py-3 text-xs sm:text-sm bg-orange-50 text-orange-600">Qté restante</TableHead>

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

                          )}

                          <TableCell className="text-center border border-gray-300 p-3 text-xs sm:text-sm bg-orange-50">

                            <span className={`font-semibold ${qteRestante > 0 ? 'text-orange-600' : 'text-green-600'}`}>

                              {qteRestante}

                            </span>

                          </TableCell>

                          {showEditableColumns && showPriceColumns && (

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

          {showPriceColumns && (

            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">

              <div className="flex justify-between items-center">

                <span className="text-lg font-bold text-gray-700">💰 Coût restant (à acheter) :</span>

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


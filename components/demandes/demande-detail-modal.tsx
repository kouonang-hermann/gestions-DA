"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Loader2, CheckCircle } from "lucide-react"
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
  const { demandes, currentUser, users } = useStore()
  const [demande, setDemande] = useState<Demande | null>(null)
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  const [isValidating, setIsValidating] = useState(false)

  useEffect(() => {
    if (demandeId && demandes.length > 0) {
      const foundDemande = demandes.find(d => d.id === demandeId)
      setDemande(foundDemande || null)
    } else {
      setDemande(null)
    }
  }, [demandeId, demandes])

  // Fonction pour télécharger le PDF selon le type choisi
  const handleDownloadPDF = async (type: PDFType) => {
    if (!demande) return
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
      console.error('Erreur lors de la génération du PDF:', error)
      alert('Erreur lors de la génération du PDF. Veuillez réessayer.')
    } finally {
      setIsGeneratingPDF(false)
    }
  }

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

  const canDownload = demande && demande.status !== "brouillon"

  if (!demande) return null

  // Déterminer si on doit afficher les colonnes de livraison selon le statut
  const showDeliveryColumns = ![
    "brouillon", 
    "soumise", 
    "en_attente_validation_conducteur",
    "en_attente_validation_responsable_travaux",
    "en_attente_validation_charge_affaire"
  ].includes(demande.status)

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        {/* En-tête avec titre */}
        <DialogHeader>
          <DialogTitle className="text-base sm:text-xl font-bold text-center bg-[#015fc4] text-white py-3 px-4 rounded-t">
            Demande {demande.type === "materiel" ? "Matériel" : "Outillage"} de {demande.technicien ? `${demande.technicien.prenom} ${demande.technicien.nom}` : 'N/A'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
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

          {/* Tableau des articles */}
          <div className="border border-gray-300 rounded overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-white border-b-2 border-gray-400">
                  <TableHead className="font-bold text-center border border-gray-300 py-3 text-xs sm:text-sm">Référence</TableHead>
                  <TableHead className="font-bold text-center border border-gray-300 py-3 text-xs sm:text-sm">Désignation</TableHead>
                  <TableHead className="font-bold text-center border border-gray-300 py-3 text-xs sm:text-sm">Unité</TableHead>
                  <TableHead className="font-bold text-center border border-gray-300 py-3 text-xs sm:text-sm">Qté demandée</TableHead>
                  
                  {showValidatedColumn && (
                    <TableHead className="font-bold text-center border border-gray-300 py-3 text-xs sm:text-sm">Qté validée</TableHead>
                  )}
                  
                  {showDeliveryColumns && (
                    <>
                      <TableHead className="font-bold text-center border border-gray-300 py-3 text-xs sm:text-sm bg-blue-50 text-blue-600">Qté livrée</TableHead>
                      <TableHead className="font-bold text-center border border-gray-300 py-3 text-xs sm:text-sm bg-orange-50 text-orange-600">Qté restante</TableHead>
                    </>
                  )}
                  
                  <TableHead className="font-bold text-center border border-gray-300 py-3 text-xs sm:text-sm">Date 1</TableHead>
                  <TableHead className="font-bold text-center border border-gray-300 py-3 text-xs sm:text-sm">Date 2</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {demande.items.map((item, index) => {
                  const qteValidee = item.quantiteValidee || item.quantiteDemandee
                  const qteLivree = item.quantiteSortie || item.quantiteRecue || 0
                  const qteRestante = Math.max(0, qteValidee - qteLivree)

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
                      
                      {showDeliveryColumns && (
                        <>
                          <TableCell className="text-center border border-gray-300 p-3 text-xs sm:text-sm bg-blue-50">
                            <span className="font-semibold text-blue-600">{qteLivree}</span>
                          </TableCell>
                          <TableCell className="text-center border border-gray-300 p-3 text-xs sm:text-sm bg-orange-50">
                            <span className="font-semibold text-orange-600">{qteRestante}</span>
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
          <div className="flex justify-center gap-3 pt-4">
            {canDownload && (
              <PDFTypeSelector
                onSelect={handleDownloadPDF}
                isGenerating={isGeneratingPDF}
                className="px-6 py-2"
              />
            )}
            {canUserValidate && (
              <Button 
                onClick={handleValidate}
                disabled={isValidating}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded flex items-center gap-2"
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
              className="px-8 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded"
            >
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

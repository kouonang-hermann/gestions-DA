"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { Button } from "@/components/ui/button"
import type { Demande } from "@/types"
import PurchaseRequestCard from "@/components/demandes/purchase-request-card"
import { generatePurchaseRequestPDF, generateBonLivraisonPDF, generateBonSortiePDF } from "@/lib/pdf-generator"
import { PDFTypeSelector, type PDFType } from "@/components/demandes/pdf-type-selector"
import { toast } from "sonner"
import { useStore } from "@/stores/useStore"

interface PurchaseRequestDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  demande: Demande | null
}

export default function PurchaseRequestDetailsModal({ 
  isOpen, 
  onClose, 
  demande 
}: PurchaseRequestDetailsModalProps) {
  const { users } = useStore()
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  if (!demande) return null

  const handleDownloadPDF = async (type: PDFType) => {
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
      toast.success("PDF téléchargé avec succès!")
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Erreur lors de la génération du PDF"
      toast.error(errorMessage)
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto p-2">
        <VisuallyHidden>
          <DialogTitle>
            Détails de la demande {demande.numero}
          </DialogTitle>
        </VisuallyHidden>
        
        <div className="space-y-4">
          {/* Composant PurchaseRequestCard pour affichage professionnel */}
          <PurchaseRequestCard
            demande={demande}
            onDownloadPDF={handleDownloadPDF}
            isGeneratingPDF={isGeneratingPDF}
            canValidate={false}
          />

          {/* Bouton fermer */}
          <div className="flex justify-center pt-4">
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

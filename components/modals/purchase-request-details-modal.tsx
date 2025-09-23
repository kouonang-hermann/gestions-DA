"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { Button } from "@/components/ui/button"
import type { Demande } from "@/types"
import PurchaseRequestCard from "@/components/demandes/purchase-request-card"
import { generatePurchaseRequestPDF } from "@/lib/pdf-generator"
import { toast } from "sonner"

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
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  if (!demande) return null

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true)
    try {
      await generatePurchaseRequestPDF(demande)
      toast.success("PDF téléchargé avec succès!")
    } catch (error) {
      console.error("Erreur lors de la génération du PDF:", error)
      toast.error("Erreur lors de la génération du PDF")
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

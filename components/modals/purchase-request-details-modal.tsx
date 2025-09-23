"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@/components/ui/visually-hidden"
import { Button } from "@/components/ui/button"
import type { Demande } from "@/types"
import PurchaseRequestCard from "@/components/demandes/purchase-request-card"

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
  if (!demande) return null

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
            onDownloadPDF={() => {
              // TODO: Implémenter la génération PDF
              console.log("Téléchargement PDF demandé pour demande:", demande.numero)
            }}
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

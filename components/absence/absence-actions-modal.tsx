"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FileText, Plus } from "lucide-react"

interface AbsenceActionsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateNew: () => void
  onViewExisting: () => void
}

export default function AbsenceActionsModal({
  open,
  onOpenChange,
  onCreateNew,
  onViewExisting
}: AbsenceActionsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Demandes d'absence</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <p className="text-sm text-gray-600">
            Que souhaitez-vous faire ?
          </p>
          
          <div className="grid gap-3">
            <Button
              onClick={() => {
                onCreateNew()
                onOpenChange(false)
              }}
              className="w-full justify-start h-auto py-4 px-4"
              variant="outline"
            >
              <div className="flex items-start gap-3 w-full">
                <div className="p-2 rounded-lg bg-green-100">
                  <Plus className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-medium text-gray-900">Créer une nouvelle demande</div>
                  <div className="text-sm text-gray-500 mt-1">
                    Soumettre une nouvelle demande d'absence
                  </div>
                </div>
              </div>
            </Button>

            <Button
              onClick={() => {
                onViewExisting()
                onOpenChange(false)
              }}
              className="w-full justify-start h-auto py-4 px-4"
              variant="outline"
            >
              <div className="flex items-start gap-3 w-full">
                <div className="p-2 rounded-lg bg-blue-100">
                  <FileText className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-left flex-1">
                  <div className="font-medium text-gray-900">Voir mes demandes</div>
                  <div className="text-sm text-gray-500 mt-1">
                    Consulter l'historique de vos demandes d'absence
                  </div>
                </div>
              </div>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

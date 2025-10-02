"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import UniversalClosureList from "@/components/cloture/universal-closure-list"

interface UniversalClosureModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function UniversalClosureModal({ isOpen, onClose }: UniversalClosureModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🏁 Clôture de mes demandes
          </DialogTitle>
        </DialogHeader>
        <UniversalClosureList onClose={onClose} />
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar, FileText } from "lucide-react"
import { NouvelleDemandeModal } from "./nouvelle-demande-modal"
import { useRouter } from "next/navigation"

interface CongesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CongesModal({ open, onOpenChange }: CongesModalProps) {
  const router = useRouter()
  const [nouvelleDemandeOpen, setNouvelleDemandeOpen] = useState(false)

  const handleMesConges = () => {
    onOpenChange(false)
    router.push("/d-conges")
  }

  const handleNouvelledemande = () => {
    onOpenChange(false)
    setNouvelleDemandeOpen(true)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center">
              Gestion des Congés
            </DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-6">
            <Button
              onClick={handleMesConges}
              className="h-20 flex flex-col items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              <FileText className="h-8 w-8" />
              <span className="text-lg font-semibold">Mes Congés</span>
            </Button>

            <Button
              onClick={handleNouvelledemande}
              className="h-20 flex flex-col items-center justify-center gap-2 bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <Calendar className="h-8 w-8" />
              <span className="text-lg font-semibold">Demande de Congés</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <NouvelleDemandeModal
        open={nouvelleDemandeOpen}
        onOpenChange={setNouvelleDemandeOpen}
      />
    </>
  )
}

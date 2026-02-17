"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ContactsUrgence } from "./nouvelle-demande-modal"
import { Loader2 } from "lucide-react"

interface ContactsUrgenceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onValidate: (contacts: ContactsUrgence) => void
  onBack: () => void
}

export function ContactsUrgenceModal({ open, onOpenChange, onValidate, onBack }: ContactsUrgenceModalProps) {
  const [contactPersonnelNom, setContactPersonnelNom] = useState("")
  const [contactPersonnelTel, setContactPersonnelTel] = useState("")
  const [contactAutreNom, setContactAutreNom] = useState("")
  const [contactAutreTel, setContactAutreTel] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    // Validation
    if (!contactPersonnelNom || !contactPersonnelTel) {
      alert("⚠️ Le contact personnel est obligatoire")
      return
    }

    // Validation du format téléphone (simple)
    const phoneRegex = /^[0-9+\s()-]{8,}$/
    if (!phoneRegex.test(contactPersonnelTel)) {
      alert("⚠️ Format de téléphone invalide pour le contact personnel")
      return
    }

    if (contactAutreTel && !phoneRegex.test(contactAutreTel)) {
      alert("⚠️ Format de téléphone invalide pour l'autre contact")
      return
    }

    setSubmitting(true)
    try {
      await onValidate({
        contactPersonnelNom,
        contactPersonnelTel,
        contactAutreNom: contactAutreNom || undefined,
        contactAutreTel: contactAutreTel || undefined
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Nouvelle Demande de Congés - Étape 2/2
          </DialogTitle>
          <p className="text-sm text-gray-500">Contacts en cas d'urgence</p>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Contact personnel */}
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900">Contact personnel</h3>
            
            <div className="grid gap-2">
              <Label htmlFor="contactPersonnelNom">
                Nom <span className="text-red-500">*</span>
              </Label>
              <Input
                id="contactPersonnelNom"
                value={contactPersonnelNom}
                onChange={(e) => setContactPersonnelNom(e.target.value)}
                placeholder="Ex: Marie Dupont"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="contactPersonnelTel">
                Numéro de téléphone <span className="text-red-500">*</span>
              </Label>
              <Input
                id="contactPersonnelTel"
                type="tel"
                value={contactPersonnelTel}
                onChange={(e) => setContactPersonnelTel(e.target.value)}
                placeholder="Ex: 0612345678"
              />
            </div>
          </div>

          {/* Autre contact */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900">Autre contact (optionnel)</h3>
            
            <div className="grid gap-2">
              <Label htmlFor="contactAutreNom">Nom</Label>
              <Input
                id="contactAutreNom"
                value={contactAutreNom}
                onChange={(e) => setContactAutreNom(e.target.value)}
                placeholder="Ex: Jean Martin"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="contactAutreTel">Numéro de téléphone</Label>
              <Input
                id="contactAutreTel"
                type="tel"
                value={contactAutreTel}
                onChange={(e) => setContactAutreTel(e.target.value)}
                placeholder="Ex: 0698765432"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="outline" onClick={onBack} disabled={submitting}>
            ← Retour
          </Button>
          <Button 
            onClick={handleSubmit} 
            className="bg-green-600 hover:bg-green-700"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              "Soumettre la demande"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

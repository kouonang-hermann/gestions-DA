"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DemandeInfosModal } from "./demande-infos-modal"
import { ContactsUrgenceModal } from "./contacts-urgence-modal"
import { useStore } from "@/stores/useStore"

interface NouvelleDemandeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export interface DemandeInfos {
  matricule: string
  anciennete: string
  responsableId: string
  responsableNom: string
  typeConge: string
  autresPrecision?: string
  dateDebut: string
  dateFin: string
}

export interface ContactsUrgence {
  contactPersonnelNom: string
  contactPersonnelTel: string
  contactAutreNom?: string
  contactAutreTel?: string
}

export function NouvelleDemandeModal({ open, onOpenChange }: NouvelleDemandeModalProps) {
  const [step, setStep] = useState<"infos" | "contacts">("infos")
  const [demandeInfos, setDemandeInfos] = useState<DemandeInfos | null>(null)

  const handleInfosValidated = (infos: DemandeInfos) => {
    setDemandeInfos(infos)
    setStep("contacts")
  }

  const handleContactsValidated = async (contacts: ContactsUrgence) => {
    if (!demandeInfos) return

    // Soumettre la demande
    try {
      const token = useStore.getState().token
      const response = await fetch("/api/conges", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          ...demandeInfos,
          ...contacts
        })
      })

      const data = await response.json()

      if (data.success) {
        // Soumettre automatiquement la demande
        const submitResponse = await fetch(`/api/conges/${data.data.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: JSON.stringify({
            action: "soumettre"
          })
        })

        const submitData = await submitResponse.json()

        if (submitData.success) {
          // Réinitialiser et fermer
          setStep("infos")
          setDemandeInfos(null)
          onOpenChange(false)
          
          // Afficher un message de succès
          alert(`✅ Demande de congé soumise avec succès!\nNuméro: ${data.data.numero}\n\nVotre demande a été envoyée à votre responsable hiérarchique pour validation.`)
        } else {
          alert(`❌ Erreur lors de la soumission: ${submitData.error}`)
        }
      } else {
        alert(`❌ Erreur: ${data.error}`)
      }
    } catch (error: any) {
      console.error("Erreur lors de la création de la demande:", error)
      alert(`❌ Erreur: ${error.message}`)
    }
  }

  const handleClose = () => {
    setStep("infos")
    setDemandeInfos(null)
    onOpenChange(false)
  }

  return (
    <>
      {step === "infos" && (
        <DemandeInfosModal
          open={open}
          onOpenChange={handleClose}
          onValidate={handleInfosValidated}
        />
      )}

      {step === "contacts" && (
        <ContactsUrgenceModal
          open={open}
          onOpenChange={handleClose}
          onValidate={handleContactsValidated}
          onBack={() => setStep("infos")}
        />
      )}
    </>
  )
}

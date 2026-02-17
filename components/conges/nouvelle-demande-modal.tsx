"use client"

import { useState } from "react"
import { DemandeInfosModal } from "./demande-infos-modal"
import { ContactsUrgenceModal } from "./contacts-urgence-modal"

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
      const token = localStorage.getItem("token")
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
        // Réinitialiser et fermer
        setStep("infos")
        setDemandeInfos(null)
        onOpenChange(false)
        
        // Afficher un message de succès
        alert(`✅ Demande de congé créée avec succès!\nNuméro: ${data.data.numero}`)
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

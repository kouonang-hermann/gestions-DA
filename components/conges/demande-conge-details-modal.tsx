"use client"

import { useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Calendar, User, Phone, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStore } from "@/stores/useStore"
import type { DemandeConge } from "@/types"

interface DemandeCongeDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  demande: DemandeConge | null
  onUpdated?: () => void
}

export default function DemandeCongeDetailsModal({
  isOpen,
  onClose,
  demande,
  onUpdated
}: DemandeCongeDetailsModalProps) {
  const { currentUser } = useStore()
  const [isEditingDates, setIsEditingDates] = useState(false)
  const [isSavingDates, setIsSavingDates] = useState(false)

  const canEditDates = useMemo(() => {
    const role = currentUser?.role
    return role === "superadmin" || role === "responsable_rh" || role === "directeur_general"
  }, [currentUser?.role])

  const currentDateDebut = demande?.dateDebutFinale || demande?.dateDebut
  const currentDateFin = demande?.dateFinFinale || demande?.dateFin
  const currentNombreJours = demande?.nombreJoursFinal ?? demande?.nombreJours

  const [dateDebutEdit, setDateDebutEdit] = useState(() =>
    currentDateDebut ? new Date(currentDateDebut).toISOString().slice(0, 10) : ""
  )
  const [dateFinEdit, setDateFinEdit] = useState(() =>
    currentDateFin ? new Date(currentDateFin).toISOString().slice(0, 10) : ""
  )

  if (!demande) return null

  const handleSaveDates = async () => {
    if (!canEditDates) return

    setIsSavingDates(true)
    try {
      const token = useStore.getState().token
      const response = await fetch(`/api/conges/${demande.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          action: "modifier_dates",
          dateDebutModifiee: dateDebutEdit,
          dateFinModifiee: dateFinEdit,
        }),
      })

      const data = await response.json()
      if (!data.success) {
        alert(`❌ Erreur: ${data.error}`)
        return
      }

      setIsEditingDates(false)
      onUpdated?.()
      alert("✅ Dates modifiées avec succès")
      onClose()
    } catch (error) {
      console.error("Erreur modification dates:", error)
      alert("❌ Erreur lors de la modification des dates")
    } finally {
      setIsSavingDates(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      brouillon: { label: "Brouillon", className: "bg-gray-500" },
      soumise: { label: "Soumise", className: "bg-blue-500" },
      en_attente_validation_hierarchique: { label: "En attente validation hiérarchique", className: "bg-orange-500" },
      en_attente_validation_rh: { label: "En attente validation RH", className: "bg-yellow-500" },
      en_attente_visa_dg: { label: "En attente visa DG", className: "bg-purple-500" },
      approuvee: { label: "Approuvée", className: "bg-green-600" },
      rejetee: { label: "Rejetée", className: "bg-red-600" },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, className: "bg-gray-500" }
    return <Badge className={`${config.className} text-white`}>{config.label}</Badge>
  }

  const getTypeCongeLabel = (type: string) => {
    const types: Record<string, string> = {
      annuel: "Congés annuel",
      maladie: "Congés maladie",
      parental: "Congés de parental",
      recuperation: "Congés pour récupération",
      autres: "Autres"
    }
    return types[type] || type
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Détails de la demande n°{demande.numero}</span>
            {getStatusBadge(demande.status)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations employé */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Informations de l'employé
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Nom complet</p>
                <p className="font-medium">{demande.employe?.prenom} {demande.employe?.nom}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Matricule</p>
                <p className="font-medium">{demande.matricule}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ancienneté</p>
                <p className="font-medium">{demande.anciennete}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-sm">{demande.employe?.email}</p>
              </div>
            </div>
          </div>

          {/* Informations sur le congé */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Détails du congé
            </h3>

            {canEditDates && (
              <div className="flex justify-end mb-3">
                {!isEditingDates ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditingDates(true)}>
                    Modifier dates
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditingDates(false)
                        setDateDebutEdit(currentDateDebut ? new Date(currentDateDebut).toISOString().slice(0, 10) : "")
                        setDateFinEdit(currentDateFin ? new Date(currentDateFin).toISOString().slice(0, 10) : "")
                      }}
                      disabled={isSavingDates}
                    >
                      Annuler
                    </Button>
                    <Button size="sm" onClick={handleSaveDates} disabled={isSavingDates}>
                      {isSavingDates ? "Enregistrement..." : "Enregistrer"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Type de congé</p>
                <p className="font-medium">{getTypeCongeLabel(demande.typeConge)}</p>
                {demande.autresPrecision && (
                  <p className="text-sm text-gray-500 italic mt-1">{demande.autresPrecision}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">Nombre de jours</p>
                <p className="font-medium">{currentNombreJours} jour(s)</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date de début</p>
                {isEditingDates ? (
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                    value={dateDebutEdit}
                    onChange={(e) => setDateDebutEdit(e.target.value)}
                    disabled={isSavingDates}
                  />
                ) : (
                  <p className="font-medium">{currentDateDebut ? new Date(currentDateDebut).toLocaleDateString('fr-FR') : 'N/A'}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">Date de fin</p>
                {isEditingDates ? (
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm"
                    value={dateFinEdit}
                    onChange={(e) => setDateFinEdit(e.target.value)}
                    disabled={isSavingDates}
                  />
                ) : (
                  <p className="font-medium">{currentDateFin ? new Date(currentDateFin).toLocaleDateString('fr-FR') : 'N/A'}</p>
                )}
              </div>
              {demande.resteJours !== undefined && (
                <div>
                  <p className="text-sm text-gray-600">Reste de jours</p>
                  <p className="font-medium">{demande.resteJours} jour(s)</p>
                </div>
              )}
            </div>
          </div>

          {/* Responsable hiérarchique */}
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <User className="h-5 w-5 text-purple-600" />
              Responsable hiérarchique
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Nom</p>
                <p className="font-medium">{demande.responsableNom}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Téléphone</p>
                <p className="font-medium">{demande.responsableTel}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{demande.responsableEmail}</p>
              </div>
            </div>
          </div>

          {/* Contacts pendant l'absence */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Phone className="h-5 w-5 text-yellow-600" />
              Contacts pendant l'absence
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 font-semibold">Contact personnel</p>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div>
                    <p className="text-xs text-gray-500">Nom</p>
                    <p className="font-medium">{demande.contactPersonnelNom}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Téléphone</p>
                    <p className="font-medium">{demande.contactPersonnelTel}</p>
                  </div>
                </div>
              </div>
              {demande.contactAutreNom && (
                <div>
                  <p className="text-sm text-gray-600 font-semibold">Autre contact</p>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <div>
                      <p className="text-xs text-gray-500">Nom</p>
                      <p className="font-medium">{demande.contactAutreNom}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Téléphone</p>
                      <p className="font-medium">{demande.contactAutreTel}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Informations de suivi */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-600" />
              Suivi de la demande
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Date de création</p>
                <p className="font-medium">{new Date(demande.dateCreation).toLocaleDateString('fr-FR')}</p>
              </div>
              {demande.dateSoumission && (
                <div>
                  <p className="text-sm text-gray-600">Date de soumission</p>
                  <p className="font-medium">{new Date(demande.dateSoumission).toLocaleDateString('fr-FR')}</p>
                </div>
              )}
              {demande.dateValidation && (
                <div>
                  <p className="text-sm text-gray-600">Date de validation</p>
                  <p className="font-medium">{new Date(demande.dateValidation).toLocaleDateString('fr-FR')}</p>
                </div>
              )}
              {demande.rejetMotif && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-600">Motif du rejet</p>
                  <p className="font-medium text-red-600">{demande.rejetMotif}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

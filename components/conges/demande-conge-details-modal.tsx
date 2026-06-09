"use client"

import { useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Calendar, User, Phone, Clock, Trash2, CheckCircle2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useStore } from "@/stores/useStore"
import { useEnsureSignature } from "@/hooks/use-ensure-signature"
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
  const { ensureSignature } = useEnsureSignature()
  const [isEditingDates, setIsEditingDates] = useState(false)
  const [isSavingDates, setIsSavingDates] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)

  // Détermine si l'utilisateur connecté peut valider/rejeter la demande
  // à l'étape courante (responsable hiérarchique, RH, DG, ou superadmin).
  const canValidate = useMemo(() => {
    if (!currentUser || !demande) return false
    const role = currentUser.role as string
    if (role === "superadmin") {
      return [
        "en_attente_validation_hierarchique",
        "en_attente_validation_rh",
        "en_attente_visa_dg",
      ].includes(demande.status)
    }
    if (
      demande.status === "en_attente_validation_hierarchique" &&
      demande.responsableId === currentUser.id
    ) {
      return true
    }
    if (demande.status === "en_attente_validation_rh" && role === "responsable_rh") {
      return true
    }
    if (demande.status === "en_attente_visa_dg" && role === "directeur_general") {
      return true
    }
    return false
  }, [currentUser, demande])

  // L'étiquette du bouton "Valider" est contextualisée par l'étape
  const validateLabel = useMemo(() => {
    if (!demande) return "Valider"
    switch (demande.status) {
      case "en_attente_validation_hierarchique":
        return "Valider (Responsable)"
      case "en_attente_validation_rh":
        return "Valider (RH)"
      case "en_attente_visa_dg":
        return "Apposer le visa DG"
      default:
        return "Valider"
    }
  }, [demande])

  // Peuvent modifier les dates :
  //  - superadmin, RH, DG (toujours)
  //  - le responsable hiérarchique assigné à la demande
  // Sauf si la demande est déjà approuvée (uniquement superadmin dans ce cas).
  const canEditDates = useMemo(() => {
    if (!currentUser || !demande) return false
    const role = currentUser.role as string
    const isPrivileged =
      role === "superadmin" || role === "responsable_rh" || role === "directeur_general"
    const isAssignedResponsable = demande.responsableId === currentUser.id
    if (demande.status === "approuvee" && role !== "superadmin") return false
    return isPrivileged || isAssignedResponsable
  }, [currentUser, demande])

  // Le bouton "Supprimer" est visible pour les responsables intervenant
  // (responsable hiérarchique de la demande, RH, DG, superadmin),
  // ainsi que pour l'employé propriétaire si sa demande est encore en brouillon.
  const canDelete = useMemo(() => {
    if (!currentUser || !demande) return false
    const role = currentUser.role as string
    const isOwner = demande.employeId === currentUser.id
    const isResponsable = demande.responsableId === currentUser.id
    const isPrivilegedRole =
      role === "superadmin" || role === "responsable_rh" || role === "directeur_general"
    // On bloque la suppression si la demande est déjà approuvée (sauf superadmin)
    if (demande.status === "approuvee" && role !== "superadmin") return false
    return isPrivilegedRole || isResponsable || (isOwner && demande.status === "brouillon")
  }, [currentUser, demande])

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

  const callAction = async (
    action: "valider" | "rejeter",
    commentaire?: string
  ): Promise<boolean> => {
    if (!demande) return false
    const token = useStore.getState().token
    const response = await fetch(`/api/conges/${demande.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ action, commentaire }),
    })
    const data = await response.json()
    if (!data.success) {
      alert(`❌ Erreur: ${data.error}`)
      return false
    }
    return true
  }

  const handleValidate = async () => {
    if (!demande || !canValidate) return

    const confirmation = window.confirm(
      `Confirmez-vous la validation de la demande n°${demande.numero} ?`
    )
    if (!confirmation) return

    // Exiger une signature avant la validation (le valideur signe son acte)
    const signature = await ensureSignature(
      `Votre signature sera apposée sur la validation de la demande n°${demande.numero}.`
    )
    if (!signature) return // utilisateur a annulé -> on abandonne

    const commentaire = window.prompt("Commentaire (facultatif) :") || undefined

    setIsValidating(true)
    try {
      const ok = await callAction("valider", commentaire)
      if (ok) {
        alert("✅ Demande validée avec succès")
        onUpdated?.()
        onClose()
      }
    } catch (error) {
      console.error("Erreur validation:", error)
      alert("❌ Erreur lors de la validation")
    } finally {
      setIsValidating(false)
    }
  }

  const handleReject = async () => {
    if (!demande || !canValidate) return

    const motif = window.prompt(
      `Motif du rejet de la demande n°${demande.numero} (obligatoire) :`
    )
    if (!motif || !motif.trim()) {
      if (motif !== null) alert("❌ Un motif de rejet est requis")
      return
    }

    // Exiger une signature avant le rejet (le valideur signe son acte)
    const signature = await ensureSignature(
      `Votre signature sera apposée sur le rejet de la demande n°${demande.numero}.`
    )
    if (!signature) return // utilisateur a annulé -> on abandonne

    setIsRejecting(true)
    try {
      const ok = await callAction("rejeter", motif.trim())
      if (ok) {
        alert("✅ Demande rejetée")
        onUpdated?.()
        onClose()
      }
    } catch (error) {
      console.error("Erreur rejet:", error)
      alert("❌ Erreur lors du rejet")
    } finally {
      setIsRejecting(false)
    }
  }

  const handleDelete = async () => {
    if (!demande || !canDelete) return

    const confirmation = window.confirm(
      `⚠️ Voulez-vous vraiment supprimer la demande n°${demande.numero} ?\n\nCette action est définitive et ne peut pas être annulée.`
    )
    if (!confirmation) return

    setIsDeleting(true)
    try {
      const token = useStore.getState().token
      const response = await fetch(`/api/conges/${demande.id}`, {
        method: "DELETE",
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })

      const data = await response.json()
      if (!data.success) {
        alert(`❌ Erreur: ${data.error}`)
        return
      }

      alert("✅ Demande supprimée avec succès")
      onUpdated?.()
      onClose()
    } catch (error) {
      console.error("Erreur suppression demande:", error)
      alert("❌ Erreur lors de la suppression de la demande")
    } finally {
      setIsDeleting(false)
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
          <DialogTitle className="flex items-center justify-between gap-2 pr-8">
            <span>Détails de la demande n°{demande.numero}</span>
            <div className="flex items-center gap-2">
              {getStatusBadge(demande.status)}
              {canDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
                  title="Supprimer cette demande"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {isDeleting ? "Suppression..." : "Supprimer"}
                </Button>
              )}
            </div>
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

          {/* Barre d'action : Valider / Rejeter (selon l'étape de validation) */}
          {canValidate && (
            <div className="sticky bottom-0 -mx-1 mt-2 flex flex-col sm:flex-row gap-2 sm:justify-end border-t pt-4 bg-white">
              <Button
                variant="outline"
                onClick={handleReject}
                disabled={isValidating || isRejecting}
                className="border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
              >
                <XCircle className="h-4 w-4 mr-2" />
                {isRejecting ? "Rejet en cours..." : "Rejeter"}
              </Button>
              <Button
                onClick={handleValidate}
                disabled={isValidating || isRejecting}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {isValidating ? "Validation..." : validateLabel}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

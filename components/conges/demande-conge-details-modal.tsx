"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Calendar, User, Mail, Phone, Clock, FileText, CheckCircle2, XCircle } from "lucide-react"
import type { DemandeConge } from "@/types"

interface DemandeCongeDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  demande: DemandeConge | null
}

export default function DemandeCongeDetailsModal({
  isOpen,
  onClose,
  demande
}: DemandeCongeDetailsModalProps) {
  if (!demande) return null

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
                <p className="font-medium">{demande.nombreJours} jour(s)</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date de début</p>
                <p className="font-medium">{new Date(demande.dateDebut).toLocaleDateString('fr-FR')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Date de fin</p>
                <p className="font-medium">{new Date(demande.dateFin).toLocaleDateString('fr-FR')}</p>
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

"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, Loader2 } from "lucide-react"
import type { Demande } from "@/types"

interface PurchaseRequestCardProps {
  logoUrl?: string
  demande: Demande | null
  onValidate?: (action: "valider" | "rejeter") => void
  canValidate?: boolean
  onDownloadPDF?: () => void | Promise<void>
  isGeneratingPDF?: boolean
}

export default function PurchaseRequestCard({
  logoUrl = '/placeholder-logo.png',
  demande,
  onValidate,
  canValidate = false,
  onDownloadPDF,
  isGeneratingPDF = false
}: PurchaseRequestCardProps) {
  if (!demande) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case "brouillon":
        return "bg-gray-100 text-gray-800"
      case "soumise":
        return "bg-blue-100 text-blue-800"
      case "en_attente_validation_conducteur":
      case "en_attente_validation_logistique":
      case "en_attente_validation_responsable_travaux":
      case "en_attente_validation_charge_affaire":
      case "en_attente_preparation_appro":
      case "en_attente_validation_logistique":
      case "en_attente_validation_finale_demandeur":
        return "bg-orange-100 text-orange-800"
      case "confirmee_demandeur":
      case "cloturee":
        return "bg-green-100 text-green-800"
      case "rejetee":
        return "bg-red-100 text-red-800"
      case "archivee":
        return "bg-gray-100 text-gray-600"
      default:
        return "bg-gray-100 text-gray-600"
    }
  }

  const formatStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      "brouillon": "Brouillon",
      "soumise": "Soumise",
      "en_attente_validation_conducteur": "En attente validation conducteur",
      "en_attente_validation_logistique": "En attente validation logistique",
      "en_attente_validation_responsable_travaux": "En attente validation responsable travaux",
      "en_attente_validation_charge_affaire": "En attente validation chargé d'affaire",
      "en_attente_preparation_appro": "En attente préparation appro",
      "en_attente_validation_finale_demandeur": "En attente validation finale demandeur",
      "cloturee": "Clôturée",
      "rejetee": "Rejetée",
      "archivee": "Archivée",
      "confirmee_demandeur": "Confirmée demandeur"
    }
    return statusMap[status] || status
  }

  const getValidationSteps = () => {
    const steps = []
    
    // Ajouter les validations existantes selon les vraies propriétés du type Demande
    if (demande.validationConducteur) {
      steps.push({
        step: "Validation Conducteur",
        validator: `${demande.validationConducteur.user?.prenom || ''} ${demande.validationConducteur.user?.nom || ''}`.trim(),
        date: new Date(demande.validationConducteur.date).toLocaleDateString('fr-FR'),
        status: 'Validé'
      })
    }

    if (demande.validationLogistique) {
      steps.push({
        step: "Validation QHSE",
        validator: `${demande.validationLogistique.user?.prenom || ''} ${demande.validationLogistique.user?.nom || ''}`.trim(),
        date: new Date(demande.validationLogistique.date).toLocaleDateString('fr-FR'),
        status: 'Validé'
      })
    }

    if (demande.validationChargeAffaire) {
      steps.push({
        step: "Validation Chargé Affaire",
        validator: `${demande.validationChargeAffaire.user?.prenom || ''} ${demande.validationChargeAffaire.user?.nom || ''}`.trim(),
        date: new Date(demande.validationChargeAffaire.date).toLocaleDateString('fr-FR'),
        status: 'Validé'
      })
    }

    if (demande.sortieAppro) {
      steps.push({
        step: "Préparation Sortie",
        validator: `${demande.sortieAppro.user?.prenom || ''} ${demande.sortieAppro.user?.nom || ''}`.trim(),
        date: new Date(demande.sortieAppro.date).toLocaleDateString('fr-FR'),
        status: 'Préparé'
      })
    }

    if (demande.validationFinale) {
      steps.push({
        step: "Validation Finale",
        validator: `${demande.validationFinale.user?.prenom || ''} ${demande.validationFinale.user?.nom || ''}`.trim(),
        date: new Date(demande.validationFinale.date).toLocaleDateString('fr-FR'),
        status: 'Validé'
      })
    }

    return steps
  }

  const getStepLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      "conducteur": "Validation Conducteur",
      "qhse": "Validation QHSE",
      "responsable_travaux": "Validation Responsable Travaux",
      "charge_affaire": "Validation Chargé Affaire",
      "appro": "Préparation Appro",
      "logistique": "Validation Logistique",
      "finale": "Validation Finale"
    }
    return labels[type] || type
  }

  return (
    <div id="purchase-request-card" className="max-w-4xl mx-auto bg-white shadow-lg rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src={logoUrl} alt="Logo" className="w-20 h-20 object-contain" />
          <div>
            <h1 className="text-2xl font-semibold">DEMANDE D'ACHAT</h1>
            <p className="text-sm text-gray-500">Numéro : {demande.numero}</p>
          </div>
        </div>

        <div className="text-right">
          <Badge className={getStatusColor(demande.status)}>
            {formatStatus(demande.status)}
          </Badge>
        </div>
      </div>

      <hr className="my-4" />

      <section className="grid grid-cols-2 gap-4 mb-6">
        <div className="space-y-2">
          <div className="text-xs text-gray-500">Nom du demandeur</div>
          <div className="font-medium">
            {demande.technicien ? `${demande.technicien.prenom} ${demande.technicien.nom}` : '__________'}
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-xs text-gray-500">Projet</div>
          <div className="font-medium">{demande.projet?.nom || '__________'}</div>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-gray-500">Type de demande</div>
          <div className="font-medium">{demande.type === 'materiel' ? 'Matériel' : 'Outillage'}</div>
        </div>
        <div className="space-y-2">
          <div className="text-xs text-gray-500">Motif</div>
          <div className="font-medium">{demande.commentaires || '__________'}</div>
        </div>

        <div className="space-y-2">
          <div className="text-xs text-gray-500">Date d'émission</div>
          <div className="font-medium">
            {new Date(demande.dateCreation).toLocaleDateString('fr-FR')}
          </div>
        </div>
        <div className="space-y-2">
          <div className="text-xs text-gray-500">Date de livraison prévue</div>
          <div className="font-medium">
            {demande.dateLivraisonSouhaitee 
              ? new Date(demande.dateLivraisonSouhaitee).toLocaleDateString('fr-FR')
              : '__/__/____'
            }
          </div>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Liste des articles</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm border-collapse border border-gray-200">
            <thead>
              <tr className="text-left text-gray-600 bg-gray-50">
                <th className="pb-2 px-3 py-2 border border-gray-200">Désignation</th>
                <th className="pb-2 px-3 py-2 border border-gray-200">Référence</th>
                <th className="pb-2 px-3 py-2 border border-gray-200">Qté Demandée</th>
                <th className="pb-2 px-3 py-2 border border-gray-200">Qté Validée</th>
                <th className="pb-2 px-3 py-2 border border-gray-200 bg-blue-50">Qté Livrée</th>
                <th className="pb-2 px-3 py-2 border border-gray-200 bg-orange-50">Qté Restante</th>
                <th className="pb-2 px-3 py-2 border border-gray-200">Unité</th>
              </tr>
            </thead>
            <tbody>
              {demande.items.length === 0 ? (
                <tr>
                  <td className="py-4 px-3 border border-gray-200" colSpan={7}>Aucun article</td>
                </tr>
              ) : (
                demande.items.map((item, i) => {
                  const quantiteValidee = item.quantiteValidee || item.quantiteDemandee
                  const quantiteLivree = item.quantiteSortie || 0
                  const quantiteRestante = Math.max(0, quantiteValidee - quantiteLivree)
                  
                  return (
                    <tr key={i} className="border-t">
                      <td className="py-2 px-3 border border-gray-200">{item.article?.nom || 'N/A'}</td>
                      <td className="py-2 px-3 border border-gray-200">{item.article?.reference || 'N/A'}</td>
                      <td className="py-2 px-3 border border-gray-200">{item.quantiteDemandee}</td>
                      <td className="py-2 px-3 border border-gray-200">{quantiteValidee}</td>
                      <td className="py-2 px-3 border border-gray-200 bg-blue-50 font-medium text-blue-700">{quantiteLivree}</td>
                      <td className="py-2 px-3 border border-gray-200 bg-orange-50 font-medium text-orange-700">{quantiteRestante}</td>
                      <td className="py-2 px-3 border border-gray-200">{item.article?.unite || 'N/A'}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Validation / Suivi</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getValidationSteps().length === 0 ? (
            <div className="col-span-3 text-sm text-gray-600">Aucune validation enregistrée.</div>
          ) : (
            getValidationSteps().map((validation, i) => (
              <div key={i} className="p-3 border rounded-lg bg-gray-50">
                <div className="text-xs text-gray-500">Étape</div>
                <div className="font-medium">{validation.step}</div>
                <div className="text-xs text-gray-500 mt-2">Validateur</div>
                <div className="text-sm">{validation.validator || '__________'}</div>
                <div className="text-xs text-gray-500 mt-2">Date</div>
                <div className="text-sm">{validation.date}</div>
                <div className="text-xs text-gray-500 mt-2">Statut</div>
                <Badge className="text-xs bg-green-100 text-green-800">{validation.status}</Badge>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="mt-6 flex justify-end gap-3">
        {onDownloadPDF && (
          <Button 
            variant="outline" 
            onClick={onDownloadPDF} 
            disabled={isGeneratingPDF}
            className="flex items-center gap-2"
          >
            {isGeneratingPDF ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Download size={16} />
            )}
            Télécharger PDF
          </Button>
        )}
        {canValidate && onValidate && (
          <>
            <Button 
              variant="outline" 
              onClick={() => onValidate("rejeter")}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Rejeter
            </Button>
            <Button 
              onClick={() => onValidate("valider")}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Valider
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

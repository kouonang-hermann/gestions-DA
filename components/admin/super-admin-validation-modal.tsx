"use client"

import { useState, useEffect } from "react"
import { useStore } from "@/stores/useStore"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  User,
  Building2,
  Calendar,
  Package,
  ArrowRight,
  Loader2
} from "lucide-react"
import { Demande } from "@/types"

interface SuperAdminValidationModalProps {
  isOpen: boolean
  onClose: () => void
  demandeId: string
  onValidated: () => void
}

export default function SuperAdminValidationModal({
  isOpen,
  onClose,
  demandeId,
  onValidated
}: SuperAdminValidationModalProps) {
  const { token, currentUser } = useStore()
  const [demande, setDemande] = useState<Demande | null>(null)
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [targetStatus, setTargetStatus] = useState<string>("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (isOpen && demandeId) {
      loadDemande()
    }
  }, [isOpen, demandeId])

  const loadDemande = async () => {
    if (!token) return

    setLoading(true)
    setError("")
    try {
      const response = await fetch(`/api/demandes/${demandeId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      const result = await response.json()

      if (result.success) {
        setDemande(result.data)
        // Par défaut, sélectionner le statut suivant logique
        setTargetStatus(getNextLogicalStatus(result.data.status))
      } else {
        setError(result.error || "Erreur lors du chargement")
      }
    } catch (error) {
      setError("Erreur de connexion")
    } finally {
      setLoading(false)
    }
  }

  const getNextLogicalStatus = (currentStatus: string): string => {
    const statusFlow: Record<string, string> = {
      "soumise": "en_attente_validation_conducteur",
      "en_attente_validation_conducteur": "en_attente_validation_responsable_travaux",
      "en_attente_validation_logistique": "en_attente_validation_responsable_travaux",
      "en_attente_validation_responsable_travaux": "en_attente_validation_charge_affaire",
      "en_attente_validation_charge_affaire": "en_attente_preparation_appro",
      "en_attente_preparation_appro": "en_attente_reception_livreur",
      "en_attente_reception_livreur": "en_attente_livraison",
      "en_attente_livraison": "en_attente_validation_finale_demandeur",
      "en_attente_validation_finale_demandeur": "cloturee",
    }
    return statusFlow[currentStatus] || "cloturee"
  }

  const availableStatuses = [
    { value: "en_attente_validation_conducteur", label: "Attente Validation Conducteur" },
    { value: "en_attente_validation_logistique", label: "Attente Validation Logistique" },
    { value: "en_attente_validation_responsable_travaux", label: "Attente Validation Resp. Travaux" },
    { value: "en_attente_validation_charge_affaire", label: "Attente Validation Chargé Affaire" },
    { value: "en_attente_preparation_appro", label: "Attente Préparation Appro" },
    { value: "en_attente_reception_livreur", label: "Attente Réception Livreur" },
    { value: "en_attente_livraison", label: "Attente Livraison" },
    { value: "en_attente_validation_finale_demandeur", label: "Attente Validation Finale" },
    { value: "cloturee", label: "Clôturée" },
    { value: "rejetee", label: "Rejetée" },
  ]

  const handleValidate = async () => {
    if (!token || !demande || !targetStatus) return

    setValidating(true)
    setError("")

    try {
      const response = await fetch(`/api/demandes/${demande.id}/actions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          action: "superadmin_validation",
          targetStatus: targetStatus,
          notifyValidators: true
        }),
      })

      const result = await response.json()

      if (result.success) {
        onValidated()
      } else {
        setError(result.error || "Erreur lors de la validation")
      }
    } catch (error) {
      setError("Erreur de connexion")
    } finally {
      setValidating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      "soumise": { label: "Soumise", className: "bg-blue-100 text-blue-800" },
      "en_attente_validation_conducteur": { label: "Attente Conducteur", className: "bg-yellow-100 text-yellow-800" },
      "en_attente_validation_logistique": { label: "Attente Logistique", className: "bg-purple-100 text-purple-800" },
      "en_attente_validation_responsable_travaux": { label: "Attente Resp. Travaux", className: "bg-orange-100 text-orange-800" },
      "en_attente_validation_charge_affaire": { label: "Attente Chargé Affaire", className: "bg-pink-100 text-pink-800" },
      "en_attente_preparation_appro": { label: "Attente Préparation Appro", className: "bg-indigo-100 text-indigo-800" },
      "en_attente_reception_livreur": { label: "Attente Réception Livreur", className: "bg-cyan-100 text-cyan-800" },
      "en_attente_livraison": { label: "Attente Livraison", className: "bg-teal-100 text-teal-800" },
      "en_attente_validation_finale_demandeur": { label: "Attente Validation Finale", className: "bg-green-100 text-green-800" },
      "cloturee": { label: "Clôturée", className: "bg-gray-100 text-gray-800" },
      "rejetee": { label: "Rejetée", className: "bg-red-100 text-red-800" },
    }

    const config = statusConfig[status] || { label: status, className: "bg-gray-100 text-gray-800" }
    return <Badge className={config.className}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!demande) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">Validation Super Admin - {demande.numero}</span>
            <Badge className="bg-red-600 text-white">Super Admin</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations principales */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                <User className="w-4 h-4" />
                Demandeur
              </div>
              <div className="font-medium">
                {demande.technicien?.nom} {demande.technicien?.prenom}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                <Building2 className="w-4 h-4" />
                Projet
              </div>
              <div className="font-medium">
                {demande.projet?.nom || "N/A"}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Date de création
              </div>
              <div className="font-medium">
                {new Date(demande.dateCreation).toLocaleDateString("fr-FR")}
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-600 mb-1">Type</div>
              <Badge className={demande.type === "materiel" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}>
                {demande.type === "materiel" ? "Matériel" : "Outillage"}
              </Badge>
            </div>
          </div>

          {/* Articles demandés */}
          <div>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Articles demandés ({demande.items?.length || 0})
            </h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Article</th>
                    <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Qté demandée</th>
                    <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Qté validée</th>
                    <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Qté sortie</th>
                    {demande.coutTotal && (
                      <th className="px-4 py-2 text-right text-sm font-medium text-gray-700">Prix unitaire</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {demande.items?.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium">{item.article?.nom || "N/A"}</div>
                        {item.article?.reference && (
                          <div className="text-xs text-gray-500">Réf: {item.article.reference}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">{item.quantiteDemandee}</td>
                      <td className="px-4 py-3 text-center">
                        {item.quantiteValidee !== null && item.quantiteValidee !== undefined ? (
                          <span className="font-medium text-green-600">{item.quantiteValidee}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.quantiteSortie !== null && item.quantiteSortie !== undefined ? (
                          <span className="font-medium text-blue-600">{item.quantiteSortie}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      {demande.coutTotal && (
                        <td className="px-4 py-3 text-right">
                          {item.prixUnitaire ? (
                            <span className="font-medium">{item.prixUnitaire.toLocaleString("fr-FR")} FCFA</span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Coût total */}
          {demande.coutTotal && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Coût total de la demande</div>
              <div className="text-2xl font-bold text-green-700">
                {demande.coutTotal.toLocaleString("fr-FR")} FCFA
              </div>
            </div>
          )}

          {/* Sélection du statut cible */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Validation Super Admin
            </h3>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-orange-800">
                <strong>Attention :</strong> En tant que super admin, vous pouvez faire passer cette demande à n'importe quel statut. 
                Les validateurs concernés seront notifiés de votre action.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Statut actuel
                  </label>
                  {getStatusBadge(demande.status)}
                </div>

                <ArrowRight className="w-6 h-6 text-gray-400 mt-6" />

                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Nouveau statut
                  </label>
                  <Select value={targetStatus} onValueChange={setTargetStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un statut" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableStatuses.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                  {error}
                </div>
              )}

              <div className="flex gap-3 justify-end pt-4">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={validating}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleValidate}
                  disabled={validating || !targetStatus}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {validating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Validation en cours...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Valider et changer le statut
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

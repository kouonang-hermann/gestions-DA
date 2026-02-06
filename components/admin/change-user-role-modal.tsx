"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, UserCog, History } from "lucide-react"
import type { User, UserRole } from "@/types"
import { useStore } from "@/stores/useStore"

interface ChangeUserRoleModalProps {
  isOpen: boolean
  onClose: () => void
  user: User | null
  onRoleChanged?: () => void
}

const ROLES: { value: UserRole; label: string; description: string }[] = [
  { 
    value: "employe", 
    label: "Employé", 
    description: "Utilisateur standard, peut créer des demandes" 
  },
  { 
    value: "conducteur_travaux", 
    label: "Conducteur de Travaux", 
    description: "Valide les demandes de matériel" 
  },
  { 
    value: "responsable_travaux", 
    label: "Responsable des Travaux", 
    description: "Valide après conducteur ou QHSE" 
    
  },
  { 
    value: "responsable_logistique", 
    label: "Responsable Logistique", 
    description: "Valide les demandes d'outillage" 
  },
  { 
    value: "charge_affaire", 
    label: "Chargé d'Affaires", 
    description: "Valide avant préparation appro" 
  },
  { 
    value: "responsable_appro", 
    label: "Responsable Approvisionnements", 
    description: "Prépare les sorties de matériel" 
  },
  { 
    value: "responsable_livreur", 
    label: "Responsable Livreur", 
    description: "Validation finale avant demandeur" 
  },
]

export default function ChangeUserRoleModal({ 
  isOpen, 
  onClose, 
  user, 
  onRoleChanged 
}: ChangeUserRoleModalProps) {
  const token = useStore((state) => state.token)
  const [newRole, setNewRole] = useState<UserRole | "">("")
  const [reason, setReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  const handleRoleChange = async () => {
    if (!user || !newRole) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/users/${user.id}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          newRole,
          reason: reason.trim() || undefined
        }),
      })

      const result = await response.json()

      if (result.success) {
        alert(result.message)
        onRoleChanged?.()
        handleClose()
      } else {
        alert(`Erreur: ${result.error}`)
      }
    } catch (error) {
      alert("Erreur lors de la modification du rôle")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setNewRole("")
    setReason("")
    setShowConfirmation(false)
    onClose()
  }

  const handleSubmit = () => {
    if (!newRole) return
    setShowConfirmation(true)
  }

  const currentRoleInfo = ROLES.find(r => r.value === user?.role)
  const newRoleInfo = ROLES.find(r => r.value === newRole)

  if (!user) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Modifier le rôle de {user.prenom} {user.nom}
          </DialogTitle>
        </DialogHeader>

        {!showConfirmation ? (
          <div className="space-y-6">
            {/* Informations utilisateur */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Utilisateur</h3>
              <div className="space-y-1">
                <p><strong>Nom:</strong> {user.prenom} {user.nom}</p>
                <p><strong>Téléphone:</strong> {user.phone || 'Non défini'}</p>
                <div className="flex items-center gap-2">
                  <strong>Rôle actuel:</strong>
                  <Badge variant="outline">
                    {currentRoleInfo?.label || user.role}
                  </Badge>
                </div>
                {currentRoleInfo && (
                  <p className="text-sm text-gray-600">
                    {currentRoleInfo.description}
                  </p>
                )}
              </div>
            </div>

            {/* Sélection du nouveau rôle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nouveau rôle
              </label>
              <Select value={newRole} onValueChange={(value) => setNewRole(value as UserRole)}>
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Sélectionner un nouveau rôle" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto z-[9999] bg-white border border-gray-200 shadow-lg">
                  {ROLES.filter(role => role.value !== user.role).map((role) => (
                    <SelectItem 
                      key={role.value} 
                      value={role.value}
                      className="cursor-pointer hover:bg-gray-100 focus:bg-gray-100 bg-white"
                    >
                      <div className="py-2">
                        <div className="font-medium text-gray-900">{role.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{role.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Raison du changement */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raison du changement (optionnel)
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Expliquez pourquoi vous modifiez ce rôle..."
                className="min-h-[80px]"
              />
            </div>

            {/* Aperçu du changement */}
            {newRole && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Aperçu du changement</h4>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">De:</span>
                    <Badge variant="outline">{currentRoleInfo?.label}</Badge>
                  </div>
                  <span className="text-gray-400">→</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">Vers:</span>
                    <Badge className="bg-blue-600">{newRoleInfo?.label}</Badge>
                  </div>
                </div>
                {newRoleInfo && (
                  <p className="text-sm text-blue-700 mt-2">
                    <strong>Nouvelles responsabilités:</strong> {newRoleInfo.description}
                  </p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleClose}>
                Annuler
              </Button>
              <Button 
                onClick={handleSubmit}
                disabled={!newRole}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Continuer
              </Button>
            </div>
          </div>
        ) : (
          /* Confirmation */
          <div className="space-y-6">
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-900">Confirmer la modification</h3>
                <p className="text-sm text-amber-800 mt-1">
                  Vous êtes sur le point de modifier le rôle de <strong>{user.prenom} {user.nom}</strong> 
                  de <strong>{currentRoleInfo?.label}</strong> vers <strong>{newRoleInfo?.label}</strong>.
                </p>
                <p className="text-sm text-amber-800 mt-2">
                  Cette action aura un impact immédiat sur les permissions de l'utilisateur.
                </p>
              </div>
            </div>

            {reason && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-1">Raison:</h4>
                <p className="text-sm text-gray-700">{reason}</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowConfirmation(false)}
                disabled={isLoading}
              >
                Retour
              </Button>
              <Button 
                onClick={handleRoleChange}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? "Modification..." : "Confirmer la modification"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

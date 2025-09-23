"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, UserMinus, Users, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import type { User, Projet } from "@/types"

interface ProjectUser extends User {
  demandesEnCours: number
  isCreator: boolean
  canBeRemoved: boolean
}

interface RemoveUserFromProjectModalProps {
  isOpen: boolean
  onClose: () => void
  projet: Projet | null
  onUserRemoved?: () => void
}

export default function RemoveUserFromProjectModal({ 
  isOpen, 
  onClose, 
  projet,
  onUserRemoved 
}: RemoveUserFromProjectModalProps) {
  const [users, setUsers] = useState<ProjectUser[]>([])
  const [selectedUser, setSelectedUser] = useState<ProjectUser | null>(null)
  const [reason, setReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)

  // Charger les utilisateurs du projet
  useEffect(() => {
    if (isOpen && projet) {
      loadProjectUsers()
    }
  }, [isOpen, projet])

  const loadProjectUsers = async () => {
    if (!projet) return
    
    setLoadingUsers(true)
    try {
      const response = await fetch(`/api/projets/${projet.id}/remove-user`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
      })

      const result = await response.json()

      if (result.success) {
        setUsers(result.data.utilisateurs)
      } else {
        alert(`Erreur: ${result.error}`)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des utilisateurs:", error)
      alert("Erreur lors du chargement des utilisateurs")
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleRemoveUser = async () => {
    if (!selectedUser || !projet) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/projets/${projet.id}/remove-user`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          reason: reason.trim() || undefined
        }),
      })

      const result = await response.json()

      if (result.success) {
        alert(result.message)
        onUserRemoved?.()
        handleClose()
      } else {
        alert(`Erreur: ${result.error}`)
      }
    } catch (error) {
      console.error("Erreur lors du retrait de l'utilisateur:", error)
      alert("Erreur lors du retrait de l'utilisateur")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedUser(null)
    setReason("")
    setShowConfirmation(false)
    setUsers([])
    onClose()
  }

  const handleSelectUser = (user: ProjectUser) => {
    setSelectedUser(user)
    setShowConfirmation(true)
  }

  const removableUsers = users.filter(user => user.canBeRemoved)
  const nonRemovableUsers = users.filter(user => !user.canBeRemoved)

  if (!projet) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserMinus className="h-5 w-5" />
            Retirer un utilisateur du projet "{projet.nom}"
          </DialogTitle>
        </DialogHeader>

        {!showConfirmation ? (
          <div className="space-y-6">
            {loadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Chargement des utilisateurs...</span>
              </div>
            ) : (
              <>
                {/* Informations du projet */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Projet: {projet.nom}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {users.length} utilisateur(s) assigné(s) • {removableUsers.length} peuvent être retirés
                  </p>
                </div>

                {/* Utilisateurs pouvant être retirés */}
                {removableUsers.length > 0 && (
                  <div>
                    <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Utilisateurs pouvant être retirés ({removableUsers.length})
                    </h4>
                    <div className="grid gap-3">
                      {removableUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-4 border border-green-200 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="font-medium text-gray-900">
                                {user.prenom} {user.nom}
                              </div>
                              <div className="text-sm text-gray-600">{user.email}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">{user.role}</Badge>
                                <span className="text-xs text-green-600">
                                  ✓ Aucune demande en cours
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleSelectUser(user)}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                          >
                            <UserMinus className="h-4 w-4 mr-1" />
                            Retirer
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Utilisateurs ne pouvant pas être retirés */}
                {nonRemovableUsers.length > 0 && (
                  <div>
                    <h4 className="font-medium text-red-900 mb-3 flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      Utilisateurs ne pouvant pas être retirés ({nonRemovableUsers.length})
                    </h4>
                    <div className="grid gap-3">
                      {nonRemovableUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-4 border border-red-200 bg-red-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="font-medium text-gray-900">
                                {user.prenom} {user.nom}
                              </div>
                              <div className="text-sm text-gray-600">{user.email}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline">{user.role}</Badge>
                                {user.isCreator && (
                                  <span className="text-xs text-red-600">
                                    ⚠️ Créateur du projet
                                  </span>
                                )}
                                {user.demandesEnCours > 0 && (
                                  <span className="text-xs text-red-600">
                                    ⚠️ {user.demandesEnCours} demande(s) en cours
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            disabled
                            variant="outline"
                            size="sm"
                            className="text-gray-400"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Impossible
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {removableUsers.length === 0 && (
                  <div className="text-center py-8">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Aucun utilisateur ne peut être retiré
                    </h3>
                    <p className="text-gray-600">
                      Tous les utilisateurs ont soit des demandes en cours, soit sont créateurs du projet.
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Actions */}
            <div className="flex justify-end">
              <Button variant="outline" onClick={handleClose}>
                Fermer
              </Button>
            </div>
          </div>
        ) : (
          /* Confirmation */
          <div className="space-y-6">
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-900">Confirmer le retrait</h3>
                <p className="text-sm text-amber-800 mt-1">
                  Vous êtes sur le point de retirer <strong>{selectedUser?.prenom} {selectedUser?.nom}</strong> 
                  du projet <strong>"{projet.nom}"</strong>.
                </p>
                <p className="text-sm text-amber-800 mt-2">
                  Cette action est irréversible. L'utilisateur perdra immédiatement l'accès au projet.
                </p>
              </div>
            </div>

            {/* Informations utilisateur */}
            {selectedUser && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Utilisateur à retirer</h4>
                <div className="space-y-1">
                  <p><strong>Nom:</strong> {selectedUser.prenom} {selectedUser.nom}</p>
                  <p><strong>Email:</strong> {selectedUser.email}</p>
                  <p><strong>Rôle:</strong> {selectedUser.role}</p>
                  <p><strong>Demandes en cours:</strong> {selectedUser.demandesEnCours}</p>
                </div>
              </div>
            )}

            {/* Raison du retrait */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raison du retrait (optionnel)
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Expliquez pourquoi vous retirez cet utilisateur du projet..."
                className="min-h-[80px]"
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowConfirmation(false)}
                disabled={isLoading}
              >
                Retour
              </Button>
              <Button 
                onClick={handleRemoveUser}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700"
              >
                {isLoading ? "Retrait en cours..." : "Confirmer le retrait"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

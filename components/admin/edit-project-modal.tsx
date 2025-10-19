"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Calendar, MapPin, FileText, Save, X, Users, Plus, Trash2, Settings } from "lucide-react"
import { useStore } from "@/stores/useStore"
import type { User } from "@/types"

interface EditProjectModalProps {
  isOpen: boolean
  onClose: () => void
  project: any
  onProjectUpdated: () => void
}

export default function EditProjectModal({ isOpen, onClose, project, onProjectUpdated }: EditProjectModalProps) {
  const { updateProject, users, addUserToProject, removeUserFromProject } = useStore()
  const [activeTab, setActiveTab] = useState<'details' | 'users'>('details')
  const [formData, setFormData] = useState({
    nom: "",
    description: "",
    localisation: "",
    dateDebut: "",
    dateFin: "",
    actif: true
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (project && isOpen) {
      setFormData({
        nom: project.nom || "",
        description: project.description || "",
        localisation: project.localisation || "",
        dateDebut: project.dateDebut ? new Date(project.dateDebut).toISOString().split('T')[0] : "",
        dateFin: project.dateFin ? new Date(project.dateFin).toISOString().split('T')[0] : "",
        actif: project.actif ?? true
      })
    }
  }, [project, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const updatedData = {
        nom: formData.nom,
        description: formData.description,
        localisation: formData.localisation,
        dateDebut: formData.dateDebut ? new Date(formData.dateDebut) : null,
        dateFin: formData.dateFin ? new Date(formData.dateFin) : null,
        actif: formData.actif
      }

      const success = await updateProject(project.id, updatedData)
      
      if (success) {
        onProjectUpdated()
        onClose()
      }
      setIsLoading(false)

    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error)
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Utilisateurs assignés au projet
  const projectUsers = users.filter(user => 
    user.projets?.includes(project?.id) || false
  )

  // Utilisateurs non assignés
  const availableUsers = users.filter(user => 
    !user.projets?.includes(project?.id) && user.role !== 'superadmin'
  )

  const handleAddUser = async (userId: string) => {
    if (project?.id) {
      const success = await addUserToProject(userId, project.id)
      if (success) {
        // Mise à jour locale sans recharger tous les projets
        // onProjectUpdated() sera appelé à la fermeture si nécessaire
      }
    }
  }

  const handleRemoveUser = async (userId: string) => {
    if (project?.id) {
      const success = await removeUserFromProject(userId, project.id)
      if (success) {
        // Mise à jour locale sans recharger tous les projets
        // onProjectUpdated() sera appelé à la fermeture si nécessaire
      }
    }
  }

  // Note: Le rôle est géré globalement dans la gestion des utilisateurs
  // Pas de modification de rôle au niveau du projet

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'conducteur_travaux': return 'bg-blue-100 text-blue-800'
      case 'responsable_travaux': return 'bg-green-100 text-green-800'
      case 'responsable_qhse': return 'bg-purple-100 text-purple-800'
      case 'charge_affaire': return 'bg-orange-100 text-orange-800'
      case 'responsable_logistique': return 'bg-pink-100 text-pink-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleLabel = (role: string) => {
    const labels: { [key: string]: string } = {
      'employe': 'Employé',
      'conducteur_travaux': 'Conducteur Travaux',
      'responsable_travaux': 'Responsable Travaux',
      'responsable_qhse': 'Responsable QHSE',
      'charge_affaire': 'Chargé d\'Affaire',
      'responsable_logistique': 'Responsable Logistique'
    }
    return labels[role] || role
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" style={{ color: '#015fc4' }} />
            Modifier le projet - {project?.nom}
          </DialogTitle>
        </DialogHeader>

        {/* Onglets */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Settings className="h-4 w-4 mr-2 inline" />
            Détails du projet
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="h-4 w-4 mr-2 inline" />
            Utilisateurs ({projectUsers.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'details' ? (
            <form onSubmit={handleSubmit} className="space-y-6 p-1">
          {/* Nom du projet */}
          <div className="space-y-2">
            <Label htmlFor="nom">Nom du projet *</Label>
            <Input
              id="nom"
              value={formData.nom}
              onChange={(e) => handleInputChange("nom", e.target.value)}
              placeholder="Nom du projet"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Description du projet"
              rows={3}
            />
          </div>

          {/* Localisation */}
          <div className="space-y-2">
            <Label htmlFor="localisation" className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              Localisation
            </Label>
            <Input
              id="localisation"
              value={formData.localisation}
              onChange={(e) => handleInputChange("localisation", e.target.value)}
              placeholder="Localisation du projet"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateDebut" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Date de début
              </Label>
              <Input
                id="dateDebut"
                type="date"
                value={formData.dateDebut}
                onChange={(e) => handleInputChange("dateDebut", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFin" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Date de fin
              </Label>
              <Input
                id="dateFin"
                type="date"
                value={formData.dateFin}
                onChange={(e) => handleInputChange("dateFin", e.target.value)}
              />
            </div>
          </div>

          {/* Statut actif */}
          <div className="flex items-center space-x-2">
            <Switch
              id="actif"
              checked={formData.actif}
              onCheckedChange={(checked) => handleInputChange("actif", checked)}
            />
            <Label htmlFor="actif">Projet actif</Label>
          </div>

              {/* Boutons d'action */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  style={{ backgroundColor: '#015fc4' }}
                  className="text-white"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6 p-1">
              {/* Gestion des utilisateurs */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Utilisateurs assignés */}
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5" style={{ color: '#015fc4' }} />
                    Utilisateurs assignés ({projectUsers.length})
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {projectUsers.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Aucun utilisateur assigné</p>
                      </div>
                    ) : (
                      projectUsers.map(user => (
                        <Card key={user.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarFallback style={{ backgroundColor: '#b8d1df', color: '#015fc4' }}>
                                    {user.nom.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{user.nom}</div>
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={`text-xs ${getRoleBadgeColor(user.role)}`}>
                                  {getRoleLabel(user.role)}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleRemoveUser(user.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>

                {/* Utilisateurs disponibles */}
                <div>
                  <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                    <Plus className="h-5 w-5" style={{ color: '#015fc4' }} />
                    Ajouter des utilisateurs ({availableUsers.length})
                  </h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {availableUsers.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Tous les utilisateurs sont déjà assignés</p>
                      </div>
                    ) : (
                      availableUsers.map(user => (
                        <Card key={user.id} className="hover:shadow-md transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarFallback className="bg-gray-100 text-gray-600">
                                    {user.nom.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{user.nom}</div>
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                  <Badge className={`text-xs ${getRoleBadgeColor(user.role)} mt-1`}>
                                    {getRoleLabel(user.role)}
                                  </Badge>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => handleAddUser(user.id)}
                                style={{ backgroundColor: '#015fc4' }}
                                className="text-white"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Ajouter
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Boutons d'action pour l'onglet utilisateurs */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onProjectUpdated() // Recharger les données une seule fois à la fermeture
                    onClose()
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Fermer
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

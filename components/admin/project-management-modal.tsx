"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FolderOpen, 
  Users, 
  Plus, 
  Trash2, 
  Edit, 
  Search,
  UserPlus,
  Settings,
  Calendar,
  MapPin
} from "lucide-react"
import { useStore } from "@/stores/useStore"
import EditProjectModal from "./edit-project-modal"
import ProjectHistoryModal from "./project-history-modal"

interface ProjectManagementModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ProjectManagementModal({ isOpen, onClose }: ProjectManagementModalProps) {
  const { projets, users, loadProjets, loadUsers, addUserToProject, removeUserFromProject, updateUserRole } = useStore()
  const [selectedProject, setSelectedProject] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState("")
  const [selectedRole, setSelectedRole] = useState("")
  const [showAddUser, setShowAddUser] = useState(false)
  const [editProjectModalOpen, setEditProjectModalOpen] = useState(false)
  const [historyModalOpen, setHistoryModalOpen] = useState(false)

  useEffect(() => {
    if (isOpen) {
      loadProjets()
      loadUsers()
    }
  }, [isOpen, loadProjets, loadUsers])

  const filteredProjects = projets.filter(projet =>
    projet.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    projet.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getProjectUsers = (projectId: string) => {
    return users.filter(user => user.projets?.includes(projectId))
  }

  const availableUsers = users.filter(user => 
    !selectedProject?.id || !user.projets?.includes(selectedProject.id)
  )

  const roleLabels = {
    employe: "Employé",
    conducteur: "Conducteur",
    responsable_travaux: "Responsable Travaux",
    qhse: "QHSE",
    appro: "Appro",
    charge_affaire: "Chargé d'Affaire",
    responsable_logistique: "Responsable Logistique",
    admin: "Administrateur",
    super_admin: "Super Administrateur"
  }

  const handleAddUserToProject = async () => {
    if (selectedUser && selectedProject) {
      const success = await addUserToProject(selectedUser, selectedProject.id, selectedRole)
      if (success) {
        setSelectedUser("")
        setSelectedRole("")
        setShowAddUser(false)
        // Recharger les données pour refléter les changements
        loadUsers()
      }
    }
  }

  const handleRemoveUserFromProject = async (userId: string) => {
    if (selectedProject && confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur du projet ?")) {
      const success = await removeUserFromProject(userId, selectedProject.id)
      if (success) {
        // Recharger les données pour refléter les changements
        loadUsers()
      }
    }
  }

  const handleChangeUserRole = async (userId: string, newRole: string) => {
    const success = await updateUserRole(userId, newRole)
    if (success) {
      // Recharger les données pour refléter les changements
      loadUsers()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-6xl max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <FolderOpen className="h-5 w-5" style={{ color: '#015fc4' }} />
            Gestion des Projets
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[60vh] sm:h-[70vh]">
          {/* Liste des projets */}
          <div className="lg:col-span-1 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher un projet..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[40vh] sm:max-h-[50vh] lg:max-h-[60vh]">
              {filteredProjects.map((projet) => (
                <Card 
                  key={projet.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedProject?.id === projet.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedProject(projet)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{projet.nom}</h3>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{projet.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={projet.actif ? "default" : "secondary"} className="text-xs">
                            {projet.actif ? "Actif" : "Inactif"}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {getProjectUsers(projet.id).length} utilisateurs
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Détails du projet sélectionné */}
          <div className="lg:col-span-2">
            {selectedProject ? (
              <Tabs defaultValue="details" className="h-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Détails</TabsTrigger>
                  <TabsTrigger value="users">Utilisateurs ({getProjectUsers(selectedProject.id).length})</TabsTrigger>
                  <TabsTrigger value="manage">Gestion</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4 mt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FolderOpen className="h-5 w-5" style={{ color: '#015fc4' }} />
                        {selectedProject.nom}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Description</label>
                        <p className="text-sm text-gray-600 mt-1">{selectedProject.description}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Date de début
                          </label>
                          <p className="text-sm text-gray-600 mt-1">
                            {new Date(selectedProject.dateDebut).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Date de fin
                          </label>
                          <p className="text-sm text-gray-600 mt-1">
                            {selectedProject.dateFin ? new Date(selectedProject.dateFin).toLocaleDateString('fr-FR') : 'Non définie'}
                          </p>
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          Localisation
                        </label>
                        <p className="text-sm text-gray-600 mt-1">{selectedProject.localisation || 'Non définie'}</p>
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700">Statut</label>
                        <div className="mt-1">
                          <Badge variant={selectedProject.actif ? "default" : "secondary"}>
                            {selectedProject.actif ? "Projet Actif" : "Projet Inactif"}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="users" className="space-y-4 mt-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Utilisateurs assignés</h3>
                    <Button 
                      size="sm" 
                      onClick={() => setShowAddUser(true)}
                      style={{ backgroundColor: '#015fc4' }}
                      className="text-white"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Ajouter
                    </Button>
                  </div>

                  <div className="space-y-2 overflow-y-auto max-h-[50vh]">
                    {getProjectUsers(selectedProject.id).map((user) => (
                      <Card key={user.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback style={{ backgroundColor: '#b8d1df' }}>
                                  {user.nom.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{user.nom}</p>
                                <p className="text-xs text-gray-600">{user.email}</p>
                                <Badge variant="outline" className="text-xs mt-1">
                                  {roleLabels[user.role as keyof typeof roleLabels] || user.role}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Select
                                value={user.role}
                                onValueChange={(newRole) => handleChangeUserRole(user.id, newRole)}
                              >
                                <SelectTrigger className="w-40">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {Object.entries(roleLabels).map(([value, label]) => (
                                    <SelectItem key={value} value={value}>
                                      {label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRemoveUserFromProject(user.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="manage" className="space-y-4 mt-4">
                  {showAddUser && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <UserPlus className="h-5 w-5" />
                          Ajouter un utilisateur
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-700">Utilisateur</label>
                          <Select value={selectedUser} onValueChange={setSelectedUser}>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un utilisateur" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableUsers.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.nom} ({user.email})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-700">Rôle dans le projet</label>
                          <Select value={selectedRole} onValueChange={setSelectedRole}>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un rôle" />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(roleLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            onClick={handleAddUserToProject}
                            disabled={!selectedUser || !selectedRole}
                            style={{ backgroundColor: '#015fc4' }}
                            className="text-white"
                          >
                            Ajouter au projet
                          </Button>
                          <Button variant="outline" onClick={() => setShowAddUser(false)}>
                            Annuler
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Actions sur le projet
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <Button 
                          variant="outline" 
                          className="justify-start"
                          onClick={() => setEditProjectModalOpen(true)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Modifier le projet
                        </Button>
                        <Button 
                          variant="outline" 
                          className="justify-start"
                          onClick={() => setHistoryModalOpen(true)}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Voir l'historique
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <FolderOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Sélectionnez un projet pour voir les détails</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modals secondaires */}
        <EditProjectModal
          isOpen={editProjectModalOpen}
          onClose={() => setEditProjectModalOpen(false)}
          project={selectedProject}
          onProjectUpdated={() => {
            loadProjets()
            setEditProjectModalOpen(false)
          }}
        />

        <ProjectHistoryModal
          isOpen={historyModalOpen}
          onClose={() => setHistoryModalOpen(false)}
          project={selectedProject}
        />
      </DialogContent>
    </Dialog>
  )
}

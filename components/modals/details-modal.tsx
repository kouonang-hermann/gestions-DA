"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { X, User, FileText, Eye, Edit, Trash2, UserCog, UserMinus } from 'lucide-react'
import InstrumElecLogo from "@/components/ui/instrumelec-logo"
import ProjectDetailsModal from "@/components/modals/project-details-modal"
import DemandeDetailModal from "@/components/demandes/demande-detail-modal"
import type { User as UserType, Projet, Demande } from "@/types"

interface DetailsModalProps {
  isOpen: boolean
  onClose: () => void
  type: "users" | "projects" | "totalRequests" | "activeRequests"
  title: string
  data: UserType[] | Projet[] | Demande[]
  onChangeUserRole?: (user: UserType) => void
  onRemoveUserFromProject?: (projet: Projet) => void
}

export default function DetailsModal({ 
  isOpen, 
  onClose, 
  type, 
  title, 
  data, 
  onChangeUserRole, 
  onRemoveUserFromProject 
}: DetailsModalProps) {
  const [projectDetailsModalOpen, setProjectDetailsModalOpen] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Projet | null>(null)
  const [demandeDetailsOpen, setDemandeDetailsOpen] = useState(false)
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null)
  const getRoleLabel = (role: string) => {
    const labels = {
      superadmin: "Super Administrateur",
      employe: "Employé",
      conducteur_travaux: "Conducteur de Travaux",
      responsable_travaux: "Responsable des Travaux",
      responsable_qhse: "Responsable QHSE",
      responsable_appro: "Responsable Approvisionnements",
      charge_affaire: "Chargé d'Affaire",
    }
    return labels[role as keyof typeof labels] || role
  }

  const getStatusColor = (status: string) => {
    const colors = {
      brouillon: "bg-gray-500",
      soumise: "bg-blue-500",
      en_attente_validation_conducteur: "bg-yellow-500",
      en_attente_validation_responsable_travaux: "bg-yellow-400",
      en_attente_validation_charge_affaire: "bg-blue-600",
      en_attente_preparation_appro: "bg-orange-400",
      en_attente_validation_logistique: "bg-indigo-400",
      en_attente_validation_finale_demandeur: "bg-indigo-500",
      confirmee_demandeur: "bg-green-700",
      cloturee: "bg-green-600",
      rejetee: "bg-red-500",
      archivee: "bg-gray-600",
    }
    return colors[status as keyof typeof colors] || "bg-gray-500"
  }

  const renderUsers = (users: UserType[]) => (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {users.map((user) => (
        <Card key={user.id} className="bg-white border border-gray-200 hover:shadow-sm transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-gray-500" />
                  <div>
                    <h3 className="font-medium text-gray-800">
                      {user.prenom} {user.nom}
                    </h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {getRoleLabel(user.role)}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    console.log("🔘 Bouton Edit cliqué pour:", user.nom, user.prenom)
                    if (onChangeUserRole) {
                      console.log("✅ Fonction onChangeUserRole disponible, appel en cours...")
                      onChangeUserRole(user)
                    } else {
                      console.error("❌ Fonction onChangeUserRole non disponible!")
                    }
                  }}
                  title="Modifier le rôle"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const renderProjects = (projects: Projet[]) => (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {projects.map((projet) => (
        <Card key={projet.id} className="bg-white border border-gray-200 hover:shadow-sm transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <InstrumElecLogo size="sm" showText={false} className="w-5 h-5" />
                  <div>
                    <h3 className="font-medium text-gray-800">{projet.nom}</h3>
                    <p className="text-sm text-gray-600">{projet.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={projet.actif ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                        {projet.actif ? "Actif" : "Inactif"}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {projet.utilisateurs.length} utilisateur{projet.utilisateurs.length > 1 ? "s" : ""}
                      </span>
                      <span className="text-xs text-gray-500">
                        Début: {projet.dateDebut ? new Date(projet.dateDebut).toLocaleDateString() : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedProject(projet)
                    setProjectDetailsModalOpen(true)
                  }}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                {onRemoveUserFromProject && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onRemoveUserFromProject(projet)}
                    className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                    title="Retirer un utilisateur du projet"
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const renderRequests = (requests: Demande[]) => (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {requests.map((demande) => (
        <Card key={demande.id} className="bg-white border border-gray-200 hover:shadow-sm transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium text-gray-800">{demande.numero}</h3>
                      <Badge className={`${getStatusColor(demande.status)} text-white text-xs`}>
                        {demande.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {demande.type === "materiel" ? "Matériel" : "Outillage"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {demande.items.length} article{demande.items.length > 1 ? "s" : ""} • 
                      Créée le {demande.dateCreation ? new Date(demande.dateCreation).toLocaleDateString() : '—'}
                    </p>
                    {demande.commentaires && (
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {demande.commentaires}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setSelectedDemande(demande)
                    setDemandeDetailsOpen(true)
                  }}
                  title="Voir les détails"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )

  const renderContent = () => {
    switch (type) {
      case "users":
        return renderUsers(data as UserType[])
      case "projects":
        return renderProjects(data as Projet[])
      case "totalRequests":
      case "activeRequests":
        return renderRequests(data as Demande[])
      default:
        return <div>Type non supporté</div>
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-gray-800">{title}</DialogTitle>
              <DialogDescription className="text-gray-600">
                {(data as any[]).length} élément{(data as any[]).length > 1 ? "s" : ""} au total
              </DialogDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="mt-4">
          {(data as any[]).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Aucun élément à afficher</p>
            </div>
          ) : (
            renderContent()
          )}
        </div>

        {/* Project Details Modal */}
        <ProjectDetailsModal
          isOpen={projectDetailsModalOpen}
          onClose={() => {
            setProjectDetailsModalOpen(false)
            setSelectedProject(null)
          }}
          projet={selectedProject}
        />

        {/* Demande Details Modal */}
        {selectedDemande && (
          <DemandeDetailModal
            isOpen={demandeDetailsOpen}
            onClose={() => {
              setDemandeDetailsOpen(false)
              setSelectedDemande(null)
            }}
            demandeId={selectedDemande.id}
            mode="view"
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

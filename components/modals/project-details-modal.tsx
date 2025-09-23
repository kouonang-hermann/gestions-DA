"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { X, User, Calendar, FileText, Users } from 'lucide-react'
import type { Projet, User as UserType } from "@/types"

interface ProjectDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  projet: Projet | null
}

export default function ProjectDetailsModal({ isOpen, onClose, projet }: ProjectDetailsModalProps) {
  if (!projet) return null

  const getRoleLabel = (role: string) => {
    const labels = {
      superadmin: "Super Administrateur",
      employe: "Employé",
      conducteur_travaux: "Conducteur de Travaux",
      responsable_travaux: "Responsable des Travaux",
      responsable_qhse: "Responsable QHSE",
      responsable_appro: "Responsable Approvisionnements",
      charge_affaire: "Chargé d'Affaire",
      responsable_logistique: "Responsable Logistique",
    }
    return labels[role as keyof typeof labels] || role
  }

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-800">{projet.nom}</DialogTitle>
              <DialogDescription className="text-gray-600 mt-1">
                Détails complets du projet
              </DialogDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Informations générales du projet */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Informations générales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <p className="text-gray-800 mt-1">{projet.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Statut</label>
                  <div className="mt-1">
                    <Badge className={projet.actif ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                      {projet.actif ? "Actif" : "Inactif"}
                    </Badge>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Date de début</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-800">{formatDate(projet.dateDebut)}</span>
                  </div>
                </div>
                
                {projet.dateFin && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Date de fin</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-800">{formatDate(projet.dateFin)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Créé le</label>
                  <p className="text-gray-600 text-sm mt-1">{formatDate(projet.createdAt)}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-700">Dernière modification</label>
                  <p className="text-gray-600 text-sm mt-1">{formatDate(projet.createdAt)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Utilisateurs assignés */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Utilisateurs assignés ({projet.utilisateurs?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {projet.utilisateurs && projet.utilisateurs.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {projet.utilisateurs.map((userProjet, index) => (
                    <Card key={`user-${userProjet.userId}-${index}`} className="bg-gray-50 border border-gray-200">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-blue-100 rounded-full p-2">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-800">
                              {userProjet.user.prenom} {userProjet.user.nom}
                            </h4>
                            <p className="text-sm text-gray-600">{userProjet.user.email}</p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {getRoleLabel(userProjet.user.role)}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucun utilisateur assigné à ce projet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistiques du projet */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Statistiques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-800">
                    {projet.utilisateurs?.length || 0}
                  </div>
                  <div className="text-sm text-blue-600">Utilisateurs assignés</div>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-800">
                    0
                  </div>
                  <div className="text-sm text-green-600">Demandes liées</div>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-800">
                    {projet.actif ? "Actif" : "Inactif"}
                  </div>
                  <div className="text-sm text-purple-600">Statut du projet</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

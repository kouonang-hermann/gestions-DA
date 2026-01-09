"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useStore } from "@/stores/useStore"
import { Loader2, X } from "lucide-react"

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const { createProjet, users, loadUsers, isLoading } = useStore()
  const [formData, setFormData] = useState({
    nom: "",
    description: "",
    dateDebut: "",
    dateFin: "",
    utilisateurs: [] as string[],
  })
  const [error, setError] = useState("")

  useEffect(() => {
    if (isOpen) {
      loadUsers()
      // Réinitialiser le formulaire et pré-sélectionner tous les utilisateurs non-superadmin
      setFormData({
        nom: "",
        description: "",
        dateDebut: "",
        dateFin: "",
        utilisateurs: [],
      })
      setError("")
    }
  }, [isOpen, loadUsers])

  useEffect(() => {
    // Pré-sélectionner tous les utilisateurs non-superadmin quand ils sont chargés
    if (users.length > 0 && isOpen) {
      const nonSuperAdminUsers = users.filter(user => user.role !== "superadmin").map(user => user.id)
      setFormData(prev => ({
        ...prev,
        utilisateurs: nonSuperAdminUsers
      }))
    }
  }, [users, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.nom || !formData.description || !formData.dateDebut) {
      setError("Nom, description et date de début sont requis")
      return
    }

    if (formData.dateFin && new Date(formData.dateFin) <= new Date(formData.dateDebut)) {
      setError("La date de fin doit être postérieure à la date de début")
      return
    }

    // Convertir les données pour correspondre au type Projet
    const projetData = {
      nom: formData.nom,
      description: formData.description,
      dateDebut: new Date(formData.dateDebut),
      dateFin: formData.dateFin ? new Date(formData.dateFin) : undefined,
      utilisateurs: formData.utilisateurs,
    }

    const success = await createProjet(projetData)
    if (success) {
      onClose()
      setFormData({
        nom: "",
        description: "",
        dateDebut: "",
        dateFin: "",
        utilisateurs: [],
      })
    }
  }

  const toggleUser = (userId: string) => {
    setFormData((prev) => {
      const isCurrentlySelected = prev.utilisateurs.includes(userId)
      const newSelection = isCurrentlySelected
        ? prev.utilisateurs.filter((id) => id !== userId)
        : [...prev.utilisateurs, userId]
      
      return {
        ...prev,
        utilisateurs: newSelection,
      }
    })
  }

  const removeUser = (userId: string) => {
    setFormData((prev) => ({
      ...prev,
      utilisateurs: prev.utilisateurs.filter((id) => id !== userId),
    }))
  }

  const getSelectedUsers = () => {
    return users.filter((user) => formData.utilisateurs.includes(user.id))
  }

  const getAllNonSuperAdminUsers = () => {
    return users.filter((user) => user.role !== "superadmin")
  }

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      'employe': 'bg-blue-100 text-blue-800',
      'conducteur_travaux': 'bg-green-100 text-green-800', 
      'responsable_travaux': 'bg-purple-100 text-purple-800',
      'responsable_qhse': 'bg-red-100 text-red-800',
      'charge_affaire': 'bg-yellow-100 text-yellow-800',
      'responsable_logistique': 'bg-indigo-100 text-indigo-800'
    }
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[95vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Créer un nouveau projet</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">Ajoutez un nouveau projet et assignez des utilisateurs</DialogDescription>
        </DialogHeader>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="nom" className="block text-sm font-medium mb-2">
                  Nom du projet *
                </label>
                <input
                  id="nom"
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nom: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Nom du projet"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Description du projet"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="dateDebut" className="block text-sm font-medium mb-2">
                    Date de début *
                  </label>
                  <input
                    id="dateDebut"
                    type="date"
                    value={formData.dateDebut}
                    onChange={(e) => setFormData((prev) => ({ ...prev, dateDebut: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="dateFin" className="block text-sm font-medium mb-2">
                    Date de fin (optionnelle)
                  </label>
                  <input
                    id="dateFin"
                    type="date"
                    value={formData.dateFin}
                    onChange={(e) => setFormData((prev) => ({ ...prev, dateFin: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                </div>
              </div>

              {/* Tableau de sélection des utilisateurs */}
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: '#015fc4' }}>
                  Sélection des utilisateurs assignés au projet
                </label>
                
                {/* Compteur d'utilisateurs sélectionnés */}
                <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-blue-800">
                      <span className="font-semibold">{formData.utilisateurs.length}</span> utilisateur(s) sélectionné(s) sur {getAllNonSuperAdminUsers().length} disponible(s)
                    </p>
                    {/* Debug info - à supprimer en production */}
                    <div className="text-xs text-blue-600">
                      {formData.utilisateurs.length > 0 && (
                        <span>IDs: {formData.utilisateurs.slice(0, 3).join(', ')}{formData.utilisateurs.length > 3 ? '...' : ''}</span>
                      )}
                    </div>
                  </div>
                  {/* Barre de progression visuelle */}
                  <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${getAllNonSuperAdminUsers().length > 0 ? (formData.utilisateurs.length / getAllNonSuperAdminUsers().length) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>

                {/* Tableau scrollable avec boutons radio */}
                <div className="border rounded-lg overflow-hidden" style={{ maxHeight: '350px' }}>
                  <div className="overflow-y-auto" style={{ maxHeight: '350px' }}>
                    <table className="w-full">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                            Sélection
                          </th>
                          <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Utilisateur
                          </th>
                          <th className="hidden sm:table-cell px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Email
                          </th>
                          <th className="px-2 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rôle
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getAllNonSuperAdminUsers().length === 0 ? (
                          <tr>
                            <td colSpan={4} className="px-2 sm:px-4 py-8 text-center text-gray-500">
                              Aucun utilisateur disponible
                            </td>
                          </tr>
                        ) : (
                          getAllNonSuperAdminUsers().map((user, index) => (
                            <tr 
                              key={user.id} 
                              className={`hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
                                formData.utilisateurs.includes(user.id) 
                                  ? 'bg-blue-50 border-l-4 border-blue-500' 
                                  : 'hover:bg-gray-50'
                              }`}
                              onClick={(e) => {
                                // Ne déclencher que si le clic n'est pas sur la checkbox
                                const target = e.target as HTMLElement
                                if (target.tagName !== 'INPUT' && target.getAttribute('type') !== 'checkbox') {
                                  toggleUser(user.id)
                                }
                              }}
                            >
                              <td className="px-2 sm:px-4 py-3">
                                <input
                                  type="checkbox"
                                  checked={formData.utilisateurs.includes(user.id)}
                                  onChange={(e) => {
                                    e.stopPropagation() // Empêcher la propagation vers la ligne
                                    toggleUser(user.id)
                                  }}
                                  onClick={(e) => e.stopPropagation()} // Empêcher le double clic
                                  className="h-4 w-4 rounded border-gray-300 focus:ring-2 cursor-pointer"
                                  style={{ 
                                    accentColor: '#015fc4'
                                  } as React.CSSProperties}
                                />
                              </td>
                              <td className="px-2 sm:px-4 py-3">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-8 w-8">
                                    <div 
                                      className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-medium"
                                      style={{ backgroundColor: '#015fc4' }}
                                    >
                                      {user.prenom.charAt(0)}{user.nom.charAt(0)}
                                    </div>
                                  </div>
                                  <div className="ml-2 sm:ml-3">
                                    <p className="text-sm font-medium text-gray-900">
                                      {user.prenom} {user.nom}
                                    </p>
                                    {/* Email visible sur mobile sous le nom */}
                                    <p className="text-xs text-gray-500 sm:hidden">{user.email}</p>
                                  </div>
                                </div>
                              </td>
                              {/* Email caché sur mobile, visible sur desktop */}
                              <td className="hidden sm:table-cell px-2 sm:px-4 py-3">
                                <p className="text-sm text-gray-600">{user.email}</p>
                              </td>
                              <td className="px-2 sm:px-4 py-3">
                                <span className={`inline-flex px-1 sm:px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                                  <span className="hidden sm:inline">{user.role.replace('_', ' ').toUpperCase()}</span>
                                  <span className="sm:hidden">{user.role.split('_')[0].toUpperCase()}</span>
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                {/* Actions rapides */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      const allUserIds = getAllNonSuperAdminUsers().map(user => user.id)
                      setFormData(prev => ({ ...prev, utilisateurs: allUserIds }))
                    }}
                    className="px-3 py-2 text-xs sm:text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors flex-1 sm:flex-none"
                  >
                    Sélectionner tout ({getAllNonSuperAdminUsers().length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, utilisateurs: [] }))
                    }}
                    className="px-3 py-2 text-xs sm:text-sm bg-gray-100 text-gray-800 rounded hover:bg-gray-200 transition-colors flex-1 sm:flex-none"
                  >
                    Désélectionner tout
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">{error}</div>
              )}

              <div className="flex justify-end space-x-4 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Créer le projet
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import type React from "react"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { useStore } from "@/stores/useStore"
import { Loader2, RefreshCw, Shield } from 'lucide-react'
import { hasPermission } from "@/lib/auth"

interface CreateUserModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CreateUserModal({ isOpen, onClose }: CreateUserModalProps) {
  const { createUser, isLoading } = useStore()
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    role: "",
    isAdmin: false,
    projets: [] as string[],
  })
  const [error, setError] = useState("")

  // Fonction pour générer un mot de passe aléatoirement
  const generatePassword = () => {
    const length = 12
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    let password = ""
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    setFormData((prev) => ({ ...prev, password }))
  }

  const roles = [
    { value: "employe", label: "Employé" },
    { value: "conducteur_travaux", label: "Conducteur de Travaux" },
    { value: "responsable_travaux", label: "Responsable des Travaux" },
    { value: "responsable_qhse", label: "Responsable QHSE" },
    { value: "responsable_appro", label: "Responsable Approvisionnements" },
    { value: "charge_affaire", label: "Chargé d'Affaire" },
    { value: "responsable_logistique", label: "Responsable Logistique" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!formData.nom || !formData.prenom || !formData.email || !formData.password || !formData.role) {
      setError("Tous les champs sont requis")
      return
    }

    if (formData.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères")
      return
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError("Format d'email invalide")
      return
    }

    const success = await createUser(formData as any)
    if (success) {
      onClose()
      setFormData({
        nom: "",
        prenom: "",
        email: "",
        password: "",
        role: "",
        isAdmin: false,
        projets: [],
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
          <DialogDescription>Ajoutez un nouvel utilisateur au système</DialogDescription>
        </DialogHeader>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="prenom" className="block text-sm font-medium mb-2">
                  Prénom *
                </label>
                <input
                  id="prenom"
                  type="text"
                  value={formData.prenom}
                  onChange={(e) => setFormData((prev) => ({ ...prev, prenom: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Prénom"
                  required
                />
              </div>

              <div>
                <label htmlFor="nom" className="block text-sm font-medium mb-2">
                  Nom *
                </label>
                <input
                  id="nom"
                  type="text"
                  value={formData.nom}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nom: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Nom"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email *
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  Mot de passe *
                </label>
                <div className="flex gap-2">
                  <input
                    id="password"
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    placeholder="Minimum 6 caractères"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generatePassword}
                    className="px-3 h-10 whitespace-nowrap"
                    title="Générer un mot de passe"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                {formData.password && (
                  <p className="text-xs text-gray-600 mt-1">
                    Mot de passe généré: <span className="font-mono bg-gray-100 px-1 rounded">{formData.password}</span>
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium mb-2">
                  Rôle *
                </label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData((prev) => ({ ...prev, role: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="">Sélectionnez un rôle</option>
                  {roles.map((role) => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Option Admin - uniquement pour SuperAdmin */}
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-blue-500" />
                    <label htmlFor="isAdmin" className="text-sm font-medium">
                      Privilèges Administrateur
                    </label>
                  </div>
                  <Switch
                    id="isAdmin"
                    checked={formData.isAdmin}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isAdmin: checked }))}
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  Les admins peuvent créer des projets et ajouter des utilisateurs
                </p>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">{error}</div>
              )}

              <div className="flex justify-end space-x-4 pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Créer l'utilisateur
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}

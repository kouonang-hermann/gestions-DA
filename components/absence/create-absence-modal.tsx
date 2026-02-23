"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { useStore } from "@/stores/useStore"

interface CreateAbsenceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const typeAbsenceLabels: Record<string, string> = {
  maladie: "Maladie",
  personnelle: "Personnelle",
  familiale: "Familiale",
  formation: "Formation",
  autre: "Autre"
}

export default function CreateAbsenceModal({
  open,
  onOpenChange,
  onSuccess
}: CreateAbsenceModalProps) {
  const { users, currentUser, token } = useStore()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    typeAbsence: "",
    motif: "",
    dateDebut: undefined as Date | undefined,
    dateFin: undefined as Date | undefined,
    superieurHierarchiqueId: "",
    commentaireEmploye: ""
  })

  // Filtrer les utilisateurs pour obtenir les supérieurs hiérarchiques potentiels
  const superieursHierarchiques = users.filter(u => 
    u.id !== currentUser?.id && 
    (u.role === "conducteur_travaux" || 
     u.role === "responsable_travaux" || 
     u.role === "charge_affaire" ||
     u.role === "directeur_general")
  )

  const calculateDays = () => {
    if (!formData.dateDebut || !formData.dateFin) return 0
    const diff = formData.dateFin.getTime() - formData.dateDebut.getTime()
    return Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentUser || !token) return
    if (!formData.typeAbsence || !formData.motif || !formData.dateDebut || !formData.dateFin || !formData.superieurHierarchiqueId) {
      alert("Veuillez remplir tous les champs obligatoires")
      return
    }

    if (formData.dateFin < formData.dateDebut) {
      alert("La date de fin doit être après la date de début")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/absences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          typeAbsence: formData.typeAbsence,
          motif: formData.motif,
          dateDebut: formData.dateDebut.toISOString(),
          dateFin: formData.dateFin.toISOString(),
          nombreJours: calculateDays(),
          superieurHierarchiqueId: formData.superieurHierarchiqueId,
          commentaireEmploye: formData.commentaireEmploye || undefined
        })
      })

      const result = await response.json()

      if (result.success) {
        alert("Demande d'absence créée avec succès")
        onOpenChange(false)
        setFormData({
          typeAbsence: "",
          motif: "",
          dateDebut: undefined,
          dateFin: undefined,
          superieurHierarchiqueId: "",
          commentaireEmploye: ""
        })
        onSuccess?.()
      } else {
        alert(result.error || "Erreur lors de la création de la demande")
      }
    } catch (error) {
      console.error("Erreur:", error)
      alert("Erreur de connexion")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouvelle demande d'absence</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type d'absence */}
            <div className="space-y-2">
              <Label htmlFor="typeAbsence">
                Type d'absence <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.typeAbsence}
                onValueChange={(value) => setFormData({ ...formData, typeAbsence: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(typeAbsenceLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Supérieur hiérarchique */}
            <div className="space-y-2">
              <Label htmlFor="superieur">
                Supérieur hiérarchique <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.superieurHierarchiqueId}
                onValueChange={(value) => setFormData({ ...formData, superieurHierarchiqueId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un supérieur" />
                </SelectTrigger>
                <SelectContent>
                  {superieursHierarchiques.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.prenom} {user.nom} ({user.role.replace(/_/g, " ")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date de début */}
            <div className="space-y-2">
              <Label>
                Date de début <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dateDebut ? (
                      format(formData.dateDebut, "PPP", { locale: fr })
                    ) : (
                      <span>Sélectionner une date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.dateDebut}
                    onSelect={(date) => setFormData({ ...formData, dateDebut: date })}
                    locale={fr}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Date de fin */}
            <div className="space-y-2">
              <Label>
                Date de fin <span className="text-red-500">*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dateFin ? (
                      format(formData.dateFin, "PPP", { locale: fr })
                    ) : (
                      <span>Sélectionner une date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.dateFin}
                    onSelect={(date) => setFormData({ ...formData, dateFin: date })}
                    locale={fr}
                    disabled={(date) => 
                      date < new Date(new Date().setHours(0, 0, 0, 0)) ||
                      (formData.dateDebut ? date < formData.dateDebut : false)
                    }
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Nombre de jours calculé */}
          {formData.dateDebut && formData.dateFin && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-900">
                Nombre de jours : <span className="text-lg">{calculateDays()}</span> jour{calculateDays() > 1 ? "s" : ""}
              </p>
            </div>
          )}

          {/* Motif */}
          <div className="space-y-2">
            <Label htmlFor="motif">
              Motif de l'absence <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="motif"
              value={formData.motif}
              onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
              placeholder="Décrivez le motif de votre absence..."
              rows={3}
              required
            />
          </div>

          {/* Commentaire optionnel */}
          <div className="space-y-2">
            <Label htmlFor="commentaire">Commentaire additionnel (optionnel)</Label>
            <Textarea
              id="commentaire"
              value={formData.commentaireEmploye}
              onChange={(e) => setFormData({ ...formData, commentaireEmploye: e.target.value })}
              placeholder="Informations complémentaires..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Soumettre la demande
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

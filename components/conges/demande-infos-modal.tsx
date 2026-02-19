"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { DemandeInfos } from "./nouvelle-demande-modal"
import { Loader2 } from "lucide-react"
import { useStore } from "@/stores/useStore"

interface DemandeInfosModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onValidate: (infos: DemandeInfos) => void
}

interface Responsable {
  id: string
  nom: string
  prenom: string
  email: string
  phone: string
  role: string
}

export function DemandeInfosModal({ open, onOpenChange, onValidate }: DemandeInfosModalProps) {
  const [matricule, setMatricule] = useState("")
  const [anciennete, setAnciennete] = useState("")
  const [responsableId, setResponsableId] = useState("")
  const [typeConge, setTypeConge] = useState("")
  const [autresPrecision, setAutresPrecision] = useState("")
  const [dateDebut, setDateDebut] = useState("")
  const [dateFin, setDateFin] = useState("")
  
  const [responsables, setResponsables] = useState<Responsable[]>([])
  const [loadingResponsables, setLoadingResponsables] = useState(false)
  const [selectedResponsable, setSelectedResponsable] = useState<Responsable | null>(null)

  // Charger la liste des responsables
  useEffect(() => {
    if (open) {
      loadResponsables()
    }
  }, [open])

  const loadResponsables = async () => {
    setLoadingResponsables(true)
    try {
      const token = useStore.getState().token
      const response = await fetch("/api/users/responsables", {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      })
      const data = await response.json()
      if (data.success) {
        setResponsables(data.data)
      } else {
        console.error("Erreur API responsables:", data.error)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des responsables:", error)
    } finally {
      setLoadingResponsables(false)
    }
  }

  const handleResponsableChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    setResponsableId(value)
    const responsable = responsables.find(r => r.id === value)
    setSelectedResponsable(responsable || null)
  }

  const handleValidate = () => {
    // Validation
    if (!matricule || !anciennete || !responsableId || !typeConge || !dateDebut || !dateFin) {
      alert("⚠️ Veuillez remplir tous les champs obligatoires")
      return
    }

    if (typeConge === "autres" && !autresPrecision) {
      alert("⚠️ Veuillez préciser le type de congé")
      return
    }

    if (new Date(dateFin) < new Date(dateDebut)) {
      alert("⚠️ La date de fin doit être postérieure à la date de début")
      return
    }

    if (!selectedResponsable) {
      alert("⚠️ Responsable non trouvé")
      return
    }

    onValidate({
      matricule,
      anciennete,
      responsableId,
      responsableNom: `${selectedResponsable.prenom} ${selectedResponsable.nom}`,
      typeConge,
      autresPrecision: typeConge === "autres" ? autresPrecision : undefined,
      dateDebut,
      dateFin
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Nouvelle Demande de Congés - Étape 1/2
          </DialogTitle>
          <p className="text-sm text-gray-500">Informations de la demande</p>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Matricule */}
          <div className="grid gap-2">
            <Label htmlFor="matricule">
              Matricule <span className="text-red-500">*</span>
            </Label>
            <Input
              id="matricule"
              value={matricule}
              onChange={(e) => setMatricule(e.target.value)}
              placeholder="Ex: EMP-2024-001"
            />
          </div>

          {/* Ancienneté */}
          <div className="grid gap-2">
            <Label htmlFor="anciennete">
              Ancienneté dans le service <span className="text-red-500">*</span>
            </Label>
            <Input
              id="anciennete"
              value={anciennete}
              onChange={(e) => setAnciennete(e.target.value)}
              placeholder="Ex: 2 ans 3 mois"
            />
          </div>

          {/* Responsable hiérarchique */}
          <div className="grid gap-2">
            <Label htmlFor="responsable">
              Responsable hiérarchique <span className="text-red-500">*</span>
            </Label>
            {loadingResponsables ? (
              <div className="flex items-center justify-center p-4 border rounded-md">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span className="text-sm text-gray-500">Chargement...</span>
              </div>
            ) : (
              <select
                id="responsable"
                value={responsableId}
                onChange={handleResponsableChange}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Sélectionner un responsable</option>
                {responsables.map((resp) => (
                  <option key={resp.id} value={resp.id}>
                    {resp.prenom} {resp.nom} - {resp.role}
                  </option>
                ))}
              </select>
            )}
            
            {/* Affichage auto des infos du responsable */}
            {selectedResponsable && (
              <div className="mt-2 p-3 bg-blue-50 rounded-md text-sm">
                <p className="font-medium text-blue-900">Informations du responsable :</p>
                <p className="text-blue-700">📧 {selectedResponsable.email || "Non renseigné"}</p>
                <p className="text-blue-700">📞 {selectedResponsable.phone}</p>
              </div>
            )}
          </div>

          {/* Type de congé */}
          <div className="grid gap-2">
            <Label htmlFor="typeConge">
              Type de congé <span className="text-red-500">*</span>
            </Label>
            <select
              id="typeConge"
              value={typeConge}
              onChange={(e) => setTypeConge(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Sélectionner un type</option>
              <option value="annuel">Congés annuel</option>
              <option value="maladie">Congés maladie</option>
              <option value="parental">Congés de parental</option>
              <option value="recuperation">Congés pour récupération</option>
              <option value="autres">Autres</option>
            </select>
          </div>

          {/* Précision si "Autres" */}
          {typeConge === "autres" && (
            <div className="grid gap-2">
              <Label htmlFor="autresPrecision">
                Précisez le type de congé <span className="text-red-500">*</span>
              </Label>
              <Input
                id="autresPrecision"
                value={autresPrecision}
                onChange={(e) => setAutresPrecision(e.target.value)}
                placeholder="Ex: Congé exceptionnel pour événement familial"
              />
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="dateDebut">
                Date de début <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dateDebut"
                type="date"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dateFin">
                Date de fin <span className="text-red-500">*</span>
              </Label>
              <Input
                id="dateFin"
                type="date"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
              />
            </div>
          </div>

          {/* Calcul automatique du nombre de jours */}
          {dateDebut && dateFin && new Date(dateFin) >= new Date(dateDebut) && (
            <div className="p-3 bg-green-50 rounded-md text-sm">
              <p className="font-medium text-green-900">
                📅 Durée: {Math.ceil((new Date(dateFin).getTime() - new Date(dateDebut).getTime()) / (1000 * 60 * 60 * 24)) + 1} jour(s)
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleValidate} className="bg-green-600 hover:bg-green-700">
            Suivant →
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

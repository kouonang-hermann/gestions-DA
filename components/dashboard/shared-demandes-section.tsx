"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock } from "lucide-react"
import { useStore } from "@/stores/useStore"
import { Demande } from "@/types"
import MesDemandesACloturer from "@/components/demandes/mes-demandes-a-cloturer"

interface SharedDemandesSectionProps {
  onCardClick?: (type: string, title: string) => void
}

export default function SharedDemandesSection({ onCardClick }: SharedDemandesSectionProps) {
  const { currentUser, demandes } = useStore()
  const [demandesEnCours, setDemandesEnCours] = useState<Demande[]>([])

  useEffect(() => {
    if (currentUser && demandes) {
      // Filtrer les demandes en cours pour l'utilisateur actuel
      const mesDemandesEnCours = demandes.filter(
        (demande) =>
          demande.technicienId === currentUser.id &&
          [
            "en_attente_validation_conducteur",
            "en_attente_validation_qhse", 
            "en_attente_validation_responsable_travaux",
            "en_attente_validation_charge_affaire",
            "en_attente_preparation_appro",
            "en_attente_validation_logistique"
          ].includes(demande.status)
      )
      setDemandesEnCours(mesDemandesEnCours)
    }
  }, [currentUser, demandes])

  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick("enCours", "Mes demandes en cours")
    }
  }

  return (
    <>
      {/* Carte En cours */}
      <Card 
        className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" 
        style={{ borderLeftColor: '#f97316' }} 
        onClick={handleCardClick}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">En cours</CardTitle>
          <Clock className="h-4 w-4" style={{ color: '#f97316' }} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold" style={{ color: '#f97316' }}>
            {demandesEnCours.length}
          </div>
          <p className="text-xs text-muted-foreground">
            {demandesEnCours.length === 0 
              ? "Aucune demande en cours" 
              : demandesEnCours.length === 1 
                ? "demande en validation"
                : "demandes en validation"
            }
          </p>
        </CardContent>
      </Card>

      {/* Section Mes demandes à clôturer */}
      <MesDemandesACloturer />
    </>
  )
}

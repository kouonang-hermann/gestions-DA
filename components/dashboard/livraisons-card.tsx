"use client"

import { useStore } from "@/stores/useStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Truck } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

/**
 * Carte compacte affichant les livraisons assignées à l'utilisateur connecté
 * Design uniforme avec les autres cartes statistiques du dashboard
 */
export default function LivraisonsCard() {
  const { demandes, currentUser } = useStore()

  if (!currentUser) return null

  // Filtrer les demandes où l'utilisateur est assigné comme livreur
  const mesLivraisons = demandes.filter(
    (d) => d.livreurAssigneId === currentUser.id &&
    (d.status === "en_attente_reception_livreur" || d.status === "en_attente_livraison")
  )

  // Ne rien afficher si aucune livraison assignée
  if (mesLivraisons.length === 0) {
    return null
  }

  const handleCardClick = () => {
    // Rediriger vers la section détaillée des livraisons
    const section = document.getElementById('mes-livraisons-section')
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Card 
          className="border-l-4 cursor-pointer hover:shadow-md transition-shadow" 
          style={{ borderLeftColor: '#6366f1' }} 
          onClick={handleCardClick}
        > 
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Livraisons</CardTitle>
            <Truck className="h-4 w-4" style={{ color: '#6366f1' }} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" style={{ color: '#6366f1' }}>{mesLivraisons.length}</div>
            <p className="text-xs text-muted-foreground">À réceptionner/livrer</p>
          </CardContent>
        </Card>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8}>
        Voir les livraisons qui te sont assignées
      </TooltipContent>
    </Tooltip>
  )
}

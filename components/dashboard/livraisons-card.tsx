"use client"

import { useStore } from "@/stores/useStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Truck, Package } from "lucide-react"

/**
 * Carte compacte affichant les livraisons assignées à l'utilisateur connecté
 * Utilisée dans tous les dashboards pour permettre à tout utilisateur sélectionné comme livreur
 * de voir rapidement les demandes qu'il doit réceptionner/livrer
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

  const livraisonsAReceptionner = mesLivraisons.filter(
    (d) => d.status === "en_attente_reception_livreur"
  )

  const livraisonsAEffectuer = mesLivraisons.filter(
    (d) => d.status === "en_attente_livraison"
  )

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-indigo-500"
      onClick={() => {
        // Rediriger vers la section détaillée des livraisons
        const section = document.getElementById('mes-livraisons-section')
        if (section) {
          section.scrollIntoView({ behavior: 'smooth' })
        }
      }}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Truck className="h-5 w-5 text-indigo-600" />
          Mes livraisons
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* Compteur total */}
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-indigo-600">
              {mesLivraisons.length}
            </span>
            <span className="text-sm text-gray-500">
              livraison{mesLivraisons.length > 1 ? "s" : ""} assignée{mesLivraisons.length > 1 ? "s" : ""}
            </span>
          </div>

          {/* Détails par type */}
          <div className="space-y-1 pt-2 border-t">
            {livraisonsAReceptionner.length > 0 && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-indigo-400" />
                  <span className="text-gray-600">À réceptionner</span>
                </div>
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                  {livraisonsAReceptionner.length}
                </Badge>
              </div>
            )}
            
            {livraisonsAEffectuer.length > 0 && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-green-500" />
                  <span className="text-gray-600">À livrer</span>
                </div>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {livraisonsAEffectuer.length}
                </Badge>
              </div>
            )}
          </div>

          {/* Indication cliquable */}
          <p className="text-xs text-gray-400 text-center pt-2 border-t">
            Cliquez pour voir les détails
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useStore } from "@/stores/useStore"
import { 
  Package, 
  Clock, 
  CheckCircle, 
  Truck,
  TrendingUp,
  PackageCheck,
  AlertCircle
} from 'lucide-react'
import CreateDemandeModal from "@/components/demandes/create-demande-modal"
import UniversalClosureModal from "@/components/modals/universal-closure-modal"
import LivraisonsAEffectuer from "@/components/dashboard/livraisons-a-effectuer"
import { useAutoReload } from "@/hooks/useAutoReload"

export default function ResponsableLivreurDashboard() {
  const { currentUser, demandes, isLoading } = useStore()
  const { handleManualReload } = useAutoReload("RESPONSABLE-LIVREUR")

  const [stats, setStats] = useState({
    total: 0,
    aRecevoir: 0,
    aLivrer: 0,
    livrees: 0,
    mesDemandesEnCours: 0,
  })

  const [createDemandeModalOpen, setCreateDemandeModalOpen] = useState(false)
  const [demandeType, setDemandeType] = useState<"materiel" | "outillage">("materiel")
  const [universalClosureModalOpen, setUniversalClosureModalOpen] = useState(false)

  useEffect(() => {
    if (currentUser && demandes) {
      // Demandes où je suis assigné comme livreur
      const mesLivraisons = demandes.filter((d) => d.livreurAssigneId === currentUser.id)
      
      // Mes propres demandes en cours
      const mesDemandes = demandes.filter((d) => d.technicienId === currentUser.id)
      const mesDemandesEnCours = mesDemandes.filter((d) => 
        !["brouillon", "cloturee", "rejetee", "archivee"].includes(d.status)
      )

      // Statistiques des livraisons
      const aRecevoir = mesLivraisons.filter((d) => d.status === "en_attente_reception_livreur")
      const aLivrer = mesLivraisons.filter((d) => d.status === "en_attente_livraison")
      const livrees = mesLivraisons.filter((d) => 
        ["en_attente_validation_finale_demandeur", "cloturee"].includes(d.status)
      )

      setStats({
        total: mesLivraisons.length,
        aRecevoir: aRecevoir.length,
        aLivrer: aLivrer.length,
        livrees: livrees.length,
        mesDemandesEnCours: mesDemandesEnCours.length,
      })

      console.log("📊 [LIVREUR-STATS]", {
        total: mesLivraisons.length,
        aRecevoir: aRecevoir.length,
        aLivrer: aLivrer.length,
        livrees: livrees.length,
        mesDemandesEnCours: mesDemandesEnCours.length,
      })
    }
  }, [demandes, currentUser])

  const generateChartData = () => {
    return [
      { name: "À recevoir", value: stats.aRecevoir, color: "#3b82f6" },
      { name: "À livrer", value: stats.aLivrer, color: "#f97316" },
      { name: "Livrées", value: stats.livrees, color: "#22c55e" },
    ]
  }

  if (!currentUser) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Tableau de bord - Responsable Livreur
          </h1>
          <p className="text-gray-500 mt-1">
            Gérez vos livraisons et suivez vos demandes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualReload}
            disabled={isLoading}
          >
            {isLoading ? "Chargement..." : "Actualiser"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUniversalClosureModalOpen(true)}
            className="text-green-600 hover:text-green-700 hover:bg-green-50"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            <span className="text-sm">Clôturer mes demandes</span>
          </Button>
        </div>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total livraisons */}
        <Card className="border-l-4 border-l-gray-500 hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Livraisons
              </CardTitle>
              <Package className="h-4 w-4 text-gray-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <p className="text-xs text-gray-500 mt-1">Toutes mes livraisons</p>
          </CardContent>
        </Card>

        {/* À recevoir */}
        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                À recevoir
              </CardTitle>
              <PackageCheck className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.aRecevoir}</div>
            <p className="text-xs text-gray-500 mt-1">Matériel à récupérer</p>
          </CardContent>
        </Card>

        {/* À livrer */}
        <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                À livrer
              </CardTitle>
              <Truck className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.aLivrer}</div>
            <p className="text-xs text-gray-500 mt-1">Prêt à livrer</p>
          </CardContent>
        </Card>

        {/* Livrées */}
        <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Livrées
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.livrees}</div>
            <p className="text-xs text-gray-500 mt-1">Livraisons terminées</p>
          </CardContent>
        </Card>

        {/* Mes demandes */}
        <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Mes demandes
              </CardTitle>
              <Clock className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.mesDemandesEnCours}</div>
            <p className="text-xs text-gray-500 mt-1">En cours</p>
          </CardContent>
        </Card>
      </div>

      {/* Section des livraisons */}
      <LivraisonsAEffectuer />

      {/* Message si aucune livraison */}
      {stats.total === 0 && (
        <Card className="border-gray-200 bg-gray-50/30">
          <CardContent className="py-12">
            <div className="text-center">
              <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Aucune livraison en cours
              </h3>
              <p className="text-gray-500 mb-6">
                Vous n'avez pas de livraisons assignées pour le moment
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <CreateDemandeModal
        isOpen={createDemandeModalOpen}
        onClose={() => setCreateDemandeModalOpen(false)}
        type={demandeType}
      />

      <UniversalClosureModal
        isOpen={universalClosureModalOpen}
        onClose={() => setUniversalClosureModalOpen(false)}
      />
    </div>
  )
}

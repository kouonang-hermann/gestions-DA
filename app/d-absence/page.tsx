"use client"

import { useState } from "react"
import { ArrowLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import AbsenceActionsModal from "@/components/absence/absence-actions-modal"
import CreateAbsenceModal from "@/components/absence/create-absence-modal"
import AbsencesList from "@/components/absence/absences-list"

export default function DAbsencePage() {
  const router = useRouter()
  const [actionsModalOpen, setActionsModalOpen] = useState(false)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [showList, setShowList] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const handleCreateNew = () => {
    setCreateModalOpen(true)
  }

  const handleViewExisting = () => {
    setShowList(true)
  }

  const handleCreateSuccess = () => {
    setRefreshKey(prev => prev + 1)
    setShowList(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Demandes d'Absence
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Gérez vos demandes d'absence et consultez leur statut
              </p>
            </div>
          </div>
          <Button
            onClick={() => setActionsModalOpen(true)}
            className="flex items-center gap-2"
            style={{ backgroundColor: '#015fc4' }}
          >
            <Plus className="h-4 w-4" />
            Demande d'absence
          </Button>
        </div>

        {showList ? (
          <div key={refreshKey}>
            <AbsencesList />
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Bienvenue dans la gestion des absences
                </h2>
                <p className="text-gray-600">
                  Cliquez sur le bouton "Demande d'absence" pour créer une nouvelle demande ou consulter vos demandes existantes.
                </p>
              </div>
              <Button
                onClick={() => setActionsModalOpen(true)}
                size="lg"
                style={{ backgroundColor: '#015fc4' }}
              >
                <Plus className="h-5 w-5 mr-2" />
                Commencer
              </Button>
            </div>
          </div>
        )}

        {/* Modal de choix d'action */}
        <AbsenceActionsModal
          open={actionsModalOpen}
          onOpenChange={setActionsModalOpen}
          onCreateNew={handleCreateNew}
          onViewExisting={handleViewExisting}
        />

        {/* Modal de création */}
        <CreateAbsenceModal
          open={createModalOpen}
          onOpenChange={setCreateModalOpen}
          onSuccess={handleCreateSuccess}
        />
      </div>
    </div>
  )
}

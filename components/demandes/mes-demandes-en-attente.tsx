"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useStore } from "@/stores/useStore"
import { XCircle, Eye, Package, AlertCircle } from "lucide-react"
import type { Demande } from "@/types"
import DemandeDetailsModal from "@/components/modals/demande-details-modal"

export default function MesDemandesEnAttente() {
  const { currentUser, demandes, loadDemandes, executeAction, isLoading, error } = useStore()
  const [demandesEnAttente, setDemandesEnAttente] = useState<Demande[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null)

  useEffect(() => {
    if (currentUser) {
      loadDemandes()
    }
  }, [currentUser])

  useEffect(() => {
    if (currentUser && demandes.length > 0) {
      // Filtrer les demandes créées par l'utilisateur qui sont en attente de validation conducteur
      const filtered = demandes.filter(
        (d) => d.technicienId === currentUser.id && 
               d.status === "en_attente_validation_conducteur"
      )
      
      console.log(`📋 [MES-DEMANDES-EN-ATTENTE] ${filtered.length} demande(s) en attente de validation conducteur`)
      setDemandesEnAttente(filtered)
    }
  }, [currentUser, demandes])

  const handleAnnuler = async (demandeId: string) => {
    const confirmation = confirm("Êtes-vous sûr de vouloir annuler cette demande ? Cette action est irréversible.")
    if (!confirmation) return

    const commentaire = prompt("Motif de l'annulation (optionnel):") || "Annulée par le demandeur"
    
    setActionLoading(demandeId)

    try {
      const success = await executeAction(demandeId, "annuler", { commentaire })
      if (success) {
        await loadDemandes()
        setDetailsModalOpen(false)
        setSelectedDemande(null)
      } else {
        alert(error || "Erreur lors de l'annulation")
      }
    } catch (err) {
      console.error("Erreur lors de l'annulation:", err)
      alert("Erreur lors de l'annulation")
    } finally {
      setActionLoading(null)
    }
  }

  const handleViewDetails = (demande: Demande) => {
    setSelectedDemande(demande)
    setDetailsModalOpen(true)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (demandesEnAttente.length === 0) {
    return null // Ne rien afficher s'il n'y a pas de demandes en attente
  }

  return (
    <>
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-yellow-900 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Mes demandes en attente de validation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {demandesEnAttente.map((demande) => (
              <div
                key={demande.id}
                className="bg-white p-4 rounded-lg border border-yellow-200 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-gray-800">{demande.numero}</h3>
                      <Badge className="bg-yellow-500 text-white text-xs">En attente validation conducteur</Badge>
                      <Badge variant="outline" className="text-xs">
                        {demande.type === "materiel" ? "Matériel" : "Outillage"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      Projet: {demande.projet?.nom} • {demande.items?.length || 0} article{(demande.items?.length || 0) > 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-gray-500">
                      Créée le {new Date(demande.dateCreation).toLocaleDateString()}
                    </p>
                    {demande.commentaires && (
                      <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded mt-2">
                        <strong>Commentaire:</strong> {demande.commentaires}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAnnuler(demande.id)}
                      disabled={actionLoading === demande.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      {actionLoading === demande.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      Annuler
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewDetails(demande)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Modal de détails */}
      <DemandeDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false)
          setSelectedDemande(null)
        }}
        demandeId={selectedDemande?.id || null}
        mode="view"
      />
    </>
  )
}

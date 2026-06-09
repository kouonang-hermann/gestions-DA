"use client"

import { useMemo, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Eye, Download, Inbox } from "lucide-react"
import { generateCongePDF } from "@/lib/conge-pdf-generator"
import DemandeCongeDetailsModal from "@/components/conges/demande-conge-details-modal"
import type { DemandeConge } from "@/types"

interface DemandesCongeListModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  demandes: DemandeConge[]
  /**
   * Couleur d'accent (tailwind class) utilisée pour le titre et l'icône.
   * Exemples : "text-green-600", "text-red-600", "text-orange-600", "text-blue-600"
   */
  accentColor?: string
  /**
   * Callback appelé après une mise à jour (validation, modification...) pour
   * permettre au parent de recharger ses données.
   */
  onUpdated?: () => void
}

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  brouillon: { label: "Brouillon", variant: "secondary" },
  soumise: { label: "Soumise", variant: "default" },
  en_attente_validation_hierarchique: { label: "En attente responsable", variant: "outline" },
  en_attente_validation_rh: { label: "En attente RH", variant: "outline" },
  en_attente_visa_dg: { label: "En attente DG", variant: "outline" },
  approuvee: { label: "Approuvée", variant: "default" },
  rejetee: { label: "Rejetée", variant: "destructive" },
  annulee: { label: "Annulée", variant: "secondary" },
}

const TYPE_LABELS: Record<string, string> = {
  annuel: "Congés annuel",
  maladie: "Congés maladie",
  parental: "Congés de parental",
  recuperation: "Congés pour récupération",
  autres: "Autres",
}

export default function DemandesCongeListModal({
  isOpen,
  onClose,
  title,
  demandes,
  accentColor = "text-blue-600",
  onUpdated,
}: DemandesCongeListModalProps) {
  const [selectedDemande, setSelectedDemande] = useState<DemandeConge | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  const sortedDemandes = useMemo(() => {
    return [...demandes].sort(
      (a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime()
    )
  }, [demandes])

  const formatDate = (dateString: string | Date) =>
    new Date(dateString).toLocaleDateString("fr-FR")

  const handleViewDetails = (d: DemandeConge) => {
    setSelectedDemande(d)
    setDetailsOpen(true)
  }

  const handleDownloadPDF = async (d: DemandeConge) => {
    setDownloadingId(d.id)
    try {
      await generateCongePDF(d as any)
    } catch (error) {
      console.error("Erreur téléchargement PDF:", error)
      alert("Erreur lors de la génération du PDF")
    } finally {
      setDownloadingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status] || { label: status, variant: "default" as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${accentColor}`}>
              <Inbox className="h-5 w-5" />
              {title}
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({sortedDemandes.length})
              </span>
            </DialogTitle>
          </DialogHeader>

          {sortedDemandes.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Inbox className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>Aucune demande dans cette catégorie</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedDemandes.map((demande) => (
                <div
                  key={demande.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2 flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold">{demande.numero}</span>
                        {getStatusBadge(demande.status)}
                      </div>
                      <p className="text-sm text-gray-600">
                        {TYPE_LABELS[demande.typeConge] || demande.typeConge}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      Créée le {formatDate(demande.dateCreation)}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-3">
                    <div>
                      <p className="text-gray-600 text-xs">Période</p>
                      <p className="font-medium flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(demande.dateDebut)} → {formatDate(demande.dateFin)}
                      </p>
                      <p className="text-gray-500 text-xs">{demande.nombreJours} jour(s)</p>
                    </div>
                    {demande.employe && (
                      <div>
                        <p className="text-gray-600 text-xs">Employé</p>
                        <p className="font-medium">
                          {demande.employe.prenom} {demande.employe.nom}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(demande)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Voir détails
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDownloadPDF(demande)}
                      disabled={downloadingId === demande.id}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {downloadingId === demande.id ? "..." : "PDF"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {selectedDemande && (
        <DemandeCongeDetailsModal
          isOpen={detailsOpen}
          onClose={() => {
            setDetailsOpen(false)
            setSelectedDemande(null)
          }}
          demande={selectedDemande}
          onUpdated={() => {
            onUpdated?.()
          }}
        />
      )}
    </>
  )
}

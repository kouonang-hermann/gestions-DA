"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, User, FileText, Loader2, Download } from "lucide-react"
import { useStore } from "@/stores/useStore"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { downloadAbsencePDF } from "@/lib/absence-pdf-generator"

interface DemandeAbsence {
  id: string
  numero: string
  typeAbsence: string
  motif: string
  dateDebut: string
  dateFin: string
  nombreJours: number
  status: string
  commentaireEmploye?: string
  dateCreation: string
  dateSoumission?: string
  dateValidation?: string
  rejetMotif?: string
  responsable: {
    id: string
    nom: string
    prenom: string
  }
  employe?: {
    nom: string
    prenom: string
  }
}

const statusLabels: Record<string, string> = {
  brouillon: "Brouillon",
  soumise: "Soumise",
  en_attente_validation_hierarchique: "En attente validation hiérarchique",
  en_attente_validation_rh: "En attente validation RH",
  en_attente_visa_dg: "En attente visa DG",
  approuvee: "Approuvée",
  rejetee: "Rejetée",
  annulee: "Annulée"
}

const statusColors: Record<string, { bg: string; text: string }> = {
  brouillon: { bg: "#f3f4f6", text: "#374151" },
  soumise: { bg: "#dbeafe", text: "#1e40af" },
  en_attente_validation_hierarchique: { bg: "#ffedd5", text: "#9a3412" },
  en_attente_validation_rh: { bg: "#fef3c7", text: "#92400e" },
  en_attente_visa_dg: { bg: "#ede9fe", text: "#5b21b6" },
  approuvee: { bg: "#dcfce7", text: "#166534" },
  rejetee: { bg: "#fecaca", text: "#dc2626" },
  annulee: { bg: "#f3f4f6", text: "#374151" }
}

export default function AbsencesList() {
  const { currentUser, token } = useStore()
  const [demandes, setDemandes] = useState<DemandeAbsence[]>([])
  const [loading, setLoading] = useState(true)

  const loadDemandes = useCallback(async () => {
    if (!token) return

    setLoading(true)
    try {
      const response = await fetch("/api/absences", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      const result = await response.json()

      if (result.success) {
        setDemandes(result.data || [])
      } else {
        console.error("Erreur:", result.error)
      }
    } catch (error) {
      console.error("Erreur de chargement:", error)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadDemandes()
  }, [loadDemandes])

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  if (demandes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mes demandes d'absence</CardTitle>
          <CardDescription>Aucune demande d'absence trouvée</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>Vous n'avez pas encore créé de demande d'absence</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Mes demandes d'absence</CardTitle>
          <CardDescription>
            {demandes.length} demande{demandes.length > 1 ? "s" : ""} au total
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {demandes.map((demande) => (
          <Card key={demande.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{demande.numero}</div>
                    <div className="text-sm text-gray-500">
                      {demande.typeAbsence}
                    </div>
                  </div>
                </div>
                <Badge
                  style={{
                    backgroundColor: statusColors[demande.status]?.bg || "#f3f4f6",
                    color: statusColors[demande.status]?.text || "#374151"
                  }}
                >
                  {statusLabels[demande.status] || demande.status}
                </Badge>
              </div>

              <div className="space-y-3">
                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Du:</span>
                    <span className="font-medium">
                      {format(new Date(demande.dateDebut), "dd/MM/yyyy", { locale: fr })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">Au:</span>
                    <span className="font-medium">
                      {format(new Date(demande.dateFin), "dd/MM/yyyy", { locale: fr })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-blue-600">
                      {demande.nombreJours} jour{demande.nombreJours > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                {/* Responsable */}
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-600">Responsable:</span>
                  <span className="font-medium">
                    {demande.responsable.prenom} {demande.responsable.nom}
                  </span>
                </div>

                {/* Motif */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs font-medium text-gray-500 mb-1">Motif</div>
                  <div className="text-sm text-gray-900">{demande.motif}</div>
                </div>

                {/* Commentaire employé */}
                {demande.commentaireEmploye && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="text-xs font-medium text-blue-700 mb-1">Votre commentaire</div>
                    <div className="text-sm text-blue-900">{demande.commentaireEmploye}</div>
                  </div>
                )}

                {/* Motif de rejet */}
                {demande.rejetMotif && (
                  <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-xs font-medium text-red-700 mb-1">Motif de rejet</div>
                    <div className="text-sm text-red-900">{demande.rejetMotif}</div>
                  </div>
                )}

                {/* Dates de traitement */}
                <div className="flex flex-wrap gap-4 text-xs text-gray-500 pt-2 border-t">
                  <div>
                    Créée le {format(new Date(demande.dateCreation), "dd/MM/yyyy à HH:mm", { locale: fr })}
                  </div>
                  {demande.dateSoumission && (
                    <div>
                      Soumise le {format(new Date(demande.dateSoumission), "dd/MM/yyyy à HH:mm", { locale: fr })}
                    </div>
                  )}
                  {demande.dateValidation && (
                    <div>
                      Validée le {format(new Date(demande.dateValidation), "dd/MM/yyyy à HH:mm", { locale: fr })}
                    </div>
                  )}
                </div>

                {/* Bouton de téléchargement */}
                <div className="mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const pdfData = {
                        numero: demande.numero,
                        employe: {
                          nom: demande.employe?.nom || currentUser?.nom || '',
                          prenom: demande.employe?.prenom || currentUser?.prenom || ''
                        },
                        dateDebut: format(new Date(demande.dateDebut), "dd/MM/yyyy", { locale: fr }),
                        dateFin: format(new Date(demande.dateFin), "dd/MM/yyyy", { locale: fr }),
                        nombreJours: demande.nombreJours,
                        motif: demande.motif,
                        typeAbsence: demande.typeAbsence,
                        status: demande.status,
                        dateCreation: format(new Date(demande.dateCreation), "dd/MM/yyyy à HH:mm", { locale: fr }),
                        responsable: {
                          nom: demande.responsable.nom,
                          prenom: demande.responsable.prenom
                        }
                      }
                      downloadAbsencePDF(pdfData)
                    }}
                    className="w-full sm:w-auto"
                    style={{ borderColor: '#015fc4', color: '#015fc4' }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger PDF
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

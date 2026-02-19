"use client"

import { useState, useEffect } from "react"
import { useStore } from "@/stores/useStore"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, CheckCircle2, XCircle, Clock, User, FileText, AlertCircle, Eye } from "lucide-react"
import DemandeCongeDetailsModal from "@/components/conges/demande-conge-details-modal"
import type { DemandeConge } from "@/types"

export default function DecideurPage() {
  const router = useRouter()
  const { currentUser, isAuthenticated } = useStore()
  const [demandes, setDemandes] = useState<DemandeConge[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("conges")
  const [selectedDemande, setSelectedDemande] = useState<DemandeConge | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/")
      return
    }

    // Vérifier si l'utilisateur a le droit d'accéder à cette page
    const rolesAutorises = ["responsable_rh", "directeur_general", "superadmin"]
    const isResponsableHierarchique = currentUser?.role && !rolesAutorises.includes(currentUser.role)
    
    if (!currentUser || (!rolesAutorises.includes(currentUser.role) && !isResponsableHierarchique)) {
      // Vérifier si l'utilisateur peut être responsable hiérarchique
      loadDemandes()
    } else {
      loadDemandes()
    }
  }, [isAuthenticated, currentUser, router])

  const loadDemandes = async () => {
    setLoading(true)
    try {
      const token = useStore.getState().token
      const response = await fetch("/api/conges", {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      })
      const data = await response.json()
      if (data.success) {
        // Filtrer les demandes selon le rôle de l'utilisateur
        const demandesFiltrees = filterDemandesParRole(data.data)
        setDemandes(demandesFiltrees)
      }
    } catch (error) {
      console.error("Erreur lors du chargement des demandes:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterDemandesParRole = (allDemandes: DemandeConge[]) => {
    if (!currentUser) return []

    switch (currentUser.role) {
      case "responsable_rh":
        return allDemandes.filter(d => d.status === "en_attente_validation_rh")
      
      case "directeur_general":
        return allDemandes.filter(d => d.status === "en_attente_visa_dg")
      
      case "superadmin":
        return allDemandes // Voit tout
      
      default:
        // Responsable hiérarchique : voit uniquement les demandes où il est responsable
        return allDemandes.filter(d => 
          d.responsableId === currentUser.id && 
          d.status === "en_attente_validation_hierarchique"
        )
    }
  }

  const handleAction = async (demandeId: string, action: "valider" | "rejeter", commentaire?: string) => {
    try {
      const token = useStore.getState().token
      const response = await fetch(`/api/conges/${demandeId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ action, commentaire })
      })

      const data = await response.json()
      if (data.success) {
        // Recharger les demandes
        loadDemandes()
        alert(`✅ Demande ${action === "valider" ? "validée" : "rejetée"} avec succès`)
      } else {
        alert(`❌ Erreur: ${data.error}`)
      }
    } catch (error) {
      console.error("Erreur lors de l'action:", error)
      alert("❌ Erreur lors du traitement de la demande")
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      "en_attente_validation_hierarchique": { label: "En attente responsable", variant: "secondary" },
      "en_attente_validation_rh": { label: "En attente RH", variant: "secondary" },
      "en_attente_visa_dg": { label: "En attente DG", variant: "secondary" },
      "approuvee": { label: "Approuvée", variant: "default" },
      "rejetee": { label: "Rejetée", variant: "destructive" },
    }
    const config = statusConfig[status] || { label: status, variant: "outline" }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getTypeCongeLabel = (type: string) => {
    const types: Record<string, string> = {
      "annuel": "Congés annuel",
      "maladie": "Congés maladie",
      "parental": "Congés parental",
      "recuperation": "Congés récupération",
      "autres": "Autres"
    }
    return types[type] || type
  }

  const getRoleLabel = () => {
    switch (currentUser?.role) {
      case "responsable_rh":
        return "Responsable RH"
      case "directeur_general":
        return "Directeur Général"
      case "superadmin":
        return "Super Admin"
      default:
        return "Responsable Hiérarchique"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Chargement des demandes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Espace Décideur</h1>
        <p className="text-gray-600">
          Vous êtes connecté en tant que <span className="font-semibold">{getRoleLabel()}</span>
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="conges">
            <Calendar className="h-4 w-4 mr-2" />
            Demandes de Congés ({demandes.length})
          </TabsTrigger>
          <TabsTrigger value="absences" disabled>
            <AlertCircle className="h-4 w-4 mr-2" />
            Demandes d'Absence (Bientôt)
          </TabsTrigger>
          <TabsTrigger value="paiements" disabled>
            <FileText className="h-4 w-4 mr-2" />
            Demandes de Paiement (Bientôt)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="conges" className="mt-6">
          {demandes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Aucune demande en attente</h3>
                <p className="text-gray-600 text-center">
                  Vous n'avez aucune demande de congés à traiter pour le moment.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {demandes.map((demande) => (
                <Card key={demande.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <User className="h-5 w-5" />
                          {demande.employe?.prenom} {demande.employe?.nom}
                        </CardTitle>
                        <CardDescription>
                          Demande n°{demande.numero} • Matricule: {demande.matricule}
                        </CardDescription>
                      </div>
                      {getStatusBadge(demande.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Type de congé</p>
                        <p className="font-medium">{getTypeCongeLabel(demande.typeConge)}</p>
                        {demande.autresPrecision && (
                          <p className="text-sm text-gray-500 italic">{demande.autresPrecision}</p>
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Période</p>
                        <p className="font-medium">
                          {new Date(demande.dateDebut).toLocaleDateString()} → {new Date(demande.dateFin).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-gray-500">{demande.nombreJours} jour(s)</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Ancienneté</p>
                        <p className="font-medium">{demande.anciennete}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Email</p>
                        <p className="font-medium text-sm">{demande.employe?.email}</p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t">
                      <Button
                        onClick={() => {
                          setSelectedDemande(demande)
                          setDetailsModalOpen(true)
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Vue
                      </Button>
                      <Button
                        onClick={() => {
                          const confirm = window.confirm("Êtes-vous sûr de vouloir valider cette demande ?")
                          if (confirm) handleAction(demande.id, "valider")
                        }}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Valider
                      </Button>
                      <Button
                        onClick={() => {
                          const motif = window.prompt("Motif du rejet (obligatoire):")
                          if (motif && motif.trim()) {
                            handleAction(demande.id, "rejeter", motif)
                          } else if (motif !== null) {
                            alert("Le motif du rejet est obligatoire")
                          }
                        }}
                        variant="destructive"
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Rejeter
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="absences">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600">Cette fonctionnalité sera disponible prochainement.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paiements">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600">Cette fonctionnalité sera disponible prochainement.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DemandeCongeDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false)
          setSelectedDemande(null)
        }}
        demande={selectedDemande}
      />
    </div>
  )
}

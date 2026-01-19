"use client"

import { useState, useEffect } from "react"
import { useStore } from "@/stores/useStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Package, Truck, Clock, CheckCircle, AlertCircle, User, Eye, DollarSign } from "lucide-react"
import type { Demande } from "@/types"
import DemandeDetailsModal from "@/components/modals/demande-details-modal"

export default function PreparationOutillageList() {
  const { currentUser, demandes, loadDemandes, executeAction, isLoading, error, users } = useStore()
  const [demandesAPreparer, setDemandesAPreparer] = useState<Demande[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null)
  const [preparationModalOpen, setPreparationModalOpen] = useState(false)
  const [demandeToPrep, setDemandeToPrep] = useState<string | null>(null)
  const [selectedLivreur, setSelectedLivreur] = useState<string>("")
  const [commentaire, setCommentaire] = useState<string>("")
  const [prixModalOpen, setPrixModalOpen] = useState(false)
  const [prixUnitaires, setPrixUnitaires] = useState<{ [itemId: string]: string }>({})

  useEffect(() => {
    if (currentUser) {
      loadDemandes()
      useStore.getState().loadUsers()
    }
  }, [currentUser, loadDemandes])

  useEffect(() => {
    if (currentUser) {
      // Filtrer les demandes d'outillage en attente de validation logistique finale
      const filtered = demandes.filter((d) => 
        d.type === "outillage" &&
        d.status === "en_attente_validation_logistique_finale" &&
        (!currentUser.projets || currentUser.projets.length === 0 || currentUser.projets.includes(d.projetId))
      )
      
      console.log(`📦 [PREPARATION-OUTILLAGE] Demandes à préparer:`, filtered.length)
      setDemandesAPreparer(filtered)
    }
  }, [currentUser, demandes])

  const handleOpenPreparationModal = (demandeId: string) => {
    setDemandeToPrep(demandeId)
    setSelectedLivreur("")
    setCommentaire("")
    setPreparationModalOpen(true)
  }

  const handleClosePreparationModal = () => {
    setPreparationModalOpen(false)
    setDemandeToPrep(null)
    setSelectedLivreur("")
    setCommentaire("")
  }

  const handleOpenPrixModal = (demande: Demande) => {
    setSelectedDemande(demande)
    const initialPrix: { [itemId: string]: string } = {}
    demande.items.forEach(item => {
      initialPrix[item.id] = item.prixUnitaire?.toString() || ""
    })
    setPrixUnitaires(initialPrix)
    setPrixModalOpen(true)
  }

  const handleSavePrix = async () => {
    if (!selectedDemande) return

    setActionLoading(selectedDemande.id)
    try {
      const prixData: { [itemId: string]: number } = {}
      Object.entries(prixUnitaires).forEach(([itemId, prix]) => {
        const prixNum = parseFloat(prix)
        if (!isNaN(prixNum) && prixNum > 0) {
          prixData[itemId] = prixNum
        }
      })

      const success = await executeAction(selectedDemande.id, "update_prix", { prix: prixData })
      if (success) {
        await loadDemandes()
        setPrixModalOpen(false)
        setSelectedDemande(null)
      } else {
        alert(error || "Erreur lors de la mise à jour des prix")
      }
    } catch (err) {
      console.error("Erreur lors de la mise à jour des prix:", err)
      alert("Erreur lors de la mise à jour des prix")
    } finally {
      setActionLoading(null)
    }
  }

  const handleConfirmPreparation = async () => {
    if (!demandeToPrep) return
    
    if (!selectedLivreur) {
      alert("Veuillez sélectionner un livreur")
      return
    }

    setActionLoading(demandeToPrep)
    setPreparationModalOpen(false)

    try {
      const success = await executeAction(demandeToPrep, "valider", { 
        commentaire: commentaire || undefined,
        livreurAssigneId: selectedLivreur 
      })
      if (success) {
        await loadDemandes()
        handleClosePreparationModal()
      } else {
        alert(error || "Erreur lors de la validation")
      }
    } catch (err) {
      console.error("Erreur lors de la validation:", err)
      alert("Erreur lors de la validation")
    } finally {
      setActionLoading(null)
    }
  }

  const handleViewDetails = (demande: Demande) => {
    setSelectedDemande(demande)
    setDetailsModalOpen(true)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      "en_attente_validation_logistique_finale": { label: "À préparer", color: "bg-orange-500" }
    }
    const config = statusConfig[status] || { label: status, color: "bg-gray-500" }
    return <Badge className={`${config.color} text-white`}>{config.label}</Badge>
  }

  const livreurs = users.filter(u => 
    u.role === "responsable_livreur" || 
    u.role === "employe" || 
    u.role === "conducteur_travaux" ||
    u.role === "responsable_travaux" ||
    u.role === "responsable_logistique" ||
    u.role === "responsable_appro" ||
    u.role === "charge_affaire"
  )

  if (!currentUser) {
    return <div className="text-center p-6 text-gray-500">Chargement...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Préparation des sorties d'outillage ({demandesAPreparer.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center p-6 text-gray-500">Chargement...</div>
          ) : demandesAPreparer.length === 0 ? (
            <div className="text-center p-6 text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p>Aucune demande d'outillage à préparer</p>
            </div>
          ) : (
            <div className="space-y-4">
              {demandesAPreparer.map((demande) => (
                <Card key={demande.id} className="border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{demande.numero}</h3>
                          {getStatusBadge(demande.status)}
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                            Outillage
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">Demandeur:</span>
                            <span className="font-medium">{demande.technicien?.nom}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span className="text-gray-600">Date:</span>
                            <span className="font-medium">
                              {new Date(demande.dateCreation).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="bg-gray-50 p-3 rounded-md mb-3">
                          <p className="text-sm font-medium mb-2">Articles ({demande.items.length}):</p>
                          <div className="space-y-1">
                            {demande.items.slice(0, 3).map((item) => (
                              <div key={item.id} className="text-sm flex justify-between">
                                <span className="text-gray-700">
                                  {item.article?.nom} - Qté: {item.quantiteValidee || item.quantiteDemandee}
                                </span>
                                {item.prixUnitaire && (
                                  <span className="text-blue-600 font-medium">
                                    {item.prixUnitaire.toFixed(0)} FCFA
                                  </span>
                                )}
                              </div>
                            ))}
                            {demande.items.length > 3 && (
                              <p className="text-xs text-gray-500">
                                +{demande.items.length - 3} autre(s) article(s)
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(demande)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Détails
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenPrixModal(demande)}
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Saisir prix
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleOpenPreparationModal(demande.id)}
                            disabled={actionLoading === demande.id}
                            className="bg-[#015fc4] hover:bg-[#014a9c]"
                          >
                            {actionLoading === demande.id ? (
                              <>Préparation...</>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Valider et assigner livreur
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de préparation */}
      <Dialog open={preparationModalOpen} onOpenChange={setPreparationModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Valider et assigner un livreur</DialogTitle>
            <DialogDescription>
              Sélectionnez un livreur pour cette demande d'outillage
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="livreur">Livreur *</Label>
              <Select value={selectedLivreur} onValueChange={setSelectedLivreur}>
                <SelectTrigger id="livreur">
                  <SelectValue placeholder="Sélectionner un livreur" />
                </SelectTrigger>
                <SelectContent>
                  {livreurs.map((livreur) => (
                    <SelectItem key={livreur.id} value={livreur.id}>
                      {livreur.nom} {livreur.prenom} ({livreur.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="commentaire">Commentaire (optionnel)</Label>
              <Textarea
                id="commentaire"
                placeholder="Ajouter un commentaire..."
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClosePreparationModal}>
              Annuler
            </Button>
            <Button 
              onClick={handleConfirmPreparation}
              disabled={!selectedLivreur}
              className="bg-[#015fc4] hover:bg-[#014a9c]"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de saisie des prix */}
      <Dialog open={prixModalOpen} onOpenChange={setPrixModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Saisir les prix unitaires</DialogTitle>
            <DialogDescription>
              Demande: {selectedDemande?.numero}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4 max-h-96 overflow-y-auto">
            {selectedDemande?.items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-md">
                <div className="flex-1">
                  <p className="font-medium">{item.article?.nom}</p>
                  <p className="text-sm text-gray-600">
                    Qté: {item.quantiteValidee || item.quantiteDemandee} {item.article?.unite}
                  </p>
                </div>
                <div className="w-32">
                  <Label htmlFor={`prix-${item.id}`} className="text-xs">Prix unitaire (FCFA)</Label>
                  <Input
                    id={`prix-${item.id}`}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={prixUnitaires[item.id] || ""}
                    onChange={(e) => setPrixUnitaires(prev => ({
                      ...prev,
                      [item.id]: e.target.value
                    }))}
                  />
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPrixModalOpen(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleSavePrix}
              disabled={actionLoading === selectedDemande?.id}
              className="bg-[#015fc4] hover:bg-[#014a9c]"
            >
              {actionLoading === selectedDemande?.id ? "Enregistrement..." : "Enregistrer les prix"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de détails */}
      {selectedDemande && (
        <DemandeDetailsModal
          isOpen={detailsModalOpen}
          onClose={() => {
            setDetailsModalOpen(false)
            setSelectedDemande(null)
          }}
          demandeId={selectedDemande.id}
          mode="view"
        />
      )}
    </div>
  )
}

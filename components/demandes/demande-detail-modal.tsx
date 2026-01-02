"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from "@/stores/useStore"
import { CheckCircle, XCircle, Package, Truck, User } from 'lucide-react'
import type { Demande, DemandeStatus } from "@/types"

interface DemandeDetailModalProps {
  isOpen: boolean
  onClose: () => void
  demandeId: string | null
  mode: "view" | "edit"
  showDeliveryColumns?: boolean // Afficher les colonnes de quantités livrées/restantes
}

const statusColors: Record<DemandeStatus, string> = {
  brouillon: "bg-gray-500",
  soumise: "bg-blue-500",
  en_attente_validation_conducteur: "bg-yellow-500",
  en_attente_validation_logistique: "bg-yellow-600",
  en_attente_validation_responsable_travaux: "bg-yellow-400",
  en_attente_validation_charge_affaire: "bg-blue-600",
  en_attente_preparation_appro: "bg-orange-400",
  en_attente_reception_livreur: "bg-indigo-400",
  en_attente_livraison: "bg-indigo-500",
  en_attente_validation_finale_demandeur: "bg-indigo-600",
  confirmee_demandeur: "bg-green-700",
  cloturee: "bg-green-800",
  rejetee: "bg-red-500",
  archivee: "bg-gray-600",
}

const statusLabels: Record<DemandeStatus, string> = {
  brouillon: "Brouillon",
  soumise: "Soumise",
  en_attente_validation_conducteur: "En attente conducteur",
  en_attente_validation_logistique: "En attente Logistique",
  en_attente_validation_responsable_travaux: "En attente responsable travaux",
  en_attente_validation_charge_affaire: "En attente chargé affaire",
  en_attente_preparation_appro: "En attente préparation appro",
  en_attente_reception_livreur: "En attente réception livreur",
  en_attente_livraison: "En attente livraison",
  en_attente_validation_finale_demandeur: "En attente validation finale demandeur",
  confirmee_demandeur: "Confirmée demandeur",
  cloturee: "Clôturée",
  rejetee: "Rejetée",
  archivee: "Archivée",
}

export default function DemandeDetailModal({ isOpen, onClose, demandeId, mode, showDeliveryColumns = false }: DemandeDetailModalProps) {
  const { currentUser, articles, executeAction, token } = useStore()
  const [demande, setDemande] = useState<Demande | null>(null)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (isOpen && demandeId) {
      loadDemande()
    }
  }, [isOpen, demandeId])

  const loadDemande = async () => {
    if (!demandeId || !token) return

    setLoading(true)
    try {
      const response = await fetch(`/api/demandes/${demandeId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
      const result = await response.json()

      if (result.success) {
        setDemande(result.data)
      }
    } catch (error) {
      console.error("Erreur lors du chargement de la demande:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: string, requiresComment = false, isReject = false) => {
    if (!demande || !currentUser) return

    setActionLoading(true)
    try {
      let commentaire
      
      if (isReject) {
        commentaire = prompt("Motif du rejet (obligatoire):")
        if (!commentaire) {
          setActionLoading(false)
          return
        }
      } else if (requiresComment) {
        commentaire = prompt("Commentaire:")
      }

      const success = await executeAction(demande.id, action, commentaire ? { commentaire } : {})
      
      if (success) {
        await loadDemande() // Recharger la demande
        // Optionnel: fermer le modal après certaines actions
        if (action === "soumettre") {
          onClose()
        }
      } else {
        alert("Erreur lors de l'exécution de l'action")
      }
    } catch (error) {
      console.error("Erreur lors de l'exécution de l'action:", error)
      alert("Erreur lors de l'exécution de l'action")
    } finally {
      setActionLoading(false)
    }
  }

  const canPerformAction = (action: string): boolean => {
    if (!demande || !currentUser) return false

    const role = currentUser.role
    const status = demande.status

    // SuperAdmin peut tout faire
    if ((role as string) === "superadmin") return true

    switch (action) {
      case "soumettre":
        return role === "employe" && status === "brouillon" && demande.technicienId === currentUser.id

      case "valider_materiel":
        return (
          role === "conducteur_travaux" &&
          status === "soumise" &&
          demande.type === "materiel" &&
          currentUser.projets.includes(demande.projetId)
        )

      case "valider_outillage":
        return (
          role === "responsable_logistique" &&
          status === "soumise" &&
          demande.type === "outillage" &&
          currentUser.projets.includes(demande.projetId)
        )

      case "rejeter":
        return (
          status === "soumise" &&
          ((demande.type === "materiel" && role === "conducteur_travaux") ||
            (demande.type === "outillage" && role === "responsable_logistique")) &&
          currentUser.projets.includes(demande.projetId)
        )

      case "preparer_sortie":
        return (
          role === "responsable_appro" &&
          (status === "en_attente_preparation_appro") &&
          currentUser.projets.includes(demande.projetId)
        )

      case "valider_preparation":
        return (
          role === "charge_affaire" &&
          status === "en_attente_validation_logistique" &&
          currentUser.projets.includes(demande.projetId)
        )

      case "validation_finale":
        return (
          role === "employe" &&
          status === "en_attente_validation_finale_demandeur" &&
          demande.technicienId === currentUser.id
        )

      case "cloturer":
        // Permettre à l'utilisateur de clôturer sa propre demande si elle est confirmée
        return (
          demande.technicienId === currentUser.id &&
          (status === "confirmee_demandeur" || status === "en_attente_validation_finale_demandeur")
        )

      case "archiver":
        return (role as string) === "superadmin" && status === "cloturee"

      default:
        return false
    }
  }

  const getArticleById = (articleId: string) => {
    return articles.find((a) => a.id === articleId)
  }

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto p-3 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Chargement...</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">Chargement des détails</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!demande) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[95vw] max-w-4xl p-3 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Demande introuvable</DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">La demande n'a pas été trouvée.</DialogDescription>
          </DialogHeader>
          <div className="text-center p-8">Demande non trouvée</div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <DialogTitle className="text-lg sm:text-2xl">{demande.numero}</DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">Détails - {demande.type}</DialogDescription>
            </div>
            <Badge className={`${statusColors[demande.status]} text-white text-xs truncate max-w-[150px] sm:max-w-none`}>{statusLabels[demande.status]}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations générales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations générales
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Employé</p>
                  <p className="font-medium">{demande.technicien?.prenom} {demande.technicien?.nom}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Projet</p>
                  <p className="font-medium">{demande.projet?.nom}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date de création</p>
                  <p className="font-medium">{new Date(demande.dateCreation).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Dernière modification</p>
                  <p className="font-medium">{new Date(demande.dateModification).toLocaleString()}</p>
                </div>
                {demande.dateSortie && (
                  <div>
                    <p className="text-sm text-gray-600">Date de sortie</p>
                    <p className="font-medium">{new Date(demande.dateSortie).toLocaleString()}</p>
                  </div>
                )}
                {demande.dateValidationFinale && (
                  <div>
                    <p className="text-sm text-gray-600">Date validation finale</p>
                    <p className="font-medium">{new Date(demande.dateValidationFinale).toLocaleString()}</p>
                  </div>
                )}
                {demande.livreurAssigne && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600">Livreur assigné</p>
                    <p className="font-medium text-indigo-600">
                      {demande.livreurAssigne.prenom} {demande.livreurAssigne.nom}
                    </p>
                  </div>
                )}
                {demande.dateReceptionLivreur && (
                  <div>
                    <p className="text-sm text-gray-600">Réception par le livreur</p>
                    <p className="font-medium text-green-600">{new Date(demande.dateReceptionLivreur).toLocaleString()}</p>
                  </div>
                )}
                {demande.dateLivraison && (
                  <div>
                    <p className="text-sm text-gray-600">Date de livraison</p>
                    <p className="font-medium text-green-600">{new Date(demande.dateLivraison).toLocaleString()}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Articles demandés */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Articles demandés ({demande.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {demande.items.map((item) => {
                  const article = getArticleById(item.articleId)
                  const quantiteValidee = item.quantiteValidee || item.quantiteDemandee
                  const quantiteSortie = item.quantiteSortie || 0
                  const quantiteRestante = Math.max(0, quantiteValidee - quantiteSortie)
                  
                  return (
                    <div key={item.id} className="border rounded-lg p-4 bg-white">
                      <div className="space-y-3">
                        {/* Nom de l'article */}
                        <div>
                          <h4 className="font-medium text-lg">{article?.nom || "Article inconnu"}</h4>
                          {article?.description && (
                            <p className="text-sm text-gray-600">{article.description}</p>
                          )}
                          {article?.reference && (
                            <p className="text-sm text-blue-600">Réf: {article.reference}</p>
                          )}
                        </div>

                        {/* Quantités en colonnes */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <p className="text-sm text-gray-600">Quantité demandée</p>
                            <p className="font-semibold text-base">
                              {item.quantiteDemandee}
                            </p>
                          </div>
                          
                          {item.quantiteValidee !== undefined && (
                            <div>
                              <p className="text-sm text-gray-600">Quantité validée</p>
                              <p className="font-semibold text-base text-green-600">
                                {item.quantiteValidee}
                              </p>
                            </div>
                          )}
                          
                          {showDeliveryColumns && item.quantiteSortie !== undefined && (
                            <div>
                              <p className="text-sm text-gray-600">Quantité sortie</p>
                              <p className="font-semibold text-base text-orange-600">
                                {item.quantiteSortie}
                              </p>
                            </div>
                          )}
                          
                          {item.quantiteRecue !== undefined && (
                            <div>
                              <p className="text-sm text-gray-600">Quantité reçue</p>
                              <p className="font-semibold text-base text-purple-600">
                                {item.quantiteRecue}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Cartes de quantités livrées et restantes */}
                        {showDeliveryColumns && (
                          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                              <p className="text-sm font-medium text-blue-700 mb-1">Quantité livrée</p>
                              <p className="text-2xl font-bold text-blue-800">
                                {quantiteSortie}
                              </p>
                            </div>
                            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                              <p className="text-sm font-medium text-orange-700 mb-1">Quantité restante</p>
                              <p className="text-2xl font-bold text-orange-800">
                                {quantiteRestante}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Commentaire */}
                        {item.commentaire && (
                          <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                            <p className="text-sm">
                              <strong className="text-blue-800">Commentaire:</strong>{" "}
                              <span className="text-blue-700">{item.commentaire}</span>
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Commentaires et signatures */}
          {(demande.commentaires || 
            demande.validationConducteur || 
            demande.validationLogistique || 
            demande.sortieAppro || 
            demande.validationChargeAffaire || 
            demande.validationFinale ||
            demande.rejetMotif) && (
            <Card>
              <CardHeader>
                <CardTitle>Commentaires et validations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {demande.commentaires && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Commentaire initial:</p>
                    <p className="text-sm bg-gray-50 p-3 rounded-md">{demande.commentaires}</p>
                  </div>
                )}
                
                {demande.validationConducteur && (
                  <div>
                    <p className="text-sm font-medium text-green-700">Validation conducteur:</p>
                    <p className="text-sm bg-green-50 p-3 rounded-md">
                      {demande.validationConducteur.commentaire || "Validée sans commentaire"} 
                      <br />
                      <span className="text-xs text-gray-500">
                        {new Date(demande.validationConducteur.date).toLocaleString()}
                      </span>
                    </p>
                  </div>
                )}

                {demande.validationLogistique && (
                  <div>
                    <p className="text-sm font-medium text-green-700">Validation QHSE:</p>
                    <p className="text-sm bg-green-50 p-3 rounded-md">
                      {demande.validationLogistique.commentaire || "Validée sans commentaire"}
                      <br />
                      <span className="text-xs text-gray-500">
                        {new Date(demande.validationLogistique.date).toLocaleString()}
                      </span>
                    </p>
                  </div>
                )}

                {demande.sortieAppro && (
                  <div>
                    <p className="text-sm font-medium text-purple-700">Préparation sortie:</p>
                    <p className="text-sm bg-purple-50 p-3 rounded-md">
                      {demande.sortieAppro.commentaire || "Préparée sans commentaire"}
                      <br />
                      <span className="text-xs text-gray-500">
                        {new Date(demande.sortieAppro.date).toLocaleString()}
                        {demande.sortieAppro.modifiable && (
                          <span className="ml-2 text-orange-600">(Modifiable)</span>
                        )}
                      </span>
                    </p>
                  </div>
                )}

                {demande.validationChargeAffaire && (
                  <div>
                    <p className="text-sm font-medium text-emerald-700">Validation chargé d'affaire:</p>
                    <p className="text-sm bg-emerald-50 p-3 rounded-md">
                      {demande.validationChargeAffaire.commentaire || "Validée sans commentaire"}
                      <br />
                      <span className="text-xs text-gray-500">
                        {new Date(demande.validationChargeAffaire.date).toLocaleString()}
                      </span>
                    </p>
                  </div>
                )}

                {demande.validationFinale && (
                  <div>
                    <p className="text-sm font-medium text-green-700">Validation finale (réception):</p>
                    <p className="text-sm bg-green-50 p-3 rounded-md">
                      {demande.validationFinale.commentaire || "Réception confirmée sans commentaire"}
                      <br />
                      <span className="text-xs text-gray-500">
                        {new Date(demande.validationFinale.date).toLocaleString()}
                      </span>
                    </p>
                  </div>
                )}

                {demande.rejetMotif && (
                  <div>
                    <p className="text-sm font-medium text-red-700">Motif du rejet:</p>
                    <p className="text-sm bg-red-50 p-3 rounded-md text-red-800">{demande.rejetMotif}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Actions selon le rôle */}
          <Card>
            <CardHeader>
              <CardTitle>Actions disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {canPerformAction("soumettre") && (
                  <Button
                    onClick={() => handleAction("soumettre")}
                    disabled={actionLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Soumettre la demande
                  </Button>
                )}

                {canPerformAction("valider_materiel") && (
                  <Button
                    onClick={() => handleAction("valider_materiel", true)}
                    disabled={actionLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Valider (Matériel)
                  </Button>
                )}

                {canPerformAction("valider_outillage") && (
                  <Button
                    onClick={() => handleAction("valider_outillage", true)}
                    disabled={actionLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Valider (Outillage)
                  </Button>
                )}

                {canPerformAction("rejeter") && (
                  <Button
                    onClick={() => handleAction("rejeter", false, true)}
                    disabled={actionLoading}
                    variant="destructive"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeter
                  </Button>
                )}

                {canPerformAction("preparer_sortie") && (
                  <Button
                    onClick={() => handleAction("preparer_sortie", true)}
                    disabled={actionLoading}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Préparer sortie
                  </Button>
                )}

                {canPerformAction("valider_preparation") && (
                  <Button
                    onClick={() => handleAction("valider_preparation", true)}
                    disabled={actionLoading}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Valider préparation
                  </Button>
                )}

                {canPerformAction("validation_finale") && (
                  <Button
                    onClick={() => handleAction("validation_finale", true)}
                    disabled={actionLoading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    Confirmer réception
                  </Button>
                )}

                {canPerformAction("cloturer") && (
                  <Button
                    onClick={() => handleAction("cloturer", false, true)}
                    disabled={actionLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Clôturer ma demande
                  </Button>
                )}

                {canPerformAction("archiver") && (
                  <Button
                    onClick={() => handleAction("archiver")}
                    disabled={actionLoading}
                    variant="outline"
                  >
                    Archiver
                  </Button>
                )}

                {actionLoading && (
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mr-2"></div>
                    Action en cours...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}

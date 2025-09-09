"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Calendar, User, Building, Package } from "lucide-react"
import type { Demande } from "@/types"

interface DemandeDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  demande: Demande | null
  onValidate?: (action: "valider" | "rejeter", quantites?: { [itemId: string]: number }) => void
  canValidate?: boolean
}

export default function DemandeDetailsModal({ 
  isOpen, 
  onClose, 
  demande, 
  onValidate,
  canValidate = false 
}: DemandeDetailsModalProps) {
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [quantitesValidees, setQuantitesValidees] = useState<{ [itemId: string]: number }>({})

  // Initialiser les quantités validées avec les quantités demandées
  useEffect(() => {
    if (demande) {
      const initialQuantites: { [itemId: string]: number } = {}
      demande.items.forEach(item => {
        initialQuantites[item.id] = item.quantiteValidee || item.quantiteDemandee
      })
      setQuantitesValidees(initialQuantites)
    }
  }, [demande])

  if (!demande) return null

  const handleQuantiteChange = (itemId: string, value: string) => {
    const numValue = parseInt(value) || 0
    setQuantitesValidees(prev => ({
      ...prev,
      [itemId]: numValue
    }))
  }

  const handleAction = async (action: "valider" | "rejeter") => {
    if (!onValidate) return
    
    setActionLoading(action)
    try {
      await onValidate(action, action === "valider" ? quantitesValidees : undefined)
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "en_attente_validation_conducteur":
      case "en_attente_validation_qhse":
      case "en_attente_validation_appro":
      case "en_attente_validation_charge_affaire":
      case "en_attente_validation_logistique":
      case "en_attente_confirmation_demandeur":
        return "bg-orange-100 text-orange-800"
      case "confirmee_demandeur":
        return "bg-green-100 text-green-800"
      case "rejetee":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      "en_attente_validation_conducteur": "En attente validation conducteur",
      "en_attente_validation_qhse": "En attente validation QHSE",
      "en_attente_validation_appro": "En attente validation appro",
      "en_attente_validation_charge_affaire": "En attente validation chargé d'affaire",
      "en_attente_validation_logistique": "En attente validation logistique",
      "en_attente_confirmation_demandeur": "En attente confirmation demandeur",
      "confirmee_demandeur": "Confirmée par le demandeur",
      "rejetee": "Rejetée"
    }
    return statusMap[status] || status
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center bg-gray-800 text-white py-3 px-4 rounded mb-4">
            Demande {demande.type === "materiel" ? "Matériel" : "Outillage"} de {demande.technicien ? `${demande.technicien.prenom} ${demande.technicien.nom}` : 'N/A'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informations générales - Format compact */}
          <div className="bg-gray-50 p-4 rounded border">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Date de création:</span>
                <p>{new Date(demande.dateCreation).toLocaleDateString('fr-FR')}</p>
              </div>
              
              <div>
                <span className="font-medium text-gray-600">Client:</span>
                <p>{demande.technicien ? `${demande.technicien.prenom} ${demande.technicien.nom}` : 'N/A'}</p>
              </div>

              <div>
                <span className="font-medium text-gray-600">Projet:</span>
                <p>{demande.projet?.nom || 'N/A'}</p>
              </div>

              {demande.dateLivraisonSouhaitee && (
                <div>
                  <span className="font-medium text-gray-600">Date souhaitée:</span>
                  <p>{new Date(demande.dateLivraisonSouhaitee).toLocaleDateString('fr-FR')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Tableau des articles - Format compact et éditable */}
          <div className="border rounded">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="font-bold text-center border-r">Référence</TableHead>
                  <TableHead className="font-bold text-center border-r">Désignation</TableHead>
                  <TableHead className="font-bold text-center border-r">Unité</TableHead>
                  <TableHead className="font-bold text-center border-r">Qté demandée</TableHead>
                  <TableHead className="font-bold text-center border-r">Qté validée</TableHead>
                  <TableHead className="font-bold text-center border-r">Date 1</TableHead>
                  <TableHead className="font-bold text-center">Date 2</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {demande.items.map((item, index) => (
                  <TableRow key={index} className="border-b">
                    <TableCell className="font-medium text-center border-r p-2">
                      {item.article?.reference || 'N/A'}
                    </TableCell>
                    <TableCell className="text-center border-r p-2">
                      {item.article?.nom || 'N/A'}
                    </TableCell>
                    <TableCell className="text-center border-r p-2">
                      {item.article?.unite || 'N/A'}
                    </TableCell>
                    <TableCell className="text-center border-r p-2">
                      {item.quantiteDemandee}
                    </TableCell>
                    <TableCell className="text-center border-r p-2">
                      {canValidate ? (
                        <Input
                          type="number"
                          min="0"
                          max={item.quantiteDemandee}
                          value={quantitesValidees[item.id] || item.quantiteDemandee}
                          onChange={(e) => handleQuantiteChange(item.id, e.target.value)}
                          className="w-16 h-8 text-center"
                        />
                      ) : (
                        item.quantiteValidee || item.quantiteDemandee
                      )}
                    </TableCell>
                    <TableCell className="text-center border-r p-2">
                      {demande.dateCreation ? new Date(demande.dateCreation).toLocaleDateString('fr-FR') : '-'}
                    </TableCell>
                    <TableCell className="text-center p-2">
                      {demande.dateLivraisonSouhaitee ? new Date(demande.dateLivraisonSouhaitee).toLocaleDateString('fr-FR') : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Actions de validation */}
          {canValidate && (
            <div className="flex justify-center gap-4 pt-4 border-t">
              <Button
                onClick={() => handleAction("valider")}
                disabled={actionLoading !== null}
                className="bg-green-600 hover:bg-green-700 text-white px-6"
              >
                {actionLoading === "valider" ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Valider
              </Button>
              
              <Button
                onClick={() => handleAction("rejeter")}
                disabled={actionLoading !== null}
                variant="destructive"
                className="px-6"
              >
                {actionLoading === "rejeter" ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <XCircle className="h-4 w-4 mr-2" />
                )}
                Rejeter
              </Button>
            </div>
          )}

          {/* Bouton fermer */}
          <div className="flex justify-center pt-4">
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

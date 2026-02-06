"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useStore } from "@/stores/useStore"
import { DollarSign, Save, Package, Calculator, AlertCircle } from 'lucide-react'
import type { Demande } from "@/types"

interface PriceEntryModalProps {
  isOpen: boolean
  onClose: () => void
  demande: Demande | null
  onPricesUpdated?: () => void
}

export default function PriceEntryModal({ isOpen, onClose, demande, onPricesUpdated }: PriceEntryModalProps) {
  const { token } = useStore()
  const [prices, setPrices] = useState<{ [itemId: string]: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  // Initialiser les prix avec les valeurs existantes
  useEffect(() => {
    if (demande && isOpen) {
      const initialPrices: { [itemId: string]: string } = {}
      demande.items.forEach(item => {
        initialPrices[item.id] = item.prixUnitaire?.toString() || ""
      })
      setPrices(initialPrices)
      setError("")
      setSuccess(false)
    }
  }, [demande, isOpen])

  if (!demande) return null

  // Calculer le coût total estimé
  const calculateTotal = () => {
    let total = 0
    demande.items.forEach(item => {
      const prix = parseFloat(prices[item.id] || "0")
      const quantite = item.quantiteValidee || item.quantiteDemandee
      if (!isNaN(prix) && prix > 0) {
        total += prix * quantite
      }
    })
    return total
  }

  // Vérifier si tous les prix sont renseignés
  const allPricesFilled = () => {
    return demande.items.every(item => {
      const prix = parseFloat(prices[item.id] || "0")
      return !isNaN(prix) && prix > 0
    })
  }

  const handlePriceChange = (itemId: string, value: string) => {
    // Autoriser uniquement les nombres positifs
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setPrices(prev => ({
        ...prev,
        [itemId]: value
      }))
    }
  }

  const handleSubmit = async () => {
    if (!allPricesFilled()) {
      setError("Veuillez renseigner tous les prix avant de valider")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const pricesPayload: { [itemId: string]: number } = {}
      demande.items.forEach(item => {
        pricesPayload[item.id] = parseFloat(prices[item.id])
      })

      const response = await fetch(`/api/demandes/${demande.id}/update-prices`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ prices: pricesPayload }),
      })

      const result = await response.json()

      if (result.success) {
        setSuccess(true)
        setTimeout(() => {
          onPricesUpdated?.()
          onClose()
        }, 1500)
      } else {
        setError(result.error || "Erreur lors de la mise à jour des prix")
      }
    } catch (err) {
      setError("Erreur de connexion au serveur")
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price) + " FCFA"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <DollarSign className="h-5 w-5 text-green-600" />
            Renseigner les prix - {demande.numero}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Saisissez le prix unitaire de chaque article. Le coût total sera calculé automatiquement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info demande */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Type:</span>
                  <Badge variant="outline" className="ml-2">
                    {demande.type === "materiel" ? "Matériel" : "Outillage"}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-600">Projet:</span>
                  <span className="ml-2 font-medium">{demande.projet?.nom || "N/A"}</span>
                </div>
                <div>
                  <span className="text-gray-600">Demandeur:</span>
                  <span className="ml-2 font-medium">
                    {demande.technicien?.prenom} {demande.technicien?.nom}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Articles:</span>
                  <span className="ml-2 font-medium">{demande.items.length}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tableau des articles avec saisie des prix */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Package className="h-4 w-4" />
                Articles à chiffrer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Référence</TableHead>
                      <TableHead className="font-semibold">Désignation</TableHead>
                      <TableHead className="font-semibold text-center">Unité</TableHead>
                      <TableHead className="font-semibold text-center">Qté</TableHead>
                      <TableHead className="font-semibold text-center">Prix unitaire (FCFA)</TableHead>
                      <TableHead className="font-semibold text-right">Sous-total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {demande.items.map((item) => {
                      const prix = parseFloat(prices[item.id] || "0")
                      const quantite = item.quantiteValidee || item.quantiteDemandee
                      const sousTotal = !isNaN(prix) && prix > 0 ? prix * quantite : 0

                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium text-sm">
                            {item.article?.reference || "N/A"}
                          </TableCell>
                          <TableCell className="text-sm max-w-[200px] truncate">
                            {item.article?.nom || "N/A"}
                          </TableCell>
                          <TableCell className="text-center text-sm">
                            {item.article?.unite || "N/A"}
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {quantite}
                          </TableCell>
                          <TableCell className="text-center">
                            <Input
                              type="text"
                              inputMode="decimal"
                              value={prices[item.id] || ""}
                              onChange={(e) => handlePriceChange(item.id, e.target.value)}
                              placeholder="0"
                              className="w-28 text-center mx-auto"
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium text-green-700">
                            {sousTotal > 0 ? formatPrice(sousTotal) : "-"}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Coût total */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-lg">Coût total estimé:</span>
                </div>
                <span className="text-2xl font-bold text-green-700">
                  {formatPrice(calculateTotal())}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Messages d'erreur ou succès */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Prix enregistrés avec succès !</span>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Annuler
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={isLoading || !allPricesFilled()}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Enregistrer les prix
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

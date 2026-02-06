"use client"

// VERSION 2.0 - Modal avec colonnes: Qté validée, Qté à livrer, Qté restante, Prix unitaire (FCFA), Total (FCFA)
// Dernière mise à jour: 12/01/2026 11:00

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Save, X, AlertCircle } from "lucide-react"
import type { Demande } from "@/types"
import { useStore } from "@/stores/useStore"

interface DemandePreparationModalProps {
  isOpen: boolean
  onClose: () => void
  demandeId: string | null
  onSave?: (quantites: { [itemId: string]: number }, prix: { [itemId: string]: number }) => void
}

export default function DemandePreparationModal({ 
  isOpen, 
  onClose, 
  demandeId,
  onSave
}: DemandePreparationModalProps) {
  const { demandes, currentUser } = useStore()
  const [demande, setDemande] = useState<Demande | null>(null)
  const [quantites, setQuantites] = useState<{ [key: string]: number }>({})
  const [prix, setPrix] = useState<{ [key: string]: number }>({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (demandeId && demandes.length > 0) {
      const foundDemande = demandes.find(d => d.id === demandeId)
      setDemande(foundDemande || null)
      
      if (foundDemande) {
        const initialQuantites: { [key: string]: number } = {}
        const initialPrix: { [key: string]: number } = {}
        foundDemande.items.forEach((item, index) => {
          const qteValidee = item.quantiteValidee || item.quantiteDemandee
          initialQuantites[`item-${index}`] = item.quantiteSortie || qteValidee
          initialPrix[`item-${index}`] = item.prixUnitaire || 0
        })
        setQuantites(initialQuantites)
        setPrix(initialPrix)
      }
    } else {
      setDemande(null)
      setQuantites({})
      setPrix({})
    }
  }, [demandeId, demandes])

  const handleQuantiteChange = (itemIndex: number, value: string) => {
    if (value === "") {
      setQuantites(prev => ({
        ...prev,
        [`item-${itemIndex}`]: 0
      }))
    } else {
      const numValue = parseInt(value)
      if (!isNaN(numValue) && numValue >= 0) {
        setQuantites(prev => ({
          ...prev,
          [`item-${itemIndex}`]: numValue
        }))
      }
    }
  }

  const handlePrixChange = (itemIndex: number, value: string) => {
    if (value === "") {
      setPrix(prev => ({
        ...prev,
        [`item-${itemIndex}`]: 0
      }))
    } else {
      const numValue = parseFloat(value)
      if (!isNaN(numValue) && numValue >= 0) {
        setPrix(prev => ({
          ...prev,
          [`item-${itemIndex}`]: numValue
        }))
      }
    }
  }

  const handleSave = async () => {
    if (!demande || !onSave) return
    
    setIsSaving(true)
    try {
      await onSave(quantites, prix)
      onClose()
    } catch (error) {
      alert("Erreur lors de la sauvegarde des quantités et prix")
    } finally {
      setIsSaving(false)
    }
  }

  const getTotalQuantites = () => {
    let totalDemande = 0
    let totalLivraison = 0
    let totalPrix = 0
    
    demande?.items.forEach((item, index) => {
      const qteValidee = item.quantiteValidee || item.quantiteDemandee
      const qteLivraison = quantites[`item-${index}`] || 0
      const prixUnit = prix[`item-${index}`] || 0
      
      totalDemande += qteValidee
      totalLivraison += qteLivraison
      totalPrix += qteLivraison * prixUnit
    })
    
    return { totalDemande, totalLivraison, totalPrix }
  }

  if (!demande) return null

  const { totalDemande, totalLivraison, totalPrix } = getTotalQuantites()
  const isAppro = currentUser?.role === "responsable_appro"
  

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[98vw] max-w-[1400px] max-h-[95vh] flex flex-col p-3 sm:p-4">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-sm sm:text-lg font-bold text-center bg-[#015fc4] text-white py-2 px-3 rounded flex items-center justify-center gap-2">
            Préparation - Demande {demande.numero}
            <Badge className="bg-green-500 text-white text-xs">v2.0 FCFA</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 mt-3 pr-1">
          <div className="bg-gray-50 p-4 rounded border border-gray-300">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
              <div>
                <span className="font-semibold text-gray-700">Type:</span>
                <p className="text-gray-900">
                  <Badge variant={demande.type === "materiel" ? "default" : "secondary"}>
                    {demande.type === "materiel" ? "Matériel" : "Outillage"}
                  </Badge>
                </p>
              </div>
              
              <div>
                <span className="font-semibold text-gray-700">Demandeur:</span>
                <p className="text-gray-900">{demande.technicien ? `${demande.technicien.prenom} ${demande.technicien.nom}` : 'N/A'}</p>
              </div>

              <div>
                <span className="font-semibold text-gray-700">Projet:</span>
                <p className="text-gray-900">{demande.projet?.nom || 'N/A'}</p>
              </div>

              <div>
                <span className="font-semibold text-gray-700">Date souhaitée:</span>
                <p className="text-gray-900">{demande.dateLivraisonSouhaitee ? new Date(demande.dateLivraisonSouhaitee).toLocaleDateString('fr-FR') : '—'}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-2 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-blue-800">
              <p className="font-semibold">Renseignez les quantités à livrer</p>
              <p className="hidden sm:block">Modifiez les quantités si nécessaire, puis cliquez sur "Enregistrer les quantités & prix"</p>
            </div>
          </div>

          <div className="border border-gray-300 rounded overflow-hidden">
            <div className="overflow-x-auto" style={{ maxWidth: '100%' }}>
              <div className="max-h-[350px] overflow-y-auto">
                <Table className="min-w-[900px]">
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow className="border-b-2 border-gray-400">
                      <TableHead className="font-bold text-center border border-gray-300 py-2 px-1 text-[10px] sm:text-xs bg-white w-[80px]">Référence</TableHead>
                      <TableHead className="font-bold text-left border border-gray-300 py-2 px-2 text-[10px] sm:text-xs bg-white min-w-[150px]">Désignation</TableHead>
                      <TableHead className="font-bold text-center border border-gray-300 py-2 px-1 text-[10px] sm:text-xs bg-white w-[50px]">Unité</TableHead>
                      <TableHead className="font-bold text-center border border-gray-300 py-2 px-1 text-[10px] sm:text-xs bg-white w-[60px]">Qté validée</TableHead>
                      <TableHead className="font-bold text-center border border-gray-300 py-2 px-1 text-[10px] sm:text-xs bg-green-50 text-green-700 w-[90px]">Qté à livrer</TableHead>
                      <TableHead className="font-bold text-center border border-gray-300 py-2 px-1 text-[10px] sm:text-xs bg-orange-50 text-orange-600 w-[70px]">Qté restante</TableHead>
                      <TableHead className="font-bold text-center border border-gray-300 py-2 px-1 text-[10px] sm:text-xs bg-purple-50 text-purple-700 w-[110px]">Prix unitaire (FCFA)</TableHead>
                      <TableHead className="font-bold text-center border border-gray-300 py-2 px-1 text-[10px] sm:text-xs bg-purple-50 text-purple-700 w-[100px]">Total (FCFA)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {demande.items.map((item, index) => {
                      const qteValidee = item.quantiteValidee || item.quantiteDemandee
                      const qteLivraison = quantites[`item-${index}`] || 0
                      
                      // Calculer le total des quantités déjà livrées (toutes les livraisons précédentes)
                      const qteLivree = item.livraisons 
                        ? item.livraisons.reduce((total: number, liv: any) => total + (liv.quantiteLivree || 0), 0)
                        : (item.quantiteSortie || item.quantiteRecue || 0)
                      
                      const qteRestante = Math.max(0, qteValidee - qteLivree - qteLivraison)
                      const prixUnit = prix[`item-${index}`] || 0
                      const totalLigne = qteLivraison * prixUnit

                      return (
                        <TableRow key={index} className="border-b hover:bg-gray-50">
                          <TableCell className="text-center border border-gray-300 p-1 text-[10px] sm:text-xs">
                            {item.article?.reference || '----'}
                          </TableCell>
                          <TableCell className="text-left border border-gray-300 p-2 text-[10px] sm:text-xs">
                            {item.article?.nom || 'Article inconnu'}
                          </TableCell>
                          <TableCell className="text-center border border-gray-300 p-1 text-[10px] sm:text-xs">
                            {item.article?.unite || 'pièce'}
                          </TableCell>
                          <TableCell className="text-center border border-gray-300 p-1 text-[10px] sm:text-xs font-medium">
                            {qteValidee}
                          </TableCell>
                          <TableCell className="text-center border border-gray-300 p-1 bg-green-50">
                            <Input
                              type="number"
                              min="0"
                              max={qteValidee - qteLivree}
                              value={qteLivraison}
                              onChange={(e) => handleQuantiteChange(index, e.target.value)}
                              className="w-16 h-7 text-center mx-auto font-semibold text-green-700 text-xs border border-green-300 focus:border-green-500 focus:ring-1 focus:ring-green-200"
                            />
                          </TableCell>
                          <TableCell className="text-center border border-gray-300 p-1 text-[10px] sm:text-xs bg-orange-50">
                            <span className="font-semibold text-orange-600">{qteRestante}</span>
                          </TableCell>
                          <TableCell className="text-center border border-gray-300 p-1 bg-purple-50">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={prixUnit}
                              onChange={(e) => handlePrixChange(index, e.target.value)}
                              className="w-20 h-7 text-center mx-auto font-semibold text-purple-700 text-xs border border-purple-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-200"
                              placeholder="0.00"
                            />
                          </TableCell>
                          <TableCell className="text-center border border-gray-300 p-1 text-[10px] sm:text-xs bg-purple-50">
                            <span className="font-semibold text-purple-700">{totalLigne.toFixed(2)}</span>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <div className="bg-gray-100 p-3 rounded border border-gray-300">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="flex justify-between items-center text-xs sm:text-sm font-semibold">
                <span>Total qté validée:</span>
                <span className="text-base sm:text-lg">{totalDemande}</span>
              </div>
              <div className="flex justify-between items-center text-xs sm:text-sm font-semibold">
                <span>Total qté à livrer:</span>
                <span className="text-base sm:text-lg text-green-600">{totalLivraison}</span>
              </div>
              <div className="flex justify-between items-center text-xs sm:text-sm font-semibold">
                <span>Coût total:</span>
                <span className="text-base sm:text-lg text-purple-600">{totalPrix.toFixed(2)} FCFA</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 mt-3 gap-2 flex-col sm:flex-row">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="w-full sm:w-auto text-xs sm:text-sm"
          >
            <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            Annuler
          </Button>
          {onSave && (
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto text-xs sm:text-sm"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-white mr-1 sm:mr-2"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Enregistrer quantités & prix
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

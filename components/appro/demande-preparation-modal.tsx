"use client"

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
    const numValue = parseInt(value) || 0
    setQuantites(prev => ({
      ...prev,
      [`item-${itemIndex}`]: numValue
    }))
  }

  const handlePrixChange = (itemIndex: number, value: string) => {
    const numValue = parseFloat(value) || 0
    setPrix(prev => ({
      ...prev,
      [`item-${itemIndex}`]: numValue
    }))
  }

  const handleSave = async () => {
    if (!demande || !onSave) return
    
    setIsSaving(true)
    try {
      await onSave(quantites, prix)
      onClose()
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error)
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
  
  console.log("🔍 [PREPARATION MODAL] Rôle utilisateur:", currentUser?.role, "| isAppro:", isAppro)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-6xl max-h-[90vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-base sm:text-xl font-bold text-center bg-[#015fc4] text-white py-3 px-4 rounded-t">
            Préparation - Demande {demande.numero}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 mt-4 pr-2">
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

          <div className="bg-blue-50 border border-blue-200 rounded p-3 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold">Renseignez les quantités à livrer</p>
              <p>Modifiez les quantités si nécessaire, puis cliquez sur "Enregistrer les quantités"</p>
            </div>
          </div>

          <div className="border border-gray-300 rounded">
            <div className="overflow-x-auto">
              <div className="max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-white z-10">
                    <TableRow className="border-b-2 border-gray-400">
                      <TableHead className="font-bold text-center border border-gray-300 py-3 text-xs sm:text-sm bg-white">Référence</TableHead>
                      <TableHead className="font-bold text-center border border-gray-300 py-3 text-xs sm:text-sm bg-white">Désignation</TableHead>
                      <TableHead className="font-bold text-center border border-gray-300 py-3 text-xs sm:text-sm bg-white">Unité</TableHead>
                      <TableHead className="font-bold text-center border border-gray-300 py-3 text-xs sm:text-sm bg-white">Qté validée</TableHead>
                      <TableHead className="font-bold text-center border border-gray-300 py-3 text-xs sm:text-sm bg-green-50 text-green-700">Qté à livrer</TableHead>
                      <TableHead className="font-bold text-center border border-gray-300 py-3 text-xs sm:text-sm bg-orange-50 text-orange-600">Qté restante</TableHead>
                      <TableHead className="font-bold text-center border border-gray-300 py-3 text-xs sm:text-sm bg-purple-50 text-purple-700">Prix unitaire (FCFA)</TableHead>
                      <TableHead className="font-bold text-center border border-gray-300 py-3 text-xs sm:text-sm bg-purple-50 text-purple-700">Total (FCFA)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {demande.items.map((item, index) => {
                      const qteValidee = item.quantiteValidee || item.quantiteDemandee
                      const qteLivraison = quantites[`item-${index}`] || 0
                      const qteLivree = item.quantiteSortie || item.quantiteRecue || 0
                      const qteRestante = Math.max(0, qteValidee - qteLivree - qteLivraison)
                      const prixUnit = prix[`item-${index}`] || 0
                      const totalLigne = qteLivraison * prixUnit

                      return (
                        <TableRow key={index} className="border-b hover:bg-gray-50">
                          <TableCell className="text-center border border-gray-300 p-3 text-xs sm:text-sm">
                            {item.article?.reference || '----'}
                          </TableCell>
                          <TableCell className="text-left border border-gray-300 p-3 text-xs sm:text-sm">
                            {item.article?.nom || 'Article inconnu'}
                          </TableCell>
                          <TableCell className="text-center border border-gray-300 p-3 text-xs sm:text-sm">
                            {item.article?.unite || 'pièce'}
                          </TableCell>
                          <TableCell className="text-center border border-gray-300 p-3 text-xs sm:text-sm font-medium">
                            {qteValidee}
                          </TableCell>
                          <TableCell className="text-center border border-gray-300 p-3 bg-green-50">
                            <Input
                              type="number"
                              min="0"
                              max={qteValidee - qteLivree}
                              value={qteLivraison}
                              onChange={(e) => handleQuantiteChange(index, e.target.value)}
                              className="w-24 text-center mx-auto font-semibold text-green-700 border-2 border-green-300 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                            />
                          </TableCell>
                          <TableCell className="text-center border border-gray-300 p-3 text-xs sm:text-sm bg-orange-50">
                            <span className="font-semibold text-orange-600">{qteRestante}</span>
                          </TableCell>
                          <TableCell className="text-center border border-gray-300 p-3 bg-purple-50">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={prixUnit}
                              onChange={(e) => handlePrixChange(index, e.target.value)}
                              className="w-28 text-center mx-auto font-semibold text-purple-700 border-2 border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                              placeholder="0.00"
                            />
                          </TableCell>
                          <TableCell className="text-center border border-gray-300 p-3 text-xs sm:text-sm bg-purple-50">
                            <span className="font-semibold text-purple-700">{totalLigne.toFixed(2)} FCFA</span>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          <div className="bg-gray-100 p-4 rounded border border-gray-300">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex justify-between items-center text-sm font-semibold">
                <span>Total qté validée:</span>
                <span className="text-lg">{totalDemande}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-semibold">
                <span>Total qté à livrer:</span>
                <span className="text-lg text-green-600">{totalLivraison}</span>
              </div>
              <div className="flex justify-between items-center text-sm font-semibold">
                <span>Coût total:</span>
                <span className="text-lg text-purple-600">{totalPrix.toFixed(2)} FCFA</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 mt-4 gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
          >
            <X className="h-4 w-4 mr-2" />
            Annuler
          </Button>
          {onSave && (
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
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

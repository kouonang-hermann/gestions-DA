"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useStore } from "@/stores/useStore"
import { CheckCircle, Clock, Package, FileText, AlertCircle } from "lucide-react"
import { toast } from "sonner"

interface UniversalClosureListProps {
  onClose?: () => void
}

export default function UniversalClosureList({ onClose }: UniversalClosureListProps) {
  const { currentUser, demandes, loadDemandes, token } = useStore()
  const [demandesACloturer, setDemandesACloturer] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (currentUser) {
      // Filtrer les demandes que l'utilisateur actuel peut clôturer
      // Peu importe son rôle, s'il est le demandeur original
      const filtered = demandes.filter(
        (d) => d.status === "en_attente_validation_finale_demandeur" && 
               d.technicienId === currentUser.id
      )
      setDemandesACloturer(filtered)
    }
  }, [demandes, currentUser])

  const handleCloturer = async (demandeId: string) => {
    if (!currentUser || !token) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/demandes/${demandeId}/actions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "cloturer",
          commentaire: `Demande clôturée par ${currentUser.prenom} ${currentUser.nom}`
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("❌ Erreur API clôture:", errorText)
        toast.error(errorText || "Erreur lors de la clôture")
        return
      }

      const result = await response.json()
      
      if (result.success) {
        toast.success("Demande clôturée avec succès")
        await loadDemandes()
        
        // Mettre à jour la liste locale
        setDemandesACloturer(prev => prev.filter(d => d.id !== demandeId))
      } else {
        toast.error(result.error || "Erreur lors de la clôture")
      }
    } catch (error) {
      console.error("Erreur lors de la clôture:", error)
      toast.error("Erreur lors de la clôture de la demande")
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "en_attente_validation_finale_demandeur":
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Prêt à clôturer</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      'superadmin': 'Super Administrateur',
      'employe': 'Employé',
      'conducteur_travaux': 'Conducteur Travaux',
      'responsable_travaux': 'Responsable Travaux',
      'responsable_appro': 'Responsable Appro',
      'charge_affaire': 'Chargé d\'Affaire',
      'responsable_logistique': 'Responsable Logistique'
    }
    return roleMap[role] || role
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-semibold">Mes demandes à clôturer</h2>
          <Badge variant="outline" className="ml-2">
            {demandesACloturer.length}
          </Badge>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Fermer
          </Button>
        )}
      </div>

      {demandesACloturer.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-500 text-center">
              Aucune demande à clôturer pour le moment
            </p>
            <p className="text-sm text-gray-400 text-center mt-2">
              Vos demandes validées apparaîtront ici pour clôture finale
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {demandesACloturer.map((demande) => (
            <Card key={demande.id} className="border-l-4 border-l-emerald-500">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {demande.type === "materiel" ? (
                        <Package className="h-4 w-4 text-blue-600" />
                      ) : (
                        <FileText className="h-4 w-4 text-orange-600" />
                      )}
                      <CardTitle className="text-base">
                        DA-{demande.numero}
                      </CardTitle>
                    </div>
                    {getStatusBadge(demande.status)}
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {getRoleDisplayName(currentUser?.role || '')}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(demande.dateCreation).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-600 truncate">
                        Projet: {demande.projet?.nom || 'Non spécifié'}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-sm text-emerald-700 font-medium">
                        Prêt à clôturer
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {demande.items?.length || 0} article(s) • {demande.type === "materiel" ? "Matériel" : "Outillage"}
                    </p>
                  </div>
                  <div className="sm:ml-4 w-full sm:w-auto">
                    <Button
                      onClick={() => handleCloturer(demande.id)}
                      disabled={isLoading}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto"
                      size="sm"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {isLoading ? "Clôture..." : "Clôturer"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Informations sur le processus */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">
                Processus de clôture universelle
              </h4>
              <p className="text-sm text-blue-800">
                En tant que <strong>{getRoleDisplayName(currentUser?.role || '')}</strong>, 
                vous pouvez clôturer toutes vos demandes qui ont terminé le processus de validation.
                La clôture confirme que vous avez reçu le matériel/outillage demandé.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  Eye, 
  Search, 
  Calendar, 
  Package, 
  Wrench, 
  CheckCircle,
  User,
  Building
} from "lucide-react"
import type { Demande } from "@/types"
import DemandeDetailsModal from "@/components/modals/demande-details-modal"
import { useStore } from "@/stores/useStore"

interface ValidatedDemandesModalProps {
  isOpen: boolean
  onClose: () => void
  currentUser: any
}

export default function ValidatedDemandesModal({
  isOpen,
  onClose,
  currentUser
}: ValidatedDemandesModalProps) {
  const { demandes } = useStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null)
  const [demandeDetailsOpen, setDemandeDetailsOpen] = useState(false)
  const [validatedDemandes, setValidatedDemandes] = useState<Demande[]>([])

  // Filtrer les demandes validées par l'utilisateur selon son rôle
  useEffect(() => {
    if (!currentUser || !demandes) return

    let filtered: Demande[] = []

    switch (currentUser.role) {
      case "conducteur_travaux":
        // Demandes validées par le conducteur de travaux
        filtered = demandes.filter(d => 
          d.validationConducteur?.userId === currentUser.id ||
          (d.status !== "brouillon" && 
           d.status !== "soumise" && 
           d.status !== "en_attente_validation_conducteur" &&
           d.type === "materiel") // Conducteur valide le matériel
        )
        break
      
      case "responsable_qhse":
        // Demandes validées par le responsable QHSE
        filtered = demandes.filter(d => 
          d.validationQHSE?.userId === currentUser.id ||
          (d.status !== "brouillon" && 
           d.status !== "soumise" && 
           d.status !== "en_attente_validation_conducteur" &&
           d.status !== "en_attente_validation_qhse" &&
           d.type === "outillage") // QHSE valide l'outillage
        )
        break
      
      case "responsable_travaux":
        // Demandes validées par le responsable travaux
        filtered = demandes.filter(d => 
          d.validationResponsableTravaux?.userId === currentUser.id ||
          (d.status !== "brouillon" && 
           d.status !== "soumise" && 
           d.status !== "en_attente_validation_conducteur" &&
           d.status !== "en_attente_validation_qhse" &&
           d.status !== "en_attente_validation_responsable_travaux")
        )
        break
      
      case "charge_affaire":
        // Demandes validées par le chargé d'affaire
        filtered = demandes.filter(d => 
          d.validationChargeAffaire?.userId === currentUser.id ||
          (d.status !== "brouillon" && 
           d.status !== "soumise" && 
           d.status !== "en_attente_validation_conducteur" &&
           d.status !== "en_attente_validation_qhse" &&
           d.status !== "en_attente_validation_responsable_travaux" &&
           d.status !== "en_attente_validation_charge_affaire")
        )
        break
      
      case "responsable_appro":
        // Demandes traitées par l'appro
        filtered = demandes.filter(d => 
          d.sortieAppro?.userId === currentUser.id ||
          (d.status !== "brouillon" && 
           d.status !== "soumise" && 
           d.status !== "en_attente_validation_conducteur" &&
           d.status !== "en_attente_validation_qhse" &&
           d.status !== "en_attente_validation_responsable_travaux" &&
           d.status !== "en_attente_validation_charge_affaire" &&
           d.status !== "en_attente_preparation_appro")
        )
        break
      
      case "responsable_logistique":
        // Demandes validées par la logistique
        filtered = demandes.filter(d => 
          d.validationLogistique?.userId === currentUser.id ||
          (d.status !== "brouillon" && 
           d.status !== "soumise" && 
           d.status !== "en_attente_validation_conducteur" &&
           d.status !== "en_attente_validation_qhse" &&
           d.status !== "en_attente_validation_responsable_travaux" &&
           d.status !== "en_attente_validation_charge_affaire" &&
           d.status !== "en_attente_preparation_appro" &&
           d.status !== "en_attente_validation_logistique")
        )
        break
      
      default:
        // Pour les employés, afficher leurs demandes validées/clôturées
        filtered = demandes.filter(d => 
          d.technicienId === currentUser.id &&
          ["cloturee", "archivee"].includes(d.status)
        )
    }

    setValidatedDemandes(filtered)
  }, [currentUser, demandes])

  // Filtrer les demandes selon le terme de recherche
  const filteredDemandes = validatedDemandes.filter(demande => 
    demande.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
    demande.projet?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    demande.technicien?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    demande.technicien?.prenom.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status: string) => {
    const colors = {
      brouillon: { bg: "#f3f4f6", text: "#374151" },
      soumise: { bg: "#dbeafe", text: "#1e40af" },
      en_attente_validation_conducteur: { bg: "#fef3c7", text: "#92400e" },
      en_attente_validation_qhse: { bg: "#fef3c7", text: "#92400e" },
      en_attente_validation_responsable_travaux: { bg: "#fef3c7", text: "#92400e" },
      en_attente_validation_charge_affaire: { bg: "#fef3c7", text: "#92400e" },
      en_attente_preparation_appro: { bg: "#f3e8ff", text: "#7c3aed" },
      en_attente_validation_logistique: { bg: "#f3e8ff", text: "#7c3aed" },
      en_attente_validation_finale_demandeur: { bg: "#dcfce7", text: "#166534" },
      confirmee_demandeur: { bg: "#dcfce7", text: "#166534" },
      cloturee: { bg: "#dcfce7", text: "#166534" },
      rejetee: { bg: "#fecaca", text: "#dc2626" },
      archivee: { bg: "#f3f4f6", text: "#374151" },
    }
    return colors[status as keyof typeof colors] || { bg: "#f3f4f6", text: "#374151" }
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      brouillon: "Brouillon",
      soumise: "Soumise",
      en_attente_validation_conducteur: "En attente validation conducteur",
      en_attente_validation_qhse: "En attente validation QHSE",
      en_attente_validation_responsable_travaux: "En attente validation responsable travaux",
      en_attente_validation_charge_affaire: "En attente validation chargé d'affaire",
      en_attente_preparation_appro: "En attente préparation appro",
      en_attente_validation_logistique: "En attente validation logistique",
      en_attente_validation_finale_demandeur: "Prêt à clôturer",
      confirmee_demandeur: "Confirmée",
      cloturee: "Clôturée",
      rejetee: "Rejetée",
      archivee: "Archivée",
    }
    return labels[status as keyof typeof labels] || status
  }

  const getTypeIcon = (type: string) => {
    return type === "materiel" ? <Package className="h-4 w-4" /> : <Wrench className="h-4 w-4" />
  }

  const getTypeColor = (type: string) => {
    return type === "materiel" 
      ? { bg: "#dbeafe", text: "#015fc4" }
      : { bg: "#f3e8ff", text: "#7c3aed" }
  }

  const handleViewDetails = (demande: Demande) => {
    setSelectedDemande(demande)
    setDemandeDetailsOpen(true)
  }

  const getRoleTitle = () => {
    switch (currentUser?.role) {
      case "conducteur_travaux":
        return "Demandes validées (Conducteur de travaux)"
      case "responsable_qhse":
        return "Demandes validées (Responsable QHSE)"
      case "responsable_travaux":
        return "Demandes validées (Responsable travaux)"
      case "charge_affaire":
        return "Demandes validées (Chargé d'affaire)"
      case "responsable_appro":
        return "Demandes traitées (Responsable appro)"
      case "responsable_logistique":
        return "Demandes validées (Responsable logistique)"
      default:
        return "Mes demandes validées"
    }
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <CheckCircle className="h-5 w-5" style={{ color: '#22c55e' }} />
              {getRoleTitle()}
              <Badge variant="outline" className="ml-2">
                {filteredDemandes.length} demande{filteredDemandes.length > 1 ? 's' : ''}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Barre de recherche */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par numéro, projet, demandeur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Tableau des demandes */}
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-[60vh] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-gray-50 z-10">
                    <TableRow>
                      <TableHead>Numéro</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Projet</TableHead>
                      <TableHead className="hidden sm:table-cell">Demandeur</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="hidden md:table-cell">Date validation</TableHead>
                      <TableHead className="hidden lg:table-cell">Articles</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDemandes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          {searchTerm ? "Aucune demande trouvée pour cette recherche" : "Aucune demande validée trouvée"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDemandes.map((demande) => {
                        const statusColor = getStatusColor(demande.status)
                        const typeColor = getTypeColor(demande.type)
                        
                        return (
                          <TableRow key={demande.id} className="hover:bg-gray-50">
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {getTypeIcon(demande.type)}
                                {demande.numero}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                className="text-xs font-medium px-2 py-1"
                                style={{
                                  backgroundColor: typeColor.bg,
                                  color: typeColor.text,
                                  border: `1px solid ${typeColor.text}20`
                                }}
                              >
                                {demande.type === "materiel" ? "Matériel" : "Outillage"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Building className="h-3 w-3 text-gray-400" />
                                <div className="max-w-[150px] truncate" title={demande.projet?.nom}>
                                  {demande.projet?.nom || "N/A"}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <div className="flex items-center gap-1 text-sm">
                                <User className="h-3 w-3 text-gray-400" />
                                {demande.technicien?.prenom} {demande.technicien?.nom}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                className="text-xs font-medium px-2 py-1"
                                style={{
                                  backgroundColor: statusColor.bg,
                                  color: statusColor.text,
                                  border: `1px solid ${statusColor.text}20`
                                }}
                              >
                                {getStatusLabel(demande.status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(demande.dateModification).toLocaleDateString('fr-FR')}
                              </div>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <div className="text-sm text-gray-600">
                                {demande.items?.length || 0} article{(demande.items?.length || 0) > 1 ? 's' : ''}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewDetails(demande)}
                                className="flex items-center gap-1"
                              >
                                <Eye className="h-3 w-3" />
                                <span className="hidden sm:inline">Voir</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Statistiques rapides */}
            {filteredDemandes.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Statistiques de validation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-lg" style={{ color: '#015fc4' }}>
                        {filteredDemandes.filter(d => d.type === "materiel").length}
                      </div>
                      <div className="text-gray-600">Matériel</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-lg" style={{ color: '#7c3aed' }}>
                        {filteredDemandes.filter(d => d.type === "outillage").length}
                      </div>
                      <div className="text-gray-600">Outillage</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-lg" style={{ color: '#22c55e' }}>
                        {filteredDemandes.filter(d => ["cloturee", "archivee"].includes(d.status)).length}
                      </div>
                      <div className="text-gray-600">Clôturées</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-lg text-gray-700">
                        {new Set(filteredDemandes.map(d => d.projetId)).size}
                      </div>
                      <div className="text-gray-600">Projets</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de détails de demande */}
      <DemandeDetailsModal
        isOpen={demandeDetailsOpen}
        onClose={() => {
          setDemandeDetailsOpen(false)
          setSelectedDemande(null)
        }}
        demande={selectedDemande}
        canValidate={false}
        canRemoveItems={false}
      />
    </>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  History, 
  Search, 
  Package, 
  Wrench, 
  Calendar,
  User,
  FileText,
  Filter,
  Download
} from "lucide-react"
import { useStore } from "@/stores/useStore"

interface ProjectHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  project: any
}

export default function ProjectHistoryModal({ isOpen, onClose, project }: ProjectHistoryModalProps) {
  const { demandes, users, loadDemandes } = useStore()
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedType, setSelectedType] = useState("all")

  useEffect(() => {
    if (isOpen && project) {
      loadDemandes()
    }
  }, [isOpen, project, loadDemandes])

  // Filtrer les demandes du projet (SEULEMENT les demandes terminées)
  const projectDemandes = demandes.filter(demande => 
    demande.projetId === project?.id && 
    ["cloturee", "confirmee_demandeur", "archivee"].includes(demande.status)
  )

  // Appliquer les filtres
  const filteredDemandes = projectDemandes.filter(demande => {
    const matchesSearch = 
      demande.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getUserName(demande.technicienId).toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = selectedStatus === "all" || demande.status === selectedStatus
    const matchesType = selectedType === "all" || demande.type === selectedType

    return matchesSearch && matchesStatus && matchesType
  })

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId)
    return user ? user.nom : "Utilisateur inconnu"
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      "brouillon": { label: "Brouillon", bgColor: "#f3f4f6", textColor: "#374151" },
      "soumise": { label: "Soumise", bgColor: "#dbeafe", textColor: "#1e40af" },
      "en_attente_validation_conducteur": { label: "En attente conducteur", bgColor: "#fef3c7", textColor: "#92400e" },
      "en_attente_validation_responsable_travaux": { label: "En attente resp. travaux", bgColor: "#fef3c7", textColor: "#92400e" },
      "en_attente_validation_charge_affaire": { label: "En attente chargé affaire", bgColor: "#fef3c7", textColor: "#92400e" },
      "en_attente_preparation_appro": { label: "En attente préparation", bgColor: "#fed7aa", textColor: "#c2410c" },
      "en_attente_validation_logistique": { label: "En attente logistique", bgColor: "#e9d5ff", textColor: "#7c3aed" },
      "en_attente_validation_finale_demandeur": { label: "En attente validation finale", bgColor: "#c7d2fe", textColor: "#4338ca" },
      "confirmee_demandeur": { label: "Confirmée", bgColor: "#dcfce7", textColor: "#166534" },
      "cloturee": { label: "Clôturée", bgColor: "#dcfce7", textColor: "#166534" },
      "rejetee": { label: "Rejetée", bgColor: "#fecaca", textColor: "#dc2626" },
      "archivee": { label: "Archivée", bgColor: "#f3f4f6", textColor: "#374151" }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, bgColor: "#f3f4f6", textColor: "#374151" }
    return (
      <Badge 
        className="text-xs font-medium px-2 py-1 rounded-full"
        style={{ 
          backgroundColor: config.bgColor, 
          color: config.textColor,
          border: `1px solid ${config.textColor}20`
        }}
      >
        {config.label}
      </Badge>
    )
  }

  const getTypeBadge = (type: string) => {
    return type === "materiel" ? (
      <Badge 
        className="text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1"
        style={{ 
          backgroundColor: "#dbeafe", 
          color: "#015fc4",
          border: "1px solid #015fc4"
        }}
      >
        <Package className="h-3 w-3" />
        Matériel
      </Badge>
    ) : (
      <Badge 
        className="text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1"
        style={{ 
          backgroundColor: "#f3e8ff", 
          color: "#7c3aed",
          border: "1px solid #7c3aed"
        }}
      >
        <Wrench className="h-3 w-3" />
        Outillage
      </Badge>
    )
  }

  const getStats = () => {
    return {
      total: projectDemandes.length,
      materiel: projectDemandes.filter(d => d.type === "materiel").length,
      outillage: projectDemandes.filter(d => d.type === "outillage").length,
      cloturees: projectDemandes.filter(d => d.status === "cloturee").length,
      confirmees: projectDemandes.filter(d => d.status === "confirmee_demandeur").length
    }
  }

  const stats = getStats()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <History className="h-5 w-5" style={{ color: '#015fc4' }} />
            <span className="truncate">Historique - {project?.nom}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Statistiques rapides - Demandes terminées uniquement */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold" style={{ color: '#015fc4' }}>{stats.total}</div>
                <div className="text-sm text-gray-600">Total terminées</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.materiel}</div>
                <div className="text-sm text-gray-600">Matériel</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.outillage}</div>
                <div className="text-sm text-gray-600">Outillage</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.cloturees}</div>
                <div className="text-sm text-gray-600">Clôturées</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-emerald-600">{stats.confirmees}</div>
                <div className="text-sm text-gray-600">Confirmées</div>
              </CardContent>
            </Card>
          </div>

          {/* Filtres - Responsive */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par numéro ou demandeur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2 sm:gap-4">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="flex-1 sm:flex-none px-2 sm:px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">Tous types</option>
                <option value="materiel">Matériel</option>
                <option value="outillage">Outillage</option>
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="flex-1 sm:flex-none px-2 sm:px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">Tous statuts</option>
                <option value="cloturee">Clôturée</option>
                <option value="confirmee_demandeur">Confirmée</option>
                <option value="archivee">Archivée</option>
              </select>

              <Button variant="outline" size="sm" className="hidden sm:flex">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>

          {/* Liste des demandes */}
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-[40vh] sm:max-h-[50vh] overflow-y-auto">
              {filteredDemandes.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Aucune demande terminée trouvée pour ce projet</p>
                </div>
              ) : (
                <div className="space-y-2 p-4">
                  {filteredDemandes.map((demande) => (
                    <Card key={demande.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-medium">{demande.numero}</h3>
                              {getTypeBadge(demande.type)}
                              {getStatusBadge(demande.status)}
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-2">
                              {demande.items?.length ? `${demande.items.length} articles demandés` : "Aucun article"}
                            </p>
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {getUserName(demande.technicienId)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(demande.dateCreation).toLocaleDateString('fr-FR')}
                              </span>
                              <span className="flex items-center gap-1">
                                <Package className="h-3 w-3" />
                                {demande.items?.length || 0} articles
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <Button variant="outline" size="sm">
                              Voir détails
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Résumé */}
          <div className="text-sm text-gray-600 text-center">
            Affichage de {filteredDemandes.length} demande(s) terminée(s) sur {projectDemandes.length} au total
          </div>

          {/* Bouton de fermeture */}
          <div className="flex justify-center pt-4 border-t mt-4">
            <Button variant="outline" onClick={onClose} className="min-w-[120px]">
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

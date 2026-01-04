"use client"

import { useState, useEffect } from "react"
import { useStore } from "@/stores/useStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  Filter,
  Calendar,
  User,
  Building2,
  Package,
  Clock,
  AlertCircle
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import SuperAdminValidationModal from "@/components/admin/super-admin-validation-modal"
import { useRouter } from "next/navigation"

export default function SuperAdminValidationsPage() {
  const router = useRouter()
  const { demandes, currentUser, loadDemandes } = useStore()
  const [filterType, setFilterType] = useState<"all" | "materiel" | "outillage">("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [selectedDemandeId, setSelectedDemandeId] = useState<string | null>(null)

  useEffect(() => {
    if (!currentUser) {
      router.push("/")
      return
    }
    
    if (currentUser.role !== "superadmin") {
      router.push("/dashboard")
      return
    }

    loadDemandes()
  }, [currentUser, router, loadDemandes])

  if (!currentUser || currentUser.role !== "superadmin") {
    return null
  }

  // Filtrer les demandes en cours (exclure brouillon, rejetée, clôturée)
  const demandesEnCours = demandes.filter(d => 
    !["brouillon", "rejetee", "cloturee"].includes(d.status)
  )

  // Appliquer les filtres
  const filteredDemandes = demandesEnCours
    .filter(d => {
      if (filterType === "all") return true
      return d.type === filterType
    })
    .filter(d => {
      if (filterStatus === "all") return true
      return d.status === filterStatus
    })
    .sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime())

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      "soumise": { label: "Soumise", className: "bg-blue-100 text-blue-800" },
      "en_attente_validation_conducteur": { label: "Attente Conducteur", className: "bg-yellow-100 text-yellow-800" },
      "en_attente_validation_logistique": { label: "Attente Logistique", className: "bg-purple-100 text-purple-800" },
      "en_attente_validation_responsable_travaux": { label: "Attente Resp. Travaux", className: "bg-orange-100 text-orange-800" },
      "en_attente_validation_charge_affaire": { label: "Attente Chargé Affaire", className: "bg-pink-100 text-pink-800" },
      "en_attente_preparation_appro": { label: "Attente Préparation Appro", className: "bg-indigo-100 text-indigo-800" },
      "en_attente_reception_livreur": { label: "Attente Réception Livreur", className: "bg-cyan-100 text-cyan-800" },
      "en_attente_livraison": { label: "Attente Livraison", className: "bg-teal-100 text-teal-800" },
      "en_attente_validation_finale_demandeur": { label: "Attente Validation Finale", className: "bg-green-100 text-green-800" },
    }

    const config = statusConfig[status] || { label: status, className: "bg-gray-100 text-gray-800" }
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const getValidateurEnAttente = (demande: any) => {
    const validateurs: Record<string, string> = {
      "en_attente_validation_conducteur": "Conducteur de travaux",
      "en_attente_validation_logistique": "Responsable logistique",
      "en_attente_validation_responsable_travaux": "Responsable travaux",
      "en_attente_validation_charge_affaire": "Chargé d'affaires",
      "en_attente_preparation_appro": "Responsable appro",
      "en_attente_reception_livreur": demande.livreurAssigne ? `${demande.livreurAssigne.nom} ${demande.livreurAssigne.prenom}` : "Livreur",
      "en_attente_livraison": demande.livreurAssigne ? `${demande.livreurAssigne.nom} ${demande.livreurAssigne.prenom}` : "Livreur",
      "en_attente_validation_finale_demandeur": `${demande.technicien?.nom} ${demande.technicien?.prenom}`,
    }

    return validateurs[demande.status] || "N/A"
  }

  const uniqueStatuses = Array.from(new Set(demandesEnCours.map(d => d.status)))

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Validations Super Admin</h1>
          <p className="text-gray-600 mt-1">
            Gérez et validez toutes les demandes en cours avec des pouvoirs étendus
          </p>
        </div>
        <Badge className="bg-red-600 text-white text-lg px-4 py-2">
          Super Admin
        </Badge>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Type de demande
              </label>
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les types</SelectItem>
                  <SelectItem value="materiel">Matériel</SelectItem>
                  <SelectItem value="outillage">Outillage</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Statut
              </label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {uniqueStatuses.map(status => (
                    <SelectItem key={status} value={status}>
                      {status.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <div className="text-sm text-gray-600">
                <strong>{filteredDemandes.length}</strong> demande{filteredDemandes.length > 1 ? "s" : ""} trouvée{filteredDemandes.length > 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des demandes */}
      <div className="grid gap-4">
        {filteredDemandes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Aucune demande en cours ne correspond à vos filtres</p>
            </CardContent>
          </Card>
        ) : (
          filteredDemandes.map((demande) => (
            <Card key={demande.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Colonne 1: Numéro et Type */}
                  <div className="lg:col-span-2">
                    <div className="space-y-2">
                      <div className="font-bold text-lg text-indigo-600">
                        {demande.numero}
                      </div>
                      <Badge className={demande.type === "materiel" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}>
                        {demande.type === "materiel" ? "Matériel" : "Outillage"}
                      </Badge>
                    </div>
                  </div>

                  {/* Colonne 2: Statut */}
                  <div className="lg:col-span-2">
                    <div className="text-xs text-gray-500 mb-1">Statut actuel</div>
                    {getStatusBadge(demande.status)}
                  </div>

                  {/* Colonne 3: Demandeur */}
                  <div className="lg:col-span-2">
                    <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Demandeur
                    </div>
                    <div className="font-medium text-sm">
                      {demande.technicien?.nom} {demande.technicien?.prenom}
                    </div>
                  </div>

                  {/* Colonne 4: Projet */}
                  <div className="lg:col-span-2">
                    <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      Projet
                    </div>
                    <div className="font-medium text-sm">
                      {demande.projet?.nom || "N/A"}
                    </div>
                  </div>

                  {/* Colonne 5: Validateur en attente */}
                  <div className="lg:col-span-2">
                    <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      En attente de
                    </div>
                    <div className="font-medium text-sm text-orange-600">
                      {getValidateurEnAttente(demande)}
                    </div>
                  </div>

                  {/* Colonne 6: Date et Actions */}
                  <div className="lg:col-span-2 flex flex-col justify-between">
                    <div>
                      <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Créée le
                      </div>
                      <div className="text-sm">
                        {new Date(demande.dateCreation).toLocaleDateString("fr-FR")}
                      </div>
                    </div>
                    <div className="mt-2">
                      <Button
                        size="sm"
                        onClick={() => setSelectedDemandeId(demande.id)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Voir & Valider
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Informations supplémentaires */}
                <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <Package className="w-3 h-3" />
                    <span>{demande.items?.length || 0} article{(demande.items?.length || 0) > 1 ? "s" : ""}</span>
                  </div>
                  {demande.dateModification && (
                    <div>
                      Modifiée: {new Date(demande.dateModification).toLocaleDateString("fr-FR")}
                    </div>
                  )}
                  {demande.dateLivraisonSouhaitee && (
                    <div>
                      Livraison souhaitée: {new Date(demande.dateLivraisonSouhaitee).toLocaleDateString("fr-FR")}
                    </div>
                  )}
                  {demande.coutTotal && (
                    <div className="font-semibold text-green-600">
                      Coût: {demande.coutTotal.toLocaleString("fr-FR")} FCFA
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modal de validation */}
      {selectedDemandeId && (
        <SuperAdminValidationModal
          isOpen={!!selectedDemandeId}
          onClose={() => setSelectedDemandeId(null)}
          demandeId={selectedDemandeId}
          onValidated={() => {
            setSelectedDemandeId(null)
            loadDemandes()
          }}
        />
      )}
    </div>
  )
}

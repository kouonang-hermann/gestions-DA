"use client"

import { useStore } from "@/stores/useStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function DashboardDebug() {
  const { currentUser, demandes } = useStore()

  if (!currentUser || !demandes) {
    return <div>Chargement des données de debug...</div>
  }

  // Fonction pour obtenir les demandes selon le rôle (copie de la logique du dashboard)
  const getDemandesForRole = () => {
    switch (currentUser.role) {
      case "conducteur_travaux":
        return demandes.filter(d => 
          d.type === "materiel" && (
            d.status === "en_attente_validation_conducteur" ||
            d.status === "soumise" ||
            ["en_attente_validation_qhse", "en_attente_validation_responsable_travaux", "en_attente_validation_charge_affaire", "en_attente_preparation_appro", "en_attente_validation_logistique", "en_attente_validation_finale_demandeur", "confirmee_demandeur", "cloturee", "archivee"].includes(d.status)
          )
        )
      
      case "responsable_qhse":
        return demandes.filter(d => 
          d.type === "outillage" && (
            d.status === "en_attente_validation_qhse" ||
            ["en_attente_validation_responsable_travaux", "en_attente_validation_charge_affaire", "en_attente_preparation_appro", "en_attente_validation_logistique", "en_attente_validation_finale_demandeur", "confirmee_demandeur", "cloturee", "archivee"].includes(d.status)
          )
        )
      
      default:
        return demandes.filter(d => d.technicienId === currentUser.id)
    }
  }

  const demandesForRole = getDemandesForRole()

  // Calcul des statistiques
  const enAttenteStatuses = [
    "en_attente_validation_conducteur",
    "en_attente_validation_qhse", 
    "en_attente_validation_responsable_travaux",
    "en_attente_validation_charge_affaire",
    "en_attente_preparation_appro",
    "en_attente_validation_logistique"
  ]

  const enAttente = demandesForRole.filter(d => enAttenteStatuses.includes(d.status))
  const validees = demandesForRole.filter(d => ["cloturee", "archivee", "confirmee_demandeur", "en_attente_validation_finale_demandeur"].includes(d.status))

  return (
    <div className="p-4 space-y-4 bg-gray-100 border-2 border-blue-500 rounded-lg">
      <h2 className="text-xl font-bold text-blue-600">🔍 DEBUG DASHBOARD</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Informations utilisateur</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Nom:</strong> {currentUser.prenom} {currentUser.nom}</p>
            <p><strong>Rôle:</strong> <Badge variant="outline">{currentUser.role}</Badge></p>
            <p><strong>ID:</strong> {currentUser.id}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Statistiques des demandes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded">
              <div className="text-2xl font-bold text-blue-600">{demandesForRole.length}</div>
              <div className="text-sm text-gray-600">Total demandes</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded">
              <div className="text-2xl font-bold text-orange-600">{enAttente.length}</div>
              <div className="text-sm text-gray-600">En attente</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded">
              <div className="text-2xl font-bold text-green-600">{validees.length}</div>
              <div className="text-sm text-gray-600">Validées</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded">
              <div className="text-2xl font-bold text-gray-600">
                {demandesForRole.filter(d => d.type === "materiel").length}
              </div>
              <div className="text-sm text-gray-600">Matériel</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Demandes en attente (détail)</CardTitle>
        </CardHeader>
        <CardContent>
          {enAttente.length === 0 ? (
            <p className="text-gray-500">Aucune demande en attente</p>
          ) : (
            <div className="space-y-2">
              {enAttente.map(d => (
                <div key={d.id} className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{d.numero}</span>
                    <Badge 
                      className="text-xs"
                      style={{
                        backgroundColor: "#fef3c7",
                        color: "#92400e"
                      }}
                    >
                      {d.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    Type: {d.type} | Projet: {d.projet?.nom || "N/A"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Demandes validées (détail)</CardTitle>
        </CardHeader>
        <CardContent>
          {validees.length === 0 ? (
            <p className="text-gray-500">Aucune demande validée</p>
          ) : (
            <div className="space-y-2">
              {validees.map(d => (
                <div key={d.id} className="p-2 bg-green-50 border border-green-200 rounded">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{d.numero}</span>
                    <Badge 
                      className="text-xs"
                      style={{
                        backgroundColor: "#dcfce7",
                        color: "#166534"
                      }}
                    >
                      {d.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600">
                    Type: {d.type} | Projet: {d.projet?.nom || "N/A"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Toutes les demandes du système</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-1">
            <p><strong>Total demandes système:</strong> {demandes.length}</p>
            <p><strong>Demandes matériel:</strong> {demandes.filter(d => d.type === "materiel").length}</p>
            <p><strong>Demandes outillage:</strong> {demandes.filter(d => d.type === "outillage").length}</p>
            <p><strong>En attente validation conducteur:</strong> {demandes.filter(d => d.status === "en_attente_validation_conducteur").length}</p>
            <p><strong>En attente validation QHSE:</strong> {demandes.filter(d => d.status === "en_attente_validation_qhse").length}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

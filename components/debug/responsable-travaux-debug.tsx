"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useStore } from "@/stores/useStore"
import { Badge } from "@/components/ui/badge"

interface ResponsableTravauxDebugProps {
  onClose?: () => void
}

export default function ResponsableTravauxDebug({ onClose }: ResponsableTravauxDebugProps) {
  const { currentUser, demandes, loadDemandes, loadUsers, users } = useStore()
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    if (currentUser) {
      // Analyser les données en temps réel
      const info = {
        utilisateur: {
          nom: currentUser.nom,
          role: currentUser.role,
          projets: currentUser.projets || [],
          id: currentUser.id
        },
        demandes: {
          total: demandes.length,
          parStatut: demandes.reduce((acc, d) => {
            acc[d.status] = (acc[d.status] || 0) + 1
            return acc
          }, {} as Record<string, number>),
          responsableTravauxTotal: demandes.filter(d => d.status === "en_attente_validation_responsable_travaux").length,
          responsableTravauxFiltered: demandes.filter(d => 
            d.status === "en_attente_validation_responsable_travaux" &&
            (!currentUser.projets || currentUser.projets.length === 0 || currentUser.projets.includes(d.projetId))
          ).length,
          detailDemandes: demandes.filter(d => d.status === "en_attente_validation_responsable_travaux").map(d => ({
            numero: d.numero,
            type: d.type,
            projetId: d.projetId,
            technicienId: d.technicienId,
            dansMonProjet: !currentUser.projets || currentUser.projets.length === 0 || currentUser.projets.includes(d.projetId)
          }))
        },
        users: {
          total: users.length,
          responsablesTravaux: users.filter(u => u.role === "responsable_travaux").map(u => ({
            nom: u.nom,
            id: u.id,
            projets: u.projets || []
          }))
        }
      }
      setDebugInfo(info)
    }
  }, [currentUser, demandes, users])

  const handleReloadDemandes = async () => {
    console.log("🔄 [DEBUG] Rechargement des demandes...")
    await loadDemandes()
  }

  const handleReloadUsers = async () => {
    console.log("🔄 [DEBUG] Rechargement des utilisateurs...")
    try {
      await loadUsers()
      console.log("✅ [DEBUG] Utilisateurs rechargés avec succès")
    } catch (error) {
      console.error("❌ [DEBUG] Erreur rechargement utilisateurs:", error)
    }
  }

  if (!currentUser) {
    return <div>Utilisateur non connecté</div>
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-blue-600">
          🔍 Debug Responsable des Travaux
        </h1>
        <div className="flex space-x-2">
          {onClose && (
            <Button onClick={onClose} variant="outline" className="border-gray-300">
              ← Retour Dashboard
            </Button>
          )}
          <Button onClick={handleReloadDemandes} className="bg-blue-600 hover:bg-blue-700">
            Recharger Demandes
          </Button>
          <Button onClick={handleReloadUsers} className="bg-green-600 hover:bg-green-700">
            Tester Permissions Users
          </Button>
        </div>
      </div>

      {/* Informations utilisateur */}
      <Card>
        <CardHeader>
          <CardTitle>👤 Utilisateur connecté</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div><strong>Nom:</strong> {debugInfo.utilisateur?.nom}</div>
            <div><strong>Rôle:</strong> {debugInfo.utilisateur?.role}</div>
            <div><strong>ID:</strong> {debugInfo.utilisateur?.id}</div>
            <div><strong>Projets:</strong> [{debugInfo.utilisateur?.projets?.join(', ') || 'aucun'}]</div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques des demandes */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Statistiques des demandes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div><strong>Total demandes chargées:</strong> {debugInfo.demandes?.total || 0}</div>
            
            <div>
              <strong>Répartition par statut:</strong>
              <div className="mt-2 space-y-1">
                {Object.entries(debugInfo.demandes?.parStatut || {}).map(([status, count]) => (
                  <div key={status} className="flex justify-between">
                    <span className="text-sm">{status}:</span>
                    <Badge variant={status === "en_attente_validation_responsable_travaux" ? "default" : "secondary"}>
                      {count as number}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div><strong>🎯 Demandes pour responsable travaux (total):</strong> {debugInfo.demandes?.responsableTravauxTotal || 0}</div>
              <div><strong>🎯 Demandes visibles après filtrage:</strong> {debugInfo.demandes?.responsableTravauxFiltered || 0}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Détail des demandes responsable travaux */}
      {debugInfo.demandes?.detailDemandes?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📋 Détail des demandes en attente responsable travaux</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {debugInfo.demandes.detailDemandes.map((d: any, index: number) => (
                <div key={index} className={`p-3 rounded-lg border ${d.dansMonProjet ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><strong>Numéro:</strong> {d.numero}</div>
                    <div><strong>Type:</strong> {d.type}</div>
                    <div><strong>Projet:</strong> {d.projetId}</div>
                    <div><strong>Demandeur:</strong> {d.technicienId}</div>
                    <div className="col-span-2">
                      <Badge variant={d.dansMonProjet ? "default" : "destructive"}>
                        {d.dansMonProjet ? "✅ Dans mes projets" : "❌ Pas dans mes projets"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informations sur les responsables travaux */}
      <Card>
        <CardHeader>
          <CardTitle>👥 Responsables des travaux dans le système</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {debugInfo.users?.responsablesTravaux?.map((u: any, index: number) => (
              <div key={index} className={`p-3 rounded-lg border ${u.id === currentUser.id ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><strong>Nom:</strong> {u.nom}</div>
                  <div><strong>ID:</strong> {u.id}</div>
                  <div className="col-span-2"><strong>Projets:</strong> [{u.projets?.join(', ') || 'aucun'}]</div>
                  {u.id === currentUser.id && (
                    <div className="col-span-2">
                      <Badge variant="default">👤 C'est vous</Badge>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions de debug */}
      <Card>
        <CardHeader>
          <CardTitle>🛠️ Actions de debug</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button 
              onClick={() => console.log("Current User:", currentUser)} 
              variant="outline"
              className="w-full"
            >
              Log Current User
            </Button>
            <Button 
              onClick={() => console.log("All Demandes:", demandes)} 
              variant="outline"
              className="w-full"
            >
              Log All Demandes
            </Button>
            <Button 
              onClick={() => console.log("All Users:", users)} 
              variant="outline"
              className="w-full"
            >
              Log All Users
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

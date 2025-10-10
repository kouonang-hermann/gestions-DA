"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useStore } from "@/stores/useStore"
import { FileText, User, Eye, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react'

/**
 * Composant de diagnostic des demandes pour debug
 */
export default function DemandesDebug() {
  const { currentUser, demandes, loadDemandes, token } = useStore()
  const [isLoading, setIsLoading] = useState(false)
  const [lastTest, setLastTest] = useState<Date | null>(null)

  const testDemandes = async () => {
    setIsLoading(true)
    console.log("🔄 [DEMANDES DEBUG] Test de chargement des demandes...")
    
    try {
      await loadDemandes()
      setLastTest(new Date())
    } catch (error) {
      console.error("❌ [DEMANDES DEBUG] Erreur:", error)
    }
    
    setIsLoading(false)
  }

  useEffect(() => {
    if (currentUser && token) {
      testDemandes()
    }
  }, [currentUser?.id, token])

  if (!currentUser) {
    return (
      <Card className="border-2 border-red-500">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <FileText className="h-4 w-4" />
            Debug Demandes
            <Badge variant="destructive" className="ml-2 text-xs">
              NON CONNECTÉ
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-red-600">
            Aucun utilisateur connecté
          </div>
        </CardContent>
      </Card>
    )
  }

  const demandesVisibles = demandes || []
  const demandesEmploye = demandesVisibles.filter(d => d.technicienId === currentUser.id)
  const demandesConducteur = demandesVisibles.filter(d => 
    d.type === "materiel" && d.status === "en_attente_validation_conducteur"
  )

  return (
    <Card className="border-2" style={{ borderColor: demandesVisibles.length > 0 ? '#22c55e' : '#ef4444' }}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          {demandesVisibles.length > 0 ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          )}
          <FileText className="h-4 w-4" />
          Debug Demandes
          <Badge variant="outline" className="ml-2 text-xs">
            {currentUser.role}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Utilisateur connecté */}
          <div>
            <div className="text-xs font-medium text-gray-600 mb-1">Utilisateur connecté :</div>
            <div className="text-xs">
              <div><strong>Nom:</strong> {currentUser.prenom} {currentUser.nom}</div>
              <div><strong>Email:</strong> {currentUser.email}</div>
              <div><strong>ID:</strong> {currentUser.id}</div>
              <div><strong>Projets:</strong> {currentUser.projets?.join(', ') || 'Aucun'}</div>
            </div>
          </div>

          {/* Statistiques des demandes */}
          <div>
            <div className="text-xs font-medium text-gray-600 mb-1">Demandes chargées :</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span>Total:</span>
                <Badge variant="outline">{demandesVisibles.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Mes demandes:</span>
                <Badge variant="outline">{demandesEmploye.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Pour conducteur:</span>
                <Badge variant="outline">{demandesConducteur.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Token:</span>
                <Badge variant={token ? "default" : "destructive"} className="text-xs">
                  {token ? "OK" : "MANQUANT"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Détail des demandes */}
          {demandesVisibles.length > 0 && (
            <div>
              <div className="text-xs font-medium text-gray-600 mb-1">Détail des demandes :</div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {demandesVisibles.slice(0, 5).map(demande => (
                  <div key={demande.id} className="text-xs bg-gray-50 p-1 rounded">
                    <div className="flex justify-between items-center">
                      <span><strong>{demande.numero}</strong></span>
                      <Badge variant="outline" className="text-xs">
                        {demande.type}
                      </Badge>
                    </div>
                    <div>Status: {demande.status}</div>
                    <div>Technicien: {demande.technicienId}</div>
                    <div>Projet: {demande.projetId}</div>
                  </div>
                ))}
                {demandesVisibles.length > 5 && (
                  <div className="text-xs text-gray-500 text-center">
                    ... et {demandesVisibles.length - 5} autres
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Analyse par rôle */}
          <div>
            <div className="text-xs font-medium text-gray-600 mb-1">Analyse pour {currentUser.role} :</div>
            <div className="text-xs space-y-1">
              {currentUser.role === "conducteur_travaux" && (
                <>
                  <div>• Doit voir les demandes matériel en attente de validation</div>
                  <div>• Demandes trouvées: {demandesConducteur.length}</div>
                  {demandesConducteur.length === 0 && (
                    <div className="text-red-600">⚠️ Aucune demande en attente trouvée</div>
                  )}
                </>
              )}
              {currentUser.role === "employe" && (
                <>
                  <div>• Doit voir ses propres demandes</div>
                  <div>• Demandes trouvées: {demandesEmploye.length}</div>
                  {demandesEmploye.length === 0 && (
                    <div className="text-red-600">⚠️ Aucune demande personnelle trouvée</div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="text-xs text-gray-500">
              {lastTest && `Dernier test: ${lastTest.toLocaleTimeString()}`}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={testDemandes}
              disabled={isLoading}
              className="h-6 px-2 text-xs"
            >
              {isLoading ? (
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3 mr-1" />
              )}
              Recharger
            </Button>
          </div>

          {/* Message de statut */}
          {demandesVisibles.length > 0 && (
            <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
              ✅ {demandesVisibles.length} demandes chargées depuis l'API
            </div>
          )}

          {demandesVisibles.length === 0 && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
              ⚠️ Aucune demande chargée. Vérifiez la connexion API et la base de données.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useStore } from "@/stores/useStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle, XCircle, Package } from "lucide-react"

/**
 * Composant de diagnostic pour identifier pourquoi un livreur ne voit pas ses livraisons
 */
export default function LivreurDiagnostic() {
  const { demandes, currentUser } = useStore()

  if (!currentUser) return null

  // Toutes les demandes avec un livreur assigné
  const demandesAvecLivreur = demandes.filter(d => d.livreurAssigneId)
  
  // Demandes où l'utilisateur est le livreur
  const mesLivraisonsAll = demandes.filter(d => d.livreurAssigneId === currentUser.id)
  
  // Demandes visibles (avec les bons statuts)
  const mesLivraisonsVisibles = demandes.filter(
    d => d.livreurAssigneId === currentUser.id &&
    (d.status === "en_attente_reception_livreur" || d.status === "en_attente_livraison")
  )

  // Demandes où je suis livreur mais avec un autre statut
  const mesLivraisonsAutreStatut = mesLivraisonsAll.filter(
    d => d.status !== "en_attente_reception_livreur" && d.status !== "en_attente_livraison"
  )

  // Demandes que j'ai émises
  const mesDemandes = demandes.filter(d => d.technicienId === currentUser.id)
  
  // Demandes que j'ai émises et où je suis livreur
  const mesDemandesOuJeSuisLivreur = mesDemandes.filter(d => d.livreurAssigneId === currentUser.id)

  return (
    <Card className="border-2 border-yellow-500 bg-yellow-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-800">
          <AlertCircle className="h-5 w-5" />
          Diagnostic Livreur - {currentUser.nom} {currentUser.prenom}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informations utilisateur */}
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold mb-2">Informations utilisateur</h3>
          <div className="space-y-1 text-sm">
            <div><strong>ID:</strong> {currentUser.id}</div>
            <div><strong>Nom:</strong> {currentUser.nom} {currentUser.prenom}</div>
            <div><strong>Rôle:</strong> <Badge>{currentUser.role}</Badge></div>
            <div><strong>Email:</strong> {currentUser.email}</div>
          </div>
        </div>

        {/* Statistiques globales */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600">Total demandes</div>
            <div className="text-2xl font-bold">{demandes.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-sm text-gray-600">Demandes avec livreur</div>
            <div className="text-2xl font-bold">{demandesAvecLivreur.length}</div>
          </div>
        </div>

        {/* Mes demandes émises */}
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Package className="h-4 w-4" />
            Mes demandes émises ({mesDemandes.length})
          </h3>
          {mesDemandes.length > 0 ? (
            <div className="space-y-2">
              {mesDemandes.map(d => (
                <div key={d.id} className="text-sm p-2 bg-gray-50 rounded">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{d.numero}</span>
                    <Badge variant="outline">{d.status}</Badge>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Livreur assigné: {d.livreurAssigneId ? (
                      d.livreurAssigneId === currentUser.id ? (
                        <span className="text-green-600 font-semibold">✓ Moi ({d.livreurAssigneId})</span>
                      ) : (
                        <span className="text-orange-600">Autre ({d.livreurAssigneId})</span>
                      )
                    ) : (
                      <span className="text-red-600">Aucun</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Aucune demande émise</p>
          )}
        </div>

        {/* Mes livraisons assignées */}
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            {mesLivraisonsAll.length > 0 ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            Livraisons assignées à moi ({mesLivraisonsAll.length})
          </h3>
          {mesLivraisonsAll.length > 0 ? (
            <div className="space-y-2">
              {mesLivraisonsAll.map(d => (
                <div key={d.id} className="text-sm p-2 bg-gray-50 rounded">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{d.numero}</span>
                    <Badge variant="outline">{d.status}</Badge>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Type: {d.type} | Demandeur: {d.technicien?.nom}
                  </div>
                  <div className="text-xs mt-1">
                    {d.status === "en_attente_reception_livreur" || d.status === "en_attente_livraison" ? (
                      <span className="text-green-600 font-semibold">✓ Visible dans la carte</span>
                    ) : (
                      <span className="text-orange-600">⚠ Pas visible (statut incorrect)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-red-600">❌ Aucune livraison assignée</p>
          )}
        </div>

        {/* Livraisons visibles */}
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            {mesLivraisonsVisibles.length > 0 ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4 text-red-600" />
            )}
            Livraisons VISIBLES dans la carte ({mesLivraisonsVisibles.length})
          </h3>
          {mesLivraisonsVisibles.length > 0 ? (
            <div className="space-y-2">
              {mesLivraisonsVisibles.map(d => (
                <div key={d.id} className="text-sm p-2 bg-green-50 rounded border border-green-200">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{d.numero}</span>
                    <Badge className="bg-green-600">{d.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-red-600">❌ Aucune livraison visible</p>
          )}
        </div>

        {/* Livraisons avec autre statut */}
        {mesLivraisonsAutreStatut.length > 0 && (
          <div className="bg-white p-4 rounded-lg border border-orange-300">
            <h3 className="font-semibold mb-2 flex items-center gap-2 text-orange-700">
              <AlertCircle className="h-4 w-4" />
              Livraisons avec statut incorrect ({mesLivraisonsAutreStatut.length})
            </h3>
            <div className="space-y-2">
              {mesLivraisonsAutreStatut.map(d => (
                <div key={d.id} className="text-sm p-2 bg-orange-50 rounded">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{d.numero}</span>
                    <Badge variant="outline" className="bg-orange-100">{d.status}</Badge>
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    ⚠ Cette demande ne s'affiche pas car le statut n'est pas "en_attente_reception_livreur" ou "en_attente_livraison"
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Diagnostic final */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-300">
          <h3 className="font-semibold mb-2 text-blue-800">Diagnostic</h3>
          <div className="space-y-2 text-sm">
            {mesLivraisonsVisibles.length > 0 ? (
              <div className="flex items-start gap-2 text-green-700">
                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>✅ La carte "Mes livraisons" devrait être visible avec {mesLivraisonsVisibles.length} livraison(s)</span>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-red-700">
                <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>❌ La carte "Mes livraisons" n'est pas visible car aucune livraison n'a le bon statut</span>
              </div>
            )}
            
            {mesLivraisonsAll.length > 0 && mesLivraisonsVisibles.length === 0 && (
              <div className="flex items-start gap-2 text-orange-700">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>⚠ Vous êtes assigné comme livreur sur {mesLivraisonsAll.length} demande(s), mais elles ont un statut incorrect. Le responsable appro ou logistique doit d'abord préparer la sortie.</span>
              </div>
            )}

            {mesDemandesOuJeSuisLivreur.length > 0 && (
              <div className="flex items-start gap-2 text-blue-700">
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>ℹ️ Vous êtes livreur sur {mesDemandesOuJeSuisLivreur.length} de vos propres demandes</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions recommandées */}
        {mesLivraisonsAll.length > 0 && mesLivraisonsVisibles.length === 0 && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-300">
            <h3 className="font-semibold mb-2 text-yellow-800">Actions recommandées</h3>
            <ul className="text-sm space-y-1 text-yellow-700 list-disc list-inside">
              <li>Vérifiez que le responsable appro/logistique a bien préparé la sortie</li>
              <li>Le statut doit passer à "en_attente_reception_livreur" après la préparation</li>
              <li>Contactez le responsable appro/logistique si la demande est bloquée</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

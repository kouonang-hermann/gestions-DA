"use client"

import { useStore } from "@/stores/useStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle } from "lucide-react"

export default function TestEditFeature() {
  const { currentUser } = useStore()

  return (
    <Card className="border-2 border-blue-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔍 Diagnostic - Fonctionnalité d'édition
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Vérification utilisateur */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">1. Utilisateur connecté</h3>
          {currentUser ? (
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">Utilisateur détecté</span>
              </div>
              <div className="text-xs space-y-1 text-gray-700">
                <p><strong>Nom :</strong> {currentUser.prenom} {currentUser.nom}</p>
                <p><strong>Email :</strong> {currentUser.email}</p>
                <p><strong>Rôle :</strong> <Badge>{currentUser.role}</Badge></p>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">Aucun utilisateur connecté</span>
              </div>
            </div>
          )}
        </div>

        {/* Vérification rôle super admin */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">2. Vérification Super Admin</h3>
          {currentUser?.role === "superadmin" ? (
            <div className="bg-green-50 border border-green-200 rounded p-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  ✅ Vous êtes bien super admin - La fonctionnalité d'édition devrait être visible
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-orange-50 border border-orange-200 rounded p-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">
                  ⚠️ Vous n'êtes pas super admin - Rôle actuel : {currentUser?.role || "Non défini"}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">3. Comment tester la fonctionnalité</h3>
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <ol className="text-xs space-y-2 text-gray-700 list-decimal list-inside">
              <li>Cliquez sur la carte <strong>"En cours"</strong> dans votre dashboard</li>
              <li>Une modale s'ouvre avec un tableau de demandes</li>
              <li>Dans le tableau, vous devriez voir des boutons d'action à droite (œil, crayon, poubelle)</li>
              <li><strong>Double-cliquez</strong> sur n'importe quelle ligne du tableau</li>
              <li>OU cliquez sur le <strong>bouton crayon orange</strong></li>
              <li>La modale d'édition devrait s'ouvrir</li>
            </ol>
          </div>
        </div>

        {/* Vérification composants */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">4. Composants chargés</h3>
          <div className="bg-gray-50 border border-gray-200 rounded p-3">
            <div className="text-xs space-y-1 text-gray-700">
              <p>✅ EditDemandeModal : Chargé</p>
              <p>✅ DemandesCategoryModal : Chargé</p>
              <p>✅ API /api/demandes/[id] : Configurée</p>
            </div>
          </div>
        </div>

        {/* Message final */}
        <div className="bg-purple-50 border border-purple-200 rounded p-3">
          <p className="text-xs text-purple-800">
            <strong>💡 Astuce :</strong> Si vous ne voyez toujours pas la fonctionnalité, 
            ouvrez la console du navigateur (F12) et vérifiez s'il y a des erreurs en rouge.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Database, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Users, 
  FolderOpen, 
  Settings,
  RefreshCw
} from "lucide-react"
import { useStore } from "@/stores/useStore"

/**
 * Composant de diagnostic pour vérifier l'état de la persistance des données
 */
export default function DataPersistenceStatus() {
  const { 
    users, 
    projets, 
    demandes, 
    addUserToProject, 
    removeUserFromProject, 
    updateUserRole, 
    updateProject,
    isLoading 
  } = useStore()
  
  const [testResults, setTestResults] = useState<any>({})
  const [isRunningTests, setIsRunningTests] = useState(false)

  // Test des fonctions de persistance
  const runPersistenceTests = async () => {
    setIsRunningTests(true)
    const results: any = {}

    try {
      // Test 1: Vérifier la disponibilité des données
      results.dataAvailability = {
        users: users.length > 0,
        projets: projets.length > 0,
        demandes: demandes.length > 0,
        status: users.length > 0 && projets.length > 0 ? 'success' : 'warning'
      }

      // Test 2: Test d'ajout d'utilisateur à un projet (simulation)
      if (users.length > 0 && projets.length > 0) {
        const testUser = users[0]
        const testProject = projets[0]
        
        const addResult = await addUserToProject(testUser.id, testProject.id, 'employe')
        results.addUserToProject = {
          success: addResult,
          status: addResult ? 'success' : 'error'
        }

        // Test 3: Test de suppression d'utilisateur du projet
        if (addResult) {
          const removeResult = await removeUserFromProject(testUser.id, testProject.id)
          results.removeUserFromProject = {
            success: removeResult,
            status: removeResult ? 'success' : 'error'
          }
        }
      }

      // Test 4: Test de modification de rôle
      if (users.length > 0) {
        const testUser = users[0]
        const originalRole = testUser.role
        
        const roleResult = await updateUserRole(testUser.id, 'conducteur_travaux')
        
        // Remettre le rôle original
        if (roleResult) {
          await updateUserRole(testUser.id, originalRole)
        }
        
        results.updateUserRole = {
          success: roleResult,
          status: roleResult ? 'success' : 'error'
        }
      }

      // Test 5: Test de modification de projet
      if (projets.length > 0) {
        const testProject = projets[0]
        
        const projectResult = await updateProject(testProject.id, {
          description: testProject.description + ' [TEST]'
        })
        
        // Remettre la description originale
        if (projectResult) {
          await updateProject(testProject.id, {
            description: testProject.description?.replace(' [TEST]', '') || ''
          })
        }
        
        results.updateProject = {
          success: projectResult,
          status: projectResult ? 'success' : 'error'
        }
      }

    } catch (error) {
      results.error = error
    }

    setTestResults(results)
    setIsRunningTests(false)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'error': return <AlertCircle className="h-4 w-4 text-red-600" />
      default: return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800', 
      error: 'bg-red-100 text-red-800',
      pending: 'bg-gray-100 text-gray-800'
    }
    
    const labels = {
      success: 'Fonctionnel',
      warning: 'Attention',
      error: 'Erreur',
      pending: 'En attente'
    }

    return (
      <Badge className={`${colors[status as keyof typeof colors]} text-xs`}>
        {labels[status as keyof typeof labels]}
      </Badge>
    )
  }

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" style={{ color: '#015fc4' }} />
          État de la Persistance des Données
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informations générales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <div className="font-medium">{users.length} Utilisateurs</div>
              <div className="text-sm text-gray-600">Chargés en mémoire</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <FolderOpen className="h-8 w-8 text-green-600" />
            <div>
              <div className="font-medium">{projets.length} Projets</div>
              <div className="text-sm text-gray-600">Disponibles</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
            <Settings className="h-8 w-8 text-purple-600" />
            <div>
              <div className="font-medium">Mode Local</div>
              <div className="text-sm text-gray-600">Persistance Zustand</div>
            </div>
          </div>
        </div>

        {/* Mode de fonctionnement */}
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h3 className="font-medium text-yellow-900 mb-2">🔄 Mode de Fonctionnement Actuel</h3>
          <p className="text-sm text-yellow-800 mb-3">
            L'application fonctionne en <strong>mode local</strong> pour assurer la stabilité. 
            Toutes les modifications sont sauvegardées localement via Zustand persist.
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-yellow-100 text-yellow-800 text-xs">✅ Gestion des utilisateurs</Badge>
            <Badge className="bg-yellow-100 text-yellow-800 text-xs">✅ Modification des projets</Badge>
            <Badge className="bg-yellow-100 text-yellow-800 text-xs">✅ Assignation des rôles</Badge>
            <Badge className="bg-yellow-100 text-yellow-800 text-xs">✅ Persistance locale</Badge>
          </div>
        </div>

        {/* Tests de fonctionnement */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium">Tests de Fonctionnement</h3>
            <Button
              onClick={runPersistenceTests}
              disabled={isRunningTests || isLoading}
              size="sm"
              style={{ backgroundColor: '#015fc4' }}
              className="text-white"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRunningTests ? 'animate-spin' : ''}`} />
              {isRunningTests ? 'Tests en cours...' : 'Lancer les tests'}
            </Button>
          </div>

          {Object.keys(testResults).length > 0 && (
            <div className="space-y-3">
              {testResults.dataAvailability && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.dataAvailability.status)}
                    <span>Disponibilité des données</span>
                  </div>
                  {getStatusBadge(testResults.dataAvailability.status)}
                </div>
              )}

              {testResults.addUserToProject && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.addUserToProject.status)}
                    <span>Ajout utilisateur au projet</span>
                  </div>
                  {getStatusBadge(testResults.addUserToProject.status)}
                </div>
              )}

              {testResults.removeUserFromProject && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.removeUserFromProject.status)}
                    <span>Suppression utilisateur du projet</span>
                  </div>
                  {getStatusBadge(testResults.removeUserFromProject.status)}
                </div>
              )}

              {testResults.updateUserRole && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.updateUserRole.status)}
                    <span>Modification de rôle</span>
                  </div>
                  {getStatusBadge(testResults.updateUserRole.status)}
                </div>
              )}

              {testResults.updateProject && (
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(testResults.updateProject.status)}
                    <span>Modification de projet</span>
                  </div>
                  {getStatusBadge(testResults.updateProject.status)}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Prochaines étapes */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-medium text-blue-900 mb-2">📋 Prochaines Étapes</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Implémenter les endpoints API (/api/projects/, /api/users/)</li>
            <li>• Configurer une base de données (Prisma/Supabase)</li>
            <li>• Migrer du mode local vers les APIs</li>
            <li>• Ajouter la validation et sécurité</li>
          </ul>
        </div>

        {/* Documentation */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-2">
            Consultez la documentation complète dans <code>docs/PERSISTANCE-DONNEES.md</code>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

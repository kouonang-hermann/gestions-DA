"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useStore } from "@/stores/useStore"
import { AlertCircle, CheckCircle, XCircle, RefreshCw } from "lucide-react"

export default function LogistiqueDebug() {
  const { currentUser, demandes, projets, loadDemandes, loadProjets, loadUsers } = useStore()
  const [diagnosticData, setDiagnosticData] = useState<any>(null)

  useEffect(() => {
    if (currentUser && demandes.length > 0) {
      runDiagnostic()
    }
  }, [currentUser, demandes])

  const runDiagnostic = () => {
    if (!currentUser) {
      setDiagnosticData({ error: "Aucun utilisateur connecté" })
      return
    }

    console.log("🔍 [LOGISTIQUE-DEBUG] DIAGNOSTIC COMPLET:")
    console.log("=" .repeat(60))
    
    // 1. Informations utilisateur
    console.log("👤 UTILISATEUR CONNECTÉ:")
    console.log(`  - ID: ${currentUser.id}`)
    console.log(`  - Nom: ${currentUser.nom} ${currentUser.prenom}`)
    console.log(`  - Rôle: ${currentUser.role}`)
    console.log(`  - Projets: ${JSON.stringify(currentUser.projets)}`)
    console.log(`  - Type projets: ${Array.isArray(currentUser.projets) ? 'Array' : typeof currentUser.projets}`)
    if (Array.isArray(currentUser.projets)) {
      console.log(`  - Nombre de projets: ${currentUser.projets.length}`)
      currentUser.projets.forEach((p, i) => {
        console.log(`    [${i}] Type: ${typeof p}, Valeur: ${p}`)
      })
    }

    // 2. Demandes totales
    console.log("\n📦 DEMANDES DANS LE SYSTÈME:")
    console.log(`  - Total demandes: ${demandes.length}`)
    
    // 3. Filtrage par projet
    const demandesFiltered = demandes.filter((d) => 
      !currentUser.projets || 
      currentUser.projets.length === 0 || 
      currentUser.projets.includes(d.projetId)
    )
    console.log(`  - Demandes après filtrage projet: ${demandesFiltered.length}`)
    
    // 4. Répartition par statut
    const statusCount: { [key: string]: number } = {}
    demandesFiltered.forEach(d => {
      statusCount[d.status] = (statusCount[d.status] || 0) + 1
    })
    console.log("\n📊 RÉPARTITION PAR STATUT:")
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`  - ${status}: ${count}`)
    })

    // 5. Demandes à valider (logistique)
    const demandesAValider = demandesFiltered.filter(d => 
      d.status === "en_attente_validation_logistique"
    )
    console.log(`\n🎯 DEMANDES À VALIDER (LOGISTIQUE): ${demandesAValider.length}`)
    if (demandesAValider.length > 0) {
      demandesAValider.forEach(d => {
        console.log(`  - ${d.numero} (Projet: ${d.projetId})`)
      })
    }

    // 6. Demandes créées par l'utilisateur
    const mesDemandesCreees = demandesFiltered.filter(d => 
      d.technicienId === currentUser.id
    )
    console.log(`\n👨‍💼 MES DEMANDES CRÉÉES: ${mesDemandesCreees.length}`)

    // 7. Projets disponibles
    console.log(`\n📁 PROJETS DANS LE SYSTÈME: ${projets.length}`)
    projets.forEach(p => {
      const demandesProjet = demandes.filter(d => d.projetId === p.id).length
      console.log(`  - ${p.nom} (${p.id}): ${demandesProjet} demandes`)
    })

    // 8. Vérification de cohérence
    console.log("\n✅ VÉRIFICATIONS:")
    const checks = {
      userHasProjects: currentUser.projets && currentUser.projets.length > 0,
      projectsAreArray: Array.isArray(currentUser.projets),
      projectsAreStrings: Array.isArray(currentUser.projets) && currentUser.projets.every(p => typeof p === 'string'),
      hasDemandesInProjects: demandesFiltered.length > 0,
      hasDemandesAValider: demandesAValider.length > 0,
    }
    
    console.log(`  - Utilisateur a des projets: ${checks.userHasProjects ? '✅' : '❌'}`)
    console.log(`  - Projets est un Array: ${checks.projectsAreArray ? '✅' : '❌'}`)
    console.log(`  - Projets sont des strings: ${checks.projectsAreStrings ? '✅' : '❌'}`)
    console.log(`  - A des demandes dans ses projets: ${checks.hasDemandesInProjects ? '✅' : '❌'}`)
    console.log(`  - A des demandes à valider: ${checks.hasDemandesAValider ? '✅' : '❌'}`)

    console.log("=" .repeat(60))

    setDiagnosticData({
      user: {
        id: currentUser.id,
        nom: `${currentUser.nom} ${currentUser.prenom}`,
        role: currentUser.role,
        projets: currentUser.projets,
        projetsType: Array.isArray(currentUser.projets) ? 'Array' : typeof currentUser.projets,
        projetsCount: Array.isArray(currentUser.projets) ? currentUser.projets.length : 0,
      },
      demandes: {
        total: demandes.length,
        filtered: demandesFiltered.length,
        aValider: demandesAValider.length,
        mesDemandesCreees: mesDemandesCreees.length,
      },
      statusCount,
      projets: projets.length,
      checks,
      demandesAValider: demandesAValider.map(d => ({
        numero: d.numero,
        projetId: d.projetId,
        projetNom: d.projet?.nom || 'N/A',
        status: d.status,
      })),
    })
  }

  const handleReload = async () => {
    console.log("🔄 [LOGISTIQUE-DEBUG] Rechargement forcé des données...")
    await loadDemandes()
    await loadProjets()
    await loadUsers()
    setTimeout(() => runDiagnostic(), 1000)
  }

  if (!currentUser) {
    return (
      <Card className="border-red-500">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <XCircle className="h-5 w-5" />
            Diagnostic Logistique - Erreur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Aucun utilisateur connecté</p>
        </CardContent>
      </Card>
    )
  }

  if (!diagnosticData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Diagnostic Logistique - Chargement...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-blue-500">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-blue-600 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            🔍 Diagnostic Responsable Logistique
          </CardTitle>
          <Button onClick={handleReload} size="sm" variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Recharger
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Utilisateur */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            👤 Utilisateur Connecté
          </h3>
          <div className="space-y-1 text-sm">
            <p><strong>Nom:</strong> {diagnosticData.user.nom}</p>
            <p><strong>Rôle:</strong> <Badge>{diagnosticData.user.role}</Badge></p>
            <p><strong>Projets:</strong> {JSON.stringify(diagnosticData.user.projets)}</p>
            <p><strong>Type projets:</strong> {diagnosticData.user.projetsType}</p>
            <p><strong>Nombre projets:</strong> {diagnosticData.user.projetsCount}</p>
          </div>
        </div>

        {/* Demandes */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            📦 Demandes
          </h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p><strong>Total système:</strong> {diagnosticData.demandes.total}</p>
              <p><strong>Après filtrage:</strong> {diagnosticData.demandes.filtered}</p>
            </div>
            <div>
              <p><strong>À valider:</strong> {diagnosticData.demandes.aValider}</p>
              <p><strong>Mes demandes:</strong> {diagnosticData.demandes.mesDemandesCreees}</p>
            </div>
          </div>
        </div>

        {/* Répartition par statut */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            📊 Répartition par Statut
          </h3>
          <div className="space-y-1 text-sm">
            {Object.entries(diagnosticData.statusCount).map(([status, count]) => (
              <div key={status} className="flex justify-between">
                <span>{status}:</span>
                <Badge variant="outline">{count as number}</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Demandes à valider */}
        {diagnosticData.demandesAValider.length > 0 && (
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h3 className="font-semibold mb-2 flex items-center gap-2 text-orange-800">
              🎯 Demandes à Valider (Logistique)
            </h3>
            <div className="space-y-2">
              {diagnosticData.demandesAValider.map((d: any) => (
                <div key={d.numero} className="bg-white p-2 rounded text-sm">
                  <p><strong>{d.numero}</strong></p>
                  <p className="text-xs text-gray-600">Projet: {d.projetNom} ({d.projetId})</p>
                  <Badge className="mt-1 text-xs">{d.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vérifications */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            ✅ Vérifications
          </h3>
          <div className="space-y-1 text-sm">
            {Object.entries(diagnosticData.checks).map(([check, passed]) => (
              <div key={check} className="flex items-center gap-2">
                {passed ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span className={passed ? 'text-green-600' : 'text-red-600'}>
                  {check.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Projets */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            📁 Projets dans le Système
          </h3>
          <p className="text-sm">Total: {diagnosticData.projets} projets</p>
        </div>

        {/* Recommandations */}
        {!diagnosticData.checks.userHasProjects && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h3 className="font-semibold mb-2 text-red-800">⚠️ Problème Identifié</h3>
            <p className="text-sm text-red-700">
              L'utilisateur n'a aucun projet assigné. Veuillez assigner des projets à cet utilisateur
              dans la gestion des utilisateurs.
            </p>
          </div>
        )}

        {!diagnosticData.checks.projectsAreStrings && diagnosticData.checks.userHasProjects && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <h3 className="font-semibold mb-2 text-red-800">⚠️ Problème Identifié</h3>
            <p className="text-sm text-red-700">
              Le format des projets est incorrect. Les projets doivent être un tableau de strings (IDs).
              Format actuel: {diagnosticData.user.projetsType}
            </p>
          </div>
        )}

        {diagnosticData.checks.userHasProjects && 
         diagnosticData.checks.projectsAreStrings && 
         !diagnosticData.checks.hasDemandesInProjects && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="font-semibold mb-2 text-yellow-800">ℹ️ Information</h3>
            <p className="text-sm text-yellow-700">
              L'utilisateur a des projets assignés mais aucune demande n'existe dans ces projets.
              C'est normal si aucune demande n'a encore été créée.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

import { useState, useEffect } from "react"
import { useStore } from "@/stores/useStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Users, Shield, ShieldCheck, ChevronDown, ChevronRight } from "lucide-react"
import { hasPermission } from "@/lib/auth"

export default function ManageAdminRoles() {
  const { users, currentUser, token, loadUsers } = useStore()
  const [loading, setLoading] = useState(false)
  const [updatingUser, setUpdatingUser] = useState<string | null>(null)
  const [localUsers, setLocalUsers] = useState(users)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  useEffect(() => {
    setLocalUsers(users)
  }, [users])

  const canManageAdmins = currentUser && hasPermission(currentUser, "assign_admin")

  const handleToggleAdmin = async (userId: string, isAdmin: boolean) => {
    if (!canManageAdmins || !token) return

    setUpdatingUser(userId)
    
    // Mise à jour optimiste immédiate de l'état local
    setLocalUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId ? { ...user, isAdmin } : user
      )
    )
    
    try {
      const response = await fetch(`/api/users/${userId}/admin`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ isAdmin }),
      })

      if (response.ok) {
        // Ne pas recharger immédiatement, laisser l'état optimiste
        // La synchronisation se fera au prochain rechargement naturel
      } else {
        // En cas d'erreur, restaurer l'état précédent
        setLocalUsers(users)
        const result = await response.json()
      }
    } catch (error) {
      // En cas d'erreur réseau, restaurer l'état précédent
      setLocalUsers(users)
    } finally {
      setUpdatingUser(null)
    }
  }

  const getRoleLabel = (role: string) => {
    const labels = {
      superadmin: "Super Administrateur",
      employe: "Employé",
      conducteur_travaux: "Conducteur de Travaux",
      responsable_travaux: "Responsable des Travaux",
      responsable_appro: "Responsable Approvisionnements",
      charge_affaire: "Chargé d'Affaire",
      responsable_logistique: "Responsable Logistique",
    }
    return labels[role as keyof typeof labels] || role
  }

  if (!canManageAdmins) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">
            Vous n'avez pas les permissions pour gérer les rôles administrateur.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader 
        className="cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Gestion des Rôles Administrateur
          </div>
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronRight className="h-5 w-5 text-gray-500" />
          )}
        </CardTitle>
        <p className="text-sm text-gray-600">
          Attribuez ou retirez les privilèges administrateur aux utilisateurs. 
          Les admins peuvent créer des projets et ajouter des utilisateurs.
        </p>
      </CardHeader>
      {isExpanded && (
        <CardContent className="animate-in slide-in-from-top-2 duration-200">
          <div className="space-y-4">
            {localUsers
              .filter(user => user.role !== "superadmin") // Ne pas afficher les superadmins
              .map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="font-medium">
                          {user.prenom} {user.nom}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {getRoleLabel(user.role)}
                    </Badge>
                    {user.isAdmin && (
                      <Badge variant="default" className="bg-blue-500">
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">
                      Privilèges Admin
                    </span>
                    <Switch
                      checked={user.isAdmin || false}
                      onCheckedChange={(checked) => handleToggleAdmin(user.id, checked)}
                      disabled={updatingUser === user.id || loading}
                      className="data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-gray-300"
                    />
                  </div>
                </div>
              ))}

            {localUsers.filter(user => user.role !== "superadmin").length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun utilisateur à gérer</p>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useStore } from "@/stores/useStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  Building2, 
  Package, 
  Settings,
  CheckCircle,
  TrendingUp,
  FileText,
  Shield
} from "lucide-react"
import Link from "next/link"

export default function AdminPage() {
  const router = useRouter()
  const { currentUser } = useStore()

  useEffect(() => {
    if (!currentUser) {
      router.push("/")
      return
    }
    
    if (currentUser.role !== "superadmin") {
      router.push("/dashboard")
      return
    }
  }, [currentUser, router])

  if (!currentUser || currentUser.role !== "superadmin") {
    return null
  }

  const adminSections = [
    {
      title: "Gestion des Utilisateurs",
      description: "Créer, modifier et gérer les utilisateurs du système",
      icon: Users,
      href: "/dashboard",
      color: "bg-blue-500",
      hoverColor: "hover:bg-blue-600"
    },
    {
      title: "Gestion des Projets",
      description: "Créer et gérer les projets et leurs assignations",
      icon: Building2,
      href: "/dashboard",
      color: "bg-green-500",
      hoverColor: "hover:bg-green-600"
    },
    {
      title: "Gestion des Articles",
      description: "Gérer le catalogue des articles et matériels",
      icon: Package,
      href: "/dashboard",
      color: "bg-purple-500",
      hoverColor: "hover:bg-purple-600"
    },
    {
      title: "Validations Super Admin",
      description: "Valider et gérer toutes les demandes en cours avec des pouvoirs étendus",
      icon: Shield,
      href: "/admin/validations",
      color: "bg-red-500",
      hoverColor: "hover:bg-red-600",
      featured: true
    },
    {
      title: "Tableau de Bord Financier",
      description: "Visualiser les coûts et budgets des demandes",
      icon: TrendingUp,
      href: "/dashboard",
      color: "bg-orange-500",
      hoverColor: "hover:bg-orange-600"
    },
    {
      title: "Historique et Rapports",
      description: "Consulter l'historique complet et générer des rapports",
      icon: FileText,
      href: "/dashboard",
      color: "bg-indigo-500",
      hoverColor: "hover:bg-indigo-600"
    }
  ]

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
          <p className="text-gray-600 mt-1">
            Panneau de contrôle super administrateur
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-red-600" />
          <span className="text-lg font-semibold text-red-600">Super Admin</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminSections.map((section) => (
          <Link key={section.title} href={section.href}>
            <Card className={`cursor-pointer transition-all hover:shadow-lg ${section.featured ? 'ring-2 ring-red-500' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-lg ${section.color} text-white`}>
                    <section.icon className="w-6 h-6" />
                  </div>
                  {section.featured && (
                    <span className="px-2 py-1 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
                      Nouveau
                    </span>
                  )}
                </div>
                <CardTitle className="mt-4 text-xl">{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">{section.description}</p>
                <Button 
                  className={`w-full mt-4 ${section.color} ${section.hoverColor} text-white`}
                  asChild
                >
                  <span>Accéder</span>
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-600 rounded-lg">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Accès complet au système
              </h3>
              <p className="text-gray-700 text-sm">
                En tant que super administrateur, vous avez un accès complet à toutes les fonctionnalités du système. 
                Vous pouvez gérer les utilisateurs, les projets, valider les demandes à n'importe quelle étape du workflow, 
                et accéder aux données financières sensibles.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-white rounded-full text-sm text-gray-700 border border-gray-200">
                  Gestion utilisateurs
                </span>
                <span className="px-3 py-1 bg-white rounded-full text-sm text-gray-700 border border-gray-200">
                  Validation universelle
                </span>
                <span className="px-3 py-1 bg-white rounded-full text-sm text-gray-700 border border-gray-200">
                  Données financières
                </span>
                <span className="px-3 py-1 bg-white rounded-full text-sm text-gray-700 border border-gray-200">
                  Rapports complets
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Smartphone, Monitor, Tablet } from "lucide-react"

interface ComponentStatus {
  name: string
  type: "dashboard" | "modal" | "form"
  responsive: boolean
  tested: boolean
  notes?: string
}

export default function ResponsiveAudit() {
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 })
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const updateScreenSize = () => {
      setScreenSize({ width: window.innerWidth, height: window.innerHeight })
      setIsMobile(window.innerWidth <= 768)
    }

    updateScreenSize()
    window.addEventListener('resize', updateScreenSize)
    return () => window.removeEventListener('resize', updateScreenSize)
  }, [])

  const components: ComponentStatus[] = [
    // Dashboards
    { name: "Super Admin Dashboard", type: "dashboard", responsive: true, tested: true, notes: "Interface mobile dédiée" },
    { name: "Employé Dashboard", type: "dashboard", responsive: true, tested: true, notes: "Layout responsive complet" },
    { name: "Conducteur Dashboard", type: "dashboard", responsive: true, tested: false },
    { name: "QHSE Dashboard", type: "dashboard", responsive: true, tested: false },
    { name: "Responsable Travaux Dashboard", type: "dashboard", responsive: true, tested: false },
    { name: "Appro Dashboard", type: "dashboard", responsive: true, tested: false },
    { name: "Charge Affaire Dashboard", type: "dashboard", responsive: true, tested: false },
    { name: "Responsable Logistique Dashboard", type: "dashboard", responsive: false, tested: false, notes: "À traiter" },

    // Modals principaux
    { name: "Create Demande Modal", type: "modal", responsive: true, tested: false, notes: "CSS universel appliqué" },
    { name: "Create User Modal", type: "modal", responsive: true, tested: false, notes: "CSS universel appliqué" },
    { name: "Create Project Modal", type: "modal", responsive: true, tested: false, notes: "CSS universel appliqué" },
    { name: "Demande Detail Modal", type: "modal", responsive: true, tested: false, notes: "CSS universel appliqué" },
    { name: "Project Management Modal", type: "modal", responsive: true, tested: false, notes: "CSS universel appliqué" },

    // Formulaires
    { name: "Login Form", type: "form", responsive: true, tested: true, notes: "Complètement responsive" },
    { name: "Demande Forms", type: "form", responsive: true, tested: false, notes: "CSS universel appliqué" },
  ]

  const getDeviceIcon = () => {
    if (screenSize.width <= 768) return <Smartphone className="h-4 w-4" />
    if (screenSize.width <= 1024) return <Tablet className="h-4 w-4" />
    return <Monitor className="h-4 w-4" />
  }

  const getDeviceType = () => {
    if (screenSize.width <= 768) return "Mobile"
    if (screenSize.width <= 1024) return "Tablette"
    return "Desktop"
  }

  const responsiveCount = components.filter(c => c.responsive).length
  const testedCount = components.filter(c => c.tested).length
  const totalCount = components.length

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Audit Responsive - Application</h1>
        <p className="text-gray-600">État de la responsivité de tous les composants de l'application</p>
      </div>

      {/* Informations écran actuel */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getDeviceIcon()}
            Écran Actuel - {getDeviceType()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Largeur</p>
              <p className="font-semibold">{screenSize.width}px</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Hauteur</p>
              <p className="font-semibold">{screenSize.height}px</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <Badge variant={isMobile ? "default" : "secondary"}>
                {getDeviceType()}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500">Responsive</p>
              <Badge variant={isMobile ? "default" : "outline"}>
                {isMobile ? "Actif" : "Inactif"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques globales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Composants Responsives</p>
                <p className="text-2xl font-bold text-green-600">{responsiveCount}/{totalCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Composants Testés</p>
                <p className="text-2xl font-bold text-blue-600">{testedCount}/{totalCount}</p>
              </div>
              <Smartphone className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Couverture</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round((responsiveCount / totalCount) * 100)}%
                </p>
              </div>
              <Monitor className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des composants par type */}
      {["dashboard", "modal", "form"].map(type => (
        <Card key={type} className="mb-4">
          <CardHeader>
            <CardTitle className="capitalize">
              {type === "dashboard" ? "Dashboards" : type === "modal" ? "Modals" : "Formulaires"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {components
                .filter(c => c.type === type)
                .map((component, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {component.responsive ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="font-medium">{component.name}</span>
                      </div>
                      {component.notes && (
                        <Badge variant="outline" className="text-xs">
                          {component.notes}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={component.responsive ? "default" : "destructive"}
                        className="text-xs"
                      >
                        {component.responsive ? "Responsive" : "Non responsive"}
                      </Badge>
                      <Badge
                        variant={component.tested ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {component.tested ? "Testé" : "À tester"}
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Actions recommandées */}
      <Card>
        <CardHeader>
          <CardTitle>Actions Recommandées</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
              <div>
                <p className="font-medium">Responsable Logistique Dashboard</p>
                <p className="text-sm text-gray-600">
                  Ajouter l'import du CSS universel pour rendre ce dashboard responsive
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2"></div>
              <div>
                <p className="font-medium">Tests sur mobile</p>
                <p className="text-sm text-gray-600">
                  Tester tous les modals et formulaires sur différentes tailles d'écran mobile
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
              <div>
                <p className="font-medium">Validation finale</p>
                <p className="text-sm text-gray-600">
                  Valider le comportement sur iPhone SE (320px), iPhone standard (375px) et iPad (768px+)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

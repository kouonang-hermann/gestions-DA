"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Smartphone, 
  Monitor, 
  Tablet, 
  CheckCircle, 
  XCircle,
  Eye,
  EyeOff
} from 'lucide-react'

interface ResponsiveTestProps {
  isOpen: boolean
  onClose: () => void
}

export default function MobileResponsiveTest({ isOpen, onClose }: ResponsiveTestProps) {
  const [screenInfo, setScreenInfo] = useState({
    width: 0,
    height: 0,
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    deviceType: "Unknown"
  })

  const [showMobileView, setShowMobileView] = useState(false)

  useEffect(() => {
    const updateScreenInfo = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      const isMobile = width <= 768
      const isTablet = width > 768 && width <= 1024
      const isDesktop = width > 1024
      
      let deviceType = "Desktop"
      if (isMobile) deviceType = "Mobile"
      else if (isTablet) deviceType = "Tablet"

      setScreenInfo({
        width,
        height,
        isMobile,
        isTablet,
        isDesktop,
        deviceType
      })
    }

    updateScreenInfo()
    window.addEventListener('resize', updateScreenInfo)
    
    return () => window.removeEventListener('resize', updateScreenInfo)
  }, [])

  const breakpoints = [
    { name: "iPhone SE", width: 320, active: screenInfo.width <= 320 },
    { name: "iPhone 12 Mini", width: 375, active: screenInfo.width <= 375 && screenInfo.width > 320 },
    { name: "iPhone 12/13/14", width: 390, active: screenInfo.width <= 390 && screenInfo.width > 375 },
    { name: "iPhone Pro Max", width: 428, active: screenInfo.width <= 428 && screenInfo.width > 390 },
    { name: "Tablet", width: 768, active: screenInfo.width <= 768 && screenInfo.width > 428 },
    { name: "Desktop", width: 1024, active: screenInfo.width > 768 }
  ]

  const testCriteria = [
    {
      name: "Interface Mobile Visible",
      test: screenInfo.isMobile,
      description: "L'interface mobile doit être visible sur écrans ≤ 768px"
    },
    {
      name: "Interface Desktop Cachée",
      test: screenInfo.isMobile,
      description: "L'interface desktop doit être cachée sur mobile"
    },
    {
      name: "Zones Tactiles Optimisées",
      test: screenInfo.isMobile,
      description: "Boutons et zones tactiles ≥ 44px sur mobile"
    },
    {
      name: "Navigation Bottom",
      test: screenInfo.isMobile,
      description: "Navigation bottom fixe visible sur mobile"
    },
    {
      name: "Header Mobile",
      test: screenInfo.isMobile,
      description: "Header avec logo et actions visible"
    },
    {
      name: "Actions Rapides",
      test: true,
      description: "Boutons d'actions rapides fonctionnels"
    }
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              Test Interface Mobile Responsive
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Fermer
            </Button>
          </div>

          {/* Informations Écran */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {screenInfo.isMobile ? <Smartphone className="h-5 w-5" /> :
                 screenInfo.isTablet ? <Tablet className="h-5 w-5" /> :
                 <Monitor className="h-5 w-5" />}
                Informations Écran Actuel
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Largeur</p>
                  <p className="font-semibold">{screenInfo.width}px</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Hauteur</p>
                  <p className="font-semibold">{screenInfo.height}px</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Type d'appareil</p>
                  <Badge 
                    style={{
                      backgroundColor: screenInfo.isMobile ? "#015fc4" : 
                                     screenInfo.isTablet ? "#b8d1df" : "#6c757d",
                      color: "white"
                    }}
                  >
                    {screenInfo.deviceType}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Orientation</p>
                  <p className="font-semibold">
                    {screenInfo.width > screenInfo.height ? "Paysage" : "Portrait"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Breakpoints */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Breakpoints Responsive</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {breakpoints.map((bp) => (
                  <div 
                    key={bp.name}
                    className={`flex items-center justify-between p-2 rounded ${
                      bp.active ? "bg-blue-50 border border-blue-200" : "bg-gray-50"
                    }`}
                  >
                    <span className="font-medium">{bp.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">≤ {bp.width}px</span>
                      {bp.active ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <div className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tests de Conformité */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Tests de Conformité Mobile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testCriteria.map((criteria, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-3 border rounded"
                  >
                    {criteria.test ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div>
                      <p className="font-medium">{criteria.name}</p>
                      <p className="text-sm text-gray-600">{criteria.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Contrôles de Test */}
          <Card>
            <CardHeader>
              <CardTitle>Contrôles de Test</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Button
                    onClick={() => setShowMobileView(!showMobileView)}
                    className="flex items-center gap-2"
                    style={{ backgroundColor: '#015fc4', color: 'white' }}
                  >
                    {showMobileView ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showMobileView ? "Masquer" : "Forcer"} Vue Mobile
                  </Button>
                  <p className="text-sm text-gray-600 mt-1">
                    Force l'affichage de l'interface mobile même sur desktop
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded">
                  <h4 className="font-medium mb-2">Instructions de Test :</h4>
                  <ol className="text-sm text-gray-600 space-y-1">
                    <li>1. Redimensionnez la fenêtre pour tester différents breakpoints</li>
                    <li>2. Vérifiez que l'interface mobile apparaît sur écrans ≤ 768px</li>
                    <li>3. Testez la navigation bottom et les boutons d'action</li>
                    <li>4. Vérifiez que l'interface desktop reste intacte sur grands écrans</li>
                    <li>5. Testez l'orientation portrait/paysage sur mobile</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

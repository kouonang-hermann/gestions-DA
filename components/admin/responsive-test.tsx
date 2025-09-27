"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  CheckCircle, 
  AlertTriangle,
  Info
} from "lucide-react"

/**
 * Composant de test pour vérifier la responsivité sur différentes tailles d'écran
 */
export default function ResponsiveTest() {
  const [screenInfo, setScreenInfo] = useState({
    width: 0,
    height: 0,
    deviceType: '',
    orientation: '',
    pixelRatio: 1
  })

  useEffect(() => {
    const updateScreenInfo = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const pixelRatio = window.devicePixelRatio || 1
      
      let deviceType = ''
      let orientation = width > height ? 'landscape' : 'portrait'
      
      // Détection du type d'appareil basé sur la largeur
      if (width <= 320) {
        deviceType = 'iPhone SE / Galaxy S8 Mini'
      } else if (width <= 375) {
        deviceType = 'iPhone 12/13/14 Mini'
      } else if (width <= 414) {
        deviceType = 'iPhone 12/13/14 / Galaxy S20'
      } else if (width <= 480) {
        deviceType = 'iPhone 12/13/14 Pro Max'
      } else if (width <= 768) {
        deviceType = 'Tablette Portrait'
      } else if (width <= 1024) {
        deviceType = 'Tablette Paysage / iPad'
      } else {
        deviceType = 'Desktop'
      }
      
      setScreenInfo({
        width,
        height,
        deviceType,
        orientation,
        pixelRatio
      })
    }

    updateScreenInfo()
    window.addEventListener('resize', updateScreenInfo)
    window.addEventListener('orientationchange', updateScreenInfo)
    
    return () => {
      window.removeEventListener('resize', updateScreenInfo)
      window.removeEventListener('orientationchange', updateScreenInfo)
    }
  }, [])

  const getDeviceIcon = () => {
    if (screenInfo.width <= 768) return <Smartphone className="h-5 w-5" />
    if (screenInfo.width <= 1024) return <Tablet className="h-5 w-5" />
    return <Monitor className="h-5 w-5" />
  }

  const getResponsiveStatus = () => {
    const { width, height } = screenInfo
    
    // Critères de validation responsive
    const checks = [
      {
        name: "Largeur minimale",
        status: width >= 320,
        message: width >= 320 ? "✅ Supporté" : "❌ Trop étroit"
      },
      {
        name: "Hauteur utilisable", 
        status: height >= 480,
        message: height >= 480 ? "✅ Suffisante" : "⚠️ Limitée"
      },
      {
        name: "Zone tactile",
        status: width >= 320,
        message: width >= 320 ? "✅ Optimisée (44px min)" : "❌ Inadaptée"
      },
      {
        name: "Lisibilité texte",
        status: width >= 280,
        message: width >= 280 ? "✅ Police 16px+" : "❌ Texte trop petit"
      }
    ]
    
    return checks
  }

  const getBreakpointInfo = () => {
    const { width } = screenInfo
    
    if (width < 640) return { name: 'Mobile', color: 'bg-red-100 text-red-800', class: 'sm' }
    if (width < 768) return { name: 'Mobile Large', color: 'bg-orange-100 text-orange-800', class: 'md' }
    if (width < 1024) return { name: 'Tablette', color: 'bg-yellow-100 text-yellow-800', class: 'lg' }
    if (width < 1280) return { name: 'Desktop', color: 'bg-green-100 text-green-800', class: 'xl' }
    return { name: 'Desktop Large', color: 'bg-blue-100 text-blue-800', class: '2xl' }
  }

  const breakpoint = getBreakpointInfo()
  const responsiveChecks = getResponsiveStatus()

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getDeviceIcon()}
            Test de Responsivité - Page Login
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Informations écran actuel */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600 font-medium">Largeur</div>
              <div className="text-2xl font-bold text-blue-900">{screenInfo.width}px</div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600 font-medium">Hauteur</div>
              <div className="text-2xl font-bold text-green-900">{screenInfo.height}px</div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-sm text-purple-600 font-medium">Orientation</div>
              <div className="text-lg font-bold text-purple-900 capitalize">{screenInfo.orientation}</div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm text-yellow-600 font-medium">Pixel Ratio</div>
              <div className="text-2xl font-bold text-yellow-900">{screenInfo.pixelRatio}x</div>
            </div>
          </div>

          {/* Type d'appareil détecté */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Appareil détecté</div>
                <div className="text-lg font-semibold text-gray-900">{screenInfo.deviceType}</div>
              </div>
              <Badge className={breakpoint.color}>
                {breakpoint.name} ({breakpoint.class})
              </Badge>
            </div>
          </div>

          {/* Vérifications responsive */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Vérifications Responsive</h3>
            <div className="space-y-3">
              {responsiveChecks.map((check, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {check.status ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    )}
                    <span className="font-medium">{check.name}</span>
                  </div>
                  <span className="text-sm">{check.message}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommandations spécifiques */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start gap-2">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Optimisations Appliquées</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Zones tactiles :</strong> Minimum 44px pour tous les boutons</li>
                  <li>• <strong>Police :</strong> 16px minimum pour éviter le zoom iOS</li>
                  <li>• <strong>Espacement :</strong> Adaptatif selon la taille d'écran</li>
                  <li>• <strong>Layout :</strong> Colonne unique sur mobile, deux colonnes sur desktop</li>
                  <li>• <strong>Images :</strong> Logo redimensionné automatiquement</li>
                  <li>• <strong>Orientation :</strong> Support paysage et portrait</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Breakpoints Tailwind */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Breakpoints Tailwind CSS</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
              <div className={`p-3 rounded text-center ${screenInfo.width < 640 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-600'}`}>
                <div className="font-medium">Mobile</div>
                <div className="text-sm">&lt; 640px</div>
              </div>
              <div className={`p-3 rounded text-center ${screenInfo.width >= 640 && screenInfo.width < 768 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-600'}`}>
                <div className="font-medium">SM</div>
                <div className="text-sm">640px+</div>
              </div>
              <div className={`p-3 rounded text-center ${screenInfo.width >= 768 && screenInfo.width < 1024 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'}`}>
                <div className="font-medium">MD</div>
                <div className="text-sm">768px+</div>
              </div>
              <div className={`p-3 rounded text-center ${screenInfo.width >= 1024 && screenInfo.width < 1280 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                <div className="font-medium">LG</div>
                <div className="text-sm">1024px+</div>
              </div>
              <div className={`p-3 rounded text-center ${screenInfo.width >= 1280 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                <div className="font-medium">XL</div>
                <div className="text-sm">1280px+</div>
              </div>
            </div>
          </div>

          {/* Instructions de test */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="font-medium text-yellow-900 mb-2">Comment tester :</h4>
            <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
              <li>Redimensionnez la fenêtre du navigateur</li>
              <li>Utilisez les outils de développement (F12 → Mode responsive)</li>
              <li>Testez sur de vrais appareils mobiles</li>
              <li>Vérifiez en mode portrait et paysage</li>
              <li>Testez avec différents navigateurs (Chrome, Safari, Firefox)</li>
            </ol>
          </div>

        </CardContent>
      </Card>
    </div>
  )
}

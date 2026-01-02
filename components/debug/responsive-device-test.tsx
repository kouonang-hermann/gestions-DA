"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Smartphone, Tablet, Monitor, RotateCw } from "lucide-react"

export default function ResponsiveDeviceTest() {
  const [deviceInfo, setDeviceInfo] = useState({
    width: 0,
    height: 0,
    orientation: "portrait",
    deviceType: "unknown",
    deviceName: "Unknown",
    pixelRatio: 1
  })

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const orientation = width > height ? "landscape" : "portrait"
      const pixelRatio = window.devicePixelRatio || 1
      
      let deviceType = "desktop"
      let deviceName = "Desktop"
      
      // Détection du type d'appareil
      if (width <= 320) {
        deviceType = "small-phone"
        deviceName = "Petit téléphone (iPhone SE, iTel, Pop)"
      } else if (width <= 375) {
        deviceType = "medium-phone"
        deviceName = "Téléphone moyen (iPhone 6/7/8, Techno)"
      } else if (width <= 414) {
        deviceType = "standard-phone"
        deviceName = "Téléphone standard (iPhone X/11, Pixel)"
      } else if (width <= 430) {
        deviceType = "large-phone"
        deviceName = "Téléphone large (iPhone 12/13/14)"
      } else if (width <= 480) {
        deviceType = "xlarge-phone"
        deviceName = "Très grand téléphone (iPhone Pro Max, Pixel XL)"
      } else if (width <= 768) {
        deviceType = "tablet"
        deviceName = "Tablette"
      } else if (width <= 1024) {
        deviceType = "small-desktop"
        deviceName = "Petit écran desktop"
      } else {
        deviceType = "desktop"
        deviceName = "Desktop"
      }
      
      setDeviceInfo({
        width,
        height,
        orientation,
        deviceType,
        deviceName,
        pixelRatio
      })
    }
    
    updateDeviceInfo()
    window.addEventListener("resize", updateDeviceInfo)
    window.addEventListener("orientationchange", updateDeviceInfo)
    
    return () => {
      window.removeEventListener("resize", updateDeviceInfo)
      window.removeEventListener("orientationchange", updateDeviceInfo)
    }
  }, [])

  const getDeviceIcon = () => {
    if (deviceInfo.deviceType.includes("phone")) {
      return <Smartphone className="h-8 w-8 text-blue-600" />
    } else if (deviceInfo.deviceType === "tablet") {
      return <Tablet className="h-8 w-8 text-green-600" />
    } else {
      return <Monitor className="h-8 w-8 text-purple-600" />
    }
  }

  const getDeviceColor = () => {
    if (deviceInfo.deviceType.includes("phone")) return "bg-blue-100 text-blue-800"
    if (deviceInfo.deviceType === "tablet") return "bg-green-100 text-green-800"
    return "bg-purple-100 text-purple-800"
  }

  const getOrientationColor = () => {
    return deviceInfo.orientation === "portrait" 
      ? "bg-orange-100 text-orange-800" 
      : "bg-teal-100 text-teal-800"
  }

  const testCases = [
    { name: "iPhone SE", width: 320, height: 568 },
    { name: "iPhone 6/7/8", width: 375, height: 667 },
    { name: "iPhone X/11", width: 414, height: 896 },
    { name: "iPhone 12/13/14", width: 390, height: 844 },
    { name: "iPhone 14 Pro Max", width: 430, height: 932 },
    { name: "Google Pixel", width: 412, height: 915 },
    { name: "iTel/Techno", width: 360, height: 640 },
    { name: "Pop", width: 320, height: 480 },
  ]

  return (
    <Card className="border-2 border-blue-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          {getDeviceIcon()}
          Test de Responsivité Mobile
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informations actuelles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Appareil Détecté</h3>
            <Badge className={getDeviceColor()}>
              {deviceInfo.deviceName}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Orientation</h3>
            <Badge className={getOrientationColor()}>
              <RotateCw className="h-3 w-3 mr-1" />
              {deviceInfo.orientation === "portrait" ? "Portrait" : "Paysage"}
            </Badge>
          </div>
        </div>

        {/* Dimensions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-xs text-gray-600">Largeur</div>
            <div className="text-lg font-bold text-blue-600">{deviceInfo.width}px</div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-xs text-gray-600">Hauteur</div>
            <div className="text-lg font-bold text-green-600">{deviceInfo.height}px</div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-xs text-gray-600">Ratio</div>
            <div className="text-lg font-bold text-purple-600">{deviceInfo.pixelRatio}x</div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-xs text-gray-600">Type</div>
            <div className="text-sm font-bold text-orange-600 truncate">
              {deviceInfo.deviceType}
            </div>
          </div>
        </div>

        {/* Tests de compatibilité */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Compatibilité Testée</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {testCases.map((device) => {
              const isCompatible = deviceInfo.width >= device.width - 20 && 
                                  deviceInfo.width <= device.width + 20
              return (
                <div 
                  key={device.name}
                  className={`p-2 rounded border text-sm ${
                    isCompatible 
                      ? "bg-green-50 border-green-300 text-green-800" 
                      : "bg-gray-50 border-gray-200 text-gray-600"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{device.name}</span>
                    <span className="text-xs">
                      {device.width}×{device.height}
                    </span>
                  </div>
                  {isCompatible && (
                    <div className="text-xs mt-1">✓ Optimisé pour cet appareil</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Vérifications CSS */}
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Vérifications CSS Responsive</h3>
          <div className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <span className={deviceInfo.width <= 768 ? "text-green-600" : "text-gray-400"}>
                {deviceInfo.width <= 768 ? "✓" : "○"}
              </span>
              <span>Règles mobile activées (≤768px)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={deviceInfo.width <= 375 ? "text-green-600" : "text-gray-400"}>
                {deviceInfo.width <= 375 ? "✓" : "○"}
              </span>
              <span>Optimisations petits écrans (≤375px)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={deviceInfo.orientation === "landscape" ? "text-green-600" : "text-gray-400"}>
                {deviceInfo.orientation === "landscape" ? "✓" : "○"}
              </span>
              <span>Mode paysage détecté</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={deviceInfo.pixelRatio >= 2 ? "text-green-600" : "text-gray-400"}>
                {deviceInfo.pixelRatio >= 2 ? "✓" : "○"}
              </span>
              <span>Écran haute résolution (Retina)</span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-sm text-blue-900 mb-2">
            📱 Comment tester
          </h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Ouvrez les DevTools (F12)</li>
            <li>• Activez le mode responsive (Ctrl+Shift+M)</li>
            <li>• Testez différentes tailles d'écran</li>
            <li>• Faites pivoter l'appareil (icône rotation)</li>
            <li>• Vérifiez que tous les éléments s'adaptent</li>
          </ul>
        </div>

        <Button 
          onClick={() => window.location.reload()} 
          className="w-full"
          variant="outline"
        >
          <RotateCw className="h-4 w-4 mr-2" />
          Rafraîchir le test
        </Button>
      </CardContent>
    </Card>
  )
}

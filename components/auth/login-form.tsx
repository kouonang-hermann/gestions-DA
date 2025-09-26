"use client"
import { useState } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useStore } from "@/stores/useStore"
import { Loader2 } from "lucide-react"
import InstrumElecLogo from "@/components/ui/instrumelec-logo"

export default function LoginForm() {
  const { login, isLoading, error } = useStore()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [validationError, setValidationError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError("")

    if (!email || !password) {
      setValidationError("Tous les champs sont requis")
      return
    }

    if (!email.includes("@")) {
      setValidationError("Email invalide")
      return
    }

    await login(email, password)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat relative" 
         style={{
           backgroundImage: "url('/technical-equipment-bg.jpg')",
           backgroundSize: 'cover',
           backgroundPosition: 'center',
           backgroundRepeat: 'no-repeat'
         }}>
      {/* Overlay pour améliorer la lisibilité */}
      <div className="absolute inset-0 bg-black bg-opacity-30"></div>
      
      {/* Container principal centré avec fond blanc */}
      <div className="relative z-10 w-full max-w-lg mx-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 backdrop-blur-sm">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <InstrumElecLogo size="md" />
          </div>
          
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Adresse email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="votre.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Mot de passe
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {(error || validationError) && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                  {error || validationError}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-medium"
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Se connecter
              </Button>
            </form>

          {/* Comptes de test 
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-blue-900 text-sm flex items-center">
                🧪 Comptes de test disponibles
              </h3>
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                Cliquez pour copier
              </span>
            </div>
            
            <div className="grid gap-2 text-xs">
              {[
                { role: "SuperAdmin", email: "admin@test.com", password: "admin123", color: "bg-red-100 text-red-800 border-red-200" },
                { role: "Employé", email: "employe@test.com", password: "employe123", color: "bg-green-100 text-green-800 border-green-200" },
                { role: "Responsable Travaux", email: "responsable-travaux@test.com", password: "responsable123", color: "bg-purple-100 text-purple-800 border-purple-200" },
                { role: "Conducteur", email: "conducteur@test.com", password: "conducteur123", color: "bg-orange-100 text-orange-800 border-orange-200" },
                { role: "QHSE", email: "qhse@test.com", password: "qhse123", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
                { role: "Appro", email: "appro@test.com", password: "appro123", color: "bg-teal-100 text-teal-800 border-teal-200" },
                { role: "Chargé Affaire", email: "charge@test.com", password: "charge123", color: "bg-pink-100 text-pink-800 border-pink-200" },
                { role: "Logistique", email: "logistique@test.com", password: "logistique123", color: "bg-cyan-100 text-cyan-800 border-cyan-200" }
              ].map((account, index) => (
                <div 
                  key={index}
                  className={`p-2 rounded-md border cursor-pointer hover:shadow-sm transition-all ${account.color}`}
                  onClick={() => {
                    setEmail(account.email)
                    setPassword(account.password)
                  }}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{account.role}</span>
                    <span className="text-xs opacity-75">👆 Cliquer</span>
                  </div>
                  <div className="text-xs mt-1 opacity-90">
                    {account.email} / {account.password}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-3 pt-2 border-t border-blue-200 text-center">
              <p className="text-xs text-blue-600">
                💡 <strong>Astuce:</strong> Cliquez sur un compte pour remplir automatiquement les champs
              </p>
            </div>
          </div>*/}
        </div>
      </div>
    </div>
  )
}

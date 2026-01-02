"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useStore } from "@/stores/useStore"
import { 
  DollarSign, 
  TrendingUp, 
  BarChart3, 
  FileText, 
  Download,
  Search,
  Package,
  Wrench,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts"

interface FinancialDashboardProps {
  onClose?: () => void
}

export default function FinancialDashboard({ onClose }: FinancialDashboardProps) {
  const { currentUser, demandes, projets } = useStore()
  const [selectedProjet, setSelectedProjet] = useState<string>("all")
  const [dateRange, setDateRange] = useState<"all" | "month" | "quarter" | "year">("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedDemande, setExpandedDemande] = useState<string | null>(null)

  // Vérifier que l'utilisateur est superadmin
  if (currentUser?.role !== "superadmin") {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-semibold">Accès refusé</p>
            <p className="text-sm">Seul le Super Admin peut accéder aux données financières.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Filtrer les demandes avec coût total
  const demandesAvecCout = useMemo(() => {
    let filtered = demandes.filter(d => d.coutTotal !== undefined && d.coutTotal !== null && d.coutTotal > 0)
    
    // Filtre par projet
    if (selectedProjet !== "all") {
      filtered = filtered.filter(d => d.projetId === selectedProjet)
    }

    // Filtre par date
    if (dateRange !== "all") {
      const now = new Date()
      const startDate = new Date()
      
      switch (dateRange) {
        case "month":
          startDate.setMonth(now.getMonth() - 1)
          break
        case "quarter":
          startDate.setMonth(now.getMonth() - 3)
          break
        case "year":
          startDate.setFullYear(now.getFullYear() - 1)
          break
      }
      
      filtered = filtered.filter(d => new Date(d.dateCreation) >= startDate)
    }

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(d => 
        d.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.projet?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.technicien?.nom.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    return filtered
  }, [demandes, selectedProjet, dateRange, searchTerm])

  // Calculs statistiques
  const stats = useMemo(() => {
    const totalCout = demandesAvecCout.reduce((sum, d) => sum + (d.coutTotal || 0), 0)
    const coutMateriel = demandesAvecCout
      .filter(d => d.type === "materiel")
      .reduce((sum, d) => sum + (d.coutTotal || 0), 0)
    const coutOutillage = demandesAvecCout
      .filter(d => d.type === "outillage")
      .reduce((sum, d) => sum + (d.coutTotal || 0), 0)
    const moyenneCout = demandesAvecCout.length > 0 ? totalCout / demandesAvecCout.length : 0

    return {
      totalCout,
      coutMateriel,
      coutOutillage,
      moyenneCout,
      nombreDemandes: demandesAvecCout.length
    }
  }, [demandesAvecCout])

  // Données pour le graphique par projet
  const dataParProjet = useMemo(() => {
    const parProjet: { [key: string]: { nom: string, cout: number, count: number } } = {}
    
    demandesAvecCout.forEach(d => {
      const projetNom = d.projet?.nom || "Non défini"
      if (!parProjet[projetNom]) {
        parProjet[projetNom] = { nom: projetNom, cout: 0, count: 0 }
      }
      parProjet[projetNom].cout += d.coutTotal || 0
      parProjet[projetNom].count += 1
    })

    return Object.values(parProjet).sort((a, b) => b.cout - a.cout)
  }, [demandesAvecCout])

  // Données pour le graphique par type
  const dataParType = useMemo(() => {
    return [
      { name: "Matériel", value: stats.coutMateriel, color: "#015fc4" },
      { name: "Outillage", value: stats.coutOutillage, color: "#7c3aed" }
    ].filter(d => d.value > 0)
  }, [stats])

  // Formatter les prix
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price) + " FCFA"
  }

  // Exporter les données en CSV
  const exportCSV = () => {
    const headers = ["Numéro", "Type", "Projet", "Demandeur", "Date", "Coût Total (FCFA)"]
    const rows = demandesAvecCout.map(d => [
      d.numero,
      d.type === "materiel" ? "Matériel" : "Outillage",
      d.projet?.nom || "N/A",
      `${d.technicien?.prenom || ""} ${d.technicien?.nom || ""}`,
      new Date(d.dateCreation).toLocaleDateString('fr-FR'),
      d.coutTotal?.toString() || "0"
    ])

    const csvContent = [headers, ...rows].map(row => row.join(";")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `rapport-financier-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-green-600" />
            Tableau de Bord Financier
          </h2>
          <p className="text-xs sm:text-sm text-gray-600">
            Vue d'ensemble des coûts des demandes
          </p>
        </div>
        <Button onClick={exportCSV} variant="outline" size="sm" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Exporter</span> CSV
        </Button>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-sm"
              />
            </div>

            {/* Filtre par projet */}
            <select
              value={selectedProjet}
              onChange={(e) => setSelectedProjet(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">Tous les projets</option>
              {projets.map(projet => (
                <option key={projet.id} value={projet.id}>{projet.nom}</option>
              ))}
            </select>

            {/* Filtre par période */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as "all" | "month" | "quarter" | "year")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="all">Toutes périodes</option>
              <option value="month">Dernier mois</option>
              <option value="quarter">Dernier trimestre</option>
              <option value="year">Dernière année</option>
            </select>

            {/* Compteur */}
            <div className="flex items-center justify-center bg-gray-100 rounded-md px-4 py-2">
              <span className="text-sm text-gray-600">
                <strong>{demandesAvecCout.length}</strong> demande(s)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4 p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-green-700">Coût Total</p>
                <p className="text-lg sm:text-2xl font-bold text-green-800">{formatPrice(stats.totalCout)}</p>
              </div>
              <DollarSign className="h-8 w-8 sm:h-10 sm:w-10 text-green-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4 p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-blue-700">Matériel</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-800">{formatPrice(stats.coutMateriel)}</p>
              </div>
              <Package className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="pt-4 p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-purple-700">Outillage</p>
                <p className="text-lg sm:text-2xl font-bold text-purple-800">{formatPrice(stats.coutOutillage)}</p>
              </div>
              <Wrench className="h-8 w-8 sm:h-10 sm:w-10 text-purple-600 opacity-50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="pt-4 p-3 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-amber-700">Moyenne</p>
                <p className="text-lg sm:text-2xl font-bold text-amber-800">{formatPrice(stats.moyenneCout)}</p>
              </div>
              <TrendingUp className="h-8 w-8 sm:h-10 sm:w-10 text-amber-600 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Graphique par projet */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Coûts par Projet
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dataParProjet.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dataParProjet.slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="nom" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip 
                    formatter={(value: number) => [formatPrice(value), "Coût"]}
                    labelFormatter={(label) => `Projet: ${label}`}
                  />
                  <Bar dataKey="cout" fill="#015fc4" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">
                Aucune donnée disponible
              </div>
            )}
          </CardContent>
        </Card>

        {/* Graphique par type */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Répartition par Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dataParType.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={dataParType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dataParType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatPrice(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[250px] text-gray-400 text-sm">
                Aucune donnée disponible
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Liste des demandes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Détail des Demandes Chiffrées
          </CardTitle>
        </CardHeader>
        <CardContent>
          {demandesAvecCout.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-sm">Aucune demande chiffrée trouvée</p>
              <p className="text-xs text-gray-400 mt-1">Les prix seront visibles une fois renseignés par l'Appro</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {demandesAvecCout.map((demande) => (
                <div key={demande.id} className="border rounded-lg overflow-hidden">
                  {/* En-tête de la demande */}
                  <div 
                    className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                    onClick={() => setExpandedDemande(expandedDemande === demande.id ? null : demande.id)}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {expandedDemande === demande.id ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                      <span className="font-medium text-sm">{demande.numero}</span>
                      <Badge variant="outline" className="text-xs">
                        {demande.type === "materiel" ? "Matériel" : "Outillage"}
                      </Badge>
                      <span className="text-xs text-gray-500 hidden sm:inline">
                        {demande.projet?.nom}
                      </span>
                    </div>
                    <span className="font-bold text-green-700 text-sm">
                      {formatPrice(demande.coutTotal || 0)}
                    </span>
                  </div>

                  {/* Détails expandables */}
                  {expandedDemande === demande.id && (
                    <div className="p-3 bg-white border-t">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-3">
                        <div>
                          <span className="text-gray-500">Projet:</span>
                          <p className="font-medium">{demande.projet?.nom || "N/A"}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Demandeur:</span>
                          <p className="font-medium">{demande.technicien?.prenom} {demande.technicien?.nom}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Date:</span>
                          <p className="font-medium">{new Date(demande.dateCreation).toLocaleDateString('fr-FR')}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Articles:</span>
                          <p className="font-medium">{demande.items.length}</p>
                        </div>
                      </div>

                      {/* Détail des articles */}
                      <div className="border rounded overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="p-2 text-left">Article</th>
                              <th className="p-2 text-center">Qté</th>
                              <th className="p-2 text-right">Prix unit.</th>
                              <th className="p-2 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {demande.items.map((item) => {
                              const quantite = item.quantiteValidee || item.quantiteDemandee
                              const sousTotal = (item.prixUnitaire || 0) * quantite
                              return (
                                <tr key={item.id} className="border-t">
                                  <td className="p-2">{item.article?.nom || "N/A"}</td>
                                  <td className="p-2 text-center">{quantite}</td>
                                  <td className="p-2 text-right">{item.prixUnitaire ? formatPrice(item.prixUnitaire) : "-"}</td>
                                  <td className="p-2 text-right font-medium">{sousTotal > 0 ? formatPrice(sousTotal) : "-"}</td>
                                </tr>
                              )
                            })}
                          </tbody>
                          <tfoot className="bg-green-50">
                            <tr>
                              <td colSpan={3} className="p-2 text-right font-semibold">Total:</td>
                              <td className="p-2 text-right font-bold text-green-700">
                                {formatPrice(demande.coutTotal || 0)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

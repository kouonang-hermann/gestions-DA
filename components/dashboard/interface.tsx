"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import {
  Users,
  FolderOpen,
  FileText,
  Clock,
  Plus,
  BarChart3,
  TrendingUp,
  Settings,
  CreditCard,
  Wrench,
  Package,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts"

// Données d'exemple pour les graphiques
const materialFlowData = [
  { name: "Jan", value: 120 },
  { name: "Fév", value: 150 },
  { name: "Mar", value: 180 },
  { name: "Avr", value: 140 },
  { name: "Mai", value: 200 },
  { name: "Jun", value: 170 },
]

const toolingFlowData = [
  { name: "Jan", value: 80 },
  { name: "Fév", value: 95 },
  { name: "Mar", value: 110 },
  { name: "Avr", value: 85 },
  { name: "Mai", value: 130 },
  { name: "Jun", value: 115 },
]

const pieData = [
  { name: "Matériel", value: 60, color: "#015fc4" },
  { name: "Outillage", value: 40, color: "#b8d1df" },
]

const allUsers = [
  {
    id: 1,
    name: "Hermann KOUONANG FIPA",
    email: "kouonanghermann08@gmail.com",
    role: "Employé",
    initials: "HK",
    hasAdmin: true,
  },
  {
    id: 2,
    name: "Patrick NEMBOU",
    email: "pnembou@instrumelec.com",
    role: "Conducteur de Travaux",
    initials: "PN",
    hasAdmin: true,
  },
  {
    id: 3,
    name: "Test Responsable Travaux",
    email: "responsable-travaux@test.com",
    role: "Responsable des Travaux",
    initials: "TR",
    hasAdmin: true,
  },
  {
    id: 4,
    name: "Jean Dupont",
    email: "jean.dupont@example.com",
    role: "Technicien",
    initials: "JD",
    hasAdmin: false,
  },
  {
    id: 5,
    name: "Marie Leblanc",
    email: "marie.leblanc@example.com",
    role: "Ingénieur",
    initials: "ML",
    hasAdmin: false,
  },
  {
    id: 6,
    name: "Pierre Martin",
    email: "pierre.martin@example.com",
    role: "Chef de Projet",
    initials: "PM",
    hasAdmin: true,
  },
  {
    id: 7,
    name: "Sophie Durand",
    email: "sophie.durand@example.com",
    role: "Employé",
    initials: "SD",
    hasAdmin: false,
  },
  {
    id: 8,
    name: "Michel Bernard",
    email: "michel.bernard@example.com",
    role: "Superviseur",
    initials: "MB",
    hasAdmin: true,
  },
  {
    id: 9,
    name: "Claire Moreau",
    email: "claire.moreau@example.com",
    role: "Technicien",
    initials: "CM",
    hasAdmin: false,
  },
  {
    id: 10,
    name: "Antoine Rousseau",
    email: "antoine.rousseau@example.com",
    role: "Ingénieur",
    initials: "AR",
    hasAdmin: false,
  },
]

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case "Responsable des Travaux":
      return "bg-red-100 text-red-800 border-red-200"
    case "Chef de Projet":
      return "bg-purple-100 text-purple-800 border-purple-200"
    case "Conducteur de Travaux":
      return "bg-blue-100 text-blue-800 border-blue-200"
    case "Superviseur":
      return "bg-orange-100 text-orange-800 border-orange-200"
    case "Ingénieur":
      return "bg-green-100 text-green-800 border-green-200"
    case "Technicien":
      return "bg-yellow-100 text-yellow-800 border-yellow-200"
    case "Employé":
    default:
      return "bg-gray-100 text-gray-800 border-gray-200"
  }
}

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [activeChart, setActiveChart] = useState<"material" | "tooling">("material")
  const itemsPerPage = 7

  const filteredUsers = allUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage)

  const handlePieClick = (data: any) => {
    if (data.name === "Matériel") {
      setActiveChart("material")
    } else if (data.name === "Outillage") {
      setActiveChart("tooling")
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="max-w-full mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Tableau de Bord Administrateur</h1>

        {/* Layout principal : deux colonnes */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Colonne de gauche (large) - 3/4 de la largeur */}
          <div className="lg:col-span-3 space-y-4">
            {/* Vue d'ensemble - Cards statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-l-4 border-l-primary">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Utilisateurs</CardTitle>
                  <Users className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">1,234</div>
                  <p className="text-xs text-muted-foreground">+12% ce mois</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-secondary">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Projets</CardTitle>
                  <FolderOpen className="h-4 w-4 text-secondary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">89</div>
                  <p className="text-xs text-muted-foreground">+5 nouveaux</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-destructive">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Demandes</CardTitle>
                  <FileText className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-destructive">456</div>
                  <p className="text-xs text-muted-foreground">+23 aujourd'hui</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">En Cours</CardTitle>
                  <Clock className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-500">78</div>
                  <p className="text-xs text-muted-foreground">En traitement</p>
                </CardContent>
              </Card>
            </div>

            {/* Gestion des Rôles Administrateur */}
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Gestion des Rôles Administrateur
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher un utilisateur..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setCurrentPage(1)
                    }}
                    className="pl-10"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-96 overflow-y-auto border rounded-lg">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left p-3 font-medium text-sm text-gray-600">Utilisateur</th>
                        <th className="text-left p-3 font-medium text-sm text-gray-600">Rôle</th>
                        <th className="text-right p-3 font-medium text-sm text-gray-600">Privilèges Admin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedUsers.map((user) => (
                        <tr key={user.id} className="border-t">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarFallback className="bg-primary text-primary-foreground">
                                  {user.initials}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{user.name}</p>
                                <p className="text-xs text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge className={`text-xs ${getRoleBadgeColor(user.role)}`} variant="outline">
                              {user.role}
                            </Badge>
                          </td>
                          <td className="p-3 text-right">
                            <Switch defaultChecked={user.hasAdmin} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Affichage de {startIndex + 1} à {Math.min(startIndex + itemsPerPage, filteredUsers.length)} sur{" "}
                    {filteredUsers.length} utilisateurs
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} sur {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Colonne de droite (fine) - 1/4 de la largeur */}
          <div className="lg:col-span-1 space-y-4">
            {/* Liste des actions utilisateur */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions Rapides</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button className="justify-start bg-primary hover:bg-primary/90" size="sm">
                    <Package className="h-4 w-4 mr-1" />
                    <span className="text-xs">DA-Matériel</span>
                  </Button>
                  <Button
                    className="justify-start bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                    size="sm"
                  >
                    <Wrench className="h-4 w-4 mr-1" />
                    <span className="text-xs">DA-Outillage</span>
                  </Button>
                  <Button className="justify-start bg-transparent" variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    <span className="text-xs">Nouveau Projet</span>
                  </Button>
                  <Button className="justify-start bg-transparent" variant="outline" size="sm">
                    <Users className="h-4 w-4 mr-1" />
                    <span className="text-xs">Nouvel Utilisateur</span>
                  </Button>
                  <Button className="justify-start bg-transparent" variant="outline" size="sm">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    <span className="text-xs">Rapport</span>
                  </Button>
                  <Button
                    className="justify-start bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    size="sm"
                  >
                    <CreditCard className="h-4 w-4 mr-1" />
                    <span className="text-xs">DA-Paiement</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Répartition</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={120}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      dataKey="value"
                      onClick={handlePieClick}
                      style={{ cursor: "pointer" }}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1">
                  <div
                    className={`flex items-center justify-between text-sm cursor-pointer p-1 rounded ${
                      activeChart === "material" ? "bg-blue-50" : ""
                    }`}
                    onClick={() => setActiveChart("material")}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary"></div>
                      <span>Matériel</span>
                    </div>
                    <span className="font-medium">60%</span>
                  </div>
                  <div
                    className={`flex items-center justify-between text-sm cursor-pointer p-1 rounded ${
                      activeChart === "tooling" ? "bg-blue-50" : ""
                    }`}
                    onClick={() => setActiveChart("tooling")}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-secondary"></div>
                      <span>Outillage</span>
                    </div>
                    <span className="font-medium">40%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {activeChart === "material" ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Flux Demandes Matériel
                    </>
                  ) : (
                    <>
                      <BarChart3 className="h-4 w-4 text-secondary" />
                      Flux Demandes Outillage
                    </>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={150}>
                  {activeChart === "material" ? (
                    <LineChart data={materialFlowData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Line type="monotone" dataKey="value" stroke="#015fc4" strokeWidth={2} />
                    </LineChart>
                  ) : (
                    <BarChart data={toolingFlowData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#b8d1df" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

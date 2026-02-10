"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Download, 
  Loader2, 
  AlertTriangle, 
  Package, 
  FolderOpen,
  Clock,
  DollarSign,
  FileSpreadsheet,
  TrendingDown
} from "lucide-react"
import * as XLSX from "xlsx"

interface AnalyticsModalProps {
  isOpen: boolean
  onClose: () => void
}

interface ProjetBloque {
  projetId: string
  projetNom: string
  nombreArticlesRestants: number
  quantiteTotaleRestante: number
  coutTotalRestant: number
}

interface ArticleRestant {
  projetId: string
  projetNom: string
  demandeId: string
  demandeNumero: string
  demandeType: string
  articleId: string
  articleReference: string | null
  articleDesignation: string
  articleUnite: string
  quantiteDemandee: number
  quantiteLivree: number
  quantiteRestante: number
  prixUnitaire: number | null
  coutRestant: number
}

interface ArticleNonValorise {
  projetId: string
  projetNom: string
  type: string
  nombreArticlesNonValorises: number
  joursMaxSansValorisation: number
  demandesImpactees: string[]
}

export default function AnalyticsModal({ isOpen, onClose }: AnalyticsModalProps) {
  const [activeTab, setActiveTab] = useState("projets-bloques")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Données des 3 tableaux
  const [projetsBloques, setProjetsBloques] = useState<ProjetBloque[]>([])
  const [totauxProjets, setTotauxProjets] = useState<any>(null)
  
  const [articlesRestants, setArticlesRestants] = useState<ArticleRestant[]>([])
  const [totalGlobalArticles, setTotalGlobalArticles] = useState<any>(null)
  
  const [articlesNonValorises, setArticlesNonValorises] = useState<ArticleNonValorise[]>([])
  const [totauxNonValorises, setTotauxNonValorises] = useState<any>(null)

  // Charger les données au montage
  useEffect(() => {
    if (isOpen) {
      loadAllData()
    }
  }, [isOpen])

  const loadAllData = async () => {
    setLoading(true)
    setError("")

    try {
      // Charger les 3 APIs en parallèle
      const [resProjets, resArticles, resNonValorises] = await Promise.all([
        fetch("/api/analytics/projets-bloques"),
        fetch("/api/analytics/articles-restants"),
        fetch("/api/analytics/articles-non-valorises")
      ])

      const dataProjets = await resProjets.json()
      const dataArticles = await resArticles.json()
      const dataNonValorises = await resNonValorises.json()

      if (dataProjets.success) {
        setProjetsBloques(dataProjets.data.projets)
        setTotauxProjets(dataProjets.data.totaux)
      }

      if (dataArticles.success) {
        setArticlesRestants(dataArticles.data.articles)
        setTotalGlobalArticles(dataArticles.data.totalGlobal)
      }

      if (dataNonValorises.success) {
        setArticlesNonValorises(dataNonValorises.data.synthese)
        setTotauxNonValorises(dataNonValorises.data.totaux)
      }

    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement des données")
    } finally {
      setLoading(false)
    }
  }

  // Formater les montants en FCFA
  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "XAF",
      minimumFractionDigits: 0
    }).format(montant)
  }

  // Export Excel - Tableau 1 : Projets bloqués
  const exportProjetsBloques = () => {
    const data = projetsBloques.map(p => ({
      "Projet": p.projetNom,
      "Nombre d'articles restants": p.nombreArticlesRestants,
      "Quantité totale restante": p.quantiteTotaleRestante,
      "Coût total restant (FCFA)": p.coutTotalRestant
    }))

    // Ajouter la ligne des totaux
    if (totauxProjets) {
      data.push({
        "Projet": "TOTAL",
        "Nombre d'articles restants": totauxProjets.nombreArticlesRestantsGlobal,
        "Quantité totale restante": totauxProjets.quantiteTotaleRestanteGlobale,
        "Coût total restant (FCFA)": totauxProjets.coutTotalRestantGlobal
      })
    }

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Projets Bloqués")
    XLSX.writeFile(wb, `projets-bloques-${new Date().toISOString().split("T")[0]}.xlsx`)
  }

  // Export Excel - Tableau 2 : Articles restants
  const exportArticlesRestants = () => {
    const data = articlesRestants.map(a => ({
      "Projet": a.projetNom,
      "N° Demande": a.demandeNumero,
      "Type": a.demandeType === "materiel" ? "Matériel" : "Outillage",
      "Référence article": a.articleReference || "-",
      "Désignation": a.articleDesignation,
      "Unité": a.articleUnite,
      "Quantité demandée": a.quantiteDemandee,
      "Quantité livrée": a.quantiteLivree,
      "Quantité restante": a.quantiteRestante,
      "Prix unitaire (FCFA)": a.prixUnitaire || 0,
      "Coût restant (FCFA)": a.coutRestant
    }))

    // Ajouter la ligne des totaux
    if (totalGlobalArticles) {
      data.push({
        "Projet": "TOTAL GLOBAL",
        "N° Demande": "",
        "Type": "",
        "Référence article": "",
        "Désignation": "",
        "Unité": "",
        "Quantité demandée": 0,
        "Quantité livrée": 0,
        "Quantité restante": totalGlobalArticles.quantiteTotale,
        "Prix unitaire (FCFA)": 0,
        "Coût restant (FCFA)": totalGlobalArticles.coutTotal
      })
    }

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Articles Restants")
    XLSX.writeFile(wb, `articles-restants-${new Date().toISOString().split("T")[0]}.xlsx`)
  }

  // Export Excel - Tableau 3 : Articles non valorisés
  const exportArticlesNonValorises = () => {
    const data = articlesNonValorises.map(a => ({
      "Projet": a.projetNom,
      "Type de demande": a.type === "materiel" ? "Matériel" : "Outillage",
      "Nombre d'articles non valorisés": a.nombreArticlesNonValorises,
      "Jours sans valorisation (MAX)": a.joursMaxSansValorisation,
      "Demandes impactées": a.demandesImpactees.join(", ")
    }))

    // Ajouter la ligne des totaux
    if (totauxNonValorises) {
      data.push({
        "Projet": "TOTAL",
        "Type de demande": "",
        "Nombre d'articles non valorisés": totauxNonValorises.nombreArticlesNonValorises,
        "Jours sans valorisation (MAX)": totauxNonValorises.joursMaxGlobal,
        "Demandes impactées": `${totauxNonValorises.nombreDemandesImpactees} demandes`
      })
    }

    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Articles Non Valorisés")
    XLSX.writeFile(wb, `articles-non-valorises-${new Date().toISOString().split("T")[0]}.xlsx`)
  }

  // Export Excel complet (tous les tableaux)
  const exportAll = () => {
    const wb = XLSX.utils.book_new()

    // Feuille 1 : Projets bloqués
    const dataP = projetsBloques.map(p => ({
      "Projet": p.projetNom,
      "Nombre d'articles restants": p.nombreArticlesRestants,
      "Quantité totale restante": p.quantiteTotaleRestante,
      "Coût total restant (FCFA)": p.coutTotalRestant
    }))
    if (totauxProjets) {
      dataP.push({
        "Projet": "TOTAL",
        "Nombre d'articles restants": totauxProjets.nombreArticlesRestantsGlobal,
        "Quantité totale restante": totauxProjets.quantiteTotaleRestanteGlobale,
        "Coût total restant (FCFA)": totauxProjets.coutTotalRestantGlobal
      })
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dataP), "Synthèse Projets")

    // Feuille 2 : Articles restants
    const dataA = articlesRestants.map(a => ({
      "Projet": a.projetNom,
      "N° Demande": a.demandeNumero,
      "Type": a.demandeType === "materiel" ? "Matériel" : "Outillage",
      "Référence": a.articleReference || "-",
      "Désignation": a.articleDesignation,
      "Unité": a.articleUnite,
      "Qté demandée": a.quantiteDemandee,
      "Qté livrée": a.quantiteLivree,
      "Qté restante": a.quantiteRestante,
      "Prix U. (FCFA)": a.prixUnitaire || 0,
      "Coût restant (FCFA)": a.coutRestant
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dataA), "Détail Articles")

    // Feuille 3 : Articles non valorisés
    const dataN = articlesNonValorises.map(a => ({
      "Projet": a.projetNom,
      "Type": a.type === "materiel" ? "Matériel" : "Outillage",
      "Articles non valorisés": a.nombreArticlesNonValorises,
      "Jours MAX sans valorisation": a.joursMaxSansValorisation,
      "Demandes": a.demandesImpactees.join(", ")
    }))
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dataN), "Non Valorisés")

    XLSX.writeFile(wb, `analyse-complete-${new Date().toISOString().split("T")[0]}.xlsx`)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <TrendingDown className="h-6 w-6 text-red-500" />
            Analyse des quantités restantes - Vue Direction
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-3 text-gray-600">Chargement des données analytiques...</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12 text-red-500">
            <AlertTriangle className="h-6 w-6 mr-2" />
            {error}
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Cartes de synthèse */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 flex-shrink-0">
              <Card className="border-l-4 border-l-red-500">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Projets impactés</p>
                      <p className="text-2xl font-bold text-red-600">
                        {totauxProjets?.nombreProjetsImpactes || 0}
                      </p>
                    </div>
                    <FolderOpen className="h-8 w-8 text-red-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Articles restants</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {totauxProjets?.nombreArticlesRestantsGlobal || 0}
                      </p>
                    </div>
                    <Package className="h-8 w-8 text-orange-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Coût total restant</p>
                      <p className="text-xl font-bold text-blue-600">
                        {formatMontant(totauxProjets?.coutTotalRestantGlobal || 0)}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Jours max sans valorisation</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {totauxNonValorises?.joursMaxGlobal || 0} j
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Bouton export global */}
            <div className="flex justify-end mb-4 flex-shrink-0">
              <Button onClick={exportAll} className="bg-green-600 hover:bg-green-700">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Exporter tout en Excel
              </Button>
            </div>

            {/* Tabs pour les 3 tableaux */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
                <TabsTrigger value="projets-bloques" className="text-xs sm:text-sm">
                  Synthèse Projets ({projetsBloques.length})
                </TabsTrigger>
                <TabsTrigger value="articles-restants" className="text-xs sm:text-sm">
                  Détail Articles ({articlesRestants.length})
                </TabsTrigger>
                <TabsTrigger value="non-valorises" className="text-xs sm:text-sm">
                  Non Valorisés ({articlesNonValorises.length})
                </TabsTrigger>
              </TabsList>

              {/* TABLEAU 1 : Synthèse Projets Bloqués */}
              <TabsContent value="projets-bloques" className="flex-1 overflow-auto mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between py-3">
                    <CardTitle className="text-base">Synthèse des projets bloqués</CardTitle>
                    <Button variant="outline" size="sm" onClick={exportProjetsBloques}>
                      <Download className="h-4 w-4 mr-2" />
                      Excel
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-600">Projet</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-600">Nb articles restants</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-600">Qté totale restante</th>
                            <th className="px-4 py-3 text-right font-medium text-gray-600">Coût total restant</th>
                          </tr>
                        </thead>
                        <tbody>
                          {projetsBloques.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                Aucun projet bloqué - Toutes les demandes sont livrées !
                              </td>
                            </tr>
                          ) : (
                            projetsBloques.map((projet) => (
                              <tr key={projet.projetId} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium">{projet.projetNom}</td>
                                <td className="px-4 py-3 text-center">
                                  <Badge variant="destructive">{projet.nombreArticlesRestants}</Badge>
                                </td>
                                <td className="px-4 py-3 text-center">{projet.quantiteTotaleRestante}</td>
                                <td className="px-4 py-3 text-right font-medium text-red-600">
                                  {formatMontant(projet.coutTotalRestant)}
                                </td>
                              </tr>
                            ))
                          )}
                          {projetsBloques.length > 0 && (
                            <tr className="bg-gray-100 font-bold">
                              <td className="px-4 py-3">TOTAL</td>
                              <td className="px-4 py-3 text-center">{totauxProjets?.nombreArticlesRestantsGlobal}</td>
                              <td className="px-4 py-3 text-center">{totauxProjets?.quantiteTotaleRestanteGlobale}</td>
                              <td className="px-4 py-3 text-right text-red-600">
                                {formatMontant(totauxProjets?.coutTotalRestantGlobal || 0)}
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TABLEAU 2 : Détail Articles Restants */}
              <TabsContent value="articles-restants" className="flex-1 overflow-auto mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between py-3">
                    <CardTitle className="text-base">Détail des articles restants</CardTitle>
                    <Button variant="outline" size="sm" onClick={exportArticlesRestants}>
                      <Download className="h-4 w-4 mr-2" />
                      Excel
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto max-h-[400px]">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">Projet</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">N° Demande</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">Référence</th>
                            <th className="px-3 py-2 text-left font-medium text-gray-600">Désignation</th>
                            <th className="px-3 py-2 text-center font-medium text-gray-600">Demandé</th>
                            <th className="px-3 py-2 text-center font-medium text-gray-600">Livré</th>
                            <th className="px-3 py-2 text-center font-medium text-gray-600">Restant</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-600">Prix U.</th>
                            <th className="px-3 py-2 text-right font-medium text-gray-600">Coût restant</th>
                          </tr>
                        </thead>
                        <tbody>
                          {articlesRestants.length === 0 ? (
                            <tr>
                              <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                                Aucun article restant - Toutes les demandes sont complètement livrées !
                              </td>
                            </tr>
                          ) : (
                            articlesRestants.map((article, index) => (
                              <tr key={`${article.demandeId}-${article.articleId}-${index}`} className="border-b hover:bg-gray-50">
                                <td className="px-3 py-2 text-xs">{article.projetNom}</td>
                                <td className="px-3 py-2">
                                  <Badge variant="outline" className="text-xs">
                                    {article.demandeNumero}
                                  </Badge>
                                </td>
                                <td className="px-3 py-2 text-xs text-gray-500">{article.articleReference || "-"}</td>
                                <td className="px-3 py-2 text-xs max-w-[150px] truncate" title={article.articleDesignation}>
                                  {article.articleDesignation}
                                </td>
                                <td className="px-3 py-2 text-center">{article.quantiteDemandee}</td>
                                <td className="px-3 py-2 text-center text-green-600">{article.quantiteLivree}</td>
                                <td className="px-3 py-2 text-center">
                                  <Badge variant="destructive">{article.quantiteRestante}</Badge>
                                </td>
                                <td className="px-3 py-2 text-right text-xs">
                                  {article.prixUnitaire ? formatMontant(article.prixUnitaire) : "-"}
                                </td>
                                <td className="px-3 py-2 text-right font-medium text-red-600">
                                  {formatMontant(article.coutRestant)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                    {articlesRestants.length > 0 && (
                      <div className="bg-gray-100 px-4 py-3 flex justify-between items-center border-t">
                        <span className="font-medium">Total global</span>
                        <span className="font-bold text-red-600">
                          {formatMontant(totalGlobalArticles?.coutTotal || 0)}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TABLEAU 3 : Articles Non Valorisés */}
              <TabsContent value="non-valorises" className="flex-1 overflow-auto mt-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between py-3">
                    <CardTitle className="text-base">Articles non valorisés (blocages processus)</CardTitle>
                    <Button variant="outline" size="sm" onClick={exportArticlesNonValorises}>
                      <Download className="h-4 w-4 mr-2" />
                      Excel
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-4 py-3 text-left font-medium text-gray-600">Projet</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-600">Type demande</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-600">Nb articles non valorisés</th>
                            <th className="px-4 py-3 text-center font-medium text-gray-600">Jours sans valorisation (MAX)</th>
                            <th className="px-4 py-3 text-left font-medium text-gray-600">Demandes impactées</th>
                          </tr>
                        </thead>
                        <tbody>
                          {articlesNonValorises.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                Aucun article non valorisé - Tous les prix sont renseignés !
                              </td>
                            </tr>
                          ) : (
                            articlesNonValorises.map((item, index) => (
                              <tr key={`${item.projetId}-${item.type}-${index}`} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-3 font-medium">{item.projetNom}</td>
                                <td className="px-4 py-3 text-center">
                                  <Badge variant={item.type === "materiel" ? "default" : "secondary"}>
                                    {item.type === "materiel" ? "Matériel" : "Outillage"}
                                  </Badge>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <Badge variant="destructive">{item.nombreArticlesNonValorises}</Badge>
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`font-medium ${item.joursMaxSansValorisation > 7 ? "text-red-600" : item.joursMaxSansValorisation > 3 ? "text-orange-600" : "text-gray-600"}`}>
                                    {item.joursMaxSansValorisation} jours
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate" title={item.demandesImpactees.join(", ")}>
                                  {item.demandesImpactees.join(", ")}
                                </td>
                              </tr>
                            ))
                          )}
                          {articlesNonValorises.length > 0 && (
                            <tr className="bg-gray-100 font-bold">
                              <td className="px-4 py-3">TOTAL</td>
                              <td className="px-4 py-3 text-center">-</td>
                              <td className="px-4 py-3 text-center">{totauxNonValorises?.nombreArticlesNonValorises}</td>
                              <td className="px-4 py-3 text-center text-red-600">{totauxNonValorises?.joursMaxGlobal} jours</td>
                              <td className="px-4 py-3">{totauxNonValorises?.nombreDemandesImpactees} demandes</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

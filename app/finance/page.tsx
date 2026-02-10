"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useStore } from "@/stores/useStore"
import { 
  DollarSign,
  FolderOpen,
  Package,
  Activity,
  TrendingUp,
  ArrowLeft,
  Download,
  Loader2,
  AlertTriangle,
  Clock,
  FileSpreadsheet,
  TrendingDown
} from "lucide-react"
import { useRouter } from "next/navigation"
import { getDemandeFinance } from "@/lib/finance-utils"
import * as XLSX from "xlsx"

export default function FinancePage() {
  const router = useRouter()
  const { currentUser, projets, demandes, articles, isLoading, loadProjets, loadDemandes, loadArticles } = useStore()

  // États pour les filtres financiers
  const [financePeriode, setFinancePeriode] = useState<"all" | "month" | "quarter" | "year">("all")
  const [financeType, setFinanceType] = useState<"all" | "materiel" | "outillage">("all")
  const [financeStatut, setFinanceStatut] = useState<"all" | "chiffrees" | "non_chiffrees">("all")

  const [selectedProjetId, setSelectedProjetId] = useState<string | null>(null)
  const [projectArticlesModalOpen, setProjectArticlesModalOpen] = useState(false)

  // États pour les 3 tableaux analytiques
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState("projets-bloques")
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [analyticsError, setAnalyticsError] = useState("")
  
  // Données des 3 tableaux
  const [projetsBloques, setProjetsBloques] = useState<any[]>([])
  const [totauxProjets, setTotauxProjets] = useState<any>(null)
  
  const [articlesRestants, setArticlesRestants] = useState<any[]>([])
  const [totalGlobalArticles, setTotalGlobalArticles] = useState<any>(null)
  
  const [articlesNonValorises, setArticlesNonValorises] = useState<any[]>([])
  const [totauxNonValorises, setTotauxNonValorises] = useState<any>(null)

  useEffect(() => {
    loadProjets()
    loadDemandes()
    loadArticles()
    loadAnalyticsData()
  }, [loadProjets, loadDemandes, loadArticles])

  // Charger les données des 3 tableaux analytiques
  const loadAnalyticsData = async () => {
    setLoadingAnalytics(true)
    setAnalyticsError("")

    try {
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
      setAnalyticsError(err.message || "Erreur lors du chargement des données")
    } finally {
      setLoadingAnalytics(false)
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

  // Export Excel - Tableau 1
  const exportProjetsBloques = () => {
    const data = projetsBloques.map(p => ({
      "Projet": p.projetNom,
      "Nombre d'articles restants": p.nombreArticlesRestants,
      "Quantité totale restante": p.quantiteTotaleRestante,
      "Coût total restant (FCFA)": p.coutTotalRestant
    }))

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

  // Export Excel - Tableau 2
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

  // Export Excel - Tableau 3
  const exportArticlesNonValorises = () => {
    const data = articlesNonValorises.map(a => ({
      "Projet": a.projetNom,
      "Type de demande": a.type === "materiel" ? "Matériel" : "Outillage",
      "Nombre d'articles non valorisés": a.nombreArticlesNonValorises,
      "Jours sans valorisation (MAX)": a.joursMaxSansValorisation,
      "Demandes impactées": a.demandesImpactees.join(", ")
    }))

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

  const selectedProjet = selectedProjetId ? projets.find(p => p.id === selectedProjetId) : undefined

  const downloadProjectArticlesExcel = (projectName: string, summary: any[], totalDemandesProjet: number) => {
    const escapeHtml = (value: unknown) => {
      const str = String(value ?? "")
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;")
    }

    const sanitizeFileName = (value: string) => value.replace(/[^a-zA-Z0-9\-_ ]/g, "_").trim().replace(/\s+/g, " ")

    const date = new Date()
    const dateStr = date.toISOString().slice(0, 10)
    const safeProjectName = sanitizeFileName(projectName || "Projet")

    const rowsHtml = summary
      .map((row) => {
        const statuts = Object.entries(row.demandesByStatus || {})
          .sort((a: any, b: any) => (Number(b[1]) || 0) - (Number(a[1]) || 0))
          .map(([status, count]) => `${escapeHtml(status)} (${escapeHtml(count)})`)
          .join(" | ")

        return `
          <tr>
            <td>${escapeHtml(row.nom)}</td>
            <td>${escapeHtml(row.reference || "")}</td>
            <td>${escapeHtml(row.type || "")}</td>
            <td>${escapeHtml(row.unite || "")}</td>
            <td>${escapeHtml(row.quantiteDemandeeTotal)}</td>
            <td>${escapeHtml(row.demandesCount)}</td>
            <td>${statuts}</td>
          </tr>
        `
      })
      .join("")

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
        </head>
        <body>
          <table border="1">
            <tr>
              <td colspan="7"><b>Articles demandés - ${escapeHtml(projectName || "Projet")}</b></td>
            </tr>
            <tr>
              <td colspan="7">${escapeHtml(summary.length)} article(s) • ${escapeHtml(totalDemandesProjet)} demande(s) sur ce projet</td>
            </tr>
            <tr>
              <th>Article</th>
              <th>Référence</th>
              <th>Type</th>
              <th>Unité</th>
              <th>Qté demandée</th>
              <th>Nb demandes</th>
              <th>Statuts</th>
            </tr>
            ${rowsHtml}
          </table>
        </body>
      </html>
    `.trim()

    const blob = new Blob(["\uFEFF", html], { type: "application/vnd.ms-excel;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `articles_${safeProjectName}_${dateStr}.xls`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const getProjectArticlesSummary = (projetId: string, demandesSource: any[]) => {
    const projetDemandes = demandesSource.filter(d => d.projetId === projetId)
    const byArticleId = new Map<string, {
      articleId: string
      nom: string
      reference?: string
      unite?: string
      type?: string
      quantiteDemandeeTotal: number
      demandesCount: number
      demandesByStatus: Record<string, number>
    }>()

    for (const demande of projetDemandes) {
      const items = Array.isArray(demande.items) ? demande.items : []
      const articleIdsInThisDemande = new Set<string>()

      for (const item of items) {
        const articleId = item?.articleId
        if (!articleId) continue
        articleIdsInThisDemande.add(articleId)

        const article = item.article || articles.find(a => a.id === articleId)
        const current = byArticleId.get(articleId)
        const quantiteDemandee = Number(item?.quantiteDemandee || 0)

        if (!current) {
          byArticleId.set(articleId, {
            articleId,
            nom: article?.nom || `Article ${articleId}`,
            reference: article?.reference,
            unite: article?.unite,
            type: article?.type,
            quantiteDemandeeTotal: quantiteDemandee,
            demandesCount: 0,
            demandesByStatus: {},
          })
        } else {
          current.quantiteDemandeeTotal += quantiteDemandee
        }
      }

      for (const articleId of articleIdsInThisDemande) {
        const current = byArticleId.get(articleId)
        if (!current) continue
        current.demandesCount += 1
        const status = String(demande.status || "non_specifie")
        current.demandesByStatus[status] = (current.demandesByStatus[status] || 0) + 1
      }
    }

    return Array.from(byArticleId.values()).sort((a, b) => b.demandesCount - a.demandesCount)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des données financières...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* En-tête avec bouton retour */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <DollarSign className="h-8 w-8 text-green-600" />
                Finance
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Tableau de bord financier - Coûts basés sur les quantités restantes
              </p>
            </div>
          </div>
        </div>

        {/* SECTION DES 3 TABLEAUX ANALYTIQUES */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <TrendingDown className="h-6 w-6 text-red-500" />
              Tableaux Analytiques - Vue Direction
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAnalytics ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-3 text-gray-600">Chargement des données analytiques...</span>
              </div>
            ) : analyticsError ? (
              <div className="flex items-center justify-center py-12 text-red-500">
                <AlertTriangle className="h-6 w-6 mr-2" />
                {analyticsError}
              </div>
            ) : (
              <div>
                {/* Tabs pour les 3 tableaux */}
                <Tabs value={activeAnalyticsTab} onValueChange={setActiveAnalyticsTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="projets-bloques">
                      TABLEAU 1: Projets Bloqués ({projetsBloques.length})
                    </TabsTrigger>
                    <TabsTrigger value="articles-restants">
                      TABLEAU 2: Articles Restants ({articlesRestants.length})
                    </TabsTrigger>
                    <TabsTrigger value="non-valorises">
                      TABLEAU 3: Non Valorisés ({articlesNonValorises.length})
                    </TabsTrigger>
                  </TabsList>

                  {/* TABLEAU 1 : Synthèse Projets Bloqués */}
                  <TabsContent value="projets-bloques" className="mt-4">
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
                  <TabsContent value="articles-restants" className="mt-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between py-3">
                        <CardTitle className="text-base">Détail des articles restants</CardTitle>
                        <Button variant="outline" size="sm" onClick={exportArticlesRestants}>
                          <Download className="h-4 w-4 mr-2" />
                          Excel
                        </Button>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto max-h-[500px]">
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
                                    <td className="px-3 py-2 text-xs max-w-[200px] truncate" title={article.articleDesignation}>
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
                  <TabsContent value="non-valorises" className="mt-4">
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
                                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[250px] truncate" title={item.demandesImpactees.join(", ")}>
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
          </CardContent>
        </Card>

        {/* Filtres financiers */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600 font-medium">Période:</label>
                <select 
                  value={financePeriode} 
                  onChange={(e) => setFinancePeriode(e.target.value as any)}
                  className="text-xs border rounded px-2 py-1 bg-white"
                >
                  <option value="all">Tout</option>
                  <option value="month">Ce mois</option>
                  <option value="quarter">Ce trimestre</option>
                  <option value="year">Cette année</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600 font-medium">Type:</label>
                <select 
                  value={financeType} 
                  onChange={(e) => setFinanceType(e.target.value as any)}
                  className="text-xs border rounded px-2 py-1 bg-white"
                >
                  <option value="all">Tout</option>
                  <option value="materiel">Matériel</option>
                  <option value="outillage">Outillage</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600 font-medium">Statut:</label>
                <select 
                  value={financeStatut} 
                  onChange={(e) => setFinanceStatut(e.target.value as any)}
                  className="text-xs border rounded px-2 py-1 bg-white"
                >
                  <option value="all">Tout</option>
                  <option value="chiffrees">Chiffrées</option>
                  <option value="non_chiffrees">Non chiffrées</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tableau des coûts par projet */}
        {/* NOTE: Les coûts affichés représentent les QUANTITÉS RESTANTES à livrer (quantité validée - quantité livrée) */}
        {/* Cela permet de connaître le coût de ce qui reste à livrer suite aux ruptures de stock magasin */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Détail des coûts par projet</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              // Appliquer les filtres sur les demandes
              const now = new Date()
              const demandesFiltrees = demandes.filter(d => {
                // Filtre par type
                if (financeType !== "all" && d.type !== financeType) return false
                
                // Filtre par statut (chiffrées ou non)
                const finance = getDemandeFinance(d)
                if (financeStatut === "chiffrees" && (!finance.hasAnyPrice || finance.committedAmount === 0)) return false
                if (financeStatut === "non_chiffrees" && finance.hasAnyPrice && finance.committedAmount > 0) return false
                
                // Filtre par période (utilise dateEngagement si disponible, sinon dateCreation)
                const dateRef = d.dateEngagement ? new Date(d.dateEngagement) : new Date(d.dateCreation)
                if (financePeriode === "month") {
                  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
                  if (dateRef < startOfMonth) return false
                } else if (financePeriode === "quarter") {
                  const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
                  if (dateRef < quarterStart) return false
                } else if (financePeriode === "year") {
                  const startOfYear = new Date(now.getFullYear(), 0, 1)
                  if (dateRef < startOfYear) return false
                }
                
                return true
              })
              
              return (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-gray-500">{demandesFiltrees.length} demande(s) filtrée(s)</span>
                  </div>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="text-left p-3 font-medium text-gray-600">Projet</th>
                          <th className="text-center p-3 font-medium text-gray-600">Demandes</th>
                          <th className="text-center p-3 font-medium text-gray-600">Matériel</th>
                          <th className="text-center p-3 font-medium text-gray-600">Outillage</th>
                          <th className="text-right p-3 font-medium text-gray-600">Dépensé Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {projets.map(projet => {
                          const projetDemandes = demandesFiltrees.filter(d => d.projetId === projet.id)
                          const depenseMateriel = projetDemandes
                            .filter(d => d.type === 'materiel')
                            .reduce((sum, d) => sum + getDemandeFinance(d).spentAmount, 0)
                          const depenseOutillage = projetDemandes
                            .filter(d => d.type === 'outillage')
                            .reduce((sum, d) => sum + getDemandeFinance(d).spentAmount, 0)
                          const depenseTotal = depenseMateriel + depenseOutillage
                          
                          if (projetDemandes.length === 0) return null
                          
                          return (
                            <tr key={projet.id} className="border-t hover:bg-gray-50">
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <FolderOpen className="h-4 w-4 text-gray-400" />
                                  <button
                                    type="button"
                                    className="font-medium text-left hover:underline"
                                    onClick={() => {
                                      setSelectedProjetId(projet.id)
                                      setProjectArticlesModalOpen(true)
                                    }}
                                  >
                                    {projet.nom}
                                  </button>
                                </div>
                              </td>
                              <td className="p-3 text-center">
                                <Badge variant="outline" className="text-xs">
                                  {projetDemandes.length}
                                </Badge>
                              </td>
                              <td className="p-3 text-center text-blue-600">
                                {depenseMateriel > 0 ? `${depenseMateriel.toLocaleString('fr-FR')} FCFA` : '-'}
                              </td>
                              <td className="p-3 text-center text-purple-600">
                                {depenseOutillage > 0 ? `${depenseOutillage.toLocaleString('fr-FR')} FCFA` : '-'}
                              </td>
                              <td className="p-3 text-right font-bold text-green-700">
                                {depenseTotal > 0 ? `${depenseTotal.toLocaleString('fr-FR')} FCFA` : '-'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                      <tfoot className="bg-green-50 font-bold">
                        <tr>
                          <td className="p-3">TOTAL</td>
                          <td className="p-3 text-center">{demandesFiltrees.length}</td>
                          <td className="p-3 text-center text-blue-700">
                            {demandesFiltrees.filter(d => d.type === 'materiel').reduce((sum, d) => sum + getDemandeFinance(d).spentAmount, 0).toLocaleString('fr-FR')} FCFA
                          </td>
                          <td className="p-3 text-center text-purple-700">
                            {demandesFiltrees.filter(d => d.type === 'outillage').reduce((sum, d) => sum + getDemandeFinance(d).spentAmount, 0).toLocaleString('fr-FR')} FCFA
                          </td>
                          <td className="p-3 text-right text-green-800">
                            {demandesFiltrees.reduce((sum, d) => sum + getDemandeFinance(d).spentAmount, 0).toLocaleString('fr-FR')} FCFA
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>

        <Dialog open={projectArticlesModalOpen} onOpenChange={setProjectArticlesModalOpen}>
          <DialogContent className="max-w-4xl">
            {(() => {
              if (!selectedProjetId) {
                return <div className="text-sm text-gray-600">Aucun projet sélectionné.</div>
              }

              const now = new Date()
              const demandesFiltrees = demandes.filter(d => {
                if (financeType !== "all" && d.type !== financeType) return false
                const finance = getDemandeFinance(d)
                if (financeStatut === "chiffrees" && (!finance.hasAnyPrice || finance.committedAmount === 0)) return false
                if (financeStatut === "non_chiffrees" && finance.hasAnyPrice && finance.committedAmount > 0) return false
                const dateRef = d.dateEngagement ? new Date(d.dateEngagement) : new Date(d.dateCreation)
                if (financePeriode === "month") {
                  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
                  if (dateRef < startOfMonth) return false
                } else if (financePeriode === "quarter") {
                  const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
                  if (dateRef < quarterStart) return false
                } else if (financePeriode === "year") {
                  const startOfYear = new Date(now.getFullYear(), 0, 1)
                  if (dateRef < startOfYear) return false
                }
                return true
              })

              const summary = getProjectArticlesSummary(selectedProjetId, demandesFiltrees)
              const totalDemandesProjet = demandesFiltrees.filter(d => d.projetId === selectedProjetId).length

              return (
                <div className="space-y-4">
                  <DialogHeader className="flex flex-row items-center justify-between gap-3">
                    <DialogTitle>
                      Articles demandés - {selectedProjet?.nom || "Projet"}
                    </DialogTitle>
                    {currentUser?.role === "superadmin" && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => downloadProjectArticlesExcel(selectedProjet?.nom || "Projet", summary, totalDemandesProjet)}
                      >
                        <Download className="h-4 w-4" />
                        Télécharger
                      </Button>
                    )}
                  </DialogHeader>

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      {summary.length} article(s)
                    </div>
                    <div className="text-sm text-gray-600">
                      {totalDemandesProjet} demande(s) sur ce projet
                    </div>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <ScrollArea className="h-[60vh]">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 sticky top-0">
                          <tr>
                            <th className="text-left p-3 font-medium text-gray-600">Article</th>
                            <th className="text-center p-3 font-medium text-gray-600">Qté demandée</th>
                            <th className="text-center p-3 font-medium text-gray-600">Nb demandes</th>
                            <th className="text-left p-3 font-medium text-gray-600">Statuts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {summary.length === 0 ? (
                            <tr>
                              <td className="p-3 text-gray-500" colSpan={4}>
                                Aucun article trouvé pour ce projet.
                              </td>
                            </tr>
                          ) : (
                            summary.map((row) => (
                              <tr key={row.articleId} className="border-t">
                                <td className="p-3">
                                  <div className="font-medium text-gray-800">{row.nom}</div>
                                  <div className="text-xs text-gray-500">
                                    {row.reference ? `Réf: ${row.reference}` : ""}
                                    {row.reference && row.type ? " • " : ""}
                                    {row.type ? `Type: ${row.type}` : ""}
                                  </div>
                                </td>
                                <td className="p-3 text-center font-medium">
                                  {row.quantiteDemandeeTotal.toLocaleString('fr-FR')}{row.unite ? ` ${row.unite}` : ""}
                                </td>
                                <td className="p-3 text-center">
                                  <Badge variant="outline" className="text-xs">
                                    {row.demandesCount}
                                  </Badge>
                                </td>
                                <td className="p-3">
                                  <div className="flex flex-wrap gap-2">
                                    {Object.entries(row.demandesByStatus)
                                      .sort((a, b) => b[1] - a[1])
                                      .map(([status, count]) => (
                                        <Badge key={status} variant="secondary" className="text-xs">
                                          {status} ({count})
                                        </Badge>
                                      ))}
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </ScrollArea>
                  </div>
                </div>
              )
            })()}
          </DialogContent>
        </Dialog>

        {/* Graphiques */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Répartition par type */}
          {/* NOTE: Coûts basés sur les quantités restantes à livrer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-600" />
                Répartition des dépenses par type
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const depenseMateriel = demandes
                  .filter(d => d.type === 'materiel')
                  .reduce((sum, d) => sum + getDemandeFinance(d).spentAmount, 0)
                const depenseOutillage = demandes
                  .filter(d => d.type === 'outillage')
                  .reduce((sum, d) => sum + getDemandeFinance(d).spentAmount, 0)
                const total = depenseMateriel + depenseOutillage
                const pctMateriel = total > 0 ? Math.round((depenseMateriel / total) * 100) : 0
                const pctOutillage = total > 0 ? Math.round((depenseOutillage / total) * 100) : 0
                
                return (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Matériel</span>
                        <span className="font-bold text-blue-700">{pctMateriel}%</span>
                      </div>
                      <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full flex items-center justify-end pr-2 text-white text-xs font-bold transition-all duration-500"
                          style={{ width: `${Math.max(pctMateriel, 5)}%`, backgroundColor: '#015fc4' }}
                        >
                          {depenseMateriel > 0 && `${depenseMateriel.toLocaleString('fr-FR')} FCFA`}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Outillage</span>
                        <span className="font-bold text-cyan-700">{pctOutillage}%</span>
                      </div>
                      <div className="h-8 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full flex items-center justify-end pr-2 text-gray-800 text-xs font-bold transition-all duration-500"
                          style={{ width: `${Math.max(pctOutillage, 5)}%`, backgroundColor: '#b8d1df' }}
                        >
                          {depenseOutillage > 0 && `${depenseOutillage.toLocaleString('fr-FR')} FCFA`}
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">Total</span>
                      <span className="text-xl font-bold text-green-700">{total.toLocaleString('fr-FR')} FCFA</span>
                    </div>
                  </div>
                )
              })()}
            </CardContent>
          </Card>

          {/* Top 5 projets */}
          {/* NOTE: Coûts basés sur les quantités restantes à livrer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-green-600" />
                Top 5 projets par dépenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const topProjets = projets
                  .map(p => ({
                    id: p.id,
                    name: p.nom,
                    cout: demandes.filter(d => d.projetId === p.id).reduce((sum, d) => sum + getDemandeFinance(d).spentAmount, 0),
                    nbDemandes: demandes.filter(d => d.projetId === p.id).length
                  }))
                  .sort((a, b) => b.cout - a.cout)
                  .slice(0, 5)
                
                const maxCout = Math.max(...topProjets.map(p => p.cout), 1)
                
                return (
                  <div className="space-y-3">
                    {topProjets.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">Aucun projet avec des coûts</p>
                    ) : (
                      topProjets.map((projet, index) => (
                        <div key={projet.id} className="space-y-1">
                          <div className="flex justify-between items-center text-sm">
                            <span className="flex items-center gap-2">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                index === 0 ? 'bg-yellow-500' : 
                                index === 1 ? 'bg-gray-400' : 
                                index === 2 ? 'bg-orange-400' : 'bg-gray-300'
                              }`}>
                                {index + 1}
                              </span>
                              <span className="font-medium text-gray-700 truncate max-w-[150px]" title={projet.name}>
                                {projet.name}
                              </span>
                            </span>
                            <span className="text-gray-500">
                              {projet.nbDemandes} demande{projet.nbDemandes > 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                              <div 
                                className="h-full rounded transition-all duration-500"
                                style={{ 
                                  width: `${(projet.cout / maxCout) * 100}%`, 
                                  backgroundColor: index === 0 ? '#22c55e' : index === 1 ? '#4ade80' : '#86efac'
                                }}
                              />
                            </div>
                            <span className="text-xs font-bold text-green-700 min-w-[100px] text-right">
                              {projet.cout.toLocaleString('fr-FR')} FCFA
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )
              })()}
            </CardContent>
          </Card>
        </div>

        {/* Indicateurs de Performance */}
        {/* NOTE: Indicateurs basés sur les coûts des quantités restantes à livrer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-600" />
              Indicateurs de Performance (Dépensé)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const demandesChiffrees = demandes.filter(d => getDemandeFinance(d).hasAnyPrice && getDemandeFinance(d).committedAmount > 0)
              const demandesCloses = demandes.filter(d => d.status === 'cloturee')
              const demandesValidees = demandes.filter(d => !['brouillon', 'rejetee', 'archivee'].includes(d.status))
              
              const delaiMoyen = demandesCloses.length > 0 
                ? Math.round(demandesCloses.reduce((sum, d) => {
                    const created = new Date(d.dateCreation).getTime()
                    const now = Date.now()
                    return sum + (now - created) / (1000 * 60 * 60 * 24)
                  }, 0) / demandesCloses.length)
                : 0
              
              const tauxApprobation = demandes.length > 0 
                ? Math.round((demandesValidees.length / demandes.length) * 100)
                : 0
              
              const coutMoyenMateriel = demandesChiffrees.filter(d => d.type === 'materiel').length > 0
                ? Math.round(demandesChiffrees.filter(d => d.type === 'materiel').reduce((sum, d) => sum + getDemandeFinance(d).spentAmount, 0) / demandesChiffrees.filter(d => d.type === 'materiel').length)
                : 0
              
              const coutMoyenOutillage = demandesChiffrees.filter(d => d.type === 'outillage').length > 0
                ? Math.round(demandesChiffrees.filter(d => d.type === 'outillage').reduce((sum, d) => sum + getDemandeFinance(d).spentAmount, 0) / demandesChiffrees.filter(d => d.type === 'outillage').length)
                : 0
              
              return (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500">
                    <p className="text-xs text-gray-600 mb-1">Délai Moyen</p>
                    <p className="text-3xl font-bold text-blue-700">{delaiMoyen}</p>
                    <p className="text-xs text-gray-500">jours</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border-l-4 border-green-500">
                    <p className="text-xs text-gray-600 mb-1">Taux Approbation</p>
                    <p className="text-3xl font-bold text-green-700">{tauxApprobation}%</p>
                    <p className="text-xs text-gray-500">{demandesValidees.length}/{demandes.length}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500">
                    <p className="text-xs text-gray-600 mb-1">Dépensé Moy. Matériel</p>
                    <p className="text-xl font-bold text-purple-700">{coutMoyenMateriel.toLocaleString('fr-FR')} FCFA</p>
                    <p className="text-xs text-gray-500">par demande</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border-l-4 border-cyan-500">
                    <p className="text-xs text-gray-600 mb-1">Dépensé Moy. Outillage</p>
                    <p className="text-xl font-bold text-cyan-700">{coutMoyenOutillage.toLocaleString('fr-FR')} FCFA</p>
                    <p className="text-xs text-gray-500">par demande</p>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>

        {/* Évolution Temporelle */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              Évolution des Coûts (6 derniers mois)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              // Générer les 6 derniers mois
              const mois = []
              const now = new Date()
              for (let i = 5; i >= 0; i--) {
                const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
                mois.push({
                  mois: date.toLocaleDateString('fr-FR', { month: 'short' }),
                  moisComplet: date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
                  annee: date.getFullYear(),
                  moisNum: date.getMonth()
                })
              }
              
              // Calculer les coûts par mois
              const donneesMois = mois.map(m => {
                const demandesMois = demandes.filter(d => {
                  const dateDemande = new Date(d.dateCreation)
                  return dateDemande.getMonth() === m.moisNum && dateDemande.getFullYear() === m.annee
                })
                
                const depenseMateriel = demandesMois
                  .filter(d => d.type === 'materiel')
                  .reduce((sum, d) => sum + getDemandeFinance(d).spentAmount, 0)
                const depenseOutillage = demandesMois
                  .filter(d => d.type === 'outillage')
                  .reduce((sum, d) => sum + getDemandeFinance(d).spentAmount, 0)
                const depenseTotal = depenseMateriel + depenseOutillage
                
                return {
                  ...m,
                  materiel: depenseMateriel,
                  outillage: depenseOutillage,
                  total: depenseTotal,
                  nbDemandes: demandesMois.length
                }
              })
              
              const maxCout = Math.max(...donneesMois.map(d => d.total), 1)
              
              // Calcul de l'évolution
              const moisActuel = donneesMois[donneesMois.length - 1]
              const moisPrecedent = donneesMois[donneesMois.length - 2]
              const evolution = moisPrecedent.total > 0 
                ? Math.round(((moisActuel.total - moisPrecedent.total) / moisPrecedent.total) * 100)
                : 0
              
              return (
                <div className="space-y-4">
                  {/* Analyse comparative */}
                  <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-600">Évolution vs mois dernier</p>
                      <p className={`text-2xl font-bold ${evolution >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {evolution >= 0 ? '↑' : '↓'} {Math.abs(evolution)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">Ce mois</p>
                      <p className="text-2xl font-bold text-gray-800">{moisActuel.total.toLocaleString('fr-FR')} FCFA</p>
                    </div>
                  </div>
                  
                  {/* Graphique en barres */}
                  <div className="space-y-3">
                    {donneesMois.map((data, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium text-gray-700 w-20">{data.mois}</span>
                          <span className="text-gray-500 text-xs">{data.nbDemandes} demande{data.nbDemandes > 1 ? 's' : ''}</span>
                          <span className="font-bold text-green-700 w-32 text-right">
                            {data.total.toLocaleString('fr-FR')} FCFA
                          </span>
                        </div>
                        <div className="flex gap-1 h-8">
                          {/* Barre Matériel */}
                          <div 
                            className="bg-blue-500 rounded-l transition-all duration-500 flex items-center justify-center text-white text-xs font-bold"
                            style={{ width: `${(data.materiel / maxCout) * 100}%` }}
                            title={`Matériel: ${data.materiel.toLocaleString('fr-FR')} FCFA`}
                          >
                            {data.materiel > maxCout * 0.1 && `${(data.materiel / 1000).toFixed(0)}k`}
                          </div>
                          {/* Barre Outillage */}
                          <div 
                            className="bg-cyan-400 rounded-r transition-all duration-500 flex items-center justify-center text-gray-800 text-xs font-bold"
                            style={{ width: `${(data.outillage / maxCout) * 100}%` }}
                            title={`Outillage: ${data.outillage.toLocaleString('fr-FR')} FCFA`}
                          >
                            {data.outillage > maxCout * 0.1 && `${(data.outillage / 1000).toFixed(0)}k`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

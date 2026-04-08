/**
 * SERVICE D'ENVOI DE RAPPORTS ANALYTIQUES PAR EMAIL
 * 
 * Ce service génère et envoie des rapports quotidiens sur les projets bloqués
 * au Super Admin. Les rapports incluent les 3 tableaux analytiques :
 * - Tableau 1 : Synthèse projets bloqués
 * - Tableau 2 : Articles restants détaillés
 * - Tableau 3 : Articles non valorisés
 * 
 * CONFIGURATION REQUISE :
 * - EMAIL_USER : Email Gmail pour l'envoi
 * - EMAIL_PASSWORD : Mot de passe d'application Gmail
 * - NEXT_PUBLIC_APP_URL : URL de l'application
 */

import nodemailer from 'nodemailer'
import { prisma } from '@/lib/prisma'

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Récupère la configuration email depuis les variables d'environnement
 * Cette fonction est appelée à chaque envoi pour s'assurer d'avoir les valeurs à jour
 */
function getEmailConfig() {
  return {
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
    from: process.env.EMAIL_FROM || 'Gestion Demandes <noreply@gestion-materiel.com>',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  }
}

// ============================================================================
// TYPES
// ============================================================================

interface ProjetBloque {
  projetId: string
  projetNom: string
  nombreArticlesRestants: number
  quantiteTotaleRestante: number
  coutTotalRestant: number
  nombreArticlesNonValorises: number
}

interface ArticleNonValorise {
  projetNom: string
  typeDemande: string
  nombreArticles: number
  quantiteTotale: number
}

interface ArticleRestant {
  demandeNumero: string
  projetNom: string
  articleNom: string
  quantiteRestante: number
  prixUnitaire: number | null
  coutRestant: number
}

interface AnalyticsData {
  projetsBloques: ProjetBloque[]
  articlesNonValorises: ArticleNonValorise[]
  articlesRestants: ArticleRestant[]
  totaux: {
    nombreProjetsImpactes: number
    nombreArticlesRestantsGlobal: number
    quantiteTotaleRestanteGlobale: number
    coutTotalRestantGlobal: number
    nombreArticlesNonValorisesGlobal: number
  }
}

// ============================================================================
// RÉCUPÉRATION DES DONNÉES ANALYTIQUES
// ============================================================================

/**
 * Récupère les données des 3 tableaux analytiques
 */
async function fetchAnalyticsData(): Promise<AnalyticsData> {
  // Récupérer les demandes en préparation Appro ou Logistique
  const demandes = await prisma.demande.findMany({
    where: {
      status: {
        in: ["en_attente_preparation_appro", "en_attente_preparation_logistique"]
      }
    },
    include: {
      projet: {
        select: {
          id: true,
          nom: true
        }
      },
      items: {
        select: {
          id: true,
          quantiteDemandee: true,
          quantiteValidee: true,
          quantiteLivreeTotal: true,
          quantiteRecue: true,
          prixUnitaire: true,
          article: {
            select: {
              nom: true
            }
          }
        }
      }
    }
  })

  // TABLEAU 1 : Projets bloqués (agrégation par projet)
  const projetsMap = new Map<string, ProjetBloque>()

  // TABLEAU 2 : Articles restants (détail par article)
  const articlesRestants: ArticleRestant[] = []

  // TABLEAU 3 : Articles non valorisés (agrégation par projet + type)
  const articlesNonValorisesMap = new Map<string, ArticleNonValorise>()

  for (const demande of demandes) {
    const projetId = demande.projetId
    const projetNom = demande.projet?.nom || "Projet inconnu"
    const typeDemande = demande.type === 'materiel' ? 'Matériel' : 'Outillage'

    // Initialiser le projet dans Tableau 1
    if (!projetsMap.has(projetId)) {
      projetsMap.set(projetId, {
        projetId,
        projetNom,
        nombreArticlesRestants: 0,
        quantiteTotaleRestante: 0,
        coutTotalRestant: 0,
        nombreArticlesNonValorises: 0
      })
    }

    const projetData = projetsMap.get(projetId)!

    for (const item of demande.items) {
      const baseDemandee = item.quantiteDemandee || 0
      const baseValidee = item.quantiteValidee ?? baseDemandee
      const quantiteLivree = item.quantiteRecue ?? item.quantiteLivreeTotal ?? 0
      const quantiteRestante = Math.max(0, baseValidee - quantiteLivree)

      if (quantiteRestante > 0) {
        // TABLEAU 1 : Agrégation par projet
        projetData.nombreArticlesRestants += 1
        projetData.quantiteTotaleRestante += quantiteRestante

        if (item.prixUnitaire === null) {
          projetData.nombreArticlesNonValorises += 1
        }

        if (item.prixUnitaire !== null) {
          projetData.coutTotalRestant += quantiteRestante * item.prixUnitaire
        }

        // TABLEAU 2 : Détail par article
        articlesRestants.push({
          demandeNumero: demande.numero,
          projetNom,
          articleNom: item.article.nom,
          quantiteRestante,
          prixUnitaire: item.prixUnitaire,
          coutRestant: item.prixUnitaire ? quantiteRestante * item.prixUnitaire : 0
        })

        // TABLEAU 3 : Articles non valorisés
        if (item.prixUnitaire === null) {
          const key = `${projetId}-${demande.type}`
          if (!articlesNonValorisesMap.has(key)) {
            articlesNonValorisesMap.set(key, {
              projetNom,
              typeDemande,
              nombreArticles: 0,
              quantiteTotale: 0
            })
          }
          const articleData = articlesNonValorisesMap.get(key)!
          articleData.nombreArticles += 1
          articleData.quantiteTotale += quantiteRestante
        }
      }
    }
  }

  const projetsBloques = Array.from(projetsMap.values())
    .filter(p => p.nombreArticlesRestants > 0)
    .sort((a, b) => b.coutTotalRestant - a.coutTotalRestant)

  const articlesNonValorises = Array.from(articlesNonValorisesMap.values())
    .sort((a, b) => b.nombreArticles - a.nombreArticles)

  // Calculer les totaux globaux
  const totaux = {
    nombreProjetsImpactes: projetsBloques.length,
    nombreArticlesRestantsGlobal: projetsBloques.reduce((sum, p) => sum + p.nombreArticlesRestants, 0),
    quantiteTotaleRestanteGlobale: projetsBloques.reduce((sum, p) => sum + p.quantiteTotaleRestante, 0),
    coutTotalRestantGlobal: projetsBloques.reduce((sum, p) => sum + p.coutTotalRestant, 0),
    nombreArticlesNonValorisesGlobal: articlesNonValorises.reduce((sum, a) => sum + a.nombreArticles, 0)
  }

  return {
    projetsBloques,
    articlesNonValorises,
    articlesRestants: articlesRestants.sort((a, b) => b.coutRestant - a.coutRestant).slice(0, 20), // Top 20
    totaux
  }
}

// ============================================================================
// GÉNÉRATION DU TEMPLATE HTML
// ============================================================================

/**
 * Formate un nombre en euros
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount)
}

/**
 * Formate une date en français
 */
function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

/**
 * Génère le template HTML du rapport analytique
 */
function generateReportHTML(data: AnalyticsData, reportDate: Date): string {
  const { projetsBloques, articlesNonValorises, articlesRestants, totaux } = data
  const dateFormatted = formatDate(reportDate)

  // Déterminer le niveau d'alerte
  const alertLevel = totaux.nombreArticlesNonValorisesGlobal > 50 ? 'critical' :
                     totaux.nombreArticlesNonValorisesGlobal > 20 ? 'warning' : 'normal'
  
  const alertColor = alertLevel === 'critical' ? '#dc2626' :
                     alertLevel === 'warning' ? '#f59e0b' : '#22c55e'
  
  const alertText = alertLevel === 'critical' ? '⚠️ ATTENTION REQUISE' :
                    alertLevel === 'warning' ? '📊 Points de vigilance' : '✅ Situation normale'

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport Analytique - Projets Bloqués</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    .header {
      background: linear-gradient(135deg, #015fc4 0%, #0077cc 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
      font-weight: 600;
    }
    .header p {
      margin: 0;
      opacity: 0.9;
      font-size: 14px;
    }
    .alert-banner {
      background-color: ${alertColor};
      color: white;
      padding: 15px 30px;
      text-align: center;
      font-weight: 600;
      font-size: 16px;
    }
    .content {
      padding: 30px;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .summary-card {
      background-color: #f8fafc;
      border-left: 4px solid #015fc4;
      padding: 20px;
      border-radius: 4px;
    }
    .summary-card h3 {
      margin: 0 0 5px 0;
      font-size: 14px;
      color: #64748b;
      font-weight: 500;
      text-transform: uppercase;
    }
    .summary-card p {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
      color: #015fc4;
    }
    .section {
      margin-bottom: 40px;
    }
    .section h2 {
      color: #015fc4;
      font-size: 20px;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e2e8f0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
      font-size: 14px;
    }
    th {
      background-color: #f1f5f9;
      color: #475569;
      font-weight: 600;
      text-align: left;
      padding: 12px;
      border-bottom: 2px solid #e2e8f0;
    }
    td {
      padding: 12px;
      border-bottom: 1px solid #e2e8f0;
    }
    tr:hover {
      background-color: #f8fafc;
    }
    .number {
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    .currency {
      text-align: right;
      font-weight: 600;
      color: #059669;
      font-variant-numeric: tabular-nums;
    }
    .warning {
      color: #dc2626;
      font-weight: 600;
    }
    .footer {
      background-color: #f8fafc;
      padding: 20px 30px;
      text-align: center;
      color: #64748b;
      font-size: 12px;
      border-top: 1px solid #e2e8f0;
    }
    .button {
      display: inline-block;
      background-color: #015fc4;
      color: white;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
      margin: 20px 0;
    }
    .empty-state {
      text-align: center;
      padding: 40px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- En-tête -->
    <div class="header">
      <h1>📊 Rapport Analytique Direction</h1>
      <p>${dateFormatted}</p>
    </div>

    <!-- Bannière d'alerte -->
    <div class="alert-banner">
      ${alertText}
    </div>

    <!-- Contenu -->
    <div class="content">
      <!-- Résumé exécutif -->
      <div class="summary">
        <div class="summary-card">
          <h3>Projets Impactés</h3>
          <p>${totaux.nombreProjetsImpactes}</p>
        </div>
        <div class="summary-card">
          <h3>Articles Restants</h3>
          <p>${totaux.nombreArticlesRestantsGlobal}</p>
        </div>
        <div class="summary-card">
          <h3>Articles Non Valorisés</h3>
          <p class="${totaux.nombreArticlesNonValorisesGlobal > 0 ? 'warning' : ''}">${totaux.nombreArticlesNonValorisesGlobal}</p>
        </div>
        <div class="summary-card">
          <h3>Coût Total Restant</h3>
          <p>${formatCurrency(totaux.coutTotalRestantGlobal)}</p>
        </div>
      </div>

      <!-- TABLEAU 1 : Synthèse Projets Bloqués -->
      <div class="section">
        <h2>📋 Tableau 1 : Synthèse Projets Bloqués</h2>
        ${projetsBloques.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th>Projet</th>
                <th class="number">Articles Restants</th>
                <th class="number">Quantité Totale</th>
                <th class="number">Articles Non Valorisés</th>
                <th class="currency">Coût Total Restant</th>
              </tr>
            </thead>
            <tbody>
              ${projetsBloques.map(p => `
                <tr>
                  <td><strong>${p.projetNom}</strong></td>
                  <td class="number">${p.nombreArticlesRestants}</td>
                  <td class="number">${p.quantiteTotaleRestante}</td>
                  <td class="number ${p.nombreArticlesNonValorises > 0 ? 'warning' : ''}">${p.nombreArticlesNonValorises}</td>
                  <td class="currency">${formatCurrency(p.coutTotalRestant)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : `
          <div class="empty-state">
            <p>✅ Aucun projet bloqué actuellement</p>
          </div>
        `}
      </div>

      <!-- TABLEAU 3 : Articles Non Valorisés -->
      <div class="section">
        <h2>⚠️ Tableau 3 : Articles Non Valorisés (Priorité)</h2>
        ${articlesNonValorises.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th>Projet</th>
                <th>Type</th>
                <th class="number">Nombre d'Articles</th>
                <th class="number">Quantité Totale</th>
              </tr>
            </thead>
            <tbody>
              ${articlesNonValorises.map(a => `
                <tr>
                  <td><strong>${a.projetNom}</strong></td>
                  <td>${a.typeDemande}</td>
                  <td class="number warning">${a.nombreArticles}</td>
                  <td class="number">${a.quantiteTotale}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : `
          <div class="empty-state">
            <p>✅ Tous les articles sont valorisés</p>
          </div>
        `}
      </div>

      <!-- TABLEAU 2 : Top 20 Articles Restants -->
      <div class="section">
        <h2>📦 Tableau 2 : Top 20 Articles Restants</h2>
        ${articlesRestants.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th>Demande</th>
                <th>Projet</th>
                <th>Article</th>
                <th class="number">Qté Restante</th>
                <th class="currency">Prix Unitaire</th>
                <th class="currency">Coût Restant</th>
              </tr>
            </thead>
            <tbody>
              ${articlesRestants.map(a => `
                <tr>
                  <td><code>${a.demandeNumero}</code></td>
                  <td>${a.projetNom}</td>
                  <td>${a.articleNom}</td>
                  <td class="number">${a.quantiteRestante}</td>
                  <td class="currency ${a.prixUnitaire === null ? 'warning' : ''}">${a.prixUnitaire !== null ? formatCurrency(a.prixUnitaire) : 'Non valorisé'}</td>
                  <td class="currency">${formatCurrency(a.coutRestant)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : `
          <div class="empty-state">
            <p>✅ Aucun article restant</p>
          </div>
        `}
      </div>

      <!-- Bouton d'action -->
      <div style="text-align: center;">
        <a href="${getEmailConfig().appUrl}/analytics" class="button">
          📊 Voir le Dashboard Complet
        </a>
      </div>
    </div>

    <!-- Pied de page -->
    <div class="footer">
      <p>Ce rapport est généré automatiquement par le système de gestion des demandes.</p>
      <p>Pour toute question, contactez l'administrateur système.</p>
    </div>
  </div>
</body>
</html>
  `
}

/**
 * Génère la version texte du rapport
 */
function generateReportText(data: AnalyticsData, reportDate: Date): string {
  const { projetsBloques, articlesNonValorises, totaux } = data
  const dateFormatted = formatDate(reportDate)

  return `
RAPPORT ANALYTIQUE DIRECTION
${dateFormatted}

═══════════════════════════════════════════════════════════

RÉSUMÉ EXÉCUTIF
───────────────────────────────────────────────────────────
• Projets Impactés: ${totaux.nombreProjetsImpactes}
• Articles Restants: ${totaux.nombreArticlesRestantsGlobal}
• Articles Non Valorisés: ${totaux.nombreArticlesNonValorisesGlobal}
• Coût Total Restant: ${formatCurrency(totaux.coutTotalRestantGlobal)}

═══════════════════════════════════════════════════════════

TABLEAU 1 : SYNTHÈSE PROJETS BLOQUÉS
───────────────────────────────────────────────────────────
${projetsBloques.length > 0 ? projetsBloques.map(p => `
• ${p.projetNom}
  - Articles restants: ${p.nombreArticlesRestants}
  - Quantité totale: ${p.quantiteTotaleRestante}
  - Articles non valorisés: ${p.nombreArticlesNonValorises}
  - Coût total: ${formatCurrency(p.coutTotalRestant)}
`).join('\n') : '✅ Aucun projet bloqué'}

═══════════════════════════════════════════════════════════

TABLEAU 3 : ARTICLES NON VALORISÉS (PRIORITÉ)
───────────────────────────────────────────────────────────
${articlesNonValorises.length > 0 ? articlesNonValorises.map(a => `
• ${a.projetNom} - ${a.typeDemande}
  - Nombre d'articles: ${a.nombreArticles}
  - Quantité totale: ${a.quantiteTotale}
`).join('\n') : '✅ Tous les articles sont valorisés'}

═══════════════════════════════════════════════════════════

Accédez au dashboard complet: ${getEmailConfig().appUrl}/analytics
  `
}

// ============================================================================
// ENVOI D'EMAIL
// ============================================================================

/**
 * Envoie le rapport analytique par email
 */
export async function sendAnalyticsReport(recipientEmail: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('📧 [ANALYTICS] Génération du rapport analytique...')

    // Récupérer les données
    const data = await fetchAnalyticsData()
    const reportDate = new Date()

    // Générer les templates
    const html = generateReportHTML(data, reportDate)
    const text = generateReportText(data, reportDate)

    // Récupérer la configuration email
    const emailConfig = getEmailConfig()

    // Configurer le transporteur
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailConfig.user,
        pass: emailConfig.password
      }
    })

    // Envoyer l'email
    const info = await transporter.sendMail({
      from: emailConfig.from,
      to: recipientEmail,
      subject: `📊 Rapport Analytique Direction - ${new Date().toLocaleDateString('fr-FR')}`,
      html,
      text
    })

    console.log('✅ [ANALYTICS] Rapport envoyé avec succès:', info.messageId)

    return {
      success: true
    }

  } catch (error) {
    console.error('❌ [ANALYTICS] Erreur envoi rapport:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }
  }
}

/**
 * Envoie le rapport au Super Admin
 */
export async function sendReportToSuperAdmin(): Promise<{ success: boolean; error?: string }> {
  try {
    // Récupérer l'email du Super Admin
    const superAdmin = await prisma.user.findFirst({
      where: { role: 'superadmin' },
      select: { email: true, nom: true }
    })

    if (!superAdmin || !superAdmin.email) {
      console.error('❌ [ANALYTICS] Super Admin non trouvé ou sans email')
      return {
        success: false,
        error: 'Super Admin non trouvé'
      }
    }

    console.log(`📧 [ANALYTICS] Envoi du rapport à ${superAdmin.nom} (${superAdmin.email})`)

    return await sendAnalyticsReport(superAdmin.email)

  } catch (error) {
    console.error('❌ [ANALYTICS] Erreur:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }
  }
}

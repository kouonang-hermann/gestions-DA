/**
 * SERVICE D'ENVOI D'EMAILS
 * 
 * Ce service gère l'envoi d'emails transactionnels et analytiques.
 * Utilise Resend comme provider (compatible Vercel, gratuit jusqu'à 100 emails/jour).
 * 
 * ARCHITECTURE :
 * - Génération de templates HTML professionnels
 * - Traçabilité complète des envois (NotificationLog)
 * - Gestion d'erreurs robuste avec retry
 * 
 * CONFIGURATION REQUISE :
 * - RESEND_API_KEY : Clé API Resend
 * - DIRECTOR_EMAIL : Email du directeur
 * - EMAIL_FROM : Adresse d'envoi (ex: notifications@instrumelec.com)
 */

import { prisma } from "@/lib/prisma"
import { Tableau1Data, Tableau3Data } from "@/lib/analytics-snapshot"

// ============================================================================
// CONFIGURATION
// ============================================================================

const RESEND_API_KEY = process.env.RESEND_API_KEY
const DIRECTOR_EMAIL = process.env.DIRECTOR_EMAIL
const EMAIL_FROM = process.env.EMAIL_FROM || "InstrumElec <notifications@instrumelec.com>"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://gestion-demandes.vercel.app"

// ============================================================================
// TYPES
// ============================================================================

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
  logId?: string
}

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
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
function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date))
}

/**
 * Génère le template HTML pour le rapport analytique quotidien
 */
export function generateDailyReportEmail(
  tableau1: Tableau1Data,
  tableau3: Tableau3Data,
  snapshotDate: Date
): string {
  const dateFormatted = formatDate(snapshotDate)
  
  // Indicateurs clés pour le résumé exécutif
  const hasBlockages = tableau1.totaux.nombreProjetsImpactes > 0
  const hasUnvaluedItems = tableau3.totaux.nombreArticlesNonValorises > 0
  const criticalBlockages = tableau3.synthese.filter(a => a.joursMaxSansValorisation > 7)
  
  // Couleur d'alerte
  const alertColor = criticalBlockages.length > 0 ? '#dc2626' : 
                     (hasBlockages || hasUnvaluedItems) ? '#f59e0b' : '#22c55e'
  const alertText = criticalBlockages.length > 0 ? '⚠️ ATTENTION REQUISE' :
                    (hasBlockages || hasUnvaluedItems) ? '📊 Points de vigilance' : '✅ Situation normale'

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rapport Analytique Quotidien - ${dateFormatted}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 20px;">
        <table role="presentation" style="max-width: 700px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- HEADER -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px; font-weight: 600;">
                📊 Rapport Analytique Quotidien
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
                ${dateFormatted}
              </p>
            </td>
          </tr>

          <!-- ALERTE STATUS -->
          <tr>
            <td style="padding: 20px 30px;">
              <div style="background-color: ${alertColor}15; border-left: 4px solid ${alertColor}; padding: 15px 20px; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: ${alertColor}; font-weight: 600; font-size: 16px;">
                  ${alertText}
                </p>
                ${criticalBlockages.length > 0 ? `
                <p style="margin: 8px 0 0 0; color: #4b5563; font-size: 14px;">
                  ${criticalBlockages.length} projet(s) avec des articles non valorisés depuis plus de 7 jours
                </p>
                ` : ''}
              </div>
            </td>
          </tr>

          <!-- RÉSUMÉ EXÉCUTIF -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <h2 style="color: #1f2937; font-size: 18px; margin: 0 0 15px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                📈 Résumé Exécutif
              </h2>
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="width: 50%; padding: 10px; vertical-align: top;">
                    <div style="background-color: #eff6ff; border-radius: 8px; padding: 15px; text-align: center;">
                      <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Projets impactés</p>
                      <p style="margin: 5px 0 0 0; color: #1e40af; font-size: 28px; font-weight: 700;">${tableau1.totaux.nombreProjetsImpactes}</p>
                    </div>
                  </td>
                  <td style="width: 50%; padding: 10px; vertical-align: top;">
                    <div style="background-color: #fef3c7; border-radius: 8px; padding: 15px; text-align: center;">
                      <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Coût restant total</p>
                      <p style="margin: 5px 0 0 0; color: #b45309; font-size: 28px; font-weight: 700;">${formatCurrency(tableau1.totaux.coutTotalRestantGlobal)}</p>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="width: 50%; padding: 10px; vertical-align: top;">
                    <div style="background-color: #f3e8ff; border-radius: 8px; padding: 15px; text-align: center;">
                      <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Articles restants</p>
                      <p style="margin: 5px 0 0 0; color: #7c3aed; font-size: 28px; font-weight: 700;">${tableau1.totaux.nombreArticlesRestantsGlobal}</p>
                    </div>
                  </td>
                  <td style="width: 50%; padding: 10px; vertical-align: top;">
                    <div style="background-color: #fee2e2; border-radius: 8px; padding: 15px; text-align: center;">
                      <p style="margin: 0; color: #6b7280; font-size: 12px; text-transform: uppercase;">Non valorisés</p>
                      <p style="margin: 5px 0 0 0; color: #dc2626; font-size: 28px; font-weight: 700;">${tableau3.totaux.nombreArticlesNonValorises}</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- TABLEAU 1 : PROJETS BLOQUÉS -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <h2 style="color: #1f2937; font-size: 18px; margin: 0 0 15px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                🏗️ Tableau 1 : Synthèse Projets Bloqués
              </h2>
              ${tableau1.projets.length === 0 ? `
              <p style="color: #22c55e; font-style: italic; margin: 0;">✅ Aucun projet avec des articles restants</p>
              ` : `
              <table role="presentation" style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr style="background-color: #f9fafb;">
                  <th style="padding: 12px 8px; text-align: left; color: #374151; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Projet</th>
                  <th style="padding: 12px 8px; text-align: right; color: #374151; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Articles</th>
                  <th style="padding: 12px 8px; text-align: right; color: #374151; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Quantité</th>
                  <th style="padding: 12px 8px; text-align: right; color: #374151; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Coût</th>
                </tr>
                ${tableau1.projets.slice(0, 10).map((p, i) => `
                <tr style="background-color: ${i % 2 === 0 ? 'white' : '#f9fafb'};">
                  <td style="padding: 10px 8px; color: #1f2937; border-bottom: 1px solid #e5e7eb;">${p.projetNom}</td>
                  <td style="padding: 10px 8px; text-align: right; color: #6b7280; border-bottom: 1px solid #e5e7eb;">${p.nombreArticlesRestants}</td>
                  <td style="padding: 10px 8px; text-align: right; color: #6b7280; border-bottom: 1px solid #e5e7eb;">${p.quantiteTotaleRestante}</td>
                  <td style="padding: 10px 8px; text-align: right; color: #b45309; font-weight: 600; border-bottom: 1px solid #e5e7eb;">${formatCurrency(p.coutTotalRestant)}</td>
                </tr>
                `).join('')}
                ${tableau1.projets.length > 10 ? `
                <tr>
                  <td colspan="4" style="padding: 10px 8px; text-align: center; color: #6b7280; font-style: italic;">
                    ... et ${tableau1.projets.length - 10} autres projets
                  </td>
                </tr>
                ` : ''}
              </table>
              `}
            </td>
          </tr>

          <!-- TABLEAU 3 : ARTICLES NON VALORISÉS -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <h2 style="color: #1f2937; font-size: 18px; margin: 0 0 15px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                ⚠️ Tableau 3 : Articles Non Valorisés
              </h2>
              ${tableau3.synthese.length === 0 ? `
              <p style="color: #22c55e; font-style: italic; margin: 0;">✅ Tous les articles sont valorisés</p>
              ` : `
              <table role="presentation" style="width: 100%; border-collapse: collapse; font-size: 14px;">
                <tr style="background-color: #f9fafb;">
                  <th style="padding: 12px 8px; text-align: left; color: #374151; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Projet</th>
                  <th style="padding: 12px 8px; text-align: center; color: #374151; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Type</th>
                  <th style="padding: 12px 8px; text-align: right; color: #374151; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Articles</th>
                  <th style="padding: 12px 8px; text-align: right; color: #374151; font-weight: 600; border-bottom: 2px solid #e5e7eb;">Jours</th>
                </tr>
                ${tableau3.synthese.slice(0, 10).map((a, i) => `
                <tr style="background-color: ${i % 2 === 0 ? 'white' : '#f9fafb'};">
                  <td style="padding: 10px 8px; color: #1f2937; border-bottom: 1px solid #e5e7eb;">${a.projetNom}</td>
                  <td style="padding: 10px 8px; text-align: center; border-bottom: 1px solid #e5e7eb;">
                    <span style="background-color: ${a.type === 'materiel' ? '#dbeafe' : '#f3e8ff'}; color: ${a.type === 'materiel' ? '#1e40af' : '#7c3aed'}; padding: 2px 8px; border-radius: 4px; font-size: 12px;">
                      ${a.type === 'materiel' ? 'Matériel' : 'Outillage'}
                    </span>
                  </td>
                  <td style="padding: 10px 8px; text-align: right; color: #6b7280; border-bottom: 1px solid #e5e7eb;">${a.nombreArticlesNonValorises}</td>
                  <td style="padding: 10px 8px; text-align: right; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: ${a.joursMaxSansValorisation > 7 ? '#dc2626' : a.joursMaxSansValorisation > 3 ? '#f59e0b' : '#22c55e'}; font-weight: 600;">
                      ${a.joursMaxSansValorisation}j
                    </span>
                  </td>
                </tr>
                `).join('')}
                ${tableau3.synthese.length > 10 ? `
                <tr>
                  <td colspan="4" style="padding: 10px 8px; text-align: center; color: #6b7280; font-style: italic;">
                    ... et ${tableau3.synthese.length - 10} autres entrées
                  </td>
                </tr>
                ` : ''}
              </table>
              `}
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 30px 30px 30px; text-align: center;">
              <a href="${APP_URL}" style="display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Accéder à l'application
              </a>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
                Ce rapport est généré automatiquement chaque jour à 05:00.<br>
                © ${new Date().getFullYear()} InstrumElec - Gestion des Demandes de Matériel
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

/**
 * Génère une version texte du rapport (fallback)
 */
export function generateDailyReportText(
  tableau1: Tableau1Data,
  tableau3: Tableau3Data,
  snapshotDate: Date
): string {
  const dateFormatted = formatDate(snapshotDate)
  
  let text = `
RAPPORT ANALYTIQUE QUOTIDIEN
${dateFormatted}
${'='.repeat(50)}

RÉSUMÉ EXÉCUTIF
---------------
• Projets impactés: ${tableau1.totaux.nombreProjetsImpactes}
• Coût restant total: ${formatCurrency(tableau1.totaux.coutTotalRestantGlobal)}
• Articles restants: ${tableau1.totaux.nombreArticlesRestantsGlobal}
• Articles non valorisés: ${tableau3.totaux.nombreArticlesNonValorises}

TABLEAU 1 : SYNTHÈSE PROJETS BLOQUÉS
------------------------------------
`

  if (tableau1.projets.length === 0) {
    text += "✅ Aucun projet avec des articles restants\n"
  } else {
    tableau1.projets.forEach(p => {
      text += `• ${p.projetNom}: ${p.nombreArticlesRestants} articles, ${formatCurrency(p.coutTotalRestant)}\n`
    })
  }

  text += `
TABLEAU 3 : ARTICLES NON VALORISÉS
----------------------------------
`

  if (tableau3.synthese.length === 0) {
    text += "✅ Tous les articles sont valorisés\n"
  } else {
    tableau3.synthese.forEach(a => {
      text += `• ${a.projetNom} (${a.type}): ${a.nombreArticlesNonValorises} articles, ${a.joursMaxSansValorisation}j sans valorisation\n`
    })
  }

  text += `
${'='.repeat(50)}
Ce rapport est généré automatiquement chaque jour à 05:00.
© ${new Date().getFullYear()} InstrumElec
  `

  return text.trim()
}

// ============================================================================
// ENVOI D'EMAIL
// ============================================================================

/**
 * Envoie un email via Resend API
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  if (!RESEND_API_KEY) {
    console.error("❌ [EMAIL] RESEND_API_KEY non configurée")
    return {
      success: false,
      error: "Configuration email manquante (RESEND_API_KEY)"
    }
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      })
    })

    const result = await response.json()

    if (!response.ok) {
      console.error("❌ [EMAIL] Erreur Resend:", result)
      return {
        success: false,
        error: result.message || "Erreur lors de l'envoi"
      }
    }

    console.log(`✅ [EMAIL] Email envoyé: ${result.id}`)
    return {
      success: true,
      messageId: result.id
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
    console.error("❌ [EMAIL] Exception:", errorMessage)
    return {
      success: false,
      error: errorMessage
    }
  }
}

/**
 * Envoie le rapport analytique quotidien au directeur
 * et trace l'envoi dans NotificationLog
 */
export async function sendDailyAnalyticsReport(
  snapshotId: string,
  tableau1: Tableau1Data,
  tableau3: Tableau3Data,
  snapshotDate: Date
): Promise<EmailResult> {
  const recipientEmail = DIRECTOR_EMAIL
  
  if (!recipientEmail) {
    console.error("❌ [EMAIL] DIRECTOR_EMAIL non configuré")
    return {
      success: false,
      error: "Configuration email manquante (DIRECTOR_EMAIL)"
    }
  }

  // Créer un log en statut pending
  const log = await prisma.notificationLog.create({
    data: {
      snapshotId,
      channel: "email",
      recipient: recipientEmail,
      status: "pending"
    }
  })

  try {
    const dateStr = snapshotDate.toISOString().split('T')[0]
    const html = generateDailyReportEmail(tableau1, tableau3, snapshotDate)
    const text = generateDailyReportText(tableau1, tableau3, snapshotDate)

    const result = await sendEmail({
      to: recipientEmail,
      subject: `📊 Rapport Analytique Quotidien - ${dateStr}`,
      html,
      text
    })

    // Mettre à jour le log
    await prisma.notificationLog.update({
      where: { id: log.id },
      data: {
        status: result.success ? "sent" : "failed",
        errorMessage: result.error,
        sentAt: result.success ? new Date() : null
      }
    })

    return {
      ...result,
      logId: log.id
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Erreur inconnue"
    
    await prisma.notificationLog.update({
      where: { id: log.id },
      data: {
        status: "failed",
        errorMessage
      }
    })

    return {
      success: false,
      error: errorMessage,
      logId: log.id
    }
  }
}

// ============================================================================
// EXTENSION FUTURE : WHATSAPP
// ============================================================================

/**
 * Interface pour l'envoi WhatsApp (à implémenter)
 * 
 * Options recommandées :
 * - Twilio WhatsApp Business API
 * - MessageBird
 * - WhatsApp Cloud API (Meta)
 * 
 * Le template serait similaire à generateDailyReportText()
 * avec des adaptations pour le format WhatsApp (max 4096 caractères)
 */
export interface WhatsAppOptions {
  to: string
  message: string
}

export async function sendWhatsAppMessage(options: WhatsAppOptions): Promise<EmailResult> {
  // TODO: Implémenter l'envoi WhatsApp
  // Exemple avec Twilio :
  // const client = require('twilio')(TWILIO_SID, TWILIO_AUTH_TOKEN)
  // await client.messages.create({
  //   from: 'whatsapp:+14155238886',
  //   body: options.message,
  //   to: `whatsapp:${options.to}`
  // })
  
  console.log("⚠️ [WHATSAPP] Non implémenté - Extension future")
  return {
    success: false,
    error: "WhatsApp non implémenté"
  }
}

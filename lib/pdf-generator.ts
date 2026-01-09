/**
 * Générateur de PDF utilisant la méthode iframe isolé
 * Cette méthode évite complètement le problème oklch de Tailwind CSS 4
 * en créant un document HTML isolé avec ses propres styles CSS
 */

export interface PDFOptions {
  filename?: string
  format?: 'a4' | 'letter'
  orientation?: 'portrait' | 'landscape'
  margin?: number
}

/**
 * Génère un PDF pour une demande en utilisant un iframe isolé
 * Cette méthode est 100% compatible avec Tailwind CSS 4 et oklch
 */
export const generatePurchaseRequestPDF = async (
  demande: any,
  elementId: string = 'purchase-request-card'
): Promise<void> => {
  // Vérifier que nous sommes côté client
  if (typeof window === 'undefined') {
    throw new Error('La génération PDF ne peut être effectuée que côté client')
  }

  try {
    // Imports dynamiques pour éviter les problèmes SSR
    const jsPDF = (await import('jspdf')).default
    const html2canvas = (await import('html2canvas')).default

    // Créer un iframe isolé pour éviter l'héritage des styles globaux (notamment oklch)
    const iframe = document.createElement('iframe')
    iframe.style.position = 'absolute'
    iframe.style.left = '-9999px'
    iframe.style.width = '800px'
    iframe.style.height = '1200px'
    document.body.appendChild(iframe)

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!iframeDoc) throw new Error('Impossible de créer le document iframe')

    // Formater le statut pour l'affichage
    const getStatusLabel = (status: string) => {
      const statusMap: Record<string, string> = {
        'brouillon': 'Brouillon',
        'soumise': 'Soumise',
        'en_attente_validation_conducteur': 'En attente validation conducteur',
        'en_attente_validation_qhse': 'En attente validation QHSE',
        'en_attente_validation_responsable_travaux': 'En attente validation responsable travaux',
        'en_attente_validation_charge_affaire': 'En attente validation chargé d\'affaire',
        'en_attente_preparation_appro': 'En attente préparation appro',
        'en_attente_validation_logistique': 'En attente validation logistique',
        'en_attente_reception_livreur': 'En attente réception livreur',
        'en_attente_livraison': 'En cours de livraison',
        'en_attente_validation_finale_demandeur': 'En attente clôture demandeur',
        'confirmee_demandeur': 'Confirmée par demandeur',
        'cloturee': 'Clôturée',
        'rejetee': 'Rejetée'
      }
      return statusMap[status] || status
    }

    // Écrire le HTML complet dans l'iframe (sans héritage de styles oklch)
    iframeDoc.open()
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: Arial, sans-serif; 
            padding: 30px;
            background-color: #ffffff;
            color: #000000;
          }
          .header {
            text-align: center;
            margin-bottom: 25px;
            padding: 15px;
            background-color: #015fc4;
            color: #ffffff;
            border-radius: 8px;
          }
          .header h1 {
            margin: 0;
            font-size: 20px;
          }
          .header p {
            margin: 5px 0 0 0;
            font-size: 14px;
            opacity: 0.9;
          }
          .info-section {
            margin-bottom: 20px;
            padding: 15px;
            background-color: #f8f9fa;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .info-item {
            margin-bottom: 8px;
          }
          .info-label {
            font-weight: bold;
            color: #374151;
            font-size: 12px;
          }
          .info-value {
            color: #1f2937;
            font-size: 14px;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
          }
          .status-validated { background-color: #dcfce7; color: #166534; }
          .status-pending { background-color: #fef3c7; color: #92400e; }
          .status-rejected { background-color: #fee2e2; color: #991b1b; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            font-size: 12px;
          }
          th, td {
            border: 1px solid #d1d5db;
            padding: 10px;
            text-align: left;
            color: #000000;
          }
          th {
            background-color: #015fc4;
            color: #ffffff;
            font-weight: bold;
          }
          tr:nth-child(even) {
            background-color: #f9fafb;
          }
          .qty-delivered { color: #2563eb; font-weight: bold; }
          .qty-remaining { color: #ea580c; font-weight: bold; }
          .comments-section {
            margin-top: 20px;
            padding: 15px;
            background-color: #f8f9fa;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
          }
          .comments-title {
            font-weight: bold;
            color: #374151;
            margin-bottom: 10px;
          }
          .comment-item {
            padding: 8px;
            background-color: #ffffff;
            border-left: 3px solid #015fc4;
            margin-bottom: 8px;
            font-size: 12px;
          }
          .signature-section {
            margin-top: 40px;
            display: flex;
            justify-content: space-between;
          }
          .signature-box {
            width: 45%;
            border-top: 1px solid #333333;
            padding-top: 10px;
            text-align: center;
          }
          .signature-box p {
            margin: 5px 0;
            color: #000000;
            font-size: 12px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>DEMANDE ${demande.type === "materiel" ? "MATÉRIEL" : "OUTILLAGE"}</h1>
          <p>N° ${demande.numero}</p>
        </div>

        <div class="info-section">
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Demandeur</div>
              <div class="info-value">${demande.technicien?.prenom || ""} ${demande.technicien?.nom || "N/A"}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Projet</div>
              <div class="info-value">${demande.projet?.nom || "N/A"}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Date de création</div>
              <div class="info-value">${demande.dateCreation ? new Date(demande.dateCreation).toLocaleDateString("fr-FR") : "N/A"}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Date souhaitée</div>
              <div class="info-value">${demande.dateLivraisonSouhaitee ? new Date(demande.dateLivraisonSouhaitee).toLocaleDateString("fr-FR") : "N/A"}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Statut</div>
              <div class="info-value">
                <span class="status-badge ${
                  demande.status === 'cloturee' || demande.status === 'confirmee_demandeur' ? 'status-validated' :
                  demande.status === 'rejetee' ? 'status-rejected' : 'status-pending'
                }">${getStatusLabel(demande.status)}</span>
              </div>
            </div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Référence</th>
              <th>Désignation</th>
              <th>Unité</th>
              <th>Qté Dem.</th>
              <th>Qté Val.</th>
              <th>Qté Livrée</th>
              <th>Qté Restante</th>
            </tr>
          </thead>
          <tbody>
            ${demande.items?.map((item: any) => {
              const qteValidee = item.quantiteValidee || item.quantiteDemandee
              const qteLivree = item.quantiteSortie || item.quantiteRecue || 0
              const qteRestante = Math.max(0, qteValidee - qteLivree)
              return `
                <tr>
                  <td>${item.article?.reference || "----"}</td>
                  <td>${item.article?.nom || "Article inconnu"}</td>
                  <td>${item.article?.unite || "pièce"}</td>
                  <td>${item.quantiteDemandee}</td>
                  <td>${qteValidee}</td>
                  <td class="qty-delivered">${qteLivree}</td>
                  <td class="qty-remaining">${qteRestante}</td>
                </tr>
              `
            }).join("") || "<tr><td colspan='7'>Aucun article</td></tr>"}
          </tbody>
        </table>

        ${demande.commentaires || demande.rejetMotif ? `
          <div class="comments-section">
            <div class="comments-title">Commentaires</div>
            ${demande.commentaires ? `<div class="comment-item">Demandeur: ${demande.commentaires}</div>` : ""}
            ${demande.rejetMotif ? `<div class="comment-item" style="border-left-color: #ef4444;">Motif de rejet: ${demande.rejetMotif}</div>` : ""}
          </div>
        ` : ""}

        <div class="signature-section">
          <div class="signature-box">
            <p><strong>Demandeur</strong></p>
            <p>Nom: _____________________</p>
            <p>Date: _____________________</p>
            <p>Signature: _____________________</p>
          </div>
          <div class="signature-box">
            <p><strong>Valideur</strong></p>
            <p>Nom: _____________________</p>
            <p>Date: _____________________</p>
            <p>Signature: _____________________</p>
          </div>
        </div>

        <div class="footer">
          <p>Document généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}</p>
          <p>Gestion Demandes Matériel - InstrumElec</p>
        </div>
      </body>
      </html>
    `)
    iframeDoc.close()

    // Attendre que le contenu soit chargé
    await new Promise(resolve => setTimeout(resolve, 200))

    // Convertir en canvas puis en PDF
    const canvas = await html2canvas(iframeDoc.body, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    })

    // Supprimer l'iframe
    document.body.removeChild(iframe)

    // Créer le PDF
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = pdfWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let heightLeft = imgHeight
    let position = 0

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pdfHeight

    // Ajouter des pages supplémentaires si nécessaire
    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pdfHeight
    }

    // Télécharger le PDF
    const filename = `demande-${demande.numero}-${new Date().toISOString().split("T")[0]}.pdf`
    pdf.save(filename)

  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error)
    throw new Error(`Impossible de générer le PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
  }
}

/**
 * Fonction legacy pour compatibilité avec l'ancien code
 */
export const generatePDFFromElement = async (
  element: HTMLElement,
  options: PDFOptions = {}
): Promise<void> => {
  console.warn('generatePDFFromElement est obsolète, utilisez generatePurchaseRequestPDF')
  throw new Error('Utilisez generatePurchaseRequestPDF à la place')
}

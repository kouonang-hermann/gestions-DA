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
            padding: 15px;
            background-color: #ffffff;
            color: #000000;
          }
          .header {
            text-align: center;
            margin-bottom: 8px;
            border-bottom: 1px solid #333333;
            padding-bottom: 5px;
          }
          .header h1 {
            margin: 0;
            color: #333333;
            font-size: 14px;
            font-weight: bold;
          }
          .header p {
            margin: 3px 0;
            font-size: 11px;
            color: #000000;
          }
          .info-section {
            margin-bottom: 8px;
            padding: 5px 8px;
            background-color: #f5f5f5;
            border-radius: 3px;
          }
          .info-row {
            margin-bottom: 3px;
            color: #000000;
            font-size: 10px;
          }
          .info-row strong {
            display: inline-block;
            width: 150px;
            color: #000000;
            font-size: 10px;
          }
          .visa-section {
            margin: 8px 0;
            padding: 5px;
            background-color: #f9f9f9;
            border: 1px solid #dddddd;
            border-radius: 3px;
          }
          .visa-section h3 {
            margin: 0 0 5px 0;
            color: #333333;
            font-size: 11px;
            text-align: center;
            font-weight: bold;
          }
          .visa-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 3px;
          }
          .visa-table th,
          .visa-table td {
            border: 1px solid #dddddd;
            padding: 3px 5px;
            text-align: center;
            color: #000000;
            font-size: 9px;
          }
          .visa-table th {
            background-color: #2196F3;
            color: #ffffff;
            font-weight: bold;
            font-size: 9px;
          }
          .visa-table tr:nth-child(even) {
            background-color: #f5f5f5;
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
            margin-top: 10px;
          }
          th, td {
            border: 2px solid #333333;
            padding: 10px;
            text-align: left;
            color: #000000;
            font-size: 13px;
          }
          th {
            background-color: #4CAF50;
            color: #ffffff;
            font-weight: bold;
            font-size: 14px;
          }
          tr:nth-child(even) {
            background-color: #f9f9f9;
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
            margin-top: 20px;
            display: flex;
            justify-content: space-between;
          }
          .signature-box {
            width: 45%;
            border-top: 1px solid #333333;
            padding-top: 5px;
            text-align: center;
          }
          .signature-box p {
            margin: 3px 0;
            color: #000000;
            font-size: 10px;
          }
          .signature-box p strong {
            font-size: 11px;
          }
          .footer {
            margin-top: 15px;
            padding-top: 8px;
            border-top: 1px solid #dddddd;
            text-align: center;
            color: #666666;
            font-size: 8px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>DEMANDE D'ACHAT</h1>
          <p>Demande N° ${demande.numero}</p>
        </div>

        <div class="info-section">
          <div class="info-row"><strong>Type:</strong> ${demande.type === "materiel" ? "Matériel" : "Outillage"}</div>
          <div class="info-row"><strong>Projet:</strong> ${demande.projet?.nom || "N/A"}</div>
          <div class="info-row"><strong>Demandeur:</strong> ${demande.technicien?.nom || "N/A"} ${demande.technicien?.prenom || ""}</div>
          <div class="info-row"><strong>Date de création:</strong> ${demande.dateCreation ? new Date(demande.dateCreation).toLocaleDateString("fr-FR") : "N/A"}</div>
          <div class="info-row"><strong>Date de livraison:</strong> ${demande.dateLivraisonSouhaitee ? new Date(demande.dateLivraisonSouhaitee).toLocaleDateString("fr-FR") : "N/A"}</div>
        </div>

        <div class="visa-section">
          <h3>Visas et Signatures</h3>
          <table class="visa-table">
            <thead>
              <tr>
                <th>Rôle</th>
                <th>Nom</th>
                <th>Date</th>
                <th>Heure</th>
                <th>Visa</th>
              </tr>
            </thead>
            <tbody>
              ${demande.validationConducteur ? `
              <tr>
                <td>Conducteur Travaux</td>
                <td>_____________________</td>
                <td>${demande.validationConducteur.date ? new Date(demande.validationConducteur.date).toLocaleDateString("fr-FR") : "_____"}</td>
                <td>${demande.validationConducteur.date ? new Date(demande.validationConducteur.date).toLocaleTimeString("fr-FR", {hour: '2-digit', minute: '2-digit'}) : "_____"}</td>
                <td>✓</td>
              </tr>
              ` : `
              <tr>
                <td>Conducteur Travaux</td>
                <td>_____________________</td>
                <td>_____________________</td>
                <td>_____________________</td>
                <td></td>
              </tr>
              `}
              ${demande.validationResponsableTravaux ? `
              <tr>
                <td>Responsable Travaux</td>
                <td>_____________________</td>
                <td>${demande.validationResponsableTravaux.date ? new Date(demande.validationResponsableTravaux.date).toLocaleDateString("fr-FR") : "_____"}</td>
                <td>${demande.validationResponsableTravaux.date ? new Date(demande.validationResponsableTravaux.date).toLocaleTimeString("fr-FR", {hour: '2-digit', minute: '2-digit'}) : "_____"}</td>
                <td>✓</td>
              </tr>
              ` : `
              <tr>
                <td>Responsable Travaux</td>
                <td>_____________________</td>
                <td>_____________________</td>
                <td>_____________________</td>
                <td></td>
              </tr>
              `}
              ${demande.validationChargeAffaire ? `
              <tr>
                <td>Chargé d'Affaire</td>
                <td>_____________________</td>
                <td>${demande.validationChargeAffaire.date ? new Date(demande.validationChargeAffaire.date).toLocaleDateString("fr-FR") : "_____"}</td>
                <td>${demande.validationChargeAffaire.date ? new Date(demande.validationChargeAffaire.date).toLocaleTimeString("fr-FR", {hour: '2-digit', minute: '2-digit'}) : "_____"}</td>
                <td>✓</td>
              </tr>
              ` : `
              <tr>
                <td>Chargé d'Affaire</td>
                <td>_____________________</td>
                <td>_____________________</td>
                <td>_____________________</td>
                <td></td>
              </tr>
              `}
            </tbody>
          </table>
        </div>

        <table>
          <thead>
            <tr>
              <th>Article</th>
              <th>Référence</th>
              <th>Unité</th>
              <th>Qté Dem.</th>
              <th>Qté Val.</th>
              <th>Commentaire</th>
            </tr>
          </thead>
          <tbody>
            ${demande.items?.map((item: any) => {
              const qteValidee = item.quantiteValidee || item.quantiteDemandee
              return `
                <tr>
                  <td>${item.article?.nom || "N/A"}</td>
                  <td>${item.article?.reference || "N/A"}</td>
                  <td>${item.article?.unite || "N/A"}</td>
                  <td>${item.quantiteDemandee}</td>
                  <td>${qteValidee}</td>
                  <td>${item.commentaire || ""}</td>
                </tr>
              `
            }).join("") || "<tr><td colspan='6'>Aucun article</td></tr>"}
          </tbody>
        </table>

        <div class="signature-section">
          <div class="signature-box">
            <p><strong>Préparé par (Appro)</strong></p>
            <p>Nom: _____________________</p>
            <p>Date: _____________________</p>
            <p>Signature: _____________________</p>
          </div>
          <div class="signature-box">
            <p><strong>Reçu par (Livreur)</strong></p>
            <p>Nom: _____________________</p>
            <p>Date: _____________________</p>
            <p>Signature: _____________________</p>
          </div>
        </div>

        <div class="footer">
          <p>Document généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}</p>
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

    // Définir les marges (en mm)
    const marginLeft = 10
    const marginRight = 10
    const marginTop = 10
    const marginBottom = 10

    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    
    // Calculer la largeur et hauteur disponibles après marges
    const availableWidth = pdfWidth - marginLeft - marginRight
    const availableHeight = pdfHeight - marginTop - marginBottom
    
    // Calculer les dimensions de l'image en respectant les marges
    const imgWidth = availableWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let heightLeft = imgHeight
    let position = 0

    // Première page avec marges
    pdf.addImage(imgData, 'PNG', marginLeft, marginTop, imgWidth, imgHeight)
    heightLeft -= availableHeight

    // Ajouter des pages supplémentaires si nécessaire
    while (heightLeft > 0) {
      pdf.addPage()
      // Calculer la position négative pour continuer l'image
      position = -(imgHeight - heightLeft)
      // Ajouter les marges pour créer un vrai espace en haut de chaque page
      pdf.addImage(imgData, 'PNG', marginLeft, position + marginTop, imgWidth, imgHeight)
      heightLeft -= availableHeight
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

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
            padding: 20px;
            background-color: #ffffff;
            color: #000000;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 3px solid #4CAF50;
            padding-bottom: 10px;
          }
          .header h1 {
            color: #4CAF50;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .header p {
            font-size: 14px;
            color: #666666;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
          }
          .info-box {
            padding: 10px;
            background-color: #f0f9ff;
            border-left: 4px solid #4CAF50;
            border-radius: 4px;
          }
          .info-box strong {
            display: block;
            color: #4CAF50;
            font-size: 11px;
            margin-bottom: 5px;
          }
          .info-box span {
            color: #000000;
            font-size: 13px;
          }
          .visa-section {
            margin: 20px 0;
            padding: 15px;
            background-color: #f9f9f9;
            border: 2px solid #4CAF50;
            border-radius: 4px;
          }
          .visa-section h3 {
            margin: 0 0 15px 0;
            color: #4CAF50;
            font-size: 16px;
            text-align: center;
            font-weight: bold;
            border-bottom: 1px solid #cccccc;
            padding-bottom: 10px;
          }
          .visa-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          .visa-table th,
          .visa-table td {
            border: 2px solid #333333;
            padding: 8px;
            text-align: center;
            color: #000000;
            font-size: 11px;
          }
          .visa-table th {
            background-color: #4CAF50;
            color: #ffffff;
            font-weight: bold;
            font-size: 12px;
          }
          .visa-table tr:nth-child(even) {
            background-color: #f0f9ff;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            border: 2px solid #333333;
            padding: 12px;
            text-align: left;
            color: #000000;
            font-size: 12px;
          }
          th {
            background-color: #4CAF50;
            color: #ffffff;
            font-weight: bold;
            font-size: 13px;
          }
          tr:nth-child(even) {
            background-color: #f0f9ff;
          }
          .signature-section {
            margin-top: 40px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 30px;
          }
          .signature-box {
            border: 2px solid #333333;
            padding: 15px;
            border-radius: 4px;
            min-height: 120px;
          }
          .signature-box h3 {
            color: #4CAF50;
            font-size: 14px;
            margin-bottom: 15px;
            border-bottom: 1px solid #cccccc;
            padding-bottom: 5px;
          }
          .signature-box p {
            margin: 8px 0;
            color: #000000;
            font-size: 12px;
          }
          .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 2px solid #cccccc;
            text-align: center;
            color: #666666;
            font-size: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>DEMANDE D'ACHAT</h1>
          <p>N° ${demande.numero}</p>
        </div>

        <div class="info-grid">
          <div class="info-box">
            <strong>PROJET</strong>
            <span>${demande.projet?.nom || "N/A"}</span>
          </div>
          <div class="info-box">
            <strong>DATE DE CRÉATION</strong>
            <span>${demande.dateCreation ? new Date(demande.dateCreation).toLocaleDateString("fr-FR") : "N/A"}</span>
          </div>
          <div class="info-box">
            <strong>DEMANDEUR</strong>
            <span>${demande.technicien?.prenom || ""} ${demande.technicien?.nom || "N/A"}</span>
          </div>
          <div class="info-box">
            <strong>TYPE</strong>
            <span>${demande.type === "materiel" ? "Matériel" : "Outillage"}</span>
          </div>
          <div class="info-box">
            <strong>DATE DE LIVRAISON SOUHAITÉE</strong>
            <span>${demande.dateLivraisonSouhaitee ? new Date(demande.dateLivraisonSouhaitee).toLocaleDateString("fr-FR") : "N/A"}</span>
          </div>
          <div class="info-box">
            <strong>STATUT</strong>
            <span>${getStatusLabel(demande.status)}</span>
          </div>
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
                <td>${demande.validationConducteur.user ? `${demande.validationConducteur.user.prenom} ${demande.validationConducteur.user.nom}` : "_____________________"}</td>
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
                <td>${demande.validationResponsableTravaux.user ? `${demande.validationResponsableTravaux.user.prenom} ${demande.validationResponsableTravaux.user.nom}` : "_____________________"}</td>
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
                <td>${demande.validationChargeAffaire.user ? `${demande.validationChargeAffaire.user.prenom} ${demande.validationChargeAffaire.user.nom}` : "_____________________"}</td>
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
              <th>Désignation</th>
              <th>Référence</th>
              <th>Unité</th>
              <th>Qté Demandée</th>
              <th>Qté Validée</th>
              <th>Observation</th>
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
                  <td style="font-weight: bold; color: #4CAF50;">${item.quantiteDemandee}</td>
                  <td style="font-weight: bold; color: #015fc4;">${qteValidee}</td>
                  <td>${item.commentaire || ""}</td>
                </tr>
              `
            }).join("") || "<tr><td colspan='6'>Aucun article</td></tr>"}
          </tbody>
        </table>

        <div class="signature-section">
          <div class="signature-box">
            <h3>Préparé par (Appro/Logistique)</h3>
            <p>Nom: ${demande.sortieAppro?.user ? `${demande.sortieAppro.user.prenom} ${demande.sortieAppro.user.nom}` : "_____________________________"}</p>
            <p>Date: ${demande.sortieAppro?.date ? new Date(demande.sortieAppro.date).toLocaleDateString("fr-FR") : "_____________________________"}</p>
            <p>Signature: ${demande.sortieAppro ? "✓" : "_____________________________"}</p>
          </div>
          <div class="signature-box">
            <h3>Reçu par (Livreur)</h3>
            <p>Nom: ${demande.livreurAssigne ? `${demande.livreurAssigne.prenom} ${demande.livreurAssigne.nom}` : "_____________________________"}</p>
            <p>Date: ${demande.dateReceptionLivreur ? new Date(demande.dateReceptionLivreur).toLocaleDateString("fr-FR") : "_____________________________"}</p>
            <p>Signature: ${demande.dateReceptionLivreur ? "✓" : "_____________________________"}</p>
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
 * Génère un Bon de Livraison (Bordereau de livraison)
 */
export const generateBonLivraisonPDF = async (demande: any): Promise<void> => {
  if (typeof window === 'undefined') {
    throw new Error('La génération PDF ne peut être effectuée que côté client')
  }

  try {
    const jsPDF = (await import('jspdf')).default
    const html2canvas = (await import('html2canvas')).default

    // Générer un numéro de bordereau de livraison comptabilisé par projet
    const year = new Date().getFullYear()
    const typePrefix = demande.type === "materiel" ? "BL-M" : "BL-O"
    const projetCode = demande.projet?.nom ? demande.projet.nom.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '') : "XXX"
    
    // Extraire le numéro séquentiel du numéro de demande (derniers 4 chiffres)
    const demandeNumMatch = demande.numero.match(/(\d{4})(?:-\d+)?$/)
    const sequenceNumber = demandeNumMatch ? demandeNumMatch[1] : "0001"
    
    // Format du bordereau : BL-M-2026-PRO-0001 ou BL-O-2026-PRO-0001
    const bordereauNumber = `${typePrefix}-${year}-${projetCode}-${sequenceNumber}`

    const iframe = document.createElement('iframe')
    iframe.style.position = 'absolute'
    iframe.style.left = '-9999px'
    iframe.style.width = '800px'
    iframe.style.height = '1200px'
    document.body.appendChild(iframe)

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!iframeDoc) throw new Error('Impossible de créer le document iframe')

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
            padding: 25px;
            background-color: #ffffff;
            color: #000000;
            font-size: 11px;
          }
          .company-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #000000;
          }
          .logo-section {
            width: 120px;
          }
          .logo-section img {
            width: 100%;
            height: auto;
          }
          .company-info {
            flex: 1;
            text-align: center;
            font-size: 9px;
            line-height: 1.5;
          }
          .company-info strong {
            font-size: 10px;
            display: block;
            margin-bottom: 3px;
          }
          .document-header {
            text-align: center;
            margin: 20px 0;
            position: relative;
          }
          .document-header h1 {
            font-size: 18px;
            font-weight: bold;
            color: #000000;
            margin-bottom: 10px;
          }
          .document-number {
            position: absolute;
            right: 0;
            top: 0;
            color: #ff0000;
            font-size: 16px;
            font-weight: bold;
          }
          .document-date {
            text-align: right;
            font-size: 10px;
            margin-bottom: 15px;
          }
          .client-section {
            margin-bottom: 15px;
            font-size: 10px;
          }
          .client-section p {
            margin: 3px 0;
          }
          .bon-commande {
            margin: 10px 0;
            font-size: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
          }
          th, td {
            border: 1px solid #000000;
            padding: 6px 4px;
            font-size: 9px;
          }
          th {
            background-color: #ffffff;
            color: #000000;
            font-weight: bold;
            text-align: center;
          }
          td {
            min-height: 20px;
          }
          .col-item { width: 5%; text-align: center; }
          .col-ref { width: 12%; }
          .col-design { width: 38%; }
          .col-unit { width: 8%; text-align: center; }
          .col-qty { width: 10%; text-align: center; }
          .col-obs { width: 27%; }
          .empty-row td {
            height: 25px;
          }
          .signature-footer {
            margin-top: 25px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 10px;
          }
          .signature-item {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .checkbox {
            width: 14px;
            height: 14px;
            border: 1px solid #000000;
            display: inline-block;
          }
          .company-footer {
            text-align: right;
            font-size: 9px;
            font-style: italic;
            margin-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="company-header">
          <div class="logo-section">
            <img src="/instrumelec-logo.png" alt="InstrumElec Cameroun" />
          </div>
          <div class="company-info">
            <strong>Télécons - Energie - Industrie - Tertiaire</strong>
            <div>InstrumElec Sarl - Siège social et Direction technique</div>
            <div>Rue Sylvani (Rue Barnabé) Akwa - B.P. 6161 Douala-Cameroun</div>
            <div>Tél.: (+237) 33 42 71 71 - (+237) 33 42 71 72</div>
            <div>Fax: (+237) 33 43 70 36 - Email: info@instrumelec.com</div>
            <div>Contribuable: M1205000188GH - RCCM:A2003VB0003613</div>
          </div>
        </div>

        <div class="document-header">
          <h1>BORDEREAU DE LIVRAISON</h1>
          <div class="document-number">N° ${bordereauNumber}</div>
        </div>

        <div class="document-date">
          Douala, le ${new Date().toLocaleDateString("fr-FR")}
        </div>

        <div class="client-section">
          <p><strong>Client :</strong> ${demande.technicien?.prenom || ""} ${demande.technicien?.nom || "N/A"}</p>
        </div>

        <div class="bon-commande">
          <p><strong>Bon de Commande :</strong> ${demande.projet?.nom || "N/A"} du ${demande.dateCreation ? new Date(demande.dateCreation).toLocaleDateString("fr-FR") : "N/A"}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th class="col-item">Item</th>
              <th class="col-ref">Référence</th>
              <th class="col-design">Désignation</th>
              <th class="col-unit">Unit</th>
              <th class="col-qty">Quantité</th>
              <th class="col-obs">Observations</th>
            </tr>
          </thead>
          <tbody>
            ${demande.items?.map((item: any, index: number) => {
              const qteLivree = item.quantiteLivree || item.quantiteValidee || item.quantiteDemandee
              return `
                <tr>
                  <td class="col-item">${index + 1}</td>
                  <td class="col-ref">${item.article?.reference || "-"}</td>
                  <td class="col-design">${item.article?.nom || "N/A"}</td>
                  <td class="col-unit">${item.article?.unite || "-"}</td>
                  <td class="col-qty">${qteLivree}</td>
                  <td class="col-obs">${item.commentaire || ""}</td>
                </tr>
              `
            }).join("") || ""}
            ${Array.from({ length: Math.max(0, 15 - (demande.items?.length || 0)) }, (_, i) => `
              <tr class="empty-row">
                <td class="col-item"></td>
                <td class="col-ref"></td>
                <td class="col-design"></td>
                <td class="col-unit"></td>
                <td class="col-qty"></td>
                <td class="col-obs"></td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div class="signature-footer">
          <div class="signature-item">
            <span>Le client_____________</span>
          </div>
          <div class="signature-item">
            <span>Livraison partielle</span>
            <span class="checkbox"></span>
          </div>
          <div class="signature-item">
            <span>Livraison complète</span>
            <span class="checkbox"></span>
          </div>
          <div class="company-footer">
            <strong>InstrumElec</strong>
          </div>
        </div>
      </body>
      </html>
    `)
    iframeDoc.close()

    await new Promise(resolve => setTimeout(resolve, 200))

    const canvas = await html2canvas(iframeDoc.body, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    })

    document.body.removeChild(iframe)

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const marginLeft = 10
    const marginRight = 10
    const marginTop = 10
    const marginBottom = 10

    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    
    const availableWidth = pdfWidth - marginLeft - marginRight
    const availableHeight = pdfHeight - marginTop - marginBottom
    
    const imgWidth = availableWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let heightLeft = imgHeight
    let position = 0

    pdf.addImage(imgData, 'PNG', marginLeft, marginTop, imgWidth, imgHeight)
    heightLeft -= availableHeight

    while (heightLeft > 0) {
      pdf.addPage()
      position = -(imgHeight - heightLeft)
      pdf.addImage(imgData, 'PNG', marginLeft, position + marginTop, imgWidth, imgHeight)
      heightLeft -= availableHeight
    }

    const filename = `bon-livraison-${demande.numero}-${new Date().toISOString().split("T")[0]}.pdf`
    pdf.save(filename)

  } catch (error) {
    console.error('Erreur lors de la génération du Bon de Livraison:', error)
    throw new Error(`Impossible de générer le Bon de Livraison: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
  }
}

/**
 * Génère un Bon de Sortie Matériel
 */
export const generateBonSortiePDF = async (demande: any): Promise<void> => {
  if (typeof window === 'undefined') {
    throw new Error('La génération PDF ne peut être effectuée que côté client')
  }

  try {
    const jsPDF = (await import('jspdf')).default
    const html2canvas = (await import('html2canvas')).default

    // Générer un numéro de bon de sortie comptabilisé par projet
    const year = new Date().getFullYear()
    const typePrefix = demande.type === "materiel" ? "BS-M" : "BS-O"
    const projetCode = demande.projet?.nom ? demande.projet.nom.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '') : "XXX"
    
    // Extraire le numéro séquentiel du numéro de demande (derniers 4 chiffres)
    const demandeNumMatch = demande.numero.match(/(\d{4})(?:-\d+)?$/)
    const sequenceNumber = demandeNumMatch ? demandeNumMatch[1] : "0001"
    
    // Format du bon de sortie : BS-M-2026-PRO-0001 ou BS-O-2026-PRO-0001
    const bonSortieNumber = `${typePrefix}-${year}-${projetCode}-${sequenceNumber}`

    const iframe = document.createElement('iframe')
    iframe.style.position = 'absolute'
    iframe.style.left = '-9999px'
    iframe.style.width = '800px'
    iframe.style.height = '1200px'
    document.body.appendChild(iframe)

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!iframeDoc) throw new Error('Impossible de créer le document iframe')

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
            padding: 20px;
            background-color: #ffffff;
            color: #000000;
            font-size: 10px;
          }
          .document-header {
            border: 2px solid #000000;
            margin-bottom: 15px;
          }
          .header-row {
            display: flex;
            border-bottom: 1px solid #000000;
          }
          .header-logo {
            width: 120px;
            border-right: 1px solid #000000;
            padding: 10px;
          }
          .header-logo img {
            width: 100%;
            height: auto;
          }
          .header-info {
            flex: 1;
            display: flex;
          }
          .header-left {
            flex: 1;
            background-color: #cccccc;
            padding: 8px;
            border-right: 1px solid #000000;
          }
          .header-left div {
            margin: 2px 0;
            font-size: 9px;
          }
          .header-right {
            width: 150px;
            background-color: #cccccc;
            padding: 8px;
          }
          .header-right div {
            margin: 2px 0;
            font-size: 9px;
          }
          .title-row {
            background-color: #ffffff;
            padding: 10px;
            text-align: center;
          }
          .title-row h1 {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .title-row .numero {
            color: #ff0000;
            font-size: 14px;
            font-weight: bold;
          }
          .info-section {
            margin: 15px 0;
            font-size: 10px;
          }
          .info-row {
            display: flex;
            margin: 5px 0;
          }
          .info-label {
            width: 120px;
            font-weight: bold;
          }
          .info-value {
            flex: 1;
            border-bottom: 1px solid #000000;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
          }
          th, td {
            border: 1px solid #000000;
            padding: 6px 4px;
            font-size: 9px;
          }
          th {
            background-color: #cccccc;
            color: #000000;
            font-weight: bold;
            text-align: center;
          }
          .col-num { width: 5%; text-align: center; }
          .col-design { width: 50%; }
          .col-unit { width: 8%; text-align: center; }
          .col-qty { width: 10%; text-align: center; }
          .empty-row td {
            height: 25px;
          }
          .signature-footer {
            margin-top: 20px;
            display: flex;
            justify-content: space-between;
            font-size: 9px;
          }
          .signature-item {
            text-align: center;
            padding: 10px;
          }
          .signature-item div {
            margin: 5px 0;
          }
          .signature-line {
            border-bottom: 1px solid #000000;
            width: 150px;
            margin: 10px auto;
            height: 40px;
          }
          .footer-text {
            text-align: center;
            margin-top: 20px;
            font-size: 10px;
            color: #0066cc;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="document-header">
          <div class="header-row">
            <div class="header-logo">
              <img src="/instrumelec-logo.png" alt="InstrumElec" />
            </div>
            <div class="header-info">
              <div class="header-left">
                <div><strong>ASSURANCE - QUALITE</strong></div>
                <div>FORMULAIRE D'ENREGISTREMENT</div>
              </div>
              <div class="header-right">
                <div>Réf : DPM/01/PRO2/FE/04</div>
                <div>VERSION : C</div>
                <div>Date de création : 08 Juin 2013</div>
              </div>
            </div>
          </div>
          <div class="title-row">
            <h1>Bon de Sortie Matériel</h1>
            <div class="numero">N° ${bonSortieNumber}</div>
          </div>
        </div>

        <div class="info-section">
          <div class="info-row">
            <div class="info-label">Date :</div>
            <div class="info-value">${new Date().toLocaleDateString("fr-FR")}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Destination :</div>
            <div class="info-value">${demande.technicien?.prenom || ""} ${demande.technicien?.nom || ""}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Client / Projet :</div>
            <div class="info-value">${demande.projet?.nom || ""}</div>
          </div>
          <div class="info-row">
            <div class="info-label">Code Affaire :</div>
            <div class="info-value">${demande.numero || ""}</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th class="col-num">N°</th>
              <th class="col-design">Désignation</th>
              <th class="col-unit">U</th>
              <th class="col-qty">Qte</th>
            </tr>
          </thead>
          <tbody>
            ${demande.items?.map((item: any, index: number) => {
              const qteSortie = item.quantiteValidee || item.quantiteDemandee
              return `
                <tr>
                  <td class="col-num">${index + 1}</td>
                  <td class="col-design">${item.article?.nom || "N/A"}</td>
                  <td class="col-unit">${item.article?.unite || "-"}</td>
                  <td class="col-qty">${qteSortie}</td>
                </tr>
              `
            }).join("") || ""}
            ${Array.from({ length: Math.max(0, 20 - (demande.items?.length || 0)) }, (_, i) => `
              <tr class="empty-row">
                <td class="col-num"></td>
                <td class="col-design"></td>
                <td class="col-unit"></td>
                <td class="col-qty"></td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <div class="signature-footer">
          <div class="signature-item">
            <div><strong>Demandeur</strong></div>
            <div class="signature-line"></div>
          </div>
          <div class="signature-item">
            <div><strong>Resp Appro</strong></div>
            <div class="signature-line"></div>
          </div>
          <div class="signature-item">
            <div><strong>Magasinier</strong></div>
            <div class="signature-line"></div>
          </div>
          <div class="signature-item">
            <div><strong>Transporteur</strong></div>
            <div class="signature-line"></div>
          </div>
          <div class="signature-item">
            <div><strong>Site de Contrôle</strong></div>
            <div class="signature-line"></div>
          </div>
        </div>

        <div class="footer-text">
          <strong>InstrumElec</strong><br>
          SORTIE MAGASIN
        </div>
      </body>
      </html>
    `)
    iframeDoc.close()

    await new Promise(resolve => setTimeout(resolve, 200))

    const canvas = await html2canvas(iframeDoc.body, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    })

    document.body.removeChild(iframe)

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    const marginLeft = 10
    const marginRight = 10
    const marginTop = 10
    const marginBottom = 10

    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    
    const availableWidth = pdfWidth - marginLeft - marginRight
    const availableHeight = pdfHeight - marginTop - marginBottom
    
    const imgWidth = availableWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let heightLeft = imgHeight
    let position = 0

    pdf.addImage(imgData, 'PNG', marginLeft, marginTop, imgWidth, imgHeight)
    heightLeft -= availableHeight

    while (heightLeft > 0) {
      pdf.addPage()
      position = -(imgHeight - heightLeft)
      pdf.addImage(imgData, 'PNG', marginLeft, position + marginTop, imgWidth, imgHeight)
      heightLeft -= availableHeight
    }

    const filename = `bon-sortie-${demande.numero}-${new Date().toISOString().split("T")[0]}.pdf`
    pdf.save(filename)

  } catch (error) {
    console.error('Erreur lors de la génération du Bon de Sortie:', error)
    throw new Error(`Impossible de générer le Bon de Sortie: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
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

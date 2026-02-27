/**
 * Générateur de PDF pour les demandes de congés
 * Format basé sur le modèle fourni par l'utilisateur
 */

export interface CongeData {
  id: string
  numero: string
  employeId: string
  matricule: string
  anciennete: string
  responsableId: string
  responsableNom: string
  responsableTel: string
  responsableEmail: string
  typeConge: string
  autresPrecision?: string
  dateDebut: string
  dateFin: string
  nombreJours: number
  resteJours?: number
  contactPersonnelNom: string
  contactPersonnelTel: string
  contactAutreNom?: string
  contactAutreTel?: string
  status: string
  dateCreation: string
  dateSoumission?: string
  dateValidation?: string
  rejetMotif?: string
  signatureEmploye?: any
  signatureResponsable?: any
  signatureRH?: any
  signatureDG?: any
  employe?: {
    nom: string
    prenom: string
    email: string
    phone?: string
    service?: string
  }
}

export function generateCongeHTML(demande: CongeData): string {
  const dateJour = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  const typeCongeLabels: Record<string, string> = {
    annuel: 'Congés annuel',
    maladie: 'Congés maladie',
    parental: 'Congés de parental',
    recuperation: 'Congés sans solde',
    autres: 'Autres'
  }

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Demande de Congés - ${demande.numero}</title>
      <style>
        @page {
          size: A4;
          margin: 2cm;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Arial', sans-serif;
          font-size: 10pt;
          line-height: 1.4;
          color: #000;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .header {
          text-align: center;
          background-color: #d0d0d0;
          padding: 10px;
          margin-bottom: 20px;
        }
        
        .header h1 {
          font-size: 14pt;
          font-weight: bold;
        }
        
        .section {
          margin-bottom: 20px;
        }
        
        .section-title {
          background-color: #d0d0d0;
          padding: 8px;
          text-align: center;
          font-weight: bold;
          font-size: 11pt;
          margin-bottom: 15px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px 20px;
          margin-bottom: 15px;
        }
        
        .info-item {
          display: flex;
          align-items: baseline;
        }
        
        .info-label {
          font-size: 9pt;
          margin-right: 5px;
          white-space: nowrap;
        }
        
        .info-value {
          border-bottom: 1px dotted #000;
          flex: 1;
          min-height: 20px;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        
        th, td {
          border: 1px solid #000;
          padding: 8px;
          text-align: left;
        }
        
        th {
          background-color: #f0f0f0;
          font-weight: bold;
          font-size: 9pt;
        }
        
        td {
          font-size: 9pt;
          min-height: 30px;
        }
        
        .signature-section {
          margin-top: 30px;
        }
        
        .signature-box {
          background-color: #e0e0e0;
          padding: 40px 10px;
          margin-bottom: 10px;
          min-height: 60px;
          border: 1px solid #999;
        }
        
        .signature-label {
          font-size: 9pt;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 8pt;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- En-tête -->
        <div class="header">
          <h1>Demande de Congés</h1>
        </div>
        
        <!-- Informations employé et responsable -->
        <div class="section">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Date du jour:</span>
              <span class="info-value">${dateJour}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Heure de la demande:</span>
              <span class="info-value">${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            
            <div class="info-item">
              <span class="info-label">Employé:</span>
              <span class="info-value">${demande.employe?.nom || ''} ${demande.employe?.prenom || ''}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Resp. hiérarchique:</span>
              <span class="info-value">${demande.responsableNom}</span>
            </div>
            
            <div class="info-item">
              <span class="info-label">Matricule:</span>
              <span class="info-value">${demande.matricule}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Nom:</span>
              <span class="info-value">${demande.responsableNom}</span>
            </div>
            
            <div class="info-item">
              <span class="info-label">Service:</span>
              <span class="info-value">${demande.employe?.service || ''}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Numero téléphone:</span>
              <span class="info-value">${demande.responsableTel}</span>
            </div>
            
            <div class="info-item">
              <span class="info-label">Numero tel:</span>
              <span class="info-value">${demande.employe?.phone || ''}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Adresse email:</span>
              <span class="info-value">${demande.responsableEmail}</span>
            </div>
            
            <div class="info-item">
              <span class="info-label">Adresse emails:</span>
              <span class="info-value">${demande.employe?.email || ''}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Ancienneté dans la société:</span>
              <span class="info-value">${demande.anciennete}</span>
            </div>
          </div>
        </div>
        
        <!-- Congés disponibles -->
        <div class="section">
          <div class="section-title">Congés disponibles</div>
          <table>
            <thead>
              <tr>
                <th>Type de congés</th>
                <th>Date de début</th>
                <th>Date de fin</th>
                <th>Reste de jours</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${typeCongeLabels[demande.typeConge] || demande.typeConge}</td>
                <td>${demande.dateDebut}</td>
                <td>${demande.dateFin}</td>
                <td>${demande.resteJours !== null && demande.resteJours !== undefined ? demande.resteJours : ''}</td>
              </tr>
              <tr>
                <td>Congés maladie</td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>Congés de parental</td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>congés sans solde</td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
              <tr>
                <td>Autres</td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Contacts en cas d'urgence -->
        <div class="section">
          <div class="section-title">Contacts en cas d'urgence</div>
          <div class="info-grid">
            <div>
              <div class="info-item" style="margin-bottom: 10px;">
                <span class="info-label">Contact personnel:</span>
              </div>
              <div class="info-item" style="margin-bottom: 10px;">
                <span class="info-label">Nom:</span>
                <span class="info-value">${demande.contactPersonnelNom}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Numero tel:</span>
                <span class="info-value">${demande.contactPersonnelTel}</span>
              </div>
            </div>
            
            <div>
              <div class="info-item" style="margin-bottom: 10px;">
                <span class="info-label">Autre Contact:</span>
              </div>
              <div class="info-item" style="margin-bottom: 10px;">
                <span class="info-label">Nom:</span>
                <span class="info-value">${demande.contactAutreNom || ''}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Numero tel:</span>
                <span class="info-value">${demande.contactAutreTel || ''}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Signatures -->
        <div class="section signature-section">
          <div class="section-title">Signatures</div>
          
          <div class="signature-label">Employé</div>
          <div class="signature-box">
            ${demande.signatureEmploye ? 'Signé électroniquement le ' + (demande.dateSoumission || '') : ''}
          </div>
          
          <div class="signature-label">Responsable hiérarchique:</div>
          <div class="signature-box">
            ${demande.signatureResponsable ? 'Signé électroniquement' : ''}
          </div>
          
          <div class="signature-label">Responsable RH</div>
          <div class="signature-box">
            ${demande.signatureRH ? 'Signé électroniquement' : ''}
          </div>
          
          <div class="signature-label">Visa DG:</div>
          <div class="signature-box">
            ${demande.signatureDG ? 'Signé électroniquement' : ''}
          </div>
        </div>
        
        <!-- Pied de page -->
        <div class="footer">
          <p>Numéro de demande : ${demande.numero}</p>
          <p>Document généré le ${new Date().toLocaleString('fr-FR')}</p>
        </div>
      </div>
    </body>
    </html>
  `

  return html
}

/**
 * Télécharge la demande de congé en HTML (imprimable en PDF)
 */
export function downloadCongePDF(demande: CongeData) {
  const html = generateCongeHTML(demande)
  
  // Créer un blob avec le HTML
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  
  // Créer un lien de téléchargement
  const link = document.createElement('a')
  link.href = url
  link.download = `Demande_Conge_${demande.numero}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Alias pour downloadCongePDF - pour compatibilité
 */
export const generateCongePDF = downloadCongePDF

/**
 * Ancienne fonction - conservée pour compatibilité
 */
export async function generateCongePDF_OLD(demande: CongeData): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('La génération PDF ne peut être effectuée que côté client')
  }

  try {
    const jsPDF = (await import('jspdf')).default
    const html2canvas = (await import('html2canvas')).default

    // Créer un iframe isolé
    const iframe = document.createElement('iframe')
    iframe.style.position = 'absolute'
    iframe.style.left = '-9999px'
    iframe.style.width = '210mm'
    iframe.style.height = '297mm'
    document.body.appendChild(iframe)

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
    if (!iframeDoc) throw new Error('Impossible de créer le document iframe')

    const escapeHtml = (value: any) => {
      return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
    }

    const formatDate = (value?: any) => {
      if (!value) return ''
      const d = new Date(value)
      return isNaN(d.getTime()) ? '' : d.toLocaleDateString('fr-FR')
    }

    const getTypeCongeLabel = (type: string) => {
      const types: Record<string, string> = {
        annuel: "Congés annuel",
        maladie: "Congés maladie",
        parental: "Congés de parental",
        recuperation: "Congés pour récupération",
        autres: "Autres"
      }
      return types[type] || type
    }

    const getStatusLabel = (status: string) => {
      const statuses: Record<string, string> = {
        brouillon: "Brouillon",
        soumise: "Soumise",
        en_attente_validation_hierarchique: "En attente validation hiérarchique",
        en_attente_validation_rh: "En attente validation RH",
        en_attente_visa_dg: "En attente visa DG",
        approuvee: "Approuvée",
        rejetee: "Rejetée",
        annulee: "Annulée"
      }
      return statuses[status] || status
    }

    const employeNom = `${demande.employe?.prenom || ''} ${demande.employe?.nom || ''}`.trim()

    // Générer le HTML
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
            background: #ffffff;
            color: #000000;
            width: 210mm;
            min-height: 297mm;
            padding: 15mm;
            font-size: 11px;
            line-height: 1.4;
          }

          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
          }

          .header h1 {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 8px;
          }

          .header .numero {
            font-size: 14px;
            color: #333;
            font-weight: bold;
          }

          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border: 2px solid #000;
            border-radius: 4px;
            font-weight: bold;
            margin-top: 8px;
            font-size: 12px;
          }

          .section {
            margin-bottom: 20px;
            border: 1px solid #000;
            padding: 12px;
          }

          .section-title {
            font-size: 13px;
            font-weight: bold;
            margin-bottom: 10px;
            padding-bottom: 5px;
            border-bottom: 1px solid #666;
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
            font-size: 10px;
            color: #333;
            margin-bottom: 2px;
          }

          .info-value {
            font-size: 11px;
            padding: 4px;
            background: #f5f5f5;
            border-left: 3px solid #000;
          }

          .full-width {
            grid-column: 1 / -1;
          }

          .signature-section {
            margin-top: 30px;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
          }

          .signature-box {
            border: 1px solid #000;
            padding: 10px;
            min-height: 80px;
          }

          .signature-title {
            font-weight: bold;
            font-size: 11px;
            margin-bottom: 8px;
            text-align: center;
            border-bottom: 1px solid #000;
            padding-bottom: 4px;
          }

          .signature-content {
            font-size: 10px;
            text-align: center;
            margin-top: 10px;
          }

          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 9px;
            color: #666;
            border-top: 1px solid #ccc;
            padding-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>DEMANDE DE CONGÉ</h1>
          <div class="numero">N° ${escapeHtml(demande.numero)}</div>
          <div class="status-badge">${escapeHtml(getStatusLabel(demande.status))}</div>
        </div>

        <!-- Informations employé -->
        <div class="section">
          <div class="section-title">INFORMATIONS DE L'EMPLOYÉ</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Nom complet</div>
              <div class="info-value">${escapeHtml(employeNom)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Matricule</div>
              <div class="info-value">${escapeHtml(demande.matricule)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Ancienneté</div>
              <div class="info-value">${escapeHtml(demande.anciennete)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Email</div>
              <div class="info-value">${escapeHtml(demande.employe?.email || '')}</div>
            </div>
            ${demande.employe?.service ? `
            <div class="info-item">
              <div class="info-label">Service</div>
              <div class="info-value">${escapeHtml(demande.employe.service)}</div>
            </div>
            ` : ''}
          </div>
        </div>

        <!-- Détails du congé -->
        <div class="section">
          <div class="section-title">DÉTAILS DU CONGÉ</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Type de congé</div>
              <div class="info-value">${escapeHtml(getTypeCongeLabel(demande.typeConge))}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Nombre de jours</div>
              <div class="info-value">${escapeHtml(demande.nombreJours)} jour(s)</div>
            </div>
            <div class="info-item">
              <div class="info-label">Date de début</div>
              <div class="info-value">${escapeHtml(formatDate(demande.dateDebut))}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Date de fin</div>
              <div class="info-value">${escapeHtml(formatDate(demande.dateFin))}</div>
            </div>
            ${demande.resteJours !== undefined ? `
            <div class="info-item">
              <div class="info-label">Reste de jours</div>
              <div class="info-value">${escapeHtml(demande.resteJours)} jour(s)</div>
            </div>
            ` : ''}
            ${demande.autresPrecision ? `
            <div class="info-item full-width">
              <div class="info-label">Précisions</div>
              <div class="info-value">${escapeHtml(demande.autresPrecision)}</div>
            </div>
            ` : ''}
          </div>
        </div>

        <!-- Responsable hiérarchique -->
        <div class="section">
          <div class="section-title">RESPONSABLE HIÉRARCHIQUE</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Nom</div>
              <div class="info-value">${escapeHtml(demande.responsableNom)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Téléphone</div>
              <div class="info-value">${escapeHtml(demande.responsableTel)}</div>
            </div>
            <div class="info-item full-width">
              <div class="info-label">Email</div>
              <div class="info-value">${escapeHtml(demande.responsableEmail)}</div>
            </div>
          </div>
        </div>

        <!-- Contacts pendant l'absence -->
        <div class="section">
          <div class="section-title">CONTACTS PENDANT L'ABSENCE</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Contact personnel - Nom</div>
              <div class="info-value">${escapeHtml(demande.contactPersonnelNom)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Contact personnel - Téléphone</div>
              <div class="info-value">${escapeHtml(demande.contactPersonnelTel)}</div>
            </div>
            ${demande.contactAutreNom ? `
            <div class="info-item">
              <div class="info-label">Autre contact - Nom</div>
              <div class="info-value">${escapeHtml(demande.contactAutreNom)}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Autre contact - Téléphone</div>
              <div class="info-value">${escapeHtml(demande.contactAutreTel || '')}</div>
            </div>
            ` : ''}
          </div>
        </div>

        <!-- Suivi de la demande -->
        <div class="section">
          <div class="section-title">SUIVI DE LA DEMANDE</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Date de création</div>
              <div class="info-value">${escapeHtml(formatDate(demande.dateCreation))}</div>
            </div>
            ${demande.dateSoumission ? `
            <div class="info-item">
              <div class="info-label">Date de soumission</div>
              <div class="info-value">${escapeHtml(formatDate(demande.dateSoumission))}</div>
            </div>
            ` : ''}
            ${demande.dateValidation ? `
            <div class="info-item">
              <div class="info-label">Date de validation</div>
              <div class="info-value">${escapeHtml(formatDate(demande.dateValidation))}</div>
            </div>
            ` : ''}
            ${demande.rejetMotif ? `
            <div class="info-item full-width">
              <div class="info-label">Motif du rejet</div>
              <div class="info-value" style="color: #c00; font-weight: bold;">${escapeHtml(demande.rejetMotif)}</div>
            </div>
            ` : ''}
          </div>
        </div>

        <!-- Signatures -->
        <div class="signature-section">
          <div class="signature-box">
            <div class="signature-title">SIGNATURE EMPLOYÉ</div>
            <div class="signature-content">
              ${demande.signatureEmploye ? '✓ Signé' : 'En attente'}
            </div>
          </div>
          <div class="signature-box">
            <div class="signature-title">SIGNATURE RESPONSABLE</div>
            <div class="signature-content">
              ${demande.signatureResponsable ? '✓ Signé' : 'En attente'}
            </div>
          </div>
          <div class="signature-box">
            <div class="signature-title">SIGNATURE RH</div>
            <div class="signature-content">
              ${demande.signatureRH ? '✓ Signé' : 'En attente'}
            </div>
          </div>
          <div class="signature-box">
            <div class="signature-title">VISA DIRECTEUR GÉNÉRAL</div>
            <div class="signature-content">
              ${demande.signatureDG ? '✓ Signé' : 'En attente'}
            </div>
          </div>
        </div>

        <div class="footer">
          Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
        </div>
      </body>
      </html>
    `)
    iframeDoc.close()

    // Attendre le rendu
    await new Promise(resolve => setTimeout(resolve, 300))

    // Convertir en canvas
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

    // Utiliser un seuil de 5mm pour éviter les pages blanches avec juste quelques pixels
    while (heightLeft > 5) {
      pdf.addPage()
      position = -(imgHeight - heightLeft)
      pdf.addImage(imgData, 'PNG', marginLeft, position + marginTop, imgWidth, imgHeight)
      heightLeft -= availableHeight
    }

    // Télécharger le PDF
    const filename = `demande-conge-${demande.numero}-${new Date().toISOString().split("T")[0]}.pdf`
    pdf.save(filename)

  } catch (error) {
    console.error('Erreur génération PDF:', error)
    throw new Error(`Impossible de générer le PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
  }
}

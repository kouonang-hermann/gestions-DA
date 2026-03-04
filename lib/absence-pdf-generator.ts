/**
 * Générateur de PDF pour les demandes d'absence
 * Format basé sur le modèle fourni par l'utilisateur
 */

interface DemandeAbsencePDF {
  numero: string
  employe: {
    nom: string
    prenom: string
  }
  dateDebut: string
  dateFin: string
  nombreJours: number
  motif: string
  typeAbsence: string
  status: string
  dateCreation: string
  responsable: {
    nom: string
    prenom: string
  }
}

export function generateAbsencePDF(demande: DemandeAbsencePDF): string {
  const dateJour = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })

  const statusLabels: Record<string, string> = {
    brouillon: 'Brouillon',
    soumise: 'Soumise',
    en_attente_validation_hierarchique: 'En attente validation hiérarchique',
    en_attente_validation_rh: 'En attente validation RH',
    en_attente_visa_dg: 'En attente visa DG',
    approuvee: 'Approuvée',
    rejetee: 'Rejetée',
    annulee: 'Annulée'
  }

  const hierarchieAccord = [
    'en_attente_validation_rh',
    'en_attente_visa_dg',
    'approuvee'
  ].includes(demande.status)

  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Demande d'Absence - ${demande.numero}</title>
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
          font-size: 11pt;
          line-height: 1.6;
          color: #333;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .logo {
          width: 120px;
          height: auto;
          margin-bottom: 20px;
          opacity: 0.7;
        }
        
        .title {
          font-size: 20pt;
          font-weight: bold;
          color: #666;
          letter-spacing: 2px;
          margin-top: 30px;
        }
        
        .form-section {
          margin-bottom: 30px;
        }
        
        .form-field {
          margin-bottom: 20px;
          border-bottom: 1px solid #ccc;
          padding-bottom: 8px;
        }
        
        .form-label {
          font-size: 10pt;
          color: #666;
          text-transform: uppercase;
          display: block;
          margin-bottom: 5px;
        }
        
        .form-value {
          font-size: 11pt;
          color: #000;
          font-weight: 500;
        }
        
        .validation-section {
          margin-top: 40px;
          margin-bottom: 30px;
        }
        
        .validation-title {
          font-size: 10pt;
          color: #666;
          text-transform: uppercase;
          margin-bottom: 15px;
        }
        
        .checkbox-group {
          margin-left: 20px;
          margin-bottom: 10px;
        }
        
        .checkbox-item {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .checkbox {
          width: 15px;
          height: 15px;
          border: 1px solid #666;
          margin-right: 10px;
          display: inline-block;
        }
        
        .checkbox.checked {
          background-color: #666;
        }
        
        .info-section {
          margin-top: 30px;
          margin-bottom: 30px;
        }
        
        .info-lines {
          border-top: 1px dashed #ccc;
          padding-top: 10px;
        }
        
        .info-line {
          border-bottom: 1px dashed #ccc;
          min-height: 30px;
          margin-bottom: 10px;
        }
        
        .visa-section {
          margin-top: 60px;
          text-align: center;
        }
        
        .visa-title {
          font-size: 11pt;
          color: #666;
          text-transform: uppercase;
        }
        
        .footer {
          margin-top: 40px;
          text-align: center;
          font-size: 9pt;
          color: #999;
        }
        
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 9pt;
          font-weight: bold;
          margin-left: 10px;
        }
        
        .status-soumise {
          background-color: #dbeafe;
          color: #1e40af;
        }
        
        .status-approuvee {
          background-color: #dcfce7;
          color: #166534;
        }
        
        .status-rejetee {
          background-color: #fecaca;
          color: #dc2626;
        }
        
        .status-en_attente_validation {
          background-color: #fef3c7;
          color: #92400e;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- En-tête avec logo -->
        <div class="header">
          <div style="text-align: center; margin-bottom: 20px;">
            <svg width="120" height="60" viewBox="0 0 200 100" style="opacity: 0.7;">
              <text x="100" y="50" font-family="Arial, sans-serif" font-size="24" font-weight="bold" text-anchor="middle" fill="#015fc4">
                INSTRUMELEC
              </text>
              <text x="100" y="70" font-family="Arial, sans-serif" font-size="10" text-anchor="middle" fill="#666">
                GESTION DES DEMANDES
              </text>
            </svg>
          </div>
          
          <h1 class="title">DEMANDE D'ABSENCE</h1>
        </div>
        
        <!-- Informations du demandeur -->
        <div class="form-section">
          <div class="form-field">
            <span class="form-label">NOM(S) :</span>
            <span class="form-value">${demande.employe.nom.toUpperCase()}</span>
          </div>
          
          <div class="form-field">
            <span class="form-label">PRÉNOM(S) :</span>
            <span class="form-value">${demande.employe.prenom}</span>
          </div>
          
          <div class="form-field">
            <span class="form-label">DATE DU JOUR :</span>
            <span class="form-value">${dateJour}</span>
          </div>
          
          <div class="form-field">
            <span class="form-label">DATE(S) ET NOMBRE DE JOUR(S) DEMANDÉ(S) :</span>
            <span class="form-value">Du ${demande.dateDebut} au ${demande.dateFin} - ${demande.nombreJours} jour(s)</span>
          </div>
          
          <div class="form-field">
            <span class="form-label">TYPE D'ABSENCE :</span>
            <span class="form-value">${demande.typeAbsence}</span>
          </div>
          
          <div class="form-field">
            <span class="form-label">MOTIF DE LA DEMANDE :</span>
            <span class="form-value">${demande.motif}</span>
          </div>
          
          <div class="form-field">
            <span class="form-label">SIGNATURE DE DEMANDEUR :</span>
            <span class="form-value">Demande soumise le ${demande.dateCreation}</span>
          </div>
        </div>
        
        <!-- Validation hiérarchie -->
        <div class="validation-section">
          <div class="validation-title">VALIDATION DE LA HIÉRARCHIE :</div>
          <div class="checkbox-group">
            <div class="checkbox-item">
              <span class="checkbox ${hierarchieAccord ? 'checked' : ''}"></span>
              <span>ACCORD</span>
            </div>
            <div class="checkbox-item">
              <span class="checkbox ${demande.status === 'rejetee' ? 'checked' : ''}"></span>
              <span>REFUS</span>
            </div>
          </div>
          <div class="form-field" style="margin-top: 15px;">
            <span class="form-label">Supérieur hiérarchique :</span>
            <span class="form-value">${demande.responsable.prenom} ${demande.responsable.nom}</span>
          </div>
        </div>
        
        <!-- Validation RH -->
        <div class="validation-section">
          <div class="validation-title">VALIDATION DU SERVICE RH ET ADMINISTRATION</div>
        </div>
        
        <!-- Informations complémentaires -->
        <div class="info-section">
          <div class="validation-title">INFORMATIONS COMPLÉMENTAIRES :</div>
          <div class="info-lines">
            <div class="info-line"></div>
            <div class="info-line"></div>
            <div class="info-line"></div>
            <div class="info-line"></div>
          </div>
        </div>
        
        <!-- Visa DG -->
        <div class="visa-section">
          <div class="visa-title">VISA DE LA DIRECTION GÉNÉRALE</div>
        </div>
        
        <!-- Pied de page -->
        <div class="footer">
          <p>Numéro de demande : ${demande.numero}</p>
          <p>Statut : ${statusLabels[demande.status] || demande.status}</p>
          <p style="margin-top: 10px;">Document généré le ${new Date().toLocaleString('fr-FR')}</p>
        </div>
      </div>
    </body>
    </html>
  `

  return html
}

export async function downloadAbsencePDF(demande: DemandeAbsencePDF) {
  const html = generateAbsencePDF(demande)
  
  // Créer un blob avec le HTML
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  
  // Créer un lien de téléchargement
  const link = document.createElement('a')
  link.href = url
  link.download = `Demande_Absence_${demande.numero}.html`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  
  // Note: Pour une vraie conversion PDF, il faudrait utiliser une bibliothèque comme jsPDF ou html2pdf
  // Pour l'instant, on génère un HTML qui peut être imprimé en PDF via le navigateur
}

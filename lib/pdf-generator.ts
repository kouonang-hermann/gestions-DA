/**
 * Générateur de PDF utilisant la méthode iframe isolé
 * Cette méthode évite complètement le problème oklch de Tailwind CSS 4
 * en créant un document HTML isolé avec ses propres styles CSS
 */

import { VALIDATION_TYPES } from '@/constants/validation-types'

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
export async function generatePurchaseRequestPDF(demande: any, users: any[] = [], elementId: string = 'purchase-request-card'): Promise<void> {
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

    const formatTime = (value?: any) => {
      if (!value) return ''
      const d = new Date(value)
      return isNaN(d.getTime())
        ? ''
        : d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    }

    const demandeurFullName = `${demande.technicien?.prenom || ''} ${demande.technicien?.nom || ''}`.trim()
    const dateSouhaitee = formatDate(demande.dateLivraisonSouhaitee)

    const demandeurDate = formatDate(demande.dateCreation)
    const demandeurHeure = formatTime(demande.dateCreation)

    // Helper pour récupérer le nom d'un utilisateur par ID
    const getUserName = (userId: string | undefined) => {
      if (!userId) return ''
      const user = users.find(u => u.id === userId)
      if (!user) return ''
      return `${user.prenom || ''} ${user.nom || ''}`.trim()
    }

    // Transformer validationSignatures (array) en objets individuels
    const validationSignatures = demande.validationSignatures || []
    let validationConducteur = validationSignatures.find((v: any) => v.type === VALIDATION_TYPES.CONDUCTEUR)
    let validationLogistique = validationSignatures.find((v: any) => v.type === VALIDATION_TYPES.LOGISTIQUE || v.type === 'preparation_logistique')
    let validationResponsableTravaux = validationSignatures.find((v: any) => v.type === VALIDATION_TYPES.RESPONSABLE_TRAVAUX)
    let validationChargeAffaire = validationSignatures.find((v: any) => v.type === VALIDATION_TYPES.CHARGE_AFFAIRE)
    let validationAppro = validationSignatures.find((v: any) => v.type === VALIDATION_TYPES.APPRO || v.type === 'preparation_appro')

    // FALLBACK : Si pas de validationSignatures, extraire depuis history_entries (anciennes demandes)
    if (validationSignatures.length === 0 && demande.history && demande.history.length > 0) {
      console.log('⚠️ [PDF] Aucune signature trouvée, extraction depuis history_entries pour ancienne demande')
      
      const history = demande.history || []
      
      // Trouver les validations dans l'historique
      const historyValidationConducteur = history.find((h: any) => 
        h.action === 'valider' && 
        (h.ancienStatus === 'en_attente_validation_conducteur' || h.nouveauStatus === 'en_attente_validation_responsable_travaux')
      )
      const historyValidationRespTravaux = history.find((h: any) => 
        h.action === 'valider' && 
        (h.ancienStatus === 'en_attente_validation_responsable_travaux' || h.nouveauStatus === 'en_attente_validation_charge_affaire')
      )
      const historyValidationChargeAffaire = history.find((h: any) => 
        h.action === 'valider' && 
        (h.ancienStatus === 'en_attente_validation_charge_affaire' || h.nouveauStatus === 'en_attente_preparation_appro' || h.nouveauStatus === 'en_attente_preparation_logistique')
      )
      const historyValidationLogistique = history.find((h: any) => 
        h.action === 'valider' && 
        (h.ancienStatus === 'en_attente_validation_logistique' || h.nouveauStatus === 'en_attente_validation_responsable_travaux')
      )
      const historyPreparationAppro = history.find((h: any) => 
        h.action === 'preparer_sortie' && 
        h.ancienStatus === 'en_attente_preparation_appro'
      )

      // Créer des objets de validation à partir de l'historique
      if (historyValidationConducteur) {
        validationConducteur = {
          userId: historyValidationConducteur.userId,
          date: historyValidationConducteur.timestamp,
          user: historyValidationConducteur.user
        }
      }
      if (historyValidationRespTravaux) {
        validationResponsableTravaux = {
          userId: historyValidationRespTravaux.userId,
          date: historyValidationRespTravaux.timestamp,
          user: historyValidationRespTravaux.user
        }
      }
      if (historyValidationChargeAffaire) {
        validationChargeAffaire = {
          userId: historyValidationChargeAffaire.userId,
          date: historyValidationChargeAffaire.timestamp,
          user: historyValidationChargeAffaire.user
        }
      }
      if (historyValidationLogistique) {
        validationLogistique = {
          userId: historyValidationLogistique.userId,
          date: historyValidationLogistique.timestamp,
          user: historyValidationLogistique.user
        }
      }
      if (historyPreparationAppro) {
        validationAppro = {
          userId: historyPreparationAppro.userId,
          date: historyPreparationAppro.timestamp,
          user: historyPreparationAppro.user
        }
      }

      console.log('✅ [PDF] Validations extraites depuis history:', {
        conducteur: !!validationConducteur,
        responsableTravaux: !!validationResponsableTravaux,
        chargeAffaire: !!validationChargeAffaire,
        logistique: !!validationLogistique,
        appro: !!validationAppro
      })
    }

    console.log('🔍 [PDF] Signatures trouvées:', {
      total: validationSignatures.length,
      conducteur: !!validationConducteur,
      logistique: !!validationLogistique,
      responsableTravaux: !!validationResponsableTravaux,
      chargeAffaire: !!validationChargeAffaire,
      appro: !!validationAppro
    })

    const conducteurDate = formatDate(validationConducteur?.date)
    const conducteurHeure = formatTime(validationConducteur?.date)
    const conducteurNom = validationConducteur?.user 
      ? `${validationConducteur.user.prenom || ''} ${validationConducteur.user.nom || ''}`.trim()
      : getUserName(validationConducteur?.userId)
    const conducteurSignature = validationConducteur?.signatureImage || ''

    if (validationConducteur) {
      console.log('✅ [PDF] Signature Conducteur:', {
        nom: conducteurNom,
        date: conducteurDate,
        heure: conducteurHeure,
        hasSignatureImage: !!conducteurSignature,
        signatureLength: conducteurSignature?.length || 0
      })
    } else {
      console.log('❌ [PDF] Aucune signature conducteur trouvée')
    }

    const approLogDate = formatDate(validationAppro?.date || validationLogistique?.date)
    const approLogHeure = formatTime(validationAppro?.date || validationLogistique?.date)
    const approLogNom = (validationAppro?.user || validationLogistique?.user)
      ? `${(validationAppro?.user?.prenom || validationLogistique?.user?.prenom || '')} ${(validationAppro?.user?.nom || validationLogistique?.user?.nom || '')}`.trim()
      : getUserName(validationAppro?.userId || validationLogistique?.userId)
    const approLogSignature = validationAppro?.signatureImage || validationLogistique?.signatureImage || ''

    if (validationAppro || validationLogistique) {
      console.log('✅ [PDF] Signature Appro/Logistique:', {
        nom: approLogNom,
        date: approLogDate,
        heure: approLogHeure,
        hasSignatureImage: !!approLogSignature,
        signatureLength: approLogSignature?.length || 0
      })
    } else {
      console.log('❌ [PDF] Aucune signature Appro/Logistique trouvée')
    }

    const respTravauxOuCADate = formatDate(
      validationChargeAffaire?.date || validationResponsableTravaux?.date
    )
    const respTravauxOuCAHeure = formatTime(
      validationChargeAffaire?.date || validationResponsableTravaux?.date
    )
    const respTravauxOuCANom = (validationChargeAffaire?.user || validationResponsableTravaux?.user)
      ? `${(validationChargeAffaire?.user?.prenom || validationResponsableTravaux?.user?.prenom || '')} ${(validationChargeAffaire?.user?.nom || validationResponsableTravaux?.user?.nom || '')}`.trim()
      : getUserName(validationChargeAffaire?.userId || validationResponsableTravaux?.userId)
    const respTravauxOuCASignature = validationChargeAffaire?.signatureImage || validationResponsableTravaux?.signatureImage || ''

    if (validationChargeAffaire || validationResponsableTravaux) {
      console.log('✅ [PDF] Signature Responsable Travaux/Chargé Affaire:', {
        nom: respTravauxOuCANom,
        date: respTravauxOuCADate,
        heure: respTravauxOuCAHeure,
        hasSignatureImage: !!respTravauxOuCASignature,
        signatureLength: respTravauxOuCASignature?.length || 0
      })
    } else {
      console.log('❌ [PDF] Aucune signature Responsable Travaux/Chargé Affaire trouvée')
    }

    console.log('📝 [PDF] Résumé des validateurs:', {
      conducteur: { nom: conducteurNom, hasSignature: !!conducteurSignature },
      approLog: { nom: approLogNom, hasSignature: !!approLogSignature },
      respTravauxCA: { nom: respTravauxOuCANom, hasSignature: !!respTravauxOuCASignature }
    })

    const visaConducteur = Boolean(validationConducteur)
    const visaApproLog = Boolean(validationAppro || validationLogistique)
    const visaRespTravauxOuCA = Boolean(validationChargeAffaire || validationResponsableTravaux)

    const checkedMateriel = demande.type === 'materiel'
    const checkedOutillage = demande.type === 'outillage'

    const items = Array.isArray(demande.items) ? demande.items : []
    const targetRows = 16
    const emptyRowsCount = Math.max(0, targetRows - items.length)

    const projectName = escapeHtml(demande.projet?.nom || '')

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
            background: #ffffff;
            color: #000000;
            width: 210mm;
            min-height: 297mm;
            padding: 10mm;
            font-size: 11px;
            line-height: 1.25;
          }

          .row { display: flex; gap: 12px; align-items: stretch; }
          .grow { flex: 1; }
          .mb-10 { margin-bottom: 10px; }
          .mb-12 { margin-bottom: 12px; }

          .type-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding: 0 10px;
          }
          .type-item {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .type-label { 
            font-size: 11px; 
            font-weight: normal;
            white-space: nowrap;
            border: 1px solid #000;
            padding: 6px 12px;
            min-width: 80px;
            text-align: center;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            height: 24px;
          }

          .checkbox {
            width: 20px;
            height: 20px;
            border: 1px solid #000;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            font-weight: bold;
            line-height: 1;
            flex-shrink: 0;
          }

          .box { border: 1px solid #000; }

          .section-title {
            font-weight: bold;
            text-align: right;
            margin-bottom: 8px;
            font-size: 11px;
          }

          .main-content {
            display: flex;
            gap: 0;
          }

          .left-table {
            width: 40%;
            border-collapse: collapse;
          }
          .left-table td {
            border: 1px solid #000;
            padding: 6px 10px;
            vertical-align: middle;
            font-size: 11px;
          }
          .left-table .label-cell {
            font-weight: bold;
            width: 90px;
          }

          .right-box {
            flex: 1;
            border: 1px solid #000;
            border-left: none;
            min-height: 80px;
          }

          .visa-table { width: 100%; border-collapse: collapse; }
          .visa-table th, .visa-table td {
            border: 1px solid #000;
            padding: 8px 6px;
            text-align: center;
            vertical-align: middle;
            font-size: 9px;
          }
          .visa-table th { font-weight: bold; }
          .visa-left { width: 80px; font-weight: bold; text-align: left; padding-left: 10px; }
          .visa-name { font-weight: bold; font-size: 9px; }
          .signature-cell { 
            height: 60px; 
            padding: 4px;
            vertical-align: middle;
          }
          .signature-img { 
            max-width: 100%; 
            max-height: 50px; 
            display: block;
            margin: 0 auto;
          }

          .items-table { width: 100%; border-collapse: collapse; }
          .items-table th, .items-table td {
            border: 1px solid #000;
            padding: 8px 6px;
            font-size: 10px;
          }
          .items-table th { text-align: center; font-weight: bold; }
          .col-ref { width: 15%; }
          .col-des { width: 50%; }
          .col-unit { width: 8%; text-align: center; }
          .col-qty { width: 8%; text-align: center; }
          .col-date { width: 19%; text-align: center; }
          .empty-row td { height: 28px; }

          .footer { margin-top: 8px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="type-row">
          <div class="type-item">
            <div class="type-label">Matériel</div>
            <div class="checkbox">${checkedMateriel ? 'X' : ''}</div>
          </div>
          <div class="type-item">
            <div class="type-label">Outillage</div>
            <div class="checkbox">${checkedOutillage ? 'X' : ''}</div>
          </div>
          <div class="type-item">
            <div class="type-label">Main d'œuvre</div>
            <div class="checkbox"></div>
          </div>
          <div class="type-item">
            <div class="type-label">Frais divers</div>
            <div class="checkbox"></div>
          </div>
        </div>

        <div class="section-title">Motif de la demande</div>
        
        <div class="main-content mb-12">
          <table class="left-table">
            <tr>
              <td class="label-cell">Date :</td>
              <td>${escapeHtml(demandeurDate)}</td>
            </tr>
            <tr>
              <td class="label-cell">Client :</td>
              <td>${escapeHtml(demandeurFullName)}</td>
            </tr>
            <tr>
              <td class="label-cell">Code projet :</td>
              <td>${projectName}</td>
            </tr>
          </table>
          <div class="right-box"></div>
        </div>

        <div class="mb-12">
          <table class="visa-table">
            <thead>
              <tr>
                <th class="visa-left"></th>
                <th>Demandeur</th>
                <th>Conducteur des travaux</th>
                <th>Approvisionnement et logistique</th>
                <th>Responsable des travaux/chargé d'affaire</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="visa-left">NOM</td>
                <td class="visa-name">${escapeHtml(demandeurFullName)}</td>
                <td class="visa-name">${escapeHtml(conducteurNom)}</td>
                <td class="visa-name">${escapeHtml(approLogNom)}</td>
                <td class="visa-name">${escapeHtml(respTravauxOuCANom)}</td>
              </tr>
              <tr>
                <td class="visa-left">DATE</td>
                <td>${escapeHtml(demandeurDate)}</td>
                <td>${escapeHtml(conducteurDate)}</td>
                <td>${escapeHtml(approLogDate)}</td>
                <td>${escapeHtml(respTravauxOuCADate)}</td>
              </tr>
              <tr>
                <td class="visa-left">HEURE</td>
                <td>${escapeHtml(demandeurHeure)}</td>
                <td>${escapeHtml(conducteurHeure)}</td>
                <td>${escapeHtml(approLogHeure)}</td>
                <td>${escapeHtml(respTravauxOuCAHeure)}</td>
              </tr>
              <tr>
                <td class="visa-left">VISA</td>
                <td>X</td>
                <td>${visaConducteur ? 'X' : ''}</td>
                <td>${visaApproLog ? 'X' : ''}</td>
                <td>${visaRespTravauxOuCA ? 'X' : ''}</td>
              </tr>
              <tr>
                <td class="visa-left">SIGNATURE</td>
                <td class="signature-cell"></td>
                <td class="signature-cell">
                  ${conducteurSignature ? `<img src="${conducteurSignature}" class="signature-img" alt="Signature Conducteur" />` : ''}
                </td>
                <td class="signature-cell">
                  ${approLogSignature ? `<img src="${approLogSignature}" class="signature-img" alt="Signature Appro/Log" />` : ''}
                </td>
                <td class="signature-cell">
                  ${respTravauxOuCASignature ? `<img src="${respTravauxOuCASignature}" class="signature-img" alt="Signature Resp/CA" />` : ''}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <table class="items-table">
            <thead>
              <tr>
                <th class="col-ref">Référence</th>
                <th class="col-des">Désignation</th>
                <th class="col-unit">Uté</th>
                <th class="col-qty">Qté</th>
                <th class="col-date">Date de livraison souhaitée</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .map((item: any) => {
                  return `
                    <tr>
                      <td class="col-ref">${escapeHtml(item.article?.reference || '')}</td>
                      <td class="col-des">${escapeHtml(item.article?.nom || '')}</td>
                      <td class="col-unit">${escapeHtml(item.article?.unite || '')}</td>
                      <td class="col-qty">${escapeHtml(item.quantiteDemandee ?? '')}</td>
                      <td class="col-date">${escapeHtml(dateSouhaitee)}</td>
                    </tr>
                  `
                })
                .join('')}
              ${Array.from({ length: emptyRowsCount })
                .map(
                  () => `
                    <tr class="empty-row">
                      <td></td><td></td><td></td><td></td><td></td>
                    </tr>
                  `
                )
                .join('')}
            </tbody>
          </table>
        </div>

        <div class="footer">Nom et visa demandeur</div>
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
    // Utiliser un seuil de 5mm pour éviter les pages blanches avec juste quelques pixels
    while (heightLeft > 5) {
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
            padding: 7px 5px;
            font-size: 11px;
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

    // Utiliser un seuil de 5mm pour éviter les pages blanches avec juste quelques pixels
    while (heightLeft > 5) {
      pdf.addPage()
      position = -(imgHeight - heightLeft)
      pdf.addImage(imgData, 'PNG', marginLeft, position + marginTop, imgWidth, imgHeight)
      heightLeft -= availableHeight
    }

    const filename = `bon-livraison-${demande.numero}-${new Date().toISOString().split("T")[0]}.pdf`
    pdf.save(filename)

  } catch (error) {
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
            font-size: 12px;
            line-height: 1.25;
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
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
          }
          .header-left div {
            margin: 2px 0;
            font-size: 10px;
          }
          .header-right {
            width: 150px;
            background-color: #cccccc;
            padding: 8px;
          }
          .header-right div {
            margin: 2px 0;
            font-size: 10px;
          }
          .title-row {
            background-color: #ffffff;
            padding: 10px;
            text-align: center;
          }
          .title-row h1 {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .title-row .numero {
            color: #ff0000;
            font-size: 15px;
            font-weight: bold;
          }
          .info-section {
            margin: 15px 0;
            font-size: 12px;
          }
          .info-row {
            display: flex;
            margin: 6px 0;
            align-items: center;
          }
          .info-label {
            width: 140px;
            font-weight: bold;
          }
          .info-value {
            flex: 1;
            border-bottom: 1px solid #000000;
            padding: 2px 0 6px 0;
            min-height: 22px;
            line-height: 1.35;
            text-decoration: none;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
          }
          th, td {
            border: 1px solid #000000;
            padding: 7px 5px;
            font-size: 11px;
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
            font-size: 10px;
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
            <h1>Bon de Sortie</h1>
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

    // Utiliser un seuil de 5mm pour éviter les pages blanches avec juste quelques pixels
    while (heightLeft > 5) {
      pdf.addPage()
      position = -(imgHeight - heightLeft)
      pdf.addImage(imgData, 'PNG', marginLeft, position + marginTop, imgWidth, imgHeight)
      heightLeft -= availableHeight
    }

    const filename = `bon-sortie-${demande.numero}-${new Date().toISOString().split("T")[0]}.pdf`
    pdf.save(filename)

  } catch (error) {
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
  throw new Error('Utilisez generatePurchaseRequestPDF à la place')
}

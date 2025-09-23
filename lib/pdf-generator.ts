// Imports corrigés pour éviter les erreurs TypeScript
export interface PDFOptions {
  filename?: string
  format?: 'a4' | 'letter'
  orientation?: 'portrait' | 'landscape'
  margin?: number
}

export const generatePDFFromElement = async (
  element: HTMLElement,
  options: PDFOptions = {}
): Promise<void> => {
  const {
    filename = 'document.pdf',
    format = 'a4',
    orientation = 'portrait',
    margin = 10
  } = options

  try {
    // Imports dynamiques pour éviter les problèmes SSR
    const { jsPDF } = await import('jspdf')
    const html2canvas = (await import('html2canvas')).default

    // Configuration pour html2canvas
    const canvas = await html2canvas(element, {
      scale: 2, // Améliore la qualité
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      width: element.scrollWidth,
      height: element.scrollHeight
    })

    const imgData = canvas.toDataURL('image/png')
    
    // Configuration du PDF
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format
    })

    // Dimensions du PDF
    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    
    // Dimensions de l'image
    const imgWidth = pdfWidth - (margin * 2)
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    
    let heightLeft = imgHeight
    let position = margin

    // Ajouter la première page
    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
    heightLeft -= (pdfHeight - margin * 2)

    // Ajouter des pages supplémentaires si nécessaire
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight + margin
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight)
      heightLeft -= (pdfHeight - margin * 2)
    }

    // Télécharger le PDF
    pdf.save(filename)
  } catch (error) {
    console.error('Erreur lors de la génération du PDF:', error)
    throw new Error('Impossible de générer le PDF')
  }
}

export const generatePurchaseRequestPDF = async (
  demande: any,
  elementId: string = 'purchase-request-card'
): Promise<void> => {
  // Vérifier que nous sommes côté client
  if (typeof window === 'undefined') {
    throw new Error('La génération PDF ne peut être effectuée que côté client')
  }

  const element = document.getElementById(elementId)
  
  if (!element) {
    throw new Error(`Élément avec l'ID "${elementId}" non trouvé`)
  }

  const filename = `demande-${demande.numero}-${new Date().toISOString().split('T')[0]}.pdf`
  
  await generatePDFFromElement(element, {
    filename,
    format: 'a4',
    orientation: 'portrait',
    margin: 15
  })
}

// Imports corrigés pour éviter les erreurs TypeScript
export interface PDFOptions {
  filename?: string
  format?: 'a4' | 'letter'
  orientation?: 'portrait' | 'landscape'
  margin?: number
}

// Fonction pour convertir oklch en rgb (approximation)
const convertOklchToRgb = (oklchValue: string): string => {
  // Si ce n'est pas oklch, retourner tel quel
  if (!oklchValue.includes('oklch')) return oklchValue
  
  // Retourner une couleur par défaut (gris) pour les valeurs oklch
  // car html2canvas ne les supporte pas
  return '#374151'
}

// Fonction pour nettoyer les styles oklch d'un élément cloné
const cleanOklchStyles = (element: HTMLElement): void => {
  // Forcer les couleurs de base en inline pour écraser les styles calculés
  const allElements = element.querySelectorAll('*')
  
  allElements.forEach((el) => {
    if (el instanceof HTMLElement) {
      const computed = window.getComputedStyle(el)
      
      // Forcer fond blanc si transparent ou oklch
      if (!el.style.backgroundColor || computed.backgroundColor === 'transparent') {
        el.style.backgroundColor = '#ffffff'
      }
      
      // Forcer couleur de texte si non définie
      if (!el.style.color) {
        el.style.color = '#1f2937'
      }
      
      // Forcer bordure si définie
      if (computed.borderColor && computed.borderColor !== 'transparent') {
        el.style.borderColor = '#e5e7eb'
      }
    }
  })
  
  // Forcer les styles sur l'élément racine
  element.style.backgroundColor = '#ffffff'
  element.style.color = '#1f2937'
}

// Créer une feuille de style temporaire pour forcer les couleurs
const createTempStyleSheet = (): HTMLStyleElement => {
  const style = document.createElement('style')
  style.id = 'pdf-temp-styles'
  style.textContent = `
    #purchase-request-card * {
      color: #1f2937 !important;
      background-color: #ffffff !important;
      border-color: #e5e7eb !important;
    }
    #purchase-request-card {
      background-color: #ffffff !important;
      color: #1f2937 !important;
    }
    #purchase-request-card h1, 
    #purchase-request-card h2, 
    #purchase-request-card h3, 
    #purchase-request-card h4 {
      color: #111827 !important;
    }
    #purchase-request-card .text-gray-500,
    #purchase-request-card .text-gray-600 {
      color: #6b7280 !important;
    }
    #purchase-request-card .bg-blue-100 {
      background-color: #dbeafe !important;
    }
    #purchase-request-card .text-blue-800 {
      color: #1e40af !important;
    }
    #purchase-request-card .bg-green-100 {
      background-color: #dcfce7 !important;
    }
    #purchase-request-card .text-green-800 {
      color: #166534 !important;
    }
    #purchase-request-card .bg-orange-100 {
      background-color: #ffedd5 !important;
    }
    #purchase-request-card .text-orange-800 {
      color: #9a3412 !important;
    }
    #purchase-request-card .bg-red-100 {
      background-color: #fee2e2 !important;
    }
    #purchase-request-card .text-red-800 {
      color: #991b1b !important;
    }
  `
  return style
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

  // Ajouter la feuille de style temporaire
  const tempStyle = createTempStyleSheet()
  document.head.appendChild(tempStyle)

  try {
    // Imports dynamiques pour éviter les problèmes SSR
    const { jsPDF } = await import('jspdf')
    const html2canvas = (await import('html2canvas')).default

    // Appliquer des styles inline directement sur l'élément
    const originalBg = element.style.backgroundColor
    const originalColor = element.style.color
    element.style.backgroundColor = '#ffffff'
    element.style.color = '#1f2937'

    // Forcer les styles sur tous les éléments enfants
    const allElements = element.querySelectorAll('*')
    const originalStyles: Map<Element, { bg: string, color: string, border: string }> = new Map()
    
    allElements.forEach((el) => {
      if (el instanceof HTMLElement) {
        originalStyles.set(el, {
          bg: el.style.backgroundColor,
          color: el.style.color,
          border: el.style.borderColor
        })
        el.style.setProperty('background-color', '#ffffff', 'important')
        el.style.setProperty('color', '#1f2937', 'important')
        el.style.setProperty('border-color', '#e5e7eb', 'important')
      }
    })

    // Configuration pour html2canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false
    })
    
    // Restaurer les styles originaux des enfants
    originalStyles.forEach((styles, el) => {
      if (el instanceof HTMLElement) {
        el.style.backgroundColor = styles.bg
        el.style.color = styles.color
        el.style.borderColor = styles.border
      }
    })

    // Restaurer les styles originaux
    element.style.backgroundColor = originalBg
    element.style.color = originalColor

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
    
    // Supprimer la feuille de style temporaire
    tempStyle.remove()
  } catch (error) {
    // Supprimer la feuille de style temporaire en cas d'erreur
    tempStyle.remove()
    
    console.error('Erreur lors de la génération du PDF:', error)
    if (error instanceof Error) {
      throw new Error(`Impossible de générer le PDF: ${error.message}`)
    }
    throw error
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

  // Attendre un peu pour s'assurer que le DOM est complètement rendu
  await new Promise(resolve => setTimeout(resolve, 100))

  const element = document.getElementById(elementId)
  
  if (!element) {
    console.error('Élément non trouvé. IDs disponibles:', 
      Array.from(document.querySelectorAll('[id]')).map(el => el.id).join(', '))
    throw new Error(`Élément avec l'ID "${elementId}" non trouvé. Vérifiez que le composant est bien monté.`)
  }

  console.log('Élément trouvé:', element)
  console.log('Dimensions:', element.offsetWidth, 'x', element.offsetHeight)

  const filename = `demande-${demande.numero}-${new Date().toISOString().split('T')[0]}.pdf`
  
  await generatePDFFromElement(element, {
    filename,
    format: 'a4',
    orientation: 'portrait',
    margin: 15
  })
}

// Déclarations de types personnalisées pour les bibliothèques PDF

declare module 'jspdf' {
  export class jsPDF {
    constructor(options?: {
      orientation?: 'portrait' | 'landscape'
      unit?: string
      format?: string | number[]
    })
    
    internal: {
      pageSize: {
        getWidth(): number
        getHeight(): number
      }
    }
    
    addImage(
      imageData: string,
      format: string,
      x: number,
      y: number,
      width: number,
      height: number
    ): void
    
    addPage(): void
    save(filename: string): void
    setProperties(properties: {
      title?: string
      subject?: string
      author?: string
      creator?: string
    }): void
  }
}

declare module 'html2canvas' {
  interface Html2CanvasOptions {
    scale?: number
    useCORS?: boolean
    allowTaint?: boolean
    backgroundColor?: string
    logging?: boolean
    width?: number
    height?: number
  }
  
  function html2canvas(
    element: HTMLElement,
    options?: Html2CanvasOptions
  ): Promise<HTMLCanvasElement>
  
  export default html2canvas
}

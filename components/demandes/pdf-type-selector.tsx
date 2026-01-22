"use client"

import React from 'react'
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Download, FileText, Package, ClipboardList, Loader2 } from "lucide-react"

export type PDFType = 'demande' | 'bon_livraison' | 'bon_sortie'

interface PDFTypeSelectorProps {
  onSelect: (type: PDFType) => void
  isGenerating: boolean
  disabled?: boolean
  className?: string
}

export function PDFTypeSelector({ 
  onSelect, 
  isGenerating, 
  disabled,
  className = "w-full sm:w-auto px-4 sm:px-6 py-3 sm:py-2"
}: PDFTypeSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  
  console.log('🔍 [PDFTypeSelector] Rendu du composant:', { isGenerating, disabled, isOpen })
  
  const handleSelect = (type: PDFType) => {
    console.log('🔍 [PDFTypeSelector] Item cliqué:', type)
    setIsOpen(false)
    onSelect(type)
  }
  
  const handleButtonClick = (e: React.MouseEvent) => {
    console.log('🔍 [PDFTypeSelector] Bouton cliqué - Event:', e.type)
    console.log('🔍 [PDFTypeSelector] État actuel isOpen:', isOpen)
  }
  
  return (
    <DropdownMenu open={isOpen} onOpenChange={(open) => {
      console.log('🔍 [PDFTypeSelector] Dropdown onOpenChange:', open)
      setIsOpen(open)
    }}>
      <DropdownMenuTrigger asChild>
        <Button 
          disabled={isGenerating || disabled}
          className={`${className} bg-[#015fc4] hover:bg-[#014a9a] text-white rounded flex items-center justify-center gap-2 min-h-[48px] text-sm sm:text-base`}
          onClick={handleButtonClick}
          type="button"
        >
          {isGenerating ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Génération...</span>
            </>
          ) : (
            <>
              <Download size={16} />
              <span className="hidden sm:inline">Télécharger PDF</span>
              <span className="sm:hidden">PDF</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56" style={{ zIndex: 9999 }}>
        <DropdownMenuItem 
          onClick={() => handleSelect('demande')}
          className="cursor-pointer"
          onSelect={(e) => {
            console.log('🔍 [PDFTypeSelector] onSelect demande triggered')
            e.preventDefault()
            handleSelect('demande')
          }}
        >
          <FileText className="mr-2 h-4 w-4" />
          <span>Demande d'Achat (DA)</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleSelect('bon_sortie')}
          className="cursor-pointer"
          onSelect={(e) => {
            console.log('🔍 [PDFTypeSelector] onSelect bon_sortie triggered')
            e.preventDefault()
            handleSelect('bon_sortie')
          }}
        >
          <Package className="mr-2 h-4 w-4" />
          <span>Bon de Sortie Matériel</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleSelect('bon_livraison')}
          className="cursor-pointer"
          onSelect={(e) => {
            console.log('🔍 [PDFTypeSelector] onSelect bon_livraison triggered')
            e.preventDefault()
            handleSelect('bon_livraison')
          }}
        >
          <ClipboardList className="mr-2 h-4 w-4" />
          <span>Bon de Livraison</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

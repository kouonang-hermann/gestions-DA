"use client"

import { FileSignature } from "lucide-react"

interface SignaturePreviewProps {
  /** data URL base64 PNG, ou null si aucune signature enregistree. */
  signature: string | null | undefined
  /** Hauteur d'affichage en pixels. */
  height?: number
  /** Texte affiche quand aucune signature n'est encore enregistree. */
  emptyLabel?: string
  className?: string
}

/**
 * Aperçu visuel d'une signature (data URL base64 PNG).
 * Affiche un placeholder neutre si aucune signature n'est fournie.
 */
export function SignaturePreview({
  signature,
  height = 120,
  emptyLabel = "Aucune signature enregistree",
  className = "",
}: SignaturePreviewProps) {
  if (!signature) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-gray-500 ${className}`}
        style={{ height }}
      >
        <FileSignature className="h-8 w-8 opacity-60" />
        <p className="text-sm">{emptyLabel}</p>
      </div>
    )
  }

  return (
    <div
      className={`flex items-center justify-center rounded-lg border border-gray-300 bg-white p-2 ${className}`}
      style={{ height }}
    >
      <img
        src={signature}
        alt="Signature"
        className="max-h-full max-w-full object-contain"
      />
    </div>
  )
}

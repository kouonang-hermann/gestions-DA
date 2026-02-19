"use client"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Gavel } from "lucide-react"
import { useRouter } from "next/navigation"

interface DecideurButtonProps {
  className?: string
  size?: "sm" | "default" | "lg"
}

export function DecideurButton({ className = "", size = "sm" }: DecideurButtonProps) {
  const router = useRouter()

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          className={`justify-start text-white ${className}`}
          style={{ backgroundColor: '#8b5cf6' }}
          size={size}
          onClick={() => router.push('/decideur')}
        >
          <Gavel className="h-4 w-4 mr-2" />
          <span className="text-sm">Décider</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={6}>
        Traiter les demandes de congés, absences et paiements
      </TooltipContent>
    </Tooltip>
  )
}

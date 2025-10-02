"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import UniversalClosureModal from "@/components/modals/universal-closure-modal"

/**
 * Composant d'intégration universelle pour la clôture des demandes
 * À utiliser dans tous les dashboards pour permettre à chaque rôle de clôturer ses propres demandes
 */
export default function UniversalClosureIntegration() {
  const [universalClosureModalOpen, setUniversalClosureModalOpen] = useState(false)

  return (
    <>
      <Button
        className="justify-start text-white"
        style={{ backgroundColor: '#16a34a' }}
        size="sm"
        onClick={() => setUniversalClosureModalOpen(true)}
      >
        <CheckCircle className="h-4 w-4 mr-2" />
        <span className="text-sm">Clôturer mes demandes</span>
      </Button>
      
      <UniversalClosureModal
        isOpen={universalClosureModalOpen}
        onClose={() => setUniversalClosureModalOpen(false)}
      />
    </>
  )
}

/**
 * Version mobile du composant d'intégration
 */
export function MobileUniversalClosureIntegration() {
  const [universalClosureModalOpen, setUniversalClosureModalOpen] = useState(false)

  return (
    <>
      <button 
        className="mobile-action-button mobile-action-secondary"
        onClick={() => setUniversalClosureModalOpen(true)}
      >
        <CheckCircle className="mobile-action-icon" />
        Clôturer Demandes
      </button>
      
      <UniversalClosureModal
        isOpen={universalClosureModalOpen}
        onClose={() => setUniversalClosureModalOpen(false)}
      />
    </>
  )
}

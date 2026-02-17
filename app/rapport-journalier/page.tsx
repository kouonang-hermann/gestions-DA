"use client"

import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function RapportJournalierPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mt-4">
            Rapport Journalier
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Consultation et génération des rapports journaliers
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Page en construction</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Cette page est en cours de développement.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

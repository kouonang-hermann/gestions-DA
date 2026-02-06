"use client"

import { useState, useEffect } from "react"
import { useStore } from "@/stores/useStore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Package, Truck, Clock, CheckCircle, AlertCircle, User, Eye, X, FileDown } from "lucide-react"
import type { Demande } from "@/types"
import DemandePreparationModal from "@/components/appro/demande-preparation-modal"
import jsPDF from "jspdf"
import html2canvas from "html2canvas"

export default function SortiePreparationList() {
  const { currentUser, demandes, loadDemandes, executeAction, isLoading, error, users, token } = useStore()
  const [demandesAPreparer, setDemandesAPreparer] = useState<Demande[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null)
  const [preparationModalOpen, setPreparationModalOpen] = useState(false)
  const [demandeToPrep, setDemandeToPrep] = useState<string | null>(null)
  const [selectedLivreur, setSelectedLivreur] = useState<string>("")
  const [commentaire, setCommentaire] = useState<string>("")

  useEffect(() => {
    if (currentUser) {
      loadDemandes()
      // Charger les utilisateurs pour avoir la liste des livreurs
      useStore.getState().loadUsers()
    }
  }, [currentUser, loadDemandes])
  
  useEffect(() => {
    if (currentUser && users.length > 0) {
      // Logs supprimés pour production
    }
  }, [currentUser, users])

  useEffect(() => {
    if (currentUser) {
      const filtered = demandes.filter((d) => 
        d.type === "materiel" && // MATÉRIEL UNIQUEMENT (outillage géré par Responsable Logistique)
        d.status === "en_attente_preparation_appro" &&
        // Filtrer par projet si l'utilisateur a des projets assignés
        (!currentUser.projets || currentUser.projets.length === 0 || currentUser.projets.includes(d.projetId))
      )
      
      setDemandesAPreparer(filtered)
    }
  }, [currentUser, demandes])

  const handleOpenPreparationModal = (demandeId: string) => {
    setDemandeToPrep(demandeId)
    setSelectedLivreur("")
    setCommentaire("")
    setPreparationModalOpen(true)
  }

  const handleClosePreparationModal = () => {
    setPreparationModalOpen(false)
    setDemandeToPrep(null)
    setSelectedLivreur("")
    setCommentaire("")
  }

  const handleConfirmPreparation = async () => {
    if (!demandeToPrep) return
    
    if (!selectedLivreur) {
      alert("Veuillez sélectionner un livreur")
      return
    }

    setActionLoading(demandeToPrep)
    setPreparationModalOpen(false)

    try {
      const success = await executeAction(demandeToPrep, "preparer_sortie", { 
        commentaire: commentaire || undefined,
        livreurAssigneId: selectedLivreur 
      })
      if (success) {
        await loadDemandes()
        handleClosePreparationModal()
      } else {
        alert(error || "Erreur lors de la préparation")
      }
    } catch (err) {
      alert("Erreur lors de la préparation")
    } finally {
      setActionLoading(null)
    }
  }

  const handleViewDetails = (demande: Demande) => {
    setSelectedDemande(demande)
    setDetailsModalOpen(true)
  }

  const handleSaveQuantites = async (quantites: { [itemId: string]: number }, prix: { [itemId: string]: number }) => {
    if (!selectedDemande) return
    
    
    try {
      // Transformer les quantités et prix pour l'API
      const quantitesSorties: { [itemId: string]: number } = {}
      const prixUnitaires: { [itemId: string]: number } = {}
      
      selectedDemande.items.forEach((item, index) => {
        const qteKey = `item-${index}`
        if (quantites[qteKey] !== undefined) {
          quantitesSorties[item.id] = quantites[qteKey]
        }
        if (prix[qteKey] !== undefined) {
          prixUnitaires[item.id] = prix[qteKey]
        }
      })
      
      
      // Appeler l'API pour mettre à jour les quantités de sortie
      const responseQte = await fetch(`/api/demandes/${selectedDemande.id}/update-delivery`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ quantitesSorties }),
      })
      
      // Vérifier si la réponse est OK avant de parser le JSON
      if (!responseQte.ok) {
        const errorText = await responseQte.text()
        alert(`❌ Erreur quantités: ${errorText || "Impossible de sauvegarder les quantités"}`)
        return
      }
      
      const resultQte = await responseQte.json()
      
      if (!resultQte.success) {
        alert(`❌ Erreur quantités: ${resultQte.error || "Impossible de sauvegarder les quantités"}`)
        return
      }
      
      // Appeler l'API pour mettre à jour les prix
      const responsePrix = await fetch(`/api/demandes/${selectedDemande.id}/update-prices`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ prices: prixUnitaires }),
      })
      
      // Vérifier si la réponse est OK avant de parser le JSON
      if (!responsePrix.ok) {
        const errorText = await responsePrix.text()
        alert(`⚠️ Quantités OK mais erreur prix: ${errorText || "Impossible de sauvegarder les prix"}`)
        await loadDemandes()
        return
      }
      
      const resultPrix = await responsePrix.json()
      
      if (resultPrix.success) {
        alert("✅ Quantités et prix enregistrés avec succès !")
        await loadDemandes()
        setDetailsModalOpen(false)
        setSelectedDemande(null)
      } else {
        alert(`⚠️ Quantités OK mais erreur prix: ${resultPrix.error || "Impossible de sauvegarder les prix"}`)
        await loadDemandes()
      }
    } catch (error) {
      alert("❌ Erreur de connexion lors de la sauvegarde")
    }
  }

  const generatePDF = async (demande: Demande) => {
    try {
      // Créer un iframe isolé pour éviter l'héritage des styles globaux
      const iframe = document.createElement('iframe')
      iframe.style.position = 'absolute'
      iframe.style.left = '-9999px'
      iframe.style.width = '800px'
      iframe.style.height = '1200px'
      document.body.appendChild(iframe)

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      if (!iframeDoc) throw new Error('Impossible de créer le document iframe')

      // Écrire le HTML complet dans l'iframe (sans héritage de styles)
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
              padding: 15px;
              background-color: #ffffff;
              color: #000000;
            }
            .header {
              text-align: center;
              margin-bottom: 8px;
              border-bottom: 1px solid #333333;
              padding-bottom: 5px;
            }
            .header h1 {
              margin: 0;
              color: #333333;
              font-size: 14px;
              font-weight: bold;
            }
            .header p {
              margin: 3px 0;
              font-size: 11px;
              color: #000000;
            }
            .info-section {
              margin-bottom: 8px;
              padding: 5px 8px;
              background-color: #f5f5f5;
              border-radius: 3px;
            }
            .visa-section {
              margin: 8px 0;
              padding: 5px;
              background-color: #f9f9f9;
              border: 1px solid #dddddd;
              border-radius: 3px;
            }
            .visa-section h3 {
              margin: 0 0 5px 0;
              color: #333333;
              font-size: 11px;
              text-align: center;
              font-weight: bold;
            }
            .visa-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 3px;
            }
            .visa-table th,
            .visa-table td {
              border: 1px solid #dddddd;
              padding: 3px 5px;
              text-align: center;
              color: #000000;
              font-size: 9px;
            }
            .visa-table th {
              background-color: #2196F3;
              color: #ffffff;
              font-weight: bold;
              font-size: 9px;
            }
            .visa-table tr:nth-child(even) {
              background-color: #f5f5f5;
            }
            .info-row {
              margin-bottom: 3px;
              color: #000000;
              font-size: 10px;
            }
            .info-row strong {
              display: inline-block;
              width: 150px;
              color: #000000;
              font-size: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th, td {
              border: 2px solid #333333;
              padding: 10px;
              text-align: left;
              color: #000000;
              font-size: 13px;
            }
            th {
              background-color: #4CAF50;
              color: #ffffff;
              font-weight: bold;
              font-size: 14px;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .signature-section {
              margin-top: 20px;
              display: flex;
              justify-content: space-between;
            }
            .signature-box {
              width: 45%;
              border-top: 1px solid #333333;
              padding-top: 5px;
              text-align: center;
            }
            .signature-box p {
              margin: 3px 0;
              color: #000000;
              font-size: 10px;
            }
            .signature-box p strong {
              font-size: 11px;
            }
            .footer {
              margin-top: 15px;
              padding-top: 8px;
              border-top: 1px solid #dddddd;
              text-align: center;
              color: #666666;
              font-size: 8px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>DEMANDE D'ACHAT</h1>
            <p>Demande N° ${demande.numero}</p>
          </div>

          <div class="info-section">
            <div class="info-row"><strong>Type:</strong>${demande.type === "materiel" ? "Matériel" : "Outillage"}</div>
            <div class="info-row"><strong>Projet:</strong>${demande.projet?.nom || "N/A"}</div>
            <div class="info-row"><strong>Demandeur:</strong>${demande.technicien?.nom || "N/A"} ${demande.technicien?.prenom || ""}</div>
            <div class="info-row"><strong>Date de création:</strong>${new Date(demande.dateCreation).toLocaleDateString("fr-FR")}</div>
            <div class="info-row"><strong>Date de livraison:</strong>${demande.dateLivraisonSouhaitee ? new Date(demande.dateLivraisonSouhaitee).toLocaleDateString("fr-FR") : "N/A"}</div>
          </div>

          <div class="visa-section">
            <h3>Visas et Signatures</h3>
            <table class="visa-table">
              <thead>
                <tr>
                  <th>Rôle</th>
                  <th>Nom</th>
                  <th>Date</th>
                  <th>Heure</th>
                  <th>Visa</th>
                </tr>
              </thead>
              <tbody>
                ${demande.validationConducteur ? `
                <tr>
                  <td>Conducteur Travaux</td>
                  <td>_____________________</td>
                  <td>${demande.validationConducteur.date ? new Date(demande.validationConducteur.date).toLocaleDateString("fr-FR") : "_____"}</td>
                  <td>${demande.validationConducteur.date ? new Date(demande.validationConducteur.date).toLocaleTimeString("fr-FR", {hour: '2-digit', minute: '2-digit'}) : "_____"}</td>
                  <td>✓</td>
                </tr>
                ` : `
                <tr>
                  <td>Conducteur Travaux</td>
                  <td>_____________________</td>
                  <td>_____________________</td>
                  <td>_____________________</td>
                  <td></td>
                </tr>
                `}
                ${demande.validationResponsableTravaux ? `
                <tr>
                  <td>Responsable Travaux</td>
                  <td>_____________________</td>
                  <td>${demande.validationResponsableTravaux.date ? new Date(demande.validationResponsableTravaux.date).toLocaleDateString("fr-FR") : "_____"}</td>
                  <td>${demande.validationResponsableTravaux.date ? new Date(demande.validationResponsableTravaux.date).toLocaleTimeString("fr-FR", {hour: '2-digit', minute: '2-digit'}) : "_____"}</td>
                  <td>✓</td>
                </tr>
                ` : `
                <tr>
                  <td>Responsable Travaux</td>
                  <td>_____________________</td>
                  <td>_____________________</td>
                  <td>_____________________</td>
                  <td></td>
                </tr>
                `}
                ${demande.validationChargeAffaire ? `
                <tr>
                  <td>Chargé d'Affaire</td>
                  <td>_____________________</td>
                  <td>${demande.validationChargeAffaire.date ? new Date(demande.validationChargeAffaire.date).toLocaleDateString("fr-FR") : "_____"}</td>
                  <td>${demande.validationChargeAffaire.date ? new Date(demande.validationChargeAffaire.date).toLocaleTimeString("fr-FR", {hour: '2-digit', minute: '2-digit'}) : "_____"}</td>
                  <td>✓</td>
                </tr>
                ` : `
                <tr>
                  <td>Chargé d'Affaire</td>
                  <td>_____________________</td>
                  <td>_____________________</td>
                  <td>_____________________</td>
                  <td></td>
                </tr>
                `}
              </tbody>
            </table>
          </div>

          <table>
            <thead>
              <tr>
                <th>Article</th>
                <th>Référence</th>
                <th>Unité</th>
                <th>Qté Dem.</th>
                <th>Qté Val.</th>
                <th>Commentaire</th>
              </tr>
            </thead>
            <tbody>
              ${demande.items.map(item => `
                <tr>
                  <td>${item.article?.nom || "N/A"}</td>
                  <td>${item.article?.reference || "N/A"}</td>
                  <td>${item.article?.unite || "N/A"}</td>
                  <td>${item.quantiteDemandee}</td>
                  <td>${item.quantiteValidee || item.quantiteDemandee}</td>
                  <td>${item.commentaire || ""}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>

          <div class="signature-section">
            <div class="signature-box">
              <p><strong>Préparé par (Appro)</strong></p>
              <p>Nom: _____________________</p>
              <p>Date: _____________________</p>
              <p>Signature: _____________________</p>
            </div>
            <div class="signature-box">
              <p><strong>Reçu par (Livreur)</strong></p>
              <p>Nom: _____________________</p>
              <p>Date: _____________________</p>
              <p>Signature: _____________________</p>
            </div>
          </div>

          <div class="footer">
            <p>Document généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString("fr-FR")}</p>
          </div>
        </body>
        </html>
      `)
      iframeDoc.close()

      // Attendre que le contenu soit chargé
      await new Promise(resolve => setTimeout(resolve, 100))

      // Convertir en canvas puis en PDF
      const canvas = await html2canvas(iframeDoc.body, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      })

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
      while (heightLeft > 0) {
        pdf.addPage()
        // Calculer la position négative pour continuer l'image
        position = -(imgHeight - heightLeft)
        // Ajouter les marges pour créer un vrai espace en haut de chaque page
        pdf.addImage(imgData, 'PNG', marginLeft, position + marginTop, imgWidth, imgHeight)
        heightLeft -= availableHeight
      }

      // Télécharger le PDF
      pdf.save(`Bon_Sortie_${demande.numero}_${new Date().toISOString().split("T")[0]}.pdf`)
    } catch (error) {
      alert('Erreur lors de la génération du PDF. Veuillez réessayer.')
    }
  }

  // Filtrer la liste des utilisateurs disponibles pour livraison (assignés au projet de la demande)
  const getLivreursForDemande = () => {
    if (!demandeToPrep) return []
    
    const demande = demandes.find(d => d.id === demandeToPrep)
    if (!demande) return []
    
    // Filtrer tous les utilisateurs assignés au même projet que la demande
    // Prioriser les responsable_livreur, mais permettre les autres rôles
    const utilisateursProjet = users.filter(user => 
      user.projets && 
      user.projets.includes(demande.projetId) &&
      user.role !== "superadmin" // Exclure le superadmin
    )
    
    // Trier pour mettre les responsable_livreur en premier
    const utilisateursTries = utilisateursProjet.sort((a, b) => {
      if (a.role === "responsable_livreur" && b.role !== "responsable_livreur") return -1
      if (a.role !== "responsable_livreur" && b.role === "responsable_livreur") return 1
      return 0
    })
    
    return utilisateursTries
  }
  
  const livreursDisponibles = getLivreursForDemande()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <Card className="bg-gray-50 border-gray-200">
      <CardHeader>
        <CardTitle className="text-gray-800">Demandes à préparer pour sortie</CardTitle>
      </CardHeader>
      <CardContent>
        {demandesAPreparer.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Aucune demande à préparer</p>
          </div>
        ) : (
          <div className="space-y-4">
            {demandesAPreparer.map((demande) => (
              <div
                key={demande.id}
                className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-gray-800">{demande.numero}</h3>
                      <Badge className="bg-green-500 text-white text-xs">{demande.status}</Badge>
                      <Badge variant="outline" className="text-xs">
                        {demande.type === "materiel" ? "Matériel" : "Outillage"}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {demande.items.length} article{demande.items.length > 1 ? "s" : ""} • Validée le{" "}
                      {demande.validationConducteur?.date
                        ? new Date(demande.validationConducteur.date).toLocaleDateString()
                        : demande.validationLogistique?.date
                          ? new Date(demande.validationLogistique.date).toLocaleDateString()
                          : "N/A"}
                    </p>
                    {demande.commentaires && (
                      <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                        <strong>Commentaire:</strong> {demande.commentaires}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => generatePDF(demande)}
                      className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                      title="Générer un PDF pour impression"
                    >
                      <FileDown className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">PDF</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenPreparationModal(demande.id)}
                      disabled={actionLoading === demande.id}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      {actionLoading === demande.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-1" />
                      )}
                      <span className="hidden sm:inline">Préparer</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewDetails(demande)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      <span className="hidden sm:inline">Détails & Prix</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Modal de préparation avec saisie des quantités */}
      <DemandePreparationModal
        isOpen={detailsModalOpen}
        onClose={() => {
          setDetailsModalOpen(false)
          setSelectedDemande(null)
        }}
        demandeId={selectedDemande?.id || null}
        onSave={handleSaveQuantites}
      />

      {/* Modal de préparation de sortie */}
      <Dialog open={preparationModalOpen} onOpenChange={setPreparationModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-green-600" />
              Préparer la sortie
            </DialogTitle>
            <DialogDescription>
              Sélectionnez le livreur qui sera chargé de cette livraison
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Sélection du livreur */}
            <div className="space-y-2">
              <Label htmlFor="livreur" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Livreur <span className="text-red-500">*</span>
              </Label>
              {livreursDisponibles.length === 0 ? (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                  <p className="text-sm text-orange-800">
                    <AlertCircle className="h-4 w-4 inline mr-2" />
                    Aucun utilisateur assigné à ce projet. Veuillez assigner des utilisateurs au projet concerné.
                  </p>
                </div>
              ) : (
                <Select value={selectedLivreur} onValueChange={setSelectedLivreur}>
                  <SelectTrigger id="livreur">
                    <SelectValue placeholder="Choisir un utilisateur pour la livraison..." />
                  </SelectTrigger>
                  <SelectContent className="max-w-md bg-white shadow-lg border-2 border-gray-200 z-[9999]">
                    {livreursDisponibles.map((livreur) => (
                      <SelectItem key={livreur.id} value={livreur.id} className="cursor-pointer bg-white hover:bg-gray-50 focus:bg-gray-100">
                        <div className="flex items-center gap-2 w-full py-1">
                          <User className="h-4 w-4 flex-shrink-0" />
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="font-medium text-sm truncate">{livreur.prenom} {livreur.nom}</span>
                            <Badge 
                              variant="outline" 
                              className={`text-xs w-fit mt-0.5 ${
                                livreur.role === "responsable_livreur" 
                                  ? "bg-green-50 text-green-700 border-green-200" 
                                  : "bg-blue-50 text-blue-700 border-blue-200"
                              }`}
                            >
                              {livreur.role === "responsable_livreur" ? "Livreur" : 
                               livreur.role.replace("responsable_", "Resp. ").replace("_", " ")}
                            </Badge>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {selectedLivreur && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Livreur sélectionné
                </p>
              )}
            </div>

            {/* Commentaire optionnel */}
            <div className="space-y-2">
              <Label htmlFor="commentaire">Commentaire (optionnel)</Label>
              <Textarea
                id="commentaire"
                placeholder="Ajouter un commentaire sur la préparation..."
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleClosePreparationModal}
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button
              onClick={handleConfirmPreparation}
              disabled={!selectedLivreur}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Confirmer la préparation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

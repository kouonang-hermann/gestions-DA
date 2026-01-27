"use client"

import { useState } from "react"
import { X, CheckCircle, XCircle, AlertTriangle, Camera, Trash2 } from "lucide-react"
import { Demande, ItemDemande } from "@/types"

interface ValidationReceptionModalProps {
  demande: Demande
  onClose: () => void
  onValidate: (data: ValidationData) => Promise<void>
}

interface ItemValidation {
  itemId: string
  quantiteValidee: number
  quantiteRecue: number
  quantiteAcceptee: number
  quantiteRefusee: number
  motifRefus?: "endommage" | "non_conforme" | "manquant" | "autre"
  commentaire?: string
  photos?: string[]
}

interface ValidationData {
  items: ItemValidation[]
  commentaireGeneral?: string
  refuserTout?: boolean
}

export default function ValidationReceptionModal({
  demande,
  onClose,
  onValidate,
}: ValidationReceptionModalProps) {
  const [etape, setEtape] = useState<"saisie" | "confirmation">("saisie")
  const [isLoading, setIsLoading] = useState(false)
  const [refuserTout, setRefuserTout] = useState(false)
  const [commentaireGeneral, setCommentaireGeneral] = useState("")

  // Initialiser les validations pour chaque item
  const [itemsValidation, setItemsValidation] = useState<ItemValidation[]>(
    demande.items.map((item) => {
      const quantiteValidee = item.quantiteValidee || item.quantiteDemandee
      return {
        itemId: item.id,
        quantiteValidee,
        quantiteRecue: quantiteValidee,
        quantiteAcceptee: quantiteValidee,
        quantiteRefusee: 0,
        photos: [],
      }
    })
  )

  const handleQuantiteRecueChange = (itemId: string, value: number) => {
    setItemsValidation((prev) =>
      prev.map((item) => {
        if (item.itemId === itemId) {
          const quantiteAcceptee = Math.min(value, item.quantiteValidee)
          const quantiteRefusee = item.quantiteValidee - quantiteAcceptee
          return {
            ...item,
            quantiteRecue: value,
            quantiteAcceptee,
            quantiteRefusee,
          }
        }
        return item
      })
    )
  }

  const handleQuantiteAccepteeChange = (itemId: string, value: number) => {
    setItemsValidation((prev) =>
      prev.map((item) => {
        if (item.itemId === itemId) {
          const quantiteAcceptee = Math.min(value, item.quantiteRecue)
          const quantiteRefusee = item.quantiteRecue - quantiteAcceptee
          return {
            ...item,
            quantiteAcceptee,
            quantiteRefusee,
          }
        }
        return item
      })
    )
  }

  const handleMotifRefusChange = (
    itemId: string,
    motif: "endommage" | "non_conforme" | "manquant" | "autre"
  ) => {
    setItemsValidation((prev) =>
      prev.map((item) => (item.itemId === itemId ? { ...item, motifRefus: motif } : item))
    )
  }

  const handleCommentaireChange = (itemId: string, commentaire: string) => {
    setItemsValidation((prev) =>
      prev.map((item) => (item.itemId === itemId ? { ...item, commentaire } : item))
    )
  }

  const handlePhotoUpload = async (itemId: string, file: File) => {
    // Simuler l'upload de photo (à implémenter avec votre système de stockage)
    const photoUrl = URL.createObjectURL(file)
    setItemsValidation((prev) =>
      prev.map((item) =>
        item.itemId === itemId
          ? { ...item, photos: [...(item.photos || []), photoUrl] }
          : item
      )
    )
  }

  const handleRemovePhoto = (itemId: string, photoIndex: number) => {
    setItemsValidation((prev) =>
      prev.map((item) =>
        item.itemId === itemId
          ? { ...item, photos: item.photos?.filter((_, i) => i !== photoIndex) }
          : item
      )
    )
  }

  const getItemArticle = (itemId: string): ItemDemande | undefined => {
    return demande.items.find((item) => item.id === itemId)
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const data: ValidationData = {
        items: itemsValidation,
        commentaireGeneral,
        refuserTout,
      }
      await onValidate(data)
      onClose()
    } catch (error) {
      console.error("Erreur lors de la validation:", error)
      alert("Erreur lors de la validation de réception")
    } finally {
      setIsLoading(false)
    }
  }

  const itemsAvecAnomalie = itemsValidation.filter(
    (item) => item.quantiteRefusee > 0 || item.quantiteRecue < item.quantiteValidee
  )

  const tousAcceptes = itemsValidation.every(
    (item) => item.quantiteAcceptee === item.quantiteValidee && item.quantiteRefusee === 0
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ backgroundColor: "#015fc4" }}>
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">Validation de réception</h2>
              <p className="text-sm text-white opacity-90">Demande {demande.numero}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {etape === "saisie" ? (
            <div className="space-y-6">
              {/* Option refuser tout */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={refuserTout}
                    onChange={(e) => setRefuserTout(e.target.checked)}
                    className="w-5 h-5 text-red-600 rounded"
                  />
                  <div>
                    <div className="font-semibold text-red-900">Refuser toute la livraison</div>
                    <div className="text-sm text-red-700">
                      La demande sera renvoyée au responsable appro pour retraitement
                    </div>
                  </div>
                </label>
              </div>

              {!refuserTout && (
                <>
                  {/* Liste des articles */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Articles livrés</h3>
                    {itemsValidation.map((itemValidation) => {
                      const item = getItemArticle(itemValidation.itemId)
                      if (!item) return null

                      const hasAnomalie =
                        itemValidation.quantiteRefusee > 0 ||
                        itemValidation.quantiteRecue < itemValidation.quantiteValidee

                      return (
                        <div
                          key={itemValidation.itemId}
                          className={`border rounded-lg p-4 ${
                            hasAnomalie ? "border-orange-300 bg-orange-50" : "border-gray-200"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h4 className="font-semibold">{item.article?.nom || "Article"}</h4>
                              <p className="text-sm text-gray-600">
                                Référence: {item.article?.reference}
                              </p>
                              <p className="text-sm text-gray-600">
                                Quantité validée: {itemValidation.quantiteValidee} {item.article?.unite}
                              </p>
                            </div>
                            {hasAnomalie && (
                              <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Quantité reçue */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quantité reçue *
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={itemValidation.quantiteRecue}
                                onChange={(e) => {
                                  const value = e.target.value
                                  if (value === "") {
                                    handleQuantiteRecueChange(itemValidation.itemId, 0)
                                  } else {
                                    const num = parseInt(value)
                                    if (!isNaN(num) && num >= 0) {
                                      handleQuantiteRecueChange(itemValidation.itemId, num)
                                    }
                                  }
                                }}
                                onBlur={(e) => {
                                  if (e.target.value === "" || parseInt(e.target.value) < 0) {
                                    handleQuantiteRecueChange(itemValidation.itemId, 0)
                                  }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            {/* Quantité acceptée */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quantité acceptée *
                              </label>
                              <input
                                type="number"
                                min="0"
                                max={itemValidation.quantiteRecue}
                                value={itemValidation.quantiteAcceptee}
                                onChange={(e) => {
                                  const value = e.target.value
                                  if (value === "") {
                                    handleQuantiteAccepteeChange(itemValidation.itemId, 0)
                                  } else {
                                    const num = parseInt(value)
                                    if (!isNaN(num) && num >= 0) {
                                      handleQuantiteAccepteeChange(itemValidation.itemId, num)
                                    }
                                  }
                                }}
                                onBlur={(e) => {
                                  if (e.target.value === "" || parseInt(e.target.value) < 0) {
                                    handleQuantiteAccepteeChange(itemValidation.itemId, 0)
                                  }
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            {/* Quantité refusée */}
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quantité refusée
                              </label>
                              <input
                                type="number"
                                value={itemValidation.quantiteRefusee}
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                              />
                            </div>
                          </div>

                          {/* Motif de refus si anomalie */}
                          {itemValidation.quantiteRefusee > 0 && (
                            <div className="mt-4 space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Motif du refus *
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  {[
                                    { value: "endommage", label: "Endommagé" },
                                    { value: "non_conforme", label: "Non conforme" },
                                    { value: "manquant", label: "Manquant" },
                                    { value: "autre", label: "Autre" },
                                  ].map((motif) => (
                                    <button
                                      key={motif.value}
                                      type="button"
                                      onClick={() =>
                                        handleMotifRefusChange(
                                          itemValidation.itemId,
                                          motif.value as any
                                        )
                                      }
                                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        itemValidation.motifRefus === motif.value
                                          ? "bg-red-600 text-white"
                                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                      }`}
                                    >
                                      {motif.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Commentaire
                                </label>
                                <textarea
                                  value={itemValidation.commentaire || ""}
                                  onChange={(e) =>
                                    handleCommentaireChange(itemValidation.itemId, e.target.value)
                                  }
                                  rows={2}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                  placeholder="Précisez le problème..."
                                />
                              </div>

                              {/* Photos */}
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Photos (optionnel)
                                </label>
                                <div className="flex flex-wrap gap-2">
                                  {itemValidation.photos?.map((photo, index) => (
                                    <div key={index} className="relative">
                                      <img
                                        src={photo}
                                        alt={`Photo ${index + 1}`}
                                        className="w-20 h-20 object-cover rounded-lg"
                                      />
                                      <button
                                        onClick={() =>
                                          handleRemovePhoto(itemValidation.itemId, index)
                                        }
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  ))}
                                  <label className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                                    <Camera className="w-6 h-6 text-gray-400" />
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) {
                                          handlePhotoUpload(itemValidation.itemId, file)
                                        }
                                      }}
                                    />
                                  </label>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {/* Commentaire général */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commentaire général
                </label>
                <textarea
                  value={commentaireGeneral}
                  onChange={(e) => setCommentaireGeneral(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ajoutez un commentaire sur la livraison..."
                />
              </div>
            </div>
          ) : (
            // Étape de confirmation
            <div className="space-y-6">
              <div className="text-center">
                {refuserTout ? (
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                    <XCircle className="w-8 h-8 text-red-600" />
                  </div>
                ) : tousAcceptes ? (
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                ) : (
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-4">
                    <AlertTriangle className="w-8 h-8 text-orange-600" />
                  </div>
                )}

                <h3 className="text-xl font-bold mb-2">
                  {refuserTout
                    ? "Refus total de la livraison"
                    : tousAcceptes
                    ? "Réception validée"
                    : "Réception partielle"}
                </h3>
                <p className="text-gray-600">
                  {refuserTout
                    ? "La demande sera renvoyée au responsable appro"
                    : tousAcceptes
                    ? "Tous les articles ont été reçus conformément"
                    : "Une sous-demande sera créée pour les articles manquants ou refusés"}
                </p>
              </div>

              {!refuserTout && itemsAvecAnomalie.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-900 mb-2">
                    Articles avec anomalie ({itemsAvecAnomalie.length})
                  </h4>
                  <ul className="space-y-2">
                    {itemsAvecAnomalie.map((itemValidation) => {
                      const item = getItemArticle(itemValidation.itemId)
                      return (
                        <li key={itemValidation.itemId} className="text-sm text-orange-800">
                          <span className="font-medium">{item?.article?.nom}</span> -{" "}
                          {itemValidation.quantiteRefusee} {item?.article?.unite} refusé(s)
                          {itemValidation.motifRefus && ` (${itemValidation.motifRefus})`}
                        </li>
                      )
                    })}
                  </ul>
                </div>
              )}

              {commentaireGeneral && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Commentaire</h4>
                  <p className="text-sm text-gray-700">{commentaireGeneral}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <div className="flex gap-3">
            {etape === "confirmation" && (
              <button
                onClick={() => setEtape("saisie")}
                disabled={isLoading}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Retour
              </button>
            )}
            <button
              onClick={() => {
                if (etape === "saisie") {
                  setEtape("confirmation")
                } else {
                  handleSubmit()
                }
              }}
              disabled={isLoading}
              className="px-6 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50"
              style={{ backgroundColor: "#015fc4" }}
            >
              {isLoading
                ? "Traitement..."
                : etape === "saisie"
                ? "Continuer"
                : "Valider la réception"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

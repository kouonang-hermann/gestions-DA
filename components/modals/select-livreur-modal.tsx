"use client"

import { useState } from "react"
import { X, User, Truck, Search } from "lucide-react"
import { User as UserType } from "@/types"

interface SelectLivreurModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectLivreur: (livreurId: string | null) => void
  users: UserType[]
  livreurOfficielId?: string
}

export default function SelectLivreurModal({
  isOpen,
  onClose,
  onSelectLivreur,
  users,
  livreurOfficielId
}: SelectLivreurModalProps) {
  const [showEmployeeList, setShowEmployeeList] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  if (!isOpen) return null

  const livreurOfficiel = users.find(u => u.id === livreurOfficielId)
  
  const filteredUsers = users.filter(u => 
    u.id !== livreurOfficielId &&
    (u.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
     u.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
     u.email?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleSelectOfficiel = () => {
    if (livreurOfficielId) {
      onSelectLivreur(livreurOfficielId)
      onClose()
    }
  }

  const handleSelectEmployee = (userId: string) => {
    onSelectLivreur(userId)
    onClose()
  }

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      superadmin: "Super Admin",
      employe: "Employé",
      conducteur_travaux: "Conducteur de Travaux",
      responsable_travaux: "Responsable Travaux",
      responsable_logistique: "Responsable Logistique",
      responsable_appro: "Responsable Appro",
      charge_affaire: "Chargé d'Affaire",
      responsable_livreur: "Responsable Livreur"
    }
    return labels[role] || role
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Choisir le livreur
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!showEmployeeList ? (
            /* Choix initial : Livreur officiel ou autre */
            <div className="space-y-4">
              <p className="text-gray-600 mb-6">
                Qui va effectuer la livraison de cette demande ?
              </p>

              {/* Option 1 : Livreur officiel */}
              {livreurOfficiel ? (
                <button
                  onClick={handleSelectOfficiel}
                  className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-[#015fc4] hover:bg-blue-50 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#015fc4] flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                      <Truck size={24} />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        Livreur officiel
                      </h3>
                      <p className="text-gray-600">
                        {livreurOfficiel.prenom} {livreurOfficiel.nom}
                      </p>
                      <p className="text-sm text-gray-500">
                        {livreurOfficiel.email}
                      </p>
                    </div>
                  </div>
                </button>
              ) : (
                <div className="p-6 border-2 border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-white">
                      <Truck size={24} />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-gray-700 text-lg">
                        Aucun livreur officiel
                      </h3>
                      <p className="text-gray-500 text-sm">
                        Aucun utilisateur avec le rôle "Responsable Livreur" n'est disponible
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Option 2 : Autre employé */}
              <button
                onClick={() => setShowEmployeeList(true)}
                className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-[#015fc4] hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#b8d1df] flex items-center justify-center text-[#015fc4] group-hover:scale-110 transition-transform">
                    <User size={24} />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-gray-900 text-lg">
                      Choisir un autre employé
                    </h3>
                    <p className="text-gray-600">
                      Sélectionner un employé pour effectuer la livraison
                    </p>
                  </div>
                </div>
              </button>
            </div>
          ) : (
            /* Liste des employés */
            <div className="space-y-4">
              <button
                onClick={() => setShowEmployeeList(false)}
                className="text-[#015fc4] hover:underline mb-4 flex items-center gap-2"
              >
                ← Retour aux options
              </button>

              {/* Barre de recherche */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Rechercher un employé..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#015fc4] focus:border-transparent"
                />
              </div>

              {/* Liste scrollable des employés */}
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectEmployee(user.id)}
                      className="w-full p-4 border border-gray-200 rounded-lg hover:border-[#015fc4] hover:bg-blue-50 transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#b8d1df] flex items-center justify-center text-[#015fc4] font-semibold">
                          {user.prenom[0]}{user.nom[0]}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {user.prenom} {user.nom}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {user.email}
                          </p>
                          <span className="inline-block mt-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                            {getRoleLabel(user.role)}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Aucun employé trouvé
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  )
}

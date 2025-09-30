"use client"

import { useState } from "react"
import { 
  Plus, 
  Settings, 
  Bell, 
  Home, 
  User, 
  FileText,
  Package,
  Wrench,
  Users,
  BarChart3,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  Archive
} from 'lucide-react'

interface MobileAction {
  id: string
  label: string
  icon: React.ReactNode
  color: string
  textColor: string
  onClick: () => void
}

interface MobileRequest {
  id: string
  numero: string
  type: string
  status: string
  dateCreation: Date
  itemsCount: number
}

interface UniversalMobileDashboardProps {
  userRole: string
  userName: string
  userInitials: string
  mainButtonLabel: string
  mainButtonAction: () => void
  sectionTitle: string
  requests: MobileRequest[]
  actions: MobileAction[]
  onNavigateToRequests: () => void
  onNavigateToProfile: () => void
}

export default function UniversalMobileDashboard({
  userRole,
  userName,
  userInitials,
  mainButtonLabel,
  mainButtonAction,
  sectionTitle,
  requests,
  actions,
  onNavigateToRequests,
  onNavigateToProfile
}: UniversalMobileDashboardProps) {

  const getStatusForMobile = (status: string) => {
    const statusMap: Record<string, { label: string; class: string }> = {
      "brouillon": { label: "Brouillon", class: "status-brouillon" },
      "soumise": { label: "Soumise", class: "status-soumise" },
      "en_attente_validation_conducteur": { label: "En cours", class: "status-en-cours" },
      "en_attente_validation_qhse": { label: "En cours", class: "status-en-cours" },
      "en_attente_validation_responsable_travaux": { label: "En cours", class: "status-en-cours" },
      "en_attente_validation_charge_affaire": { label: "En cours", class: "status-en-cours" },
      "en_attente_preparation_appro": { label: "En cours", class: "status-en-cours" },
      "en_attente_validation_logistique": { label: "En cours", class: "status-en-cours" },
      "en_attente_validation_finale_demandeur": { label: "En cours", class: "status-en-cours" },
      "confirmee_demandeur": { label: "Validée", class: "status-validee" },
      "cloturee": { label: "Clôturée", class: "status-validee" },
      "rejetee": { label: "Rejetée", class: "status-rejetee" },
      "archivee": { label: "Archivée", class: "status-archivee" }
    }
    return statusMap[status] || { label: status, class: "status-default" }
  }

  return (
    <div className="mobile-dashboard">
      {/* Header Mobile */}
      <div className="mobile-header">
        <div className="mobile-header-left">
          <div className="mobile-logo">
            {userInitials}
          </div>
          <div className="mobile-header-text">
            <h1 className="mobile-header-title">Gestion Demandes</h1>
            <p className="mobile-header-subtitle">{userRole}</p>
          </div>
        </div>
        <div className="mobile-header-actions">
          <button className="mobile-header-icon">
            <Settings size={20} />
          </button>
          <button className="mobile-header-icon">
            <Bell size={20} />
          </button>
          <div className="mobile-avatar">
            {userInitials}
          </div>
        </div>
      </div>

      {/* Contenu Mobile */}
      <div className="mobile-content">
        {/* Bouton Principal */}
        <button 
          className="mobile-main-button"
          onClick={mainButtonAction}
        >
          <Plus size={20} />
          {mainButtonLabel}
        </button>

        {/* Section des demandes récentes */}
        <div className="mobile-section">
          <h2 className="mobile-section-title">{sectionTitle}</h2>
          <div className="mobile-demandes-list">
            {requests.length > 0 ? (
              requests.slice(0, 3).map((request) => {
                const statusInfo = getStatusForMobile(request.status)
                return (
                  <div key={request.id} className="mobile-demande-item">
                    <div className="mobile-demande-header">
                      <h3 className="mobile-demande-title">
                        DA-{request.numero} - {request.type}
                      </h3>
                      <span className={`mobile-demande-status ${statusInfo.class}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="mobile-demande-info">
                      {new Date(request.dateCreation).toLocaleDateString('fr-FR')} • {request.itemsCount} article(s)
                    </p>
                  </div>
                )
              })
            ) : (
              <p className="mobile-demande-info">Aucune demande récente</p>
            )}
          </div>
        </div>

        {/* Actions Rapides */}
        <div>
          <h2 className="mobile-actions-title">Actions Rapides</h2>
          <div className="mobile-actions-grid">
            {actions.map((action) => (
              <button 
                key={action.id}
                className="mobile-action-button"
                style={{ 
                  backgroundColor: action.color,
                  color: action.textColor
                }}
                onClick={action.onClick}
              >
                {action.icon}
                <span className="mobile-action-text">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Bottom */}
      <div className="mobile-bottom-nav">
        <div className="mobile-nav-item mobile-nav-active">
          <Home className="mobile-nav-icon" />
          <span className="mobile-nav-label">Accueil</span>
        </div>
        <div className="mobile-nav-item" onClick={onNavigateToRequests}>
          <FileText className="mobile-nav-icon" />
          <span className="mobile-nav-label">Mes demandes</span>
        </div>
        <div className="mobile-nav-item" onClick={onNavigateToProfile}>
          <User className="mobile-nav-icon" />
          <span className="mobile-nav-label">Profil</span>
        </div>
      </div>
    </div>
  )
}

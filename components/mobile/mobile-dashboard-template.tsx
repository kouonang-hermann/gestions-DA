"use client"

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
  FolderOpen
} from 'lucide-react'

interface MobileAction {
  id: string
  label: string
  icon: React.ReactNode
  className: string
  onClick: () => void
}

interface MobileDashboardTemplateProps {
  userRole: string
  userInitials: string
  mainButtonLabel: string
  mainButtonAction: () => void
  sectionTitle: string
  requests: any[]
  actions: MobileAction[]
  getStatusForMobile: (status: string) => { label: string; class: string }
}

export default function MobileDashboardTemplate({
  userRole,
  userInitials,
  mainButtonLabel,
  mainButtonAction,
  sectionTitle,
  requests,
  actions,
  getStatusForMobile
}: MobileDashboardTemplateProps) {

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
                        DA-{request.numero} - {request.type === "materiel" ? "Matériel" : "Outillage"}
                      </h3>
                      <span className={`mobile-demande-status ${statusInfo.class}`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <p className="mobile-demande-info">
                      {new Date(request.dateCreation).toLocaleDateString('fr-FR')} • {request.items?.length || 0} article(s)
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
                className={action.className}
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
        <div className="mobile-nav-item">
          <FileText className="mobile-nav-icon" />
          <span className="mobile-nav-label">Mes demandes</span>
        </div>
        <div className="mobile-nav-item">
          <User className="mobile-nav-icon" />
          <span className="mobile-nav-label">Profil</span>
        </div>
      </div>
    </div>
  )
}

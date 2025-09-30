"use client"

import { useEffect, useState } from 'react'
import { useStore } from '@/stores/useStore'
import { 
  Settings, 
  Bell, 
  Home, 
  User, 
  FileText,
  Users,
  FolderOpen,
  BarChart3,
  CreditCard,
  Package,
  Wrench,
  Plus
} from 'lucide-react'

// Composant qui s'injecte automatiquement sur mobile pour tous les dashboards
export default function UniversalMobileInjector() {
  const { currentUser } = useStore()
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const getUserInitials = () => {
    if (!currentUser) return "U"
    return `${currentUser.prenom?.[0] || ''}${currentUser.nom?.[0] || ''}`.toUpperCase() || "U"
  }

  const getRoleDisplayName = () => {
    const roleMap: Record<string, string> = {
      'superadmin': 'Super Administrateur',
      'employe': 'Employé',
      'conducteur_travaux': 'Conducteur Travaux',
      'responsable_travaux': 'Responsable Travaux',
      'responsable_qhse': 'Responsable QHSE',
      'responsable_appro': 'Responsable Appro',
      'charge_affaire': 'Chargé d\'Affaire',
      'responsable_logistique': 'Responsable Logistique'
    }
    return roleMap[currentUser?.role || ''] || 'Utilisateur'
  }

  const getMainAction = () => {
    const actionMap: Record<string, { label: string; icon: React.ReactNode }> = {
      'superadmin': { label: 'Nouvel Utilisateur', icon: <Users size={20} /> },
      'employe': { label: 'Nouvelle Demande', icon: <Plus size={20} /> },
      'conducteur_travaux': { label: 'Valider Demande', icon: <FileText size={20} /> },
      'responsable_travaux': { label: 'Valider Demande', icon: <FileText size={20} /> },
      'responsable_qhse': { label: 'Valider Sécurité', icon: <FileText size={20} /> },
      'responsable_appro': { label: 'Préparer Sortie', icon: <Package size={20} /> },
      'charge_affaire': { label: 'Valider Budget', icon: <CreditCard size={20} /> },
      'responsable_logistique': { label: 'Valider Logistique', icon: <FileText size={20} /> }
    }
    return actionMap[currentUser?.role || ''] || { label: 'Action', icon: <Plus size={20} /> }
  }

  const getQuickActions = () => {
    const actionsMap: Record<string, Array<{ icon: React.ReactNode; label: string }>> = {
      'superadmin': [
        { icon: <Users size={18} />, label: 'Utilisateurs' },
        { icon: <FolderOpen size={18} />, label: 'Projets' },
        { icon: <BarChart3 size={18} />, label: 'Rapports' },
        { icon: <Settings size={18} />, label: 'Paramètres' }
      ],
      'employe': [
        { icon: <Package size={18} />, label: 'DA-Matériel' },
        { icon: <Wrench size={18} />, label: 'DA-Outillage' },
        { icon: <FolderOpen size={18} />, label: 'Projets' },
        { icon: <BarChart3 size={18} />, label: 'Rapports' }
      ],
      'conducteur_travaux': [
        { icon: <FileText size={18} />, label: 'Valider' },
        { icon: <FolderOpen size={18} />, label: 'Projets' },
        { icon: <Users size={18} />, label: 'Équipe' },
        { icon: <BarChart3 size={18} />, label: 'Rapports' }
      ],
      'responsable_travaux': [
        { icon: <FileText size={18} />, label: 'Valider' },
        { icon: <Users size={18} />, label: 'Équipe' },
        { icon: <FolderOpen size={18} />, label: 'Projets' },
        { icon: <BarChart3 size={18} />, label: 'Rapports' }
      ],
      'responsable_qhse': [
        { icon: <FileText size={18} />, label: 'Sécurité' },
        { icon: <BarChart3 size={18} />, label: 'Rapports' },
        { icon: <Settings size={18} />, label: 'Normes' },
        { icon: <Users size={18} />, label: 'Formation' }
      ],
      'responsable_appro': [
        { icon: <Package size={18} />, label: 'Préparer' },
        { icon: <Wrench size={18} />, label: 'Stock' },
        { icon: <BarChart3 size={18} />, label: 'Rapports' },
        { icon: <Settings size={18} />, label: 'Fournisseurs' }
      ],
      'charge_affaire': [
        { icon: <CreditCard size={18} />, label: 'Budget' },
        { icon: <BarChart3 size={18} />, label: 'Rapports' },
        { icon: <FolderOpen size={18} />, label: 'Projets' },
        { icon: <FileText size={18} />, label: 'Contrats' }
      ],
      'responsable_logistique': [
        { icon: <FileText size={18} />, label: 'Valider' },
        { icon: <Package size={18} />, label: 'Livraisons' },
        { icon: <BarChart3 size={18} />, label: 'Rapports' },
        { icon: <Settings size={18} />, label: 'Transport' }
      ]
    }
    return actionsMap[currentUser?.role || ''] || []
  }

  if (!isMobile || !currentUser) return null

  const mainAction = getMainAction()
  const quickActions = getQuickActions()

  return (
    <div className="universal-mobile-dashboard">
      {/* Header Mobile Universel */}
      <div className="universal-mobile-header">
        <div className="universal-mobile-header-left">
          <div className="universal-mobile-logo">
            {getUserInitials()}
          </div>
          <div className="universal-mobile-header-text">
            <h1>Gestion Demandes</h1>
            <p>{getRoleDisplayName()}</p>
          </div>
        </div>
        <div className="universal-mobile-header-actions">
          <button className="universal-mobile-header-icon">
            <Settings size={20} />
          </button>
          <button className="universal-mobile-header-icon">
            <Bell size={20} />
          </button>
          <div className="universal-mobile-avatar">
            {getUserInitials()}
          </div>
        </div>
      </div>

      {/* Contenu Mobile Universel */}
      <div className="universal-mobile-content">
        {/* Message de bienvenue */}
        <div className="universal-mobile-message">
          <h2>Bienvenue {currentUser.prenom}</h2>
          <p>Interface mobile optimisée pour votre rôle de {getRoleDisplayName()}. Accédez rapidement à vos fonctionnalités principales.</p>
          <button className="universal-mobile-button">
            {mainAction.icon}
            {mainAction.label}
          </button>
        </div>

        {/* Actions rapides */}
        <div className="universal-mobile-actions">
          <h3>Actions Rapides</h3>
          <div className="universal-mobile-actions-grid">
            {quickActions.map((action, index) => (
              <div key={index} className="universal-mobile-action-item">
                {action.icon}
                <span>{action.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Bottom Universelle */}
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

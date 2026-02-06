"use client"

import { useEffect, useState } from 'react'
import { useStore } from '@/stores/useStore'
import UniversalClosureModal from '@/components/modals/universal-closure-modal'
import MobileValidationSection from '@/components/mobile/mobile-validation-section'
import MobileLivraisonsSection from '@/components/mobile/mobile-livraisons-section'
import MobileApproSection from '@/components/mobile/mobile-appro-section'
import CreateDemandeModal from '@/components/demandes/create-demande-modal'
import DemandesCategoryModal from '@/components/modals/demandes-category-modal'
import { useAutoReload } from '@/hooks/useAutoReload'
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
  Plus,
  CheckCircle,
  Clock,
  Truck,
  RefreshCw,
  Archive,
  XCircle
} from 'lucide-react'

// Composant qui s'injecte automatiquement sur mobile pour tous les dashboards
export default function UniversalMobileInjector() {
  const { currentUser, demandes, canUserValidateStep } = useStore()
  const [isMobile, setIsMobile] = useState(false)
  const [universalClosureModalOpen, setUniversalClosureModalOpen] = useState(false)
  const [createDemandeModalOpen, setCreateDemandeModalOpen] = useState(false)
  const [demandeType, setDemandeType] = useState<'materiel' | 'outillage'>('materiel')
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [detailsModalTitle, setDetailsModalTitle] = useState("")
  const [detailsModalType, setDetailsModalType] = useState<"total" | "enCours" | "validees" | "brouillons">("total")
  const { handleManualReload } = useAutoReload("MOBILE")

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
      'responsable_appro': 'Responsable Appro',
      'charge_affaire': 'Chargé d\'Affaire',
      'responsable_logistique': 'Responsable Logistique',
      'responsable_livreur': 'Responsable Livreur'
    }
    return roleMap[currentUser?.role || ''] || 'Utilisateur'
  }

  const getMainAction = () => {
    const actionMap: Record<string, { label: string; icon: React.ReactNode }> = {
      'superadmin': { label: 'Nouvel Utilisateur', icon: <Users size={20} /> },
      'employe': { label: 'Nouvelle Demande', icon: <Plus size={20} /> },
      'conducteur_travaux': { label: 'Valider Demande', icon: <FileText size={20} /> },
      'responsable_travaux': { label: 'Valider Demande', icon: <FileText size={20} /> },
      'responsable_appro': { label: 'Préparer Sortie', icon: <Package size={20} /> },
      'charge_affaire': { label: 'Valider Budget', icon: <CreditCard size={20} /> },
      'responsable_logistique': { label: 'Valider Logistique', icon: <FileText size={20} /> },
      'responsable_livreur': { label: 'Gérer Livraisons', icon: <Package size={20} /> }
    }
    return actionMap[currentUser?.role || ''] || { label: 'Action', icon: <Plus size={20} /> }
  }

  const getQuickActions = () => {
    const actionsMap: Record<string, Array<{ icon: React.ReactNode; label: string; action?: string }>> = {
      'superadmin': [
        { icon: <Users size={18} />, label: 'Utilisateurs' },
        { icon: <Clock size={18} />, label: 'En cours', action: 'enCours' },
        { icon: <CheckCircle size={18} />, label: 'Clôturer', action: 'closure' }
      ],
      'employe': [
        { icon: <Package size={18} />, label: 'DA-Matériel', action: 'materiel' },
        { icon: <Wrench size={18} />, label: 'DA-Outillage', action: 'outillage' },
        { icon: <Clock size={18} />, label: 'En cours', action: 'enCours' },
        { icon: <CheckCircle size={18} />, label: 'Clôturer', action: 'closure' }
      ],
      'conducteur_travaux': [
        { icon: <Package size={18} />, label: 'DA-Matériel', action: 'materiel' },
        { icon: <Wrench size={18} />, label: 'DA-Outillage', action: 'outillage' },
        { icon: <Clock size={18} />, label: 'En cours', action: 'enCours' },
        { icon: <CheckCircle size={18} />, label: 'Clôturer', action: 'closure' },
        { icon: <RefreshCw size={18} />, label: 'Actualiser', action: 'refresh' }
      ],
      'responsable_travaux': [
        { icon: <Package size={18} />, label: 'DA-Matériel', action: 'materiel' },
        { icon: <Wrench size={18} />, label: 'DA-Outillage', action: 'outillage' },
        { icon: <Clock size={18} />, label: 'En cours', action: 'enCours' },
        { icon: <CheckCircle size={18} />, label: 'Clôturer', action: 'closure' },
        { icon: <RefreshCw size={18} />, label: 'Actualiser', action: 'refresh' }
      ],
      'responsable_appro': [
        { icon: <Package size={18} />, label: 'DA-Matériel', action: 'materiel' },
        { icon: <Clock size={18} />, label: 'En cours', action: 'enCours' },
        { icon: <CheckCircle size={18} />, label: 'Clôturer', action: 'closure' },
        { icon: <RefreshCw size={18} />, label: 'Actualiser', action: 'refresh' }
      ],
      'charge_affaire': [
        { icon: <Package size={18} />, label: 'DA-Matériel', action: 'materiel' },
        { icon: <CreditCard size={18} />, label: 'Budget' },
        { icon: <Clock size={18} />, label: 'En cours', action: 'enCours' },
        { icon: <CheckCircle size={18} />, label: 'Clôturer', action: 'closure' },
        { icon: <RefreshCw size={18} />, label: 'Actualiser', action: 'refresh' }
      ],
      'responsable_logistique': [
        { icon: <Wrench size={18} />, label: 'DA-Outillage', action: 'outillage' },
        { icon: <Clock size={18} />, label: 'En cours', action: 'enCours' },
        { icon: <CheckCircle size={18} />, label: 'Clôturer', action: 'closure' },
        { icon: <RefreshCw size={18} />, label: 'Actualiser', action: 'refresh' }
      ],
      'responsable_livreur': [
        { icon: <Package size={18} />, label: 'Livraisons' },
        { icon: <Clock size={18} />, label: 'En cours', action: 'enCours' },
        { icon: <CheckCircle size={18} />, label: 'Clôturer', action: 'closure' },
        { icon: <RefreshCw size={18} />, label: 'Actualiser', action: 'refresh' }
      ]
    }
    return actionsMap[currentUser?.role || ''] || []
  }

  // Calculer les statistiques selon le rôle
  const getStats = () => {
    if (!currentUser || !demandes) return { total: 0, aValider: 0, enCours: 0, validees: 0 }

    const mesDemandesCreees = demandes.filter(d => d && d.technicienId === currentUser.id)
    const demandesProjet = demandes.filter(d => 
      d && d.projetId && (!currentUser.projets || currentUser.projets.length === 0 || currentUser.projets.includes(d.projetId))
    )

    // Demandes à valider selon le rôle
    const demandesAValider = demandesProjet.filter(d => d && d.type && d.status && canUserValidateStep(currentUser.role, d.type, d.status))

    // Livraisons assignées
    const livraisonsAssignees = demandes.filter(d => 
      d && d.livreurAssigneId === currentUser.id &&
      d.status && ["en_attente_reception_livreur", "en_attente_livraison"].includes(d.status)
    )

    // Demandes à préparer (appro)
    const demandesAPreparer = demandesProjet.filter(d => 
      d && d.type === "materiel" && d.status === "en_attente_preparation_appro"
    )

    // Mes demandes en cours
    const mesDemandesEnCours = mesDemandesCreees.filter(d => 
      d && d.status && !["brouillon", "cloturee", "rejetee", "archivee"].includes(d.status)
    )

    // Mes demandes clôturées
    const mesDemandesValidees = mesDemandesCreees.filter(d => 
      d && d.status && ["cloturee", "archivee"].includes(d.status)
    )

    return {
      total: mesDemandesCreees.length,
      aValider: demandesAValider.length,
      livraisons: livraisonsAssignees.length,
      aPreparer: demandesAPreparer.length,
      enCours: mesDemandesEnCours.length,
      validees: mesDemandesValidees.length
    }
  }

  const stats = getStats()

  // Récupérer les demandes rejetées de l'utilisateur
  const getDemandesRejetees = () => {
    if (!currentUser) return []
    return demandes.filter(d => 
      d && d.technicienId === currentUser.id && 
      d.status === "rejetee"
    )
  }

  const demandesRejetees = getDemandesRejetees()

  // Filtrer les demandes pour la modale
  const getFilteredDemandes = (type: "total" | "enCours" | "validees" | "brouillons") => {
    if (!currentUser) return []
    const mesDemandesCreees = demandes.filter(d => d && d.technicienId === currentUser.id)
    
    switch (type) {
      case "total":
        return mesDemandesCreees
      case "enCours":
        return mesDemandesCreees.filter(d => d && d.status && !["brouillon", "cloturee", "rejetee", "archivee"].includes(d.status))
      case "validees":
        return mesDemandesCreees.filter(d => d && d.status && ["cloturee", "archivee"].includes(d.status))
      case "brouillons":
        return mesDemandesCreees.filter(d => d && d.status === "brouillon")
      default:
        return []
    }
  }

  const handleCardClick = (type: "total" | "enCours" | "validees" | "brouillons", title: string) => {
    setDetailsModalType(type)
    setDetailsModalTitle(title)
    setDetailsModalOpen(true)
  }

  const handleActionClick = (action?: string) => {
    switch (action) {
      case 'closure':
        setUniversalClosureModalOpen(true)
        break
      case 'materiel':
        setDemandeType('materiel')
        setCreateDemandeModalOpen(true)
        break
      case 'outillage':
        setDemandeType('outillage')
        setCreateDemandeModalOpen(true)
        break
      case 'refresh':
        handleManualReload()
        break
      case 'enCours':
        handleCardClick('enCours', 'Mes demandes en cours')
        break
      default:
        console.log('Action non implémentée:', action)
    }
  }

  // Vérifier si l'utilisateur est un valideur
  const isValidator = currentUser && [
    'conducteur_travaux', 
    'responsable_travaux', 
    'charge_affaire', 
    'responsable_appro', 
    'responsable_logistique'
  ].includes(currentUser.role)

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
        {/* Cartes Statistiques */}
        <div className="mobile-stats-grid">
          <div 
            className="mobile-stat-card stat-total"
            onClick={() => handleCardClick("total", "Mes demandes")}
          >
            <div className="mobile-stat-card-header">
              <span className="mobile-stat-card-title">Total</span>
              <FileText className="mobile-stat-card-icon" />
            </div>
            <div className="mobile-stat-card-value">{stats.total}</div>
            <div className="mobile-stat-card-desc">Mes demandes</div>
          </div>

          {isValidator && stats.aValider > 0 ? (
            <div className="mobile-stat-card stat-encours">
              <div className="mobile-stat-card-header">
                <span className="mobile-stat-card-title">À valider</span>
                <Clock className="mobile-stat-card-icon" />
              </div>
              <div className="mobile-stat-card-value">{stats.aValider}</div>
              <div className="mobile-stat-card-desc">En attente</div>
            </div>
          ) : (
            <div 
              className="mobile-stat-card stat-encours"
              onClick={() => handleCardClick("enCours", "En cours")}
            >
              <div className="mobile-stat-card-header">
                <span className="mobile-stat-card-title">En cours</span>
                <Clock className="mobile-stat-card-icon" />
              </div>
              <div className="mobile-stat-card-value">{stats.enCours}</div>
              <div className="mobile-stat-card-desc">En traitement</div>
            </div>
          )}

          {(stats.livraisons || 0) > 0 ? (
            <div className="mobile-stat-card stat-validees">
              <div className="mobile-stat-card-header">
                <span className="mobile-stat-card-title">Livraisons</span>
                <Truck className="mobile-stat-card-icon" />
              </div>
              <div className="mobile-stat-card-value">{stats.livraisons}</div>
              <div className="mobile-stat-card-desc">À effectuer</div>
            </div>
          ) : (
            <div 
              className="mobile-stat-card stat-validees"
              onClick={() => handleCardClick("validees", "Validées")}
            >
              <div className="mobile-stat-card-header">
                <span className="mobile-stat-card-title">Validées</span>
                <CheckCircle className="mobile-stat-card-icon" />
              </div>
              <div className="mobile-stat-card-value">{stats.validees}</div>
              <div className="mobile-stat-card-desc">Terminées</div>
            </div>
          )}

          {currentUser.role === 'responsable_appro' && (stats.aPreparer || 0) > 0 ? (
            <div className="mobile-stat-card stat-brouillons">
              <div className="mobile-stat-card-header">
                <span className="mobile-stat-card-title">À préparer</span>
                <Package className="mobile-stat-card-icon" />
              </div>
              <div className="mobile-stat-card-value">{stats.aPreparer || 0}</div>
              <div className="mobile-stat-card-desc">Sorties</div>
            </div>
          ) : (
            <div 
              className="mobile-stat-card stat-brouillons"
              onClick={() => handleCardClick("brouillons", "Brouillons")}
            >
              <div className="mobile-stat-card-header">
                <span className="mobile-stat-card-title">Brouillons</span>
                <Archive className="mobile-stat-card-icon" />
              </div>
              <div className="mobile-stat-card-value">{demandes.filter(d => d.technicienId === currentUser.id && d.status === "brouillon").length}</div>
              <div className="mobile-stat-card-desc">Non soumis</div>
            </div>
          )}
        </div>

        {/* Section de validation mobile - Pour les valideurs */}
        <MobileValidationSection />

        {/* Section des livraisons pour livreur */}
        <MobileLivraisonsSection />

        {/* Section des préparations pour appro */}
        <MobileApproSection />

        {/* Section des demandes rejetées */}
        {demandesRejetees.length > 0 && (
          <div className="mobile-rejected-section">
            <div className="mobile-rejected-header">
              <h3>Demandes Rejetées</h3>
              <span className="mobile-rejected-badge">{demandesRejetees.length}</span>
            </div>
            <div className="mobile-rejected-list">
              {demandesRejetees.map((demande) => (
                <div key={demande.id} className="mobile-rejected-item">
                  <div className="mobile-rejected-item-header">
                    <div className="mobile-rejected-item-title">
                      <XCircle size={16} className="mobile-rejected-icon" />
                      <span>{demande.numero}</span>
                    </div>
                    <span className="mobile-rejected-type">
                      {demande.type === 'materiel' ? 'Matériel' : 'Outillage'}
                    </span>
                  </div>
                  <p className="mobile-rejected-item-desc">
                    {demande.commentaires || 'Aucun commentaire'}
                  </p>
                  {demande.rejetMotif && (
                    <div className="mobile-rejected-reason">
                      <strong>Motif:</strong> {demande.rejetMotif}
                    </div>
                  )}
                  <div className="mobile-rejected-item-footer">
                    <span className="mobile-rejected-date">
                      {new Date(demande.dateCreation).toLocaleDateString('fr-FR')}
                    </span>
                    <span className="mobile-rejected-items">
                      {demande.items?.length || 0} article(s)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions rapides */}
        <div className="universal-mobile-actions">
          <h3>Actions Rapides</h3>
          <div className="universal-mobile-actions-grid">
            {quickActions.map((action, index) => (
              <div 
                key={index} 
                className="universal-mobile-action-item"
                onClick={() => handleActionClick(action.action)}
              >
                {action.icon}
                <span>{action.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Bottom Universelle */}
      <div className="mobile-bottom-nav">
        <div className="mobile-nav-item active">
          <Home className="mobile-nav-icon" />
          <span className="mobile-nav-label">Accueil</span>
        </div>
        <div 
          className="mobile-nav-item"
          onClick={() => handleCardClick("total", "Mes demandes")}
        >
          <FileText className="mobile-nav-icon" />
          <span className="mobile-nav-label">Demandes</span>
          {stats.total > 0 && (
            <span className="mobile-nav-badge">{stats.total}</span>
          )}
        </div>
        <div 
          className="mobile-nav-item"
          onClick={() => {
            setDemandeType('materiel')
            setCreateDemandeModalOpen(true)
          }}
        >
          <Plus className="mobile-nav-icon" />
          <span className="mobile-nav-label">Créer</span>
        </div>
        <div 
          className="mobile-nav-item"
          onClick={() => setUniversalClosureModalOpen(true)}
        >
          <CheckCircle className="mobile-nav-icon" />
          <span className="mobile-nav-label">Clôturer</span>
          {demandes.filter(d => d.technicienId === currentUser.id && d.status === "en_attente_validation_finale_demandeur").length > 0 && (
            <span className="mobile-nav-badge">
              {demandes.filter(d => d.technicienId === currentUser.id && d.status === "en_attente_validation_finale_demandeur").length}
            </span>
          )}
        </div>
      </div>

      {/* Modal de clôture universelle */}
      <UniversalClosureModal
        isOpen={universalClosureModalOpen}
        onClose={() => setUniversalClosureModalOpen(false)}
      />

      {/* Modal de création de demande */}
      <CreateDemandeModal
        isOpen={createDemandeModalOpen}
        onClose={() => setCreateDemandeModalOpen(false)}
        type={demandeType}
      />

      {/* Modal des demandes par catégorie */}
      <DemandesCategoryModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        demandes={getFilteredDemandes(detailsModalType)}
        title={detailsModalTitle}
        categoryType={detailsModalType}
        currentUser={currentUser}
      />
    </div>
  )
}

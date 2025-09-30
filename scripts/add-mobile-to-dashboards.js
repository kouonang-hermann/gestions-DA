const fs = require('fs');
const path = require('path');

// Configuration pour chaque dashboard
const dashboardConfigs = {
  'super-admin-dashboard.tsx': {
    userRole: 'Super Administrateur',
    mainButtonLabel: 'Nouvel Utilisateur',
    sectionTitle: 'Dernières demandes système',
    actions: [
      { id: 'create-user', label: 'Nouvel Utilisateur', icon: 'Users', className: 'mobile-action-button mobile-action-primary' },
      { id: 'create-project', label: 'Nouveau Projet', icon: 'FolderOpen', className: 'mobile-action-button mobile-action-secondary' },
      { id: 'manage-projects', label: 'Gérer Projets', icon: 'Settings', className: 'mobile-action-button mobile-action-secondary' },
      { id: 'create-demande', label: 'Nouvelle Demande', icon: 'Plus', className: 'mobile-action-button mobile-action-secondary' },
      { id: 'manage-roles', label: 'Gérer Rôles', icon: 'CreditCard', className: 'mobile-action-button mobile-action-secondary' },
      { id: 'reports', label: 'Rapports', icon: 'BarChart3', className: 'mobile-action-button mobile-action-danger' }
    ]
  },
  'conducteur-dashboard.tsx': {
    userRole: 'Conducteur Travaux',
    mainButtonLabel: 'Valider Demande',
    sectionTitle: 'Demandes à valider',
    actions: [
      { id: 'validate-requests', label: 'Valider Demandes', icon: 'FileText', className: 'mobile-action-button mobile-action-primary' },
      { id: 'create-demande', label: 'Nouvelle Demande', icon: 'Plus', className: 'mobile-action-button mobile-action-secondary' },
      { id: 'view-projects', label: 'Mes Projets', icon: 'FolderOpen', className: 'mobile-action-button mobile-action-secondary' },
      { id: 'reports', label: 'Rapports', icon: 'BarChart3', className: 'mobile-action-button mobile-action-secondary' }
    ]
  },
  'responsable-travaux-dashboard.tsx': {
    userRole: 'Responsable Travaux',
    mainButtonLabel: 'Valider Demande',
    sectionTitle: 'Demandes à valider',
    actions: [
      { id: 'validate-requests', label: 'Valider Demandes', icon: 'FileText', className: 'mobile-action-button mobile-action-primary' },
      { id: 'create-demande', label: 'Nouvelle Demande', icon: 'Plus', className: 'mobile-action-button mobile-action-secondary' },
      { id: 'manage-team', label: 'Gérer Équipe', icon: 'Users', className: 'mobile-action-button mobile-action-secondary' },
      { id: 'reports', label: 'Rapports', icon: 'BarChart3', className: 'mobile-action-button mobile-action-secondary' }
    ]
  },
  'qhse-dashboard.tsx': {
    userRole: 'Responsable QHSE',
    mainButtonLabel: 'Valider Sécurité',
    sectionTitle: 'Validations QHSE',
    actions: [
      { id: 'validate-safety', label: 'Valider Sécurité', icon: 'FileText', className: 'mobile-action-button mobile-action-primary' },
      { id: 'safety-reports', label: 'Rapports Sécurité', icon: 'BarChart3', className: 'mobile-action-button mobile-action-secondary' },
      { id: 'create-demande', label: 'Nouvelle Demande', icon: 'Plus', className: 'mobile-action-button mobile-action-secondary' }
    ]
  },
  'charge-affaire-dashboard.tsx': {
    userRole: 'Chargé d\'Affaire',
    mainButtonLabel: 'Valider Budget',
    sectionTitle: 'Validations budgétaires',
    actions: [
      { id: 'validate-budget', label: 'Valider Budget', icon: 'CreditCard', className: 'mobile-action-button mobile-action-primary' },
      { id: 'budget-reports', label: 'Rapports Budget', icon: 'BarChart3', className: 'mobile-action-button mobile-action-secondary' },
      { id: 'create-demande', label: 'Nouvelle Demande', icon: 'Plus', className: 'mobile-action-button mobile-action-secondary' }
    ]
  },
  'appro-dashboard.tsx': {
    userRole: 'Responsable Appro',
    mainButtonLabel: 'Préparer Sortie',
    sectionTitle: 'Préparations en cours',
    actions: [
      { id: 'prepare-exit', label: 'Préparer Sortie', icon: 'Package', className: 'mobile-action-button mobile-action-primary' },
      { id: 'stock-management', label: 'Gérer Stock', icon: 'Wrench', className: 'mobile-action-button mobile-action-secondary' },
      { id: 'create-demande', label: 'Nouvelle Demande', icon: 'Plus', className: 'mobile-action-button mobile-action-secondary' }
    ]
  },
  'responsable-logistique-dashboard.tsx': {
    userRole: 'Responsable Logistique',
    mainButtonLabel: 'Valider Logistique',
    sectionTitle: 'Validations logistiques',
    actions: [
      { id: 'validate-logistics', label: 'Valider Logistique', icon: 'FileText', className: 'mobile-action-button mobile-action-primary' },
      { id: 'logistics-reports', label: 'Rapports Logistique', icon: 'BarChart3', className: 'mobile-action-button mobile-action-secondary' },
      { id: 'create-demande', label: 'Nouvelle Demande', icon: 'Plus', className: 'mobile-action-button mobile-action-secondary' }
    ]
  }
};

console.log('🚀 Script d\'ajout du mobile responsive aux dashboards');
console.log('📋 Dashboards à traiter:', Object.keys(dashboardConfigs));
console.log('✅ Pattern basé sur le dashboard employé qui fonctionne');
console.log('📱 Interface mobile complète avec header, actions et navigation');

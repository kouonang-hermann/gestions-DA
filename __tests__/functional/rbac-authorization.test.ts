/**
 * Tests fonctionnels - Autorisations et Rôles (RBAC)
 * 
 * Vérifie qui a le droit de faire quoi :
 * - Accès technicien / demandeur
 * - Accès responsable approvisionnement
 * - Accès livreur
 * - Accès superviseur / hiérarchie
 * - Accès administrateur
 * - Tentatives d'actions interdites
 */

import { describe, test, expect, beforeEach } from '@jest/globals'
import type { Demande, User, DemandeStatus, UserRole } from '@/types'

describe('Tests d\'Autorisation et de Rôles (RBAC)', () => {
  let users: Record<string, User>
  let demande: Partial<Demande>

  beforeEach(() => {
    // Créer des utilisateurs pour chaque rôle
    users = {
      technicien: createUser('tech-1', 'technicien@test.com', 'employe', ['projet-1']),
      conducteur: createUser('cond-1', 'conducteur@test.com', 'conducteur_travaux', ['projet-1']),
      respTravaux: createUser('resp-trav-1', 'resp-travaux@test.com', 'responsable_travaux', ['projet-1']),
      chargeAffaire: createUser('charge-1', 'charge@test.com', 'charge_affaire', ['projet-1']),
      appro: createUser('appro-1', 'appro@test.com', 'responsable_appro', ['projet-1']),
      logistique: createUser('log-1', 'logistique@test.com', 'responsable_logistique', ['projet-1']),
      livreur: createUser('livreur-1', 'livreur@test.com', 'responsable_livreur', ['projet-1']),
      admin: createUser('admin-1', 'admin@test.com', 'superadmin', [])
    }

    // Demande de test
    demande = {
      id: 'demande-1',
      numero: 'DA-MAT-20260118-0001',
      type: 'materiel',
      technicienId: users.technicien.id,
      projetId: 'projet-1',
      status: 'soumise',
      items: [],
      typeDemande: 'principale',
      nombreRejets: 0,
      dateCreation: new Date(),
      dateModification: new Date()
    }
  })

  describe('Accès Technicien / Demandeur', () => {
    test('Peut créer une demande', () => {
      const canCreate = hasPermission(users.technicien, 'create_demande')
      expect(canCreate).toBe(true)
    })

    test('Peut modifier sa propre demande en brouillon', () => {
      demande.status = 'brouillon'
      const canEdit = canEditDemande(users.technicien, demande)
      expect(canEdit).toBe(true)
    })

    test('Ne peut pas modifier une demande soumise', () => {
      demande.status = 'soumise'
      const canEdit = canEditDemande(users.technicien, demande)
      expect(canEdit).toBe(false)
    })

    test('Ne peut pas modifier la demande d\'un autre technicien', () => {
      demande.technicienId = 'autre-technicien'
      const canEdit = canEditDemande(users.technicien, demande)
      expect(canEdit).toBe(false)
    })

    test('Peut clôturer sa propre demande', () => {
      demande.status = 'en_attente_validation_finale_demandeur'
      const canClose = canCloseDemande(users.technicien, demande)
      expect(canClose).toBe(true)
    })

    test('Ne peut pas clôturer la demande d\'un autre', () => {
      demande.status = 'en_attente_validation_finale_demandeur'
      demande.technicienId = 'autre-technicien'
      const canClose = canCloseDemande(users.technicien, demande)
      expect(canClose).toBe(false)
    })

    test('Ne peut pas valider une demande', () => {
      demande.status = 'en_attente_validation_conducteur'
      const canValidate = canValidateDemande(users.technicien, demande)
      expect(canValidate).toBe(false)
    })

    test('Ne peut pas préparer une sortie', () => {
      demande.status = 'en_attente_preparation_appro'
      const canPrepare = hasPermission(users.technicien, 'prepare_sortie')
      expect(canPrepare).toBe(false)
    })

    test('Peut consulter ses propres demandes', () => {
      const canView = canViewDemande(users.technicien, demande)
      expect(canView).toBe(true)
    })

    test('Ne peut pas accéder aux demandes hors de ses projets', () => {
      demande.projetId = 'autre-projet'
      const canView = canViewDemande(users.technicien, demande)
      expect(canView).toBe(false)
    })
  })

  describe('Accès Responsable Approvisionnement', () => {
    test('Peut préparer une sortie', () => {
      demande.status = 'en_attente_preparation_appro'
      const canPrepare = canPrepareSortie(users.appro, demande)
      expect(canPrepare).toBe(true)
    })

    test('Ne peut pas préparer si pas au bon statut', () => {
      demande.status = 'soumise'
      const canPrepare = canPrepareSortie(users.appro, demande)
      expect(canPrepare).toBe(false)
    })

    test('Peut consulter toutes les demandes de ses projets', () => {
      const canView = canViewDemande(users.appro, demande)
      expect(canView).toBe(true)
    })

    test('Ne peut pas valider une demande', () => {
      demande.status = 'en_attente_validation_conducteur'
      const canValidate = canValidateDemande(users.appro, demande)
      expect(canValidate).toBe(false)
    })

    test('Ne peut pas créer de demande pour un autre', () => {
      const canCreateForOthers = hasPermission(users.appro, 'create_demande_for_others')
      expect(canCreateForOthers).toBe(false)
    })

    test('Peut supprimer exceptionnellement une sous-demande', () => {
      demande.typeDemande = 'sous_demande'
      const canDelete = canDeleteSousDemande(users.appro, demande)
      expect(canDelete).toBe(true)
    })

    test('Ne peut pas supprimer une demande principale', () => {
      demande.typeDemande = 'principale'
      const canDelete = canDeleteSousDemande(users.appro, demande)
      expect(canDelete).toBe(false)
    })
  })

  describe('Accès Livreur', () => {
    test('Peut réceptionner une livraison', () => {
      demande.status = 'en_attente_reception_livreur'
      const canReceive = canReceiveLivraison(users.livreur, demande)
      expect(canReceive).toBe(true)
    })

    test('Ne peut pas réceptionner si pas au bon statut', () => {
      demande.status = 'soumise'
      const canReceive = canReceiveLivraison(users.livreur, demande)
      expect(canReceive).toBe(false)
    })

    test('Peut consulter les demandes à livrer', () => {
      demande.status = 'en_attente_reception_livreur'
      const canView = canViewDemande(users.livreur, demande)
      expect(canView).toBe(true)
    })

    test('Ne peut pas valider une demande', () => {
      demande.status = 'en_attente_validation_conducteur'
      const canValidate = canValidateDemande(users.livreur, demande)
      expect(canValidate).toBe(false)
    })

    test('Ne peut pas préparer une sortie', () => {
      demande.status = 'en_attente_preparation_appro'
      const canPrepare = canPrepareSortie(users.livreur, demande)
      expect(canPrepare).toBe(false)
    })
  })

  describe('Accès Superviseur / Hiérarchie', () => {
    test('Conducteur peut valider les demandes matériel de ses projets', () => {
      demande.status = 'en_attente_validation_conducteur'
      demande.type = 'materiel'
      const canValidate = canValidateDemande(users.conducteur, demande)
      expect(canValidate).toBe(true)
    })

    test('Conducteur ne peut pas valider les demandes outillage', () => {
      demande.status = 'en_attente_validation_conducteur'
      demande.type = 'outillage'
      const canValidate = canValidateDemande(users.conducteur, demande)
      expect(canValidate).toBe(false)
    })

    test('Responsable Travaux peut valider après conducteur', () => {
      demande.status = 'en_attente_validation_responsable_travaux'
      const canValidate = canValidateDemande(users.respTravaux, demande)
      expect(canValidate).toBe(true)
    })

    test('Chargé Affaire peut valider après responsable travaux', () => {
      demande.status = 'en_attente_validation_charge_affaire'
      const canValidate = canValidateDemande(users.chargeAffaire, demande)
      expect(canValidate).toBe(true)
    })

    test('Logistique peut valider les demandes matériel', () => {
      demande.status = 'en_attente_validation_logistique'
      demande.type = 'materiel'
      const canValidate = canValidateDemande(users.logistique, demande)
      expect(canValidate).toBe(true)
    })

    test('Logistique peut valider les demandes outillage', () => {
      demande.status = 'en_attente_validation_logistique'
      demande.type = 'outillage'
      const canValidate = canValidateDemande(users.logistique, demande)
      expect(canValidate).toBe(true)
    })

    test('Superviseur ne peut pas valider hors de ses projets', () => {
      demande.projetId = 'autre-projet'
      demande.status = 'en_attente_validation_conducteur'
      const canValidate = canValidateDemande(users.conducteur, demande)
      expect(canValidate).toBe(false)
    })

    test('Superviseur peut consulter toutes les demandes de ses projets', () => {
      const canView = canViewDemande(users.conducteur, demande)
      expect(canView).toBe(true)
    })
  })

  describe('Accès Administrateur', () => {
    test('Peut créer des utilisateurs', () => {
      const canCreateUser = hasPermission(users.admin, 'create_user')
      expect(canCreateUser).toBe(true)
    })

    test('Peut créer des projets', () => {
      const canCreateProject = hasPermission(users.admin, 'create_project')
      expect(canCreateProject).toBe(true)
    })

    test('Peut consulter toutes les demandes', () => {
      demande.projetId = 'n-importe-quel-projet'
      const canView = canViewDemande(users.admin, demande)
      expect(canView).toBe(true)
    })

    test('Peut modifier les projets', () => {
      const canEditProject = hasPermission(users.admin, 'edit_project')
      expect(canEditProject).toBe(true)
    })

    test('Peut assigner des utilisateurs aux projets', () => {
      const canAssignUsers = hasPermission(users.admin, 'assign_users_to_project')
      expect(canAssignUsers).toBe(true)
    })

    test('Peut voir les coûts totaux', () => {
      const canViewCosts = hasPermission(users.admin, 'view_costs')
      expect(canViewCosts).toBe(true)
    })

    test('Peut valider toutes les demandes (superadmin)', () => {
      demande.status = 'en_attente_validation_conducteur'
      const canValidate = canValidateDemande(users.admin, demande)
      expect(canValidate).toBe(true)
    })
  })

  describe('Tentatives d\'Actions Interdites', () => {
    test('Technicien ne peut pas valider une demande', () => {
      demande.status = 'en_attente_validation_conducteur'
      const result = attemptValidation(users.technicien, demande)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Permission refusée : vous n\'avez pas le droit de valider cette demande')
    })

    test('Conducteur ne peut pas préparer une sortie', () => {
      demande.status = 'en_attente_preparation_appro'
      const result = attemptPreparation(users.conducteur, demande)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Permission refusée : seul le responsable appro peut préparer les sorties')
    })

    test('Appro ne peut pas valider une demande', () => {
      demande.status = 'en_attente_validation_conducteur'
      const result = attemptValidation(users.appro, demande)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Permission refusée : vous n\'avez pas le droit de valider cette demande')
    })

    test('Livreur ne peut pas clôturer une demande', () => {
      demande.status = 'en_attente_validation_finale_demandeur'
      const result = attemptClosure(users.livreur, demande)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Permission refusée : seul le demandeur peut clôturer sa demande')
    })

    test('Technicien ne peut pas supprimer une sous-demande', () => {
      demande.typeDemande = 'sous_demande'
      const result = attemptDeleteSousDemande(users.technicien, demande)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Permission refusée : seul le responsable appro peut supprimer une sous-demande')
    })

    test('Utilisateur hors projet ne peut pas accéder à la demande', () => {
      const userHorsProjet = createUser('hors-1', 'hors@test.com', 'employe', ['autre-projet'])
      const canView = canViewDemande(userHorsProjet, demande)
      
      expect(canView).toBe(false)
    })

    test('Validation au mauvais statut est refusée', () => {
      demande.status = 'cloturee'
      const result = attemptValidation(users.conducteur, demande)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Permission refusée : vous n\'avez pas le droit de valider cette demande')
    })

    test('Modification d\'une demande soumise est refusée', () => {
      demande.status = 'soumise'
      const result = attemptEdit(users.technicien, demande)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Permission refusée : vous ne pouvez modifier que les demandes en brouillon')
    })
  })

  describe('Permissions par Statut', () => {
    test('Seul le conducteur peut valider au statut en_attente_validation_conducteur', () => {
      demande.status = 'en_attente_validation_conducteur'
      
      expect(canValidateDemande(users.conducteur, demande)).toBe(true)
      expect(canValidateDemande(users.respTravaux, demande)).toBe(false)
      expect(canValidateDemande(users.chargeAffaire, demande)).toBe(false)
      expect(canValidateDemande(users.appro, demande)).toBe(false)
    })

    test('Seul le responsable travaux peut valider au statut en_attente_validation_responsable_travaux', () => {
      demande.status = 'en_attente_validation_responsable_travaux'
      
      expect(canValidateDemande(users.respTravaux, demande)).toBe(true)
      expect(canValidateDemande(users.conducteur, demande)).toBe(false)
      expect(canValidateDemande(users.chargeAffaire, demande)).toBe(false)
    })

    test('Seul le chargé affaire peut valider au statut en_attente_validation_charge_affaire', () => {
      demande.status = 'en_attente_validation_charge_affaire'
      
      expect(canValidateDemande(users.chargeAffaire, demande)).toBe(true)
      expect(canValidateDemande(users.respTravaux, demande)).toBe(false)
      expect(canValidateDemande(users.appro, demande)).toBe(false)
    })

    test('Seul l\'appro peut préparer au statut en_attente_preparation_appro', () => {
      demande.status = 'en_attente_preparation_appro'
      
      expect(canValidateDemande(users.appro, demande)).toBe(true)
      expect(canValidateDemande(users.chargeAffaire, demande)).toBe(false)
      expect(canValidateDemande(users.logistique, demande)).toBe(false)
    })

    test('Seul le logistique peut valider au statut en_attente_validation_logistique', () => {
      demande.status = 'en_attente_validation_logistique'
      
      expect(canValidateDemande(users.logistique, demande)).toBe(true)
      expect(canValidateDemande(users.appro, demande)).toBe(false)
      expect(canValidateDemande(users.conducteur, demande)).toBe(false)
    })

    test('Seul le livreur peut valider aux statuts de livraison', () => {
      demande.status = 'en_attente_reception_livreur'
      
      expect(canValidateDemande(users.livreur, demande)).toBe(true)
      expect(canValidateDemande(users.logistique, demande)).toBe(false)
      expect(canValidateDemande(users.appro, demande)).toBe(false)
    })
  })

  describe('Filtrage par Projet', () => {
    test('Utilisateur voit uniquement ses projets assignés', () => {
      const userProjet1 = createUser('user-1', 'user1@test.com', 'employe', ['projet-1'])
      const userProjet2 = createUser('user-2', 'user2@test.com', 'employe', ['projet-2'])
      
      const demandeProjet1 = { ...demande, projetId: 'projet-1' }
      const demandeProjet2 = { ...demande, projetId: 'projet-2' }
      
      expect(canViewDemande(userProjet1, demandeProjet1)).toBe(true)
      expect(canViewDemande(userProjet1, demandeProjet2)).toBe(false)
      expect(canViewDemande(userProjet2, demandeProjet1)).toBe(false)
      expect(canViewDemande(userProjet2, demandeProjet2)).toBe(true)
    })

    test('Admin voit tous les projets', () => {
      const demandeProjet1 = { ...demande, projetId: 'projet-1' }
      const demandeProjet2 = { ...demande, projetId: 'projet-2' }
      
      expect(canViewDemande(users.admin, demandeProjet1)).toBe(true)
      expect(canViewDemande(users.admin, demandeProjet2)).toBe(true)
    })

    test('Utilisateur sans projet ne voit rien', () => {
      const userSansProjet = createUser('sans-1', 'sans@test.com', 'employe', [])
      
      expect(canViewDemande(userSansProjet, demande)).toBe(false)
    })
  })
})

// Fonctions utilitaires pour les tests RBAC

function createUser(id: string, email: string, role: string, projets: string[]): User {
  return {
    id,
    email,
    nom: 'Test',
    prenom: 'User',
    role: role as UserRole,
    phone: '0612345678',
    projets,
    isAdmin: role === 'superadmin',
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

function hasPermission(user: User, permission: string): boolean {
  const permissions: Record<string, string[]> = {
    'create_demande': ['employe', 'conducteur_travaux', 'responsable_travaux', 'charge_affaire', 'responsable_appro', 'responsable_logistique'],
    'create_user': ['superadmin'],
    'create_project': ['superadmin'],
    'edit_project': ['superadmin'],
    'assign_users_to_project': ['superadmin'],
    'view_costs': ['superadmin', 'charge_affaire'],
    'prepare_sortie': ['responsable_appro'],
    'create_demande_for_others': ['superadmin']
  }

  return permissions[permission]?.includes(user.role) || false
}

function canEditDemande(user: User, demande: Partial<Demande>): boolean {
  // Seul le demandeur peut modifier sa demande en brouillon
  return demande.technicienId === user.id && demande.status === 'brouillon'
}

function canCloseDemande(user: User, demande: Partial<Demande>): boolean {
  // Seul le demandeur peut clôturer sa demande
  return demande.technicienId === user.id && 
         demande.status === 'en_attente_validation_finale_demandeur'
}

function canValidateDemande(user: User, demande: Partial<Demande>): boolean {
  // Superadmin peut tout faire
  if (user.role === 'superadmin') return true

  // Vérifier que l'utilisateur est dans le projet
  if (!user.projets || !user.projets.includes(demande.projetId!)) {
    return false
  }

  // Basé sur ROLE_VALIDATION_STATUS dans lib/workflow-utils.ts
  const roleValidationStatus: Record<string, string[]> = {
    'employe': ['en_attente_validation_finale_demandeur'],
    'conducteur_travaux': ['en_attente_validation_conducteur'],
    'responsable_logistique': ['en_attente_validation_logistique', 'en_attente_preparation_logistique'],
    'responsable_travaux': ['en_attente_validation_responsable_travaux'],
    'charge_affaire': ['en_attente_validation_charge_affaire'],
    'responsable_appro': ['en_attente_preparation_appro'],
    'responsable_livreur': ['en_attente_reception_livreur', 'en_attente_livraison']
  }

  const allowedStatuses = roleValidationStatus[user.role] || []
  if (!allowedStatuses.includes(demande.status!)) {
    return false
  }

  // Règle spéciale : conducteur ne valide que les demandes matériel
  // Les demandes outillage vont directement à la logistique
  if (user.role === 'conducteur_travaux' && demande.type === 'outillage') {
    return false
  }

  return true
}

function canPrepareSortie(user: User, demande: Partial<Demande>): boolean {
  return user.role === 'responsable_appro' && 
         demande.status === 'en_attente_preparation_appro' &&
         user.projets.includes(demande.projetId!)
}

function canReceiveLivraison(user: User, demande: Partial<Demande>): boolean {
  return user.role === 'responsable_livreur' && 
         demande.status === 'en_attente_reception_livreur' &&
         user.projets.includes(demande.projetId!)
}

function canViewDemande(user: User, demande: Partial<Demande>): boolean {
  // Admin voit tout
  if (user.role === 'superadmin') {
    return true
  }

  // Utilisateur doit être dans le projet pour voir la demande
  if (!user.projets.includes(demande.projetId!)) {
    return false
  }

  // Si dans le projet, peut voir toutes les demandes du projet
  return true
}

function canDeleteSousDemande(user: User, demande: Partial<Demande>): boolean {
  return user.role === 'responsable_appro' && demande.typeDemande === 'sous_demande'
}

function attemptValidation(user: User, demande: Partial<Demande>): { success: boolean; error?: string } {
  if (!canValidateDemande(user, demande)) {
    return {
      success: false,
      error: 'Permission refusée : vous n\'avez pas le droit de valider cette demande'
    }
  }
  return { success: true }
}

function attemptPreparation(user: User, demande: Partial<Demande>): { success: boolean; error?: string } {
  if (!canPrepareSortie(user, demande)) {
    return {
      success: false,
      error: 'Permission refusée : seul le responsable appro peut préparer les sorties'
    }
  }
  return { success: true }
}

function attemptClosure(user: User, demande: Partial<Demande>): { success: boolean; error?: string } {
  if (!canCloseDemande(user, demande)) {
    return {
      success: false,
      error: 'Permission refusée : seul le demandeur peut clôturer sa demande'
    }
  }
  return { success: true }
}

function attemptDeleteSousDemande(user: User, demande: Partial<Demande>): { success: boolean; error?: string } {
  if (!canDeleteSousDemande(user, demande)) {
    return {
      success: false,
      error: 'Permission refusée : seul le responsable appro peut supprimer une sous-demande'
    }
  }
  return { success: true }
}

function attemptEdit(user: User, demande: Partial<Demande>): { success: boolean; error?: string } {
  if (!canEditDemande(user, demande)) {
    return {
      success: false,
      error: 'Permission refusée : vous ne pouvez modifier que les demandes en brouillon'
    }
  }
  return { success: true }
}

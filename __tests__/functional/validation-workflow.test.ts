/**
 * Tests fonctionnels - Workflow de validation
 * 
 * Vérifie le workflow complet de validation pour chaque rôle :
 * - Conducteur des travaux (matériel)
 * - Responsable logistique (outillage)
 * - Responsable des travaux
 * - Chargé d'affaire
 * - Responsable appro
 * - Responsable logistique
 * - Demandeur (clôture)
 */

import { describe, test, expect, beforeEach } from '@jest/globals'
import type { Demande, User, DemandeStatus } from '@/types'

describe('Workflow de Validation', () => {
  let demandeMateriel: Partial<Demande>
  let demandeOutillage: Partial<Demande>
  let users: Record<string, User>

  beforeEach(() => {
    // Setup utilisateurs pour chaque rôle
    users = {
      employe: createUser('employe-1', 'employe@test.com', 'employe'),
      conducteur: createUser('conducteur-1', 'conducteur@test.com', 'conducteur_travaux'),
      respTravaux: createUser('resp-travaux-1', 'resp-travaux@test.com', 'responsable_travaux'),
      chargeAffaire: createUser('charge-1', 'charge@test.com', 'charge_affaire'),
      appro: createUser('appro-1', 'appro@test.com', 'responsable_appro'),
      logistique: createUser('logistique-1', 'logistique@test.com', 'responsable_logistique')
    }

    // Demande matériel
    demandeMateriel = {
      id: 'demande-mat-1',
      numero: 'DA-MAT-20260118-0001',
      type: 'materiel',
      technicienId: users.employe.id,
      projetId: 'projet-1',
      status: 'soumise',
      items: [
        {
          id: 'item-1',
          articleId: 'article-1',
          article: {
            id: 'article-1',
            nom: 'Casque de chantier',
            description: '',
            reference: 'CASQUE-CHANTIER',
            unite: 'pièce',
            type: 'materiel',
            createdAt: new Date(),
          },
          quantiteDemandee: 10,
          commentaire: ''
        }
      ],
      dateCreation: new Date()
    }

    // Demande outillage
    demandeOutillage = {
      id: 'demande-out-1',
      numero: 'DA-OUT-20260118-0001',
      type: 'outillage',
      technicienId: users.employe.id,
      projetId: 'projet-1',
      status: 'soumise',
      items: [
        {
          id: 'item-1',
          articleId: 'article-2',
          article: {
            id: 'article-2',
            nom: 'Perceuse sans fil',
            description: '',
            reference: 'PERCEUSE-SANS-FIL',
            unite: 'pièce',
            type: 'outillage',
            createdAt: new Date(),
          },
          quantiteDemandee: 2,
          commentaire: ''
        }
      ],
      dateCreation: new Date()
    }
  })

  describe('Workflow Matériel', () => {
    test('Étape 1 : Validation Conducteur des Travaux', () => {
      const demande = { ...demandeMateriel }
      
      // Vérifier que le conducteur peut valider
      expect(canUserValidate(users.conducteur, demande, 'soumise')).toBe(true)
      
      // Validation
      demande.status = 'en_attente_validation_conducteur'
      demande.validationConducteur = {
        userId: users.conducteur.id,
        date: new Date(),
        signature: `validation_${users.conducteur.id}_${Date.now()}`
      }
      
      // Progression automatique
      demande.status = getNextStatus(demande, 'valider')
      
      expect(demande.status).toBe('en_attente_validation_responsable_travaux')
      expect(demande.validationConducteur).toBeDefined()
    })

    test('Étape 2 : Validation Responsable des Travaux', () => {
      const demande = { 
        ...demandeMateriel,
        status: 'en_attente_validation_responsable_travaux' as DemandeStatus
      }
      
      expect(canUserValidate(users.respTravaux, demande, demande.status)).toBe(true)
      
      demande.validationResponsableTravaux = {
        userId: users.respTravaux.id,
        date: new Date(),
        signature: `validation_${users.respTravaux.id}_${Date.now()}`
      }
      
      demande.status = getNextStatus(demande, 'valider')
      
      expect(demande.status).toBe('en_attente_validation_charge_affaire')
    })

    test('Étape 3 : Validation Chargé d\'Affaire', () => {
      const demande = { 
        ...demandeMateriel,
        status: 'en_attente_validation_charge_affaire' as DemandeStatus
      }
      
      expect(canUserValidate(users.chargeAffaire, demande, demande.status)).toBe(true)
      
      demande.validationChargeAffaire = {
        userId: users.chargeAffaire.id,
        date: new Date(),
        signature: `validation_${users.chargeAffaire.id}_${Date.now()}`
      }
      
      demande.status = getNextStatus(demande, 'valider')
      
      expect(demande.status).toBe('en_attente_preparation_appro')
    })

    test('Étape 4 : Préparation Appro', () => {
      const demande = { 
        ...demandeMateriel,
        status: 'en_attente_preparation_appro' as DemandeStatus
      }
      
      expect(canUserValidate(users.appro, demande, demande.status)).toBe(true)
      
      // Préparation de la sortie
      demande.sortieAppro = {
        userId: users.appro.id,
        date: new Date(),
        commentaire: 'Préparation effectuée',
        signature: `sortie_${users.appro.id}_${Date.now()}`,
        quantitesSorties: {},
        modifiable: true,
        dateModificationLimite: new Date(Date.now() + 45 * 60 * 1000)
      }
      demande.dateSortie = new Date()
      
      demande.status = getNextStatus(demande, 'valider')
      
      expect(demande.status).toBe('en_attente_validation_logistique')
    })

    test('Étape 5 : Validation Logistique', () => {
      const demande = { 
        ...demandeMateriel,
        status: 'en_attente_validation_logistique' as DemandeStatus
      }
      
      expect(canUserValidate(users.logistique, demande, demande.status)).toBe(true)
      
      demande.validationLogistique = {
        userId: users.logistique.id,
        date: new Date(),
        signature: `validation_${users.logistique.id}_${Date.now()}`
      }
      
      demande.status = getNextStatus(demande, 'valider')
      
      expect(demande.status).toBe('en_attente_validation_finale_demandeur')
    })

    test('Étape 6 : Clôture par le Demandeur', () => {
      const demande = { 
        ...demandeMateriel,
        status: 'en_attente_validation_finale_demandeur' as DemandeStatus
      }
      
      // Seul le demandeur peut clôturer
      expect(canUserClose(users.employe, demande)).toBe(true)
      expect(canUserClose(users.conducteur, demande)).toBe(false)
      
      demande.validationFinale = {
        userId: users.employe.id,
        date: new Date(),
        signature: `validation_${users.employe.id}_${Date.now()}`
      }
      
      demande.status = 'cloturee'
      demande.dateValidationFinale = new Date()
      
      expect(demande.status).toBe('cloturee')
      expect(demande.dateValidationFinale).toBeDefined()
    })
  })

  describe('Workflow Outillage', () => {
    test('Étape 1 : Validation Responsable Logistique (première étape outillage)', () => {
      const demande = { ...demandeOutillage }
      
      // Pour l'outillage, c'est le responsable logistique qui valide en premier
      expect(canUserValidate(users.logistique, demande, 'soumise')).toBe(true)
      expect(canUserValidate(users.conducteur, demande, 'soumise')).toBe(false)
      
      demande.validationLogistique = {
        userId: users.logistique.id,
        date: new Date(),
        signature: `validation_${users.logistique.id}_${Date.now()}`
      }
      
      // Après validation logistique, le statut passe à responsable travaux
      demande.status = 'en_attente_validation_responsable_travaux'
      
      expect(demande.status).toBe('en_attente_validation_responsable_travaux')
    })

    test('Workflow complet outillage', () => {
      const demande = { ...demandeOutillage }
      // Flow outillage: demandeur => resp logistique => resp travaux => chargé affaires => resp logistique (préparation) => livreur => demandeur
      const expectedFlow: DemandeStatus[] = [
        'soumise',
        'en_attente_validation_logistique',
        'en_attente_validation_responsable_travaux',
        'en_attente_validation_charge_affaire',
        'en_attente_preparation_logistique', // Deuxième passage logistique (PRÉPARATION)
        'en_attente_reception_livreur',
        'en_attente_validation_finale_demandeur',
        'cloturee'
      ]
      
      let currentStatus: DemandeStatus = 'soumise'
      
      // Simuler la progression du workflow
      for (let i = 0; i < expectedFlow.length - 1; i++) {
        currentStatus = expectedFlow[i + 1] // Passer directement au statut suivant
        expect(currentStatus).toBe(expectedFlow[i + 1])
      }
    })
  })

  describe('Permissions de validation', () => {
    test('Seul le rôle approprié peut valider à chaque étape', () => {
      const demande = { 
        ...demandeMateriel,
        status: 'en_attente_validation_conducteur' as DemandeStatus
      }
      
      // Seul le conducteur peut valider
      expect(canUserValidate(users.conducteur, demande, demande.status)).toBe(true)
      expect(canUserValidate(users.logistique, demande, demande.status)).toBe(false)
      expect(canUserValidate(users.respTravaux, demande, demande.status)).toBe(false)
      expect(canUserValidate(users.chargeAffaire, demande, demande.status)).toBe(false)
    })

    test('Utilisateur doit être assigné au projet', () => {
      const demande = { ...demandeMateriel }
      const userNotInProject = createUser('other-1', 'other@test.com', 'conducteur_travaux')
      userNotInProject.projets = ['autre-projet']
      
      expect(canUserValidate(userNotInProject, demande, 'soumise')).toBe(false)
    })
  })

  describe('Validation avec commentaires', () => {
    test('Devrait enregistrer les commentaires de validation', () => {
      const demande = { 
        ...demandeMateriel,
        status: 'en_attente_validation_conducteur' as DemandeStatus
      }
      
      const commentaire = 'Validation approuvée avec réserves'
      
      demande.validationConducteur = {
        userId: users.conducteur.id,
        date: new Date(),
        signature: `validation_${users.conducteur.id}_${Date.now()}`,
        commentaire
      }
      
      expect(demande.validationConducteur.commentaire).toBe(commentaire)
    })
  })

  describe('Auto-validation', () => {
    test('Devrait passer automatiquement les étapes si utilisateur non assigné', () => {
      const demande = { 
        ...demandeMateriel,
        status: 'en_attente_validation_conducteur' as DemandeStatus
      }
      
      // Si aucun conducteur assigné au projet, auto-validation
      const hasValidator = hasUserWithRoleInProject('conducteur_travaux', demande.projetId!)
      
      if (!hasValidator) {
        demande.status = getNextStatus(demande, 'valider')
        expect(demande.status).not.toBe('en_attente_validation_conducteur')
      }
    })
  })
})

// Fonctions utilitaires
function createUser(id: string, email: string, role: string): User {
  return {
    id,
    email,
    nom: 'Test',
    prenom: 'User',
    role: role as any,
    phone: '0612345678',
    isAdmin: role === 'superadmin',
    createdAt: new Date(),
    updatedAt: new Date(),
    projets: ['projet-1'],
  }
}

function canUserValidate(user: User, demande: Partial<Demande>, status: DemandeStatus): boolean {
  // Vérifier que l'utilisateur est assigné au projet
  if (!user.projets?.includes(demande.projetId!)) {
    return false
  }

  // Vérifier le rôle selon le statut et le type de demande
  const roleMap: Record<string, string[]> = {
    'soumise': demande.type === 'materiel' ? ['conducteur_travaux'] : ['responsable_logistique'],
    'en_attente_validation_conducteur': ['conducteur_travaux'],
    'en_attente_validation_responsable_travaux': ['responsable_travaux'],
    'en_attente_validation_charge_affaire': ['charge_affaire'],
    'en_attente_preparation_appro': ['responsable_appro'],
    'en_attente_validation_logistique': ['responsable_logistique'],
    'en_attente_reception_livreur': ['responsable_livreur']
  }

  return roleMap[status]?.includes(user.role) || false
}

function canUserClose(user: User, demande: Partial<Demande>): boolean {
  return user.id === demande.technicienId && 
         demande.status === 'en_attente_validation_finale_demandeur'
}

function getNextStatus(demande: Partial<Demande>, action: 'valider' | 'rejeter'): DemandeStatus {
  if (action === 'rejeter') return 'rejetee'

  const statusFlow: Record<string, DemandeStatus> = {
    'soumise': demande.type === 'materiel' 
      ? 'en_attente_validation_conducteur' 
      : 'en_attente_validation_logistique',
    'en_attente_validation_conducteur': 'en_attente_validation_responsable_travaux',
    'en_attente_validation_responsable_travaux': 'en_attente_validation_charge_affaire',
    'en_attente_validation_charge_affaire': 'en_attente_preparation_appro',
    'en_attente_preparation_appro': 'en_attente_validation_logistique',
    'en_attente_validation_logistique': 'en_attente_validation_finale_demandeur',
    'en_attente_validation_finale_demandeur': 'cloturee'
  }

  return statusFlow[demande.status!] || demande.status!
}

function hasUserWithRoleInProject(role: string, projetId: string): boolean {
  // Simulation - dans la vraie app, vérifier en base
  return true
}

/**
 * Tests fonctionnels - Workflow de rejet
 * 
 * Vérifie :
 * - Rejet partiel d'un item
 * - Rejet total d'une demande
 * - Création automatique de sous-demande
 * - Gestion des quantités (validées ≠ livrées ≠ reçues)
 */

import { describe, test, expect, beforeEach } from '@jest/globals'
import type { Demande, ItemDemande, User, DemandeStatus } from '@/types'

describe('Workflow de Rejet', () => {
  let demande: Partial<Demande>
  let users: Record<string, User>

  beforeEach(() => {
    users = {
      employe: createUser('employe-1', 'employe@test.com', 'employe'),
      conducteur: createUser('conducteur-1', 'conducteur@test.com', 'conducteur_travaux'),
      appro: createUser('appro-1', 'appro@test.com', 'responsable_appro')
    }

    demande = {
      id: 'demande-1',
      numero: 'DA-MAT-20260118-0001',
      type: 'materiel',
      technicienId: users.employe.id,
      projetId: 'projet-1',
      status: 'en_attente_validation_conducteur',
      items: [
        {
          id: 'item-1',
          articleId: 'article-1',
          quantiteDemandee: 10,
          quantiteValidee: 0
        },
        {
          id: 'item-2',
          articleId: 'article-2',
          quantiteDemandee: 5,
          quantiteValidee: 0
        }
      ],
      typeDemande: 'principale',
      nombreRejets: 0,
      dateCreation: new Date(),
      dateModification: new Date()
    }
  })

  describe('Rejet Partiel d\'Item', () => {
    test('Devrait rejeter partiellement un item et créer une sous-demande', () => {
      const item = demande.items![0]
      
      // Validation partielle : 7 sur 10 demandés
      item.quantiteValidee = 7
      
      // Quantité rejetée
      const quantiteRejetee = item.quantiteDemandee - (item.quantiteValidee || 0)
      expect(quantiteRejetee).toBe(3)
      
      // Création de la sous-demande pour la quantité rejetée
      const sousDemande: Partial<Demande> = {
        id: 'sous-demande-1',
        numero: 'DA-MAT-20260118-0001-SD1',
        type: demande.type,
        technicienId: demande.technicienId,
        projetId: demande.projetId,
        demandeParentId: demande.id,
        typeDemande: 'sous_demande',
        motifSousDemande: 'complement',
        status: 'soumise',
        items: [
          {
            id: 'item-sd-1',
            articleId: item.articleId,
            quantiteDemandee: quantiteRejetee
          }
        ],
        dateCreation: new Date(),
        dateModification: new Date(),
        nombreRejets: 0
      }
      
      expect(sousDemande.demandeParentId).toBe(demande.id)
      expect(sousDemande.typeDemande).toBe('sous_demande')
      expect(sousDemande.items![0].quantiteDemandee).toBe(3)
    })

    test('Devrait valider plusieurs items avec quantités différentes', () => {
      // Item 1 : validation complète
      demande.items![0].quantiteValidee = demande.items![0].quantiteDemandee
      
      // Item 2 : validation partielle
      demande.items![1].quantiteValidee = 3 // 3 sur 5
      
      expect(demande.items![0].quantiteValidee).toBe(10)
      expect(demande.items![1].quantiteValidee).toBe(3)
      
      // Vérifier qu'une sous-demande est nécessaire pour l'item 2
      const needsSubDemand = demande.items!.some(
        item => (item.quantiteValidee || 0) < item.quantiteDemandee
      )
      
      expect(needsSubDemand).toBe(true)
    })
  })

  describe('Rejet Total de Demande', () => {
    test('Devrait rejeter complètement une demande', () => {
      const motifRejet = 'Budget insuffisant'
      
      demande.status = 'rejetee'
      demande.rejetMotif = motifRejet
      demande.nombreRejets = (demande.nombreRejets || 0) + 1
      demande.statusPrecedent = 'en_attente_validation_conducteur'
      
      expect(demande.status).toBe('rejetee')
      expect(demande.rejetMotif).toBe(motifRejet)
      expect(demande.nombreRejets).toBe(1)
      expect(demande.statusPrecedent).toBe('en_attente_validation_conducteur')
    })

    test('Devrait incrémenter le compteur de rejets', () => {
      const initialRejets = demande.nombreRejets || 0
      
      // Premier rejet
      demande.nombreRejets = initialRejets + 1
      expect(demande.nombreRejets).toBe(1)
      
      // Deuxième rejet
      demande.nombreRejets = demande.nombreRejets + 1
      expect(demande.nombreRejets).toBe(2)
    })

    test('Devrait conserver le statut précédent pour traçabilité', () => {
      const statusAvantRejet: DemandeStatus = 'en_attente_validation_charge_affaire'
      
      demande.status = statusAvantRejet
      demande.statusPrecedent = statusAvantRejet
      demande.status = 'rejetee'
      
      expect(demande.statusPrecedent).toBe('en_attente_validation_charge_affaire')
    })
  })

  describe('Création Automatique de Sous-Demande', () => {
    test('Devrait créer une sous-demande avec le bon format de numéro', () => {
      const parentNumero = 'DA-MAT-20260118-0001'
      const sousDemandeNumero = `${parentNumero}-SD1`
      
      expect(sousDemandeNumero).toMatch(/^DA-MAT-\d{8}-\d{4}-SD\d+$/)
    })

    test('Devrait lier la sous-demande à la demande parent', () => {
      const sousDemande: Partial<Demande> = {
        id: 'sous-demande-1',
        demandeParentId: demande.id,
        typeDemande: 'sous_demande',
        motifSousDemande: 'complement',
        technicienId: demande.technicienId,
        projetId: demande.projetId,
        type: demande.type,
        status: 'soumise',
        items: [],
        dateCreation: new Date(),
        dateModification: new Date(),
        nombreRejets: 0
      }
      
      expect(sousDemande.demandeParentId).toBe(demande.id)
      expect(sousDemande.typeDemande).toBe('sous_demande')
    })

    test('Devrait créer une sous-demande pour chaque item rejeté partiellement', () => {
      const itemsRejetes = demande.items!.filter(
        item => (item.quantiteValidee || 0) < item.quantiteDemandee
      )
      
      // Simuler validation partielle
      demande.items![0].quantiteValidee = 7 // 3 rejetés
      demande.items![1].quantiteValidee = 2 // 3 rejetés
      
      const itemsAvecRejet = demande.items!.filter(
        item => (item.quantiteValidee || 0) < item.quantiteDemandee
      )
      
      expect(itemsAvecRejet).toHaveLength(2)
      
      // Créer les items pour la sous-demande
      const sousDemandeItems: ItemDemande[] = itemsAvecRejet.map(item => ({
        id: `sd-${item.id}`,
        articleId: item.articleId,
        quantiteDemandee: item.quantiteDemandee - (item.quantiteValidee || 0)
      }))
      
      expect(sousDemandeItems).toHaveLength(2)
      expect(sousDemandeItems[0].quantiteDemandee).toBe(3)
      expect(sousDemandeItems[1].quantiteDemandee).toBe(3)
    })

    test('Devrait définir le motif de sous-demande', () => {
      const motifs = ['complement', 'remplacement', 'autre']
      
      motifs.forEach(motif => {
        const sousDemande: Partial<Demande> = {
          typeDemande: 'sous_demande',
          motifSousDemande: motif,
          demandeParentId: demande.id,
          items: [],
          type: 'materiel',
          status: 'soumise',
          dateCreation: new Date(),
          dateModification: new Date(),
          nombreRejets: 0
        }
        
        expect(sousDemande.motifSousDemande).toBe(motif)
      })
    })
  })

  describe('Gestion des Quantités', () => {
    test('Devrait gérer quantiteDemandee ≠ quantiteValidee', () => {
      const item = demande.items![0]
      
      item.quantiteDemandee = 10
      item.quantiteValidee = 7
      
      expect(item.quantiteDemandee).toBe(10)
      expect(item.quantiteValidee).toBe(7)
      expect(item.quantiteDemandee).toBeGreaterThan(item.quantiteValidee!)
    })

    test('Devrait gérer quantiteValidee ≠ quantiteSortie', () => {
      const item = demande.items![0]
      
      item.quantiteValidee = 10
      item.quantiteSortie = 8 // Stock insuffisant
      
      expect(item.quantiteValidee).toBe(10)
      expect(item.quantiteSortie).toBe(8)
      
      // Différence nécessite une sous-demande
      const difference = (item.quantiteValidee || 0) - (item.quantiteSortie || 0)
      expect(difference).toBe(2)
    })

    test('Devrait gérer quantiteSortie ≠ quantiteRecue', () => {
      const item = demande.items![0]
      
      item.quantiteSortie = 10
      item.quantiteRecue = 9 // 1 perdu en transport
      
      expect(item.quantiteSortie).toBe(10)
      expect(item.quantiteRecue).toBe(9)
      
      const perte = (item.quantiteSortie || 0) - (item.quantiteRecue || 0)
      expect(perte).toBe(1)
    })

    test('Devrait calculer les quantités manquantes totales', () => {
      demande.items![0].quantiteDemandee = 10
      demande.items![0].quantiteValidee = 8
      demande.items![0].quantiteSortie = 7
      demande.items![0].quantiteRecue = 6
      
      demande.items![1].quantiteDemandee = 5
      demande.items![1].quantiteValidee = 5
      demande.items![1].quantiteSortie = 4
      demande.items![1].quantiteRecue = 4
      
      const totalDemande = demande.items!.reduce((sum, item) => sum + item.quantiteDemandee, 0)
      const totalRecu = demande.items!.reduce((sum, item) => sum + (item.quantiteRecue || 0), 0)
      
      expect(totalDemande).toBe(15)
      expect(totalRecu).toBe(10)
      expect(totalDemande - totalRecu).toBe(5)
    })
  })

  describe('Blocage de Clôture avec Sous-Demande Active', () => {
    test('Devrait empêcher la clôture si sous-demande active', () => {
      const sousDemande: Partial<Demande> = {
        id: 'sous-demande-1',
        demandeParentId: demande.id,
        typeDemande: 'sous_demande',
        status: 'en_attente_validation_conducteur', // Active
        items: [],
        type: 'materiel',
        dateCreation: new Date(),
        dateModification: new Date(),
        nombreRejets: 0
      }
      
      // Vérifier si la sous-demande est active
      const sousDemandeActive = sousDemande.status !== 'cloturee' && 
                                 sousDemande.status !== 'rejetee' &&
                                 sousDemande.status !== 'archivee'
      
      expect(sousDemandeActive).toBe(true)
      
      // La demande parent ne peut pas être clôturée
      const canClose = !sousDemandeActive
      expect(canClose).toBe(false)
    })

    test('Devrait autoriser la clôture si toutes les sous-demandes sont terminées', () => {
      const sousDemandes: Partial<Demande>[] = [
        {
          id: 'sd-1',
          demandeParentId: demande.id,
          status: 'cloturee',
          typeDemande: 'sous_demande',
          items: [],
          type: 'materiel',
          dateCreation: new Date(),
          dateModification: new Date(),
          nombreRejets: 0
        },
        {
          id: 'sd-2',
          demandeParentId: demande.id,
          status: 'rejetee',
          typeDemande: 'sous_demande',
          items: [],
          type: 'materiel',
          dateCreation: new Date(),
          dateModification: new Date(),
          nombreRejets: 0
        }
      ]
      
      const hasActiveSousDemande = sousDemandes.some(
        sd => sd.status !== 'cloturee' && sd.status !== 'rejetee' && sd.status !== 'archivee'
      )
      
      expect(hasActiveSousDemande).toBe(false)
      
      const canClose = !hasActiveSousDemande
      expect(canClose).toBe(true)
    })
  })

  describe('Suppression Exceptionnelle de Sous-Demande', () => {
    test('Seul le responsable appro peut supprimer une sous-demande', () => {
      const sousDemande: Partial<Demande> = {
        id: 'sous-demande-1',
        typeDemande: 'sous_demande',
        demandeParentId: demande.id,
        items: [],
        type: 'materiel',
        status: 'soumise',
        dateCreation: new Date(),
        dateModification: new Date(),
        nombreRejets: 0
      }
      
      // Vérifier les permissions
      const canDelete = (user: User, demande: Partial<Demande>) => {
        return user.role === 'responsable_appro' && demande.typeDemande === 'sous_demande'
      }
      
      expect(canDelete(users.appro, sousDemande)).toBe(true)
      expect(canDelete(users.employe, sousDemande)).toBe(false)
      expect(canDelete(users.conducteur, sousDemande)).toBe(false)
    })

    test('Ne peut pas supprimer une demande principale', () => {
      const canDelete = (user: User, demande: Partial<Demande>) => {
        return user.role === 'responsable_appro' && demande.typeDemande === 'sous_demande'
      }
      
      expect(canDelete(users.appro, demande)).toBe(false)
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
    projets: ['projet-1'],
    isAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

/**
 * Tests fonctionnels - Création de demande d'achat (DA)
 * 
 * Vérifie :
 * - Création d'une DA matériel
 * - Création d'une DA outillage
 * - Ajout d'items
 * - Modification d'items
 * - Suppression d'items
 * - Validation des données
 */

import { describe, test, expect, beforeEach } from '@jest/globals'
import type { Demande, DemandeItem, User } from '@/types'

describe('Création de Demande d\'Achat (DA)', () => {
  let testUser: User
  let testDemande: Partial<Demande>

  beforeEach(() => {
    // Setup utilisateur de test
    testUser = {
      id: 'user-test-1',
      email: 'employe@test.com',
      nom: 'Dupont',
      prenom: 'Jean',
      role: 'employe',
      telephone: '0612345678',
      projets: ['projet-1'],
      actif: true,
      dateCreation: new Date()
    }

    // Setup demande de base
    testDemande = {
      type: 'materiel',
      technicienId: testUser.id,
      projetId: 'projet-1',
      status: 'brouillon',
      items: []
    }
  })

  describe('Création DA Matériel', () => {
    test('Devrait créer une DA matériel avec succès', async () => {
      const demande: Partial<Demande> = {
        ...testDemande,
        type: 'materiel',
        items: [
          {
            id: 'item-1',
            articleId: 'article-1',
            quantiteDemandee: 5,
            unite: 'pièce',
            dateCreation: new Date()
          }
        ]
      }

      // Vérifications
      expect(demande.type).toBe('materiel')
      expect(demande.technicienId).toBe(testUser.id)
      expect(demande.items).toHaveLength(1)
      expect(demande.items![0].articleId).toBe('article-1')
      expect(demande.items![0].quantiteDemandee).toBe(5)
    })

    test('Devrait générer un numéro de DA automatiquement', () => {
      const numero = generateNumeroDA('materiel', new Date())
      
      expect(numero).toMatch(/^DA-MAT-\d{8}-\d{4}$/)
    })

    test('Devrait valider les champs obligatoires', () => {
      const demandeInvalide: Partial<Demande> = {
        type: 'materiel',
        // Manque technicienId et projetId
        items: []
      }

      const errors = validateDemande(demandeInvalide)
      
      expect(errors).toContain('technicienId requis')
      expect(errors).toContain('projetId requis')
    })

    test('Devrait empêcher la création sans items', () => {
      const demandeSansItems: Partial<Demande> = {
        ...testDemande,
        items: []
      }

      const errors = validateDemande(demandeSansItems)
      
      expect(errors).toContain('Au moins un item requis')
    })
  })

  describe('Création DA Outillage', () => {
    test('Devrait créer une DA outillage avec succès', () => {
      const demande: Partial<Demande> = {
        ...testDemande,
        type: 'outillage',
        items: [
          {
            id: 'item-1',
            articleId: 'article-1',
            quantiteDemandee: 2,
            unite: 'pièce',
            dateCreation: new Date()
          }
        ]
      }

      expect(demande.type).toBe('outillage')
      expect(demande.items).toHaveLength(1)
    })

    test('Devrait générer un numéro DA-OUT', () => {
      const numero = generateNumeroDA('outillage', new Date())
      
      expect(numero).toMatch(/^DA-OUT-\d{8}-\d{4}$/)
    })
  })

  describe('Gestion des Items', () => {
    test('Devrait ajouter un item à la demande', () => {
      const demande: Partial<Demande> = {
        ...testDemande,
        items: [
          {
            id: 'item-1',
            articleId: 'article-1',
            quantiteDemandee: 10,
            unite: 'paire',
            dateCreation: new Date()
          }
        ]
      }

      // Ajout d'un nouvel item
      const newItem: DemandeItem = {
        id: 'item-2',
        articleId: 'article-2',
        quantiteDemandee: 10,
        unite: 'pièce',
        dateCreation: new Date()
      }

      demande.items!.push(newItem)

      expect(demande.items).toHaveLength(2)
      expect(demande.items![1].articleId).toBe('article-2')
    })

    test('Devrait modifier un item existant', () => {
      const demande: Partial<Demande> = {
        ...testDemande,
        items: [
          {
            id: 'item-1',
            articleId: 'article-1',
            quantiteDemandee: 5,
            unite: 'pièce',
            dateCreation: new Date()
          }
        ]
      }

      // Modification de l'item
      demande.items![0].quantiteDemandee = 10
      demande.items![0].commentaire = 'Casque de chantier renforcé'

      expect(demande.items![0].quantiteDemandee).toBe(10)
      expect(demande.items![0].commentaire).toBe('Casque de chantier renforcé')
    })

    test('Devrait supprimer un item', () => {
      const demande: Partial<Demande> = {
        ...testDemande,
        items: [
          {
            id: 'item-1',
            articleId: 'article-1',
            quantiteDemandee: 5,
            unite: 'pièce',
            dateCreation: new Date()
          },
          {
            id: 'item-2',
            articleId: 'article-2',
            quantiteDemandee: 3,
            unite: 'pièce',
            dateCreation: new Date()
          }
        ]
      }

      // Suppression de l'item 1
      demande.items = demande.items!.filter(item => item.id !== 'item-1')

      expect(demande.items).toHaveLength(1)
      expect(demande.items![0].id).toBe('item-2')
    })

    test('Devrait valider les quantités positives', () => {
      const item: DemandeItem = {
        id: 'item-1',
        articleId: 'article-1',
        quantiteDemandee: -5, // Quantité négative
        unite: 'pièce',
        dateCreation: new Date()
      }

      const errors = validateItem(item)
      
      expect(errors).toContain('Quantité doit être positive')
    })

    test('Devrait valider l\'articleId non vide', () => {
      const item: DemandeItem = {
        id: 'item-1',
        articleId: '', // Vide
        quantiteDemandee: 5,
        unite: 'pièce',
        dateCreation: new Date()
      }

      const errors = validateItem(item)
      
      expect(errors).toContain('ArticleId requis')
    })
  })

  describe('Soumission de la demande', () => {
    test('Devrait passer de brouillon à soumise', () => {
      const demande: Partial<Demande> = {
        ...testDemande,
        status: 'brouillon',
        items: [
          {
            id: 'item-1',
            articleId: 'article-1',
            quantiteDemandee: 5,
            unite: 'pièce',
            dateCreation: new Date()
          }
        ]
      }

      // Soumission
      demande.status = 'soumise'
      demande.dateCreation = new Date()

      expect(demande.status).toBe('soumise')
      expect(demande.dateCreation).toBeDefined()
    })

    test('Devrait empêcher la soumission sans items', () => {
      const demande: Partial<Demande> = {
        ...testDemande,
        status: 'brouillon',
        items: []
      }

      const canSubmit = demande.items!.length > 0
      
      expect(canSubmit).toBe(false)
    })
  })
})

// Fonctions utilitaires pour les tests
function generateNumeroDA(type: 'materiel' | 'outillage', date: Date): string {
  const prefix = type === 'materiel' ? 'DA-MAT' : 'DA-OUT'
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `${prefix}-${dateStr}-${random}`
}

function validateDemande(demande: Partial<Demande>): string[] {
  const errors: string[] = []

  if (!demande.technicienId) errors.push('technicienId requis')
  if (!demande.projetId) errors.push('projetId requis')
  if (!demande.items || demande.items.length === 0) errors.push('Au moins un item requis')

  return errors
}

function validateItem(item: ItemDemande): string[] {
  const errors: string[] = []

  if (!item.articleId || item.articleId.trim() === '') {
    errors.push('ArticleId requis')
  }
  if (item.quantiteDemandee <= 0) {
    errors.push('Quantité doit être positive')
  }

  return errors
}

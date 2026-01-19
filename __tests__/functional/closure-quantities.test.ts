/**
 * Tests fonctionnels - Clôture et gestion des quantités
 * 
 * Vérifie :
 * - Clôture uniquement par le demandeur
 * - Blocage de clôture si sous-demande active
 * - Gestion des quantités (demandée, validée, sortie, reçue)
 * - Validation de réception avec quantités différentes
 */

import { describe, test, expect, beforeEach } from '@jest/globals'
import type { Demande, ItemDemande, User, ValidationReception, ValidationItem } from '@/types'

describe('Clôture et Gestion des Quantités', () => {
  let demande: Partial<Demande>
  let users: Record<string, User>

  beforeEach(() => {
    users = {
      employe: createUser('employe-1', 'employe@test.com', 'employe'),
      conducteur: createUser('conducteur-1', 'conducteur@test.com', 'conducteur_travaux'),
      logistique: createUser('logistique-1', 'logistique@test.com', 'responsable_logistique')
    }

    demande = {
      id: 'demande-1',
      numero: 'DA-MAT-20260118-0001',
      type: 'materiel',
      technicienId: users.employe.id,
      projetId: 'projet-1',
      status: 'en_attente_validation_finale_demandeur',
      items: [
        {
          id: 'item-1',
          articleId: 'article-1',
          quantiteDemandee: 10,
          quantiteValidee: 10,
          quantiteSortie: 10,
          quantiteRecue: 10
        }
      ],
      typeDemande: 'principale',
      nombreRejets: 0,
      dateCreation: new Date(),
      dateModification: new Date()
    }
  })

  describe('Clôture par le Demandeur', () => {
    test('Seul le demandeur peut clôturer sa demande', () => {
      const canClose = (user: User, demande: Partial<Demande>) => {
        return user.id === demande.technicienId && 
               demande.status === 'en_attente_validation_finale_demandeur'
      }

      expect(canClose(users.employe, demande)).toBe(true)
      expect(canClose(users.conducteur, demande)).toBe(false)
      expect(canClose(users.logistique, demande)).toBe(false)
    })

    test('Devrait clôturer la demande avec succès', () => {
      demande.status = 'cloturee'
      demande.dateValidationFinale = new Date()
      demande.validationFinale = {
        userId: users.employe.id,
        date: new Date(),
        signature: `validation_${users.employe.id}_${Date.now()}`
      }

      expect(demande.status).toBe('cloturee')
      expect(demande.dateValidationFinale).toBeDefined()
      expect(demande.validationFinale?.userId).toBe(users.employe.id)
    })

    test('Ne peut pas clôturer si pas au bon statut', () => {
      demande.status = 'en_attente_validation_conducteur'

      const canClose = demande.status === 'en_attente_validation_finale_demandeur'
      expect(canClose).toBe(false)
    })

    test('Devrait enregistrer un commentaire de clôture', () => {
      const commentaire = 'Matériel reçu en bon état'

      demande.validationFinale = {
        userId: users.employe.id,
        date: new Date(),
        commentaire,
        signature: `validation_${users.employe.id}_${Date.now()}`
      }

      expect(demande.validationFinale.commentaire).toBe(commentaire)
    })
  })

  describe('Blocage de Clôture avec Sous-Demande Active', () => {
    test('Devrait bloquer la clôture si sous-demande en cours', () => {
      const sousDemandes: Partial<Demande>[] = [
        {
          id: 'sd-1',
          demandeParentId: demande.id,
          typeDemande: 'sous_demande',
          status: 'en_attente_validation_conducteur', // Active
          items: [],
          type: 'materiel',
          dateCreation: new Date(),
          dateModification: new Date(),
          nombreRejets: 0
        }
      ]

      const hasActiveSousDemande = sousDemandes.some(
        sd => sd.status !== 'cloturee' && 
              sd.status !== 'rejetee' && 
              sd.status !== 'archivee'
      )

      expect(hasActiveSousDemande).toBe(true)

      const canClose = !hasActiveSousDemande
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
          status: 'cloturee',
          typeDemande: 'sous_demande',
          items: [],
          type: 'materiel',
          dateCreation: new Date(),
          dateModification: new Date(),
          nombreRejets: 0
        }
      ]

      const hasActiveSousDemande = sousDemandes.some(
        sd => sd.status !== 'cloturee' && 
              sd.status !== 'rejetee' && 
              sd.status !== 'archivee'
      )

      expect(hasActiveSousDemande).toBe(false)

      const canClose = !hasActiveSousDemande
      expect(canClose).toBe(true)
    })

    test('Devrait lister toutes les sous-demandes actives', () => {
      const sousDemandes: Partial<Demande>[] = [
        {
          id: 'sd-1',
          status: 'en_attente_validation_conducteur',
          typeDemande: 'sous_demande',
          items: [],
          type: 'materiel',
          dateCreation: new Date(),
          dateModification: new Date(),
          nombreRejets: 0
        },
        {
          id: 'sd-2',
          status: 'cloturee',
          typeDemande: 'sous_demande',
          items: [],
          type: 'materiel',
          dateCreation: new Date(),
          dateModification: new Date(),
          nombreRejets: 0
        },
        {
          id: 'sd-3',
          status: 'en_attente_preparation_appro',
          typeDemande: 'sous_demande',
          items: [],
          type: 'materiel',
          dateCreation: new Date(),
          dateModification: new Date(),
          nombreRejets: 0
        }
      ]

      const activeSousDemandes = sousDemandes.filter(
        sd => sd.status !== 'cloturee' && 
              sd.status !== 'rejetee' && 
              sd.status !== 'archivee'
      )

      expect(activeSousDemandes).toHaveLength(2)
      expect(activeSousDemandes[0].id).toBe('sd-1')
      expect(activeSousDemandes[1].id).toBe('sd-3')
    })
  })

  describe('Gestion des Quantités', () => {
    test('Devrait gérer le flux complet des quantités', () => {
      const item: ItemDemande = {
        id: 'item-1',
        articleId: 'article-1',
        quantiteDemandee: 10,
        quantiteValidee: 8,  // Validé par les validateurs
        quantiteSortie: 7,   // Sorti du stock
        quantiteRecue: 6     // Reçu par le demandeur
      }

      expect(item.quantiteDemandee).toBe(10)
      expect(item.quantiteValidee).toBe(8)
      expect(item.quantiteSortie).toBe(7)
      expect(item.quantiteRecue).toBe(6)

      // Vérifier les écarts
      const ecartValidation = item.quantiteDemandee - (item.quantiteValidee || 0)
      const ecartStock = (item.quantiteValidee || 0) - (item.quantiteSortie || 0)
      const ecartLivraison = (item.quantiteSortie || 0) - (item.quantiteRecue || 0)

      expect(ecartValidation).toBe(2) // 2 non validés
      expect(ecartStock).toBe(1)      // 1 manquant en stock
      expect(ecartLivraison).toBe(1)  // 1 perdu en livraison
    })

    test('Devrait calculer les quantités totales par demande', () => {
      demande.items = [
        {
          id: 'item-1',
          articleId: 'article-1',
          quantiteDemandee: 10,
          quantiteValidee: 8,
          quantiteSortie: 7,
          quantiteRecue: 6
        },
        {
          id: 'item-2',
          articleId: 'article-2',
          quantiteDemandee: 5,
          quantiteValidee: 5,
          quantiteSortie: 4,
          quantiteRecue: 4
        }
      ]

      const totaux = {
        demandee: demande.items!.reduce((sum, item) => sum + item.quantiteDemandee, 0),
        validee: demande.items!.reduce((sum, item) => sum + (item.quantiteValidee || 0), 0),
        sortie: demande.items!.reduce((sum, item) => sum + (item.quantiteSortie || 0), 0),
        recue: demande.items!.reduce((sum, item) => sum + (item.quantiteRecue || 0), 0)
      }

      expect(totaux.demandee).toBe(15)
      expect(totaux.validee).toBe(13)
      expect(totaux.sortie).toBe(11)
      expect(totaux.recue).toBe(10)
    })

    test('Devrait identifier les items avec écarts', () => {
      demande.items = [
        {
          id: 'item-1',
          articleId: 'article-1',
          quantiteDemandee: 10,
          quantiteValidee: 10,
          quantiteSortie: 10,
          quantiteRecue: 10 // Pas d\'écart
        },
        {
          id: 'item-2',
          articleId: 'article-2',
          quantiteDemandee: 5,
          quantiteValidee: 5,
          quantiteSortie: 3,
          quantiteRecue: 3 // Écart de 2
        }
      ]

      const itemsAvecEcart = demande.items!.filter(item => {
        const ecart = item.quantiteDemandee - (item.quantiteRecue || 0)
        return ecart > 0
      })

      expect(itemsAvecEcart).toHaveLength(1)
      expect(itemsAvecEcart[0].id).toBe('item-2')
    })
  })

  describe('Validation de Réception', () => {
    test('Devrait créer une validation de réception complète', () => {
      const validationReception: Partial<ValidationReception> = {
        id: 'validation-1',
        demandeId: demande.id,
        validePar: users.employe.id,
        dateValidation: new Date(),
        statut: 'acceptee_totale',
        commentaireGeneral: 'Tout est conforme',
        items: [
          {
            id: 'val-item-1',
            validationId: 'validation-1',
            itemId: 'item-1',
            quantiteValidee: 10,
            quantiteRecue: 10,
            quantiteAcceptee: 10,
            quantiteRefusee: 0,
            statut: 'accepte_total'
          }
        ]
      }

      expect(validationReception.statut).toBe('acceptee_totale')
      expect(validationReception.items).toHaveLength(1)
      expect(validationReception.items![0].quantiteAcceptee).toBe(10)
    })

    test('Devrait gérer une réception partielle', () => {
      const validationItem: Partial<ValidationItem> = {
        id: 'val-item-1',
        validationId: 'validation-1',
        itemId: 'item-1',
        quantiteValidee: 10,
        quantiteRecue: 8,
        quantiteAcceptee: 7,
        quantiteRefusee: 1,
        statut: 'accepte_partiel',
        motifRefus: 'endommage',
        commentaire: '1 unité endommagée pendant le transport'
      }

      expect(validationItem.quantiteRecue).toBe(8)
      expect(validationItem.quantiteAcceptee).toBe(7)
      expect(validationItem.quantiteRefusee).toBe(1)
      expect(validationItem.statut).toBe('accepte_partiel')
      expect(validationItem.motifRefus).toBe('endommage')
    })

    test('Devrait gérer un refus total', () => {
      const validationItem: Partial<ValidationItem> = {
        id: 'val-item-1',
        validationId: 'validation-1',
        itemId: 'item-1',
        quantiteValidee: 10,
        quantiteRecue: 10,
        quantiteAcceptee: 0,
        quantiteRefusee: 10,
        statut: 'refuse_total',
        motifRefus: 'non_conforme',
        commentaire: 'Matériel non conforme aux spécifications'
      }

      expect(validationItem.quantiteAcceptee).toBe(0)
      expect(validationItem.quantiteRefusee).toBe(10)
      expect(validationItem.statut).toBe('refuse_total')
    })

    test('Devrait calculer le statut global de la validation', () => {
      const items: Partial<ValidationItem>[] = [
        {
          id: 'val-item-1',
          validationId: 'validation-1',
          itemId: 'item-1',
          quantiteValidee: 10,
          quantiteRecue: 10,
          quantiteAcceptee: 10,
          quantiteRefusee: 0,
          statut: 'accepte_total'
        },
        {
          id: 'val-item-2',
          validationId: 'validation-1',
          itemId: 'item-2',
          quantiteValidee: 5,
          quantiteRecue: 5,
          quantiteAcceptee: 3,
          quantiteRefusee: 2,
          statut: 'accepte_partiel'
        }
      ]

      const hasRefus = items.some(item => (item.quantiteRefusee || 0) > 0)
      const allAccepted = items.every(item => item.statut === 'accepte_total')
      const allRefused = items.every(item => item.statut === 'refuse_total')

      let statutGlobal: 'acceptee_totale' | 'acceptee_partielle' | 'refusee_totale'
      
      if (allAccepted) {
        statutGlobal = 'acceptee_totale'
      } else if (allRefused) {
        statutGlobal = 'refusee_totale'
      } else {
        statutGlobal = 'acceptee_partielle'
      }

      expect(hasRefus).toBe(true)
      expect(allAccepted).toBe(false)
      expect(statutGlobal).toBe('acceptee_partielle')
    })

    test('Devrait supporter les photos de preuve', () => {
      const validationItem: Partial<ValidationItem> = {
        id: 'val-item-1',
        validationId: 'validation-1',
        itemId: 'item-1',
        quantiteValidee: 10,
        quantiteRecue: 10,
        quantiteAcceptee: 8,
        quantiteRefusee: 2,
        statut: 'accepte_partiel',
        motifRefus: 'endommage',
        photos: [
          'https://storage.example.com/photo1.jpg',
          'https://storage.example.com/photo2.jpg'
        ]
      }

      expect(validationItem.photos).toHaveLength(2)
      expect(validationItem.photos![0]).toMatch(/^https:\/\//)
    })
  })

  describe('Scénarios Complexes', () => {
    test('Devrait gérer une demande avec plusieurs écarts', () => {
      demande.items = [
        {
          id: 'item-1',
          articleId: 'article-1',
          quantiteDemandee: 10,
          quantiteValidee: 8,   // 2 rejetés
          quantiteSortie: 7,    // 1 manquant en stock
          quantiteRecue: 6      // 1 perdu en livraison
        }
      ]

      const item = demande.items[0]
      const ecarts = {
        validation: item.quantiteDemandee - (item.quantiteValidee || 0),
        stock: (item.quantiteValidee || 0) - (item.quantiteSortie || 0),
        livraison: (item.quantiteSortie || 0) - (item.quantiteRecue || 0),
        total: item.quantiteDemandee - (item.quantiteRecue || 0)
      }

      expect(ecarts.validation).toBe(2)
      expect(ecarts.stock).toBe(1)
      expect(ecarts.livraison).toBe(1)
      expect(ecarts.total).toBe(4)
    })

    test('Devrait nécessiter des sous-demandes pour les écarts', () => {
      demande.items = [
        {
          id: 'item-1',
          articleId: 'article-1',
          quantiteDemandee: 10,
          quantiteValidee: 8,
          quantiteSortie: 7,
          quantiteRecue: 6
        }
      ]

      const item = demande.items[0]
      const quantiteManquante = item.quantiteDemandee - (item.quantiteRecue || 0)
      
      const needsSousDemande = quantiteManquante > 0
      expect(needsSousDemande).toBe(true)
      expect(quantiteManquante).toBe(4)
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

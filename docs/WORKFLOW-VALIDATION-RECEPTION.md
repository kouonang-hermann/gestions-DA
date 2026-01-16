# Workflow de Validation de Réception - Gestion des Anomalies de Livraison

## 📋 Vue d'ensemble

Ce document décrit le nouveau workflow de validation de réception mis en place pour gérer les anomalies de livraison (matériel endommagé, non conforme, quantités manquantes).

## 🎯 Objectifs

1. Permettre au demandeur de valider article par article les quantités reçues
2. Gérer automatiquement les écarts entre quantités validées et quantités reçues
3. Créer automatiquement des sous-demandes pour les articles manquants ou refusés
4. Tracer toutes les anomalies avec photos optionnelles
5. Retourner les demandes totalement refusées au responsable appro

## 🔄 Workflow Complet

### Étape 1 : Livraison au demandeur

**Acteur** : Responsable livreur

**Actions** :
1. Le livreur livre le matériel au demandeur
2. Le livreur valide la livraison dans le système
3. **Nouveau statut** : `en_attente_validation_reception_demandeur`

### Étape 2 : Validation de réception par le demandeur

**Acteur** : Demandeur (employé)

**Interface** : `ValidationReceptionModal`

**Actions possibles** :

#### Option A : Acceptation totale
- Le demandeur confirme avoir reçu toutes les quantités validées
- Tous les articles sont conformes
- **Résultat** : Statut → `en_attente_validation_finale_demandeur`
- Le demandeur peut ensuite clôturer la demande

#### Option B : Acceptation partielle
- Le demandeur saisit pour chaque article :
  - Quantité reçue
  - Quantité acceptée
  - Quantité refusée
  - Motif de refus (endommagé, non conforme, manquant, autre)
  - Commentaire
  - Photos (optionnel)

**Résultat** :
- **Sous-demande créée automatiquement** pour les quantités manquantes/refusées
- Sous-demande pré-validée → statut `en_attente_preparation_appro`
- Budget prévisionnel calculé automatiquement
- Demande principale → statut `cloturee_partiellement`
- Notification envoyée au responsable appro

#### Option C : Refus total
- Le demandeur refuse toute la livraison
- Commentaire général obligatoire
- **Résultat** : Statut → `renvoyee_vers_appro`
- Notification envoyée au responsable appro

### Étape 3 : Traitement par le responsable appro

**Acteur** : Responsable appro

**Interface** : `SousDemandesList` dans le dashboard appro

**Cas 1 : Sous-demandes**
- Affichées dans la section "Anomalies de livraison"
- Badge "Sous-demande" pour identification
- Lien vers la demande parente visible
- Budget prévisionnel affiché
- Traitement comme une demande normale (préparation → livraison)

**Cas 2 : Demandes renvoyées**
- Affichées dans la section "Demandes renvoyées"
- Badge "Refusée totalement"
- Motif de refus visible
- Retraitement complet nécessaire

## 📊 Nouveaux Statuts

| Statut | Description | Acteur concerné |
|--------|-------------|-----------------|
| `en_attente_validation_reception_demandeur` | Livraison effectuée, en attente de validation par le demandeur | Demandeur |
| `renvoyee_vers_appro` | Demande refusée totalement, retournée à l'appro | Responsable appro |
| `cloturee_partiellement` | Demande partiellement acceptée, sous-demande créée | Demandeur (pour info) |

## 🗄️ Modèles de données

### ValidationReception

```prisma
model ValidationReception {
  id                  String
  demandeId           String
  validePar           String
  dateValidation      DateTime
  statut              String // acceptee_totale | acceptee_partielle | refusee_totale
  commentaireGeneral  String?
  items               ValidationItem[]
}
```

### ValidationItem

```prisma
model ValidationItem {
  id                  String
  validationId        String
  itemId              String
  quantiteValidee     Int    // Référence (quantité validée par les validateurs)
  quantiteRecue       Int    // Quantité réellement reçue
  quantiteAcceptee    Int    // Quantité acceptée par le demandeur
  quantiteRefusee     Int    // Quantité refusée
  statut              String // accepte_total | accepte_partiel | refuse_total
  motifRefus          String? // endommage | non_conforme | manquant | autre
  commentaire         String?
  photos              String[] // URLs des photos de preuve
}
```

### Sous-demandes

Champs ajoutés au modèle `Demande` :

```prisma
demandeParentId     String?  // ID de la demande parent
typeDemande         String   // principale | sous_demande
motifSousDemande    String?  // complement | remplacement | autre
```

## 🔧 API Endpoints

### POST `/api/demandes/[id]/valider-reception`

**Headers** :
```
x-user-id: <userId>
Content-Type: application/json
```

**Body** :
```json
{
  "items": [
    {
      "itemId": "item_123",
      "quantiteRecue": 10,
      "quantiteAcceptee": 8,
      "quantiteRefusee": 2,
      "motifRefus": "endommage",
      "commentaire": "2 unités endommagées pendant le transport",
      "photos": ["url1", "url2"]
    }
  ],
  "commentaireGeneral": "Livraison partiellement conforme",
  "refuserTout": false
}
```

**Réponse succès** :
```json
{
  "success": true,
  "message": "Réception validée partiellement, sous-demande créée",
  "demande": {
    "id": "demande_123",
    "status": "cloturee_partiellement"
  },
  "sousDemande": {
    "id": "sous_demande_456",
    "numero": "DA-2024-001-SD1234",
    "items": 1
  }
}
```

## 🎨 Composants UI

### 1. ValidationReceptionModal

**Localisation** : `components/modals/validation-reception-modal.tsx`

**Fonctionnalités** :
- Affichage de tous les articles de la demande
- Saisie des quantités reçues et acceptées
- Sélection du motif de refus
- Upload de photos (optionnel)
- Validation en 2 étapes (saisie → confirmation)
- Option "Refuser toute la livraison"

### 2. ValidationReceptionList

**Localisation** : `components/dashboard/validation-reception-list.tsx`

**Affichage** :
- Liste des demandes en attente de validation de réception
- Badge "Validation requise"
- Bouton "Valider la réception"
- Intégré dans le dashboard employé

### 3. SousDemandesList

**Localisation** : `components/dashboard/sous-demandes-list.tsx`

**Affichage** :
- Section "Anomalies de livraison"
- Sous-section "Sous-demandes à préparer"
- Sous-section "Demandes renvoyées"
- Badges distinctifs pour chaque type
- Intégré dans le dashboard appro

## 📈 Logique de génération des sous-demandes

### Calcul automatique

Pour chaque article avec anomalie :

```typescript
quantiteManquante = quantiteValidee - quantiteAcceptee

if (quantiteManquante > 0) {
  // Créer un item dans la sous-demande
  sousDemande.items.push({
    articleId: item.articleId,
    quantiteDemandee: quantiteManquante,
    quantiteValidee: quantiteManquante, // Pré-validée !
    prixUnitaire: item.prixUnitaire,
    commentaire: `Sous-demande - ${motifRefus}`
  })
}
```

### Budget prévisionnel

```typescript
budgetSousDemande = items.reduce((total, item) => {
  return total + (item.prixUnitaire * item.quantiteDemandee)
}, 0)
```

### Numérotation

Format : `{numeroDemandePrincipale}-SD{timestamp}`

Exemple : `DA-2024-001-SD1234`

## 🔔 Notifications

### Notification de sous-demande créée

**Destinataire** : Responsable appro

**Message** :
```
📦 Nouvelle sous-demande à préparer

Une sous-demande DA-2024-001-SD1234 a été générée suite à une 
anomalie de livraison de DA-2024-001.

Motif : Complément de livraison
Articles : 2
Budget : 150,00 €

👉 Connectez-vous pour préparer cette sous-demande.
```

### Notification de demande renvoyée

**Destinataire** : Responsable appro

**Message** :
```
🔄 Demande renvoyée pour retraitement

La demande DA-2024-001 a été refusée totalement par le demandeur.

Commentaire : "Matériel non conforme aux spécifications"

👉 Connectez-vous pour retraiter cette demande.
```

## 🧪 Scénarios de test

### Scénario 1 : Acceptation totale
1. Livreur livre la demande
2. Demandeur valide : toutes les quantités reçues = quantités validées
3. ✅ Statut → `en_attente_validation_finale_demandeur`
4. Demandeur clôture la demande

### Scénario 2 : Quantité partielle
1. Livreur livre la demande
2. Demandeur saisit :
   - Article A : 10 validés, 8 reçus, 8 acceptés
   - Article B : 5 validés, 5 reçus, 5 acceptés
3. ✅ Sous-demande créée pour 2 unités de l'article A
4. ✅ Demande principale → `cloturee_partiellement`
5. ✅ Sous-demande → `en_attente_preparation_appro`

### Scénario 3 : Article endommagé
1. Livreur livre la demande
2. Demandeur saisit :
   - Article A : 10 validés, 10 reçus, 7 acceptés, 3 refusés
   - Motif : "endommagé"
   - Photos : 2 photos jointes
3. ✅ Sous-demande créée pour 3 unités
4. ✅ Photos sauvegardées dans ValidationItem

### Scénario 4 : Refus total
1. Livreur livre la demande
2. Demandeur coche "Refuser toute la livraison"
3. Commentaire : "Matériel non conforme"
4. ✅ Statut → `renvoyee_vers_appro`
5. ✅ Notification envoyée à l'appro

## 🔐 Permissions

| Action | Rôle requis |
|--------|-------------|
| Valider réception | Demandeur (créateur de la demande) |
| Voir sous-demandes | Responsable appro, Super-admin |
| Préparer sous-demande | Responsable appro |
| Voir demandes renvoyées | Responsable appro, Super-admin |

## 📝 Notes importantes

1. **Photos optionnelles** : Les photos ne sont pas obligatoires mais recommandées pour les refus
2. **Pas de limite de rejets** : Un demandeur peut rejeter une demande autant de fois que nécessaire
3. **Même logique pour outillage** : Le workflow s'applique identiquement aux demandes d'outillage
4. **Comparaison quantité validée** : La référence est toujours la quantité validée par les validateurs, pas la quantité demandée initiale
5. **Sous-demandes pré-validées** : Les sous-demandes sont automatiquement validées et vont directement chez l'appro
6. **Budget automatique** : Le budget prévisionnel est calculé automatiquement pour les sous-demandes

## 🚀 Prochaines étapes

Pour activer ce workflow en production :

1. **Exécuter la migration Prisma** :
   ```bash
   npx prisma migrate dev --name add-validation-reception
   ```

2. **Vérifier les variables d'environnement** :
   - Configuration des notifications
   - Configuration du stockage des photos

3. **Former les utilisateurs** :
   - Demandeurs : Comment valider une réception
   - Responsables appro : Comment gérer les sous-demandes

4. **Monitoring** :
   - Suivre le nombre de sous-demandes créées
   - Analyser les motifs de refus les plus fréquents
   - Identifier les fournisseurs problématiques

## 📞 Support

Pour toute question sur ce workflow, contacter l'équipe de développement.

---

**Version** : 1.0  
**Date** : Janvier 2025  
**Auteur** : Équipe Développement

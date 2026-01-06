# ✅ Implémentation Complète - Workflow de Rejet avec Retour Arrière

## 📊 Statut de l'implémentation

**Date** : 6 janvier 2025  
**Statut** : ✅ Backend complet implémenté  
**Prêt pour** : Tests et validation

---

## 🎯 Ce qui a été implémenté

### ✅ 1. Base de données

#### Schéma Prisma modifié
**Fichier** : `prisma/schema.prisma`

```prisma
model Demande {
  // ... champs existants ...
  nombreRejets    Int            @default(0)  // Compteur de rejets
  statusPrecedent DemandeStatus?              // Statut avant rejet
  // ... autres champs ...
}
```

#### Migration SQL créée
**Fichier** : `prisma/migrations/add_rejection_tracking.sql`

```sql
ALTER TABLE "demandes" ADD COLUMN IF NOT EXISTS "nombreRejets" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "demandes" ADD COLUMN IF NOT EXISTS "statusPrecedent" TEXT;
```

### ✅ 2. Backend complet

#### Fichier utilitaire workflow
**Fichier** : `lib/workflow-utils.ts` (NOUVEAU - 250+ lignes)

**Fonctions principales** :
- `getPreviousStatus()` : Détermine le statut précédent selon le type de demande
- `getModificationPermissions()` : Permissions par niveau de valideur
- `getPreviousValidatorRole()` : Identifie qui notifier lors du rejet
- `generateRejectionNotificationMessage()` : Génère les messages de notification
- `canModifyRejectedDemande()` : Vérifie les droits de modification
- `hasReachedMaxRejections()` : Limite de 5 rejets

#### API de rejet modifiée
**Fichier** : `app/api/demandes/[id]/route.ts` (MODIFIÉ)

**Nouvelles fonctionnalités** :
- Retour automatique au statut précédent lors du rejet
- Incrémentation du compteur `nombreRejets`
- Sauvegarde du `statusPrecedent`
- Notifications au valideur précédent
- Vérification de la limite de rejets (max 5)
- Logs détaillés pour debugging

#### API de modification créée
**Fichier** : `app/api/demandes/[id]/modify/route.ts` (NOUVEAU - 200+ lignes)

**Fonctionnalités** :
- Modification des demandes rejetées
- Application des permissions selon le niveau
- Validation des modifications autorisées
- Renvoi automatique après modification
- Réinitialisation du `statusPrecedent`
- Traçabilité complète dans l'historique

### ✅ 3. Types TypeScript

**Fichier** : `types/index.ts` (MODIFIÉ)

```typescript
export interface Demande {
  // ... champs existants ...
  nombreRejets: number           // Compteur de rejets
  statusPrecedent?: DemandeStatus // Statut avant rejet
  // ... autres champs ...
}
```

### ✅ 4. Documentation

#### Documentation complète du workflow
**Fichier** : `WORKFLOW-REJET-AVEC-RETOUR.md` (NOUVEAU - 400+ lignes)

**Contenu** :
- Principe de fonctionnement détaillé
- Exemples concrets avec scénarios
- Règles du système (retour, compteur, sauvegarde)
- Permissions de modification par niveau
- Système de notifications
- Documentation des API endpoints
- Interface utilisateur (à implémenter)
- Sécurité et validations

#### README mis à jour
**Fichier** : `README.md` (MODIFIÉ)

**Section ajoutée** : "🔄 Workflow de Rejet avec Retour Arrière"
- Explication du nouveau système
- Exemple de cycle de rejet
- Tableau des permissions par niveau

#### Plan de test complet
**Fichier** : `PLAN-TEST-WORKFLOW-REJET.md` (NOUVEAU - 300+ lignes)

**Contenu** :
- 6 scénarios de test détaillés
- Utilisateurs de test disponibles
- Checklist de vérification
- Points de contrôle critiques
- Rapport de test à compléter

#### Script de test automatisé
**Fichier** : `test-workflow-rejet.js` (NOUVEAU - 400+ lignes)

**Fonctionnalités** :
- Tests automatisés via API
- 9 étapes de test complètes
- Assertions pour chaque étape
- Logs colorés et détaillés
- Vérification du cycle complet

---

## 🚀 Comment tester l'implémentation

### Prérequis

1. **Appliquer la migration SQL**

Connectez-vous à Supabase et exécutez :

```sql
ALTER TABLE "demandes" ADD COLUMN IF NOT EXISTS "nombreRejets" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "demandes" ADD COLUMN IF NOT EXISTS "statusPrecedent" TEXT;

COMMENT ON COLUMN "demandes"."nombreRejets" IS 'Compteur de rejets pour traçabilité';
COMMENT ON COLUMN "demandes"."statusPrecedent" IS 'Statut avant le rejet (pour retour arrière)';
```

2. **Régénérer le client Prisma**

```bash
npx prisma generate
```

3. **Vérifier les utilisateurs de test**

Assurez-vous que ces utilisateurs existent :
- Employé : 0600000001 / password123
- Conducteur : 0600000002 / password123
- Resp. Travaux : 0600000003 / password123
- Chargé Affaire : 0600000004 / password123

### Option 1 : Test manuel via l'interface

1. **Lancer l'application**
```bash
npm run dev
```

2. **Suivre le plan de test**
Ouvrir `PLAN-TEST-WORKFLOW-REJET.md` et suivre les scénarios

**Scénario prioritaire** : Scénario 1 - Rejet Simple avec Modification

### Option 2 : Test automatisé via script

1. **Lancer l'application**
```bash
npm run dev
```

2. **Exécuter le script de test**
```bash
node test-workflow-rejet.js
```

Le script va :
- ✅ Connecter les utilisateurs
- ✅ Créer une demande
- ✅ La faire valider par le conducteur
- ✅ La faire rejeter par le resp. travaux
- ✅ Vérifier le retour au statut précédent
- ✅ Modifier et renvoyer
- ✅ Rejeter à nouveau par le chargé d'affaire
- ✅ Modifier et renvoyer
- ✅ Valider finalement

### Option 3 : Test via API directement

#### 1. Créer une demande
```bash
POST /api/demandes
Authorization: Bearer <token_employe>
Content-Type: application/json

{
  "type": "materiel",
  "projetId": "projet-test-1",
  "items": [
    {
      "articleId": "article-test-1",
      "quantiteDemandee": 10,
      "commentaire": "Test rejet"
    }
  ],
  "commentaires": "Demande de test"
}
```

#### 2. Valider par le conducteur
```bash
PUT /api/demandes/{id}
Authorization: Bearer <token_conducteur>
Content-Type: application/json

{
  "status": "valider",
  "commentaire": "Validation OK"
}
```

#### 3. Rejeter par le resp. travaux
```bash
PUT /api/demandes/{id}
Authorization: Bearer <token_resp_travaux>
Content-Type: application/json

{
  "status": "rejetee",
  "commentaire": "Quantités trop élevées"
}
```

**Vérifier la réponse** :
```json
{
  "success": true,
  "data": {
    "status": "en_attente_validation_conducteur",
    "nombreRejets": 1,
    "statusPrecedent": "en_attente_validation_responsable_travaux"
  }
}
```

#### 4. Modifier et renvoyer
```bash
PUT /api/demandes/{id}/modify
Authorization: Bearer <token_conducteur>
Content-Type: application/json

{
  "items": [
    {
      "articleId": "article-test-1",
      "quantiteDemandee": 5,
      "commentaire": "Quantité réduite"
    }
  ],
  "commentaires": "Modifications apportées"
}
```

---

## 🔍 Vérifications dans la base de données

### Vérifier les demandes rejetées
```sql
SELECT 
  numero, 
  status, 
  "statusPrecedent", 
  "nombreRejets",
  "rejetMotif"
FROM demandes 
WHERE "nombreRejets" > 0
ORDER BY "dateModification" DESC;
```

### Vérifier les notifications
```sql
SELECT 
  n.titre,
  n.message,
  u.nom,
  u.role,
  d.numero,
  n."createdAt"
FROM notifications n
JOIN users u ON n."userId" = u.id
JOIN demandes d ON n."demandeId" = d.id
WHERE n.titre LIKE '%rejetée%'
ORDER BY n."createdAt" DESC;
```

### Vérifier l'historique
```sql
SELECT 
  h.action,
  h."ancienStatus",
  h."nouveauStatus",
  h.commentaire,
  u.nom,
  u.role,
  d.numero,
  h.timestamp
FROM history_entries h
JOIN users u ON h."userId" = u.id
JOIN demandes d ON h."demandeId" = d.id
WHERE h.action LIKE '%rejeté%'
ORDER BY h.timestamp DESC;
```

---

## 📋 Checklist de validation

### Backend
- [x] Migration SQL créée
- [x] Schéma Prisma modifié
- [x] Fonction `getPreviousStatus()` implémentée
- [x] API de rejet modifiée
- [x] API de modification créée
- [x] Permissions par niveau implémentées
- [x] Notifications au valideur précédent
- [x] Limite de 5 rejets
- [x] Traçabilité complète
- [x] Types TypeScript mis à jour

### Documentation
- [x] Workflow détaillé documenté
- [x] README mis à jour
- [x] Plan de test créé
- [x] Script de test automatisé
- [x] Exemples d'API fournis

### À faire (Frontend - optionnel)
- [ ] Badge "🔄 X rejets" sur les demandes
- [ ] Bouton "Modifier et renvoyer"
- [ ] Modale de modification avec permissions
- [ ] Modale de rejet avec motif obligatoire
- [ ] Historique visuel des rejets

---

## 📊 Mapping des statuts précédents

| Statut actuel | Type Matériel | Type Outillage |
|---------------|---------------|----------------|
| `en_attente_validation_responsable_travaux` | `en_attente_validation_conducteur` | `en_attente_validation_logistique` |
| `en_attente_validation_charge_affaire` | `en_attente_validation_responsable_travaux` | `en_attente_validation_responsable_travaux` |
| `en_attente_preparation_appro` | `en_attente_validation_charge_affaire` | `en_attente_validation_charge_affaire` |
| `en_attente_reception_livreur` | `en_attente_preparation_appro` | `en_attente_preparation_appro` |
| `en_attente_livraison` | `en_attente_reception_livreur` | `en_attente_reception_livreur` |
| `en_attente_validation_finale_demandeur` | `en_attente_livraison` | `en_attente_livraison` |

---

## 🎯 Permissions de modification par niveau

| Niveau | Rôles | Quantités | Articles | Commentaires | Date besoin |
|--------|-------|-----------|----------|--------------|-------------|
| **1** | Conducteur, QHSE, Resp. Travaux | ✅ | ✅ | ✅ | ✅ |
| **2** | Chargé Affaire | ✅ | ✅ | ✅ | ❌ |
| **3** | Resp. Appro | ✅ | ✅ | ✅ | ❌ |
| **4** | Livreur | ✅ | ❌ | ✅ | ❌ |

---

## 🐛 Dépannage

### Erreur : "Utilisateur non trouvé"
- Vérifier que la migration SQL est appliquée
- Régénérer le client Prisma : `npx prisma generate`
- Vérifier que les utilisateurs de test existent

### Erreur : "Impossible de rejeter cette demande"
- Vérifier que le statut actuel a un statut précédent défini
- Consulter le mapping des statuts ci-dessus

### Erreur : "Limite de rejets atteinte"
- C'est normal après 5 rejets
- Créer une nouvelle demande pour continuer les tests

### Les notifications ne sont pas créées
- Vérifier que le valideur précédent est assigné au projet
- Consulter les logs serveur pour plus de détails

---

## 📞 Support

Pour toute question ou problème :
1. Consulter `WORKFLOW-REJET-AVEC-RETOUR.md` pour la documentation complète
2. Consulter `PLAN-TEST-WORKFLOW-REJET.md` pour les scénarios de test
3. Vérifier les logs serveur pour les erreurs détaillées
4. Exécuter les requêtes SQL de vérification ci-dessus

---

## ✅ Résumé

**Implémentation backend** : ✅ COMPLÈTE  
**Documentation** : ✅ COMPLÈTE  
**Tests** : ⏳ À EXÉCUTER  
**Frontend** : ⏳ OPTIONNEL

Le système de rejet avec retour arrière est **prêt à être testé** ! 🎉

Suivez les instructions ci-dessus pour valider le fonctionnement complet.

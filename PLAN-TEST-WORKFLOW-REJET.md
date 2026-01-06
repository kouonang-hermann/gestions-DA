# 🧪 Plan de Test - Workflow de Rejet avec Retour Arrière

## 📋 Objectif
Tester le nouveau système de rejet qui permet aux demandes de retourner au statut précédent pour modification, avec compteur de rejets et notifications.

---

## 👥 Utilisateurs de Test Disponibles

### Utilisateurs pour le workflow Matériel

| Rôle | Nom | Téléphone | Mot de passe | Étape de validation |
|------|-----|-----------|--------------|---------------------|
| Employé | Martin Employé | 0600000001 | password123 | Créateur |
| Conducteur | Dupont Conducteur | 0600000002 | password123 | Validation 1 |
| Resp. Travaux | Durand Resp. Travaux | 0600000003 | password123 | Validation 2 |
| Chargé Affaire | Bernard Chargé | 0600000004 | password123 | Validation 3 |
| Resp. Appro | Petit Appro | 0600000005 | password123 | Validation 4 |
| Resp. Livreur | Moreau Livreur | 0600000007 | password123 | Livraison |

### Utilisateurs pour le workflow Outillage

| Rôle | Nom | Téléphone | Mot de passe | Étape de validation |
|------|-----|-----------|--------------|---------------------|
| Employé | Martin Employé | 0600000001 | password123 | Créateur |
| Resp. Logistique | Roux Logistique | 0600000006 | password123 | Validation 1 |
| Resp. Travaux | Durand Resp. Travaux | 0600000003 | password123 | Validation 2 |
| Chargé Affaire | Bernard Chargé | 0600000004 | password123 | Validation 3 |

---

## 🎯 Scénarios de Test

### ✅ Scénario 1 : Rejet Simple avec Modification (PRIORITAIRE)

**Objectif** : Tester le retour au statut précédent et la modification

**Étapes** :

1. **Connexion Employé** (Martin - 0600000001)
   - Créer une demande matériel
   - Articles : 10x Casques de chantier
   - Projet : Projet Test
   - Soumettre la demande
   - ✅ **Vérifier** : Status = `en_attente_validation_conducteur`

2. **Connexion Conducteur** (Dupont - 0600000002)
   - Voir la demande dans "À valider"
   - **VALIDER** la demande
   - ✅ **Vérifier** : Status = `en_attente_validation_responsable_travaux`

3. **Connexion Resp. Travaux** (Durand - 0600000003)
   - Voir la demande dans "À valider"
   - **REJETER** la demande
   - Motif : "Quantités trop élevées, réduire à 5 unités"
   - ✅ **Vérifier** : 
     - Status = `en_attente_validation_conducteur` (RETOUR)
     - `nombreRejets` = 1
     - `statusPrecedent` = `en_attente_validation_responsable_travaux`
     - Badge "🔄 1 rejet" visible

4. **Vérification Notification**
   - Connexion Conducteur (Dupont)
   - ✅ **Vérifier** : Notification reçue
   - Message : "La demande DEM-XXX a été rejetée par responsable_travaux. Motif: Quantités trop élevées..."

5. **Modification par Conducteur**
   - Voir la demande avec badge "🔄 1 rejet"
   - Cliquer sur "Modifier et renvoyer"
   - Réduire quantité à 5 unités
   - Ajouter commentaire : "Quantité ajustée selon demande"
   - **RENVOYER**
   - ✅ **Vérifier** :
     - Status = `en_attente_validation_responsable_travaux` (RENVOI)
     - `statusPrecedent` = null (réinitialisé)
     - `nombreRejets` = 1 (conservé)

6. **Validation finale**
   - Connexion Resp. Travaux (Durand)
   - **VALIDER** la demande modifiée
   - ✅ **Vérifier** : Status = `en_attente_validation_charge_affaire`

**Résultat attendu** : ✅ Cycle complet de rejet/modification/renvoi fonctionnel

---

### ✅ Scénario 2 : Rejets Multiples en Cascade

**Objectif** : Tester plusieurs rejets successifs avec retours multiples

**Étapes** :

1. **Création** (Employé Martin)
   - Demande matériel : 20x Gants de protection
   - Status : `en_attente_validation_conducteur`

2. **Validation Conducteur** (Dupont)
   - VALIDER
   - Status : `en_attente_validation_responsable_travaux`

3. **Premier Rejet** (Resp. Travaux Durand)
   - REJETER : "Quantité excessive"
   - ✅ Vérifier : Status = `en_attente_validation_conducteur`, nombreRejets = 1

4. **Modification et renvoi** (Conducteur Dupont)
   - Réduire à 15 unités
   - RENVOYER
   - Status : `en_attente_validation_responsable_travaux`

5. **Validation Resp. Travaux** (Durand)
   - VALIDER
   - Status : `en_attente_validation_charge_affaire`

6. **Deuxième Rejet** (Chargé Affaire Bernard)
   - REJETER : "Budget insuffisant, réduire encore"
   - ✅ Vérifier : 
     - Status = `en_attente_validation_responsable_travaux` (RETOUR)
     - nombreRejets = 2
     - Badge "🔄 2 rejets"

7. **Modification et renvoi** (Resp. Travaux Durand)
   - Réduire à 10 unités
   - RENVOYER
   - Status : `en_attente_validation_charge_affaire`

8. **Validation finale** (Chargé Affaire Bernard)
   - VALIDER
   - Status : `en_attente_preparation_appro`

**Résultat attendu** : ✅ Compteur de rejets incrémenté correctement, retours multiples fonctionnels

---

### ✅ Scénario 3 : Limite de Rejets (5 maximum)

**Objectif** : Vérifier que la limite de 5 rejets est respectée

**Étapes** :

1. Créer une demande et la faire rejeter 5 fois
2. À la 6ème tentative de rejet :
   - ✅ **Vérifier** : Erreur affichée
   - Message : "Cette demande a atteint le nombre maximum de rejets (5)"

**Résultat attendu** : ✅ Blocage après 5 rejets

---

### ✅ Scénario 4 : Permissions de Modification

**Objectif** : Vérifier que chaque niveau ne peut modifier que ce qui est autorisé

#### Test 4.1 : Conducteur (Niveau 1)
- ✅ Peut modifier : Quantités, Articles, Commentaires, Date de besoin
- ❌ Ne peut pas : Rien (tous les droits)

#### Test 4.2 : Chargé Affaire (Niveau 2)
- ✅ Peut modifier : Quantités, Articles, Commentaires
- ❌ Ne peut pas : Date de besoin

#### Test 4.3 : Resp. Appro (Niveau 3)
- ✅ Peut modifier : Quantités, Articles, Commentaires
- ❌ Ne peut pas : Date de besoin

#### Test 4.4 : Livreur (Niveau 4)
- ✅ Peut modifier : Quantités livrées, Commentaires
- ❌ Ne peut pas : Articles, Date de besoin

**Résultat attendu** : ✅ Permissions respectées selon le niveau

---

### ✅ Scénario 5 : Auto-validation avec Rejet

**Objectif** : Tester le rejet d'une demande auto-validée

**Étapes** :

1. **Connexion Conducteur** (Dupont)
   - Créer une demande matériel
   - ✅ **Vérifier** : Auto-validation, Status = `en_attente_validation_responsable_travaux`

2. **Connexion Resp. Travaux** (Durand)
   - REJETER la demande
   - Motif : "Articles non conformes"
   - ✅ **Vérifier** : 
     - Status = `en_attente_validation_conducteur` (RETOUR au créateur)
     - Notification envoyée au Conducteur

3. **Modification par Conducteur**
   - Modifier les articles
   - RENVOYER
   - ✅ **Vérifier** : Status = `en_attente_validation_responsable_travaux`

**Résultat attendu** : ✅ Auto-validation + rejet fonctionne correctement

---

### ✅ Scénario 6 : Workflow Outillage avec Rejet

**Objectif** : Tester le rejet sur le workflow outillage

**Étapes** :

1. **Création** (Employé Martin)
   - Demande outillage : 5x Perceuses
   - Status : `en_attente_validation_logistique`

2. **Validation Logistique** (Roux)
   - VALIDER
   - Status : `en_attente_validation_responsable_travaux`

3. **Rejet Resp. Travaux** (Durand)
   - REJETER : "Modèle non adapté"
   - ✅ **Vérifier** : Status = `en_attente_validation_logistique` (RETOUR)

4. **Modification Logistique** (Roux)
   - Changer le modèle
   - RENVOYER
   - Status : `en_attente_validation_responsable_travaux`

**Résultat attendu** : ✅ Workflow outillage fonctionne avec rejets

---

## 📊 Checklist de Vérification

### Backend
- [ ] Migration SQL appliquée (`nombreRejets`, `statusPrecedent`)
- [ ] API `/api/demandes/[id]` (PUT) retourne au statut précédent
- [ ] API `/api/demandes/[id]/modify` (PUT) permet la modification
- [ ] Compteur de rejets incrémenté correctement
- [ ] Limite de 5 rejets respectée
- [ ] Notifications envoyées au valideur précédent
- [ ] Historique enregistre tous les rejets

### Frontend (à implémenter)
- [ ] Badge "🔄 X rejets" visible sur les demandes
- [ ] Bouton "Modifier et renvoyer" visible pour le valideur précédent
- [ ] Modale de modification avec permissions appliquées
- [ ] Modale de rejet avec motif obligatoire
- [ ] Notifications affichées correctement
- [ ] Historique des rejets visible

### Permissions
- [ ] Niveau 1 : Toutes modifications autorisées
- [ ] Niveau 2 : Date de besoin bloquée
- [ ] Niveau 3 : Date de besoin bloquée
- [ ] Niveau 4 : Articles bloqués

---

## 🔍 Points de Contrôle Critiques

### 1. Retour au statut précédent
```sql
-- Vérifier dans la base de données
SELECT numero, status, "statusPrecedent", "nombreRejets" 
FROM demandes 
WHERE "nombreRejets" > 0;
```

### 2. Notifications
```sql
-- Vérifier les notifications créées
SELECT titre, message, "userId", "demandeId" 
FROM notifications 
WHERE titre LIKE '%rejetée%' 
ORDER BY "createdAt" DESC;
```

### 3. Historique
```sql
-- Vérifier l'historique des rejets
SELECT action, "ancienStatus", "nouveauStatus", commentaire 
FROM history_entries 
WHERE action LIKE '%rejeté%' 
ORDER BY timestamp DESC;
```

---

## 🚀 Commandes de Test

### 1. Appliquer la migration
```bash
# Exécuter dans Supabase SQL Editor
ALTER TABLE "demandes" ADD COLUMN IF NOT EXISTS "nombreRejets" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "demandes" ADD COLUMN IF NOT EXISTS "statusPrecedent" TEXT;
```

### 2. Régénérer Prisma
```bash
npx prisma generate
```

### 3. Lancer l'application
```bash
npm run dev
```

### 4. Accéder à l'application
```
http://localhost:3000
```

---

## 📝 Rapport de Test

### Scénario 1 : Rejet Simple
- [ ] ✅ Passé
- [ ] ❌ Échoué
- Notes : _______________________

### Scénario 2 : Rejets Multiples
- [ ] ✅ Passé
- [ ] ❌ Échoué
- Notes : _______________________

### Scénario 3 : Limite de Rejets
- [ ] ✅ Passé
- [ ] ❌ Échoué
- Notes : _______________________

### Scénario 4 : Permissions
- [ ] ✅ Passé
- [ ] ❌ Échoué
- Notes : _______________________

### Scénario 5 : Auto-validation
- [ ] ✅ Passé
- [ ] ❌ Échoué
- Notes : _______________________

### Scénario 6 : Workflow Outillage
- [ ] ✅ Passé
- [ ] ❌ Échoué
- Notes : _______________________

---

## 🐛 Bugs Identifiés

| # | Scénario | Description | Priorité | Statut |
|---|----------|-------------|----------|--------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

---

## ✅ Validation Finale

- [ ] Tous les scénarios passent
- [ ] Aucun bug critique
- [ ] Permissions respectées
- [ ] Notifications fonctionnelles
- [ ] Traçabilité complète
- [ ] Documentation à jour

**Date de test** : _______________  
**Testeur** : _______________  
**Statut global** : ⬜ VALIDÉ / ⬜ À CORRIGER

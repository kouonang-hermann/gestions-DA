# 📋 Guide de Réouverture des Demandes Clôturées Sans Prix

## 🎯 Contexte

Après l'implémentation du système de sous-demandes et de calcul de prix, certaines demandes ont été **clôturées avant que les prix unitaires ne soient renseignés**. 

Ce guide explique comment identifier et réouvrir ces demandes pour permettre la saisie des prix manquants.

---

## 🔍 Problème Identifié

### **Situation**
- Des demandes ont été clôturées (statut `cloturee`)
- Certains articles (items) de ces demandes n'ont **pas de prix unitaire** renseigné
- Le champ `prixUnitaire` est `null`, `undefined` ou `0`

### **Impact**
- Impossible de calculer le coût total de la demande
- Rapports financiers incomplets
- Traçabilité budgétaire manquante

---

## 🛠️ Solution : Script de Réouverture

### **Fichier Créé**
`scripts/reopen-closed-demands-without-prices.ts`

### **Fonctionnalités**

#### 1. **Identification Automatique**
Le script identifie toutes les demandes clôturées qui contiennent des articles sans prix :

```typescript
// Critères de recherche
- Statut : "cloturee"
- Articles avec : prixUnitaire === null || undefined || 0
```

#### 2. **Rapport Détaillé**
Pour chaque demande trouvée, affiche :
- Numéro de la demande
- Projet associé
- Demandeur
- Nombre d'articles sans prix
- Détails de chaque article concerné

#### 3. **Réouverture Sécurisée**
- Change le statut : `cloturee` → `en_attente_preparation_appro`
- Sauvegarde l'ancien statut dans `statusPrecedent`
- Ajoute une entrée dans l'historique avec commentaire explicatif

---

## 📝 Comment Utiliser le Script

### **Étape 1 : Mode Test (Recommandé)**

Le script s'exécute d'abord en **mode test** sans modifier la base de données :

```bash
# Depuis la racine du projet
npx ts-node scripts/reopen-closed-demands-without-prices.ts
```

**Résultat en mode test :**
```
🔍 Recherche des demandes clôturées avec articles sans prix...

📊 Total de demandes clôturées : 45

📦 Demande DA-M-2026-0123:
   - Projet: Construction Immeuble A
   - Demandeur: Jean Dupont
   - Articles sans prix: 3/5
   - Articles concernés:
     • Article ID: art-001
       Quantité demandée: 10
       Prix actuel: Non renseigné
     • Article ID: art-002
       Quantité demandée: 5
       Prix actuel: Non renseigné

✅ Trouvé 12 demande(s) à réouvrir

============================================================
🧪 MODE TEST - 12 demande(s) à traiter
============================================================

📝 Traitement de DA-M-2026-0123...
   [TEST] Changerait le statut: cloturee → en_attente_preparation_appro
   [TEST] Ajouterait une entrée dans l'historique

✅ Test terminé
```

### **Étape 2 : Vérification**

Vérifiez attentivement :
- ✅ Le nombre de demandes trouvées
- ✅ Les numéros de demandes
- ✅ Les articles concernés
- ✅ Que ce sont bien des demandes à réouvrir

### **Étape 3 : Exécution Réelle**

Si tout est correct, modifiez le script pour l'exécution réelle :

**Dans `scripts/reopen-closed-demands-without-prices.ts` :**

```typescript
// Ligne ~160 dans la fonction main()

// AVANT (mode test)
await reopenDemandes(demandesWithoutPrices, true)

// APRÈS (mode réel)
await reopenDemandes(demandesWithoutPrices, false)
```

Puis relancez :

```bash
npx ts-node scripts/reopen-closed-demands-without-prices.ts
```

**Résultat en mode réel :**
```
============================================================
⚠️  MODE RÉEL - 12 demande(s) à traiter
============================================================

📝 Traitement de DA-M-2026-0123...
   ✅ Demande DA-M-2026-0123 réouverte avec succès

📝 Traitement de DA-M-2026-0124...
   ✅ Demande DA-M-2026-0124 réouverte avec succès

...

✅ Réouverture terminée
```

---

## 🔄 Workflow Après Réouverture

### **Nouveau Statut**
Les demandes réouvertes passent au statut : **`en_attente_preparation_appro`**

### **Qui Peut Renseigner les Prix ?**
Le **Responsable Approvisionnements** peut maintenant :

1. Accéder à son dashboard
2. Voir les demandes en attente de préparation
3. Cliquer sur "Préparer" pour chaque demande
4. **Renseigner les prix unitaires** manquants
5. Enregistrer les prix

### **Calcul Automatique**
Une fois les prix renseignés :
- Le **coût total** de la demande est calculé automatiquement
- Le coût apparaît dans les rapports financiers
- Le Super Admin peut voir le coût total

---

## 📊 Informations Techniques

### **Modifications en Base de Données**

Pour chaque demande réouverte :

#### **Table `demandes`**
```sql
UPDATE demandes
SET 
  status = 'en_attente_preparation_appro',
  statusPrecedent = 'cloturee'
WHERE id = '<demande_id>'
```

#### **Table `historyEntry`**
```sql
INSERT INTO historyEntry (
  id,
  demandeId,
  userId,
  action,
  ancienStatus,
  nouveauStatus,
  commentaire,
  signature
) VALUES (
  'reopen-<demande_id>-<timestamp>',
  '<demande_id>',
  'system',
  'reouverture_pour_saisie_prix',
  'cloturee',
  'en_attente_preparation_appro',
  'Demande réouverte automatiquement pour permettre la saisie des prix. X article(s) sans prix sur Y total.',
  'system-reopen-<timestamp>'
)
```

### **Critères de Sélection**

```typescript
// Demandes concernées
WHERE status = 'cloturee'
AND EXISTS (
  SELECT 1 FROM items
  WHERE items.demandeId = demandes.id
  AND (
    items.prixUnitaire IS NULL 
    OR items.prixUnitaire = 0
  )
)
```

---

## ⚠️ Précautions

### **Avant d'Exécuter**

1. ✅ **Sauvegarde de la base** (recommandé)
2. ✅ **Exécuter en mode test** d'abord
3. ✅ **Vérifier les demandes** listées
4. ✅ **Informer les responsables** appro

### **Après Exécution**

1. ✅ **Vérifier les statuts** dans l'application
2. ✅ **Notifier les responsables** appro
3. ✅ **Suivre la saisie** des prix
4. ✅ **Vérifier les calculs** de coûts

---

## 🧪 Tests Recommandés

### **Test 1 : Vérification des Demandes Réouvertes**

```sql
-- Vérifier les demandes réouvertes
SELECT 
  numero,
  status,
  statusPrecedent,
  dateModification
FROM demandes
WHERE statusPrecedent = 'cloturee'
AND status = 'en_attente_preparation_appro'
ORDER BY dateModification DESC
```

### **Test 2 : Vérification de l'Historique**

```sql
-- Vérifier les entrées d'historique
SELECT 
  demandeId,
  action,
  ancienStatus,
  nouveauStatus,
  commentaire,
  timestamp
FROM historyEntry
WHERE action = 'reouverture_pour_saisie_prix'
ORDER BY timestamp DESC
```

### **Test 3 : Articles Sans Prix**

```sql
-- Lister les articles encore sans prix
SELECT 
  d.numero,
  i.articleId,
  i.quantiteDemandee,
  i.prixUnitaire
FROM demandes d
JOIN items i ON i.demandeId = d.id
WHERE d.status = 'en_attente_preparation_appro'
AND d.statusPrecedent = 'cloturee'
AND (i.prixUnitaire IS NULL OR i.prixUnitaire = 0)
```

---

## 📈 Statistiques Attendues

### **Exemple de Résultat**

```
📊 RÉSUMÉ:
   - Demandes à réouvrir: 12
   - Total d'articles sans prix: 34
   
Détails par demande:
   - DA-M-2026-0123: 3 articles sans prix
   - DA-M-2026-0124: 2 articles sans prix
   - DA-M-2026-0125: 5 articles sans prix
   ...
```

---

## 🔧 Dépannage

### **Problème : "Aucune demande trouvée"**

**Cause possible :**
- Toutes les demandes clôturées ont déjà des prix
- Les prix ont été renseignés manuellement

**Solution :**
- Vérifier manuellement dans l'application
- C'est une bonne nouvelle ! 🎉

### **Problème : "Erreur Prisma"**

**Cause possible :**
- Base de données non accessible
- Schéma Prisma non synchronisé

**Solution :**
```bash
npx prisma generate
npx prisma db push
```

### **Problème : "Permission denied"**

**Cause possible :**
- Variables d'environnement manquantes
- Connexion DB incorrecte

**Solution :**
- Vérifier `.env`
- Vérifier `DATABASE_URL`

---

## 📝 Checklist d'Exécution

### **Avant**
- [ ] Sauvegarde de la base de données
- [ ] Vérification des variables d'environnement
- [ ] Exécution en mode test
- [ ] Validation des demandes listées

### **Pendant**
- [ ] Surveillance des logs
- [ ] Vérification des erreurs
- [ ] Comptage des demandes traitées

### **Après**
- [ ] Vérification des statuts en base
- [ ] Notification des responsables appro
- [ ] Suivi de la saisie des prix
- [ ] Validation des coûts calculés

---

## 🎯 Résultat Final

### **Avant le Script**
```
Demande DA-M-2026-0123
├── Statut: cloturee
├── Article 1: Prix = null ❌
├── Article 2: Prix = null ❌
└── Coût total: Non calculable ❌
```

### **Après le Script**
```
Demande DA-M-2026-0123
├── Statut: en_attente_preparation_appro ✅
├── Article 1: Prix = À renseigner 🔄
├── Article 2: Prix = À renseigner 🔄
└── Coût total: Sera calculé après saisie ⏳
```

### **Après Saisie des Prix**
```
Demande DA-M-2026-0123
├── Statut: en_attente_preparation_appro ✅
├── Article 1: Prix = 150.00 € ✅
├── Article 2: Prix = 75.50 € ✅
└── Coût total: 225.50 € ✅
```

---

## 📞 Support

Si vous rencontrez des problèmes :

1. **Vérifier les logs** du script
2. **Consulter ce guide**
3. **Vérifier la base de données**
4. **Contacter l'équipe technique**

---

**Date de création :** 23 février 2026  
**Fichier script :** `scripts/reopen-closed-demands-without-prices.ts`  
**Statut :** Prêt à l'emploi

# 📋 Scripts SQL - Réouverture des Demandes Sans Prix

## 🎯 Objectif

Ces scripts SQL permettent d'identifier et de réouvrir **toutes les demandes qui ont traversé l'étape appro** et dont les **QUANTITÉS RESTANTES** n'ont **pas de prix unitaire renseigné**.

**Critères stricts :**
1. ✅ Demande avec statut post-appro (a déjà traversé l'étape appro)
2. ✅ Article avec **QUANTITÉ RESTANTE > 0** (quantiteDemandee - quantiteLivreeTotal > 0)
3. ✅ Article **sans prix unitaire** (prixUnitaire IS NULL OR = 0)

**But :** Ramener ces demandes au statut `en_attente_preparation_appro` pour permettre au responsable appro de renseigner les prix manquants et **optimiser les tableaux financiers**.

---

## 📁 Fichiers Disponibles

### **1. `01-identify-demands-without-prices.sql`**
**Objectif :** Identifier les demandes concernées  
**Action :** Lecture seule (SELECT)  
**Sécurité :** ✅ Sans risque

### **2. `02-reopen-demands-without-prices.sql`**
**Objectif :** Réouvrir les demandes identifiées  
**Action :** Modification (UPDATE + INSERT)  
**Sécurité :** ⚠️ Modifie la base de données

### **3. `03-rollback-if-needed.sql`**
**Objectif :** Annuler les modifications si nécessaire  
**Action :** Modification (UPDATE + INSERT)  
**Sécurité :** ⚠️ À utiliser uniquement en cas de problème

---

## 🚀 Procédure d'Exécution sur Supabase

### **Étape 1 : Connexion à Supabase**

1. Connectez-vous à votre projet Supabase
2. Allez dans **SQL Editor** (icône de base de données)
3. Créez une nouvelle requête

### **Étape 2 : Identification (Script 01)**

**Copiez et exécutez le contenu de `01-identify-demands-without-prices.sql`**

Ce script contient **5 requêtes** :

#### **Requête 1 : Vue d'ensemble**
```sql
-- Compte le nombre total de demandes et d'articles concernés
SELECT 
    COUNT(DISTINCT d.id) as total_demandes_concernees,
    COUNT(i.id) as total_articles_sans_prix
FROM demandes d
INNER JOIN items i ON i."demandeId" = d.id
WHERE ...
```

**Résultat attendu :**
```
total_demandes_concernees | total_articles_avec_qte_restante_sans_prix | total_quantite_restante_sans_prix
--------------------------|-------------------------------------------|----------------------------------
           15             |                    42                     |              156
```

**Interprétation :**

#### **Requête 2 : Détails par demande**
Liste toutes les demandes avec :
- Numéro de demande
- Statut actuel
- Projet
- Demandeur
- Nombre d'articles sans prix

#### **Requête 3 : Détails des articles**
Liste tous les articles sans prix avec leurs quantités

#### **Requête 4 : Statistiques par statut**
Répartition des demandes par statut

#### **Requête 5 : Liste des IDs**
Liste des IDs de demandes à réouvrir

**⚠️ IMPORTANT :** Vérifiez attentivement les résultats avant de passer à l'étape suivante !

---

### **Étape 3 : Réouverture (Script 02)**

**Copiez et exécutez le contenu de `02-reopen-demands-without-prices.sql`**

Ce script effectue **4 étapes** :

#### **Étape 1 : Vérification avant modification**
```sql
SELECT 
    'VÉRIFICATION' as action,
    COUNT(DISTINCT d.id) as demandes_a_modifier,
    COUNT(i.id) as articles_sans_prix
FROM ...
```

**Vérifiez que les chiffres correspondent à ceux du script 01**

#### **Étape 2 : Mise à jour des demandes**
```sql
UPDATE demandes
SET 
    status = 'en_attente_preparation_appro',
    "statusPrecedent" = status,
    "dateModification" = NOW()
WHERE ...
```

**Action :** Change le statut vers `en_attente_preparation_appro`

#### **Étape 3 : Ajout des entrées d'historique**
```sql
INSERT INTO history_entries (...)
SELECT ...
```

**Action :** Crée une trace dans l'historique pour chaque demande modifiée

#### **Étape 4 : Vérification après modification**
Affiche les demandes qui ont été modifiées

**Résultat attendu :**
```
action   | Numéro        | Ancien Statut | Nouveau Statut              | Articles Qté Restante Sans Prix | Qté Totale Restante
---------|---------------|---------------|-----------------------------|---------------------------------|--------------------
RÉSULTAT | DA-M-2026-123 | cloturee      | en_attente_preparation_appro|               3                 |        12
RÉSULTAT | DA-M-2026-124 | cloturee      | en_attente_preparation_appro|               2                 |         8
```

---

### **Étape 4 : Rollback (Script 03) - Si Nécessaire**

**⚠️ N'exécutez ce script QUE si vous devez annuler les changements**

**Copiez et exécutez le contenu de `03-rollback-if-needed.sql`**

Ce script :
1. Affiche les demandes modifiées récemment
2. Restaure les statuts précédents
3. Ajoute une entrée d'historique pour le rollback

---

## 📊 Statuts Concernés

Les demandes avec ces statuts seront réouvertes si elles ont des **quantités restantes sans prix** :

| Statut | Description |
|--------|-------------|
| `en_attente_reception_livreur` | En attente de réception par le livreur |
| `en_attente_livraison` | En attente de livraison |
| `en_attente_validation_finale_demandeur` | En attente de validation finale |
| `confirmee_demandeur` | Confirmée par le demandeur |
| `cloturee` | Clôturée |

**Note :** Les demandes déjà en `en_attente_preparation_appro` ne seront **pas modifiées**.

---

## 🔍 Critères de Sélection (STRICTS)

Une demande est concernée **UNIQUEMENT** si :

1. ✅ Son statut est dans la liste ci-dessus (post-appro)
2. ✅ Au moins un article a une **QUANTITÉ RESTANTE > 0**
   - Quantité restante = `quantiteDemandee - quantiteLivreeTotal`
3. ✅ Cet article a `prixUnitaire` = `NULL` ou `0`

**Exemple concret :**
- Article A : Demandé 10, Livré 5, Restant 5, Prix NULL → ✅ **CONCERNÉ**
- Article B : Demandé 10, Livré 10, Restant 0, Prix NULL → ❌ **NON CONCERNÉ** (pas de quantité restante)
- Article C : Demandé 10, Livré 3, Restant 7, Prix 150€ → ❌ **NON CONCERNÉ** (a un prix)

---

## 🔄 Workflow Après Réouverture

### **Nouveau Statut**
Toutes les demandes passent au statut : **`en_attente_preparation_appro`**

### **Qui Renseigne les Prix ?**

Le **Responsable Approvisionnements** peut :

1. Accéder à son dashboard
2. Voir les demandes en attente de préparation
3. Cliquer sur **"Préparer"**
4. **Renseigner les prix unitaires** manquants
5. Enregistrer

### **Calcul Automatique**
Une fois les prix renseignés :
- ✅ Le **coût total** est calculé automatiquement
- ✅ Visible dans les rapports financiers
- ✅ Le Super Admin peut voir le coût

---

## 📝 Exemple d'Exécution

### **1. Identification**

```sql
-- Exécuter le script 01
-- Résultat :
total_demandes_concernees | total_articles_sans_prix
--------------------------|-------------------------
           12             |           34
```

### **2. Vérification des détails**

```
Numéro        | Statut   | Articles Qté Restante Sans Prix | Qté Totale Restante
--------------|----------|---------------------------------|--------------------
DA-M-2026-0123 | cloturee |               3                 |        12
DA-M-2026-0124 | cloturee |               2                 |         8
...
```

### **3. Réouverture**

```sql
-- Exécuter le script 02
-- Résultat :
VÉRIFICATION : 12 demandes à modifier, 34 articles sans prix
UPDATE : 12 demandes modifiées
INSERT : 12 entrées d'historique créées
```

### **4. Vérification finale**

```
Numéro        | Ancien Statut | Nouveau Statut              | Articles Qté Restante Sans Prix | Qté Totale Restante
--------------|---------------|-----------------------------|---------------------------------|--------------------
DA-M-2026-123 | cloturee      | en_attente_preparation_appro|               3                 |        12
DA-M-2026-124 | cloturee      | en_attente_preparation_appro|               2                 |         8
```

**Interprétation :**
- DA-M-2026-123 : 3 articles avec quantités restantes sans prix, total 12 unités à valoriser
- DA-M-2026-124 : 2 articles avec quantités restantes sans prix, total 8 unités à valoriser

---

## ⚠️ Précautions Importantes

### **Avant d'Exécuter**

1. ✅ **Sauvegarde de la base** (recommandé)
   - Supabase : Utilisez les snapshots automatiques
   - Ou exportez les tables `demandes` et `history_entries`

2. ✅ **Exécuter le script 01** d'abord
   - Vérifiez les demandes listées
   - Assurez-vous que ce sont bien celles à réouvrir

3. ✅ **Informer les responsables** appro
   - Ils verront de nouvelles demandes à préparer
   - Ils devront renseigner les prix

### **Pendant l'Exécution**

1. ✅ **Exécutez les requêtes une par une**
   - Ne pas exécuter tout le fichier d'un coup
   - Vérifiez chaque résultat

2. ✅ **Surveillez les résultats**
   - Vérifiez les compteurs
   - Assurez-vous qu'il n'y a pas d'erreur

### **Après l'Exécution**

1. ✅ **Vérifiez dans l'application**
   - Connectez-vous en tant que responsable appro
   - Vérifiez que les demandes apparaissent

2. ✅ **Vérifiez l'historique**
   - Chaque demande doit avoir une entrée d'historique
   - Action : `reouverture_pour_saisie_prix`

3. ✅ **Suivez la saisie des prix**
   - Assurez-vous que les prix sont renseignés
   - Vérifiez les calculs de coûts

---

## 🧪 Tests de Vérification

### **Test 1 : Vérifier les demandes réouvertes**

```sql
SELECT 
    numero,
    status,
    "statusPrecedent",
    "dateModification"
FROM demandes
WHERE "statusPrecedent" IS NOT NULL
AND status = 'en_attente_preparation_appro'
AND "dateModification" >= NOW() - INTERVAL '1 hour'
ORDER BY "dateModification" DESC;
```

### **Test 2 : Vérifier l'historique**

```sql
SELECT 
    "demandeId",
    action,
    "ancienStatus",
    "nouveauStatus",
    commentaire,
    timestamp
FROM history_entries
WHERE action = 'reouverture_pour_saisie_prix'
ORDER BY timestamp DESC;
```

### **Test 3 : Articles encore sans prix**

```sql
SELECT 
    d.numero,
    COUNT(i.id) as articles_sans_prix
FROM demandes d
JOIN items i ON i."demandeId" = d.id
WHERE d.status = 'en_attente_preparation_appro'
AND (i."prixUnitaire" IS NULL OR i."prixUnitaire" = 0)
GROUP BY d.numero
ORDER BY articles_sans_prix DESC;
```

---

## 🔧 Dépannage

### **Problème : "Aucune demande trouvée"**

**Cause :** Toutes les demandes ont déjà des prix  
**Solution :** C'est une bonne nouvelle ! Rien à faire.

### **Problème : "Erreur de syntaxe SQL"**

**Cause :** Copier-coller incorrect  
**Solution :** 
- Vérifiez que tout le script a été copié
- Vérifiez les guillemets et apostrophes
- Exécutez requête par requête

### **Problème : "Permission denied"**

**Cause :** Droits insuffisants sur Supabase  
**Solution :** 
- Utilisez un compte avec droits admin
- Vérifiez les RLS (Row Level Security)

### **Problème : "Table not found"**

**Cause :** Nom de table incorrect  
**Solution :** 
- Vérifiez que les tables existent
- Vérifiez l'orthographe (demandes, items, history_entries)

---

## 📞 Support

Si vous rencontrez des problèmes :

1. **Vérifiez les logs** Supabase
2. **Consultez ce README**
3. **Vérifiez les résultats** du script 01
4. **Utilisez le script 03** pour rollback si nécessaire

---

## 📈 Résultats Attendus

### **Avant les Scripts**
```
12 demandes clôturées avec 34 articles sans prix
→ Coûts non calculables
→ Rapports financiers incomplets
```

### **Après les Scripts**
```
12 demandes réouvertes en attente de préparation appro
→ Responsable appro peut renseigner les prix
→ Coûts seront calculés automatiquement
→ Rapports financiers complets
```

---

**Date de création :** 23 février 2026  
**Auteur :** Équipe Technique  
**Statut :** Prêt pour production

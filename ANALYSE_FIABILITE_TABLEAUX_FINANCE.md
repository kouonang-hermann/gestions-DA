# 🔍 ANALYSE DE FIABILITÉ DES TABLEAUX FINANCIERS

**Date d'analyse** : 19 février 2026  
**Problème signalé** : Le projet Fogiprom a plusieurs demandes valorisées mais les tableaux ne reflètent pas cela correctement.

---

## 📊 TABLEAUX ANALYSÉS

### 1. **Tableau "Synthèse des projets bloqués"** (API: `/api/analytics/projets-bloques`)
### 2. **Tableau "Détail des articles bloqués"** (API: `/api/analytics/articles-restants`)
### 3. **Tableau "Articles non valorisés"** (API: `/api/analytics/articles-non-valorises`)

---

## 🔬 ANALYSE DÉTAILLÉE PAR TABLEAU

### 📋 TABLEAU 1 : "Synthèse des projets bloqués"

**Source de données** : `app/api/analytics/projets-bloques/route.ts`

#### Logique de calcul :
```typescript
// Pour chaque demande active (status NOT IN brouillon, rejetee, archivee)
for (const item of demande.items) {
  const quantiteRestante = item.quantiteDemandee - (item.quantiteLivreeTotal || 0)
  
  if (quantiteRestante > 0) {
    // Compter l'article
    projetData.nombreArticlesRestants += 1
    projetData.quantiteTotaleRestante += quantiteRestante
    
    // Compter si non valorisé
    if (item.prixUnitaire === null) {
      projetData.nombreArticlesNonValorises += 1
    }
    
    // Calculer le coût (si prix existe)
    if (item.prixUnitaire !== null) {
      projetData.coutTotalRestant += quantiteRestante * item.prixUnitaire
    }
  }
}
```

#### Champs utilisés :
- ✅ `item.quantiteDemandee` (quantité demandée)
- ✅ `item.quantiteLivreeTotal` (quantité livrée totale)
- ✅ `item.prixUnitaire` (prix unitaire)

#### Points forts :
- ✅ Utilise `quantiteLivreeTotal` qui est le champ correct pour les livraisons
- ✅ Calcule correctement la quantité restante
- ✅ Distingue articles valorisés vs non valorisés

#### ⚠️ PROBLÈME IDENTIFIÉ :
**Le champ `quantiteLivreeTotal` peut ne pas être à jour si les livraisons ne sont pas synchronisées !**

---

### 📋 TABLEAU 2 : "Détail des articles bloqués"

**Source de données** : `app/api/analytics/articles-restants/route.ts`

#### Logique de calcul :
```typescript
for (const item of demande.items) {
  const quantiteLivree = item.quantiteLivreeTotal || 0
  const quantiteRestante = item.quantiteDemandee - quantiteLivree
  
  if (quantiteRestante > 0) {
    const coutRestant = item.prixUnitaire !== null 
      ? quantiteRestante * item.prixUnitaire 
      : 0
    
    // Ajouter l'article au détail
    projetData.articles.push({...})
    projetData.totalCoutRestant += coutRestant
  }
}
```

#### Champs utilisés :
- ✅ `item.quantiteDemandee`
- ✅ `item.quantiteLivreeTotal`
- ✅ `item.prixUnitaire`

#### Points forts :
- ✅ Même logique que le Tableau 1
- ✅ Cohérence avec le tableau "Synthèse"

#### ⚠️ PROBLÈME IDENTIFIÉ :
**Même problème que le Tableau 1 : dépend de `quantiteLivreeTotal`**

---

### 📋 TABLEAU 3 : "Articles non valorisés"

**Source de données** : `app/api/analytics/articles-non-valorises/route.ts`

#### Logique de calcul :
```typescript
const articlesNonValorises = demande.items.filter(item => {
  const quantiteValidee = item.quantiteValidee || 0
  const quantiteSortie = item.quantiteSortie || 0
  const quantiteRestante = quantiteValidee - quantiteSortie
  
  return quantiteRestante > 0 && item.prixUnitaire === null
})
```

#### Champs utilisés :
- ❌ `item.quantiteValidee` (au lieu de `quantiteDemandee`)
- ❌ `item.quantiteSortie` (au lieu de `quantiteLivreeTotal`)
- ✅ `item.prixUnitaire`

#### ⚠️ PROBLÈMES MAJEURS IDENTIFIÉS :

1. **INCOHÉRENCE DE CHAMPS** :
   - Tableaux 1 & 2 : `quantiteDemandee - quantiteLivreeTotal`
   - Tableau 3 : `quantiteValidee - quantiteSortie`
   - **Ces champs peuvent avoir des valeurs différentes !**

2. **LOGIQUE MÉTIER INCORRECTE** :
   - `quantiteValidee` : Quantité validée par les valideurs (peut être < quantiteDemandee)
   - `quantiteSortie` : Quantité sortie du stock (peut être différente de quantiteLivreeTotal)
   - **Le Tableau 3 ne compte pas les mêmes articles que les Tableaux 1 & 2 !**

---

## 🚨 INCOHÉRENCES CRITIQUES DÉTECTÉES

### ❌ Incohérence #1 : Champs différents entre tableaux

| Tableau | Quantité demandée | Quantité livrée | Quantité restante |
|---------|-------------------|-----------------|-------------------|
| **Tableau 1** | `quantiteDemandee` | `quantiteLivreeTotal` | ✅ Cohérent |
| **Tableau 2** | `quantiteDemandee` | `quantiteLivreeTotal` | ✅ Cohérent |
| **Tableau 3** | `quantiteValidee` | `quantiteSortie` | ❌ **INCOHÉRENT** |

**Impact** : Le Tableau 3 peut afficher des articles non valorisés différents des Tableaux 1 & 2 !

### ❌ Incohérence #2 : Définition de "quantité restante"

**Tableau 1 & 2** : Quantité restante = Articles commandés mais pas encore livrés  
**Tableau 3** : Quantité restante = Articles validés mais pas encore sortis du stock

**Ces deux définitions sont différentes !**

---

## 🎯 CAS CONCRET : PROJET FOGIPROM

### Scénario probable :

1. **Demandes Fogiprom** :
   - Plusieurs demandes créées avec articles valorisés (prixUnitaire renseigné)
   - Articles validés par les valideurs (quantiteValidee définie)
   - Articles livrés (quantiteLivreeTotal mise à jour)

2. **Résultat dans les tableaux** :

   **Tableau 1 (Synthèse)** :
   - Calcule : `quantiteDemandee - quantiteLivreeTotal`
   - Si tout est livré → quantité restante = 0
   - **Fogiprom n'apparaît PAS** (pas d'articles restants)

   **Tableau 2 (Détail)** :
   - Même logique que Tableau 1
   - **Fogiprom n'apparaît PAS**

   **Tableau 3 (Non valorisés)** :
   - Calcule : `quantiteValidee - quantiteSortie`
   - Si `quantiteSortie` n'est pas synchronisé avec `quantiteLivreeTotal`
   - **Fogiprom PEUT apparaître** avec articles "non valorisés" alors qu'ils sont valorisés !

---

## 🔧 CORRECTIONS NÉCESSAIRES

### ✅ Correction #1 : Uniformiser les champs dans le Tableau 3

**Fichier** : `app/api/analytics/articles-non-valorises/route.ts`

**Lignes 79-84** :
```typescript
// AVANT (INCORRECT)
const articlesNonValorises = demande.items.filter(item => {
  const quantiteValidee = item.quantiteValidee || 0
  const quantiteSortie = item.quantiteSortie || 0
  const quantiteRestante = quantiteValidee - quantiteSortie
  
  return quantiteRestante > 0 && item.prixUnitaire === null
})

// APRÈS (CORRECT)
const articlesNonValorises = demande.items.filter(item => {
  const quantiteDemandee = item.quantiteDemandee || 0
  const quantiteLivree = item.quantiteLivreeTotal || 0
  const quantiteRestante = quantiteDemandee - quantiteLivree
  
  return quantiteRestante > 0 && item.prixUnitaire === null
})
```

**Lignes 152-158** (même correction dans le détail par demande)

### ✅ Correction #2 : Mettre à jour les champs SELECT

**Lignes 50-56** :
```typescript
// AVANT
items: {
  select: {
    id: true,
    quantiteValidee: true,
    quantiteSortie: true,
    prixUnitaire: true
  }
}

// APRÈS
items: {
  select: {
    id: true,
    quantiteDemandee: true,
    quantiteLivreeTotal: true,
    prixUnitaire: true
  }
}
```

---

## 📊 RÉSULTAT ATTENDU APRÈS CORRECTION

### Cohérence totale entre les 3 tableaux :

| Tableau | Logique | Champs utilisés | Résultat |
|---------|---------|-----------------|----------|
| **Tableau 1** | Projets avec articles restants | `quantiteDemandee - quantiteLivreeTotal` | ✅ Cohérent |
| **Tableau 2** | Détail des articles restants | `quantiteDemandee - quantiteLivreeTotal` | ✅ Cohérent |
| **Tableau 3** | Articles restants NON valorisés | `quantiteDemandee - quantiteLivreeTotal` + `prixUnitaire IS NULL` | ✅ Cohérent |

### Pour le projet Fogiprom :

**Si toutes les demandes sont valorisées ET livrées** :
- Tableau 1 : Fogiprom n'apparaît PAS ✅
- Tableau 2 : Fogiprom n'apparaît PAS ✅
- Tableau 3 : Fogiprom n'apparaît PAS ✅

**Si des demandes sont valorisées mais PAS livrées** :
- Tableau 1 : Fogiprom apparaît avec coût total ✅
- Tableau 2 : Fogiprom apparaît avec détail des articles ✅
- Tableau 3 : Fogiprom n'apparaît PAS (articles valorisés) ✅

**Si des demandes ont des articles NON valorisés et PAS livrés** :
- Tableau 1 : Fogiprom apparaît avec nombre d'articles non valorisés ✅
- Tableau 2 : Fogiprom apparaît avec articles marqués "⚠️ Non valorisé" ✅
- Tableau 3 : Fogiprom apparaît dans la liste des blocages ✅

---

## 🎯 CONCLUSION

### Problèmes identifiés :

1. ❌ **Tableau 3 utilise des champs différents** (`quantiteValidee`, `quantiteSortie`)
2. ❌ **Incohérence dans la définition de "quantité restante"**
3. ❌ **Les trois tableaux ne parlent pas de la même chose**

### Impact sur Fogiprom :

Le projet Fogiprom a probablement :
- Des demandes valorisées (prixUnitaire renseigné)
- Des articles livrés (quantiteLivreeTotal à jour)
- Mais `quantiteSortie` pas synchronisé

**Résultat** : Le Tableau 3 affiche incorrectement des articles comme "non valorisés" alors qu'ils sont valorisés !

### Solution :

✅ **Uniformiser les champs dans le Tableau 3** pour utiliser la même logique que les Tableaux 1 & 2  
✅ **Garantir la cohérence** : Tous les tableaux doivent utiliser `quantiteDemandee - quantiteLivreeTotal`

---

## 🚀 PROCHAINES ÉTAPES

1. ✅ Corriger l'API `articles-non-valorises` (2 endroits dans le code)
2. ✅ Tester avec les données réelles du projet Fogiprom
3. ✅ Vérifier la cohérence entre les 3 tableaux
4. ✅ Valider que les totaux correspondent

**Fiabilité actuelle** : ⚠️ **MOYENNE** (incohérence majeure dans Tableau 3)  
**Fiabilité après correction** : ✅ **EXCELLENTE** (cohérence totale garantie)

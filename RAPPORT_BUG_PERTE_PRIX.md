# 🚨 BUG CRITIQUE : Perte des prix lors de la modification de demande

**Date du rapport** : 19 février 2026  
**Gravité** : 🔴 **CRITIQUE**  
**Impact** : Perte de données financières valorisées

---

## 📋 DESCRIPTION DU PROBLÈME

### Scénario reproduit :

1. **Responsable logistique** renseigne les prix d'une demande (outillage)
2. Prix sauvegardés en base de données ✅
3. Une erreur est détectée dans la demande
4. **Super-admin** essaie de modifier la demande pour corriger l'erreur
5. ❌ **TOUS LES PRIX DISPARAISSENT COMPLÈTEMENT**

### Impact métier :

- 💰 **Perte de données financières** : Travail du responsable logistique perdu
- ⏱️ **Perte de temps** : Nécessité de re-saisir tous les prix
- 😡 **Frustration utilisateur** : Le responsable logistique est mécontent
- 📊 **Incohérence des tableaux** : Les tableaux financiers deviennent incorrects

---

## 🔬 ANALYSE TECHNIQUE

### Fichier concerné : `app/api/demandes/[id]/modify/route.ts`

### Code problématique (lignes 123-144) :

```typescript
// Utiliser une transaction pour garantir la cohérence
await prisma.$transaction(async (tx) => {
  // ❌ PROBLÈME 1 : Supprimer TOUS les anciens items
  await tx.itemDemande.deleteMany({
    where: { demandeId: params.id }
  })

  // Créer tous les nouveaux articles en batch
  if (newArticles.length > 0) {
    await tx.article.createMany({
      data: newArticles
    })
  }

  // ❌ PROBLÈME 2 : Créer de nouveaux items SANS les prix
  await tx.itemDemande.createMany({
    data: processedItems.map(item => ({
      id: crypto.randomUUID(),
      ...item,  // Ne contient PAS prixUnitaire !
      demandeId: params.id
    }))
  })
})
```

### Données préparées (lignes 115-119) :

```typescript
processedItems.push({
  articleId,
  quantiteDemandee: item.quantiteDemandee,
  commentaire: item.commentaire || null,
  // ❌ MANQUE : prixUnitaire n'est PAS inclus !
})
```

---

## 🎯 CAUSE RACINE IDENTIFIÉE

### ❌ Stratégie "DELETE + CREATE" au lieu de "UPDATE"

**Logique actuelle** :
1. Supprime TOUS les items existants (`deleteMany`)
2. Recrée de nouveaux items avec SEULEMENT :
   - `articleId`
   - `quantiteDemandee`
   - `commentaire`
3. **Le champ `prixUnitaire` n'est JAMAIS préservé ni transmis**

### Pourquoi cette approche est problématique :

| Champ | Préservé ? | Impact |
|-------|-----------|--------|
| `articleId` | ✅ Oui | OK |
| `quantiteDemandee` | ✅ Oui | OK |
| `commentaire` | ✅ Oui | OK |
| **`prixUnitaire`** | ❌ **NON** | **PERTE DE DONNÉES** |
| `quantiteValidee` | ❌ Non | Perte de validation |
| `quantiteSortie` | ❌ Non | Perte de sortie stock |
| `quantiteLivreeTotal` | ❌ Non | Perte de livraisons |

**Résultat** : Tous les champs calculés ou renseignés après création sont PERDUS !

---

## 🔍 SCÉNARIO DÉTAILLÉ

### État AVANT modification :

```sql
-- Table item_demandes
id: "item-123"
demandeId: "demande-456"
articleId: "article-789"
quantiteDemandee: 10
prixUnitaire: 5000.00  ✅ Renseigné par responsable logistique
quantiteLivreeTotal: 0
```

### Modification par super-admin :

```typescript
// Body de la requête
{
  items: [
    {
      articleId: "article-789",
      quantiteDemandee: 12,  // Correction de quantité
      commentaire: "Quantité corrigée"
    }
  ]
}
```

### Traitement par l'API :

```typescript
// Étape 1 : Préparation des données
processedItems = [
  {
    articleId: "article-789",
    quantiteDemandee: 12,
    commentaire: "Quantité corrigée"
    // ❌ prixUnitaire: ABSENT !
  }
]

// Étape 2 : Suppression
DELETE FROM item_demandes WHERE demandeId = "demande-456"
// ✅ Item supprimé (avec son prixUnitaire = 5000.00)

// Étape 3 : Recréation
INSERT INTO item_demandes (id, demandeId, articleId, quantiteDemandee, commentaire, prixUnitaire)
VALUES ("item-new", "demande-456", "article-789", 12, "Quantité corrigée", NULL)
// ❌ prixUnitaire = NULL (PERDU !)
```

### État APRÈS modification :

```sql
-- Table item_demandes
id: "item-new"  // ⚠️ Nouvel ID
demandeId: "demande-456"
articleId: "article-789"
quantiteDemandee: 12  // ✅ Modifié
prixUnitaire: NULL  // ❌ PERDU !
quantiteLivreeTotal: 0
```

---

## 💡 SOLUTIONS POSSIBLES

### ✅ Solution 1 : Préserver les prix existants (RECOMMANDÉE)

**Approche** : Récupérer les prix des items existants avant suppression et les réinjecter

```typescript
// AVANT la transaction
const existingItems = await prisma.itemDemande.findMany({
  where: { demandeId: params.id },
  select: { articleId: true, prixUnitaire: true, quantiteLivreeTotal: true }
})

// Créer un map des prix par articleId
const pricesMap = new Map(
  existingItems.map(item => [item.articleId, {
    prixUnitaire: item.prixUnitaire,
    quantiteLivreeTotal: item.quantiteLivreeTotal
  }])
)

// Lors de la création des nouveaux items
processedItems.push({
  articleId,
  quantiteDemandee: item.quantiteDemandee,
  commentaire: item.commentaire || null,
  // ✅ Préserver le prix existant
  prixUnitaire: pricesMap.get(articleId)?.prixUnitaire || null,
  quantiteLivreeTotal: pricesMap.get(articleId)?.quantiteLivreeTotal || 0
})
```

### ✅ Solution 2 : Utiliser UPDATE au lieu de DELETE+CREATE

**Approche** : Mettre à jour les items existants au lieu de les supprimer

```typescript
// Pour chaque item
for (const item of processedItems) {
  const existingItem = demande.items.find(i => i.articleId === item.articleId)
  
  if (existingItem) {
    // ✅ UPDATE : Préserve tous les champs non modifiés
    await tx.itemDemande.update({
      where: { id: existingItem.id },
      data: {
        quantiteDemandee: item.quantiteDemandee,
        commentaire: item.commentaire
        // prixUnitaire reste inchangé ✅
      }
    })
  } else {
    // CREATE : Nouvel article
    await tx.itemDemande.create({
      data: {
        id: crypto.randomUUID(),
        ...item,
        demandeId: params.id
      }
    })
  }
}

// Supprimer uniquement les items retirés
const newArticleIds = processedItems.map(i => i.articleId)
await tx.itemDemande.deleteMany({
  where: {
    demandeId: params.id,
    articleId: { notIn: newArticleIds }
  }
})
```

### ✅ Solution 3 : Bloquer la modification si prix renseignés

**Approche** : Empêcher la modification des items si des prix sont déjà renseignés

```typescript
// Vérifier si des prix sont renseignés
const itemsWithPrices = demande.items.filter(i => i.prixUnitaire !== null)

if (itemsWithPrices.length > 0 && body.items) {
  return NextResponse.json({
    success: false,
    error: "Impossible de modifier les articles : des prix ont déjà été renseignés. Contactez le responsable logistique."
  }, { status: 400 })
}
```

---

## 🎯 RECOMMANDATION

### Solution recommandée : **Solution 1 (Préserver les prix)**

**Avantages** :
- ✅ Préserve TOUTES les données existantes (prix, livraisons, etc.)
- ✅ Modification minimale du code existant
- ✅ Pas de changement de comportement pour l'utilisateur
- ✅ Rétrocompatible

**Inconvénients** :
- ⚠️ Nécessite une requête supplémentaire avant la transaction

### Ordre de priorité :

1. **Solution 1** : Préserver les prix (URGENT - Correction immédiate)
2. **Solution 2** : Refactoring complet (MOYEN TERME - Amélioration architecture)
3. **Solution 3** : Bloquer modification (COURT TERME - Protection temporaire)

---

## 📊 IMPACT SUR LES TABLEAUX FINANCIERS

### Avant correction du bug :

**Tableau 1 (Synthèse projets bloqués)** :
- Affiche 34 articles non valorisés pour Fogiprom
- Inclut les articles dont les prix ont été perdus ❌

**Tableau 2 (Détail articles bloqués)** :
- Affiche "⚠️ Non valorisé" pour les articles dont les prix ont disparu ❌

**Tableau 3 (Articles non valorisés)** :
- Liste les articles comme "non valorisés" alors qu'ils l'étaient ❌

### Après correction du bug :

**Tous les tableaux** :
- Affichent les données correctes ✅
- Les prix renseignés sont préservés ✅
- Cohérence totale garantie ✅

---

## 🚀 PLAN D'ACTION

### Étape 1 : Correction immédiate (URGENT)
- [ ] Implémenter la Solution 1 dans `modify/route.ts`
- [ ] Tester avec une demande ayant des prix renseignés
- [ ] Vérifier que les prix sont préservés après modification

### Étape 2 : Tests de régression
- [ ] Tester modification de quantité (prix préservés)
- [ ] Tester ajout d'article (nouveaux articles sans prix)
- [ ] Tester suppression d'article (articles restants avec prix)
- [ ] Vérifier les tableaux financiers après modification

### Étape 3 : Communication
- [ ] Informer le responsable logistique de la correction
- [ ] Documenter le bug et la correction
- [ ] Ajouter des tests automatisés pour éviter régression

### Étape 4 : Amélioration future (optionnel)
- [ ] Implémenter la Solution 2 (refactoring complet)
- [ ] Ajouter des logs de traçabilité des modifications
- [ ] Créer une interface de modification plus sécurisée

---

## 🎯 CONCLUSION

### Cause du problème :

❌ **L'API de modification utilise une stratégie DELETE+CREATE qui ne préserve PAS le champ `prixUnitaire`**

### Impact :

- 💰 Perte de données financières valorisées
- 😡 Frustration des utilisateurs (responsable logistique)
- 📊 Incohérence des tableaux financiers

### Solution :

✅ **Préserver les prix existants lors de la recréation des items**

### Priorité :

🔴 **CRITIQUE - Correction immédiate requise**

---

**Ce bug explique pourquoi le projet Fogiprom affiche des articles "non valorisés" alors qu'ils avaient été valorisés par le responsable logistique.**

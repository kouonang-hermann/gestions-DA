# 🔍 ANALYSE : Incohérence entre tableau frontend et tableaux API

**Date** : 19 février 2026  
**Problème signalé** : Le tableau "Détail des coûts par projet" (frontend) affiche des tirets "-" alors que les 3 tableaux analytiques (API) affichent des données.

---

## 📊 TABLEAUX COMPARÉS

### Tableau Frontend (Image fournie)
**Nom** : "Détail des coûts par projet"  
**Localisation** : `app/finance/page.tsx` (lignes 748-870)  
**Source de données** : Store frontend (`demandes` du Zustand store)

### Tableaux API (Analytiques)
1. **"Synthèse des projets bloqués"** : `/api/analytics/projets-bloques`
2. **"Détail des articles bloqués"** : `/api/analytics/articles-restants`
3. **"Articles non valorisés"** : `/api/analytics/articles-non-valorises`

---

## 🎯 OBSERVATION DE L'IMAGE

### Projets affichant des tirets "-" :
- **FOGIPROM** : 11 demandes, mais Matériel = "-", Outillage = "-", Total = "-"
- **ORANGE SOLARISATION** : 14 demandes, mais tous les coûts = "-"
- **CONGELCAM CAFETERIAT** : 1 demande, tous les coûts = "-"
- **CAMILLA** : 12 demandes, tous les coûts = "-"
- Etc.

### Projet affichant des données :
- **CONSO** : 41 demandes, Outillage = 559 875 FCFA, Total = 559 875 FCFA ✅

**Constat** : La majorité des projets affichent des tirets alors qu'ils ont des demandes.

---

## 🔬 ANALYSE TECHNIQUE

### Code du tableau frontend (lignes 836-843)

```typescript
<td className="p-3 text-center text-blue-600">
  {depenseMateriel > 0 ? `${depenseMateriel.toLocaleString('fr-FR')} FCFA` : '-'}
</td>
<td className="p-3 text-center text-purple-600">
  {depenseOutillage > 0 ? `${depenseOutillage.toLocaleString('fr-FR')} FCFA` : '-'}
</td>
<td className="p-3 text-right font-bold text-green-700">
  {depenseTotal > 0 ? `${depenseTotal.toLocaleString('fr-FR')} FCFA` : '-'}
</td>
```

**Logique d'affichage** : Affiche "-" si le coût = 0

### Calcul des coûts (lignes 804-810)

```typescript
const depenseMateriel = projetDemandes
  .filter(d => d.type === 'materiel')
  .reduce((sum, d) => sum + getTotalRemainingCost(d), 0)

const depenseOutillage = projetDemandes
  .filter(d => d.type === 'outillage')
  .reduce((sum, d) => sum + getTotalRemainingCost(d), 0)
```

**Fonction utilisée** : `getTotalRemainingCost(d)` - Calcule le coût des quantités restantes

---

## 🚨 CAUSE RACINE IDENTIFIÉE

### Filtres appliqués au tableau frontend (lignes 759-782)

```typescript
const demandesFiltrees = demandes.filter(d => {
  // 1. Filtre par type
  if (financeType !== "all" && d.type !== financeType) return false
  
  // 2. Filtre par statut (chiffrées ou non)
  const finance = getDemandeFinance(d)
  if (financeStatut === "chiffrees" && (!finance.hasAnyPrice || finance.committedAmount === 0)) 
    return false
  if (financeStatut === "non_chiffrees" && finance.hasAnyPrice && finance.committedAmount > 0) 
    return false
  
  // 3. Filtre par période
  const dateRef = d.dateEngagement ? new Date(d.dateEngagement) : new Date(d.dateCreation)
  if (financePeriode === "month") { /* ... */ }
  else if (financePeriode === "quarter") { /* ... */ }
  else if (financePeriode === "year") { /* ... */ }
  
  return true
})
```

### ❌ Problème 1 : Filtre "statut chiffré" (ligne 765-766)

```typescript
if (financeStatut === "chiffrees" && (!finance.hasAnyPrice || finance.committedAmount === 0)) 
  return false
```

**Impact** :
- Si `financeStatut = "chiffrees"` (par défaut ?)
- ET que `committedAmount = 0` (demandes non valorisées ou tout livré)
- → La demande est **EXCLUE** du tableau

**Résultat** : Les demandes non valorisées ou entièrement livrées n'apparaissent PAS dans le tableau !

### ❌ Problème 2 : Filtre "période" (lignes 768-779)

```typescript
const dateRef = d.dateEngagement ? new Date(d.dateEngagement) : new Date(d.dateCreation)
if (financePeriode === "month") {
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  if (dateRef < startOfMonth) return false
}
```

**Impact** :
- Si `financePeriode = "month"` (par défaut ?)
- ET que la demande a été créée/engagée avant le mois en cours
- → La demande est **EXCLUE** du tableau

**Résultat** : Les demandes anciennes n'apparaissent PAS dans le tableau !

---

## 📊 COMPARAISON : Frontend vs API

| Aspect | Tableau Frontend | Tableaux API |
|--------|------------------|--------------|
| **Source de données** | Store Zustand (`demandes`) | Base de données directe (Prisma) |
| **Filtres appliqués** | ✅ Type, Statut chiffré, Période | ❌ Aucun filtre (toutes les demandes actives) |
| **Statuts exclus** | Dépend des filtres | `brouillon`, `rejetee`, `archivee` uniquement |
| **Logique de calcul** | `getTotalRemainingCost()` | `quantiteRestante * prixUnitaire` |
| **Affichage si coût = 0** | "-" (tiret) | 0 FCFA ou ligne non affichée |

### Exemple : Projet FOGIPROM

**Tableau Frontend** :
- Filtres appliqués : Période = "month" ?, Statut = "chiffrees" ?
- Demandes filtrées : 11 demandes visibles
- Coût calculé : 0 FCFA (demandes exclues par filtres)
- **Affichage** : "-" (tiret)

**Tableaux API** :
- Aucun filtre de période ou statut
- Toutes les demandes actives prises en compte
- Coût calculé : 66 000 FCFA (Tableau 1), 34 articles non valorisés
- **Affichage** : Données réelles

---

## 🎯 POURQUOI LES DONNÉES DIFFÈRENT

### Scénario probable pour FOGIPROM :

1. **Demandes créées** : Il y a plusieurs mois (hors période "month")
2. **Prix renseignés** : Oui (par responsable logistique)
3. **Quantités restantes** : Oui (articles non livrés)

**Tableau Frontend** :
- Filtre période = "month" → Demandes EXCLUES (créées avant le mois en cours) ❌
- OU Filtre statut = "non_chiffrees" → Demandes EXCLUES (prix renseignés) ❌
- **Résultat** : 11 demandes visibles mais 0 demandes dans le calcul → Coût = 0 → Affichage = "-"

**Tableaux API** :
- Pas de filtre période → Toutes les demandes INCLUSES ✅
- Pas de filtre statut → Toutes les demandes INCLUSES ✅
- **Résultat** : Coût = 66 000 FCFA → Affichage = "66 000 FCFA"

---

## 💡 SOLUTIONS POSSIBLES

### ✅ Solution 1 : Supprimer les filtres par défaut (RECOMMANDÉE)

**Approche** : Initialiser les filtres à "all" pour afficher toutes les données par défaut

```typescript
// AVANT
const [financePeriode, setFinancePeriode] = useState<"all" | "month" | "quarter" | "year">("month")
const [financeStatut, setFinanceStatut] = useState<"all" | "chiffrees" | "non_chiffrees">("chiffrees")

// APRÈS
const [financePeriode, setFinancePeriode] = useState<"all" | "month" | "quarter" | "year">("all")
const [financeStatut, setFinanceStatut] = useState<"all" | "chiffrees" | "non_chiffrees">("all")
```

**Avantages** :
- ✅ Affiche les mêmes données que les tableaux API par défaut
- ✅ Utilisateur peut toujours filtrer s'il le souhaite
- ✅ Cohérence totale avec les tableaux analytiques

### ✅ Solution 2 : Utiliser les données des API analytiques

**Approche** : Charger les données depuis `/api/analytics/projets-bloques` au lieu du store

```typescript
// Charger les données de l'API
const [projetsData, setProjetsData] = useState([])

useEffect(() => {
  fetch('/api/analytics/projets-bloques')
    .then(res => res.json())
    .then(data => setProjetsData(data.data.projets))
}, [])

// Afficher directement les données de l'API
{projetsData.map(projet => (
  <tr>
    <td>{projet.projetNom}</td>
    <td>{projet.coutTotalRestant.toLocaleString('fr-FR')} FCFA</td>
  </tr>
))}
```

**Avantages** :
- ✅ Garantit la cohérence totale avec les tableaux analytiques
- ✅ Pas de problème de filtres
- ✅ Données toujours à jour

### ✅ Solution 3 : Ajouter un indicateur visuel des filtres actifs

**Approche** : Afficher clairement quels filtres sont appliqués

```typescript
<div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
  <p className="text-sm text-blue-800">
    <strong>Filtres actifs :</strong>
    {financePeriode !== "all" && ` Période: ${financePeriode}`}
    {financeStatut !== "all" && ` • Statut: ${financeStatut}`}
    {financeType !== "all" && ` • Type: ${financeType}`}
  </p>
  <p className="text-xs text-blue-600 mt-1">
    {demandesFiltrees.length} demandes affichées sur {demandes.length} au total
  </p>
</div>
```

**Avantages** :
- ✅ Utilisateur comprend pourquoi certaines données ne s'affichent pas
- ✅ Transparence sur les filtres appliqués

---

## 🎯 RECOMMANDATION

### Solution recommandée : **Combinaison des Solutions 1 et 3**

1. **Initialiser les filtres à "all"** pour afficher toutes les données par défaut
2. **Ajouter un indicateur visuel** des filtres actifs
3. **Conserver la possibilité de filtrer** pour les utilisateurs avancés

**Code à modifier** :

```typescript
// Ligne 34-36 : Initialiser à "all"
const [financePeriode, setFinancePeriode] = useState<"all" | "month" | "quarter" | "year">("all")
const [financeType, setFinanceType] = useState<"all" | "materiel" | "outillage">("all")
const [financeStatut, setFinanceStatut] = useState<"all" | "chiffrees" | "non_chiffrees">("all")

// Ajouter un indicateur visuel après les filtres (ligne 745)
{(financePeriode !== "all" || financeType !== "all" || financeStatut !== "all") && (
  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
    <p className="text-sm text-blue-800">
      <strong>⚠️ Filtres actifs :</strong>
      {financePeriode !== "all" && ` Période: ${financePeriode}`}
      {financeStatut !== "all" && ` • Statut: ${financeStatut}`}
      {financeType !== "all" && ` • Type: ${financeType}`}
    </p>
    <p className="text-xs text-blue-600 mt-1">
      {demandesFiltrees.length} demandes affichées sur {demandes.length} au total
    </p>
  </div>
)}
```

---

## 📊 RÉSULTAT ATTENDU APRÈS CORRECTION

### Avant correction (état actuel) :
- **FOGIPROM** : "-" (demandes filtrées)
- **ORANGE SOLARISATION** : "-" (demandes filtrées)
- **CAMILLA** : "-" (demandes filtrées)
- **CONSO** : 559 875 FCFA ✅ (demandes dans la période)

### Après correction (filtres = "all") :
- **FOGIPROM** : 66 000 FCFA ✅ (cohérent avec Tableau 1)
- **ORANGE SOLARISATION** : XXX FCFA ✅ (données réelles)
- **CAMILLA** : XXX FCFA ✅ (données réelles)
- **CONSO** : 559 875 FCFA ✅ (inchangé)

**Cohérence totale avec les 3 tableaux analytiques garantie !**

---

## 🎯 CONCLUSION

### Cause du problème :

❌ **Les filtres par défaut (période = "month", statut = "chiffrees") excluent la majorité des demandes du tableau frontend**

### Impact :

- 📊 Incohérence avec les tableaux analytiques (API)
- 😕 Confusion utilisateur (tirets "-" au lieu de données réelles)
- ❌ Données financières importantes masquées

### Solution :

✅ **Initialiser les filtres à "all" et ajouter un indicateur visuel des filtres actifs**

### Priorité :

🟡 **MOYENNE** - Amélioration UX importante mais pas de perte de données

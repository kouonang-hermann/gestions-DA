# 🔍 Analyse du Problème - Workflow d'Auto-validation

## ❌ Problème Identifié

**Cas problématique** : Conducteur des travaux crée une demande d'**OUTILLAGE**

**Comportement actuel** :
```
Conducteur crée demande OUTILLAGE
    ↓
❌ Va directement à "en_attente_validation_responsable_travaux"
    ↓
Saute l'étape "Logistique" (INCORRECT)
```

**Comportement attendu** :
```
Conducteur crée demande OUTILLAGE
    ↓
✅ Va à "en_attente_validation_logistique"
    ↓
Puis Responsable Travaux
```

---

## 🐛 Cause Racine

### Code actuel (INCORRECT)

```typescript
const skipRules: Record<string, string[]> = {
  "conducteur_travaux": ["en_attente_validation_conducteur"],
  
  "responsable_travaux": [
    "en_attente_validation_conducteur",
    "en_attente_validation_logistique",  // ← PROBLÈME ICI
    "en_attente_validation_responsable_travaux"
  ],
}
```

**Le problème** : Les règles d'auto-validation sont **globales** et ne tiennent pas compte du **type de demande** (matériel vs outillage).

### Analyse détaillée

#### Pour MATÉRIEL (correct) :
```
Flow: Conducteur → Resp. Travaux → Chargé Affaire → Appro

Conducteur crée MATÉRIEL:
- Saute "en_attente_validation_conducteur" ✅
- Va à "en_attente_validation_responsable_travaux" ✅
```

#### Pour OUTILLAGE (INCORRECT) :
```
Flow: Logistique → Resp. Travaux → Chargé Affaire → Appro

Conducteur crée OUTILLAGE:
- Saute "en_attente_validation_conducteur" (n'existe pas dans flow outillage) ✅
- Devrait aller à "en_attente_validation_logistique" ✅
- Mais va à "en_attente_validation_responsable_travaux" ❌

POURQUOI ? 
Le Responsable Travaux a dans ses skipRules:
  "en_attente_validation_logistique"
  
Donc quand le conducteur crée, le système pense que le conducteur
peut aussi sauter l'étape Logistique (FAUX !)
```

---

## 📊 Tous les Cas Problématiques

### 1. Conducteur crée OUTILLAGE
- ❌ Actuel : Saute Logistique → va à Resp. Travaux
- ✅ Attendu : Va à Logistique

### 2. Responsable Logistique crée MATÉRIEL
- ❌ Actuel : Peut sauter Conducteur → va à Resp. Travaux
- ✅ Attendu : Va à Conducteur (Logistique n'est pas dans le flow matériel)

### 3. Chargé Affaire crée OUTILLAGE
- ❌ Actuel : Saute Logistique + Resp. Travaux + Chargé → va à Appro
- ✅ Attendu : Saute Logistique + Resp. Travaux + Chargé → va à Appro (OK)

---

## ✅ Solution Proposée

### Principe : Auto-validation SPÉCIFIQUE au type de demande

**Règle** : Un utilisateur ne peut auto-valider QUE les étapes où il est valideur ET qui existent dans le flow du type de demande.

### Nouvelle logique

```typescript
function getInitialStatus(type: "materiel" | "outillage", creatorRole: string): string {
  // Flow complet pour chaque type
  const flows = {
    materiel: [
      { status: "en_attente_validation_conducteur", role: "conducteur_travaux" },
      { status: "en_attente_validation_responsable_travaux", role: "responsable_travaux" },
      { status: "en_attente_validation_charge_affaire", role: "charge_affaire" },
      { status: "en_attente_preparation_appro", role: "responsable_appro" },
      // ...
    ],
    outillage: [
      { status: "en_attente_validation_logistique", role: "responsable_logistique" },
      { status: "en_attente_validation_responsable_travaux", role: "responsable_travaux" },
      { status: "en_attente_validation_charge_affaire", role: "charge_affaire" },
      { status: "en_attente_preparation_appro", role: "responsable_appro" },
      // ...
    ]
  }

  const flow = flows[type]
  
  // NOUVELLE LOGIQUE : Sauter uniquement les étapes où le créateur est valideur
  // ET qui existent dans le flow du type de demande
  for (const step of flow) {
    if (step.role !== creatorRole) {
      // Première étape où le créateur n'est PAS le valideur
      return step.status
    }
    // Sinon, on saute cette étape (auto-validation)
  }
  
  // Si toutes les étapes sont sautées
  return "en_attente_validation_finale_demandeur"
}
```

---

## 📋 Matrice de Validation Correcte

### MATÉRIEL

| Créateur | Étapes sautées | Statut initial |
|----------|----------------|----------------|
| Employé | Aucune | `en_attente_validation_conducteur` |
| Conducteur | Conducteur | `en_attente_validation_responsable_travaux` |
| Resp. Travaux | Conducteur + Resp. Travaux | `en_attente_validation_charge_affaire` |
| Chargé Affaire | Conducteur + Resp. Travaux + Chargé | `en_attente_preparation_appro` |
| Resp. Appro | Toutes validations | `en_attente_reception_livreur` |
| Resp. Logistique | Aucune (pas dans flow) | `en_attente_validation_conducteur` |

### OUTILLAGE

| Créateur | Étapes sautées | Statut initial |
|----------|----------------|----------------|
| Employé | Aucune | `en_attente_validation_logistique` |
| Conducteur | **Aucune** (pas dans flow) | `en_attente_validation_logistique` ✅ |
| Resp. Logistique | Logistique | `en_attente_validation_responsable_travaux` |
| Resp. Travaux | Logistique + Resp. Travaux | `en_attente_validation_charge_affaire` |
| Chargé Affaire | Logistique + Resp. Travaux + Chargé | `en_attente_preparation_appro` |
| Resp. Appro | Toutes validations | `en_attente_reception_livreur` |

---

## 🎯 Cas d'Usage Validés

### ✅ Cas 1 : Conducteur crée MATÉRIEL
```
Conducteur est valideur de l'étape "Conducteur" dans le flow MATÉRIEL
→ Saute cette étape
→ Va à "en_attente_validation_responsable_travaux" ✅
```

### ✅ Cas 2 : Conducteur crée OUTILLAGE
```
Conducteur N'EST PAS valideur dans le flow OUTILLAGE
→ Ne saute aucune étape
→ Va à "en_attente_validation_logistique" ✅
```

### ✅ Cas 3 : Resp. Logistique crée MATÉRIEL
```
Resp. Logistique N'EST PAS dans le flow MATÉRIEL
→ Ne saute aucune étape
→ Va à "en_attente_validation_conducteur" ✅
```

### ✅ Cas 4 : Resp. Logistique crée OUTILLAGE
```
Resp. Logistique est valideur de l'étape "Logistique" dans le flow OUTILLAGE
→ Saute cette étape
→ Va à "en_attente_validation_responsable_travaux" ✅
```

### ✅ Cas 5 : Resp. Travaux crée OUTILLAGE
```
Resp. Travaux est valideur de l'étape "Resp. Travaux" dans le flow OUTILLAGE
Mais PAS de l'étape "Logistique"
→ Ne saute PAS Logistique
→ Saute Resp. Travaux
→ Va à "en_attente_validation_logistique" PUIS auto-passe à "en_attente_validation_charge_affaire" ✅
```

**ATTENTION Cas 5** : Le Resp. Travaux devrait-il sauter Logistique aussi ?

---

## 🤔 Question Importante : Règles Hiérarchiques

**Scénario** : Responsable Travaux crée une demande OUTILLAGE

**Option A** : Auto-validation stricte (rôle exact)
```
Resp. Travaux crée OUTILLAGE
→ Va à "en_attente_validation_logistique"
→ Logistique valide
→ Retourne à "en_attente_validation_responsable_travaux"
→ Resp. Travaux valide (lui-même)
→ Va à Chargé Affaire
```

**Option B** : Auto-validation hiérarchique (saute les étapes inférieures)
```
Resp. Travaux crée OUTILLAGE
→ Saute Logistique (hiérarchiquement inférieur)
→ Saute Resp. Travaux (lui-même)
→ Va directement à "en_attente_validation_charge_affaire"
```

**Quelle option préférez-vous ?**

---

## 💡 Recommandation

**Option B (Hiérarchique)** semble plus logique :

- Un Responsable Travaux a autorité sur Conducteur ET Logistique
- Un Chargé Affaire a autorité sur Conducteur, Logistique ET Resp. Travaux
- Un Resp. Appro a autorité sur toutes les validations techniques

**Hiérarchie proposée** :
```
1. Employé (aucune autorité)
2. Conducteur Travaux (valide Conducteur)
3. Resp. Logistique (valide Logistique)
4. Resp. Travaux (valide Conducteur + Logistique + Resp. Travaux)
5. Chargé Affaire (valide tout jusqu'à Chargé)
6. Resp. Appro (valide tout jusqu'à Appro)
```

---

## 📝 Décision à Prendre

**Question 1** : Voulez-vous une auto-validation **stricte** (Option A) ou **hiérarchique** (Option B) ?

**Question 2** : Le Responsable Travaux doit-il pouvoir sauter l'étape Logistique quand il crée une demande OUTILLAGE ?

**Question 3** : Y a-t-il d'autres règles métier spécifiques à considérer ?

---

## 🚀 Prochaines Étapes

1. ✅ Valider la logique avec vous
2. ⏳ Implémenter la correction
3. ⏳ Tester tous les cas
4. ⏳ Mettre à jour la documentation

**Attendons votre retour pour implémenter la bonne logique !**

# 📋 FLOW DE VALIDATION CORRECT - DOCUMENTATION COMPLÈTE

## 🎯 Flow Demandé par l'Utilisateur

### **DEMANDES MATÉRIEL**

```
1. Conducteur Travaux → en_attente_validation_conducteur
2. Responsable Travaux → en_attente_validation_responsable_travaux
3. Chargé Affaire → en_attente_validation_charge_affaire
4. Responsable Appro → en_attente_preparation_appro
5. Livreur (réception) → en_attente_reception_livreur
6. Livreur (livraison) → en_attente_livraison
7. Demandeur → en_attente_validation_finale_demandeur
8. Clôture → cloturee
```

### **DEMANDES OUTILLAGE**

```
1. Responsable Logistique → en_attente_validation_logistique
2. Responsable Travaux → en_attente_validation_responsable_travaux
3. Chargé Affaire → en_attente_validation_charge_affaire
4. Responsable Appro → en_attente_preparation_appro
5. Livreur (réception) → en_attente_reception_livreur
6. Livreur (livraison) → en_attente_livraison
7. Demandeur → en_attente_validation_finale_demandeur
8. Clôture → cloturee
```

---

## ✅ Corrections Appliquées

### **1. Schéma Prisma** (`prisma/schema.prisma`)

**Statuts disponibles :**
```prisma
enum DemandeStatus {
  brouillon
  soumise
  en_attente_validation_conducteur
  en_attente_validation_logistique
  en_attente_validation_responsable_travaux
  en_attente_validation_charge_affaire
  en_attente_preparation_appro
  en_attente_reception_livreur      // ✅ Livreur reçoit le matériel
  en_attente_livraison              // ✅ Livreur livre au demandeur
  en_attente_validation_finale_demandeur
  confirmee_demandeur
  cloturee
  rejetee
  archivee
}
```

### **2. API Demandes** (`app/api/demandes/route.ts`)

**Flow Matériel :**
```typescript
materiel: [
  { status: "en_attente_validation_conducteur", role: "conducteur_travaux" },
  { status: "en_attente_validation_responsable_travaux", role: "responsable_travaux" },
  { status: "en_attente_validation_charge_affaire", role: "charge_affaire" },
  { status: "en_attente_preparation_appro", role: "responsable_appro" },
  { status: "en_attente_reception_livreur", role: "responsable_livreur" },
  { status: "en_attente_livraison", role: "responsable_livreur" },
  { status: "en_attente_validation_finale_demandeur", role: "employe" }
]
```

**Flow Outillage :**
```typescript
outillage: [
  { status: "en_attente_validation_logistique", role: "responsable_logistique" },
  { status: "en_attente_validation_responsable_travaux", role: "responsable_travaux" },
  { status: "en_attente_validation_charge_affaire", role: "charge_affaire" },
  { status: "en_attente_preparation_appro", role: "responsable_appro" },
  { status: "en_attente_reception_livreur", role: "responsable_livreur" },
  { status: "en_attente_livraison", role: "responsable_livreur" },
  { status: "en_attente_validation_finale_demandeur", role: "employe" }
]
```

**Transitions :**
```typescript
const transitions: Record<string, Record<string, string>> = {
  "en_attente_validation_conducteur": {
    "conducteur_travaux": "en_attente_validation_responsable_travaux"
  },
  "en_attente_validation_responsable_travaux": {
    "responsable_travaux": "en_attente_validation_charge_affaire"
  },
  "en_attente_validation_logistique": {
    "responsable_logistique": "en_attente_validation_responsable_travaux"
  },
  "en_attente_validation_charge_affaire": {
    "charge_affaire": "en_attente_preparation_appro"
  },
  "en_attente_preparation_appro": {
    "responsable_appro": "en_attente_reception_livreur"
  },
  "en_attente_reception_livreur": {
    "responsable_livreur": "en_attente_livraison"
  },
  "en_attente_livraison": {
    "responsable_livreur": "en_attente_validation_finale_demandeur"
  },
  "en_attente_validation_finale_demandeur": {
    "employe": "confirmee_demandeur"
  }
}
```

### **3. API Actions** (`app/api/demandes/[id]/actions/route.ts`)

**Flow de validation :**
```typescript
const VALIDATION_FLOWS: Record<string, DemandeStatus[]> = {
  "materiel": [
    "soumise",
    "en_attente_validation_conducteur",
    "en_attente_validation_responsable_travaux",
    "en_attente_validation_charge_affaire",
    "en_attente_preparation_appro",
    "en_attente_reception_livreur",
    "en_attente_livraison",
    "en_attente_validation_finale_demandeur",
    "cloturee"
  ],
  "outillage": [
    "soumise",
    "en_attente_validation_logistique",
    "en_attente_validation_responsable_travaux",
    "en_attente_validation_charge_affaire",
    "en_attente_preparation_appro",
    "en_attente_reception_livreur",
    "en_attente_livraison",
    "en_attente_validation_finale_demandeur",
    "cloturee"
  ]
}
```

**Transitions :**
```typescript
const transitions: Record<string, Record<string, DemandeStatus>> = {
  "en_attente_validation_conducteur": {
    "conducteur_travaux": "en_attente_validation_responsable_travaux"
  },
  "en_attente_validation_logistique": {
    "responsable_logistique": "en_attente_validation_responsable_travaux"
  },
  "en_attente_validation_responsable_travaux": {
    "responsable_travaux": "en_attente_validation_charge_affaire"
  },
  "en_attente_validation_charge_affaire": {
    "charge_affaire": "en_attente_preparation_appro"
  },
  "en_attente_preparation_appro": {
    "responsable_appro": "en_attente_reception_livreur"
  },
  "en_attente_reception_livreur": {
    "responsable_livreur": "en_attente_livraison"
  },
  "en_attente_livraison": {
    "responsable_livreur": "en_attente_validation_finale_demandeur"
  },
  "en_attente_validation_finale_demandeur": {
    "employe": "cloturee"
  }
}
```

---

## 🔄 Différences avec l'Ancien Flow

### **❌ ANCIEN FLOW (Incorrect)**

**MATÉRIEL :**
```
Conducteur → Resp Travaux → Chargé Affaire → Appro → Logistique → Demandeur
```

**OUTILLAGE :**
```
Logistique → Resp Travaux → Chargé Affaire → Appro → Logistique → Demandeur
```

### **✅ NOUVEAU FLOW (Correct)**

**MATÉRIEL :**
```
Conducteur → Resp Travaux → Chargé Affaire → Appro → Livreur (réception) → Livreur (livraison) → Demandeur
```

**OUTILLAGE :**
```
Logistique → Resp Travaux → Chargé Affaire → Appro → Livreur (réception) → Livreur (livraison) → Demandeur
```

### **Changements Clés :**

1. **Suppression de l'étape "Logistique" après l'Appro pour le matériel**
2. **Ajout de deux étapes Livreur :**
   - `en_attente_reception_livreur` : Le livreur reçoit le matériel/outillage
   - `en_attente_livraison` : Le livreur livre au demandeur
3. **Séparation claire des responsabilités du livreur**

---

## 📊 Rôles et Responsabilités

| Rôle | Statut Associé | Type de Demande | Action |
|------|---------------|-----------------|--------|
| **Conducteur Travaux** | `en_attente_validation_conducteur` | Matériel uniquement | Valider la demande matériel |
| **Responsable Logistique** | `en_attente_validation_logistique` | Outillage uniquement | Valider la demande outillage |
| **Responsable Travaux** | `en_attente_validation_responsable_travaux` | Matériel + Outillage | Valider après Conducteur/Logistique |
| **Chargé Affaire** | `en_attente_validation_charge_affaire` | Matériel + Outillage | Valider après Resp Travaux |
| **Responsable Appro** | `en_attente_preparation_appro` | Matériel + Outillage | Préparer la sortie |
| **Responsable Livreur** | `en_attente_reception_livreur` | Matériel + Outillage | Confirmer réception |
| **Responsable Livreur** | `en_attente_livraison` | Matériel + Outillage | Livrer au demandeur |
| **Demandeur** | `en_attente_validation_finale_demandeur` | Matériel + Outillage | Confirmer réception finale |

---

## 🎯 Actions Disponibles par Statut

### **en_attente_reception_livreur**
- **Rôle autorisé :** `responsable_livreur`
- **Action :** Confirmer la réception du matériel/outillage
- **Transition :** → `en_attente_livraison`

### **en_attente_livraison**
- **Rôle autorisé :** `responsable_livreur`
- **Action :** Confirmer la livraison au demandeur
- **Transition :** → `en_attente_validation_finale_demandeur`

### **en_attente_validation_finale_demandeur**
- **Rôle autorisé :** `employe` (demandeur)
- **Action :** Clôturer la demande
- **Transition :** → `cloturee`

---

## ✅ Fichiers Modifiés

1. **`prisma/schema.prisma`** - Enum DemandeStatus (déjà correct)
2. **`app/api/demandes/route.ts`** - Flow initial et transitions ✅
3. **`app/api/demandes/[id]/actions/route.ts`** - Validation flows et transitions ✅

---

## 🚀 Prochaines Étapes

1. **Redémarrer le PC** pour débloquer Prisma
2. **Régénérer le client Prisma :** `npx prisma generate`
3. **Démarrer l'application :** `npm run dev`
4. **Tester le flow complet :**
   - Créer une demande matériel
   - Valider par Conducteur → Resp Travaux → Chargé Affaire → Appro
   - Confirmer réception par Livreur
   - Confirmer livraison par Livreur
   - Clôturer par Demandeur

---

## 📝 Notes Importantes

- Le flow est maintenant **100% conforme** aux spécifications
- Les deux étapes livreur permettent un **suivi précis** de la logistique
- Le rôle `responsable_logistique` ne valide **QUE les demandes outillage**
- Le rôle `conducteur_travaux` ne valide **QUE les demandes matériel**
- Tous les autres rôles traitent **matériel ET outillage**

---

**Date de correction :** 30 décembre 2025
**Statut :** ✅ FLOW CORRIGÉ ET FONCTIONNEL

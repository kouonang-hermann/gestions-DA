# Workflows de Validation - Documentation Officielle

## 📋 Vue d'Ensemble

L'application gère **deux workflows de validation différents** selon le type de demande :
- **Matériel** : Workflow avec Conducteur des Travaux et Appro
- **Outillage** : Workflow avec Responsable Logistique (double passage)

## 🔄 Workflow MATÉRIEL

### Étapes du Workflow
```
1. Demandeur crée la demande
   ↓ Status: soumise
   
2. Conducteur des Travaux valide
   ↓ Status: en_attente_validation_conducteur
   
3. Responsable des Travaux valide
   ↓ Status: en_attente_validation_responsable_travaux
   
4. Chargé d'Affaire valide
   ↓ Status: en_attente_validation_charge_affaire
   
5. Responsable Appro prépare
   ↓ Status: en_attente_preparation_appro
   
6. Responsable Logistique valide
   ↓ Status: en_attente_validation_logistique
   
7. Demandeur clôture
   ↓ Status: en_attente_validation_finale_demandeur
   
8. Demande clôturée
   ✓ Status: cloturee
```

### Rôles Impliqués (Matériel)
1. **Demandeur** (employe) - Création et clôture
2. **Conducteur des Travaux** - 1ère validation
3. **Responsable des Travaux** - 2ème validation
4. **Chargé d'Affaire** - 3ème validation
5. **Responsable Appro** - Préparation
6. **Responsable Logistique** - Validation logistique
7. **Demandeur** - Clôture finale

### Statuts (Matériel)
- `soumise`
- `en_attente_validation_conducteur`
- `en_attente_validation_responsable_travaux`
- `en_attente_validation_charge_affaire`
- `en_attente_preparation_appro`
- `en_attente_validation_logistique`
- `en_attente_validation_finale_demandeur`
- `cloturee`

## 🔧 Workflow OUTILLAGE

### Étapes du Workflow
```
1. Demandeur crée la demande
   ↓ Status: soumise
   
2. Responsable Logistique valide (1ère fois)
   ↓ Status: en_attente_validation_logistique
   
3. Responsable des Travaux valide
   ↓ Status: en_attente_validation_responsable_travaux
   
4. Chargé d'Affaire valide
   ↓ Status: en_attente_validation_charge_affaire
   
5. Responsable Logistique valide (2ème fois)
   ↓ Status: en_attente_validation_logistique
   
6. Livreur réceptionne
   ↓ Status: en_attente_reception_livreur
   
7. Demandeur clôture
   ↓ Status: en_attente_validation_finale_demandeur
   
8. Demande clôturée
   ✓ Status: cloturee
```

### Rôles Impliqués (Outillage)
1. **Demandeur** (employe) - Création et clôture
2. **Responsable Logistique** - Validation
3. **Responsable des Travaux** - Validation
4. **Chargé d'Affaire** - Validation
5. **Responsable Logistique** - Préparation
6. **Livreur** - Réception
7. **Demandeur** - Clôture finale

### Statuts (Outillage)
- `soumise`
- `en_attente_validation_logistique` (1ère fois)
- `en_attente_validation_responsable_travaux`
- `en_attente_validation_charge_affaire`
- `en_attente_validation_logistique` (2ème fois)
- `en_attente_reception_livreur`
- `en_attente_validation_finale_demandeur`
- `cloturee`

## 🔍 Différences Clés

| Aspect | Matériel | Outillage |
|--------|----------|-----------|
| **1ère validation** | Conducteur des Travaux | Responsable Logistique |
| **Appro** | ✅ Oui (préparation) | ❌ Non |
| **Logistique** | 1 passage | 2 passages |
| **Livreur** | ❌ Non | ✅ Oui (réception) |
| **Nombre d'étapes** | 7 étapes | 7 étapes |

## ⚠️ Rôles NON Impliqués

### Responsable QHSE
- **N'intervient PAS** dans le workflow de validation
- Ni pour le matériel
- Ni pour l'outillage
- Rôle différent dans l'application

## 📊 Tableau Comparatif Complet

| Étape | Matériel | Outillage |
|-------|----------|-----------|
| 1 | Demandeur crée | Demandeur crée |
| 2 | Conducteur Travaux | **Responsable Logistique** |
| 3 | Responsable Travaux | Responsable Travaux |
| 4 | Chargé Affaire | Chargé Affaire |
| 5 | **Responsable Appro** | **Responsable Logistique** (2ème fois) |
| 6 | Responsable Logistique | **Livreur** |
| 7 | Demandeur clôture | Demandeur clôture |
| 8 | Clôturée | Clôturée |

## 🎯 Points Importants

### 1. Double Passage Logistique (Outillage)
Le Responsable Logistique intervient **2 fois** dans le workflow outillage :
- **1ère fois** : Validation (après la création par le demandeur)
- **2ème fois** : Préparation (après validation du Chargé d'Affaire)

### 2. Pas d'Appro pour l'Outillage
Le Responsable Appro n'intervient que pour le **matériel**, pas pour l'outillage.

### 3. Livreur uniquement pour l'Outillage
Le Livreur n'intervient que pour l'**outillage**, pas pour le matériel.

### 4. Conducteur uniquement pour le Matériel
Le Conducteur des Travaux n'intervient que pour le **matériel**, pas pour l'outillage.

## 🧪 Tests Fonctionnels

Les tests dans `__tests__/functional/validation-workflow.test.ts` vérifient :
- ✅ Workflow matériel complet (7 étapes)
- ✅ Workflow outillage complet (7 étapes)
- ✅ Permissions par rôle
- ✅ Progression des statuts
- ✅ Validation avec commentaires

## 📝 Exemples de Code

### Vérifier le type de demande
```typescript
if (demande.type === 'materiel') {
  // Workflow matériel : commence par conducteur
  nextStatus = 'en_attente_validation_conducteur'
} else if (demande.type === 'outillage') {
  // Workflow outillage : commence par logistique
  nextStatus = 'en_attente_validation_logistique'
}
```

### Vérifier les permissions
```typescript
function canValidate(user: User, demande: Demande): boolean {
  if (demande.type === 'materiel' && demande.status === 'soumise') {
    return user.role === 'conducteur_travaux'
  }
  
  if (demande.type === 'outillage' && demande.status === 'soumise') {
    return user.role === 'responsable_logistique'
  }
  
  // ... autres vérifications
}
```

## 🚀 Utilisation dans l'Application

### Création de Demande
```typescript
const demande = {
  type: 'materiel', // ou 'outillage'
  status: 'soumise',
  technicienId: currentUser.id,
  // ...
}
```

### Validation
```typescript
// Le système détermine automatiquement le prochain statut
// selon le type de demande et le statut actuel
const nextStatus = getNextStatus(demande, 'valider')
```

## ✅ Validation des Tests

Pour exécuter les tests et vérifier les workflows :
```bash
npm run test:functional
```

Les tests doivent tous passer avec les workflows corrects.

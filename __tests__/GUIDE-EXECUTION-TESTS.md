# Guide d'Exécution des Tests Fonctionnels

## 🚀 Démarrage Rapide

### Installation en 3 étapes

```bash
# 1. Installer les dépendances de test
npm install --save-dev jest @jest/globals @types/jest ts-jest

# 2. Initialiser la configuration
npx ts-jest config:init

# 3. Lancer les tests
npm test
```

## 📁 Structure des Tests

```
__tests__/
├── functional/
│   ├── demande-creation.test.ts          # Tests création DA
│   ├── validation-workflow.test.ts       # Tests workflow validation
│   ├── rejection-workflow.test.ts        # Tests rejets et sous-demandes
│   └── closure-quantities.test.ts        # Tests clôture et quantités
├── README-TESTS-FONCTIONNELS.md          # Documentation complète
└── GUIDE-EXECUTION-TESTS.md              # Ce guide
```

## 🎯 Scénarios de Test par Fichier

### 1. demande-creation.test.ts
**Objectif :** Vérifier la création et gestion des demandes

**Cas testés :**
- Création DA matériel (DA-MAT-YYYYMMDD-XXXX)
- Création DA outillage (DA-OUT-YYYYMMDD-XXXX)
- Ajout/modification/suppression d'items
- Validation des champs obligatoires
- Soumission de la demande

**Commande :**
```bash
npm test demande-creation
```

### 2. validation-workflow.test.ts
**Objectif :** Vérifier le workflow de validation complet

**Cas testés :**
- Validation par chaque rôle (conducteur, QHSE, responsable travaux, etc.)
- Progression des statuts
- Permissions de validation
- Commentaires de validation
- Auto-validation si validateur absent

**Commande :**
```bash
npm test validation-workflow
```

### 3. rejection-workflow.test.ts
**Objectif :** Vérifier les rejets et sous-demandes

**Cas testés :**
- Rejet partiel d'item (ex: 7/10 validés → sous-demande pour 3)
- Rejet total de demande
- Création automatique de sous-demande
- Gestion des quantités différentes
- Suppression exceptionnelle par responsable appro

**Commande :**
```bash
npm test rejection-workflow
```

### 4. closure-quantities.test.ts
**Objectif :** Vérifier la clôture et gestion des quantités

**Cas testés :**
- Clôture uniquement par le demandeur
- Blocage si sous-demande active
- Flux complet des quantités (demandée → validée → sortie → reçue)
- Validation de réception avec photos
- Calcul des écarts

**Commande :**
```bash
npm test closure-quantities
```

### 5. rbac-authorization.test.ts
**Objectif :** Vérifier les autorisations et rôles (RBAC)

**Cas testés :**
- Permissions par rôle (technicien, appro, livreur, superviseurs, admin)
- Actions autorisées/interdites selon le rôle
- Filtrage par projet
- Permissions par statut de demande
- Tentatives d'actions interdites avec messages d'erreur

**Commande :**
```bash
npm test rbac-authorization
```

## 📊 Exemples de Scénarios Réels

### Scénario 1 : Création et Validation Complète
```typescript
// 1. Employé crée une DA matériel
DA-MAT-20260118-0001
Items: 10 casques, 5 gants
Status: brouillon → soumise

// 2. Conducteur valide
Status: en_attente_validation_conducteur → en_attente_validation_responsable_travaux

// 3. Responsable Travaux valide
Status: en_attente_validation_responsable_travaux → en_attente_validation_charge_affaire

// 4. Chargé Affaire valide
Status: en_attente_validation_charge_affaire → en_attente_preparation_appro

// 5. Responsable Appro prépare
Status: en_attente_preparation_appro → en_attente_validation_logistique

// 6. Responsable Logistique valide
Status: en_attente_validation_logistique → en_attente_validation_finale_demandeur

// 7. Demandeur clôture
Status: en_attente_validation_finale_demandeur → cloturee
```

### Scénario 2 : Rejet Partiel avec Sous-Demande
```typescript
// 1. DA créée
Items: 10 casques
Status: soumise

// 2. Conducteur valide partiellement
quantiteDemandee: 10
quantiteValidee: 7
→ Sous-demande créée automatiquement

// 3. Sous-demande générée
DA-MAT-20260118-0001-SD1
Items: 3 casques (quantité rejetée)
typeDemande: sous_demande
motifSousDemande: complement
```

### Scénario 3 : Gestion des Quantités
```typescript
// Flux complet d'un item
quantiteDemandee: 10    // Demandé par employé
quantiteValidee: 8      // Validé (2 rejetés)
quantiteSortie: 7       // Sorti du stock (1 manquant)
quantiteRecue: 6        // Reçu (1 perdu en livraison)

// Écarts calculés
Écart validation: 2     → Sous-demande nécessaire
Écart stock: 1          → Sous-demande nécessaire
Écart livraison: 1      → Sous-demande nécessaire
Total manquant: 4
```

### Scénario 4 : Autorisations RBAC
```typescript
// Technicien essaie de valider une demande
Rôle: employe
Action: Valider demande
Résultat: ❌ Permission refusée

// Conducteur valide une demande matériel
Rôle: conducteur_travaux
Type: materiel
Status: soumise
Résultat: ✅ Validation autorisée

// Appro prépare une sortie
Rôle: responsable_appro
Status: en_attente_preparation_appro
Résultat: ✅ Préparation autorisée

// Utilisateur hors projet essaie d'accéder
Projets utilisateur: [projet-1]
Projet demande: projet-2
Résultat: ❌ Accès refusé
```

## 🔍 Vérification des Résultats

### Résultats Attendus
Tous les tests doivent passer :
```
Test Suites: 4 passed, 4 total
Tests:       45+ passed, 45+ total
Snapshots:   0 total
Time:        3-5s
```

### En cas d'échec
1. Lire le message d'erreur détaillé
2. Vérifier que les types correspondent
3. Vérifier que les propriétés existent
4. Consulter la documentation des types dans `types/index.ts`

## 🛠️ Configuration Jest

### jest.config.js
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'stores/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**'
  ]
}
```

### package.json scripts
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:functional": "jest __tests__/functional",
    "test:verbose": "jest --verbose"
  }
}
```

## 📈 Couverture de Code

### Générer le rapport
```bash
npm run test:coverage
```

### Rapport attendu
```
File                          | % Stmts | % Branch | % Funcs | % Lines |
------------------------------|---------|----------|---------|---------|
All files                     |   80+   |   75+    |   80+   |   80+   |
 stores/useStore.ts           |   85    |   80     |   85    |   85    |
 components/demandes/...      |   75    |   70     |   75    |   75    |
```

## 🎓 Bonnes Pratiques

### 1. Nommage des Tests
```typescript
// ✅ BON : Descriptif et clair
test('Devrait créer une DA matériel avec succès', () => {})

// ❌ MAUVAIS : Vague
test('test 1', () => {})
```

### 2. Structure AAA (Arrange-Act-Assert)
```typescript
test('Devrait valider une demande', () => {
  // Arrange : Préparer les données
  const demande = createTestDemande()
  
  // Act : Exécuter l'action
  demande.status = 'en_attente_validation_conducteur'
  
  // Assert : Vérifier le résultat
  expect(demande.status).toBe('en_attente_validation_conducteur')
})
```

### 3. Données de Test Réalistes
```typescript
// ✅ BON : Données réalistes
const demande = {
  numero: 'DA-MAT-20260118-0001',
  type: 'materiel',
  items: [{ quantiteDemandee: 10 }]
}

// ❌ MAUVAIS : Données artificielles
const demande = {
  numero: 'test123',
  type: 'xyz'
}
```

## 🐛 Dépannage

### Erreur : Cannot find module '@/types'
**Solution :**
```bash
# Vérifier tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### Erreur : Property does not exist
**Solution :**
- Vérifier que la propriété existe dans `types/index.ts`
- Utiliser `Partial<Type>` si nécessaire
- Ajouter la propriété manquante au type

### Tests lents
**Solution :**
```bash
# Exécuter en parallèle
npm test -- --maxWorkers=4

# Mode watch pour développement
npm run test:watch
```

## 📝 Checklist Avant Commit

- [ ] Tous les tests passent (`npm test`)
- [ ] Pas d'erreurs TypeScript (`npx tsc --noEmit`)
- [ ] Couverture > 80% (`npm run test:coverage`)
- [ ] Tests lisibles et bien documentés
- [ ] Pas de code commenté ou de console.log

## 🎯 Prochaines Étapes

1. **Tests d'intégration** : Tester avec une vraie base de données
2. **Tests E2E** : Tester l'interface utilisateur complète
3. **Tests de performance** : Vérifier les temps de réponse
4. **Tests de sécurité** : Vérifier les permissions et l'authentification

## 📞 Support

En cas de problème :
1. Consulter la documentation Jest : https://jestjs.io
2. Vérifier les types dans `types/index.ts`
3. Consulter le README principal du projet
4. Contacter l'équipe de développement

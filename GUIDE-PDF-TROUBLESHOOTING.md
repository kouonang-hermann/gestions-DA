# Guide de Dépannage - Erreurs PDF

## Erreurs Communes et Solutions

### 1. Erreur d'Import TypeScript

**Erreur :**
```
Cannot find module 'jspdf' or its corresponding type declarations
```

**Solution :**
- Les imports dynamiques ont été implémentés dans `lib/pdf-generator.ts`
- Les déclarations de types personnalisées sont dans `types/pdf.d.ts`
- Le `tsconfig.json` a été mis à jour pour inclure ces types

### 2. Erreur SSR (Server-Side Rendering)

**Erreur :**
```
ReferenceError: document is not defined
```

**Solution :**
- Vérification `typeof window === 'undefined'` ajoutée
- Les imports sont maintenant dynamiques (côté client uniquement)
- Configuration webpack mise à jour dans `next.config.mjs`

### 3. Erreur Canvas

**Erreur :**
```
Cannot resolve 'canvas'
```

**Solution :**
- Configuration webpack avec `canvas: false` dans `next.config.mjs`
- Fallback configuré pour les modules non disponibles côté serveur

## Étapes de Résolution

### 1. Vérifier les Dépendances
```bash
npm install jspdf@^2.5.1 html2canvas@^1.4.1
npm install --save-dev @types/jspdf@^2.3.0 @types/html2canvas@^1.0.0
```

### 2. Redémarrer le Serveur
```bash
# Arrêter le serveur (Ctrl+C)
npm run dev
```

### 3. Vider le Cache Next.js
```bash
rm -rf .next
npm run dev
```

### 4. Vérifier la Configuration

#### `next.config.mjs` doit contenir :
```javascript
webpack: (config, { isServer }) => {
  if (isServer) {
    config.externals.push('@prisma/client')
  }
  
  // Configuration pour les bibliothèques PDF côté client uniquement
  if (!isServer) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      canvas: false,
      encoding: false,
    }
  }
  
  return config
}
```

#### `tsconfig.json` doit inclure :
```json
"include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", "types/**/*.d.ts"]
```

## Test de Fonctionnement

### 1. Vérifier l'Import
```typescript
// Dans un composant client
const testPDF = async () => {
  try {
    const { jsPDF } = await import('jspdf')
    const html2canvas = (await import('html2canvas')).default
    console.log('Imports PDF réussis')
  } catch (error) {
    console.error('Erreur import PDF:', error)
  }
}
```

### 2. Test Complet
1. Ouvrir l'historique des demandes
2. Cliquer sur "Détails" d'une demande
3. Cliquer sur "Télécharger PDF"
4. Vérifier la console pour les erreurs

## Erreurs Spécifiques

### Erreur "Element not found"
```typescript
// Vérifier que l'ID existe
const element = document.getElementById('purchase-request-card')
console.log('Element found:', !!element)
```

### Erreur de Permissions
```typescript
// Vérifier les permissions de téléchargement
// Certains navigateurs bloquent les téléchargements automatiques
```

### Erreur de Qualité/Rendu
```typescript
// Ajuster les options html2canvas
const canvas = await html2canvas(element, {
  scale: 1, // Réduire si problème de mémoire
  useCORS: false, // Désactiver si problème CORS
  allowTaint: false, // Désactiver si problème de sécurité
})
```

## Solutions Alternatives

### Option 1: react-to-print
Si les problèmes persistent, utiliser `react-to-print` :
```bash
npm install react-to-print
```

### Option 2: Génération PDF côté serveur
Créer une API route pour générer le PDF côté serveur avec `puppeteer`.

### Option 3: Service externe
Utiliser un service comme PDFShift ou HTML/CSS to PDF API.

## Logs de Debug

Ajouter ces logs pour diagnostiquer :
```typescript
console.log('Window available:', typeof window !== 'undefined')
console.log('Element found:', !!document.getElementById('purchase-request-card'))
console.log('jsPDF import:', typeof jsPDF)
console.log('html2canvas import:', typeof html2canvas)
```

## Support

Si les erreurs persistent après ces étapes :
1. Vérifier la version de Node.js (recommandé: 18+)
2. Vérifier la version de Next.js (recommandé: 14+)
3. Consulter les logs détaillés dans la console du navigateur
4. Tester dans un navigateur différent

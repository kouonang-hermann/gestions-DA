# Guide de Correction - Bouton Téléchargement PDF

## Problème Identifié
Le bouton "Télécharger PDF" dans l'historique des demandes ne fonctionnait pas car la fonction `onDownloadPDF` contenait seulement un TODO et un `console.log`.

## Solution Implémentée

### 1. Dépendances Ajoutées
```bash
npm install jspdf@^2.5.1 html2canvas@^1.4.1
npm install --save-dev @types/jspdf@^2.3.0 @types/html2canvas@^1.0.0
```

### 2. Fichiers Modifiés/Créés

#### Nouveaux fichiers :
- `lib/pdf-generator.ts` - Utilitaire pour la génération PDF

#### Fichiers modifiés :
- `package.json` - Ajout des dépendances
- `components/modals/purchase-request-details-modal.tsx` - Implémentation de la fonction PDF
- `components/demandes/purchase-request-card.tsx` - Amélioration du bouton avec état de chargement

### 3. Fonctionnalités Ajoutées

#### Génération PDF
- Conversion HTML vers Canvas avec `html2canvas`
- Génération PDF avec `jsPDF`
- Support multi-pages automatique
- Nom de fichier automatique : `demande-{numero}-{date}.pdf`

#### Interface Utilisateur
- Bouton avec icône de téléchargement
- État de chargement avec spinner
- Notifications toast (succès/erreur)
- Bouton désactivé pendant la génération

## Instructions d'Installation

### 1. Installer les dépendances
```bash
npm install
```

### 2. Redémarrer le serveur de développement
```bash
npm run dev
```

## Test de la Fonctionnalité

### 1. Accéder à l'historique
1. Connectez-vous à l'application
2. Allez dans le tableau de bord
3. Cliquez sur "Historique" ou "Toutes mes demandes"

### 2. Tester le téléchargement PDF
1. Sélectionnez une demande dans l'historique
2. Cliquez sur "Détails" pour ouvrir le modal
3. Cliquez sur "Télécharger PDF"
4. Vérifiez que :
   - Le bouton affiche un spinner pendant la génération
   - Une notification de succès apparaît
   - Le fichier PDF est téléchargé avec le bon nom

### 3. Vérification du PDF
Le PDF généré doit contenir :
- En-tête avec logo et numéro de demande
- Informations du demandeur et du projet
- Liste complète des articles
- Étapes de validation avec signatures
- Mise en page professionnelle

## Dépannage

### Erreur "Element not found"
- Vérifiez que l'ID `purchase-request-card` est présent
- Assurez-vous que le modal est complètement chargé

### Problème de qualité PDF
- La qualité est configurée avec `scale: 2` pour une meilleure résolution
- Ajustez le paramètre `scale` dans `lib/pdf-generator.ts` si nécessaire

### Erreur de CORS
- Les options `useCORS: true` et `allowTaint: true` sont configurées
- Vérifiez que les images utilisent des URLs valides

## Configuration Avancée

### Personnaliser le format PDF
Modifiez les options dans `lib/pdf-generator.ts` :
```typescript
await generatePDFFromElement(element, {
  filename: 'custom-name.pdf',
  format: 'a4', // ou 'letter'
  orientation: 'portrait', // ou 'landscape'
  margin: 15 // en mm
})
```

### Ajouter des métadonnées PDF
```typescript
pdf.setProperties({
  title: `Demande ${demande.numero}`,
  subject: 'Demande d\'achat',
  author: 'Système de Gestion',
  creator: 'Application Web'
})
```

## Notes Techniques

- La génération PDF est asynchrone et peut prendre quelques secondes
- Les images doivent être chargées avant la génération
- Le composant doit être visible dans le DOM pour la capture
- La bibliothèque `sonner` est utilisée pour les notifications

## Statut
✅ **Fonctionnalité implémentée et prête pour les tests**

Après installation des dépendances, le bouton PDF dans l'historique devrait fonctionner correctement.

# 📎 Fonctionnalité de Téléversement de Fichiers Excel

Cette fonctionnalité permet aux utilisateurs de téléverser des fichiers Excel lors de la création de demandes matériel ou outillage.

## 🎯 Objectif

Permettre aux demandeurs de joindre des fichiers Excel contenant des listes d'articles, des spécifications techniques, ou tout autre document pertinent à leur demande.

## 📋 Fonctionnalités

### 1. Téléversement de Fichiers

- **Formats acceptés** : `.xlsx`, `.xls`, `.csv`
- **Nombre de fichiers** : Illimité
- **Taille maximale** : Définie par Next.js (par défaut 4.5MB par fichier)
- **Stockage** : Fichiers stockés dans `public/uploads/`

### 2. Interface Utilisateur

#### Dans le Formulaire de Création de Demande

1. **Section "Fichiers Excel"** :
   - Bouton de téléversement avec icône Upload
   - Indicateur de progression pendant le téléversement
   - Liste des fichiers téléversés avec possibilité de suppression

2. **Affichage des Fichiers** :
   - Icône de fichier Excel
   - Nom du fichier
   - Bouton de suppression (X)
   - Badge vert indiquant le succès du téléversement

### 3. Stockage des Fichiers

#### Nomenclature des Fichiers

Les fichiers sont renommés automatiquement pour éviter les conflits :

```
{nom_original}_{timestamp}_{random}.{extension}
```

**Exemple** :
- Fichier original : `Liste_Matériel.xlsx`
- Fichier stocké : `Liste_Materiel_1768433433791_a3b2c1.xlsx`

#### Structure de Stockage

```
public/
└── uploads/
    ├── .gitkeep
    ├── Liste_Materiel_1768433433791_a3b2c1.xlsx
    ├── Specifications_1768433433792_d4e5f6.xlsx
    └── ...
```

## 🔧 Architecture Technique

### 1. Schéma de Base de Données

**Modification du modèle `Demande`** :

```prisma
model Demande {
  // ... autres champs
  fichiersJoints String[] @default([]) // URLs/chemins des fichiers Excel téléversés
  // ... relations
}
```

### 2. API d'Upload

**Endpoint** : `POST /api/upload`

**Headers** :
```
Authorization: Bearer {token}
```

**Body** : `FormData` avec fichiers

**Réponse** :
```json
{
  "success": true,
  "files": [
    "/uploads/fichier1_timestamp_random.xlsx",
    "/uploads/fichier2_timestamp_random.xlsx"
  ],
  "message": "2 fichier(s) téléversé(s) avec succès"
}
```

**Erreurs** :
- `400` : Aucun fichier fourni ou format non autorisé
- `500` : Erreur serveur lors du téléversement

### 3. Validation des Fichiers

#### Côté Client
- Accepte uniquement `.xlsx`, `.xls`, `.csv` via l'attribut `accept`
- Affichage d'erreur si format invalide

#### Côté Serveur
- Vérification de l'extension du fichier
- Rejet des fichiers non autorisés
- Logs détaillés pour traçabilité

## 📖 Guide d'Utilisation

### Pour les Utilisateurs

1. **Créer une nouvelle demande** :
   - Cliquez sur "Nouvelle demande" dans votre dashboard
   - Remplissez les informations générales (projet, date de livraison)

2. **Téléverser des fichiers Excel** :
   - Dans la section "Fichiers Excel (optionnel)"
   - Cliquez sur "Téléverser des fichiers Excel"
   - Sélectionnez un ou plusieurs fichiers Excel
   - Attendez la confirmation du téléversement

3. **Gérer les fichiers** :
   - Visualisez la liste des fichiers téléversés
   - Supprimez un fichier en cliquant sur le bouton X
   - Ajoutez d'autres fichiers si nécessaire

4. **Soumettre la demande** :
   - Ajoutez vos articles
   - Cliquez sur "Créer la demande"
   - Les fichiers seront automatiquement associés à la demande

### Pour les Valideurs

Les fichiers téléversés seront visibles dans les détails de la demande (fonctionnalité à venir).

## 🔒 Sécurité

### 1. Authentification

- Tous les uploads nécessitent un token d'authentification valide
- Middleware `withAuth` vérifie l'identité de l'utilisateur

### 2. Validation des Fichiers

- **Extensions autorisées** : `.xlsx`, `.xls`, `.csv` uniquement
- **Nettoyage des noms** : Caractères spéciaux remplacés par `_`
- **Limitation de longueur** : Nom de fichier limité à 50 caractères

### 3. Stockage Sécurisé

- Fichiers stockés dans `public/uploads/` (accessible uniquement via URL)
- Noms de fichiers uniques pour éviter les écrasements
- Logs détaillés pour audit

## 🚀 Migration de la Base de Données

Après modification du schéma Prisma, exécutez :

```bash
npx prisma migrate dev --name add-fichiers-joints
npx prisma generate
```

## 📊 Logs et Monitoring

### Logs d'Upload

```
✅ [UPLOAD] Fichier téléversé: Liste_Materiel_1768433433791_a3b2c1.xlsx (125.43 KB)
```

### Logs d'Erreur

```
❌ [UPLOAD] Erreur lors du téléversement: Format de fichier non autorisé
```

## 🔄 Améliorations Futures

1. **Visualisation des Fichiers** :
   - Afficher les fichiers dans les détails de demande
   - Bouton de téléchargement
   - Prévisualisation des fichiers Excel

2. **Gestion Avancée** :
   - Limite de taille par fichier configurable
   - Compression automatique des fichiers
   - Stockage cloud (S3, Azure Blob, etc.)

3. **Analyse des Fichiers** :
   - Extraction automatique des articles depuis Excel
   - Pré-remplissage du formulaire
   - Validation des données

## ⚠️ Limitations Actuelles

1. **Taille des Fichiers** :
   - Limite par défaut de Next.js : 4.5MB par fichier
   - Peut être augmentée dans la configuration

2. **Stockage Local** :
   - Fichiers stockés sur le serveur
   - Pas de stockage cloud pour le moment

3. **Visualisation** :
   - Pas encore de prévisualisation des fichiers
   - Téléchargement direct uniquement

## 🐛 Dépannage

### Erreur "Format de fichier non autorisé"

**Cause** : Le fichier n'est pas au format Excel (.xlsx, .xls) ou CSV (.csv)

**Solution** : Convertissez votre fichier au format Excel avant de le téléverser

### Erreur "Erreur lors du téléversement"

**Cause** : Problème réseau ou serveur

**Solutions** :
1. Vérifiez votre connexion internet
2. Réessayez le téléversement
3. Vérifiez que le serveur est en cours d'exécution
4. Consultez les logs du serveur

### Les fichiers ne s'affichent pas

**Cause** : Problème de synchronisation

**Solutions** :
1. Actualisez la page
2. Vérifiez que le téléversement a réussi (message de confirmation)
3. Consultez la console du navigateur pour les erreurs

## 📞 Support

Pour toute question ou problème :
1. Consultez les logs du serveur
2. Vérifiez la console du navigateur
3. Contactez l'administrateur système

## 📝 Notes Techniques

### Configuration Next.js

Pour augmenter la taille maximale des fichiers, modifiez `next.config.js` :

```javascript
module.exports = {
  api: {
    bodyParser: {
      sizeLimit: '10mb', // Augmenter la limite
    },
  },
}
```

### Nettoyage des Fichiers

Les fichiers ne sont pas automatiquement supprimés. Pour nettoyer les fichiers orphelins :

```bash
# Script de nettoyage à créer
node scripts/cleanup-uploads.js
```

## ✅ Checklist de Déploiement

- [ ] Exécuter la migration Prisma
- [ ] Vérifier que le dossier `public/uploads` existe
- [ ] Configurer les permissions du dossier uploads
- [ ] Tester le téléversement en développement
- [ ] Tester le téléversement en production
- [ ] Vérifier les logs d'upload
- [ ] Documenter le processus pour les utilisateurs

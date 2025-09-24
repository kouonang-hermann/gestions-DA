# 🚀 GUIDE DE MIGRATION VERS SUPABASE

## 📋 MÉTHODES DE MIGRATION

### MÉTHODE 1 : EXPORT/IMPORT AVEC SCRIPTS NODE.JS

#### 1. Export depuis la base actuelle
```bash
# Si base locale SQLite
node scripts/export-data.js

# Si base PostgreSQL locale
DATABASE_URL="postgresql://user:pass@localhost:5432/db" node scripts/export-data.js
```

#### 2. Import vers Supabase
```bash
# Configurer l'URL Supabase
export DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"

# Importer les données
node scripts/import-to-supabase.js data-export/data-export-xxx.json
```

### MÉTHODE 2 : DUMP SQL (PostgreSQL vers PostgreSQL)

#### 1. Export SQL depuis l'ancienne base
```bash
pg_dump "postgresql://old-url" > backup.sql
```

#### 2. Import vers Supabase
```bash
psql "postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres" < backup.sql
```

### MÉTHODE 3 : VIA SUPABASE DASHBOARD

#### 1. Aller sur Supabase Dashboard
- Votre projet → Table Editor
- Import data → CSV/JSON

#### 2. Importer table par table
- Users
- Projets  
- Articles
- Demandes
- DemandeItems

### MÉTHODE 4 : PRISMA MIGRATE + SEED

#### 1. Réinitialiser Supabase
```bash
# Pointer vers Supabase
export DATABASE_URL="postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres"

# Appliquer le schéma
npx prisma db push --force-reset

# Seed avec données de base
npx prisma db seed
```

#### 2. Importer données personnalisées
```bash
node scripts/import-to-supabase.js data-export/data-export-xxx.json
```

## 🔧 ÉTAPES RECOMMANDÉES

### ÉTAPE 1 : SAUVEGARDER LES DONNÉES ACTUELLES
```bash
# Export depuis la base actuelle
node scripts/export-data.js
```

### ÉTAPE 2 : CONFIGURER SUPABASE
```bash
# Variables d'environnement
export DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"
export JWT_SECRET="your-jwt-secret"
```

### ÉTAPE 3 : INITIALISER LE SCHÉMA SUPABASE
```bash
# Appliquer le schéma Prisma
npx prisma db push

# Créer les utilisateurs de test
npx prisma db seed
```

### ÉTAPE 4 : IMPORTER LES DONNÉES
```bash
# Importer les données sauvegardées
node scripts/import-to-supabase.js data-export/data-export-[timestamp].json
```

### ÉTAPE 5 : VÉRIFIER
```bash
# Tester la connexion
node scripts/test-connection.js
```

## 🚨 POINTS IMPORTANTS

### ✅ AVANT LA MIGRATION
- [ ] Sauvegarder toutes les données
- [ ] Noter les mots de passe hashés
- [ ] Exporter les relations (UserProjet, etc.)
- [ ] Vérifier les IDs et références

### ✅ APRÈS LA MIGRATION
- [ ] Tester la connexion
- [ ] Vérifier les données
- [ ] Tester l'authentification
- [ ] Valider les relations

### 🔐 SÉCURITÉ
- [ ] Changer les mots de passe de test
- [ ] Configurer les RLS (Row Level Security) sur Supabase
- [ ] Vérifier les permissions

## 📞 SUPPORT
Si problème, vérifier :
1. Format de l'URL Supabase
2. Permissions de la base
3. Schéma Prisma appliqué
4. Variables d'environnement

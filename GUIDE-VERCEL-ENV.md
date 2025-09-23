# 🔧 Guide : Configuration des Variables d'Environnement sur Vercel

## 📋 Prérequis
- [ ] Compte Vercel créé
- [ ] Projet connecté à Vercel
- [ ] Base de données PostgreSQL créée (Supabase/Neon)

## 🎯 Étapes Détaillées

### 1. **Générer les Secrets**
```bash
# Exécuter dans votre terminal
node scripts/generate-secrets.js
```
**📝 Copiez les valeurs générées !**

### 2. **Accéder aux Variables d'Environnement**
1. Allez sur [vercel.com](https://vercel.com)
2. Sélectionnez votre projet
3. Cliquez sur **"Settings"** (onglet en haut)
4. Cliquez sur **"Environment Variables"** (menu gauche)

### 3. **Ajouter Chaque Variable**

#### **Variable 1 : DATABASE_URL**
- **Name:** `DATABASE_URL`
- **Value:** `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
- **Environments:** ✅ Production ✅ Preview ✅ Development
- Cliquez **"Save"**

#### **Variable 2 : DIRECT_URL**
- **Name:** `DIRECT_URL`
- **Value:** `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
- **Environments:** ✅ Production ✅ Preview ✅ Development
- Cliquez **"Save"**

#### **Variable 3 : JWT_SECRET**
- **Name:** `JWT_SECRET`
- **Value:** `[VOTRE_JWT_SECRET_GÉNÉRÉ]`
- **Environments:** ✅ Production ✅ Preview ✅ Development
- Cliquez **"Save"**

#### **Variable 4 : NEXTAUTH_SECRET**
- **Name:** `NEXTAUTH_SECRET`
- **Value:** `[VOTRE_NEXTAUTH_SECRET_GÉNÉRÉ]`
- **Environments:** ✅ Production ✅ Preview ✅ Development
- Cliquez **"Save"**

#### **Variable 5 : NEXTAUTH_URL (Production)**
- **Name:** `NEXTAUTH_URL`
- **Value:** `https://[VOTRE-APP-NAME].vercel.app`
- **Environments:** ✅ Production
- Cliquez **"Save"**

#### **Variable 6 : NEXTAUTH_URL (Preview)**
- **Name:** `NEXTAUTH_URL`
- **Value:** `https://[PREVIEW-URL].vercel.app`
- **Environments:** ✅ Preview
- Cliquez **"Save"**

#### **Variable 7 : NEXTAUTH_URL (Development)**
- **Name:** `NEXTAUTH_URL`
- **Value:** `http://localhost:3000`
- **Environments:** ✅ Development
- Cliquez **"Save"**

## 🔍 Exemple Complet

```bash
# Vos variables devraient ressembler à ceci :
DATABASE_URL=postgresql://postgres:VotreMotDePasse@db.abcdefghijklmnop.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:VotreMotDePasse@db.abcdefghijklmnop.supabase.co:5432/postgres
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0
NEXTAUTH_SECRET=x1y2z3a4b5c6d7e8f9g0h1i2j3k4l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0b1c2
NEXTAUTH_URL=https://gestion-demandes-materiel.vercel.app
```

## ✅ Vérification

Après avoir ajouté toutes les variables :
1. Allez dans **"Deployments"**
2. Cliquez sur **"Redeploy"** pour le dernier déploiement
3. Vérifiez que le déploiement réussit

## 🚨 Points Importants

### **URLs Supabase**
- Remplacez `[PASSWORD]` par votre mot de passe Supabase
- Remplacez `[PROJECT-REF]` par votre référence de projet Supabase
- L'URL complète se trouve dans **Settings → Database** sur Supabase

### **NEXTAUTH_URL**
- Pour **Production** : `https://votre-app-name.vercel.app`
- Pour **Preview** : Vercel génère automatiquement des URLs de preview
- Pour **Development** : `http://localhost:3000`

### **Secrets**
- **JWT_SECRET** : Utilisé pour signer les tokens JWT
- **NEXTAUTH_SECRET** : Utilisé par NextAuth pour chiffrer les sessions
- **Ne partagez jamais ces secrets !**

## 🔧 Dépannage

### **Erreur "Invalid Database URL"**
- Vérifiez que l'URL PostgreSQL est correcte
- Testez la connexion depuis votre machine locale

### **Erreur "Missing Environment Variables"**
- Vérifiez que toutes les variables sont ajoutées
- Redéployez après avoir ajouté les variables

### **Erreur de Connexion Base de Données**
- Vérifiez que la base Supabase est active
- Vérifiez les permissions de connexion

## 🎉 Prochaines Étapes

Après configuration :
1. **Redéployer** votre application
2. **Tester** la connexion à la base de données
3. **Vérifier** que l'authentification fonctionne
4. **Exécuter** les migrations si nécessaire

**Votre application sera bientôt en ligne ! 🚀**

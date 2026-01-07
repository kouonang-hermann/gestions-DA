# 🚀 GUIDE DE DÉPLOIEMENT - PASSAGE SUPABASE PRO

## ✅ CHECKLIST COMPLÈTE

### **ÉTAPE 1 : Configuration Supabase**

#### A. Récupérer les nouvelles informations de connexion

1. **Connectez-vous à Supabase Dashboard** : https://supabase.com/dashboard
2. **Sélectionnez votre projet** : `epbujmcorailfbmmwcjy`
3. **Allez dans Settings → Database**
4. **Copiez la Connection String** (section "Connection string")

**Format attendu :**
```
postgresql://postgres.epbujmcorailfbmmwcjy:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres
```

⚠️ **IMPORTANT** : Remplacez `[YOUR-PASSWORD]` par votre mot de passe réel

---

### **ÉTAPE 2 : Mettre à jour Vercel**

#### A. Variables d'environnement Vercel

1. **Allez sur Vercel Dashboard** : https://vercel.com
2. **Sélectionnez votre projet** : `gestions-da`
3. **Allez dans Settings → Environment Variables**
4. **Mettez à jour/Ajoutez ces variables** :

```bash
# DATABASE - CRITIQUE
POSTGRES_PRISMA_URL=postgresql://postgres.epbujmcorailfbmmwcjy:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1

POSTGRES_URL=postgresql://postgres.epbujmcorailfbmmwcjy:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres

# JWT - Si vous en avez un personnalisé
JWT_SECRET=votre-secret-jwt-securise

# APPLICATION
NEXT_PUBLIC_APP_URL=https://gestions-da.vercel.app
NODE_ENV=production
```

5. **Pour chaque variable** :
   - Cochez **Production** ✅
   - Cochez **Preview** ✅
   - Cochez **Development** ✅
   - Cliquez sur **Save**

#### B. Redéployer l'application

**Méthode 1 - Via Vercel Dashboard** :
1. Allez dans **Deployments**
2. Cliquez sur les **3 points** (⋮) du dernier déploiement
3. Cliquez sur **"Redeploy"**
4. Cliquez sur **"Redeploy"** pour confirmer
5. **Attendez 3-5 minutes** que le déploiement se termine

**Méthode 2 - Via Git** :
```bash
git add .
git commit -m "Update: Passage Supabase Pro + Mode Debug Logistique"
git push
```

---

### **ÉTAPE 3 : Vérification de la connexion**

#### A. Test SQL dans Supabase

Dans **Supabase Dashboard → SQL Editor**, exécutez :

```sql
-- Test 1 : Vérifier les utilisateurs
SELECT COUNT(*) as total_users FROM "User";

-- Test 2 : Vérifier les projets
SELECT COUNT(*) as total_projets FROM "Projet";

-- Test 3 : Vérifier les demandes
SELECT COUNT(*) as total_demandes FROM "Demande";

-- Test 4 : Vérifier les demandes du projet principal
SELECT 
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'en_attente_validation_logistique' THEN 1 END) as a_valider_logistique,
  COUNT(CASE WHEN status = 'en_attente_preparation_appro' THEN 1 END) as a_preparer_appro
FROM "Demande"
WHERE "projetId" = 'cmgl82vxk0001kz042f40xrw1';
```

✅ **Résultat attendu** : Des nombres > 0 pour chaque requête

#### B. Test API Vercel

**Après le redéploiement**, ouvrez dans votre navigateur :

1. **Test connexion** : https://gestions-da.vercel.app
   - ✅ La page doit se charger sans erreur

2. **Test login** : https://gestions-da.vercel.app/login
   - ✅ Connectez-vous avec vos identifiants
   - ✅ Vous devez être redirigé vers le dashboard

3. **Vérifiez la console** (F12) :
   - ✅ Pas d'erreur de connexion à la base
   - ✅ Les logs de chargement doivent s'afficher

---

### **ÉTAPE 4 : Test du Responsable Logistique**

#### A. Connexion et vérification

1. **Connectez-vous** en tant que responsable logistique
2. **Cliquez sur "🔍 Mode Debug"** (bouton jaune en haut à droite)
3. **Vérifiez les informations affichées** :
   - ✅ Projets assignés : `[cmgl82vxk0001kz042f40xrw1]`
   - ✅ Total demandes > 0
   - ✅ Demandes filtrées > 0

#### B. Si le mode debug n'apparaît pas

Le bouton n'apparaîtra qu'après le redéploiement avec les dernières modifications.

**En attendant, vérifiez dans la console** (F12) :
```
🔍 [LOGISTIQUE-DASHBOARD] Statistiques pour ...
```

---

### **ÉTAPE 5 : Vérifications finales**

#### A. Checklist fonctionnelle

- [ ] ✅ Connexion à l'application fonctionne
- [ ] ✅ Les utilisateurs peuvent se connecter
- [ ] ✅ Les projets se chargent
- [ ] ✅ Les demandes s'affichent
- [ ] ✅ Le responsable logistique voit ses données
- [ ] ✅ Les validations fonctionnent
- [ ] ✅ Les notifications se chargent

#### B. Logs à surveiller

**Dans Vercel Dashboard → Logs**, vérifiez qu'il n'y a pas :
- ❌ Erreurs de connexion à la base de données
- ❌ Erreurs Prisma
- ❌ Timeouts

**Dans la console navigateur** (F12), vérifiez qu'il n'y a pas :
- ❌ Erreurs 500 (serveur)
- ❌ Erreurs 401 (authentification)
- ❌ Erreurs de chargement des données

---

## 🔧 RÉSOLUTION DES PROBLÈMES COURANTS

### Problème 1 : "Connection timeout"

**Solution** :
```bash
# Utilisez le pooler avec pgbouncer
POSTGRES_PRISMA_URL=postgresql://...?pgbouncer=true&connection_limit=1
```

### Problème 2 : "Too many connections"

**Solution** :
1. Dans Supabase Dashboard → Settings → Database
2. Augmentez **Max connections** (Pro permet jusqu'à 200)
3. Ou réduisez `connection_limit` dans l'URL

### Problème 3 : "SSL required"

**Solution** :
```bash
# Ajoutez sslmode à l'URL
POSTGRES_URL=postgresql://...?sslmode=require
```

### Problème 4 : Les données ne se chargent pas

**Diagnostic** :
1. Vérifiez les logs Vercel
2. Vérifiez la console navigateur (F12)
3. Testez la connexion SQL dans Supabase
4. Vérifiez que `DATABASE_URL` est correcte dans Vercel

---

## 📊 REQUÊTES SQL UTILES

### Vérifier les demandes par statut

```sql
SELECT 
  status,
  COUNT(*) as nombre
FROM "Demande"
WHERE "projetId" = 'cmgl82vxk0001kz042f40xrw1'
GROUP BY status
ORDER BY nombre DESC;
```

### Vérifier les utilisateurs et leurs projets

```sql
SELECT 
  u.nom,
  u.prenom,
  u.role,
  COUNT(up."projetId") as nb_projets
FROM "User" u
LEFT JOIN "user_projets" up ON u.id = up."userId"
GROUP BY u.id, u.nom, u.prenom, u.role
ORDER BY u.role;
```

### Créer une demande de test pour le responsable logistique

```sql
-- Seulement si aucune demande n'existe
INSERT INTO "Demande" (
  id, numero, "projetId", "technicienId", type, status, 
  "dateCreation", "dateModification"
)
VALUES (
  'test-logistique-001',
  'DA-TEST-001',
  'cmgl82vxk0001kz042f40xrw1',
  (SELECT id FROM "User" WHERE role = 'employe' LIMIT 1),
  'materiel',
  'en_attente_validation_logistique',
  NOW(),
  NOW()
);
```

---

## 🎯 RÉSUMÉ DES ACTIONS

1. ✅ **Récupérer** la Connection String dans Supabase
2. ✅ **Mettre à jour** `POSTGRES_PRISMA_URL` et `POSTGRES_URL` dans Vercel
3. ✅ **Redéployer** l'application Vercel
4. ✅ **Attendre** 3-5 minutes
5. ✅ **Tester** la connexion et le chargement des données
6. ✅ **Vérifier** que le responsable logistique voit ses données

---

## 📞 SUPPORT

Si après avoir suivi toutes ces étapes, le problème persiste :

1. **Partagez** les logs Vercel (onglet Logs)
2. **Partagez** les erreurs console (F12)
3. **Partagez** le résultat des requêtes SQL de test

---

**Date de création** : 7 janvier 2026  
**Version** : 1.0 - Passage Supabase Pro  
**Auteur** : Équipe Technique Gestion DA

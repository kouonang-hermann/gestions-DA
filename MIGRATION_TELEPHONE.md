# 📱 Migration vers Connexion par Téléphone

## ✅ Modifications Effectuées

### 1. **Schéma Prisma**
- ✅ Champ `phone` rendu **obligatoire** et **unique**
- ✅ Permet la connexion par téléphone au lieu d'email

### 2. **Interface de Connexion**
- ✅ Formulaire de connexion déjà configuré pour le téléphone
- ✅ Champ "Numéro de téléphone" + mot de passe
- ✅ Compatible avec l'authentification existante

### 3. **Formulaire de Création d'Utilisateur**
- ✅ Champ téléphone ajouté dans le modal de création
- ✅ Validation du numéro requis
- ✅ API mise à jour pour retourner le téléphone

### 4. **Authentification**
- ✅ `authenticateUser()` supporte déjà email **OU** téléphone
- ✅ Pas de modification nécessaire - déjà compatible

---

## 🚀 Étapes de Migration de la Base de Données

### **Option A : Migration via Supabase Dashboard (RECOMMANDÉ)**

#### Étape 1 : Accéder à Supabase SQL Editor
1. Allez sur [supabase.com](https://supabase.com)
2. Sélectionnez votre projet
3. Cliquez sur **SQL Editor** dans le menu de gauche

#### Étape 2 : Exécuter le Script SQL
1. Créez une nouvelle requête
2. Copiez-collez le contenu du fichier :
   ```
   prisma/migrations/manual_add_phone_unique.sql
   ```
3. Cliquez sur **RUN** pour exécuter

#### Étape 3 : Vérifier les Résultats
Le script va :
- ✅ Attribuer des numéros temporaires aux utilisateurs sans téléphone
- ✅ Rendre le champ `phone` obligatoire
- ✅ Ajouter une contrainte UNIQUE
- ✅ Afficher tous les utilisateurs avec leurs numéros

#### Étape 4 : Mettre à Jour les Numéros (IMPORTANT)
Après l'exécution, **mettez à jour manuellement** les numéros temporaires :
```sql
-- Exemple de mise à jour
UPDATE users 
SET phone = '+33612345678' 
WHERE email = 'admin@test.com';

UPDATE users 
SET phone = '+33687654321' 
WHERE email = 'employe@test.com';

-- Répétez pour chaque utilisateur
```

---

### **Option B : Migration via Terminal (si vous préférez)**

#### Prérequis
- Connexion à la base de données fonctionnelle
- Variables d'environnement correctement configurées

#### Commandes
```bash
# 1. Générer la migration Prisma
npx prisma migrate deploy

# 2. Ou exécuter manuellement le SQL
psql $DATABASE_URL < prisma/migrations/manual_add_phone_unique.sql
```

---

## 🔐 Configuration des Utilisateurs Existants

### **Attribuer des Numéros de Téléphone**

Si vous avez des utilisateurs dans la base, exécutez ce SQL pour leur attribuer des numéros :

```sql
-- Exemple pour les utilisateurs de test
UPDATE users SET phone = '+33601020304' WHERE email = 'admin@test.com';
UPDATE users SET phone = '+33602030405' WHERE email = 'employe@test.com';
UPDATE users SET phone = '+33603040506' WHERE email = 'conducteur@test.com';
UPDATE users SET phone = '+33604050607' WHERE email = 'qhse@test.com';
UPDATE users SET phone = '+33605060708' WHERE email = 'appro@test.com';
UPDATE users SET phone = '+33606070809' WHERE email = 'charge@test.com';
UPDATE users SET phone = '+33607080910' WHERE email = 'logistique@test.com';

-- Vérifier les mises à jour
SELECT id, nom, prenom, email, phone, role FROM users;
```

---

## 🧪 Test de la Connexion

### **Avec Numéro de Téléphone**
1. Allez sur la page de connexion
2. Entrez le **numéro de téléphone** (ex: +33601020304)
3. Entrez le **mot de passe**
4. Cliquez sur "SE CONNECTER"

### **Avec Email (toujours fonctionnel)**
L'authentification par email continue de fonctionner en parallèle !
1. Entrez l'**email**
2. Entrez le **mot de passe**
3. Connexion réussie ✅

---

## 📊 Vérifications Post-Migration

### **1. Vérifier la Base de Données**
```sql
-- Tous les utilisateurs doivent avoir un téléphone
SELECT COUNT(*) FROM users WHERE phone IS NULL;
-- Résultat attendu : 0

-- Vérifier l'unicité
SELECT phone, COUNT(*) 
FROM users 
GROUP BY phone 
HAVING COUNT(*) > 1;
-- Résultat attendu : 0 lignes (pas de doublons)
```

### **2. Tester la Création d'Utilisateur**
1. Dashboard Super-Admin
2. Cliquez sur "Nouvel Utilisateur"
3. Remplissez **tous les champs** (y compris téléphone)
4. Le champ téléphone est maintenant **obligatoire** ✅

### **3. Tester la Connexion**
- ✅ Connexion avec téléphone fonctionne
- ✅ Connexion avec email fonctionne toujours
- ✅ Mot de passe invalide → erreur appropriée

---

## ⚠️ Points d'Attention

### **Numéros de Téléphone Temporaires**
Le script attribue des numéros au format : `+33700000XXX`
- ⚠️ Ce sont des numéros **temporaires**
- 🔧 Vous **devez** les remplacer par de vrais numéros
- 📝 Utilisez le SQL ci-dessus pour mettre à jour

### **Formats Acceptés**
L'application accepte différents formats :
- ✅ `+33612345678` (international)
- ✅ `0612345678` (national)
- ✅ `06 12 34 56 78` (avec espaces)
- ✅ `+33 6 12 34 56 78` (international avec espaces)

### **Unicité**
- ⚠️ Chaque téléphone doit être **unique**
- ❌ Deux utilisateurs ne peuvent pas avoir le même numéro
- 🔒 La base de données l'empêchera automatiquement

---

## 🎯 Résumé des Changements

| Élément | Avant | Après |
|---------|-------|-------|
| **Connexion** | Email + Mot de passe | **Téléphone** + Mot de passe (email fonctionne toujours) |
| **Champ phone** | Optionnel | **Obligatoire et unique** |
| **Création utilisateur** | Email, nom, prénom, rôle | Email, **téléphone**, nom, prénom, rôle |
| **API** | Retourne users sans phone | Retourne users **avec phone** |

---

## 🆘 En Cas de Problème

### **Erreur : "Ce numéro de téléphone est déjà utilisé"**
→ Un utilisateur existe déjà avec ce numéro
```sql
-- Trouver qui utilise ce numéro
SELECT * FROM users WHERE phone = '+33612345678';
```

### **Erreur : "Numéro de téléphone requis"**
→ Le champ est maintenant obligatoire lors de la création
→ Remplissez tous les champs du formulaire

### **Impossible de se connecter**
1. Vérifiez que la migration SQL a été exécutée
2. Vérifiez que l'utilisateur a bien un numéro de téléphone :
```sql
SELECT email, phone FROM users WHERE email = 'votre@email.com';
```
3. Essayez de vous connecter avec votre **email** (toujours supporté)

---

## ✨ Prochaines Étapes

1. ✅ Exécuter le script SQL de migration
2. ✅ Attribuer de vrais numéros de téléphone aux utilisateurs
3. ✅ Tester la connexion avec téléphone
4. ✅ Informer les utilisateurs du nouveau mode de connexion
5. ✅ Mettre à jour la documentation utilisateur

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs de l'application
2. Consultez les requêtes SQL ci-dessus
3. Assurez-vous que la migration a été exécutée complètement

---

**Date de migration :** $(Get-Date -Format "yyyy-MM-dd HH:mm")  
**Version :** 2.0 - Migration Téléphone  
**Statut :** ✅ Prêt pour production

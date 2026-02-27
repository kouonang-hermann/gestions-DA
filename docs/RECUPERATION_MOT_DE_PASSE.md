# 🔐 Guide de Récupération de Mot de Passe

## 📋 Vue d'ensemble

Le système de gestion des demandes dispose d'un **système de récupération de mot de passe** complet et sécurisé basé sur :
- **Nom complet** de l'utilisateur
- **Numéro de téléphone** enregistré

## 🎯 Pour l'utilisateur 698814956

### Étape 1 : Identifier l'utilisateur

Exécutez le script SQL suivant pour vérifier les informations de l'utilisateur :

```bash
# Chemin du script
scripts/sql/find-user-698814956.sql
```

Ce script va :
- ✅ Rechercher l'utilisateur par son numéro de téléphone
- ✅ Afficher ses informations complètes (nom, prénom, email, rôle)
- ✅ Lister ses projets assignés
- ✅ Montrer ses dernières demandes

### Étape 2 : Récupération via l'interface utilisateur

L'utilisateur peut récupérer son mot de passe **lui-même** via l'interface de connexion :

1. **Accéder à la page de connexion**
   - URL : `https://votre-domaine.com/login`

2. **Cliquer sur "Mot de passe oublié ?"**
   - Lien situé sous le formulaire de connexion

3. **Remplir le formulaire de récupération**
   - **Nom complet** : Entrer le nom exact (ex: "Jean Dupont")
   - **Numéro de téléphone** : Entrer le numéro exact (698814956)

4. **Cliquer sur "Récupérer"**
   - Le système vérifie les informations
   - Si correspondance trouvée, un nouveau mot de passe temporaire est généré
   - Le mot de passe s'affiche à l'écran

5. **Noter le mot de passe temporaire**
   - ⚠️ **IMPORTANT** : Noter ce mot de passe immédiatement
   - Il sera affiché une seule fois

6. **Se connecter avec le nouveau mot de passe**
   - Utiliser le mot de passe temporaire pour se connecter
   - **Recommandation** : Changer le mot de passe après la première connexion

## 🔧 Architecture technique

### Composants

1. **Interface utilisateur**
   - Fichier : `components/auth/forgot-password-modal.tsx`
   - Formulaire avec validation des champs
   - Affichage sécurisé du nouveau mot de passe

2. **API de récupération**
   - Endpoint : `/api/auth/forgot-password`
   - Fichier : `app/api/auth/forgot-password/route.ts`
   - Méthode : POST

3. **Intégration dans le login**
   - Fichier : `components/auth/login-form.tsx`
   - Bouton "Mot de passe oublié ?" intégré

### Flux de récupération

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Utilisateur clique "Mot de passe oublié ?"              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Modal s'ouvre avec formulaire                           │
│    - Champ : Nom complet                                   │
│    - Champ : Numéro de téléphone                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Soumission du formulaire                                │
│    POST /api/auth/forgot-password                          │
│    Body: { nom, telephone }                                │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Recherche dans la base de données                       │
│    - Recherche par nom (insensible à la casse)             │
│    - Recherche par téléphone (exact)                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Si utilisateur trouvé                                   │
│    - Génération mot de passe temporaire (10 caractères)    │
│    - Hashage avec bcrypt                                   │
│    - Mise à jour en base de données                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. Retour du nouveau mot de passe                          │
│    - Affichage dans le modal                               │
│    - Message de succès                                     │
│    - Recommandation de changement                          │
└─────────────────────────────────────────────────────────────┘
```

### Sécurité du mot de passe temporaire

Le mot de passe généré automatiquement contient :
- **10 caractères** minimum
- Au moins **1 majuscule** (A-Z)
- Au moins **1 minuscule** (a-z)
- Au moins **1 chiffre** (0-9)
- Au moins **1 caractère spécial** (!@#$%)
- Caractères mélangés aléatoirement

Exemple : `aB3@xYz9K!`

## 🛠️ Réinitialisation manuelle (Admin uniquement)

Si l'utilisateur ne peut pas utiliser l'interface, un administrateur peut réinitialiser le mot de passe via SQL :

### Option 1 : Générer un hash bcrypt

```bash
# Utiliser Node.js pour générer un hash
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('NouveauMotDePasse123!', 10, (err, hash) => console.log(hash));"
```

### Option 2 : Script SQL de réinitialisation

```sql
-- Mettre à jour le mot de passe pour l'utilisateur 698814956
UPDATE users
SET 
  password = '$2a$10$HASH_GENERE_ICI',
  "updatedAt" = NOW()
WHERE phone = '698814956';
```

⚠️ **IMPORTANT** : Remplacer `$2a$10$HASH_GENERE_ICI` par le hash bcrypt généré à l'étape précédente.

## 📊 Vérification après réinitialisation

```sql
-- Vérifier que la mise à jour a réussi
SELECT 
  id,
  nom,
  prenom,
  phone,
  email,
  "updatedAt"
FROM users
WHERE phone = '698814956';
```

## 🔍 Dépannage

### Problème : "Aucun utilisateur trouvé"

**Causes possibles :**
1. Nom complet incorrect (vérifier majuscules/minuscules)
2. Numéro de téléphone incorrect
3. Utilisateur n'existe pas dans la base de données

**Solution :**
```sql
-- Rechercher l'utilisateur avec variations
SELECT nom, prenom, phone, email
FROM users
WHERE phone LIKE '%698814956%';
```

### Problème : Le nouveau mot de passe ne fonctionne pas

**Causes possibles :**
1. Mot de passe mal copié (espaces, caractères spéciaux)
2. Cache du navigateur
3. Problème de hashage

**Solution :**
1. Copier-coller le mot de passe au lieu de le taper
2. Vider le cache du navigateur
3. Réessayer la récupération

## 📝 Logs et audit

Chaque récupération de mot de passe met à jour le champ `updatedAt` de l'utilisateur, permettant de tracer les modifications.

```sql
-- Voir l'historique des modifications
SELECT 
  id,
  nom,
  prenom,
  phone,
  "createdAt",
  "updatedAt"
FROM users
WHERE phone = '698814956'
ORDER BY "updatedAt" DESC;
```

## ✅ Checklist de récupération

- [ ] Exécuter le script `find-user-698814956.sql` pour identifier l'utilisateur
- [ ] Vérifier que le nom et le téléphone correspondent
- [ ] Utiliser l'interface de récupération (recommandé)
- [ ] Noter le mot de passe temporaire généré
- [ ] Tester la connexion avec le nouveau mot de passe
- [ ] Demander à l'utilisateur de changer son mot de passe après connexion

## 🔗 Fichiers concernés

| Fichier | Description |
|---------|-------------|
| `components/auth/forgot-password-modal.tsx` | Interface de récupération |
| `app/api/auth/forgot-password/route.ts` | API de récupération |
| `components/auth/login-form.tsx` | Page de connexion avec lien |
| `scripts/sql/find-user-698814956.sql` | Script de recherche utilisateur |

## 📞 Support

En cas de problème persistant :
1. Vérifier les logs de l'API (`/api/auth/forgot-password`)
2. Vérifier la connexion à la base de données
3. Contacter l'administrateur système

---

**Dernière mise à jour** : 27 février 2026
**Version** : 1.0

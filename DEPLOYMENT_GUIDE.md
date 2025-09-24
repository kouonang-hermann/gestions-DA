# 🚀 GUIDE DE DÉPLOIEMENT - GESTION DEMANDES MATÉRIEL

## 🔧 ÉTAPES OBLIGATOIRES POUR LE DÉPLOIEMENT

### 1. **CONFIGURATION DES VARIABLES D'ENVIRONNEMENT**

Sur votre plateforme de déploiement (Vercel, Netlify, etc.), configurez ces variables :

```env
# Base de données
DATABASE_URL="your_production_database_url"

# JWT Configuration
JWT_SECRET="your-super-secure-jwt-secret-key-min-32-chars"
JWT_EXPIRES_IN="7d"

# Autres variables si nécessaires
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="https://your-domain.com"
```

### 2. **SEEDING DE LA BASE DE DONNÉES**

**CRITIQUE** : Exécutez le seed pour créer les utilisateurs de test :

#### Option A - Via terminal de production :
```bash
npx prisma db seed
```

#### Option B - Via script personnalisé :
```bash
npm run seed
```

#### Option C - Manuellement via Prisma Studio :
```bash
npx prisma studio
```

### 3. **VÉRIFICATION DES UTILISATEURS DE TEST**

Après le seed, ces comptes devraient être disponibles :

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| `admin@test.com` | `admin123` | Super Admin |
| `employe@test.com` | `employe123` | Employé |
| `conducteur@test.com` | `conducteur123` | Conducteur |
| `qhse@test.com` | `qhse123` | QHSE |
| `appro@test.com` | `appro123` | Appro |
| `charge@test.com` | `charge123` | Chargé Affaire |
| `logistique@test.com` | `logistique123` | Logistique |

### 4. **DIAGNOSTIC DES ERREURS 401**

Si vous obtenez encore des erreurs 401 :

#### A. Vérifiez la base de données :
```sql
SELECT email, role FROM User WHERE email LIKE '%@test.com';
```

#### B. Testez l'API directement :
```bash
curl -X POST https://your-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}'
```

#### C. Vérifiez les logs de production :
- Erreurs de connexion DB
- Erreurs JWT
- Variables d'environnement manquantes

### 5. **COMMANDES UTILES**

#### Réinitialiser la base de données :
```bash
npx prisma db push --force-reset
npx prisma db seed
```

#### Vérifier la connexion DB :
```bash
npx prisma db pull
```

#### Générer le client Prisma :
```bash
npx prisma generate
```

## 🚨 PROBLÈMES COURANTS

### Erreur 401 "Unauthorized"
- ✅ Base de données seedée ?
- ✅ Variables d'environnement configurées ?
- ✅ JWT_SECRET défini ?
- ✅ Utilisateurs créés ?

### Erreur de connexion DB
- ✅ DATABASE_URL correct ?
- ✅ Base de données accessible ?
- ✅ Permissions correctes ?

### Token JWT invalide
- ✅ JWT_SECRET identique partout ?
- ✅ Format Bearer token correct ?
- ✅ Token non expiré ?

## 📞 SUPPORT

Si le problème persiste :
1. Vérifiez les logs de production
2. Testez en local d'abord
3. Comparez les variables d'environnement
4. Vérifiez la connectivité DB

---
**Dernière mise à jour** : 2025-01-24

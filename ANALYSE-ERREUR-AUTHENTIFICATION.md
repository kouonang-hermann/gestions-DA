# 🔍 ANALYSE COMPLÈTE - ERREUR D'AUTHENTIFICATION 401

## 📋 Résumé du problème

**Erreur** : `Non authentifié - Veuillez vous reconnecter`  
**Localisation** : `stores/useStore.ts:285` (fonction `loadDemandes`)  
**Code HTTP** : 401 (Unauthorized)  
**Impact** : Les utilisateurs ne peuvent pas charger leurs demandes

---

## 🎯 Causes possibles identifiées

### 1. **Token JWT expiré**
- Le token JWT a une durée de validité limitée (défaut: 7 jours)
- Si l'utilisateur reste connecté au-delà de cette période, le token expire
- L'API rejette alors toutes les requêtes avec un code 401

### 2. **Token JWT invalide ou corrompu**
- Le token peut être mal formé lors de la génération
- Problème de stockage dans le localStorage
- Token modifié ou corrompu côté client

### 3. **Problème de synchronisation base de données**
- L'utilisateur existe dans le token mais pas en base de données
- Décalage entre l'authentification et la disponibilité de l'utilisateur
- Problème de connexion à la base de données

### 4. **Secret JWT différent**
- Le `JWT_SECRET` utilisé pour signer le token diffère de celui utilisé pour le vérifier
- Peut arriver lors de redémarrages du serveur avec des variables d'environnement différentes

### 5. **Token non envoyé ou mal formaté**
- Header `Authorization` manquant
- Format incorrect (doit être `Bearer <token>`)
- Token vide ou undefined

---

## 🔧 Solution implémentée

### 1. **Amélioration de la gestion des erreurs 401**

```typescript
if (response.status === 401) {
  console.error("❌ [STORE] Erreur 401: Token invalide ou expiré")
  
  // Déconnecter automatiquement l'utilisateur
  set({ 
    currentUser: null, 
    token: null, 
    isLoading: false,
    isLoadingDemandes: false,
    error: "Session expirée - Veuillez vous reconnecter"
  })
  
  // Redirection automatique vers la page de connexion
  if (typeof window !== 'undefined') {
    window.location.href = '/login'
  }
  
  return
}
```

**Avantages** :
- ✅ Déconnexion automatique en cas de token invalide
- ✅ Redirection immédiate vers la page de connexion
- ✅ Évite les erreurs répétées
- ✅ Message clair pour l'utilisateur

### 2. **Logs détaillés pour le debugging**

```typescript
if (!currentUser) {
  console.log("⚠️ [STORE] loadDemandes: Pas d'utilisateur connecté")
  return
}

if (!token) {
  console.log("⚠️ [STORE] loadDemandes: Pas de token disponible")
  return
}
```

**Avantages** :
- ✅ Identification rapide du problème
- ✅ Traçabilité complète du flow d'authentification
- ✅ Distinction entre différents types d'erreurs

### 3. **Gestion intelligente des erreurs**

```typescript
catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
  console.error("❌ [STORE] Erreur lors du chargement des demandes:", errorMessage)
  
  // Si c'est une erreur d'authentification, ne pas utiliser le fallback
  if (errorMessage.includes('authentifié') || errorMessage.includes('Session expirée')) {
    set({ 
      isLoading: false, 
      isLoadingDemandes: false,
      error: errorMessage
    })
    return
  }
  
  // Fallback uniquement pour erreurs réseau
}
```

**Avantages** :
- ✅ Distinction entre erreurs d'authentification et erreurs réseau
- ✅ Pas de fallback inapproprié pour les problèmes d'auth
- ✅ Gestion propre de chaque type d'erreur

---

## 🛠️ Actions recommandées pour résoudre le problème

### Option 1 : Vérifier la configuration JWT

1. **Vérifier le fichier `.env.local`** :
```bash
JWT_SECRET=votre-secret-tres-securise
JWT_EXPIRES_IN=7d
```

2. **S'assurer que le secret est cohérent** :
   - Même secret en développement et production
   - Pas de changement du secret sans déconnexion des utilisateurs

### Option 2 : Augmenter la durée de validité du token

Dans `lib/jwt.ts`, modifier :
```typescript
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '30d' // Au lieu de 7d
```

### Option 3 : Implémenter un refresh token

**Avantages** :
- Renouvellement automatique du token avant expiration
- Meilleure expérience utilisateur
- Sécurité maintenue

**Implémentation** :
1. Créer un endpoint `/api/auth/refresh`
2. Stocker un refresh token avec une durée plus longue
3. Renouveler automatiquement le token avant expiration

### Option 4 : Vérifier la connexion à la base de données

1. **Tester la connexion Prisma** :
```bash
npx prisma db pull
```

2. **Vérifier les logs de la base de données**

3. **S'assurer que l'utilisateur existe** :
```sql
SELECT * FROM "User" WHERE id = 'user-id-from-token';
```

---

## 📊 Flow d'authentification corrigé

```
1. Utilisateur se connecte
   ↓
2. Génération du token JWT (durée: 7j)
   ↓
3. Stockage du token dans le store Zustand
   ↓
4. Chargement des données (demandes, users, projets)
   ↓
5. Envoi du token dans les headers Authorization
   ↓
6. API vérifie le token avec requireAuth()
   ↓
7a. Token valide → Données retournées
7b. Token invalide (401) → Déconnexion automatique + Redirection
```

---

## 🔍 Comment diagnostiquer le problème

### 1. Vérifier les logs de la console

Rechercher ces messages :
- `⚠️ [STORE] loadDemandes: Pas d'utilisateur connecté`
- `⚠️ [STORE] loadDemandes: Pas de token disponible`
- `❌ [STORE] Erreur 401: Token invalide ou expiré`

### 2. Vérifier le token dans le localStorage

Ouvrir la console du navigateur :
```javascript
// Vérifier si le token existe
const state = JSON.parse(localStorage.getItem('demandes-store'))
console.log('Token:', state?.state?.token)
console.log('User:', state?.state?.currentUser)
```

### 3. Décoder le token JWT

Utiliser [jwt.io](https://jwt.io) pour décoder le token et vérifier :
- La date d'expiration (`exp`)
- L'ID utilisateur (`userId`)
- Le rôle (`role`)

### 4. Tester l'API directement

```bash
curl -H "Authorization: Bearer VOTRE_TOKEN" http://localhost:3000/api/demandes
```

---

## ✅ Résultat attendu après correction

1. **En cas de token expiré** :
   - ✅ Déconnexion automatique
   - ✅ Redirection vers `/login`
   - ✅ Message clair : "Session expirée - Veuillez vous reconnecter"
   - ✅ Pas d'erreurs répétées dans la console

2. **En cas de token valide** :
   - ✅ Chargement normal des demandes
   - ✅ Pas d'erreur 401
   - ✅ Expérience utilisateur fluide

3. **Logs de debugging** :
   - ✅ Traçabilité complète du processus
   - ✅ Identification rapide des problèmes
   - ✅ Distinction entre types d'erreurs

---

## 🚀 Prochaines étapes recommandées

1. **Court terme** :
   - ✅ Tester la correction avec différents utilisateurs
   - ✅ Vérifier que la redirection fonctionne correctement
   - ✅ Surveiller les logs pour confirmer la résolution

2. **Moyen terme** :
   - 🔄 Implémenter un système de refresh token
   - 🔄 Ajouter une notification avant expiration du token
   - 🔄 Améliorer la gestion de la session utilisateur

3. **Long terme** :
   - 🔄 Migrer vers NextAuth.js pour une gestion d'auth plus robuste
   - 🔄 Implémenter une authentification à deux facteurs
   - 🔄 Ajouter un système de monitoring des erreurs d'auth

---

## 📝 Fichiers modifiés

- ✅ `stores/useStore.ts` - Gestion améliorée des erreurs 401
- 📄 `ANALYSE-ERREUR-AUTHENTIFICATION.md` - Ce document

---

## 🆘 Support

Si le problème persiste après ces corrections :

1. Vérifier les variables d'environnement
2. Redémarrer le serveur Next.js
3. Vider le cache du navigateur et le localStorage
4. Tester avec un nouvel utilisateur
5. Vérifier les logs du serveur pour plus de détails

---

**Date de création** : 14 janvier 2026  
**Statut** : ✅ Solution implémentée - En attente de tests

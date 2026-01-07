# 🚨 DIAGNOSTIC - ERREURS 401 SUR /api/notifications

## 📋 Problème identifié dans les logs

```
Jan 07 09:08:54.71  GET  401  /api/notifications
Jan 07 09:08:46.31  GET  401  /api/notifications
Jan 07 09:08:25.11  GET  401  /api/notifications
Jan 07 09:07:46.84  GET  401  /api/notifications
Jan 07 09:06:48.62  GET  401  /api/notifications
Jan 07 09:05:45.71  GET  401  /api/notifications
Jan 07 09:04:45.67  GET  401  /api/notifications
Jan 07 09:03:45.68  GET  401  /api/notifications
Jan 07 09:02:45.67  GET  401  /api/notifications
Jan 07 09:01:45.68  GET  401  /api/notifications
Jan 07 09:00:45.66  GET  401  /api/notifications
Jan 07 08:59:45.67  GET  401  /api/notifications
```

**Pattern observé** : Erreurs 401 toutes les ~60 secondes (polling automatique)

## 🔍 Analyse du problème

### 1. **Token JWT expiré**
Le token JWT avait une durée de validité de **7 jours** par défaut, mais :
- Les utilisateurs restent connectés plus longtemps
- Le token expire pendant la session
- Les appels API échouent avec 401

### 2. **Polling des notifications**
L'application fait des appels réguliers à `/api/notifications` :
- Toutes les 60 secondes environ
- Si le token est expiré, tous les appels échouent
- L'utilisateur ne voit plus ses notifications

### 3. **Impact sur les demandes**
Les erreurs 401 peuvent aussi affecter :
- Le chargement des demandes (`/api/demandes`)
- Le chargement des projets (`/api/projets`)
- Le chargement des utilisateurs (`/api/users`)

## 🔧 Solutions appliquées

### 1. **Augmentation de la durée du token JWT**

**Fichier** : `lib/jwt.ts`

```typescript
// AVANT
const JWT_EXPIRES_IN = '7d' // 7 jours

// APRÈS
const JWT_EXPIRES_IN = '30d' // 30 jours de validité
```

**Avantages** :
- ✅ Les utilisateurs restent connectés plus longtemps
- ✅ Moins de déconnexions inattendues
- ✅ Meilleure expérience utilisateur

### 2. **Ajout de l'expiration dans le token**

```typescript
export function generateToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    phone: user.phone,
    email: user.email,
    role: user.role,
  }

  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN // ✅ Expiration explicite
  }

  return jwt.sign(payload, JWT_SECRET, options)
}
```

### 3. **Logs de debugging améliorés**

**Fichier** : `app/api/notifications/route.ts`

```typescript
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    console.log('🔑 [API-NOTIFICATIONS] Tentative d\'accès aux notifications')
    console.log('   - Authorization header présent:', !!authHeader)
    
    const currentUser = await getCurrentUser(request)

    if (!currentUser) {
      console.log('❌ [API-NOTIFICATIONS] Échec authentification - Token invalide ou expiré')
      return NextResponse.json({ success: false, error: "Non authentifié" }, { status: 401 })
    }
    
    console.log('✅ [API-NOTIFICATIONS] Utilisateur authentifié:', currentUser.nom, currentUser.prenom)
    // ...
  }
}
```

**Logs attendus** :
- 🔑 Tentative d'accès
- ✅ Authentification réussie OU ❌ Échec
- 📊 Nombre de notifications trouvées

## 📊 Vérifications à effectuer

### 1. **Vérifier le token dans le navigateur**

```javascript
// Dans la console du navigateur (F12)
const token = localStorage.getItem('token')
console.log('Token présent:', !!token)

// Décoder le token pour voir l'expiration
if (token) {
  const parts = token.split('.')
  const payload = JSON.parse(atob(parts[1]))
  console.log('Token expire le:', new Date(payload.exp * 1000))
  console.log('Token expiré:', Date.now() > payload.exp * 1000)
}
```

### 2. **Vérifier les logs serveur**

Après le déploiement, surveiller les logs Vercel :
```
🔑 [API-NOTIFICATIONS] Tentative d'accès aux notifications
   - Authorization header présent: true
✅ [API-NOTIFICATIONS] Utilisateur authentifié: Dupont Jean
📊 [API-NOTIFICATIONS] 5 notification(s) trouvée(s)
```

### 3. **Tester la reconnexion**

1. Se connecter à l'application
2. Attendre quelques minutes
3. Vérifier que les notifications se chargent toujours
4. Vérifier qu'il n'y a pas d'erreurs 401 dans les logs

## 🎯 Actions correctives immédiates

### **Pour les utilisateurs actuellement affectés** :

1. **Se déconnecter et se reconnecter**
   - Clic sur le bouton de déconnexion
   - Se reconnecter avec les identifiants
   - Un nouveau token de 30 jours sera généré

2. **Vider le cache du navigateur**
   ```
   Ctrl + Shift + Delete
   → Cocher "Cookies et données de site"
   → Cliquer sur "Effacer les données"
   ```

3. **Forcer le rechargement**
   ```
   Ctrl + F5 (Windows)
   Cmd + Shift + R (Mac)
   ```

## 🔐 Sécurité et bonnes pratiques

### **Durée du token : 30 jours**

**Avantages** :
- ✅ Expérience utilisateur fluide
- ✅ Moins de déconnexions
- ✅ Adapté à une application interne

**Considérations** :
- ⚠️ Pour une application publique, 7-14 jours serait plus sécurisé
- ⚠️ Pour une application bancaire, 1-2 heures serait recommandé
- ✅ Pour une application de gestion interne, 30 jours est acceptable

### **Refresh token (future amélioration)**

Pour une meilleure sécurité, considérer :
```typescript
// Token d'accès court (1 heure)
const accessToken = jwt.sign(payload, SECRET, { expiresIn: '1h' })

// Token de rafraîchissement long (30 jours)
const refreshToken = jwt.sign({ userId }, REFRESH_SECRET, { expiresIn: '30d' })
```

## 📝 Checklist de résolution

- [x] Augmenter la durée du token JWT à 30 jours
- [x] Ajouter l'expiration explicite dans generateToken()
- [x] Ajouter des logs de debugging dans /api/notifications
- [ ] Déployer les changements sur Vercel
- [ ] Demander aux utilisateurs de se reconnecter
- [ ] Surveiller les logs pour confirmer la résolution
- [ ] Vérifier qu'il n'y a plus d'erreurs 401

## 🚀 Déploiement

### **Commandes à exécuter** :

```bash
# 1. Commit des changements
git add .
git commit -m "fix: Augmenter durée token JWT à 30 jours et améliorer logs auth"

# 2. Push vers Vercel
git push origin main

# 3. Vérifier le déploiement
# → Aller sur Vercel dashboard
# → Vérifier que le build est réussi
# → Tester l'application
```

## 📞 Communication aux utilisateurs

**Message à envoyer** :

> 🔧 **Maintenance technique**
> 
> Nous avons corrigé un problème d'authentification qui causait des déconnexions fréquentes.
> 
> **Action requise** : Veuillez vous déconnecter et vous reconnecter pour bénéficier de la correction.
> 
> Merci de votre compréhension ! 🙏

## 🔗 Fichiers modifiés

1. **lib/jwt.ts**
   - Durée du token : 7d → 30d
   - Ajout de l'expiration explicite

2. **app/api/notifications/route.ts**
   - Logs de debugging améliorés
   - Traçabilité des erreurs d'authentification

3. **DIAGNOSTIC-ERREURS-401.md** (ce fichier)
   - Guide complet de diagnostic et résolution

## ✅ Résultat attendu

Après le déploiement et la reconnexion des utilisateurs :
- ✅ Plus d'erreurs 401 sur /api/notifications
- ✅ Notifications chargées correctement
- ✅ Demandes visibles pour tous les utilisateurs
- ✅ Session stable pendant 30 jours
- ✅ Logs clairs pour le debugging

## 📊 Monitoring post-déploiement

**À surveiller dans les logs Vercel** :

1. **Succès d'authentification** :
   ```
   ✅ [API-NOTIFICATIONS] Utilisateur authentifié: ...
   ```

2. **Absence d'erreurs 401** :
   - Vérifier qu'il n'y a plus de lignes `GET 401 /api/notifications`

3. **Chargement des demandes** :
   ```
   📊 [API-DEMANDES] X demande(s) trouvée(s) pour employe (Nom Prénom)
   ```

---

**Statut** : ✅ CORRECTIONS APPLIQUÉES - EN ATTENTE DE DÉPLOIEMENT

**Prochaine étape** : Déployer sur Vercel et demander aux utilisateurs de se reconnecter

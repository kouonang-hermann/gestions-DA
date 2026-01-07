# 🔍 DIAGNOSTIC - DEMANDES INVISIBLES POUR EMPLOYÉS

## 📋 Problème rapporté
Un utilisateur a créé une demande hier et ne la voit plus ce matin sur son interface.

## 🔎 Analyse du code

### 1. **API Backend** (`/api/demandes/route.ts`)
```typescript
case "employe":
  whereClause = {
    technicienId: currentUser.id  // ✅ Filtre correct
  }
```
**Statut**: ✅ Le filtre est correct - les employés ne voient QUE leurs propres demandes

### 2. **Dashboard Frontend** (`employe-dashboard.tsx`)
```typescript
default:
  // Pour les employés normaux, leurs propres demandes
  return demandes.filter(d => d.technicienId === currentUser.id)
```
**Statut**: ✅ Le filtre frontend est également correct

### 3. **Store Zustand** (`useStore.ts`)
```typescript
loadDemandes: async (filters = {}) => {
  const response = await fetch('/api/demandes', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
}
```
**Statut**: ✅ Le chargement utilise le token d'authentification

## 🐛 Causes possibles

### A. **Problème d'authentification**
- Token expiré ou invalide
- Session utilisateur perdue
- Utilisateur déconnecté/reconnecté avec un autre compte

### B. **Problème de données**
- La demande a été créée avec un `technicienId` différent
- La demande a été supprimée
- La demande est en statut "brouillon" et l'utilisateur ne regarde pas la bonne carte

### C. **Problème de cache**
- Les données ne sont pas rechargées après la connexion
- Cache navigateur obsolète
- État du store non synchronisé

### D. **Problème de timing**
- Demande créée hier soir mais non sauvegardée correctement
- Erreur réseau lors de la création
- Transaction base de données non commitée

## 🔧 Solutions implémentées

### 1. **Logs de debugging améliorés**
Ajout de logs détaillés dans l'API pour tracer :
- ID de l'utilisateur connecté
- Email de l'utilisateur
- Filtre appliqué (technicienId)
- Nombre de demandes trouvées
- Détails de chaque demande si trouvée
- Alerte si aucune demande trouvée

### 2. **Requêtes SQL de vérification**

#### Vérifier les demandes de l'utilisateur :
```sql
-- Remplacer 'PHONE_NUMBER' par le numéro de téléphone de l'utilisateur
SELECT 
    d.numero,
    d.status,
    d.type,
    d."dateCreation",
    d."technicienId",
    u.nom || ' ' || u.prenom as createur,
    u.phone as createur_phone,
    p.nom as projet
FROM demandes d
JOIN users u ON d."technicienId" = u.id
LEFT JOIN projets p ON d."projetId" = p.id
WHERE u.phone = 'PHONE_NUMBER'
ORDER BY d."dateCreation" DESC;
```

#### Vérifier toutes les demandes créées hier :
```sql
SELECT 
    d.numero,
    d.status,
    d.type,
    d."dateCreation",
    u.nom || ' ' || u.prenom as createur,
    u.phone as createur_phone,
    u.email as createur_email
FROM demandes d
JOIN users u ON d."technicienId" = u.id
WHERE d."dateCreation" >= CURRENT_DATE - INTERVAL '1 day'
  AND d."dateCreation" < CURRENT_DATE
ORDER BY d."dateCreation" DESC;
```

#### Vérifier l'ID utilisateur actuel :
```sql
SELECT 
    id,
    nom,
    prenom,
    email,
    phone,
    role
FROM users
WHERE phone = 'PHONE_NUMBER';
```

#### Compter les demandes par utilisateur :
```sql
SELECT 
    u.nom || ' ' || u.prenom as utilisateur,
    u.phone,
    u.email,
    COUNT(d.id) as nombre_demandes,
    COUNT(CASE WHEN d.status = 'brouillon' THEN 1 END) as brouillons,
    COUNT(CASE WHEN d.status != 'brouillon' THEN 1 END) as soumises
FROM users u
LEFT JOIN demandes d ON u.id = d."technicienId"
WHERE u.role = 'employe'
GROUP BY u.id, u.nom, u.prenom, u.phone, u.email
ORDER BY nombre_demandes DESC;
```

## 📊 Étapes de diagnostic

### Étape 1 : Vérifier l'identité de l'utilisateur
1. Demander le numéro de téléphone ou email de l'utilisateur
2. Exécuter la requête SQL pour récupérer son ID
3. Noter l'ID utilisateur

### Étape 2 : Vérifier les demandes de cet utilisateur
1. Exécuter la requête SQL avec le numéro de téléphone
2. Vérifier si des demandes existent
3. Noter les numéros et statuts des demandes

### Étape 3 : Vérifier les logs de l'application
1. Demander à l'utilisateur de se connecter
2. Ouvrir la console du navigateur (F12)
3. Chercher les logs `[API-DEMANDES]`
4. Vérifier :
   - L'ID utilisateur dans les logs
   - Le nombre de demandes retournées
   - Les détails des demandes

### Étape 4 : Vérifier la création de la demande
1. Chercher dans l'historique si la demande a été créée
```sql
SELECT 
    h.action,
    h."nouveauStatus",
    h.commentaire,
    h.timestamp,
    d.numero,
    u.nom || ' ' || u.prenom as utilisateur
FROM history_entries h
JOIN demandes d ON h."demandeId" = d.id
JOIN users u ON h."userId" = u.id
WHERE h.action LIKE '%créé%'
  AND h.timestamp >= CURRENT_DATE - INTERVAL '2 days'
ORDER BY h.timestamp DESC;
```

## 🎯 Actions correctives

### Si la demande existe mais n'est pas visible :

1. **Vérifier le token d'authentification**
```javascript
// Dans la console du navigateur
console.log(localStorage.getItem('token'))
```

2. **Forcer le rechargement des demandes**
```javascript
// Dans la console du navigateur
window.location.reload()
```

3. **Vider le cache**
- Ctrl + Shift + Delete
- Cocher "Cookies et données de site"
- Cliquer sur "Effacer les données"

### Si la demande n'existe pas dans la base :

1. **Vérifier les erreurs de création**
```sql
-- Chercher dans les logs d'erreurs si disponibles
SELECT * FROM error_logs 
WHERE timestamp >= CURRENT_DATE - INTERVAL '2 days'
ORDER BY timestamp DESC;
```

2. **Recréer la demande**
- Demander à l'utilisateur de recréer sa demande
- Surveiller les logs pendant la création

## 🚨 Points de vigilance

1. **Multi-comptes** : Vérifier que l'utilisateur ne s'est pas connecté avec un autre compte
2. **Statut brouillon** : Les brouillons sont dans une carte séparée
3. **Projets** : L'utilisateur doit être assigné au projet pour créer une demande
4. **Permissions** : Vérifier que l'utilisateur a le rôle "employe"

## 📝 Checklist de résolution

- [ ] Identifier l'utilisateur (phone/email)
- [ ] Récupérer l'ID utilisateur depuis la base
- [ ] Vérifier les demandes de cet utilisateur en base
- [ ] Vérifier les logs de l'API lors de la connexion
- [ ] Vérifier le token d'authentification
- [ ] Vérifier que l'utilisateur regarde la bonne carte (pas Brouillons)
- [ ] Vérifier l'historique de création
- [ ] Tester avec un rechargement forcé
- [ ] Vider le cache si nécessaire
- [ ] Recréer la demande si introuvable

## 🔗 Fichiers concernés

- `app/api/demandes/route.ts` - API de récupération des demandes
- `components/dashboard/employe-dashboard.tsx` - Dashboard employé
- `stores/useStore.ts` - Store Zustand pour le chargement
- `components/modals/brouillons-modal.tsx` - Modale des brouillons

# Correction - Gestion des rôles dans les projets

## 📋 Problèmes identifiés

### 1. **Confusion conceptuelle : Rôle global vs Rôle par projet**

**Problème** : L'interface permettait de modifier le "rôle" d'un utilisateur dans un projet, mais dans la structure de données actuelle, un utilisateur n'a qu'**UN seul rôle global** pour toute l'application.

```typescript
// Structure actuelle dans types/index.ts
export interface User {
  id: string
  role: UserRole  // ← UN rôle global pour toute l'application
  projets: string[]  // ← Liste des projets assignés
}
```

**Conséquence** : Modifier le "rôle" d'un utilisateur dans un projet modifiait son rôle dans **TOUS les projets**, ce qui n'était pas l'intention.

### 2. **Rechargement de page après chaque action**

**Problème** : Après chaque ajout/suppression d'utilisateur, la fonction `onProjectUpdated()` était appelée, ce qui déclenchait un rechargement complet de tous les projets via `loadProjets()`.

**Conséquence** : Interface qui "flashe" et mauvaise expérience utilisateur.

---

## ✅ Solutions implémentées

### 1. **Suppression du sélecteur de rôle dans l'interface projet**

**Modifications dans** `components/admin/edit-project-modal.tsx` :

- ❌ **Supprimé** : Le menu déroulant `<select>` pour modifier le rôle
- ✅ **Conservé** : Affichage du rôle actuel de l'utilisateur (badge en lecture seule)
- 📝 **Ajouté** : Commentaire expliquant que le rôle est géré globalement

**Avant** :
```tsx
<select value={user.role} onChange={(e) => handleChangeUserRole(user.id, e.target.value)}>
  <option value="employe">Employé</option>
  ...
</select>
```

**Après** :
```tsx
<Badge className={`text-xs ${getRoleBadgeColor(user.role)}`}>
  {getRoleLabel(user.role)}
</Badge>
```

### 2. **Correction de la fonction `addUserToProject`**

**Modifications dans** `stores/useStore.ts` :

**Avant** (INCORRECT) :
```typescript
set((state) => ({
  users: state.users.map((user) =>
    user.id === userId
      ? { ...user, projets: [...(user.projets || []), projectId], role: (role as any) || user.role }
      : user
  ),
}))
```

**Après** (CORRECT) :
```typescript
set((state) => ({
  users: state.users.map((user) =>
    user.id === userId
      ? { ...user, projets: [...(user.projets || []), projectId] }  // Ajout au projet UNIQUEMENT
      : user
  ),
}))
```

**Impact** : Maintenant, ajouter un utilisateur à un projet n'affecte PAS son rôle global.

### 3. **Optimisation du rechargement**

**Modifications dans** `components/admin/edit-project-modal.tsx` :

- ❌ **Avant** : `onProjectUpdated()` appelé après chaque action (ajout/suppression)
- ✅ **Après** : `onProjectUpdated()` appelé **une seule fois** à la fermeture de la modale

**Code** :
```tsx
<Button onClick={() => {
  onProjectUpdated() // ← Une seule fois à la fermeture
  onClose()
}}>
  Fermer
</Button>
```

**Avantages** :
- ✅ Plus de rechargements multiples
- ✅ Interface plus fluide
- ✅ Meileure performance

---

## 📊 Résultat final

### Ce qui fonctionne maintenant :

1. ✅ **Ajout d'utilisateurs au projet** : Fonctionne correctement, sans modifier le rôle global
2. ✅ **Suppression d'utilisateurs du projet** : Fonctionne correctement
3. ✅ **Affichage du rôle** : Le badge affiche le rôle global de l'utilisateur (lecture seule)
4. ✅ **Performance** : Un seul rechargement à la fermeture de la modale
5. ✅ **Pas de rechargement de page** : Actions instantanées dans la modale

### Où modifier le rôle d'un utilisateur ?

Le rôle d'un utilisateur doit être modifié dans **l'interface de gestion des utilisateurs** (dashboard Super-Admin), pas au niveau d'un projet spécifique.

**Raison** : Le rôle est **global** et affecte les permissions de l'utilisateur dans toute l'application.

---

## 🔮 Évolution future (optionnelle)

Si vous souhaitez vraiment avoir des **rôles différents par projet**, voici l'architecture à implémenter :

### Option A : Table de liaison avec rôle

```typescript
// Nouvelle structure
export interface UserProjetRole {
  userId: string
  projetId: string
  role: UserRole  // Rôle spécifique à ce projet
}

export interface User {
  id: string
  role: UserRole  // Rôle par défaut/global
  projets: string[]  // IDs des projets assignés
  projetRoles?: UserProjetRole[]  // Rôles spécifiques par projet
}
```

### Option B : Map de rôles dans User

```typescript
export interface User {
  id: string
  defaultRole: UserRole  // Rôle par défaut
  projets: string[]  // IDs des projets assignés
  projetRoles: Record<string, UserRole>  // { projetId: role }
}
```

### Modifications nécessaires :

1. **Backend** :
   - Nouvelle table `user_projet_roles`
   - API pour gérer les rôles par projet
   - Logique de permissions tenant compte du contexte projet

2. **Frontend** :
   - Fonction `getUserRoleInProject(userId, projectId)` 
   - Mise à jour de toutes les vérifications de permissions
   - Interface pour modifier le rôle dans un projet

3. **Logique métier** :
   - Ordre de priorité : Rôle projet > Rôle global
   - Gestion des cas où l'utilisateur n'a pas de rôle spécifique au projet

**Estimation** : ~2-3 jours de développement

---

## 📝 Recommandation

Pour la majorité des cas d'usage, **le rôle global suffit**. N'implémentez les rôles par projet que si vous avez un besoin métier réel, par exemple :

- Un utilisateur est "Employé" sur le Projet A mais "Conducteur de Travaux" sur le Projet B
- Les permissions doivent varier selon le projet

Si ce n'est pas le cas, conservez l'architecture actuelle qui est plus simple et plus maintenable.

---

## 🎯 Statut

✅ **PROBLÈME RÉSOLU**

- ✅ La modification de rôle ne cause plus de problème
- ✅ Pas de rechargement de page
- ✅ Interface cohérente avec la structure de données
- ✅ Performance optimisée

**Date** : 2025-10-10
**Version** : v2.0

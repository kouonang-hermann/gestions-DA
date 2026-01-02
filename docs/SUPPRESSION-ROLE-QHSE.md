# 🗑️ SUPPRESSION COMPLÈTE DU RÔLE RESPONSABLE_QHSE

## 📋 Objectif

Supprimer toutes les références au rôle `responsable_qhse` et transférer ses tâches au `responsable_logistique`.

---

## 🎯 Raison de la Suppression

Le rôle `responsable_qhse` fait doublon avec `responsable_logistique`. Pour simplifier l'application et éviter la confusion, toutes les responsabilités QHSE sont maintenant gérées par le responsable logistique.

---

## ✅ Modifications Effectuées

### **1. Schéma Prisma** (`prisma/schema.prisma`)

**AVANT :**
```prisma
enum UserRole {
  superadmin
  employe
  conducteur_travaux
  responsable_travaux
  responsable_qhse          // ❌ À SUPPRIMER
  responsable_logistique
  responsable_appro
  charge_affaire
  responsable_livreur
}
```

**APRÈS :**
```prisma
enum UserRole {
  superadmin
  employe
  conducteur_travaux
  responsable_travaux
  responsable_logistique    // ✅ Gère maintenant les tâches QHSE
  responsable_appro
  charge_affaire
  responsable_livreur
}
```

### **2. Authentification** (`lib/auth-local.ts`)

**Suppression de `responsable_qhse` de la liste des rôles autorisés à créer des demandes.**

### **3. Composants Frontend**

**Fichiers modifiés :**
- `components/admin/create-user-modal.tsx` - Liste des rôles disponibles
- `components/admin/edit-project-modal.tsx` - Badges de rôles
- `components/admin/create-project-modal.tsx` - Sélection de rôles
- `components/admin/manage-admin-roles.tsx` - Gestion des rôles
- `components/dashboard/super-admin-dashboard.tsx` - Affichage des rôles
- `components/modals/details-modal.tsx` - Traduction des rôles
- `components/modals/project-details-modal.tsx` - Traduction des rôles
- `components/cloture/universal-closure-list.tsx` - Traduction des rôles
- `components/mobile/universal-mobile-injector.tsx` - Interface mobile

**Actions effectuées :**
- Suppression de toutes les entrées `responsable_qhse`
- Suppression des traductions "Responsable QHSE"
- Suppression des badges colorés pour ce rôle
- Suppression des actions spécifiques QHSE

---

## 🔄 Migration de la Base de Données

### **Script de Migration Créé**

**Fichier :** `scripts/remove-qhse-role.js`

**Ce que fait le script :**

1. **Migrer les utilisateurs :**
   ```sql
   UPDATE users 
   SET role = 'responsable_logistique' 
   WHERE role = 'responsable_qhse'
   ```

2. **Migrer les champs de validation :**
   ```sql
   UPDATE demandes 
   SET "validationLogistique" = "validationQHSE",
       "validationQHSE" = NULL
   WHERE "validationQHSE" IS NOT NULL
   ```

3. **Mettre à jour l'historique :**
   ```sql
   UPDATE history_entries 
   SET action = REPLACE(action, 'QHSE', 'Logistique')
   WHERE action LIKE '%QHSE%'
   ```

### **Exécution de la Migration**

```bash
# Étape 1 : Redémarrer le PC pour débloquer Prisma
# (Fermer tous les processus Node.js)

# Étape 2 : Exécuter la migration de la base de données
node scripts/remove-qhse-role.js

# Étape 3 : Régénérer le client Prisma
npx prisma generate

# Étape 4 : Créer une migration Prisma
npx prisma migrate dev --name remove_qhse_role

# Étape 5 : Démarrer l'application
npm run dev
```

---

## 📊 Impact sur l'Application

### **Flow de Validation**

**AVANT (avec QHSE) :**
```
Outillage : QHSE → Resp Travaux → Chargé Affaire → ...
```

**APRÈS (sans QHSE) :**
```
Outillage : Logistique → Resp Travaux → Chargé Affaire → ...
```

### **Permissions**

Tous les utilisateurs qui avaient le rôle `responsable_qhse` :
- ✅ Sont maintenant `responsable_logistique`
- ✅ Conservent toutes leurs permissions
- ✅ Peuvent valider les demandes d'outillage
- ✅ Ont accès au même dashboard

### **Données Historiques**

- ✅ Toutes les validations QHSE sont migrées vers Logistique
- ✅ L'historique est mis à jour automatiquement
- ✅ Aucune perte de données

---

## 🚨 Points d'Attention

### **Avant la Migration**

1. **Backup de la base de données** (OBLIGATOIRE)
   ```bash
   # Créer un backup complet
   pg_dump -h [HOST] -U [USER] -d [DATABASE] > backup_before_qhse_removal.sql
   ```

2. **Vérifier les utilisateurs QHSE**
   ```sql
   SELECT id, nom, prenom, email 
   FROM users 
   WHERE role = 'responsable_qhse'
   ```

3. **Informer les utilisateurs concernés**
   - Leur rôle va changer de "Responsable QHSE" à "Responsable Logistique"
   - Leurs permissions restent identiques
   - Aucun impact sur leur travail quotidien

### **Après la Migration**

1. **Vérifier qu'il ne reste aucun utilisateur QHSE**
   ```sql
   SELECT COUNT(*) FROM users WHERE role = 'responsable_qhse'
   -- Doit retourner 0
   ```

2. **Tester le flow de validation outillage**
   - Créer une demande outillage
   - Vérifier que le responsable logistique peut la valider
   - Vérifier que le flow continue normalement

3. **Vérifier les dashboards**
   - Dashboard Logistique doit afficher les demandes outillage
   - Aucune erreur dans la console
   - Toutes les fonctionnalités opérationnelles

---

## 🔧 Rollback en Cas de Problème

Si la migration pose problème, restaurer depuis le backup :

```bash
# Arrêter l'application
# Restaurer la base de données
psql -h [HOST] -U [USER] -d [DATABASE] < backup_before_qhse_removal.sql

# Revenir au commit précédent
git revert HEAD

# Régénérer Prisma avec l'ancien schéma
npx prisma generate

# Redémarrer l'application
npm run dev
```

---

## 📝 Checklist de Migration

- [ ] **Backup de la base de données créé**
- [ ] **Utilisateurs QHSE identifiés et informés**
- [ ] **Script de migration testé en environnement de dev**
- [ ] **Migration exécutée : `node scripts/remove-qhse-role.js`**
- [ ] **Client Prisma régénéré : `npx prisma generate`**
- [ ] **Migration Prisma créée : `npx prisma migrate dev`**
- [ ] **Application redémarrée : `npm run dev`**
- [ ] **Tests de validation outillage effectués**
- [ ] **Dashboards vérifiés (pas d'erreurs)**
- [ ] **Aucun utilisateur QHSE restant en base**
- [ ] **Historique vérifié (références QHSE migrées)**

---

## ✅ Résultat Final

Après la migration complète :

- ✅ **Aucune référence à `responsable_qhse` dans le code**
- ✅ **Aucun utilisateur avec le rôle `responsable_qhse` en base**
- ✅ **Toutes les tâches QHSE gérées par `responsable_logistique`**
- ✅ **Flow de validation outillage fonctionnel**
- ✅ **Historique préservé et migré**
- ✅ **Application simplifiée et cohérente**

---

**Date de suppression :** 30 décembre 2025  
**Statut :** ✅ PRÊT POUR MIGRATION  
**Impact :** Aucune perte de fonctionnalité, simplification du système

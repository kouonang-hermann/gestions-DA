# Guide de Migration : Logistique → Livreur

## Vue d'ensemble

Ce guide explique comment effectuer la migration complète de l'application pour renommer les rôles et statuts.

### Changements effectués

| Ancien | Nouveau |
|--------|---------|
| **Rôle** `responsable_logistique` | `responsable_livreur` |
| **Statut** `en_attente_validation_logistique` | `en_attente_validation_livreur` |
| **Champ** `validationLogistique` | `validationLivreur` |

## Étapes de migration

### 1. Backup de la base de données

**IMPORTANT**: Avant toute modification, créez un backup complet de votre base de données.

```bash
# Pour Supabase/PostgreSQL
pg_dump -h [HOST] -U [USER] -d [DATABASE] > backup_avant_migration.sql
```

### 2. Exécution du script de migration SQL

Le script de migration SQL effectue automatiquement :

- ✅ Backup des tables User, Demande, HistoryEntry
- ✅ Migration des rôles utilisateurs
- ✅ Migration des statuts de demandes
- ✅ Migration des champs de validation
- ✅ Migration de l'historique
- ✅ Vérifications de cohérence

**Exécution**:

```bash
# Environnement de test d'abord !
psql -h [HOST] -U [USER] -d [DATABASE] -f prisma/migrations/migration_roles.sql

# Vérifier les résultats avant de passer en production
```

### 3. Vérifications post-migration

Après l'exécution du script, vérifiez :

```sql
-- Vérifier qu'il ne reste plus d'anciennes valeurs
SELECT COUNT(*) FROM "Demande" WHERE status = 'en_attente_validation_logistique';
```

### 4. Déploiement du code frontend

Une fois la base de données migrée, déployez le nouveau code :

```bash
# Build de l'application
npm run build

# Déploiement (selon votre plateforme)
vercel deploy --prod
# ou
npm run deploy
```

### 5. Tests de validation

Testez les fonctionnalités suivantes :

#### Tests utilisateurs
- [ ] Connexion avec un utilisateur "responsable_livreur" (ancien responsable_logistique)
- [ ] Vérifier que les dashboards s'affichent correctement
- [ ] Vérifier que les permissions sont correctes

#### Tests de workflow
- [ ] Créer une nouvelle demande matériel
- [ ] Valider par conducteur → doit passer à "en_attente_validation_logistique"
- [ ] Valider par responsable logistique → doit continuer le flow
- [ ] Valider jusqu'à "en_attente_validation_livreur"
- [ ] Valider par livreur → doit continuer vers demandeur

#### Tests d'affichage
- [ ] Vérifier les labels dans les dashboards
- [ ] Vérifier les badges de statut
- [ ] Vérifier les modales de détails
- [ ] Vérifier l'historique des demandes

### 6. Nettoyage (après validation complète)

Une fois que tout fonctionne correctement pendant plusieurs jours :

```sql
-- Supprimer les tables de backup
DROP TABLE IF EXISTS "User_backup";
DROP TABLE IF EXISTS "Demande_backup";
DROP TABLE IF EXISTS "HistoryEntry_backup";
```

## Rollback en cas de problème

Si vous rencontrez des problèmes, vous pouvez restaurer l'état précédent :

```sql
-- Restaurer depuis les tables de backup
DELETE FROM "User";
INSERT INTO "User" SELECT * FROM "User_backup";

DELETE FROM "Demande";
INSERT INTO "Demande" SELECT * FROM "Demande_backup";

DELETE FROM "HistoryEntry";
INSERT INTO "HistoryEntry" SELECT * FROM "HistoryEntry_backup";
```

Ou restaurer depuis le dump complet :

```bash
psql -h [HOST] -U [USER] -d [DATABASE] < backup_avant_migration.sql
```

## Nouveau workflow de validation

### Demandes Matériel
```
Création 
  ↓
Conducteur (en_attente_validation_conducteur)
  ↓
Responsable Logistique (en_attente_validation_logistique)
  ↓
Responsable Travaux (en_attente_validation_responsable_travaux)
  ↓
Chargé d'Affaire (en_attente_validation_charge_affaire)
  ↓
Appro (en_attente_preparation_appro)
  ↓
Livreur (en_attente_validation_livreur) ← Ancien Logistique
  ↓
Demandeur (en_attente_validation_finale_demandeur)
  ↓
Clôturée
```

### Demandes Outillage
```
Création 
  ↓
Responsable Logistique (en_attente_validation_logistique)
  ↓
Responsable Travaux (en_attente_validation_responsable_travaux)
  ↓
Chargé d'Affaire (en_attente_validation_charge_affaire)
  ↓
Appro (en_attente_preparation_appro)
  ↓
Livreur (en_attente_validation_livreur) ← Ancien Logistique
  ↓
Demandeur (en_attente_validation_finale_demandeur)
  ↓
Clôturée
```

## Fichiers modifiés

### Types et configuration
- ✅ `types/index.ts` - Types UserRole et DemandeStatus
- ⏳ `lib/auth.ts` - Permissions et autorisations
- ⏳ `prisma/schema.prisma` - Schéma de base de données

### Composants Dashboard
- ⏳ `components/dashboard/responsable-logistique-dashboard.tsx` → `responsable-livreur-dashboard.tsx`

### Composants de validation
- ⏳ `components/validation/validation-demandes-list.tsx`
- ⏳ `components/logistique/` → `components/livreur/`

### Routes API
- ⏳ `app/api/demandes/route.ts` - Flow de validation
- ⏳ Toutes les routes API utilisant les rôles

### Store et services
- ⏳ `stores/useStore.ts` - Données de test et logique
- ⏳ `services/notificationService.ts` - Notifications email

### Modales et UI
- ⏳ Tous les fichiers dans `components/modals/`
- ⏳ Tous les mappings de statuts et couleurs

## Support

En cas de problème pendant la migration :

1. **Ne paniquez pas** - Les backups sont là pour ça
2. **Vérifiez les logs** - Consultez les logs de l'application et de la base de données
3. **Testez en environnement de test** - Toujours tester avant la production
4. **Documentez les problèmes** - Notez tout problème rencontré pour améliorer ce guide

## Checklist finale

- [ ] Backup de la base de données effectué
- [ ] Script SQL exécuté en test
- [ ] Vérifications SQL passées
- [ ] Script SQL exécuté en production
- [ ] Code frontend déployé
- [ ] Tests utilisateurs OK
- [ ] Tests de workflow OK
- [ ] Tests d'affichage OK
- [ ] Monitoring pendant 48h
- [ ] Nettoyage des backups (après validation)

---

**Date de création**: 27 décembre 2024  
**Version**: 1.0  
**Auteur**: Équipe de développement

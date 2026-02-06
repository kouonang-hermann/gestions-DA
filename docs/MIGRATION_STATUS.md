# État de la Migration : Logistique → Livreur

**Date**: 27 décembre 2024  
**Statut**: En cours - 60% complété

## Résumé des changements

### Changements effectués

| Ancien | Nouveau | Type |
|--------|---------|------|
| `responsable_logistique` | `responsable_livreur` | Rôle utilisateur |
| `en_attente_validation_logistique` | `en_attente_validation_livreur` | Statut demande |
| `validationLogistique` | `validationLivreur` | Champ validation |

## Fichiers modifiés ✅

### 1. Types et configuration de base
- ✅ `types/index.ts` - Types UserRole et DemandeStatus
- ✅ `lib/auth.ts` - Permissions et autorisations
- ✅ `prisma/migrations/migration_roles.sql` - Script de migration SQL créé
- ✅ `docs/MIGRATION_GUIDE.md` - Guide de migration créé

### 2. Routes API principales
- ✅ `app/api/demandes/route.ts` - Flow de validation et logique métier
- ✅ `app/api/demandes/[id]/actions/route.ts` - Actions de validation
- ✅ `app/api/demandes/[id]/route.ts` - Gestion des demandes individuelles

### 3. Scripts et outils
- ✅ `scripts/migrate-roles.ps1` - Script PowerShell pour migration automatique
- ✅ `docs/MIGRATION_STATUS.md` - Ce fichier

## Fichiers restants à modifier ⏳

### Routes API (environ 5 fichiers)
- ⏳ `app/api/demandes/route-local.ts`
- ⏳ `app/api/users/[id]/role/route.ts`
- ⏳ `app/api/seed-db/route.ts`
- ⏳ `lib/auth-local.ts`
- ⏳ `lib/validations.ts`

### Store et Services (environ 5 fichiers)
- ⏳ `stores/useStore.ts` - Données de test et logique
- ⏳ `services/notificationService.ts` - Notifications
- ⏳ `services/emailService.ts` - Templates email
- ⏳ `services/whatsappService.ts` - Messages WhatsApp
- ⏳ `prisma/seed.ts` - Données de seed

### Composants Dashboard (environ 6 fichiers)
- ⏳ `components/dashboard/responsable-logistique-dashboard.tsx` → À renommer en `responsable-livreur-dashboard.tsx`
- ⏳ `components/dashboard/dashboard.tsx` - Routing principal
- ⏳ `components/dashboard/employe-dashboard.tsx`
- ⏳ `components/dashboard/super-admin-dashboard.tsx`
- ⏳ `components/dashboard/universal-dashboard-sections.tsx`

### Composants de validation (environ 5 fichiers)
- ⏳ `components/validation/validation-demandes-list.tsx`
- ⏳ `components/logistique/` → Dossier à renommer en `components/livreur/`
- ⏳ `components/appro/sortie-preparation-list.tsx`
- ⏳ `components/cloture/universal-closure-list.tsx`

### Modales et UI (environ 10 fichiers)
- ⏳ `components/modals/demande-details-modal.tsx` - ✅ Déjà corrigé partiellement
- ⏳ `components/modals/validated-demandes-modal.tsx`
- ⏳ `components/modals/user-details-modal.tsx`
- ⏳ `components/modals/demandes-category-modal.tsx`
- ⏳ `components/modals/details-modal.tsx`
- ⏳ `components/modals/project-details-modal.tsx`
- ⏳ `components/demandes/demande-detail-modal.tsx`
- ⏳ `components/demandes/demandes-list.tsx`
- ⏳ `components/demandes/purchase-request-card.tsx`
- ⏳ `components/layout/navbar.tsx`

### Composants Admin (environ 8 fichiers)
- ⏳ `components/admin/create-user-modal.tsx`
- ⏳ `components/admin/change-user-role-modal.tsx`
- ⏳ `components/admin/edit-project-modal.tsx`
- ⏳ `components/admin/create-project-modal.tsx`
- ⏳ `components/admin/manage-admin-roles.tsx`
- ⏳ `components/admin/project-history-modal.tsx`
- ⏳ `components/admin/notification-integration-example.tsx`
- ⏳ `components/admin/notification-test.tsx`

### Composants Mobile et Charts (environ 5 fichiers)
- ⏳ `components/mobile/universal-mobile-dashboard.tsx`
- ⏳ `components/mobile/universal-mobile-injector.tsx`
- ⏳ `components/charts/requests-flow-chart.tsx`
- ⏳ `components/charts/user-requests-chart.tsx`
- ⏳ `app/dashboard/page.tsx`

## Nouveau workflow de validation

### Demandes Matériel
```
Création 
  ↓
Conducteur (en_attente_validation_conducteur)
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

## Prochaines étapes

### Étape 1: Exécuter le script PowerShell
```powershell
cd "c:\Users\Lenovo\OneDrive\Documents\gestion-demandes-materiel (7)"
.\scripts\migrate-roles.ps1
```

Ce script va automatiquement mettre à jour tous les fichiers TypeScript/TSX restants.

### Étape 2: Renommer les fichiers et dossiers
```powershell
# Renommer le dashboard Logistique
Rename-Item "components/dashboard/responsable-logistique-dashboard.tsx" "responsable-livreur-dashboard.tsx"

# Renommer le dossier logistique
 Rename-Item "components/logistique" "livreur"
```

### Étape 3: Exécuter le script de migration SQL
```bash
# Se connecter à la base de données
psql -h [HOST] -U [USER] -d [DATABASE]

# Exécuter le script
\i prisma/migrations/migration_roles.sql
```

### Étape 4: Tester l'application
1. Compiler l'application: `npm run build`
2. Vérifier qu'il n'y a pas d'erreurs TypeScript
3. Démarrer l'application: `npm run dev`
4. Tester chaque rôle:
   - Connexion avec responsable_livreur (ancien logistique)
   - Créer et valider des demandes
   - Vérifier le workflow complet

### Étape 5: Déploiement
1. Commit des changements
2. Push vers le repository
3. Déployer sur Vercel/production
4. Surveiller les logs

## Commandes utiles

### Rechercher les occurrences restantes
```powershell
# Rechercher "responsable_logistique" dans les anciens contextes
Get-ChildItem -Recurse -Include *.ts,*.tsx | Select-String -Pattern "responsable_logistique"
```

### Vérifier la cohérence
```powershell
# Compter les occurrences
(Get-ChildItem -Recurse -Include *.ts,*.tsx | Select-String -Pattern "responsable_logistique").Count
(Get-ChildItem -Recurse -Include *.ts,*.tsx | Select-String -Pattern "en_attente_validation_logistique").Count
```

## Notes importantes

### ⚠️ Attention
1. **Ne pas exécuter en production sans tests complets**
2. **Faire un backup complet de la base de données avant la migration SQL**
3. **Tester en environnement de développement d'abord**
4. **Vérifier que tous les utilisateurs sont informés du changement**

### 📝 Logs à surveiller
- Erreurs de compilation TypeScript
- Erreurs d'authentification
- Erreurs de permissions
- Workflow de validation cassé
- Notifications email/WhatsApp

### 🔍 Points de vérification
- [ ] Tous les fichiers TypeScript compilent sans erreur
- [ ] La base de données est migrée avec succès
- [ ] Les utilisateurs peuvent se connecter
- [ ] Le workflow de validation fonctionne
- [ ] Les dashboards affichent les bonnes données
- [ ] Les permissions sont correctes
- [ ] Les notifications fonctionnent

## Support

En cas de problème:
1. Consulter les logs de l'application
2. Vérifier le fichier `MIGRATION_GUIDE.md`
3. Restaurer depuis le backup si nécessaire
4. Contacter l'équipe de développement

---

**Dernière mise à jour**: 27 décembre 2024  
**Progression**: 60% (Fichiers critiques terminés, reste les composants UI)

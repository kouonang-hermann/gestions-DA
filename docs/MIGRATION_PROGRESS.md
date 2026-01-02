# Progression de la Migration QHSE → Logistique et Logistique → Livreur

**Date**: 27 décembre 2024  
**Statut**: 75% complété

## ✅ Fichiers complètement migrés

### Backend et Configuration
1. ✅ `types/index.ts` - Types de base (UserRole, DemandeStatus, champs validation)
2. ✅ `lib/auth.ts` - Permissions et autorisations
3. ✅ `app/api/demandes/route.ts` - Routes API principales
4. ✅ `app/api/demandes/[id]/actions/route.ts` - Actions de validation
5. ✅ `stores/useStore.ts` - Store Zustand (flows, validations, signatures)

### Scripts et Documentation
6. ✅ `prisma/migrations/migration_qhse_to_logistique.sql` - Script SQL de migration
7. ✅ `docs/MIGRATION_GUIDE.md` - Guide de migration complet
8. ✅ `docs/MIGRATION_STATUS.md` - État d'avancement
9. ✅ `docs/MIGRATION_PROGRESS.md` - Ce fichier

## ⏳ Fichiers restants à migrer (47 occurrences dans 27 fichiers)

### Backend (6 fichiers)
- ⏳ `lib/auth-local.ts` (3 occurrences)
- ⏳ `lib/validations.ts` (1 occurrence)
- ⏳ `app/api/demandes/route-local.ts` (2 occurrences)
- ⏳ `app/api/demandes/[id]/route.ts` (2 occurrences)
- ⏳ `app/api/seed-db/route.ts` (1 occurrence)
- ⏳ `app/api/users/[id]/role/route.ts` (1 occurrence)
- ⏳ `prisma/seed.ts` (2 occurrences)
- ⏳ `services/notificationService.ts` (2 occurrences)

### Dashboards (7 fichiers)
- ⏳ `components/dashboard/dashboard.tsx` (2 occurrences)
- ⏳ `components/dashboard/employe-dashboard.tsx` (7 occurrences)
- ⏳ `components/dashboard/super-admin-dashboard.tsx` (2 occurrences)
- ⏳ `app/dashboard/page.tsx` (1 occurrence)
- ⏳ `components/mobile/universal-mobile-injector.tsx` (3 occurrences)

### Composants de validation et modales (8 fichiers)
- ⏳ `components/validation/validation-demandes-list.tsx` (1 occurrence)
- ⏳ `components/cloture/universal-closure-list.tsx` (1 occurrence)
- ⏳ `components/demandes/demande-detail-modal.tsx` (2 occurrences)
- ⏳ `components/modals/validated-demandes-modal.tsx` (2 occurrences)
- ⏳ `components/modals/details-modal.tsx` (1 occurrence)
- ⏳ `components/modals/project-details-modal.tsx` (1 occurrence)

### Composants Admin (6 fichiers)
- ⏳ `components/admin/create-user-modal.tsx` (1 occurrence)
- ⏳ `components/admin/change-user-role-modal.tsx` (1 occurrence)
- ⏳ `components/admin/create-project-modal.tsx` (1 occurrence)
- ⏳ `components/admin/edit-project-modal.tsx` (2 occurrences)
- ⏳ `components/admin/manage-admin-roles.tsx` (1 occurrence)

### Autres composants (2 fichiers)
- ⏳ `components/layout/navbar.tsx` (1 occurrence)

## 🔄 Fichiers à renommer

### Dashboards
- ⏳ `components/dashboard/qhse-dashboard.tsx` → `logistique-dashboard.tsx`
- ⏳ `components/dashboard/responsable-logistique-dashboard.tsx` → `responsable-livreur-dashboard.tsx`

### Dossiers de composants
- ⏳ `components/qhse/` → `components/logistique/`
- ⏳ `components/logistique/` → `components/livreur/`

## 📊 Résumé des changements

### Rôles
| Ancien | Nouveau |
|--------|---------|
| `responsable_qhse` | `responsable_logistique` |
| `responsable_logistique` | `responsable_livreur` |

### Statuts
| Ancien | Nouveau |
|--------|---------|
| `en_attente_validation_qhse` | `en_attente_validation_logistique` |
| `en_attente_validation_logistique` | `en_attente_validation_livreur` |

### Champs de validation
| Ancien | Nouveau |
|--------|---------|
| `validationQHSE` | `validationLogistique` |
| `validationLogistique` | `validationLivreur` |

## 🎯 Prochaines étapes

### 1. Terminer la migration des fichiers restants
Utiliser la commande grep pour identifier et modifier chaque occurrence:

```powershell
# Rechercher toutes les occurrences
Get-ChildItem -Recurse -Include *.ts,*.tsx | Select-String -Pattern "responsable_qhse|en_attente_validation_qhse|validationQHSE"
```

### 2. Renommer les fichiers et dossiers
```powershell
# Dashboards
Rename-Item "components/dashboard/qhse-dashboard.tsx" "logistique-dashboard.tsx"
Rename-Item "components/dashboard/responsable-logistique-dashboard.tsx" "responsable-livreur-dashboard.tsx"

# Dossiers (si existants)
if (Test-Path "components/qhse") {
    Rename-Item "components/qhse" "logistique"
}
if (Test-Path "components/logistique") {
    Rename-Item "components/logistique" "livreur"
}
```

### 3. Exécuter le script SQL de migration
```sql
-- Se connecter à la base de données Supabase
psql -h [HOST] -U [USER] -d [DATABASE]

-- Exécuter le script
\i prisma/migrations/migration_qhse_to_logistique.sql
```

### 4. Compiler et tester
```bash
# Vérifier les erreurs TypeScript
npm run build

# Lancer en développement
npm run dev

# Tester chaque rôle
```

## ⚠️ Points d'attention

### Erreurs TypeScript actuelles
- Propriété `validationLivreur` manquante dans certaines données de test du store
- À corriger en ajoutant les champs optionnels dans les objets de test

### Vérifications nécessaires
- [ ] Tous les fichiers TypeScript compilent sans erreur
- [ ] La base de données est migrée avec succès
- [ ] Les utilisateurs peuvent se connecter avec les nouveaux rôles
- [ ] Le workflow de validation fonctionne de bout en bout
- [ ] Les dashboards affichent les bonnes données
- [ ] Les permissions sont correctes
- [ ] Les notifications fonctionnent

## 📝 Commandes utiles

### Rechercher les occurrences restantes
```powershell
# Rechercher "responsable_qhse"
Get-ChildItem -Recurse -Include *.ts,*.tsx | Select-String -Pattern "responsable_qhse" -CaseSensitive:$false

# Rechercher "validationQHSE"
Get-ChildItem -Recurse -Include *.ts,*.tsx | Select-String -Pattern "validationQHSE"

# Compter les occurrences
(Get-ChildItem -Recurse -Include *.ts,*.tsx | Select-String -Pattern "responsable_qhse").Count
```

### Remplacements en masse (PowerShell)
```powershell
# Remplacer dans un fichier spécifique
$file = "chemin/vers/fichier.tsx"
$content = Get-Content $file -Raw
$content = $content -replace 'responsable_qhse', 'responsable_logistique'
$content = $content -replace 'en_attente_validation_qhse', 'en_attente_validation_logistique'
$content = $content -replace 'validationQHSE', 'validationLogistique'
Set-Content -Path $file -Value $content -NoNewline
```

## 🔍 Workflow de test recommandé

### Test 1: Connexion et authentification
1. Se connecter en tant que responsable_logistique (ancien QHSE)
2. Vérifier que le dashboard s'affiche correctement
3. Vérifier les permissions

### Test 2: Workflow demande outillage
1. Créer une demande d'outillage en tant qu'employé
2. Valider en tant que responsable_logistique
3. Valider en tant que responsable_travaux
4. Valider en tant que chargé d'affaire
5. Préparer en tant que responsable_appro
6. Valider en tant que responsable_livreur
7. Clôturer en tant que demandeur

### Test 3: Workflow demande matériel
1. Créer une demande de matériel en tant qu'employé
2. Valider en tant que conducteur_travaux
3. Valider en tant que responsable_travaux
4. Valider en tant que chargé d'affaire
5. Préparer en tant que responsable_appro
6. Valider en tant que responsable_livreur
7. Clôturer en tant que demandeur

### Test 4: Permissions
1. Vérifier qu'un responsable_logistique ne peut pas valider des demandes matériel
2. Vérifier qu'un responsable_livreur peut valider toutes les demandes à son étape
3. Vérifier le filtrage par projet

## 📈 Progression

- **Types et configuration**: 100% ✅
- **Routes API**: 90% ✅
- **Store et services**: 95% ✅
- **Composants dashboard**: 30% ⏳
- **Composants validation**: 20% ⏳
- **Composants admin**: 0% ⏳
- **Composants modales**: 30% ⏳

**Total global**: 75% complété

---

**Dernière mise à jour**: 27 décembre 2024, 17:10  
**Prochaine action**: Continuer la migration des fichiers restants manuellement

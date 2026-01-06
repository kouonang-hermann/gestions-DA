# 🔧 Solution - Erreur HTTP 500 sur /api/demandes

## ❌ Problème identifié

**Erreur** : `Erreur HTTP: 500` sur `/api/demandes`

**Cause** : Les nouveaux champs `nombreRejets` et `statusPrecedent` n'existent pas encore dans la base de données, mais le code backend essaie de les utiliser.

---

## ✅ Solution en 3 étapes

### Étape 1 : Appliquer la migration SQL

**Connectez-vous à Supabase** (https://supabase.com → Votre projet → SQL Editor)

Exécutez ce SQL :

```sql
-- Ajouter les nouveaux champs pour le workflow de rejet
ALTER TABLE "demandes" ADD COLUMN IF NOT EXISTS "nombreRejets" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "demandes" ADD COLUMN IF NOT EXISTS "statusPrecedent" TEXT;

-- Commentaires pour documentation
COMMENT ON COLUMN "demandes"."nombreRejets" IS 'Compteur de rejets pour traçabilité';
COMMENT ON COLUMN "demandes"."statusPrecedent" IS 'Statut avant le rejet (pour retour arrière)';
```

**Vérification** : Exécutez cette requête pour confirmer :

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'demandes' 
  AND column_name IN ('nombreRejets', 'statusPrecedent');
```

Vous devriez voir :
```
nombreRejets    | integer | NO  | 0
statusPrecedent | text    | YES | NULL
```

---

### Étape 2 : Régénérer Prisma

**Option A** : Utiliser le script automatique

Double-cliquez sur `fix-and-restart.bat` (créé pour vous)

**Option B** : Manuellement

```bash
# Supprimer le cache
Remove-Item -Path ".next" -Recurse -Force

# Régénérer Prisma
npx prisma generate

# Relancer l'app
npm run dev
```

---

### Étape 3 : Vérifier que l'erreur est résolue

1. Ouvrir `http://localhost:3000`
2. Se connecter avec un utilisateur test
3. Vérifier que le dashboard se charge sans erreur 500

---

## 🔍 Vérifications supplémentaires

### Dans la console du navigateur

**Avant** (avec erreur) :
```
❌ [STORE] Erreur API demandes: Erreur HTTP: 500
```

**Après** (corrigé) :
```
✅ [STORE] 15 demandes chargées
📊 [STORE] Répartition par statut: {...}
```

### Dans les logs serveur

**Avant** (avec erreur) :
```
GET /api/demandes 500 in 3932ms
Error: Column 'nombreRejets' does not exist
```

**Après** (corrigé) :
```
GET /api/demandes 200 in 150ms
```

---

## 🎯 Après la correction

Une fois l'erreur 500 résolue, vous pourrez :

1. ✅ Accéder à l'application normalement
2. ✅ Voir vos demandes dans le dashboard
3. ✅ Commencer à tester le workflow de rejet

**Suivez ensuite** : `GUIDE-EXECUTION-TESTS.md` pour tester le nouveau workflow

---

## 🐛 Si l'erreur persiste

### Vérifier que la migration est bien appliquée

```sql
-- Dans Supabase SQL Editor
SELECT * FROM demandes LIMIT 1;
```

Si vous voyez une erreur sur `nombreRejets` ou `statusPrecedent`, la migration n'est pas appliquée.

### Vérifier les logs Prisma

```bash
# Activer les logs Prisma
$env:DEBUG="prisma:*"
npm run dev
```

### Vérifier le schéma Prisma

Le fichier `prisma/schema.prisma` doit contenir :

```prisma
model Demande {
  // ... autres champs ...
  nombreRejets    Int            @default(0)
  statusPrecedent DemandeStatus?
  // ... autres champs ...
}
```

---

## 📞 Checklist de résolution

- [ ] Migration SQL exécutée dans Supabase
- [ ] Vérification des colonnes réussie
- [ ] Cache `.next` supprimé
- [ ] `npx prisma generate` exécuté
- [ ] Application relancée
- [ ] Erreur 500 disparue
- [ ] Dashboard se charge correctement

---

## ✅ Résumé

**Problème** : Erreur 500 car les nouveaux champs n'existent pas en base  
**Solution** : Appliquer la migration SQL + régénérer Prisma  
**Durée** : 2-3 minutes  
**Prochaine étape** : Tester le workflow de rejet

Une fois corrigé, l'application fonctionnera normalement et vous pourrez tester le nouveau système de rejet avec retour arrière ! 🎉

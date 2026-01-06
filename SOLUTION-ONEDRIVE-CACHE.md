# 🔧 Solution - Problème de Cache Next.js avec OneDrive

## ❌ Problème identifié

**Erreur** : Multiples erreurs `ENOENT` sur les fichiers cache de Next.js

```
Error: ENOENT: no such file or directory
path: '.next\cache\webpack\...\0.pack.gz'
```

**Cause racine** : OneDrive synchronise le dossier `.next` en temps réel, ce qui crée des conflits avec les fichiers temporaires de Next.js qui changent constamment.

---

## ✅ Solution Immédiate

### Utiliser le script de démarrage propre

J'ai créé **`start-dev-clean.bat`** qui :
1. Arrête tous les processus Node
2. Supprime complètement le cache `.next`
3. Régénère Prisma
4. Lance l'application proprement

**Double-cliquez sur `start-dev-clean.bat`** pour démarrer l'application.

---

## 🛡️ Solution Permanente (Recommandée)

### Option 1 : Exclure .next de OneDrive (RECOMMANDÉ)

1. **Ouvrir l'Explorateur de fichiers**
2. **Naviguer vers** : `C:\Users\Lenovo\OneDrive\Documents\gestion-demandes-materiel (7)`
3. **Clic droit sur le dossier `.next`** (s'il existe)
4. **Sélectionner** : "Toujours conserver sur cet appareil" → puis "Libérer de l'espace"
5. **OU** : Clic droit → Propriétés → Décocher "Synchroniser avec OneDrive"

### Option 2 : Déplacer le projet hors de OneDrive

**Déplacer le projet vers** : `C:\Projects\gestion-demandes-materiel`

```powershell
# Dans PowerShell
Move-Item "C:\Users\Lenovo\OneDrive\Documents\gestion-demandes-materiel (7)" "C:\Projects\gestion-demandes-materiel"
cd "C:\Projects\gestion-demandes-materiel"
npm run dev
```

**Avantages** :
- ✅ Plus de conflits avec OneDrive
- ✅ Meilleure performance
- ✅ Pas de synchronisation inutile des node_modules et .next

---

## 🚀 Démarrage rapide

### Méthode 1 : Script automatique (Recommandé)

```bash
# Double-cliquer sur :
start-dev-clean.bat
```

### Méthode 2 : Commandes manuelles

```powershell
# Arrêter Node
taskkill /F /IM node.exe

# Supprimer le cache
Remove-Item -Path ".next" -Recurse -Force

# Régénérer Prisma
npx prisma generate

# Lancer l'app
npm run dev
```

---

## 🔍 Vérification

### Signes que ça fonctionne

```
✓ Ready in 3.2s
✓ Compiled / in 1.5s
✓ Compiled /api/demandes in 500ms
```

### Signes de problème persistant

```
❌ Error: ENOENT: no such file or directory
❌ [webpack.cache.PackFileCacheStrategy] Caching failed
```

Si les erreurs persistent → Utiliser l'**Option 2** (déplacer hors de OneDrive)

---

## 📋 Checklist de résolution

- [ ] Arrêter tous les processus Node
- [ ] Supprimer complètement le dossier `.next`
- [ ] Exclure `.next` de la synchronisation OneDrive
- [ ] Régénérer le client Prisma
- [ ] Relancer l'application avec `start-dev-clean.bat`
- [ ] Vérifier qu'il n'y a plus d'erreurs ENOENT
- [ ] (Optionnel) Déplacer le projet hors de OneDrive

---

## 🎯 Après la correction

Une fois le problème de cache résolu :

1. ✅ L'application démarre sans erreurs
2. ✅ Pas de warnings webpack
3. ✅ Vous pouvez appliquer la migration SQL
4. ✅ Vous pouvez tester le workflow de rejet

**Prochaine étape** : Suivre `SOLUTION-ERREUR-500.md` pour appliquer la migration SQL

---

## 💡 Pourquoi ce problème arrive

OneDrive synchronise tous les fichiers en temps réel, y compris :
- `node_modules/` (inutile, très lourd)
- `.next/` (cache temporaire qui change constamment)
- Fichiers temporaires de build

Cela crée des **conflits de fichiers** car :
1. Next.js essaie d'écrire un fichier cache
2. OneDrive commence à le synchroniser
3. Next.js essaie de le renommer/supprimer
4. OneDrive bloque l'opération → **ENOENT**

**Solution** : Ne jamais synchroniser les dossiers de build/cache avec OneDrive.

---

## 📞 En cas de problème persistant

Si les erreurs continuent malgré tout :

### Vérifier les processus OneDrive

```powershell
# Arrêter temporairement OneDrive
taskkill /F /IM OneDrive.exe

# Nettoyer et relancer
Remove-Item -Path ".next" -Recurse -Force
npm run dev

# Redémarrer OneDrive après
start "" "C:\Program Files\Microsoft OneDrive\OneDrive.exe"
```

### Vérifier les permissions

```powershell
# Vérifier les droits sur le dossier
icacls ".next"

# Si nécessaire, prendre possession
takeown /F ".next" /R /D Y
```

---

## ✅ Résumé

**Problème** : OneDrive synchronise `.next` → conflits de fichiers  
**Solution rapide** : Utiliser `start-dev-clean.bat`  
**Solution permanente** : Exclure `.next` de OneDrive ou déplacer le projet  
**Durée** : 2-3 minutes  

Une fois corrigé, vous pourrez travailler normalement sans interruption ! 🎉

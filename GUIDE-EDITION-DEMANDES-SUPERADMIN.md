# 📝 Guide d'utilisation - Édition de demandes (Super Admin)

## 🎯 Comment modifier une demande en tant que Super Admin

### Méthode 1 : Double-clic (Rapide)

1. **Connectez-vous** en tant que super admin
2. **Cliquez sur une carte** du dashboard (par exemple "En cours")
3. Une modale s'ouvre avec la liste des demandes
4. **Double-cliquez** sur n'importe quelle ligne du tableau
5. La modale d'édition s'ouvre automatiquement

**Indicateurs visuels :**
- ✅ Curseur en forme de pointeur sur les lignes
- ✅ Tooltip "Double-cliquez pour modifier" au survol

### Méthode 2 : Bouton Modifier

1. **Connectez-vous** en tant que super admin
2. **Cliquez sur une carte** du dashboard
3. Dans le tableau, **cliquez sur le bouton orange** avec l'icône crayon
4. La modale d'édition s'ouvre

## 🔍 Où trouver cette fonctionnalité ?

### Dashboard Super Admin

La fonctionnalité est disponible quand vous cliquez sur :
- **Carte "En cours"** → Liste de toutes les demandes en cours
- **Graphique en secteurs** → Cliquez sur Matériel ou Outillage
- **Toute autre vue de demandes**

### Ce que vous pouvez modifier

Dans la modale d'édition, vous pouvez modifier **TOUS** les champs :

#### Informations générales
- ✏️ **Type** : Matériel / Outillage
- ✏️ **Projet** : Changer le projet
- ✏️ **Demandeur** : Changer qui a fait la demande
- ✏️ **Date de livraison souhaitée**
- ✏️ **Description**
- ✏️ **Commentaires**

#### Articles
- ✏️ **Référence** de chaque article
- ✏️ **Nom** de l'article
- ✏️ **Unité** (pièce, kg, m, etc.)
- ✏️ **Quantité demandée**
- ➕ **Ajouter** de nouveaux articles
- 🗑️ **Supprimer** des articles existants

## 🚀 Test rapide

Pour tester immédiatement :

1. Allez sur votre **Dashboard Super Admin**
2. Cliquez sur la carte **"En cours"** (celle avec l'icône horloge orange)
3. Dans la modale qui s'ouvre, vous devriez voir :
   - Un tableau avec vos demandes
   - Des boutons d'action à droite (œil, crayon, poubelle)
   - Le curseur change en pointeur quand vous survolez une ligne
4. **Double-cliquez** sur n'importe quelle ligne OU cliquez sur le bouton crayon orange
5. La modale d'édition s'ouvre !

## ❓ Dépannage

### "Je ne vois pas le bouton Modifier"

**Vérification :**
- ✅ Êtes-vous bien connecté en tant que **superadmin** ?
- ✅ Avez-vous cliqué sur une carte pour ouvrir la liste des demandes ?
- ✅ Le tableau des demandes s'affiche-t-il ?

**Solution :**
- Vérifiez dans la console du navigateur (F12) s'il y a des erreurs
- Assurez-vous que `currentUser.role === "superadmin"`

### "Le double-clic ne fonctionne pas"

**Vérification :**
- ✅ Le curseur change-t-il en pointeur au survol des lignes ?
- ✅ Voyez-vous le tooltip "Double-cliquez pour modifier" ?

**Solution :**
- Essayez d'utiliser le **bouton Modifier** (icône crayon orange) à la place
- Rechargez la page (Ctrl+R ou F5)

### "La modale d'édition ne s'ouvre pas"

**Vérification :**
- ✅ Vérifiez la console du navigateur (F12) pour des erreurs
- ✅ Assurez-vous que le composant `EditDemandeModal` est bien chargé

**Solution :**
- Redémarrez le serveur de développement
- Vérifiez que tous les fichiers ont été sauvegardés

## 📋 Checklist de vérification

Avant de dire que ça ne fonctionne pas, vérifiez :

- [ ] Je suis connecté en tant que **superadmin**
- [ ] J'ai cliqué sur une **carte du dashboard** (pas juste regardé le dashboard)
- [ ] La **modale avec le tableau** s'est ouverte
- [ ] Je vois les **boutons d'action** (œil, crayon, poubelle) dans le tableau
- [ ] J'ai essayé de **double-cliquer** sur une ligne
- [ ] J'ai essayé de **cliquer sur le bouton crayon orange**
- [ ] J'ai vérifié la **console du navigateur** (F12) pour des erreurs

## 🎬 Étapes exactes pour tester

```
1. Dashboard Super Admin
   ↓
2. Cliquer sur carte "En cours" (ou n'importe quelle carte)
   ↓
3. Modale "Mes demandes en cours" s'ouvre
   ↓
4. Tableau avec liste des demandes visible
   ↓
5. SOIT : Double-cliquer sur une ligne
   SOIT : Cliquer sur bouton crayon orange
   ↓
6. Modale "Modifier la demande DEM-XXXX" s'ouvre
   ↓
7. Modifier les champs
   ↓
8. Cliquer sur "Enregistrer les modifications"
   ↓
9. Demande mise à jour !
```

## 🔧 Fichiers modifiés

Si vous voulez vérifier le code :

1. **Modale d'édition** : `components/admin/edit-demande-modal.tsx`
2. **API endpoint** : `app/api/demandes/[id]/route.ts`
3. **Intégration double-clic** : `components/modals/demandes-category-modal.tsx`
4. **Dashboard super admin** : `components/dashboard/super-admin-dashboard.tsx`

## 📞 Support

Si après avoir suivi ce guide, la fonctionnalité ne fonctionne toujours pas :

1. Ouvrez la console du navigateur (F12)
2. Allez dans l'onglet "Console"
3. Reproduisez le problème
4. Copiez les erreurs affichées en rouge
5. Partagez ces erreurs pour diagnostic

---

**Date de création** : 14 janvier 2026  
**Version** : 1.0  
**Statut** : ✅ Fonctionnalité implémentée et testée

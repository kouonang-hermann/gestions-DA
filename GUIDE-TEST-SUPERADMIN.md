# 🧪 Guide de Test : Validation Superadmin

Ce guide vous permet de tester que le **superadmin peut valider une demande à n'importe quelle étape** du workflow, indépendamment des restrictions de rôle.

## 📋 Objectif du test

Vérifier que le superadmin peut :
- ✅ Valider une demande en statut `en_attente_validation_conducteur`
- ✅ Valider une demande en statut `en_attente_validation_responsable_travaux`
- ✅ Valider une demande en statut `en_attente_validation_charge_affaire`
- ✅ Faire progresser la demande vers `en_attente_preparation_appro`
- ✅ Bypasser toutes les vérifications de rôle strictes

## 🚀 Étapes du test

### **Étape 1 : Créer les données de test**

Exécutez le script SQL suivant dans votre base de données :

```bash
# Depuis le terminal PowerShell
psql $DATABASE_URL -f scripts/test-superadmin-validation.sql
```

Ou copiez le contenu de `scripts/test-superadmin-validation.sql` et exécutez-le dans votre outil de gestion de base de données.

**Ce script crée :**
- ✅ Un projet de test : `Projet Test Superadmin`
- ✅ Un utilisateur employé : `test.employe@test.com`
- ✅ Un article de test : `Article Test Superadmin`
- ✅ Une demande de test : `DEM-TEST-SUPERADMIN-001` en statut `en_attente_validation_conducteur`

### **Étape 2 : Se connecter en tant que superadmin**

1. Ouvrez l'application dans votre navigateur
2. Connectez-vous avec votre compte **superadmin**
3. Ouvrez la console du navigateur (F12 → Console)

### **Étape 3 : Trouver la demande de test**

1. Allez dans le dashboard
2. Recherchez la demande `DEM-TEST-SUPERADMIN-001`
3. Vérifiez que le statut est `en_attente_validation_conducteur`

### **Étape 4 : Première validation (Conducteur)**

1. Cliquez sur la demande pour ouvrir les détails
2. Cliquez sur le bouton **"Valider"**
3. Ajoutez un commentaire (optionnel) : "Test validation superadmin - étape conducteur"
4. Confirmez la validation

**Logs attendus dans la console :**
```javascript
🔍 [API VALIDATION] Début de la validation:
  - Valideur: [Votre nom] (superadmin)
  - Statut actuel: en_attente_validation_conducteur

👑 [API VALIDATION] Validation par SUPERADMIN - bypass des vérifications de rôle

🔄 [API VALIDATION] Transition calculée: en_attente_validation_conducteur → en_attente_validation_responsable_travaux

💾 [API] Mise à jour de la demande dans la base de données:
  - Nouveau statut: en_attente_validation_responsable_travaux

✅ [API] Demande mise à jour avec succès
```

**Résultat attendu :**
- ✅ Le statut change vers `en_attente_validation_responsable_travaux`
- ✅ Aucune erreur 403 "Seul le conducteur peut valider"
- ✅ Un message de succès s'affiche

### **Étape 5 : Deuxième validation (Responsable Travaux)**

1. Rechargez la page ou retournez au dashboard
2. Ouvrez à nouveau la demande `DEM-TEST-SUPERADMIN-001`
3. Vérifiez que le statut est maintenant `en_attente_validation_responsable_travaux`
4. Cliquez sur **"Valider"** à nouveau
5. Commentaire : "Test validation superadmin - étape responsable travaux"

**Résultat attendu :**
- ✅ Le statut change vers `en_attente_validation_charge_affaire`
- ✅ Aucune erreur 403 "Seul le responsable des travaux peut valider"

### **Étape 6 : Troisième validation (Chargé d'Affaires)**

1. Rechargez et ouvrez à nouveau la demande
2. Vérifiez que le statut est `en_attente_validation_charge_affaire`
3. Cliquez sur **"Valider"**
4. Commentaire : "Test validation superadmin - étape chargé affaires"

**Résultat attendu :**
- ✅ Le statut change vers `en_attente_preparation_appro`
- ✅ Aucune erreur 403 "Seul le chargé d'affaires peut valider"
- ✅ **C'est ici que le problème se produisait avant la correction !**

### **Étape 7 : Vérifier les résultats**

Exécutez le script de vérification :

```bash
psql $DATABASE_URL -f scripts/verify-test-results.sql
```

**Ce script affiche :**
- ✅ L'état actuel de la demande
- ✅ L'historique complet des actions
- ✅ Les signatures de validation
- ✅ Les notifications créées
- ✅ La progression du statut étape par étape

**Résultats attendus :**
```
=== RÉSUMÉ DU TEST ===
✅ Demande de test trouvée
✅ Actions enregistrées dans l'historique (3 actions minimum)
✅ Signatures de validation créées (3 signatures minimum)
✅ Le superadmin a pu valider la demande

=== PROGRESSION DU STATUT ===
Étape 1: en_attente_validation_conducteur → en_attente_validation_responsable_travaux
Étape 2: en_attente_validation_responsable_travaux → en_attente_validation_charge_affaire
Étape 3: en_attente_validation_charge_affaire → en_attente_preparation_appro
```

## ✅ Critères de succès

Le test est **réussi** si :

1. ✅ Le superadmin a pu valider à chaque étape sans erreur 403
2. ✅ Le statut a progressé correctement à chaque validation
3. ✅ Les logs montrent `👑 [API VALIDATION] Validation par SUPERADMIN - bypass des vérifications de rôle`
4. ✅ La demande est arrivée au statut `en_attente_preparation_appro`
5. ✅ L'historique contient toutes les actions avec le rôle "superadmin"

## ❌ Critères d'échec

Le test **échoue** si :

1. ❌ Erreur 403 : "Seul le [rôle] peut valider à cette étape"
2. ❌ Le statut ne change pas après validation
3. ❌ Aucun appel POST à `/api/demandes/[id]/actions` dans les logs réseau
4. ❌ Erreur JavaScript dans la console
5. ❌ La demande reste bloquée à une étape

## 🧹 Nettoyage après le test

Une fois le test terminé, nettoyez les données de test :

```bash
psql $DATABASE_URL -f scripts/cleanup-test-data.sql
```

**Ce script supprime :**
- ✅ La demande de test
- ✅ Les items de la demande
- ✅ L'historique des actions
- ✅ Les signatures de validation
- ✅ Les notifications
- ✅ L'utilisateur de test
- ✅ Le projet de test
- ✅ L'article de test

## 🔍 Troubleshooting

### **Problème : Erreur 403 lors de la validation**

**Cause :** Les corrections ne sont pas déployées sur Vercel.

**Solution :**
```bash
git add .
git commit -m "Fix: Permettre au superadmin de valider à n'importe quelle étape"
git push origin main
```

### **Problème : Aucun appel API visible dans les logs**

**Cause :** Problème d'authentification ou erreur JavaScript.

**Solution :**
1. Vérifiez la console du navigateur pour les erreurs
2. Vérifiez que le token JWT est valide
3. Reconnectez-vous en tant que superadmin

### **Problème : Le statut ne change pas**

**Cause :** La fonction `getNextStatusWithAutoValidation` retourne null.

**Solution :**
1. Vérifiez les logs de la console
2. Vérifiez que le VALIDATION_FLOWS contient le bon flow
3. Vérifiez que le type de demande est correct (materiel/outillage)

## 📊 Logs attendus (complets)

### **Console du navigateur :**
```javascript
[EXECUTE-ACTION] [Votre nom] (superadmin) exécute "valider" sur test-demande-superadmin-001
[EXECUTE-ACTION] Demande DEM-TEST-SUPERADMIN-001: statut=en_attente_validation_conducteur
[AUTO-VALIDATION] Statut cible calculé: en_attente_validation_conducteur → en_attente_validation_responsable_travaux
📤 [EXECUTE-ACTION] Payload: {
  "action": "valider",
  "targetStatus": "en_attente_validation_responsable_travaux",
  "commentaire": "Test validation superadmin - étape conducteur"
}
📥 [EXECUTE-ACTION] Response status: 200
📥 [EXECUTE-ACTION] Response: {
  "success": true,
  "data": {
    "demande": { ... }
  }
}
```

### **Logs serveur (Vercel) :**
```
🔍 [API VALIDATION] Début de la validation:
  - Demande: DEM-TEST-SUPERADMIN-001
  - Statut actuel: en_attente_validation_conducteur
  - Valideur: [Votre nom] (superadmin)

👑 [API VALIDATION] Validation par SUPERADMIN - bypass des vérifications de rôle

🔄 [API] Calcul du prochain statut depuis en_attente_validation_conducteur → en_attente_validation_responsable_travaux
✅ [API] Prochain statut déterminé: en_attente_validation_responsable_travaux

💾 [API] Mise à jour de la demande dans la base de données:
  - Ancien statut: en_attente_validation_conducteur
  - Nouveau statut: en_attente_validation_responsable_travaux
✅ [API] Demande mise à jour avec succès, statut final: en_attente_validation_responsable_travaux
```

## 📝 Rapport de test

Après avoir effectué le test, remplissez ce rapport :

```
Date du test : _________________
Testeur : _____________________
Environnement : ☐ Local  ☐ Vercel Production

Résultats :
☐ ✅ Validation étape Conducteur réussie
☐ ✅ Validation étape Responsable Travaux réussie
☐ ✅ Validation étape Chargé d'Affaires réussie
☐ ✅ Progression vers Responsable Appro réussie
☐ ✅ Logs corrects dans la console
☐ ✅ Historique enregistré correctement

Statut global : ☐ RÉUSSI  ☐ ÉCHOUÉ

Commentaires :
_________________________________________________
_________________________________________________
```

## 🎯 Conclusion

Ce test valide que la correction apportée fonctionne correctement :
- Le superadmin peut maintenant valider à n'importe quelle étape
- Les vérifications de rôle strictes sont bypassées pour le superadmin
- Le workflow progresse normalement sans blocage

**Si le test réussit, le problème de M. Aristide et M. Nasser est résolu !** 🎉

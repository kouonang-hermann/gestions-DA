# Carte "Mes demandes à clôturer" - Guide de test

## Problème identifié

La carte "Mes demandes à clôturer" dans le dashboard employé n'affichait pas les demandes car :
- Aucune demande de test n'avait les statuts requis : `en_attente_validation_finale_demandeur` ou `confirmee_demandeur`
- Ces statuts correspondent à la dernière étape du workflow avant la clôture définitive

## Solution implémentée

### 1. Logs de debug améliorés

Le composant `MesDemandesACloturer` affiche maintenant des logs détaillés dans la console :
- ID de l'utilisateur connecté
- Toutes les demandes de l'utilisateur avec leurs statuts
- Nombre de demandes à clôturer trouvées
- Avertissement si aucune demande n'a les bons statuts

### 2. API de seeding des demandes à clôturer

Une nouvelle API a été créée : `/api/seed-demandes-cloture`

Cette API crée automatiquement 3 demandes de test pour l'employé :
1. **Demande matériel** - Statut : `en_attente_validation_finale_demandeur`
2. **Demande outillage** - Statut : `confirmee_demandeur`
3. **Demande matériel** - Statut : `en_attente_validation_finale_demandeur`

## Comment tester

### Étape 1 : Créer les utilisateurs de test (si pas déjà fait)

```
http://localhost:3000/api/seed-db?secret=seed-database-2024
```

### Étape 2 : Créer les demandes à clôturer

```
http://localhost:3000/api/seed-demandes-cloture?secret=seed-database-2024
```

### Étape 3 : Se connecter et tester

1. Connectez-vous avec le compte employé :
   - **Téléphone** : `600000002`
   - **Mot de passe** : `employe123`

2. Allez sur le dashboard employé

3. Vous devriez voir la carte **"Mes demandes à clôturer (3)"**

4. Les 3 demandes créées s'affichent avec :
   - Badge de statut (vert ou jaune)
   - Type de demande (matériel/outillage)
   - Projet assigné
   - Nombre d'articles
   - Boutons "Détails" et "Clôturer"

### Étape 4 : Clôturer une demande

1. Cliquez sur le bouton **"Clôturer"** d'une demande
2. Entrez un commentaire optionnel
3. La demande passe au statut `cloturee`
4. Elle disparaît de la carte "Mes demandes à clôturer"
5. Elle apparaît dans la carte "Validées"

## Statuts concernés

### `en_attente_validation_finale_demandeur`
- **Description** : Demande livrée par la logistique, en attente de validation finale du demandeur
- **Badge** : Jaune avec "⏳ En attente de votre validation"
- **Action** : Le demandeur doit vérifier la livraison et clôturer si conforme

### `confirmee_demandeur`
- **Description** : Demande confirmée par le demandeur après livraison
- **Badge** : Vert avec "✅ Confirmée - Prête à clôturer"
- **Action** : Le demandeur peut clôturer définitivement la demande

## Workflow complet

```
1. Création (brouillon)
2. Soumission (soumise)
3. Validation conducteur/logistique
4. Validation responsable travaux
5. Validation chargé d'affaire
6. Préparation appro
7. Validation logistique
8. ➡️ EN ATTENTE VALIDATION FINALE DEMANDEUR ⬅️ (Carte "À clôturer")
9. ➡️ CONFIRMEE DEMANDEUR ⬅️ (Carte "À clôturer")
10. Clôture définitive (cloturee)
```

## Vérification dans la console

Ouvrez la console du navigateur (F12) pour voir les logs :

```
🔍 [CLÔTURE] Filtrage pour Employé (employe):
  - ID utilisateur: user-xxx-xxx
  - Total demandes: 15
  - Demandes de l'utilisateur: 5
    • DA-001: statut="brouillon", type=materiel
    • DA-002: statut="soumise", type=outillage
    • DA-CLOTURE-xxx-1: statut="en_attente_validation_finale_demandeur", type=materiel
    • DA-CLOTURE-xxx-2: statut="confirmee_demandeur", type=outillage
    • DA-CLOTURE-xxx-3: statut="en_attente_validation_finale_demandeur", type=materiel
  - Demandes à clôturer trouvées: 3
  - IDs des demandes à clôturer: ["DA-CLOTURE-xxx-1", "DA-CLOTURE-xxx-2", "DA-CLOTURE-xxx-3"]
```

## Fonctionnalités de la carte

### Interface
- **Titre** : "Mes demandes à clôturer (X)" avec compteur dynamique
- **Message vide** : Si aucune demande, affiche un message explicatif
- **Liste des demandes** : Cards avec toutes les informations

### Pour chaque demande
- **Numéro** : DA-CLOTURE-xxx
- **Badge statut** : Couleur selon le statut
- **Badge type** : Matériel (bleu) ou Outillage (violet)
- **Description** : Commentaires de la demande
- **Informations** : Projet, nombre d'articles, date de création
- **Encadré informatif** : Explique l'action à effectuer
- **Bouton "Détails"** : Ouvre la modale de détails complets
- **Bouton "Clôturer"** : Finalise la demande avec commentaire optionnel

## Dépannage

### La carte affiche "0" demandes

1. Vérifiez les logs dans la console
2. Assurez-vous d'être connecté avec le bon compte employé
3. Vérifiez que les demandes ont été créées via l'API de seeding
4. Vérifiez que le `technicienId` des demandes correspond à votre ID utilisateur

### Les demandes n'apparaissent pas après seeding

1. Rechargez la page (F5)
2. Déconnectez-vous et reconnectez-vous
3. Vérifiez dans la console que les demandes sont bien chargées
4. Vérifiez les statuts des demandes dans les logs

### Erreur lors de la clôture

1. Vérifiez que vous êtes bien le créateur de la demande
2. Vérifiez que le statut est bien `en_attente_validation_finale_demandeur` ou `confirmee_demandeur`
3. Consultez les logs d'erreur dans la console

## Fichiers modifiés

- `components/demandes/mes-demandes-a-cloturer.tsx` : Logs de debug améliorés
- `app/api/seed-demandes-cloture/route.ts` : Nouvelle API de seeding
- `docs/DEMANDES-A-CLOTURER.md` : Cette documentation

## Prochaines étapes

1. Tester la fonctionnalité avec les données de seeding
2. Valider le workflow complet de clôture
3. Supprimer les logs de debug en production
4. Ajouter des notifications lors de la clôture

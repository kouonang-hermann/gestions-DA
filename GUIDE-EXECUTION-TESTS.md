# 🧪 Guide d'Exécution des Tests - Workflow de Rejet

## 🎯 3 Méthodes de Test

---

## ✅ MÉTHODE 1 : Test Manuel (RECOMMANDÉ - 15 minutes)

**Avantages** : Simple, visuel, pas de configuration complexe

### Étape par étape

#### 1️⃣ Lancer l'application

```bash
npm run dev
```

Ouvrir : `http://localhost:3000` (ou le port affiché)

#### 2️⃣ Test Rapide - Cycle Complet de Rejet

**A. Créer une demande (Employé)**
```
Connexion : 0600000001 / password123
→ Créer demande matériel
→ Articles : 10x Casques de chantier
→ Soumettre
✅ Status : "En attente validation conducteur"
```

**B. Valider (Conducteur)**
```
Déconnexion → Connexion : 0600000002 / password123
→ Aller dans "À valider"
→ Valider la demande
✅ Status : "En attente validation resp. travaux"
```

**C. REJETER (Resp. Travaux)**
```
Déconnexion → Connexion : 0600000003 / password123
→ Aller dans "À valider"
→ Cliquer "Rejeter"
→ Motif : "Quantités trop élevées, réduire à 5"
→ Confirmer le rejet

✅ VÉRIFIER :
   - Status retourne à "En attente validation conducteur"
   - Badge "🔄 1 rejet" visible
   - Notification visible
```

**D. Modifier et Renvoyer (Conducteur)**
```
Déconnexion → Connexion : 0600000002 / password123
→ Voir la notification de rejet
→ Cliquer sur la demande rejetée
→ Cliquer "Modifier et renvoyer"
→ Réduire quantité à 5
→ Ajouter commentaire : "Quantité ajustée"
→ Renvoyer

✅ VÉRIFIER :
   - Status retourne à "En attente validation resp. travaux"
   - Badge "🔄 1 rejet" toujours visible
   - Demande modifiée
```

**E. Valider finalement (Resp. Travaux)**
```
Déconnexion → Connexion : 0600000003 / password123
→ Valider la demande modifiée
✅ Status : "En attente validation chargé affaire"
```

**🎉 TEST RÉUSSI** : Le cycle complet fonctionne !

---

## 🤖 MÉTHODE 2 : Test Automatisé via Script

**Avantages** : Rapide, automatique, teste tout le workflow

### Prérequis

1. Application lancée dans un terminal
2. Utilisateurs de test existants

### Exécution

**Terminal 1** : Lancer l'app
```bash
npm run dev
```

**Terminal 2** : Lancer le script de test
```bash
node test-workflow-rejet.js
```

### Ce que le script teste

```
✅ Connexion des 4 utilisateurs
✅ Création d'une demande
✅ Validation par conducteur
✅ Rejet par resp. travaux
   → Vérification retour au statut précédent
   → Vérification compteur = 1
✅ Modification par conducteur
✅ Renvoi de la demande
✅ Validation par resp. travaux
✅ Rejet par chargé affaire
   → Vérification compteur = 2
✅ Modification par resp. travaux
✅ Validation finale
```

### Résultat attendu

```
🧪 🧪 🧪 🧪 🧪 🧪 🧪 🧪 🧪 🧪 🧪 🧪 🧪 🧪 🧪 
TEST DU WORKFLOW DE REJET AVEC RETOUR ARRIÈRE
🧪 🧪 🧪 🧪 🧪 🧪 🧪 🧪 🧪 🧪 🧪 🧪 🧪 🧪 🧪 

============================================================
ÉTAPE 1: Connexion des utilisateurs
============================================================
✅ employe connecté avec succès
✅ conducteur connecté avec succès
✅ respTravaux connecté avec succès
✅ chargeAffaire connecté avec succès

[... autres étapes ...]

✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ 
TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS !
✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ ✅ 
```

---

## 🔍 MÉTHODE 3 : Test via API (Postman/Insomnia)

**Avantages** : Contrôle total, debugging facile

### Configuration

1. Importer dans Postman/Insomnia
2. Créer une collection "Test Workflow Rejet"

### Requêtes à créer

#### 1. Login Employé
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "phone": "0600000001",
  "password": "password123"
}

→ Sauvegarder le token dans une variable
```

#### 2. Créer une demande
```http
POST http://localhost:3000/api/demandes
Authorization: Bearer {{token_employe}}
Content-Type: application/json

{
  "type": "materiel",
  "projetId": "votre-projet-id",
  "items": [
    {
      "articleId": "votre-article-id",
      "quantiteDemandee": 10,
      "commentaire": "Test rejet"
    }
  ],
  "commentaires": "Demande de test"
}

→ Sauvegarder l'ID de la demande
```

#### 3. Login Conducteur
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "phone": "0600000002",
  "password": "password123"
}
```

#### 4. Valider la demande
```http
PUT http://localhost:3000/api/demandes/{{demande_id}}
Authorization: Bearer {{token_conducteur}}
Content-Type: application/json

{
  "status": "valider",
  "commentaire": "Validation OK"
}
```

#### 5. Login Resp. Travaux
```http
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "phone": "0600000003",
  "password": "password123"
}
```

#### 6. REJETER la demande
```http
PUT http://localhost:3000/api/demandes/{{demande_id}}
Authorization: Bearer {{token_resp_travaux}}
Content-Type: application/json

{
  "status": "rejetee",
  "commentaire": "Quantités trop élevées"
}

✅ VÉRIFIER LA RÉPONSE :
{
  "success": true,
  "data": {
    "status": "en_attente_validation_conducteur",
    "nombreRejets": 1,
    "statusPrecedent": "en_attente_validation_responsable_travaux"
  }
}
```

#### 7. Modifier et renvoyer
```http
PUT http://localhost:3000/api/demandes/{{demande_id}}/modify
Authorization: Bearer {{token_conducteur}}
Content-Type: application/json

{
  "items": [
    {
      "articleId": "votre-article-id",
      "quantiteDemandee": 5,
      "commentaire": "Quantité réduite"
    }
  ],
  "commentaires": "Modifications apportées"
}

✅ VÉRIFIER LA RÉPONSE :
{
  "success": true,
  "data": {
    "status": "en_attente_validation_responsable_travaux",
    "nombreRejets": 1,
    "statusPrecedent": null
  }
}
```

---

## 🔍 Vérifications dans la Base de Données

Après les tests, exécutez ces requêtes SQL dans Supabase :

### 1. Voir les demandes rejetées
```sql
SELECT 
  numero, 
  status, 
  "statusPrecedent", 
  "nombreRejets",
  "rejetMotif",
  "dateModification"
FROM demandes 
WHERE "nombreRejets" > 0
ORDER BY "dateModification" DESC;
```

### 2. Voir les notifications de rejet
```sql
SELECT 
  n.titre,
  n.message,
  u.nom || ' ' || u.prenom as utilisateur,
  u.role,
  d.numero as demande,
  n."createdAt"
FROM notifications n
JOIN users u ON n."userId" = u.id
JOIN demandes d ON n."demandeId" = d.id
WHERE n.titre LIKE '%rejetée%'
ORDER BY n."createdAt" DESC
LIMIT 10;
```

### 3. Voir l'historique des rejets
```sql
SELECT 
  h.action,
  h."ancienStatus",
  h."nouveauStatus",
  h.commentaire,
  u.nom || ' ' || u.prenom as utilisateur,
  u.role,
  d.numero as demande,
  h.timestamp
FROM history_entries h
JOIN users u ON h."userId" = u.id
JOIN demandes d ON h."demandeId" = d.id
WHERE h.action LIKE '%rejeté%'
ORDER BY h.timestamp DESC
LIMIT 10;
```

---

## 📊 Checklist de Validation

Après avoir exécuté les tests, vérifiez :

### Backend
- [ ] Demande retourne au statut précédent lors du rejet
- [ ] Compteur `nombreRejets` incrémenté correctement
- [ ] Champ `statusPrecedent` sauvegardé
- [ ] Notification créée pour le valideur précédent
- [ ] Modification possible par le valideur précédent
- [ ] Renvoi après modification fonctionne
- [ ] Historique enregistre tous les rejets

### Base de données
- [ ] Colonne `nombreRejets` existe
- [ ] Colonne `statusPrecedent` existe
- [ ] Données correctement enregistrées

### Workflow
- [ ] Cycle complet fonctionne (création → validation → rejet → modification → renvoi)
- [ ] Rejets multiples fonctionnent
- [ ] Limite de 5 rejets respectée (optionnel à tester)

---

## 🐛 Dépannage

### Problème : "Migration non appliquée"
**Solution** :
```sql
-- Exécuter dans Supabase
ALTER TABLE "demandes" ADD COLUMN IF NOT EXISTS "nombreRejets" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "demandes" ADD COLUMN IF NOT EXISTS "statusPrecedent" TEXT;
```

### Problème : "Utilisateur non trouvé"
**Solution** : Vérifier que les utilisateurs de test existent avec ces téléphones :
- 0600000001 (Employé)
- 0600000002 (Conducteur)
- 0600000003 (Resp. Travaux)
- 0600000004 (Chargé Affaire)

### Problème : "Impossible de rejeter"
**Solution** : Vérifier que la demande est dans un statut qui a un statut précédent défini

### Problème : Script Node.js ne fonctionne pas
**Solution** : 
1. Vérifier que l'app est lancée (`npm run dev`)
2. Adapter les IDs de projet et article dans le script
3. Utiliser la Méthode 1 (test manuel) à la place

---

## 🎯 Recommandation

**Pour débuter** : Utilisez la **Méthode 1** (Test Manuel)
- Plus simple
- Plus visuel
- Permet de comprendre le workflow
- Pas de configuration complexe

**Pour automatiser** : Utilisez la **Méthode 2** (Script)
- Une fois que la Méthode 1 fonctionne
- Pour tester rapidement après modifications
- Pour tests de régression

**Pour débugger** : Utilisez la **Méthode 3** (API)
- Voir exactement les requêtes/réponses
- Tester des cas spécifiques
- Débugger des problèmes précis

---

## ✅ Résultat Attendu

Si tout fonctionne correctement :

1. ✅ Demande rejetée retourne au statut précédent
2. ✅ Badge "🔄 X rejets" visible
3. ✅ Notification envoyée au valideur précédent
4. ✅ Modification possible et renvoi fonctionne
5. ✅ Compteur de rejets incrémenté
6. ✅ Historique complet enregistré

**Le workflow de rejet avec retour arrière fonctionne !** 🎉

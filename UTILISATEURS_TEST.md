# 👥 UTILISATEURS TEST - GESTION DEMANDES MATÉRIEL

Ce document contient les informations de connexion pour tous les utilisateurs test de l'application.

## 🔐 INFORMATIONS DE CONNEXION

**⚠️ IMPORTANT** : L'authentification se fait par **numéro de téléphone** (9 chiffres commençant par 6)

### Superadmin
- **Téléphone** : `600000001`
- **Mot de passe** : `admin123`
- **Rôle** : Super Admin
- **Permissions** : 
  - Accès complet à toutes les fonctionnalités
  - Gestion des utilisateurs et projets
  - Tableau de bord financier
  - Attribution des rôles administrateur
  - Vue d'ensemble de toutes les demandes

---

### Employé (Demandeur)
- **Téléphone** : `600000002`
- **Mot de passe** : `employe123`
- **Rôle** : Employé
- **Permissions** : 
  - Créer des demandes de matériel et d'outillage
  - Suivre ses propres demandes
  - Clôturer ses demandes livrées
  - Voir l'historique de ses demandes

---

### Conducteur de Travaux
- **Téléphone** : `600000003`
- **Mot de passe** : `conducteur123`
- **Rôle** : Conducteur de Travaux
- **Permissions** : 
  - Valider les demandes de **matériel uniquement** (1ère validation)
  - Créer ses propres demandes
  - Clôturer ses demandes

---

### Responsable QHSE
- **Téléphone** : `600000008`
- **Mot de passe** : `qhse123`
- **Rôle** : Responsable QHSE
- **Permissions** : 
  - Valider les demandes d'**outillage uniquement** (1ère validation)
  - Créer ses propres demandes
  - Clôturer ses demandes

---

### Responsable des Travaux
- **Téléphone** : `600000004`
- **Mot de passe** : `responsable123`
- **Rôle** : Responsable des Travaux
- **Permissions** : 
  - Valider les demandes matériel ET outillage (2ème validation)
  - Créer ses propres demandes
  - Clôturer ses demandes

---

### Chargé d'Affaire
- **Téléphone** : `600000007`
- **Mot de passe** : `charge123`
- **Rôle** : Chargé d'Affaire
- **Permissions** : 
  - Valider les demandes matériel ET outillage (3ème validation - budget)
  - Créer ses propres demandes
  - Clôturer ses demandes

---

### Responsable Appro
- **Téléphone** : `600000006`
- **Mot de passe** : `appro123`
- **Rôle** : Responsable Appro
- **Permissions** : 
  - Préparer les sorties de **matériel uniquement**
  - Créer ses propres demandes
  - Clôturer ses demandes

---

### Responsable Logistique
- **Téléphone** : `600000005`
- **Mot de passe** : `logistique123`
- **Rôle** : Responsable Logistique
- **Permissions** : 
  - Préparer les sorties d'**outillage uniquement**
  - Gérer les livraisons
  - Créer ses propres demandes
  - Clôturer ses demandes

---

### Livreur
- **Téléphone** : `600000009`
- **Mot de passe** : `livreur123`
- **Rôle** : Responsable Livreur
- **Permissions** : 
  - Réceptionner les demandes préparées
  - Livrer les demandes aux demandeurs
  - Voir toutes les demandes en cours de livraison

---

## 🔄 FLOWS DE VALIDATION

### FLOW MATÉRIEL
```
1. Employé crée la demande (brouillon)
2. Employé soumet la demande (soumise → en_attente_validation_conducteur)
3. Conducteur de Travaux valide → en_attente_validation_responsable_travaux
4. Responsable des Travaux valide → en_attente_validation_charge_affaire
5. Chargé d'Affaire valide → en_attente_preparation_appro
6. Responsable Appro prépare → en_attente_reception_livreur
7. Livreur réceptionne → en_attente_livraison
8. Livreur livre → en_attente_validation_finale_demandeur
9. Demandeur confirme → confirmee_demandeur
10. Demandeur clôture → cloturee
```

### FLOW OUTILLAGE
```
1. Employé crée la demande (brouillon)
2. Employé soumet la demande (soumise → en_attente_validation_qhse)
3. Responsable QHSE valide → en_attente_validation_responsable_travaux
4. Responsable des Travaux valide → en_attente_validation_charge_affaire
5. Chargé d'Affaire valide → en_attente_preparation_logistique
6. Responsable Logistique prépare → en_attente_reception_livreur
7. Livreur réceptionne → en_attente_livraison
8. Livreur livre → en_attente_validation_finale_demandeur
9. Demandeur confirme → confirmee_demandeur
10. Demandeur clôture → cloturee
```

---

## 🎯 PROJET TEST

**Nom du projet** : `Projet de Construction Alpha`
**ID** : `projet-test-1`
**Utilisateurs assignés** : Tous les utilisateurs test ci-dessus

---

## 📝 NOTES IMPORTANTES

1. **Authentification** : Se fait par numéro de téléphone (9 chiffres commençant par 6)
2. **Tous les utilisateurs test** sont assignés au projet `projet-test-1`
3. **Nouveau rôle** : Responsable QHSE pour la validation initiale des demandes d'outillage
4. **Séparation des rôles** :
   - **Responsable Appro** : Matériel uniquement
   - **Responsable Logistique** : Outillage uniquement
5. **Clôture des demandes** : Tous les utilisateurs peuvent clôturer leurs propres demandes
6. **Filtrage par projet** : Chaque utilisateur ne voit que les demandes de ses projets assignés

---

## 🧪 TESTER LE FLOW MATÉRIEL

1. Connectez-vous avec `600000002` (Employé)
2. Créez une demande de **matériel** (ex: Casque de sécurité)
3. Soumettez la demande
4. Connectez-vous avec `600000003` (Conducteur) → Validez
5. Connectez-vous avec `600000004` (Resp. Travaux) → Validez
6. Connectez-vous avec `600000007` (Chargé Affaire) → Validez
7. Connectez-vous avec `600000006` (Appro) → Préparez la sortie
8. Connectez-vous avec `600000009` (Livreur) → Réceptionnez puis livrez
9. Connectez-vous avec `600000002` (Employé) → Confirmez puis clôturez

✅ La demande est maintenant clôturée !

---

## 🧪 TESTER LE FLOW OUTILLAGE

1. Connectez-vous avec `600000002` (Employé)
2. Créez une demande d'**outillage** (ex: Perceuse électrique)
3. Soumettez la demande
4. Connectez-vous avec `600000008` (QHSE) → Validez
5. Connectez-vous avec `600000004` (Resp. Travaux) → Validez
6. Connectez-vous avec `600000007` (Chargé Affaire) → Validez
7. Connectez-vous avec `600000005` (Logistique) → Préparez la sortie
8. Connectez-vous avec `600000009` (Livreur) → Réceptionnez puis livrez
9. Connectez-vous avec `600000002` (Employé) → Confirmez puis clôturez

✅ La demande est maintenant clôturée !

---

## 🔧 ARTICLES DE TEST DISPONIBLES

### Matériel
- **Casque de sécurité** (MAT-001) - 12.50€
- **Gants de protection** (MAT-002) - 12.50€

### Outillage
- **Perceuse électrique** (OUT-001) - 150.00€

---

## 📞 SUPPORT

Pour toute question sur les utilisateurs test ou le nouveau flow de validation, consultez la documentation dans le README principal.

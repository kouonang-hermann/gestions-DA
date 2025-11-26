# 📱 Identifiants de Test - Connexion par Téléphone

## ✅ Nouveaux Identifiants (Téléphone + Mot de passe)

Vous pouvez maintenant vous connecter avec votre **numéro de téléphone** :

| Rôle | Téléphone | Mot de passe | Email (alternatif) |
|------|-----------|--------------|-------------------|
| 🔑 **Super Admin** | `+33601020304` | `admin123` | admin@test.com |
| 👤 **Employé** | `+33602030405` | `employe123` | employe@test.com |
| 👷 **Conducteur Travaux** | `+33603040506` | `conducteur123` | conducteur@test.com |
| 🛡️ **Responsable QHSE** | `+33604050607` | `qhse123` | qhse@test.com |
| 📦 **Responsable Appro** | `+33605060708` | `appro123` | appro@test.com |
| 💼 **Chargé d'Affaire** | `+33606070809` | `charge123` | charge@test.com |
| 🚚 **Responsable Logistique** | `+33607080910` | `logistique123` | logistique@test.com |
| 👨‍💼 **Responsable Travaux** | `+33600999888` | `responsable123` | responsable-travaux@test.com |

---

## 🎯 Comment Se Connecter

### **Option 1 : Avec le Numéro de Téléphone** (Recommandé)
1. Allez sur la page de connexion
2. Entrez le **numéro de téléphone** (exemple: `+33601020304`)
3. Entrez le **mot de passe** (exemple: `admin123`)
4. Cliquez sur **"SE CONNECTER"**

### **Option 2 : Avec l'Email** (Toujours fonctionnel)
1. Allez sur la page de connexion
2. Entrez l'**email** (exemple: `admin@test.com`)
3. Entrez le **mot de passe** (exemple: `admin123`)
4. Cliquez sur **"SE CONNECTER"**

> ⚠️ **Note** : Les deux méthodes fonctionnent en parallèle. Vous pouvez utiliser celle que vous préférez.

---

## 📋 Exemples d'Utilisation

### **Test du Flow Complet de Validation**

#### 1️⃣ **Créer une Demande (En tant qu'Employé)**
- Téléphone : `+33602030405`
- Mot de passe : `employe123`
- Action : Créer une demande de matériel

#### 2️⃣ **Valider (En tant que Conducteur)**
- Téléphone : `+33603040506`
- Mot de passe : `conducteur123`
- Action : Valider la demande de matériel

#### 3️⃣ **Valider (En tant que Chargé d'Affaire)**
- Téléphone : `+33606070809`
- Mot de passe : `charge123`
- Action : Valider la préparation

#### 4️⃣ **Préparer (En tant qu'Appro)**
- Téléphone : `+33605060708`
- Mot de passe : `appro123`
- Action : Préparer la sortie

#### 5️⃣ **Valider (En tant que Logistique)**
- Téléphone : `+33607080910`
- Mot de passe : `logistique123`
- Action : Valider la livraison

#### 6️⃣ **Clôturer (En tant qu'Employé)**
- Téléphone : `+33602030405`
- Mot de passe : `employe123`
- Action : Clôturer la demande

---

## 🔧 Formats de Téléphone Acceptés

L'application accepte plusieurs formats :

✅ **Format International** : `+33601020304`
✅ **Format National** : `0601020304`
✅ **Avec Espaces** : `+33 6 01 02 03 04`
✅ **Avec Espaces National** : `06 01 02 03 04`

> 💡 **Conseil** : Utilisez le format international pour éviter toute ambiguïté

---

## 🆕 Créer un Nouvel Utilisateur

Lors de la création d'un utilisateur via le dashboard Super Admin :

### **Champs Obligatoires** :
- ✅ Prénom
- ✅ Nom
- ✅ Email (doit être unique)
- ✅ **Numéro de téléphone** (doit être unique) ← **NOUVEAU**
- ✅ Mot de passe
- ✅ Rôle

### **Exemple de Création** :
```
Prénom: Marie
Nom: Dupont
Email: marie.dupont@example.com
Téléphone: +33612345678
Mot de passe: marie2024
Rôle: Employé
```

---

## 📊 Changements dans l'Interface

### **Avant** :
- Affichage : Nom + **Email**
- Connexion : Email uniquement

### **Après** :
- Affichage : Nom + **Numéro de téléphone**
- Connexion : **Téléphone OU Email**

### **Où voir les changements** :
- ✅ Page de connexion (champ téléphone)
- ✅ Dashboard Super-Admin (tableau des utilisateurs)
- ✅ Modal de gestion des projets (affichage téléphone)
- ✅ Modal de création d'utilisateur (champ téléphone requis)
- ✅ Modal de changement de rôle (affichage téléphone)

---

## 🔒 Sécurité

### **Unicité** :
- Chaque numéro de téléphone doit être **unique**
- La base de données empêche les doublons automatiquement

### **Validation** :
- Format de téléphone vérifié à la création
- Email toujours requis (pour notifications)
- Mot de passe hashé avec bcrypt (12 rounds)

---

## 🚀 Mise en Production

### **Étapes** :
1. ✅ Exécuter le script SQL de migration (voir `MIGRATION_TELEPHONE.md`)
2. ✅ Mettre à jour tous les utilisateurs avec des numéros de téléphone
3. ✅ Informer les utilisateurs du nouveau mode de connexion
4. ✅ Tester la connexion avec quelques utilisateurs
5. ✅ Déployer en production

### **Compatibilité** :
- ✅ Connexion par email toujours fonctionnelle
- ✅ Aucune interruption de service
- ✅ Migration progressive possible

---

## ❓ FAQ

### **Q : Puis-je encore me connecter avec mon email ?**
**R :** Oui ! La connexion par email fonctionne toujours en parallèle.

### **Q : Dois-je mettre à jour mon mot de passe ?**
**R :** Non, votre mot de passe reste le même.

### **Q : Mon numéro doit-il être au format international ?**
**R :** Non, mais c'est recommandé pour éviter toute ambiguïté.

### **Q : Que se passe-t-il si je n'ai pas de numéro de téléphone ?**
**R :** Un administrateur doit vous en attribuer un. C'est maintenant obligatoire.

### **Q : Puis-je changer mon numéro de téléphone ?**
**R :** Oui, via un administrateur qui peut modifier vos informations.

---

## 📞 Support

Si vous rencontrez des problèmes de connexion :

1. **Vérifiez le format** de votre numéro de téléphone
2. **Essayez avec votre email** à la place
3. **Contactez un administrateur** pour vérifier votre compte
4. **Consultez les logs** pour plus de détails

---

**Version :** 2.0 - Migration Téléphone  
**Date :** 2024  
**Statut :** ✅ Actif et Testé

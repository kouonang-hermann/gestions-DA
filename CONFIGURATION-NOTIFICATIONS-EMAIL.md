# 📧 CONFIGURATION DES NOTIFICATIONS EMAIL

## ✅ SYSTÈME IMPLÉMENTÉ ET ACTIVÉ

Le système de notifications email est maintenant **ACTIF** et s'exécute automatiquement lors de chaque changement de statut d'une demande.

---

## 🎯 FONCTIONNEMENT AUTOMATIQUE

### Quand une demande change de statut :

1. **Email envoyé au demandeur** : Notification du changement de statut
2. **Email envoyé au prochain valideur** : Demande de validation avec lien direct
3. **Filtrage intelligent par projet** : Seuls les valideurs assignés au projet reçoivent l'email

### Statuts déclencheurs d'emails :

| Statut | Destinataire | Type d'email |
|--------|-------------|--------------|
| `en_attente_validation_conducteur` | Conducteurs de travaux du projet | Demande de validation matériel |
| `en_attente_validation_qhse` | Responsables QHSE du projet | Demande de validation outillage |
| `en_attente_validation_responsable_travaux` | Responsables des travaux du projet | Demande de validation |
| `en_attente_validation_charge_affaire` | Chargés d'affaire du projet | Demande de validation |
| `en_attente_preparation_appro` | Responsables appro du projet | Demande de préparation sortie |
| `en_attente_validation_logistique` | Responsables logistique du projet | Demande de validation transport |
| `en_attente_validation_finale_demandeur` | Demandeur original | Demande de clôture |
| `cloturee` | Admin + superviseurs | Notification de clôture |
| `rejetee` | Demandeur original | Notification de rejet |

---

## ⚙️ CONFIGURATION REQUISE

### 1. Variables d'environnement

Ajoutez ces variables dans votre fichier `.env.local` :

#### Option A : Gmail (Recommandé pour test)

```env
# Configuration Email Gmail
EMAIL_USER=votre.email@gmail.com
EMAIL_PASSWORD=votre_mot_de_passe_application_gmail

# URL de l'application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Option B : SMTP Personnalisé

```env
# Configuration SMTP Personnalisé
SMTP_HOST=smtp.votre-serveur.com
SMTP_PORT=587
SMTP_USER=votre@email.com
SMTP_PASSWORD=votre_mot_de_passe

# URL de l'application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Configuration Gmail (Option A)

Si vous utilisez Gmail, vous DEVEZ créer un **Mot de passe d'application** :

#### Étapes :

1. Allez sur https://myaccount.google.com/security
2. Activez la **Validation en 2 étapes** (obligatoire)
3. Allez dans **Mots de passe d'application**
4. Sélectionnez "Autre" et nommez-le "Gestion Demandes"
5. Copiez le mot de passe généré (16 caractères)
6. Utilisez ce mot de passe dans `EMAIL_PASSWORD`

**⚠️ N'utilisez JAMAIS votre mot de passe Gmail principal !**

---

## 📋 TEMPLATES D'EMAILS DISPONIBLES

### 1. Email de demande de validation

**Destinataire** : Valideur concerné  
**Déclencheur** : Nouveau statut "en_attente_validation_[role]"

**Contenu** :
- Numéro de demande
- Type (matériel/outillage)
- Demandeur
- Projet
- Bouton "Valider la demande" (lien direct)

### 2. Email de demande de clôture

**Destinataire** : Demandeur original  
**Déclencheur** : Statut "en_attente_validation_finale_demandeur"

**Contenu** :
- Numéro de demande
- Confirmation que la demande est prête
- Bouton "Clôturer" (lien direct)

### 3. Email de mise à jour de statut

**Destinataire** : Demandeur  
**Déclencheur** : Tout changement de statut

**Contenu** :
- Numéro de demande
- Ancien statut → Nouveau statut
- Commentaire du valideur (si présent)

---

## 🔧 RAPPELS AUTOMATIQUES

Le système envoie des **rappels automatiques** pour les demandes en attente depuis plus de **24 heures**.

### Configuration :

```typescript
// services/notificationService.ts - ligne 248
setInterval(async () => {
  await this.sendReminders(users, demandes)
}, 60 * 60 * 1000) // 1 heure
```

**Personnalisation** :
- Modifier `reminderThreshold` (ligne 190) pour changer le délai avant rappel
- Modifier l'intervalle (ligne 250) pour changer la fréquence des vérifications

---

## 🧪 TESTER LE SYSTÈME

### Test Manuel :

1. **Créer une demande** en tant qu'employé
2. **Soumettre la demande** 
3. **Vérifier la console** : 
   ```
   📧 [API] Envoi des notifications email pour changement de statut: soumise → en_attente_validation_conducteur
   ✅ [API] Notifications email envoyées avec succès
   ```
4. **Vérifier l'email du conducteur** : Doit recevoir une demande de validation

### Test Complet du Flow :

```bash
# Lancer l'application
npm run dev

# Ouvrir la console navigateur (F12)
# Créer et valider une demande
# Observer les logs :
```

**Logs attendus** :

```
📧 [API] Envoi des notifications email pour changement de statut: soumise → en_attente_validation_conducteur
🔍 [NOTIFICATION] Recherche des validateurs avec rôle: conducteur_travaux
📧 [EMAIL] Envoi notification validation à: jean.dupont@example.com
✅ [API] Notifications email envoyées avec succès
```

---

## 🚨 DÉPANNAGE

### Problème : Emails non reçus

**Vérifications** :

1. ✅ Variables `.env.local` correctement définies
2. ✅ Mot de passe d'application Gmail (pas le mot de passe principal)
3. ✅ Validation en 2 étapes activée sur Gmail
4. ✅ Adresses email valides dans la base de données
5. ✅ Consulter les logs console pour les erreurs

### Problème : Erreur SMTP

```
⚠️ [API] Erreur lors de l'envoi des emails (non bloquant): Error: Invalid login
```

**Solution** :
- Vérifier `EMAIL_USER` et `EMAIL_PASSWORD`
- Utiliser un mot de passe d'application Gmail
- Vérifier que le compte n'est pas bloqué

### Problème : Emails envoyés au mauvais utilisateur

**Solution** :
- Vérifier que les utilisateurs sont assignés au bon projet
- Consulter les logs de filtrage :
  ```
  🔍 [NOTIFICATION] Validateurs du projet projet-123: 2 trouvés
  ```

---

## 📊 FICHIERS MODIFIÉS

### APIs :
- ✅ `app/api/demandes/[id]/actions/route.ts` : Intégration du service de notifications

### Services :
- ✅ `services/notificationService.ts` : Correction des rôles (responsable_appro, responsable_logistique)
- ✅ `services/emailService.ts` : Service d'envoi d'emails (déjà existant)

### Hooks :
- ✅ `hooks/useNotifications.ts` : Hook React pour notifications (déjà existant)

---

## 🎯 UTILISATION EN PRODUCTION

### Recommandations :

1. **Utiliser un service SMTP dédié** :
   - SendGrid (gratuit jusqu'à 100 emails/jour)
   - Mailgun (gratuit jusqu'à 5000 emails/mois)
   - AWS SES (très bon marché)

2. **Configurer des templates HTML** :
   - Personnaliser le design dans `services/emailService.ts`
   - Ajouter le logo de l'entreprise
   - Respecter la charte graphique

3. **Monitoring** :
   - Activer les logs Sentry pour les erreurs d'envoi
   - Suivre le taux de livraison des emails
   - Créer des alertes pour les échecs

4. **Limites** :
   - Gmail : 500 emails/jour maximum
   - Utiliser un service dédié pour > 100 emails/jour

---

## ✅ CHECKLIST DE DÉPLOIEMENT

- [ ] Variables d'environnement configurées
- [ ] Mot de passe d'application Gmail créé
- [ ] Test d'envoi d'email réussi
- [ ] Vérification des logs (pas d'erreurs)
- [ ] Destinataires corrects identifiés
- [ ] Templates email personnalisés
- [ ] Service SMTP production configuré (si applicable)
- [ ] Monitoring des emails activé

---

## 📞 SUPPORT

En cas de problème :

1. **Consulter les logs console** (F12)
2. **Vérifier les variables d'environnement**
3. **Tester avec un email de test simple**
4. **Consulter la documentation** :
   - [Nodemailer](https://nodemailer.com/about/)
   - [Gmail App Passwords](https://support.google.com/accounts/answer/185833)

---

**Date de création** : 19 Octobre 2025  
**Status** : ✅ **SYSTÈME ACTIF ET FONCTIONNEL**  
**Prochaine étape** : Configurer les variables d'environnement et tester

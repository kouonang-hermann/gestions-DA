# 📬 Système de Notifications Multi-Canal (Email + WhatsApp)

## Vue d'ensemble

Le système de notifications permet d'envoyer automatiquement des notifications aux utilisateurs via **deux canaux** :

### 📧 Email
- Communications formelles et détaillées
- Historique consultable
- Liens d'action directs

### 📱 WhatsApp (via Twilio)
- Notifications instantanées sur mobile
- Lecture rapide des alertes
- Idéal pour les urgences

### Types de notifications
- **Demandes de validation** pour les valideurs
- **Demandes de clôture** pour les demandeurs
- **Mises à jour de statut** pour toutes les parties prenantes
- **Rappels automatiques** pour demandes en attente >24h

## 🚀 Configuration

### 1. Variables d'environnement

Créez un fichier `.env.local` avec les variables suivantes :

```env
# Configuration Gmail (recommandé pour les tests)
EMAIL_USER=votre-email@gmail.com
EMAIL_PASSWORD=votre-mot-de-passe-application
EMAIL_FROM=noreply@gestion-materiel.com

# URL de l'application
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Environnement
NODE_ENV=development
```

### 2. Configuration Gmail

1. Activez l'authentification à 2 facteurs sur votre compte Gmail
2. Générez un mot de passe d'application :
   - Allez dans Paramètres Google → Sécurité
   - Authentification à 2 facteurs → Mots de passe des applications
   - Générez un mot de passe pour "Application personnalisée"
3. Utilisez ce mot de passe dans `EMAIL_PASSWORD`

### 3. Configuration SMTP personnalisée (optionnel)

```env
SMTP_HOST=smtp.votre-serveur.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=votre-utilisateur
SMTP_PASSWORD=votre-mot-de-passe
```

---

## 📱 Configuration WhatsApp (Twilio)

### 1. Créer un compte Twilio

1. Inscrivez-vous sur [twilio.com](https://www.twilio.com/try-twilio)
2. Validez votre numéro de téléphone
3. Accédez à la console Twilio

### 2. Activer le Sandbox WhatsApp

1. Dans la console Twilio : **Messaging → Try it out → Send a WhatsApp message**
2. Notez le code affiché (ex: `join example-sandbox`)
3. Depuis votre WhatsApp, envoyez ce code au **+1 415 523 8886**
4. Vous recevrez une confirmation d'inscription au sandbox

### 3. Récupérer les credentials

1. Dans la console Twilio, allez dans **Account → API keys & tokens**
2. Copiez votre **Account SID** et **Auth Token**
3. Ajoutez-les dans `.env.local` :

```env
# Configuration WhatsApp (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Activer WhatsApp
ENABLE_WHATSAPP_NOTIFICATIONS=true
```

### 4. Important : Sandbox vs Production

| Mode | Numéro | Usage |
|------|--------|-------|
| **Sandbox** | +1 415 523 8886 | Tests uniquement. Chaque destinataire doit rejoindre le sandbox |
| **Production** | Votre numéro WhatsApp Business | Production. Nécessite validation Meta |

### 5. Coûts Twilio

| Type | Prix approximatif |
|------|-------------------|
| Sandbox | Gratuit |
| Production (conversation initiée par vous) | ~0.005€/message |
| Production (réponse utilisateur) | ~0.003€/message |

## 📋 Types de notifications

### 1. Demande de validation

**Déclencheur :** Quand une demande passe en statut d'attente de validation

**Destinataires :** Utilisateurs avec le rôle de valideur approprié

**Contenu :**
- Détails de la demande
- Informations du demandeur
- Lien direct vers la validation
- Bouton d'action

### 2. Demande de clôture

**Déclencheur :** Quand une demande est prête pour clôture

**Destinataires :** Demandeur original

**Contenu :**
- Confirmation que la demande est traitée
- Détails des articles
- Lien pour clôturer
- Instructions de vérification

### 3. Mise à jour de statut

**Déclencheur :** À chaque changement de statut

**Destinataires :** Demandeur et parties prenantes

**Contenu :**
- Ancien et nouveau statut
- Détails de la demande
- Prochaines étapes

## 🔧 Utilisation dans le code

### Hook useNotifications

```tsx
import { useNotifications } from '@/hooks/useNotifications'

const MyComponent = () => {
  const { notifyStatusChange, notifyValidationRequest } = useNotifications()

  const handleStatusChange = async (demande, oldStatus, newStatus) => {
    // Mettre à jour le statut en base
    await updateDemandeStatus(demande.id, newStatus)
    
    // Envoyer les notifications
    await notifyStatusChange(demande, oldStatus, newStatus, users)
  }
}
```

### Fonction utilitaire directe

```tsx
import { triggerStatusChangeNotifications } from '@/hooks/useNotifications'

// Dans une action du store ou un composant
await triggerStatusChangeNotifications(
  demandeId,
  'soumise',
  'en_attente_validation_conducteur',
  users,
  demandes
)
```

## 🎯 Déclencheurs automatiques

### Changements de statut

Le système détecte automatiquement les changements de statut et envoie les notifications appropriées :

| Statut | Action | Destinataire |
|--------|--------|--------------|
| `en_attente_validation_conducteur` | Notification de validation | Conducteurs de travaux |
| `en_attente_validation_logistique` | Notification de validation | Responsables logistique |
| `en_attente_validation_responsable_travaux` | Notification de validation | Responsables travaux |
| `en_attente_validation_charge_affaire` | Notification de validation | Chargés d'affaire |
| `en_attente_validation_finale_demandeur` | Notification de clôture | Demandeur original |
| `cloturee` | Notification de clôture | Parties prenantes |

### Rappels automatiques

- **Fréquence :** Toutes les heures
- **Condition :** Demandes en attente depuis plus de 24h
- **Action :** Rappel envoyé aux valideurs concernés

## 🧪 Test du système

### Composant de test Email

```tsx
import NotificationTest from '@/components/admin/notification-test'

<NotificationTest users={users} demandes={demandes} />
```

### Composant de test WhatsApp

```tsx
import WhatsAppTest from '@/components/admin/whatsapp-test'

<WhatsAppTest />
```

### Test manuel Email

1. Configurez les variables d'environnement
2. Sélectionnez un utilisateur avec email
3. Choisissez une demande de test
4. Cliquez sur "Tester Email de Validation" ou "Tester Email de Clôture"
5. Vérifiez la réception dans la boîte email

### Test manuel WhatsApp

1. Créez un compte Twilio et activez le sandbox
2. Rejoignez le sandbox depuis votre WhatsApp (envoyez le code au +1 415 523 8886)
3. Configurez les variables Twilio dans `.env.local`
4. Définissez `ENABLE_WHATSAPP_NOTIFICATIONS=true`
5. Utilisez le composant `WhatsAppTest` ou l'API directement
6. Vérifiez la réception sur votre WhatsApp

## 📊 Templates d'emails

### Design cohérent

Tous les emails utilisent :
- **Palette de couleurs** de l'application (#015fc4, #b8d1df, #fc2d1f)
- **Layout responsive** pour mobile et desktop
- **Boutons d'action** clairs et visibles
- **Informations complètes** sur la demande

### Personnalisation

Les templates sont dans `services/emailService.ts` :
- `generateValidationRequestTemplate()`
- `generateClosureRequestTemplate()`
- `generateStatusUpdateTemplate()`

## 🔍 Debugging

### Logs

Les notifications génèrent des logs dans la console :

```
Email envoyé: {
  messageId: "...",
  to: "user@example.com",
  type: "validation_request",
  timestamp: "2024-01-01T12:00:00.000Z"
}
```

### Erreurs courantes

1. **Variables d'environnement manquantes**
   - Vérifiez `.env.local`
   - Redémarrez le serveur de développement

2. **Authentification Gmail échouée**
   - Utilisez un mot de passe d'application
   - Vérifiez l'authentification à 2 facteurs

3. **Emails non reçus**
   - Vérifiez les spams
   - Testez avec différents fournisseurs email

## 🚀 Déploiement

### Variables de production

```env
EMAIL_USER=production@votre-domaine.com
EMAIL_PASSWORD=mot-de-passe-securise
NEXT_PUBLIC_APP_URL=https://votre-domaine.com
NODE_ENV=production
```

### Serveur SMTP

Pour la production, utilisez un service professionnel :
- **SendGrid**
- **Mailgun**
- **Amazon SES**
- **Serveur SMTP d'entreprise**

## 📈 Monitoring

### Métriques importantes

- Taux de livraison des emails
- Temps de réponse aux notifications
- Erreurs d'envoi
- Clics sur les boutons d'action

### Logs d'audit

Le système enregistre automatiquement :
- Tous les envois d'emails
- Erreurs et échecs
- Timestamps et destinataires

## 🔐 Sécurité

### Bonnes pratiques

- Utilisez des mots de passe d'application
- Chiffrez les variables sensibles
- Limitez les tentatives d'envoi
- Validez les adresses email
- Évitez les informations sensibles dans les emails

### Conformité

- Respectez le RGPD pour les données personnelles
- Incluez des liens de désinscription si nécessaire
- Documentez les traitements de données

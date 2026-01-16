# 📧 Système de Notifications Email - Guide Complet

## 🎉 Fonctionnalités Implémentées

### ✅ Notifications Automatiques
- **Demandes de validation** → Envoyées aux valideurs selon leur rôle
- **Demandes de clôture** → Envoyées aux demandeurs
- **Mises à jour de statut** → Informent toutes les parties prenantes
- **Rappels automatiques** → Pour demandes en attente >24h

### ✅ Déclencheurs Intelligents
| Statut | Destinataire | Action |
|--------|--------------|--------|
| `en_attente_validation_conducteur` | Conducteurs de travaux | Email de validation |
| `en_attente_validation_logistique` | Responsables logistique | Email de validation |
| `en_attente_validation_responsable_travaux` | Responsables travaux | Email de validation |
| `en_attente_validation_charge_affaire` | Chargés d'affaire | Email de validation |
| `en_attente_validation_finale_demandeur` | Demandeur | Email de clôture |
| `cloturee` | Parties prenantes | Notification de clôture |

## 🚀 Installation et Configuration

### 1. Dépendances
Les dépendances sont déjà installées :
```bash
npm install nodemailer @types/nodemailer
```

### 2. Variables d'environnement
Créez un fichier `.env.local` :
```env
# Configuration Gmail (recommandé)
EMAIL_USER=votre-email@gmail.com
EMAIL_PASSWORD=votre-mot-de-passe-application
EMAIL_FROM=noreply@gestion-materiel.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Configuration Gmail
1. Activez l'authentification à 2 facteurs
2. Générez un mot de passe d'application :
   - Google Account → Sécurité → Authentification à 2 facteurs
   - Mots de passe des applications → Générer
3. Utilisez ce mot de passe dans `EMAIL_PASSWORD`

## 📋 Utilisation

### Méthode 1 : Hook React (Recommandée)
```tsx
import { useNotifications } from '@/hooks/useNotifications'

const MyComponent = () => {
  const { notifyStatusChange } = useNotifications()
  
  const handleStatusUpdate = async (demande, newStatus) => {
    const oldStatus = demande.status
    
    // Mettre à jour en base
    await updateDemandeInDatabase(demande.id, newStatus)
    
    // Envoyer notifications
    await notifyStatusChange(demande, oldStatus, newStatus, users)
  }
}
```

### Méthode 2 : Fonction Utilitaire
```tsx
import { triggerStatusChangeNotifications } from '@/hooks/useNotifications'

await triggerStatusChangeNotifications(
  demandeId,
  'soumise',
  'en_attente_validation_conducteur',
  users,
  demandes
)
```

### Méthode 3 : Service Direct
```tsx
import { notificationService } from '@/services/notificationService'

await notificationService.handleStatusChange(
  demande,
  oldStatus,
  newStatus,
  users
)
```

## 🧪 Test du Système

### Composant de Test
Utilisez le composant de test intégré :
```tsx
import NotificationTest from '@/components/admin/notification-test'

<NotificationTest users={users} demandes={demandes} />
```

### Test Manuel
1. Configurez les variables d'environnement
2. Démarrez l'application : `npm run dev`
3. Accédez au composant de test
4. Sélectionnez un utilisateur et une demande
5. Testez l'envoi d'emails

### Exemple d'Intégration
Consultez le composant d'exemple :
```tsx
import NotificationIntegrationExample from '@/components/admin/notification-integration-example'
```

## 📊 Templates d'Emails

### Design Cohérent
- **Palette de couleurs** : #015fc4, #b8d1df, #fc2d1f
- **Responsive** : Compatible mobile et desktop
- **Boutons d'action** : Liens directs vers l'application
- **Informations complètes** : Détails de la demande

### Types de Templates
1. **Validation** : Pour les valideurs
2. **Clôture** : Pour les demandeurs
3. **Mise à jour** : Pour les changements de statut

## 🔧 Architecture

### Services
- **`emailService.ts`** : Envoi d'emails avec templates
- **`notificationService.ts`** : Logique métier des déclencheurs
- **`/api/notifications/email.ts`** : API endpoint avec Nodemailer

### Hooks
- **`useNotifications.ts`** : Interface React simple

### Composants
- **`notification-test.tsx`** : Tests d'emails
- **`notification-integration-example.tsx`** : Exemple d'usage

## 🔍 Debugging

### Logs Console
```
Email envoyé: {
  messageId: "...",
  to: "user@example.com",
  type: "validation_request",
  timestamp: "2024-01-01T12:00:00.000Z"
}
```

### Erreurs Courantes
1. **Variables manquantes** → Vérifiez `.env.local`
2. **Gmail échoué** → Utilisez un mot de passe d'application
3. **Emails non reçus** → Vérifiez les spams

## 🚀 Déploiement

### Production
```env
EMAIL_USER=production@votre-domaine.com
EMAIL_PASSWORD=mot-de-passe-securise
NEXT_PUBLIC_APP_URL=https://votre-domaine.com
NODE_ENV=production
```

### Services Recommandés
- **SendGrid** (professionnel)
- **Mailgun** (développeurs)
- **Amazon SES** (AWS)
- **Serveur SMTP** d'entreprise

## 📈 Fonctionnalités Avancées

### Rappels Automatiques
```tsx
import { setupNotificationTriggers } from '@/hooks/useNotifications'

// Démarre le planificateur de rappels
setupNotificationTriggers(users, demandes)
```

### Notifications Personnalisées
```tsx
import { emailService } from '@/services/emailService'

await emailService.notifyValidationRequest(validator, demande, requester)
await emailService.notifyClosureRequest(requester, demande)
```

## 🔐 Sécurité

### Bonnes Pratiques
- ✅ Mots de passe d'application Gmail
- ✅ Variables d'environnement chiffrées
- ✅ Validation des adresses email
- ✅ Logs d'audit complets
- ✅ Limitation des tentatives d'envoi

### Conformité RGPD
- Données personnelles protégées
- Liens de désinscription (si nécessaire)
- Documentation des traitements

## 📞 Support

### Documentation Complète
- **`docs/NOTIFICATIONS.md`** : Guide détaillé
- **Composants d'exemple** : Tests et intégration
- **Code commenté** : Services et hooks

### Fichiers Créés
```
services/
├── emailService.ts          # Service principal
├── notificationService.ts   # Logique métier
hooks/
├── useNotifications.ts      # Hook React
pages/api/notifications/
├── email.ts                 # API endpoint
components/admin/
├── notification-test.tsx    # Tests
├── notification-integration-example.tsx # Exemple
docs/
├── NOTIFICATIONS.md         # Documentation
.env.example                 # Configuration
```

## ✅ Statut : Prêt pour Production

Le système de notifications est **complètement fonctionnel** et prêt à être utilisé en production avec :
- Configuration flexible
- Gestion d'erreurs robuste
- Tests intégrés
- Documentation complète
- Exemples d'utilisation

**Configurez simplement vos variables d'environnement et commencez à utiliser le système !** 🚀

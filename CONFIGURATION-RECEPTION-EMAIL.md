# 📬 CONFIGURATION DE LA RÉCEPTION D'EMAILS (IMAP)

## ✅ SYSTÈME IMPLÉMENTÉ

Le système de réception d'emails permet de traiter automatiquement les réponses aux notifications envoyées. Les utilisateurs peuvent répondre directement par email pour valider, rejeter ou commenter des demandes.

---

## 🎯 FONCTIONNALITÉS

### Actions supportées par email :

| Action | Mots-clés détectés | Effet |
|--------|-------------------|-------|
| **Valider** | valider, approuver, ok | Valide la demande |
| **Rejeter** | rejeter, refuser, non | Rejette la demande |
| **Clôturer** | clôturer, cloture, terminer | Clôture la demande |
| **Commenter** | Tout texte avec numéro de demande | Ajoute un commentaire |

### Détection automatique :

- **Numéro de demande** : Extrait automatiquement (format: DA-M-2026-0001 ou DA-O-2026-0001)
- **Utilisateur** : Identifié par l'adresse email de l'expéditeur
- **Action** : Détectée par analyse du contenu (sujet + corps)
- **Commentaire** : Première ligne du corps de l'email

---

## ⚙️ CONFIGURATION REQUISE

### 1. Variables d'environnement

Ajoutez ces variables dans votre fichier `.env.local` :

#### Option A : Gmail (Recommandé)

```env
# Configuration IMAP Gmail
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=votre.email@gmail.com
IMAP_PASSWORD=votre_mot_de_passe_application_gmail

# OU utiliser les mêmes que pour l'envoi
# EMAIL_USER=votre.email@gmail.com
# EMAIL_PASSWORD=votre_mot_de_passe_application_gmail
```

#### Option B : SMTP Personnalisé

```env
# Configuration IMAP Personnalisé
IMAP_HOST=imap.votre-serveur.com
IMAP_PORT=993
IMAP_USER=votre@email.com
IMAP_PASSWORD=votre_mot_de_passe
```

#### Option C : Webhook (Avancé)

```env
# Token de sécurité pour webhooks
EMAIL_WEBHOOK_TOKEN=votre_token_secret_unique
```

### 2. Configuration Gmail (Option A)

Si vous utilisez Gmail, vous DEVEZ créer un **Mot de passe d'application** :

#### Étapes :

1. Allez sur https://myaccount.google.com/security
2. Activez la **Validation en 2 étapes** (obligatoire)
3. Allez dans **Mots de passe d'application**
4. Sélectionnez "Autre" et nommez-le "Gestion Demandes - IMAP"
5. Copiez le mot de passe généré (16 caractères)
6. Utilisez ce mot de passe dans `IMAP_PASSWORD`

**⚠️ N'utilisez JAMAIS votre mot de passe Gmail principal !**

**📧 Activez IMAP dans Gmail :**
1. Paramètres Gmail → Transfert et POP/IMAP
2. Activez "Activer IMAP"
3. Enregistrez les modifications

---

## 🚀 UTILISATION

### 1. Interface Admin

Le composant `EmailMonitoring` est accessible dans le dashboard Super Admin :

```tsx
import { EmailMonitoring } from "@/components/admin/email-monitoring"

// Dans votre page admin
<EmailMonitoring />
```

**Fonctionnalités :**
- ✅ Démarrer/arrêter la surveillance automatique
- ✅ Configurer l'intervalle de vérification (1-60 minutes)
- ✅ Traiter manuellement les emails non lus
- ✅ Voir les statistiques de traitement
- ✅ Consulter les emails récents

### 2. API Endpoints

#### GET /api/emails/receive
Traite tous les emails non lus manuellement.

**Réponse :**
```json
{
  "success": true,
  "data": {
    "stats": {
      "total": 5,
      "processed": 4,
      "failed": 1,
      "byAction": {
        "validate": 2,
        "reject": 1,
        "close": 1,
        "comment": 0,
        "unknown": 1
      }
    },
    "emails": [...]
  }
}
```

#### POST /api/emails/monitor
Démarre la surveillance automatique.

**Body :**
```json
{
  "intervalMinutes": 5
}
```

#### DELETE /api/emails/monitor
Arrête la surveillance automatique.

#### GET /api/emails/monitor
Vérifie le statut de la surveillance.

---

## 📧 FORMAT DES EMAILS DE RÉPONSE

### Exemple 1 : Validation

**Sujet :** Re: Demande à valider - DA-M-2026-0001  
**Corps :**
```
Je valide cette demande.

Cordialement,
Jean Dupont
```

**Résultat :** Demande DA-M-2026-0001 validée

### Exemple 2 : Rejet

**Sujet :** Re: Demande à valider - DA-O-2026-0015  
**Corps :**
```
Je rejette cette demande car le matériel n'est pas disponible.
```

**Résultat :** Demande DA-O-2026-0015 rejetée avec commentaire

### Exemple 3 : Clôture

**Sujet :** Re: Demande à clôturer - DA-M-2026-0008  
**Corps :**
```
Clôturer
Matériel bien reçu, merci.
```

**Résultat :** Demande DA-M-2026-0008 clôturée

### Exemple 4 : Commentaire

**Sujet :** Re: Mise à jour - DA-M-2026-0003  
**Corps :**
```
Quand est prévu la livraison ?
```

**Résultat :** Commentaire ajouté à DA-M-2026-0003

---

## 🔧 SURVEILLANCE AUTOMATIQUE

### Configuration recommandée :

```typescript
// Intervalle de vérification : 5 minutes (par défaut)
// Peut être configuré de 1 à 60 minutes

// Démarrage automatique au lancement du serveur (optionnel)
// Dans app/api/emails/monitor/route.ts
```

### Logs de surveillance :

```
🔄 [IMAP] Démarrage surveillance (intervalle: 5min)
✅ [IMAP] Connexion établie
📬 [IMAP] 3 nouveaux emails traités
📧 [IMAP] Action validate sur DA-M-2026-0001 par jean.dupont@example.com
✅ [IMAP] Validation de DA-M-2026-0001
```

---

## 🧪 TESTER LE SYSTÈME

### Test Manuel :

1. **Configurer les variables d'environnement**
2. **Démarrer l'application** : `npm run dev`
3. **Accéder au dashboard Super Admin**
4. **Ouvrir l'interface "Surveillance des Emails"**
5. **Cliquer sur "Traiter les emails maintenant"**
6. **Vérifier les logs console**

### Test avec un email réel :

1. **Créer une demande** dans l'application
2. **Recevoir l'email de notification**
3. **Répondre à l'email** avec "Je valide"
4. **Traiter les emails** via l'interface admin
5. **Vérifier** que la demande a été validée

### Logs attendus :

```
📧 [API] Traitement des emails entrants...
✅ [IMAP] Connexion établie
🔍 [IMAP] Parsing email de jean.dupont@example.com
📧 [IMAP] Action validate sur DA-M-2026-0001 par jean.dupont@example.com
✅ [IMAP] Validation de DA-M-2026-0001
✅ [API] 1/1 emails traités avec succès
```

---

## 🚨 DÉPANNAGE

### Problème : Connexion IMAP échouée

**Erreur :**
```
❌ [IMAP] Erreur de connexion: Invalid login
```

**Solutions :**
1. ✅ Vérifier `IMAP_USER` et `IMAP_PASSWORD`
2. ✅ Utiliser un mot de passe d'application Gmail (pas le mot de passe principal)
3. ✅ Vérifier que IMAP est activé dans Gmail
4. ✅ Vérifier que la validation en 2 étapes est activée
5. ✅ Tester la connexion avec un client IMAP (Thunderbird, etc.)

### Problème : Emails non traités

**Vérifications :**
1. ✅ Email marqué comme non lu dans la boîte de réception
2. ✅ Numéro de demande présent dans le sujet ou le corps
3. ✅ Expéditeur enregistré dans la base de données
4. ✅ Mots-clés d'action présents dans le contenu

### Problème : Action non détectée

**Solution :**
- Vérifier que le contenu contient un mot-clé reconnu
- Ajouter le numéro de demande dans le sujet ou le corps
- Consulter les logs pour voir l'action détectée :
  ```
  🔍 [IMAP] Action détectée: unknown
  ```

### Problème : Permissions insuffisantes

**Erreur :**
```
⚠️ [IMAP] Utilisateur user-123 ne peut pas valider cette demande
```

**Solution :**
- Vérifier que l'utilisateur a le rôle approprié
- Vérifier que l'utilisateur est assigné au projet
- Consulter les permissions dans la base de données

---

## 📊 ARCHITECTURE TECHNIQUE

### Composants :

1. **Service IMAP** (`lib/email-receiver.ts`)
   - Connexion au serveur IMAP
   - Récupération des emails non lus
   - Parsing et extraction des actions
   - Exécution des actions

2. **API Endpoints** (`app/api/emails/`)
   - `/receive` : Traitement manuel
   - `/monitor` : Gestion de la surveillance

3. **Composant Admin** (`components/admin/email-monitoring.tsx`)
   - Interface de gestion
   - Statistiques en temps réel
   - Configuration de la surveillance

### Dépendances :

```json
{
  "imapflow": "^1.0.0",     // Client IMAP moderne
  "mailparser": "^3.0.0"     // Parser d'emails
}
```

### Sécurité :

- ✅ Authentification admin requise pour tous les endpoints
- ✅ Vérification des permissions utilisateur
- ✅ Validation des numéros de demande
- ✅ Logs d'audit complets
- ✅ Token webhook pour intégrations externes

---

## 🎯 UTILISATION EN PRODUCTION

### Recommandations :

1. **Utiliser un compte email dédié** :
   - Créer un compte spécifique (ex: demandes@votre-entreprise.com)
   - Ne pas utiliser un compte personnel
   - Configurer des règles de filtrage

2. **Configurer la surveillance automatique** :
   - Intervalle recommandé : 5-10 minutes
   - Éviter les intervalles trop courts (< 2 min)
   - Surveiller les quotas IMAP

3. **Monitoring** :
   - Activer les logs Sentry pour les erreurs
   - Suivre le taux de traitement des emails
   - Créer des alertes pour les échecs répétés

4. **Limites Gmail** :
   - 2500 emails/jour en réception
   - 15 Go de stockage
   - Utiliser un service dédié pour > 1000 emails/jour

5. **Alternative : Webhooks** :
   - SendGrid Inbound Parse
   - Mailgun Routes
   - AWS SES + Lambda
   - Plus fiable et scalable pour la production

---

## ✅ CHECKLIST DE DÉPLOIEMENT

- [ ] Variables d'environnement IMAP configurées
- [ ] Mot de passe d'application Gmail créé
- [ ] IMAP activé dans Gmail
- [ ] Test de connexion IMAP réussi
- [ ] Test de traitement d'email réussi
- [ ] Surveillance automatique configurée
- [ ] Logs de monitoring activés
- [ ] Documentation utilisateur créée
- [ ] Formation des administrateurs effectuée

---

## 📞 SUPPORT

### Ressources :

- [Documentation ImapFlow](https://github.com/postalsys/imapflow)
- [Documentation MailParser](https://nodemailer.com/extras/mailparser/)
- [Gmail IMAP Settings](https://support.google.com/mail/answer/7126229)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)

### Debug :

```bash
# Activer les logs détaillés
# Dans lib/email-receiver.ts, ligne 30
logger: console  // Au lieu de false
```

---

## 🔄 INTÉGRATION AVEC LE SYSTÈME EXISTANT

### Workflow complet :

1. **Notification envoyée** (système existant)
   - Email avec lien de validation
   - Numéro de demande inclus

2. **Utilisateur répond par email**
   - Réponse directe à l'email
   - Contient action + commentaire

3. **Email reçu et traité**
   - Surveillance IMAP détecte l'email
   - Action extraite et exécutée
   - Demande mise à jour

4. **Notification de confirmation**
   - Email de confirmation envoyé
   - Mise à jour du statut visible

### Compatibilité :

- ✅ Compatible avec le système d'envoi existant
- ✅ Utilise les mêmes credentials email
- ✅ Respecte les permissions et rôles
- ✅ S'intègre avec les APIs existantes

---

**Date de création** : 19 Octobre 2025  
**Status** : ✅ **SYSTÈME IMPLÉMENTÉ ET PRÊT À TESTER**  
**Prochaine étape** : Configurer les variables d'environnement et tester la réception

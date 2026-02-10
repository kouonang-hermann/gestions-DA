# 📊 Système de Notifications Analytiques Automatiques

## Vue d'ensemble

Ce système génère et envoie automatiquement un rapport analytique quotidien au directeur chaque matin à 05:00 UTC.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         VERCEL CRON                                  │
│                     (0 5 * * * = 05:00 UTC)                         │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│              /api/cron/daily-analytics (route.ts)                   │
│                                                                      │
│  1. Vérifie l'authentification (CRON_SECRET)                        │
│  2. Appelle generateDailySnapshot()                                 │
│  3. Appelle sendDailyAnalyticsReport()                              │
│  4. Met à jour les métadonnées                                      │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│  analytics-snapshot.ts  │    │    email-service.ts     │
│                         │    │                         │
│  • generateTableau1Data │    │  • generateDailyReport  │
│  • generateTableau3Data │    │  • sendEmail (Resend)   │
│  • generateDailySnapshot│    │  • sendDailyAnalytics   │
└───────────┬─────────────┘    └───────────┬─────────────┘
            │                               │
            ▼                               ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│ DailyAnalyticsSnapshot  │    │    NotificationLog      │
│ (Prisma Model)          │    │    (Prisma Model)       │
│                         │    │                         │
│  • date (unique)        │    │  • channel (email/wa)   │
│  • tableau1 (JSON)      │    │  • status               │
│  • tableau3 (JSON)      │    │  • recipient            │
│  • metadata (JSON)      │    │  • sentAt               │
└─────────────────────────┘    └─────────────────────────┘
```

## Fichiers créés

| Fichier | Description |
|---------|-------------|
| `prisma/schema.prisma` | Modèles `DailyAnalyticsSnapshot` et `NotificationLog` |
| `lib/analytics-snapshot.ts` | Service de génération des snapshots |
| `lib/email-service.ts` | Service d'envoi d'emails HTML |
| `app/api/cron/daily-analytics/route.ts` | Endpoint CRON Vercel |
| `vercel.json` | Configuration CRON |

## Configuration requise

### Variables d'environnement

```bash
# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxxx
DIRECTOR_EMAIL=directeur@instrumelec.com
EMAIL_FROM=InstrumElec <notifications@instrumelec.com>

# CRON Security
CRON_SECRET=votre-secret-cron-ultra-securise

# Application URL
NEXT_PUBLIC_APP_URL=https://votre-app.vercel.app
```

### Configuration Resend

1. Créer un compte sur [resend.com](https://resend.com)
2. Vérifier votre domaine ou utiliser le domaine de test
3. Générer une clé API
4. Ajouter la clé dans les variables d'environnement Vercel

### Configuration Vercel CRON

Le CRON est déjà configuré dans `vercel.json` :

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-analytics",
      "schedule": "0 5 * * *"
    }
  ]
}
```

> ⚠️ **Important** : Les CRON Vercel nécessitent un plan Pro pour une fiabilité garantie. Sur le plan gratuit, les CRONs peuvent être retardés ou sautés.

## Usage

### Déclenchement automatique

Le job s'exécute automatiquement chaque jour à 05:00 UTC.

### Déclenchement manuel

```bash
# Via curl
curl -X POST https://votre-app.vercel.app/api/cron/daily-analytics \
  -H "Authorization: Bearer VOTRE_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"forceRegenerate": false}'

# Forcer la régénération
curl -X POST https://votre-app.vercel.app/api/cron/daily-analytics \
  -H "Authorization: Bearer VOTRE_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"forceRegenerate": true}'
```

### Vérification du statut

```bash
# Via GET (utilisé par Vercel CRON)
curl https://votre-app.vercel.app/api/cron/daily-analytics \
  -H "Authorization: Bearer VOTRE_CRON_SECRET"
```

## Modèle de données

### DailyAnalyticsSnapshot

```prisma
model DailyAnalyticsSnapshot {
  id               String            @id @default(uuid())
  date             DateTime          @unique @db.Date
  tableau1         Json              // Données TABLEAU 1
  tableau3         Json              // Données TABLEAU 3
  metadata         Json?             // Métadonnées d'exécution
  createdAt        DateTime          @default(now())
  notificationLogs NotificationLog[]
}
```

### NotificationLog

```prisma
model NotificationLog {
  id           String                 @id @default(uuid())
  snapshotId   String?
  channel      NotificationChannel    // email, whatsapp, sms
  recipient    String
  status       NotificationStatus     // pending, sent, failed, retrying
  errorMessage String?
  sentAt       DateTime?
  createdAt    DateTime               @default(now())
  retryCount   Int                    @default(0)
  snapshot     DailyAnalyticsSnapshot?
}
```

## Contenu de l'email

L'email contient :

1. **Résumé exécutif** (4 KPIs)
   - Projets impactés
   - Coût restant total
   - Articles restants
   - Articles non valorisés

2. **TABLEAU 1 : Synthèse Projets Bloqués**
   - Projet, Articles, Quantité, Coût

3. **TABLEAU 3 : Articles Non Valorisés**
   - Projet, Type, Articles, Jours sans valorisation

4. **Alertes visuelles**
   - 🔴 Rouge : Blocages > 7 jours
   - 🟡 Orange : Points de vigilance
   - 🟢 Vert : Situation normale

## Extension WhatsApp (future)

Le système est préparé pour l'extension WhatsApp :

```typescript
// lib/email-service.ts
export async function sendWhatsAppMessage(options: WhatsAppOptions): Promise<EmailResult> {
  // TODO: Implémenter avec Twilio / MessageBird / WhatsApp Cloud API
}
```

Options recommandées :
- **Twilio WhatsApp Business API** (le plus simple)
- **MessageBird**
- **WhatsApp Cloud API** (Meta)

## Logs et debugging

Les logs sont structurés avec des préfixes :

```
🕐 [CRON] Démarrage du job analytique quotidien
📊 [CRON] Étape 1/3 : Génération du snapshot...
✅ [CRON] Snapshot généré: abc123 (245ms)
📧 [CRON] Étape 2/3 : Envoi de l'email au directeur...
✅ [CRON] Email envoyé: msg_123
📝 [CRON] Étape 3/3 : Mise à jour des métadonnées...
✅ [CRON] Job terminé en 1234ms
```

## Gestion des erreurs

| Erreur | Cause | Solution |
|--------|-------|----------|
| `RESEND_API_KEY non configurée` | Variable manquante | Ajouter dans Vercel |
| `DIRECTOR_EMAIL non configuré` | Variable manquante | Ajouter dans Vercel |
| `Non autorisé` | CRON_SECRET incorrect | Vérifier le secret |
| `Erreur Resend` | Problème API email | Vérifier la clé/domaine |

## Maintenance

### Vérifier les snapshots

```sql
SELECT date, 
       (tableau1->>'totaux')::json->>'nombreProjetsImpactes' as projets,
       (metadata->>'emailSent')::boolean as email_sent
FROM daily_analytics_snapshots
ORDER BY date DESC
LIMIT 10;
```

### Vérifier les notifications

```sql
SELECT channel, status, recipient, sentAt, errorMessage
FROM notification_logs
ORDER BY createdAt DESC
LIMIT 20;
```

### Nettoyer les anciens snapshots

```sql
-- Garder 90 jours
DELETE FROM daily_analytics_snapshots
WHERE date < NOW() - INTERVAL '90 days';
```

## Coûts estimés

| Service | Plan gratuit | Limite |
|---------|--------------|--------|
| Vercel CRON | Hobby | 1/jour, pas de garantie SLA |
| Vercel CRON | Pro | Illimité, SLA garanti |
| Resend | Free | 100 emails/jour |
| Resend | Pro | 50k emails/mois |

## Checklist de déploiement

- [ ] Ajouter `RESEND_API_KEY` dans Vercel
- [ ] Ajouter `DIRECTOR_EMAIL` dans Vercel
- [ ] Ajouter `CRON_SECRET` dans Vercel
- [ ] Ajouter `EMAIL_FROM` dans Vercel (optionnel)
- [ ] Appliquer les migrations Prisma : `npx prisma db push`
- [ ] Tester manuellement le CRON
- [ ] Vérifier la réception de l'email

---

**Version** : 1.0  
**Date** : Février 2026  
**Auteur** : InstrumElec Team

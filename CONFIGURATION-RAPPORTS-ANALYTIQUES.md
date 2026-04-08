# 📊 CONFIGURATION DES RAPPORTS ANALYTIQUES PAR EMAIL

## ✅ SYSTÈME IMPLÉMENTÉ

Le système d'envoi de rapports analytiques quotidiens est maintenant **ACTIF**. Le Super Admin reçoit automatiquement un rapport détaillé sur les projets bloqués et les articles non valorisés.

---

## 🎯 CONTENU DU RAPPORT

### Rapports inclus :

Le rapport email contient les **3 tableaux analytiques** de la vue Direction :

#### 📋 **Tableau 1 : Synthèse Projets Bloqués**
- Liste des projets impactés
- Nombre d'articles restants par projet
- Quantité totale restante
- Articles non valorisés par projet
- Coût total restant par projet
- Tri par coût décroissant

#### ⚠️ **Tableau 3 : Articles Non Valorisés (Priorité)**
- Agrégation par projet et type (Matériel/Outillage)
- Nombre d'articles sans prix unitaire
- Quantité totale non valorisée
- **Alerte visuelle** si > 20 articles

#### 📦 **Tableau 2 : Top 20 Articles Restants**
- Détail des 20 articles avec le plus grand coût restant
- Numéro de demande
- Projet
- Nom de l'article
- Quantité restante
- Prix unitaire (ou "Non valorisé")
- Coût restant calculé

### Résumé Exécutif :

Chaque rapport commence par un **résumé exécutif** avec :
- 📊 Nombre de projets impactés
- 📦 Total des articles restants
- ⚠️ Nombre d'articles non valorisés
- 💰 Coût total restant

### Niveau d'Alerte Automatique :

Le rapport affiche automatiquement un niveau d'alerte :
- 🟢 **Situation normale** : < 20 articles non valorisés
- 🟡 **Points de vigilance** : 20-50 articles non valorisés
- 🔴 **ATTENTION REQUISE** : > 50 articles non valorisés

---

## ⚙️ CONFIGURATION

### Variables d'environnement requises :

Le système utilise les **mêmes credentials** que les notifications email :

```env
# Configuration Gmail (déjà configurée pour les notifications)
EMAIL_USER=votre-email@gmail.com
EMAIL_PASSWORD=votre-mot-de-passe-application
EMAIL_FROM=Gestion Demandes <noreply@gestion-materiel.com>

# URL de l'application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Aucune configuration supplémentaire nécessaire** si les notifications email fonctionnent déjà.

---

## 🚀 UTILISATION

### 1. Envoi Manuel (Interface Admin)

Le composant `AnalyticsReportSender` est accessible dans le dashboard Super Admin :

```tsx
import { AnalyticsReportSender } from "@/components/admin/analytics-report-sender"

// Dans votre page admin
<AnalyticsReportSender />
```

**Fonctionnalités :**
- ✅ Bouton "Envoyer le Rapport Maintenant" → Envoie au Super Admin
- ✅ Envoi de test à un email spécifique
- ✅ Affichage du dernier envoi
- ✅ Informations sur le contenu du rapport

### 2. Envoi via API

#### GET /api/analytics/send-report
Envoie le rapport au Super Admin automatiquement.

**Exemple :**
```bash
curl https://votre-app.com/api/analytics/send-report
```

**Réponse :**
```json
{
  "success": true,
  "message": "Rapport analytique envoyé avec succès"
}
```

#### POST /api/analytics/send-report
Envoie le rapport à un email spécifique.

**Body :**
```json
{
  "email": "directeur@entreprise.com"
}
```

---

## ⏰ ENVOI AUTOMATIQUE QUOTIDIEN

### Option 1 : Vercel Cron Jobs (Recommandé)

Créez ou modifiez le fichier `vercel.json` à la racine du projet :

```json
{
  "crons": [
    {
      "path": "/api/analytics/send-report",
      "schedule": "0 8 * * *"
    }
  ]
}
```

**Configuration :**
- `0 8 * * *` : Tous les jours à 8h00 (heure UTC)
- Pour 8h00 heure de Paris (UTC+1) : `0 7 * * *`
- Pour 9h00 heure de Paris : `0 8 * * *`

**Activation :**
1. Créer/modifier `vercel.json`
2. Commit et push sur Vercel
3. Le cron job sera automatiquement activé

### Option 2 : Cron Linux/Unix

Si vous hébergez sur un serveur Linux :

```bash
# Éditer le crontab
crontab -e

# Ajouter la ligne suivante (envoi à 8h00)
0 8 * * * curl -X GET https://votre-app.com/api/analytics/send-report
```

### Option 3 : GitHub Actions

Créez `.github/workflows/daily-report.yml` :

```yaml
name: Daily Analytics Report

on:
  schedule:
    - cron: '0 8 * * *'  # 8h00 UTC
  workflow_dispatch:  # Permet déclenchement manuel

jobs:
  send-report:
    runs-on: ubuntu-latest
    steps:
      - name: Send Analytics Report
        run: |
          curl -X GET https://votre-app.com/api/analytics/send-report
```

### Option 4 : Service externe (EasyCron, etc.)

Utilisez un service de cron en ligne :
- **EasyCron** : https://www.easycron.com
- **Cron-job.org** : https://cron-job.org

Configuration :
- URL : `https://votre-app.com/api/analytics/send-report`
- Méthode : GET
- Fréquence : Tous les jours à 8h00

---

## 📧 FORMAT DE L'EMAIL

### Design :

- ✅ **Template HTML responsive** (mobile + desktop)
- ✅ **Palette de couleurs cohérente** (#015fc4, #b8d1df, #fc2d1f)
- ✅ **Bannière d'alerte** colorée selon le niveau
- ✅ **Tableaux formatés** avec tri et mise en forme
- ✅ **Bouton d'action** vers le dashboard complet
- ✅ **Version texte** pour les clients email basiques

### Exemple de sujet :

```
📊 Rapport Analytique Direction - 02/04/2026
```

### Structure :

```
┌─────────────────────────────────────────┐
│  📊 Rapport Analytique Direction        │
│  Vendredi 2 avril 2026 à 08:00         │
├─────────────────────────────────────────┤
│  [Bannière d'alerte colorée]            │
├─────────────────────────────────────────┤
│  RÉSUMÉ EXÉCUTIF                        │
│  ┌─────────┬─────────┬─────────┬──────┐│
│  │Projets  │Articles │Non      │Coût  ││
│  │Impactés │Restants │Valorisés│Total ││
│  └─────────┴─────────┴─────────┴──────┘│
├─────────────────────────────────────────┤
│  TABLEAU 1 : Synthèse Projets Bloqués  │
│  [Tableau détaillé]                     │
├─────────────────────────────────────────┤
│  TABLEAU 3 : Articles Non Valorisés    │
│  [Tableau avec alertes]                 │
├─────────────────────────────────────────┤
│  TABLEAU 2 : Top 20 Articles Restants  │
│  [Tableau détaillé]                     │
├─────────────────────────────────────────┤
│  [Bouton: Voir le Dashboard Complet]   │
└─────────────────────────────────────────┘
```

---

## 🧪 TESTER LE SYSTÈME

### Test Manuel :

1. **Se connecter en tant que Super Admin**
2. **Accéder à l'interface "Rapports Analytiques"**
3. **Cliquer sur "Envoyer le Rapport Maintenant"**
4. **Vérifier l'email dans la boîte de réception**

### Test avec email spécifique :

1. **Entrer un email de test** dans le champ prévu
2. **Cliquer sur "Envoyer"**
3. **Vérifier l'email reçu**

### Logs attendus :

```
📧 [ANALYTICS] Génération du rapport analytique...
📧 [ANALYTICS] Envoi du rapport à test@example.com (Super Admin)
✅ [ANALYTICS] Rapport envoyé avec succès: <message-id>
```

---

## 🚨 DÉPANNAGE

### Problème : Email non reçu

**Vérifications :**
1. ✅ Variables `EMAIL_USER` et `EMAIL_PASSWORD` correctes
2. ✅ Mot de passe d'application Gmail (pas le mot de passe principal)
3. ✅ Super Admin a une adresse email valide dans la base de données
4. ✅ Vérifier les spams/courrier indésirable
5. ✅ Consulter les logs console pour erreurs

### Problème : Erreur SMTP

```
❌ [ANALYTICS] Erreur envoi rapport: Invalid login
```

**Solution :**
- Vérifier `EMAIL_USER` et `EMAIL_PASSWORD`
- Utiliser un mot de passe d'application Gmail
- Vérifier que le compte n'est pas bloqué

### Problème : Super Admin non trouvé

```
❌ [ANALYTICS] Super Admin non trouvé ou sans email
```

**Solution :**
- Vérifier qu'un utilisateur avec `role: 'superadmin'` existe
- Vérifier que cet utilisateur a une adresse email valide
- Consulter la base de données

### Problème : Données vides

**Si le rapport affiche "Aucun projet bloqué" :**
- C'est normal si toutes les demandes sont livrées
- Vérifier qu'il existe des demandes avec statut :
  - `en_attente_preparation_appro`
  - `en_attente_preparation_logistique`
- Vérifier que ces demandes ont des items avec quantité restante > 0

---

## 📊 DONNÉES INCLUSES

### Critères de sélection :

Le rapport inclut uniquement les demandes avec :
- **Statut** : `en_attente_preparation_appro` OU `en_attente_preparation_logistique`
- **Items** : Quantité restante > 0 (Validée - Reçue)

### Calculs :

**Quantité restante :**
```
Quantité restante = Quantité validée - Quantité reçue
(Fallback: Quantité validée - Quantité livrée totale)
```

**Coût restant :**
```
Coût restant = Quantité restante × Prix unitaire
(Si prix unitaire = null → Article non valorisé)
```

**Agrégations :**
- **Tableau 1** : Par projet (somme des articles)
- **Tableau 3** : Par projet + type de demande
- **Tableau 2** : Par article individuel (top 20)

---

## 🎯 UTILISATION EN PRODUCTION

### Recommandations :

1. **Envoi quotidien automatique**
   - Configurer Vercel Cron ou équivalent
   - Heure recommandée : 8h00 du matin
   - Permet à la direction de voir la situation dès le début de journée

2. **Monitoring**
   - Activer les logs Sentry pour les erreurs
   - Créer des alertes si l'envoi échoue
   - Vérifier régulièrement que les emails sont reçus

3. **Personnalisation**
   - Modifier le template HTML dans `lib/analytics-email-service.ts`
   - Ajouter le logo de l'entreprise
   - Adapter les couleurs à la charte graphique

4. **Destinataires multiples**
   - Modifier `sendReportToSuperAdmin()` pour envoyer à plusieurs emails
   - Ou créer un groupe de distribution email

5. **Fréquence alternative**
   - Hebdomadaire : `0 8 * * 1` (tous les lundis)
   - Bi-hebdomadaire : `0 8 * * 1,4` (lundi et jeudi)

---

## 📁 FICHIERS CRÉÉS

```
gestion-demandes-materiel/
├── lib/
│   └── analytics-email-service.ts          🆕 Service d'envoi de rapports
│
├── app/api/analytics/
│   └── send-report/route.ts                🆕 API endpoint
│
├── components/admin/
│   └── analytics-report-sender.tsx         🆕 Interface admin
│
└── docs/
    └── CONFIGURATION-RAPPORTS-ANALYTIQUES.md  🆕 Ce fichier
```

---

## ✅ CHECKLIST DE DÉPLOIEMENT

### Configuration :
- [ ] Variables d'environnement EMAIL_USER et EMAIL_PASSWORD configurées
- [ ] Super Admin a une adresse email valide dans la base de données
- [ ] Test d'envoi manuel réussi

### Automatisation :
- [ ] Vercel Cron configuré (ou équivalent)
- [ ] Heure d'envoi définie (recommandé: 8h00)
- [ ] Premier envoi automatique vérifié

### Monitoring :
- [ ] Logs activés pour suivre les envois
- [ ] Alertes configurées en cas d'échec
- [ ] Vérification régulière de la réception

### Documentation :
- [ ] Équipe direction informée du nouveau rapport
- [ ] Instructions de lecture du rapport partagées
- [ ] Contact support défini en cas de problème

---

## 📞 SUPPORT

### En cas de problème :

1. **Consulter les logs console** (F12 dans le navigateur)
2. **Vérifier les variables d'environnement**
3. **Tester l'envoi manuel** via l'interface admin
4. **Consulter cette documentation**

### Ressources :

- [Nodemailer Documentation](https://nodemailer.com/about/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)

---

## 🎉 RÉSUMÉ

### Ce qui a été implémenté :

✅ **Service de génération de rapports**
- Récupération des données des 3 tableaux analytiques
- Calculs automatiques des totaux et agrégations
- Génération de templates HTML et texte

✅ **API d'envoi**
- Endpoint GET pour envoi au Super Admin
- Endpoint POST pour envoi à un email spécifique
- Authentification admin requise

✅ **Interface d'administration**
- Bouton d'envoi manuel
- Test avec email personnalisé
- Informations sur le contenu
- Instructions pour l'automatisation

✅ **Template email professionnel**
- Design responsive
- Bannière d'alerte colorée
- Tableaux formatés
- Lien vers le dashboard

### Bénéfices :

🚀 **Visibilité Direction**
- Rapport quotidien automatique
- Vue d'ensemble des projets bloqués
- Alertes sur articles non valorisés

📊 **Prise de décision**
- Données consolidées et claires
- Priorisation automatique
- Coûts calculés

⏰ **Gain de temps**
- Pas besoin de se connecter
- Rapport dans la boîte email
- Lien direct vers le dashboard

---

**Date de création** : 02 Avril 2026  
**Status** : ✅ **SYSTÈME IMPLÉMENTÉ ET PRÊT À UTILISER**  
**Prochaine étape** : Tester l'envoi manuel puis configurer l'envoi automatique quotidien

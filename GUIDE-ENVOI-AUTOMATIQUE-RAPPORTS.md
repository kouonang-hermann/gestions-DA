# 📧 GUIDE - ENVOI AUTOMATIQUE DES RAPPORTS ANALYTIQUES

## ✅ CONFIGURATION TERMINÉE

Le système est maintenant configuré pour envoyer **automatiquement** les rapports analytiques quotidiens au Super Admin **M. Foutsap Aristide** (`aristide.foutsap@instrumelec.com`).

---

## 🎯 CE QUI A ÉTÉ CONFIGURÉ

### 1. **Credentials Email** (`.env.local`)
```env
EMAIL_USER=hermannfipa@gmail.com
EMAIL_PASSWORD=xahxltttmftbotcb
EMAIL_FROM=Gestion Demandes <hermannfipa@gmail.com>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. **Cron Job Automatique** (`vercel.json`)
- **Endpoint** : `/api/analytics/send-report`
- **Fréquence** : Tous les jours à **8h00** (heure locale)
- **Schedule** : `0 7 * * *` (7h00 UTC = 8h00 UTC+1)

### 3. **Destinataire**
- **Nom** : M. Foutsap Aristide
- **Email** : aristide.foutsap@instrumelec.com
- **Rôle** : Super Admin

---

## 📊 CONTENU DU RAPPORT QUOTIDIEN

Chaque matin à 8h00, M. Foutsap Aristide recevra un email contenant :

### **📋 Tableau 1 : Synthèse Projets Bloqués**
- Liste des projets impactés
- Nombre d'articles restants par projet
- Quantité totale restante
- Articles non valorisés
- Coût total restant (trié par coût décroissant)

### **⚠️ Tableau 3 : Articles Non Valorisés (Priorité)**
- Agrégation par projet et type (Matériel/Outillage)
- Nombre d'articles sans prix unitaire
- Quantité totale non valorisée
- **Alerte visuelle** si > 20 articles

### **📦 Tableau 2 : Top 20 Articles Restants**
- Détail des 20 articles avec le plus grand coût restant
- Numéro de demande, projet, nom article
- Quantité restante, prix unitaire, coût restant

### **📊 Résumé Exécutif**
- Projets impactés
- Total articles restants
- Articles non valorisés
- Coût total restant
- **Niveau d'alerte automatique** (🟢 Normal / 🟡 Vigilance / 🔴 Attention)

---

## 🚀 ACTIVATION DE L'ENVOI AUTOMATIQUE

### **Si Déployé sur Vercel**

1. **Commit et Push** :
   ```bash
   git add .
   git commit -m "Configuration envoi automatique rapports analytiques"
   git push
   ```

2. **Vérifier sur Vercel** :
   - Allez sur votre dashboard Vercel
   - Section "Cron Jobs"
   - Vérifiez que le cron `/api/analytics/send-report` est actif

3. **Configurer les Variables d'Environnement sur Vercel** :
   - Settings → Environment Variables
   - Ajoutez :
     - `EMAIL_USER` = `hermannfipa@gmail.com`
     - `EMAIL_PASSWORD` = `xahxltttmftbotcb`
     - `EMAIL_FROM` = `Gestion Demandes <hermannfipa@gmail.com>`

### **Si Déployé sur un Serveur Linux**

Ajoutez un cron job sur le serveur :

```bash
# Éditer le crontab
crontab -e

# Ajouter cette ligne (envoi à 8h00 chaque jour)
0 8 * * * curl -X GET https://votre-domaine.com/api/analytics/send-report
```

---

## 🧪 TESTER L'ENVOI MANUEL

### **Option 1 : Via Script**
```bash
npx tsx scripts/send-report-now.ts
```

### **Option 2 : Via API**
```bash
# Envoyer au Super Admin
curl http://localhost:3000/api/analytics/send-report

# Envoyer à un email spécifique (pour test)
curl -X POST http://localhost:3000/api/analytics/send-report \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

### **Option 3 : Via Interface Admin**

Ajoutez le composant `AnalyticsReportSender` dans votre dashboard admin :

```tsx
import { AnalyticsReportSender } from "@/components/admin/analytics-report-sender"

// Dans votre page admin
<AnalyticsReportSender />
```

---

## 📅 HORAIRE D'ENVOI

### **Heure Configurée**
- **7h00 UTC** = **8h00 heure locale** (UTC+1)
- Tous les jours, 7 jours sur 7

### **Modifier l'Horaire**

Éditez `vercel.json` :

```json
"crons": [
  {
    "path": "/api/analytics/send-report",
    "schedule": "0 7 * * *"  // Modifier ici
  }
]
```

**Exemples de schedules** :
- `0 7 * * *` : Tous les jours à 7h00 UTC (8h00 locale)
- `0 6 * * *` : Tous les jours à 6h00 UTC (7h00 locale)
- `0 8 * * 1` : Tous les lundis à 8h00 UTC
- `0 8 * * 1,4` : Lundis et jeudis à 8h00 UTC

---

## 🔧 DÉPANNAGE

### **Le rapport n'est pas reçu**

1. **Vérifier les logs Vercel** :
   - Dashboard Vercel → Logs
   - Chercher les erreurs du cron job

2. **Vérifier l'email du Super Admin** :
   ```sql
   SELECT email FROM users WHERE role = 'superadmin';
   ```

3. **Tester manuellement** :
   ```bash
   npx tsx scripts/send-report-now.ts
   ```

4. **Vérifier les spams** :
   - Le rapport peut arriver dans les courriers indésirables

### **Erreur "Missing credentials"**

- Vérifier que les variables d'environnement sont bien configurées sur Vercel
- Vérifier que le mot de passe d'application Gmail est correct

### **Erreur "Super Admin non trouvé"**

- Vérifier qu'un utilisateur avec `role: 'superadmin'` existe
- Vérifier que cet utilisateur a une adresse email valide

---

## 📧 FORMAT DE L'EMAIL

### **Sujet**
```
📊 Rapport Analytique Direction - 02/04/2026
```

### **Design**
- ✅ Template HTML responsive (mobile + desktop)
- ✅ Bannière d'alerte colorée selon le niveau
- ✅ Tableaux formatés avec tri
- ✅ Bouton d'action vers le dashboard complet
- ✅ Version texte pour compatibilité

---

## 🎯 PROCHAINES ÉTAPES

### **1. Déployer sur Vercel**
```bash
git add .
git commit -m "Configuration rapports analytiques automatiques"
git push
```

### **2. Configurer les Variables d'Environnement**
- Allez sur Vercel → Settings → Environment Variables
- Ajoutez `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM`

### **3. Vérifier le Premier Envoi**
- Attendez le lendemain matin à 8h00
- OU testez manuellement avec le script

### **4. Informer M. Foutsap Aristide**
- Lui expliquer le contenu du rapport
- Lui demander de vérifier les spams la première fois
- Lui donner le lien du dashboard : `https://votre-domaine.com/analytics`

---

## 📞 SUPPORT

### **En cas de problème**

1. Consulter les logs console
2. Vérifier les variables d'environnement
3. Tester l'envoi manuel
4. Consulter `CONFIGURATION-RAPPORTS-ANALYTIQUES.md` pour plus de détails

### **Ressources**

- [Nodemailer Documentation](https://nodemailer.com/about/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)

---

## ✅ CHECKLIST FINALE

- [x] Fichier `.env.local` créé avec credentials
- [x] Cron job configuré dans `vercel.json`
- [x] Email du Super Admin vérifié dans la base de données
- [x] Test manuel réussi
- [ ] Déploiement sur Vercel
- [ ] Variables d'environnement configurées sur Vercel
- [ ] Premier envoi automatique vérifié
- [ ] M. Foutsap Aristide informé

---

**Date de configuration** : 02 Avril 2026  
**Status** : ✅ **SYSTÈME CONFIGURÉ ET PRÊT**  
**Prochaine action** : Déployer sur Vercel et configurer les variables d'environnement

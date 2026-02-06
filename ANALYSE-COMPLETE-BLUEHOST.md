# ANALYSE COMPLÈTE - HÉBERGEMENT SUR BLUEHOST

## 🔍 ANALYSE DE VOTRE APPLICATION

### Architecture Technique Détectée

```
Application Full-Stack Next.js 15.5.2
├── Frontend : React 18.3.1 + TypeScript
├── Backend : Next.js API Routes (20 endpoints)
├── Base de données : PostgreSQL (Prisma ORM)
├── Authentification : JWT + bcryptjs
├── Emails : Nodemailer
├── État global : Zustand
├── UI : Radix UI + Tailwind CSS
└── PDF : jsPDF + html2canvas
```

---

## 📊 ANALYSE DE LA BASE DE DONNÉES

### Schéma PostgreSQL Détaillé

**9 Tables Principales** :
```sql
1. users (8 rôles différents)
   - ID, nom, prenom, email, password (bcrypt)
   - Role: superadmin, employe, conducteur_travaux, etc.

2. projets
   - Gestion des projets avec dates début/fin

3. user_projets (Table de liaison)
   - Association utilisateurs ↔ projets

4. articles
   - Catalogue matériel/outillage
   - Stock et prix unitaire

5. demandes (Table centrale)
   - 13 statuts de workflow
   - Type: matériel ou outillage
   - Dates multiples (création, sortie, validation, livraison)

6. item_demandes
   - Détail des articles par demande
   - Quantités (demandée, validée, sortie, reçue)

7. validation_signatures
   - Signatures électroniques des valideurs
   - Type: conducteur, logistique, charge_affaire, finale

8. sortie_signatures
   - Signatures des sorties Appro
   - JSON pour quantités sorties

9. history_entries
   - Historique complet des actions
   - Traçabilité des changements de statut

10. notifications
    - Système de notifications utilisateur
```

**Caractéristiques Importantes** :
- ✅ Relations complexes (CASCADE deletes)
- ✅ Indexes (unique constraints)
- ✅ Types ENUM (roles, statuts)
- ✅ Champs JSON (quantités sorties)
- ✅ Timestamps automatiques

**Taille estimée Base de données** :
- Production : 50-500 MB (selon usage)
- 1000 demandes ≈ 20-30 MB

---

## 🔌 ANALYSE DES API ROUTES

### 20 Endpoints Backend Détectés

**Authentification** :
```
POST   /api/auth/login       → JWT token
GET    /api/auth/me          → User session
```

**Utilisateurs** :
```
GET    /api/users            → Liste utilisateurs
POST   /api/users            → Créer utilisateur
GET    /api/users/[id]       → Détail utilisateur
PUT    /api/users/[id]       → Modifier utilisateur
DELETE /api/users/[id]       → Supprimer utilisateur
PUT    /api/users/[id]/role  → Changer rôle
PUT    /api/users/[id]/admin → Toggle admin
```

**Projets** :
```
GET    /api/projets          → Liste projets
POST   /api/projets          → Créer projet
GET    /api/projets/[id]     → Détail projet
PUT    /api/projets/[id]     → Modifier projet
DELETE /api/projets/[id]     → Supprimer projet
DELETE /api/projets/[id]/remove-user → Retirer utilisateur
```

**Demandes** (Fonctionnalité principale) :
```
GET    /api/demandes         → Liste demandes
POST   /api/demandes         → Créer demande
GET    /api/demandes/[id]    → Détail demande
PUT    /api/demandes/[id]    → Modifier demande
DELETE /api/demandes/[id]    → Supprimer demande
POST   /api/demandes/[id]/actions → Actions (valider, rejeter, etc.)
DELETE /api/demandes/[id]/remove-item → Retirer article
GET    /api/demandes/validated-history → Historique validations
```

**Articles** :
```
GET    /api/articles         → Catalogue articles
POST   /api/articles         → Créer article
```

**Notifications** :
```
GET    /api/notifications    → Liste notifications
PUT    /api/notifications/[id]/read → Marquer lu
```

**Autres** :
```
GET    /api/historique       → Historique complet
GET    /api/test-db          → Test connexion DB
POST   /api/seed-db          → Initialiser données
```

---

## 📦 DÉPENDANCES CRITIQUES

### Runtime Requirements

**Node.js** : Version 18+ requise
```json
"next": "^15.5.2"  → Nécessite Node 18.17+
"react": "^18.3.1"
"prisma": "^6.15.0"
```

**PostgreSQL** : Version 12+ requise
```prisma
datasource db {
  provider = "postgresql"
  url = env("POSTGRES_PRISMA_URL")
  directUrl = env("POSTGRES_URL")
}
```

### Packages Critiques (68 dépendances)

**Backend Essentiels** :
```json
"@prisma/client": "^6.15.0"    → ORM PostgreSQL
"bcryptjs": "^3.0.2"            → Hash passwords
"jsonwebtoken": "^9.0.2"        → JWT auth
"nodemailer": "^7.0.6"          → Emails
"crypto": "latest"              → Encryption
```

**Frontend/UI** :
```json
"@radix-ui/*": "~2.x"           → 25 composants UI
"lucide-react": "^0.454.0"      → Icons
"recharts": "^2.15.4"           → Graphiques
"react-hook-form": "^7.60.0"    → Formulaires
"zod": "3.25.67"                → Validation
"zustand": "latest"             → State management
```

**Build Tools** :
```json
"tailwindcss": "^4.1.9"
"typescript": "^5"
"autoprefixer": "^10.4.20"
```

---

## 🌐 BESOINS RÉSEAU ET SÉCURITÉ

### Ports Requis
```
3000  → Next.js (production)
5432  → PostgreSQL
443   → HTTPS (SSL)
80    → HTTP (redirect vers HTTPS)
```

### Variables d'Environnement (11 requises)
```env
# Base de données (2 URLs)
POSTGRES_PRISMA_URL=postgresql://user:pass@host:5432/db
POSTGRES_URL=postgresql://user:pass@host:5432/db

# Authentification
JWT_SECRET=your-secret-key-min-32-chars
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://votre-domaine.com

# Email (Nodemailer)
EMAIL_USER=votre-email@gmail.com
EMAIL_PASSWORD=votre-app-password
SMTP_HOST=smtp.gmail.com (optionnel)
SMTP_PORT=587 (optionnel)

# Application
NEXT_PUBLIC_APP_URL=https://votre-domaine.com
NODE_ENV=production
```

### CORS Configuration
```javascript
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## 💾 CE QU'IL VOUS FAUT SUR BLUEHOST VPS

### 1. PLAN BLUEHOST REQUIS

**❌ Hébergement Partagé** : IMPOSSIBLE
- Pas de Node.js
- MySQL seulement (pas PostgreSQL)

**✅ VPS MINIMUM REQUIS** :

**Plan VPS Enhanced** ($29.99/mois minimum)
```
CPU     : 2 cores (minimum)
RAM     : 4 GB (minimum, 8 GB recommandé)
Disque  : 120 GB SSD
Bande   : 2 TB/mois
OS      : Ubuntu 20.04/22.04 LTS
```

**Pourquoi Enhanced et pas Standard ?**
- Standard (2GB RAM) : Insuffisant pour Next.js + PostgreSQL
- Enhanced (4GB RAM) : Minimum viable
- Ultimate (8GB RAM) : Recommandé pour production

---

### 2. LOGICIELS À INSTALLER (Configuration Manuelle)

#### A. Node.js 18+
```bash
# Via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Vérifier
node --version  # ≥ v18.17.0
npm --version   # ≥ 9.x
```

#### B. PostgreSQL 14+
```bash
# Installation
sudo apt-get install postgresql-14 postgresql-contrib-14

# Configuration
sudo -u postgres createuser --interactive
sudo -u postgres createdb gestion_demandes

# Sécurité
sudo nano /etc/postgresql/14/main/pg_hba.conf
# Configurer authentification MD5

sudo nano /etc/postgresql/14/main/postgresql.conf
# listen_addresses = 'localhost'
# max_connections = 100
```

#### C. Nginx (Reverse Proxy)
```bash
# Installation
sudo apt-get install nginx

# Configuration
sudo nano /etc/nginx/sites-available/gestion-demandes

server {
    listen 80;
    server_name votre-domaine.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name votre-domaine.com;

    ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# Activer
sudo ln -s /etc/nginx/sites-available/gestion-demandes /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### D. PM2 (Process Manager)
```bash
# Installation globale
sudo npm install -g pm2

# Configuration pour votre app
pm2 start npm --name "gestion-demandes" -- start
pm2 save
pm2 startup systemd
```

#### E. Certbot (SSL gratuit)
```bash
# Installation
sudo apt-get install certbot python3-certbot-nginx

# Obtenir certificat SSL
sudo certbot --nginx -d votre-domaine.com

# Renouvellement automatique
sudo certbot renew --dry-run
```

#### F. Git
```bash
sudo apt-get install git
git --version
```

---

### 3. DÉPLOIEMENT DE VOTRE APPLICATION

#### Étape 1 : Cloner le projet
```bash
cd /var/www
sudo git clone https://github.com/votre-repo/gestion-demandes.git
cd gestion-demandes
```

#### Étape 2 : Variables d'environnement
```bash
sudo nano .env

# Copier vos variables
POSTGRES_PRISMA_URL=postgresql://user:password@localhost:5432/gestion_demandes
POSTGRES_URL=postgresql://user:password@localhost:5432/gestion_demandes
JWT_SECRET=votre-secret-32-chars-minimum
NEXTAUTH_SECRET=votre-nextauth-secret
NEXTAUTH_URL=https://votre-domaine.com
EMAIL_USER=votre-email@gmail.com
EMAIL_PASSWORD=votre-app-password
NEXT_PUBLIC_APP_URL=https://votre-domaine.com
NODE_ENV=production
```

#### Étape 3 : Installation dépendances
```bash
npm install
# Temps estimé : 5-10 minutes
```

#### Étape 4 : Setup base de données
```bash
# Générer Prisma Client
npx prisma generate

# Exécuter migrations
npx prisma migrate deploy

# Seeder les données initiales
npm run db:seed
```

#### Étape 5 : Build production
```bash
npm run build
# Temps estimé : 3-5 minutes
```

#### Étape 6 : Lancer avec PM2
```bash
pm2 start npm --name "gestion-demandes" -- start
pm2 save
pm2 list
```

#### Étape 7 : Configurer Firewall
```bash
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

---

### 4. CONFIGURATION BASE DE DONNÉES DÉTAILLÉE

#### A. Créer utilisateur PostgreSQL
```bash
sudo -u postgres psql

CREATE USER gestion_user WITH PASSWORD 'votre-password-securise';
CREATE DATABASE gestion_demandes OWNER gestion_user;
GRANT ALL PRIVILEGES ON DATABASE gestion_demandes TO gestion_user;
\q
```

#### B. Sécuriser PostgreSQL
```bash
# Éditer pg_hba.conf
sudo nano /etc/postgresql/14/main/pg_hba.conf

# Changer peer en md5
local   all             postgres                                peer
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5

# Redémarrer
sudo systemctl restart postgresql
```

#### C. Backups automatiques
```bash
# Script de backup
sudo nano /usr/local/bin/backup-postgres.sh

#!/bin/bash
BACKUP_DIR="/var/backups/postgresql"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
mkdir -p $BACKUP_DIR

pg_dump -U gestion_user gestion_demandes | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Garder seulement 7 derniers jours
find $BACKUP_DIR -type f -mtime +7 -delete

# Rendre exécutable
sudo chmod +x /usr/local/bin/backup-postgres.sh

# Cron quotidien (3h du matin)
sudo crontab -e
0 3 * * * /usr/local/bin/backup-postgres.sh
```

---

### 5. MONITORING ET LOGS

#### A. PM2 Monitoring
```bash
# Voir logs en temps réel
pm2 logs gestion-demandes

# Monitoring
pm2 monit

# Liste processus
pm2 list

# Redémarrer
pm2 restart gestion-demandes

# Voir erreurs
pm2 logs gestion-demandes --err
```

#### B. Nginx Logs
```bash
# Logs d'accès
sudo tail -f /var/log/nginx/access.log

# Logs d'erreurs
sudo tail -f /var/log/nginx/error.log
```

#### C. PostgreSQL Logs
```bash
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

#### D. Rotation des logs
```bash
# PM2 log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

### 6. MAINTENANCE CONTINUE REQUISE

#### Tâches Hebdomadaires (2-3h)
```bash
# Mises à jour système
sudo apt-get update
sudo apt-get upgrade

# Vérifier espace disque
df -h

# Vérifier logs
pm2 logs --lines 100

# Vérifier PostgreSQL
sudo systemctl status postgresql

# Vérifier Nginx
sudo systemctl status nginx
```

#### Tâches Mensuelles (1-2h)
```bash
# Vérifier certificat SSL
sudo certbot renew

# Nettoyer logs anciens
sudo find /var/log -type f -mtime +30 -delete

# Optimiser PostgreSQL
sudo -u postgres psql gestion_demandes
VACUUM ANALYZE;
REINDEX DATABASE gestion_demandes;

# Vérifier backups
ls -lh /var/backups/postgresql
```

#### Mises à jour application
```bash
cd /var/www/gestion-demandes
git pull origin main
npm install
npm run build
pm2 restart gestion-demandes
```

---

## 💰 COÛTS RÉELS BLUEHOST VPS

### Coûts Directs

**VPS Enhanced** : $29.99/mois × 12 = $359.88/an
```
CPU  : 2 cores
RAM  : 4 GB
SSD  : 120 GB
```

**Domaine** : $12-15/an
```
.com via Bluehost ou autre
```

**Total Direct** : ~$372/an ($31/mois)

### Coûts Cachés (Votre Temps)

**Configuration Initiale** :
```
Installation serveur     : 2-3 heures
Configuration PostgreSQL : 1-2 heures
Setup Nginx + SSL       : 1-2 heures
Déploiement app         : 1-2 heures
Tests et debug          : 2-4 heures
TOTAL                   : 7-13 heures
```

**Maintenance Continue** :
```
Hebdomadaire  : 2 heures
Mensuelle     : 1-2 heures
Annuelle      : ~100 heures
```

**Valeur du temps (exemple $50/h)** :
```
Setup initial : 7h × $50 = $350
Maintenance/an : 100h × $50 = $5,000
TOTAL an 1    : $5,350 + $372 = $5,722
```

---

## ⚖️ COMPARAISON : BLUEHOST vs VERCEL

### Vercel + Supabase (Actuel)

**Coûts** :
```
Vercel Pro      : $20/mois = $240/an
Supabase Pro    : $25/mois = $300/an
TOTAL           : $45/mois = $540/an
```

**Temps requis** :
```
Configuration   : 30 minutes (déjà fait ✅)
Maintenance     : 0 heures
Déploiement     : Git push automatique
Backups         : Automatiques
SSL             : Automatique
Monitoring      : Inclus
Scaling         : Automatique
```

**Fonctionnalités incluses** :
- ✅ CDN global (300+ edge locations)
- ✅ Preview deployments
- ✅ Rollback instantané
- ✅ Analytics
- ✅ Team collaboration
- ✅ CI/CD intégré

### Bluehost VPS Enhanced

**Coûts** :
```
VPS Enhanced    : $30/mois = $360/an
Votre temps     : $5,000/an (100h maintenance)
TOTAL RÉEL      : $5,360/an
```

**Temps requis** :
```
Configuration   : 7-13 heures
Maintenance     : 2h/semaine = 100h/an
Déploiement     : Manuel (SSH/FTP)
Backups         : À configurer
SSL             : À renouveler
Monitoring      : À installer
Scaling         : Manuel
```

**Ce qui n'est PAS inclus** :
- ❌ CDN (serveur unique)
- ❌ Preview deployments
- ❌ Rollback facile
- ❌ Analytics
- ❌ Collaboration
- ❌ CI/CD

### Verdict Comparatif

| Critère | Vercel + Supabase | Bluehost VPS |
|---------|-------------------|--------------|
| **Coût/mois** | $45 | $30 + temps |
| **Coût réel/an** | $540 | $5,360 |
| **Setup** | ✅ Fait | ❌ 10h |
| **Maintenance** | ✅ Zéro | ❌ 2h/semaine |
| **Performance** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Sécurité** | ✅ Auto | ⚠️ Manuelle |
| **Scaling** | ✅ Auto | ❌ Manuel |
| **Support** | ✅ 24/7 | ⚠️ Technique |
| **Expertise** | Aucune | DevOps avancée |

---

## 🎯 RECOMMANDATION FINALE

### ❌ NE MIGREZ PAS VERS BLUEHOST

**Raisons principales** :

1. **COÛT 10X PLUS ÉLEVÉ** ($5,360 vs $540/an)
2. **COMPLEXITÉ TECHNIQUE ÉLEVÉE** (10h setup + 100h/an maintenance)
3. **PERFORMANCE INFÉRIEURE** (pas de CDN global)
4. **RISQUES SÉCURITÉ** (vous êtes responsable)
5. **PAS D'AVANTAGES** sur Vercel

### ✅ OPTIONS RECOMMANDÉES

#### Option 1 : GARDEZ VERCEL + SUPABASE ⭐⭐⭐⭐⭐
```
Coût : $45/mois
Temps : 0h maintenance
Status : Déjà fonctionnel ✅
Verdict : OPTIMAL
```

#### Option 2 : RAILWAY (si budget serré)
```
Coût : $15-20/mois (tout inclus)
Temps : 1h migration
PostgreSQL : Inclus
Verdict : Bon compromis
```

#### Option 3 : RENDER
```
Coût : $14/mois (app + DB)
Temps : 1h migration
PostgreSQL : Inclus
Verdict : Alternative solide
```

---

## 📋 SI VOUS INSISTEZ POUR BLUEHOST

### Checklist Complète

**Avant de commander** :
- [ ] Expertise Linux/Ubuntu confirmée
- [ ] Connaissances PostgreSQL avancées
- [ ] Expérience Nginx/reverse proxy
- [ ] Temps disponible (10h+ setup, 2h/semaine maintenance)
- [ ] Budget augmenté (2h/semaine × $50/h = $5,200/an)

**Commander** :
- [ ] Bluehost VPS Enhanced minimum ($29.99/mois)
- [ ] OS : Ubuntu 22.04 LTS
- [ ] Domaine enregistré et pointé vers VPS

**Installation (7-13h)** :
- [ ] Connexion SSH root
- [ ] Mise à jour système
- [ ] Installation Node.js 18+
- [ ] Installation PostgreSQL 14+
- [ ] Installation Nginx
- [ ] Configuration SSL (Certbot)
- [ ] Installation PM2
- [ ] Configuration firewall
- [ ] Clone repository
- [ ] Installation dépendances (npm install)
- [ ] Configuration .env
- [ ] Migrations Prisma
- [ ] Seed database
- [ ] Build production
- [ ] Lancement PM2
- [ ] Tests complets

**Post-installation** :
- [ ] Configuration backups PostgreSQL
- [ ] Configuration monitoring
- [ ] Configuration alertes
- [ ] Documentation procédures
- [ ] Tests de charge
- [ ] Tests de sécurité

**Maintenance Continue** :
- [ ] Mises à jour système hebdomadaires
- [ ] Surveillance logs quotidienne
- [ ] Vérification backups hebdomadaire
- [ ] Renouvellement SSL automatique
- [ ] Optimisation PostgreSQL mensuelle
- [ ] Mises à jour application selon besoin

---

## 📞 RESSOURCES ET SUPPORT

### Si vous choisissez Bluehost VPS

**Documentation** :
- Bluehost VPS Docs : https://my.bluehost.com/hosting/help/vps
- Ubuntu Server Guide : https://ubuntu.com/server/docs
- Nginx Docs : https://nginx.org/en/docs/
- PostgreSQL Docs : https://www.postgresql.org/docs/14/
- PM2 Docs : https://pm2.keymetrics.io/docs/

**Support Technique** :
- Bluehost Support : Chat 24/7 (mais pas expert Next.js)
- Stack Overflow : https://stackoverflow.com/questions/tagged/next.js
- Next.js Discord : https://nextjs.org/discord

### Si vous restez sur Vercel (recommandé)

**Optimisations** :
- Configurer domaine personnalisé
- Activer Vercel Analytics
- Configurer edge caching
- Optimiser images avec next/image
- Activer ISR si pertinent

---

## 🚀 PLAN D'ACTION RECOMMANDÉ

### ÉTAPE 1 : Évaluer les besoins réels

**Questions à vous poser** :
- Pourquoi vouloir migrer vers Bluehost ?
- Quel est le vrai problème avec Vercel ?
- Budget est-il le problème ? ($45/mois vs $30/mois + temps)
- Avez-vous l'expertise technique DevOps ?
- Avez-vous 2h/semaine pour la maintenance ?

### ÉTAPE 2 : Comparer les coûts réels

**Vercel + Supabase** :
```
💰 $45/mois = $540/an
⏰ 0h maintenance
✅ Déjà fonctionnel
```

**Bluehost VPS** :
```
💰 $30/mois = $360/an
💰 + Votre temps : $5,000/an
⏰ 100h maintenance/an
❌ À configurer entièrement
```

### ÉTAPE 3 : Décision

**SI COÛT EST LE PROBLÈME** :
→ Migrez vers **Railway** ($15/mois tout inclus)
→ Ou **Render** ($14/mois tout inclus)
→ Ne choisissez PAS Bluehost VPS

**SI VOUS AVEZ DÉJÀ UN VPS BLUEHOST** :
→ Utilisez mon guide de configuration
→ Prévoyez 10h de setup
→ Prévoyez 2h/semaine de maintenance

**SI VERCEL FONCTIONNE BIEN** :
→ **GARDEZ VERCEL** ✅
→ C'est la meilleure solution technique
→ Optimisez plutôt votre usage actuel

---

## ✅ CONCLUSION

### Pour votre application Next.js + PostgreSQL

**CE QU'IL VOUS FAUT SUR BLUEHOST** :

1. **VPS Enhanced** ($30/mois minimum)
   - 4 GB RAM minimum
   - 120 GB SSD
   - Ubuntu 22.04 LTS

2. **Logiciels à installer manuellement** :
   - Node.js 18+
   - PostgreSQL 14+
   - Nginx
   - PM2
   - Certbot (SSL)
   - Git

3. **Configuration requise** :
   - 10 heures de setup initial
   - 2 heures/semaine de maintenance
   - Expertise DevOps avancée

4. **Coût total réel** :
   - $360/an (VPS)
   - +$5,000/an (votre temps)
   - = $5,360/an

**VS VERCEL + SUPABASE** :
   - $540/an
   - 0h maintenance
   - Déjà fonctionnel ✅

### Ma recommandation ferme

**🏆 GARDEZ VERCEL + SUPABASE**

C'est :
- ✅ 10x moins cher (coût total)
- ✅ Déjà configuré et fonctionnel
- ✅ Plus performant (CDN global)
- ✅ Plus sécurisé (mises à jour auto)
- ✅ Sans maintenance
- ✅ Meilleur support
- ✅ Meilleure expérience développeur

**Ne migrez vers Bluehost que si** :
- Vous avez déjà payé un VPS
- Vous avez l'expertise DevOps
- Vous avez le temps (100h/an)
- Vous comprenez les risques

---

**Date** : Octobre 2025
**Verdict** : Bluehost VPS est techniquement possible mais **fortement déconseillé** pour votre projet
**Recommandation** : Restez sur Vercel + Supabase ✅

# Gestion des Demandes de Matériel

Application de gestion des demandes de matériel et outillage pour InstrumElec - projets de construction.

## Technologies utilisées

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Base de données**: PostgreSQL (Supabase)
- **Authentification**: JWT avec bcryptjs
- **Validation**: Zod
- **UI**: Radix UI, Lucide React, Recharts

## Installation et Configuration

### 1. Cloner le projet et installer les dépendances

```bash
npm install
```

### 2. Configuration de la base de données

1. Créer une base de données PostgreSQL (ou utiliser Supabase)
2. Copier le fichier `.env.example` vers `.env`
3. Configurer les variables d'environnement :

```env
POSTGRES_PRISMA_URL="postgresql://..."  # URL de connexion Prisma
POSTGRES_URL="postgresql://..."         # URL directe
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
```

### 3. Initialiser la base de données

```bash
# Générer le client Prisma
npm run db:generate

# Pousser le schéma vers la DB
npm run db:push

# Peupler la base avec des données de test
npm run db:seed
```

### 4. Démarrer l'application

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:3000`

---

## 📱 Connexion - Numéro de Téléphone

**L'authentification se fait par numéro de téléphone** (format camerounais : 9 chiffres commençant par 6).

### Comptes de test

| Rôle | Téléphone | Mot de passe |
|------|-----------|---------------|
| 🔑 **Super Admin** | `600000001` | `admin123` |
| 👤 **Employé** | `600000002` | `employe123` |
| 👷 **Conducteur Travaux** | `600000003` | `conducteur123` |
| 👨‍💼 **Responsable Travaux** | `600000004` | `responsable123` |
| 🛡️ **QHSE** | `600000005` | `qhse123` |
| 📦 **Appro** | `600000006` | `appro123` |
| 💼 **Chargé Affaire** | `600000007` | `charge123` |
| 🚚 **Logistique** | `600000008` | `logistique123` |

### Format du numéro de téléphone

- **9 chiffres exactement**
- **Doit commencer par 6**
- **Exemple** : `699308772`

---

## Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Démarrer en mode développement |
| `npm run build` | Construire l'application |
| `npm run start` | Démarrer en production |
| `npm run db:generate` | Générer le client Prisma |
| `npm run db:push` | Pousser le schéma vers la DB |
| `npm run db:seed` | Peupler la base de données |
| `npm run db:studio` | Ouvrir Prisma Studio |

---

## Architecture

### Rôles et Permissions (8 rôles)

| Rôle | Permissions |
|------|-------------|
| **superadmin** | Accès complet, gestion utilisateurs et projets |
| **employe** | Création de demandes, validation finale |
| **conducteur_travaux** | Validation des demandes de matériel |
| **responsable_travaux** | Validation hiérarchique des demandes |
| **responsable_qhse** | Validation des demandes d'outillage |
| **responsable_appro** | Préparation des sorties de stock |
| **charge_affaire** | Validation budgétaire |
| **responsable_logistique** | Validation de livraison |

### Workflow des Demandes

#### Flow Matériel
```
Création → Conducteur → Resp. Travaux → Chargé Affaire → Appro → Logistique → Demandeur → Clôturée
```

#### Flow Outillage
```
Création → QHSE → Resp. Travaux → Chargé Affaire → Appro → Logistique → Demandeur → Clôturée
```

### Statuts des Demandes

| Statut | Description |
|--------|-------------|
| `brouillon` | En cours de création |
| `soumise` | Soumise pour validation |
| `en_attente_validation_conducteur` | Attente validation conducteur |
| `en_attente_validation_qhse` | Attente validation QHSE |
| `en_attente_validation_responsable_travaux` | Attente validation resp. travaux |
| `en_attente_validation_charge_affaire` | Attente validation chargé affaire |
| `en_attente_preparation_appro` | Attente préparation appro |
| `en_attente_validation_logistique` | Attente validation logistique |
| `en_attente_validation_finale_demandeur` | Attente confirmation demandeur |
| `cloturee` | Terminée |
| `rejetee` | Rejetée |

---

## API Endpoints

### Authentification
- `POST /api/auth/login` - Connexion (téléphone + mot de passe)
- `GET /api/auth/me` - Profil utilisateur courant

### Utilisateurs
- `GET /api/users` - Liste des utilisateurs (Admin)
- `POST /api/users` - Créer un utilisateur (Admin)
- `PUT /api/users/[id]` - Modifier un utilisateur
- `PUT /api/users/[id]/role` - Changer le rôle

### Projets
- `GET /api/projets` - Liste des projets
- `POST /api/projets` - Créer un projet (Admin)
- `PUT /api/projets/[id]` - Modifier un projet
- `POST /api/projets/[id]/add-user` - Ajouter un utilisateur
- `DELETE /api/projets/[id]/remove-user` - Retirer un utilisateur

### Demandes
- `GET /api/demandes` - Liste des demandes
- `POST /api/demandes` - Créer une demande
- `GET /api/demandes/[id]` - Détail d'une demande
- `PUT /api/demandes/[id]` - Modifier une demande
- `POST /api/demandes/[id]/actions` - Exécuter une action (valider, rejeter, clôturer)

### Articles
- `GET /api/articles` - Liste des articles
- `POST /api/articles` - Créer un article

### Notifications
- `GET /api/notifications` - Liste des notifications
- `PUT /api/notifications/[id]/read` - Marquer comme lue

---

## Sécurité

- ✅ Authentification JWT avec tokens sécurisés
- ✅ Mots de passe hashés avec bcryptjs (12 rounds)
- ✅ Validation des données avec Zod
- ✅ Permissions basées sur les rôles
- ✅ Protection CSRF intégrée à Next.js
- ✅ Email optionnel, téléphone obligatoire et unique
- ✅ Traçabilité complète des actions

---

## Fonctionnalités Principales

- 📱 **Connexion par téléphone** (format camerounais)
- 📄 **Gestion des demandes** de matériel et outillage
- ✅ **Workflow de validation** multi-niveaux
- 👥 **Gestion des utilisateurs** et rôles
- 🏗️ **Gestion des projets** et assignations
- 📦 **Catalogue d'articles** avec stock
- 📊 **Tableaux de bord** par rôle
- 🔔 **Notifications** en temps réel
- 📱 **Interface responsive** (mobile/desktop)
- 📈 **Graphiques** et statistiques

---

**Version** : 2.0 - Migration Téléphone  
**Dernière mise à jour** : Novembre 2024

# 🏗️ Gestion des Demandes de Matériel - INSTRUMELEC

> Application web complète de gestion des demandes de matériel et outillage pour les projets de construction électrique. Système de workflow multi-niveaux avec validation hiérarchique, auto-validation intelligente, gestion des stocks, et suivi en temps réel.

[![Next.js](https://img.shields.io/badge/Next.js-15.5.7-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19.1-2D3748)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-green)](https://supabase.com/)

---

## 📋 Table des Matières

- [Vue d'ensemble](#-vue-densemble)
- [Technologies](#-technologies-utilisées)
- [Installation](#-installation-et-configuration)
- [Workflow de l'Application](#-workflow-de-lapplication)
- [Rôles et Permissions](#-rôles-et-permissions)
- [Fonctionnalités](#-fonctionnalités-principales)
- [API Endpoints](#-api-endpoints)
- [Sécurité](#-sécurité)
- [Scripts Disponibles](#-scripts-disponibles)

---

## 🎯 Vue d'ensemble

### Qu'est-ce que cette application ?

INSTRUMELEC est une application de gestion des demandes de matériel et outillage conçue spécifiquement pour les projets de construction électrique. Elle permet de :

- ✅ **Créer et suivre** des demandes de matériel et outillage
- ✅ **Valider hiérarchiquement** via un workflow multi-niveaux (10 étapes)
- ✅ **Workflows différenciés** : Matériel (Conducteur) vs Outillage (Logistique)
- ✅ **Gérer les stocks** et préparer les sorties (Appro pour matériel, Logistique pour outillage)
- ✅ **Notifier en temps réel** tous les acteurs du workflow
- ✅ **Filtrer par projet** pour une visibilité ciblée
- ✅ **Clôturer** les demandes après confirmation de livraison
- ✅ **Tableau de bord financier** pour le suivi budgétaire (Super Admin)
- ✅ **Gestion des utilisateurs** avec attribution de rôles et projets

### Pourquoi cette application ?

**Problème résolu** : Avant cette application, la gestion des demandes se faisait manuellement (papier, emails), causant :
- ❌ Perte de traçabilité
- ❌ Délais de validation longs
- ❌ Erreurs de stock
- ❌ Manque de visibilité sur l'état des demandes

**Solution apportée** :
- ✅ Workflow automatisé et traçable
- ✅ Notifications instantanées
- ✅ Validation en quelques clics
- ✅ Tableaux de bord personnalisés par rôle
- ✅ Historique complet de toutes les actions

---

## 🚀 Technologies utilisées

### Stack Technique

**Frontend**
- **Next.js 15.5.7** - Framework React avec SSR et API Routes
- **React 19** - Bibliothèque UI avec hooks modernes
- **TypeScript 5** - Typage statique pour plus de robustesse
- **Tailwind CSS 4** - Styling utility-first avec palette personnalisée
- **Radix UI** - Composants accessibles et non-stylés
- **shadcn/ui** - Collection de composants réutilisables
- **Lucide React** - Icônes modernes et cohérentes

**Backend**
- **Next.js API Routes** - API REST intégrée
- **Prisma ORM 6.19.1** - ORM type-safe pour PostgreSQL
- **Zod 3.25.67** - Validation de schémas TypeScript-first

**Base de données**
- **PostgreSQL** - Base de données relationnelle
- **Supabase** - Hébergement PostgreSQL avec outils intégrés

**Authentification & Sécurité**
- **JWT (jsonwebtoken)** - Tokens d'authentification sécurisés
- **bcryptjs** - Hashage de mots de passe (12 rounds)

**State Management & UI**
- **Zustand** - State management léger et performant
- **Recharts** - Graphiques interactifs pour analytics
- **React Hook Form** - Gestion de formulaires performante
- **date-fns** - Manipulation de dates

**Outils de développement**
- **ESLint** - Linting du code
- **Prettier** - Formatage automatique
- **Prisma Studio** - Interface visuelle pour la base de données

## 📦 Installation et Configuration

### Prérequis

- **Node.js** 18+ et npm
- **PostgreSQL** 14+ (ou compte Supabase)
- **Git** pour cloner le projet

### 1. Cloner le projet

```bash
git clone <repository-url>
cd gestion-demandes-materiel
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configuration de la base de données

#### Option A : Utiliser Supabase (Recommandé)

1. Créer un compte sur [Supabase](https://supabase.com/)
2. Créer un nouveau projet
3. Récupérer les URLs de connexion dans Settings > Database

#### Option B : PostgreSQL local

1. Installer PostgreSQL localement
2. Créer une base de données : `createdb instrumelec`

### 4. Configurer les variables d'environnement

1. Copier le fichier d'exemple :
```bash
cp .env.example .env
```

2. Éditer `.env` avec vos valeurs :

```env
# Base de données (Supabase ou local)
POSTGRES_PRISMA_URL="postgresql://user:password@host:5432/database?pgbouncer=true"
POSTGRES_URL="postgresql://user:password@host:5432/database"

# JWT Secret (générer une clé forte)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"

# Optionnel : Configuration email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

### 5. Initialiser la base de données

```bash
# Générer le client Prisma
npm run db:generate

# Créer les tables dans la base de données
npm run db:push

# Peupler avec des données de test (8 utilisateurs + projets)
npm run db:seed
```

### 6. Démarrer l'application

#### Mode développement
```bash
npm run dev
```

#### Mode production
```bash
npm run build
npm run start
```

L'application sera accessible sur **http://localhost:3000**

### 7. Accéder à Prisma Studio (optionnel)

Pour visualiser et éditer les données :

```bash
npm run db:studio
```

Ouvre une interface web sur **http://localhost:5555**

---

## 📱 Connexion - Numéro de Téléphone

**L'authentification se fait par numéro de téléphone** (format camerounais : 9 chiffres commençant par 6).

### Comptes de test

**📄 Documentation complète** : Voir [UTILISATEURS_TEST.md](./UTILISATEURS_TEST.md) pour tous les détails

| Rôle | Téléphone | Mot de passe |
|------|-----------|---------------|
| 🔑 **Super Admin** | `600000001` | `admin123` |
| 👤 **Employé** | `600000002` | `employe123` |
| 👷 **Conducteur Travaux** | `600000003` | `conducteur123` |
| 👨‍💼 **Responsable Travaux** | `600000004` | `responsable123` |
| 🛡️ **Logistique** | `600000005` | `logistique123` |
| 📦 **Appro** | `600000006` | `appro123` |
| 💼 **Chargé Affaire** | `600000007` | `charge123` |
| 🚚 **Livreur** | `600000009` | `livreur123` |

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

### Rôles et Permissions (9 rôles)

| Rôle | Permissions |
|------|-------------|
| **superadmin** | Accès complet, gestion utilisateurs/projets, tableau de bord financier |
| **employe** | Création de demandes, clôture de ses propres demandes |
| **conducteur_travaux** | Validation des demandes de **matériel uniquement** (1ère validation) |
| **responsable_logistique** | Validation des demandes d'**outillage uniquement** (1ère validation) + Préparation des sorties d'outillage |
| **responsable_travaux** | Validation matériel ET outillage (2ème validation) |
| **charge_affaire** | Validation budgétaire matériel ET outillage (3ème validation) |
| **responsable_appro** | Préparation des sorties de **matériel uniquement** |
| **responsable_livreur** | Réception et livraison des demandes |

## 🔄 Workflow de l'Application

### Vue d'ensemble

L'application gère **2 types de demandes** avec des workflows différents :
- 🔧 **MATÉRIEL** : Équipements électriques, câbles, etc.
- 🛠️ **OUTILLAGE** : Outils, équipements de sécurité, etc.

Chaque type suit un **workflow de validation en 10 étapes** avec des valideurs spécifiques selon le type de demande.

---

### 🔧 Workflow MATÉRIEL (10 étapes)

```
┌─────────────────────────────────────────────────────────────────┐
│  ÉTAPE 1 : CRÉATION (Employé)                                   │
│  ────────────────────────────────────────────────────────────   │
│  Action : Créer demande + Soumettre                             │
│  Statut : brouillon → soumise                                   │
│  Notification → Conducteur de Travaux                           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  ÉTAPE 2 : VALIDATION CONDUCTEUR (Conducteur de Travaux)        │
│  ────────────────────────────────────────────────────────────   │
│  Statut : en_attente_validation_conducteur                      │
│  Action : Valider ou Rejeter (commentaire obligatoire)          │
│  Notification → Responsable des Travaux                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  ÉTAPE 3 : VALIDATION RESP. TRAVAUX (Responsable Travaux)       │
│  ────────────────────────────────────────────────────────────   │
│  Statut : en_attente_validation_responsable_travaux             │
│  Action : Valider ou Rejeter                                    │
│  Notification → Chargé d'Affaire                                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  ÉTAPE 4 : VALIDATION BUDGET (Chargé d'Affaire)                 │
│  ────────────────────────────────────────────────────────────   │
│  Statut : en_attente_validation_charge_affaire                  │
│  Action : Valider ou Rejeter (vérification budget)              │
│  Notification → Responsable Appro                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  ÉTAPE 5 : PRÉPARATION STOCK (Responsable Appro)                │
│  ────────────────────────────────────────────────────────────   │
│  Statut : en_attente_preparation_appro                          │
│  Action : Préparer ou Rejeter (vérification stock)              │
│  Notification → Responsable Livreur                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  ÉTAPE 6A : RÉCEPTION LIVREUR (Responsable Livreur)             │
│  ────────────────────────────────────────────────────────────   │
│  Statut : en_attente_reception_livreur                          │
│  Action : Valider réception                                     │
│  Notification → Responsable Livreur (étape suivante)            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  ÉTAPE 6B : LIVRAISON (Responsable Livreur)                     │
│  ────────────────────────────────────────────────────────────   │
│  Statut : en_attente_livraison                                  │
│  Action : Valider livraison                                     │
│  Notification → Employé (Demandeur)                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  ÉTAPE 7 : CONFIRMATION RÉCEPTION (Employé - Demandeur)         │
│  ────────────────────────────────────────────────────────────   │
│  Statut : en_attente_validation_finale_demandeur                │
│  Action : Confirmer réception                                   │
│  Statut : confirmee_demandeur                                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  ÉTAPE 8 : CLÔTURE FINALE (Employé - Demandeur)                 │
│  ────────────────────────────────────────────────────────────   │
│  Statut : confirmee_demandeur                                   │
│  Action : Clôturer la demande                                   │
│  Statut final : cloturee                                        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                    ✅ DEMANDE TERMINÉE
```

**Durée estimée** : 2-5 jours (selon disponibilité des valideurs)

---

### 🛠️ Workflow OUTILLAGE (10 étapes)

```
┌─────────────────────────────────────────────────────────────────┐
│  ÉTAPE 1 : CRÉATION (Employé)                                   │
│  ────────────────────────────────────────────────────────────   │
│  Action : Créer demande + Soumettre                             │
│  Statut : brouillon → soumise → en_attente_validation_logistique│
│  Notification → Responsable Logistique (PAS Conducteur)         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  ÉTAPE 2 : VALIDATION LOGISTIQUE (Responsable Logistique)       │
│  ────────────────────────────────────────────────────────────   │
│  Statut : en_attente_validation_logistique                      │
│  Action : Valider ou Rejeter                                    │
│  Notification → Responsable des Travaux                         │
│  ⚠️ Logistique valide en premier pour outillage                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  ÉTAPE 3 : VALIDATION RESP. TRAVAUX (Responsable Travaux)       │
│  ────────────────────────────────────────────────────────────   │
│  Statut : en_attente_validation_responsable_travaux             │
│  Action : Valider ou Rejeter                                    │
│  Notification → Chargé d'Affaire                                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  ÉTAPE 4 : VALIDATION BUDGET (Chargé d'Affaire)                 │
│  ────────────────────────────────────────────────────────────   │
│  Statut : en_attente_validation_charge_affaire                  │
│  Action : Valider ou Rejeter (vérification budget)              │
│  Notification → Responsable Logistique (PAS Appro!)             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  ÉTAPE 5 : PRÉPARATION LOGISTIQUE (Responsable Logistique)      │
│  ────────────────────────────────────────────────────────────   │
│  Statut : en_attente_preparation_logistique                     │
│  Action : Préparer sortie                                       │
│  - Valider les quantités à sortir                               │
│  - Ajuster quantités si nécessaire                              │
│  Notification → Responsable Livreur                             │
│  ⚠️ Logistique prépare au lieu de l'Appro pour outillage        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  ÉTAPE 6A : RÉCEPTION LIVREUR (Responsable Livreur)             │
│  ────────────────────────────────────────────────────────────   │
│  Statut : en_attente_reception_livreur                          │
│  Action : Valider réception du matériel                         │
│  Notification → Livreur (étape livraison)                       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  ÉTAPE 6B : LIVRAISON (Responsable Livreur)                     │
│  ────────────────────────────────────────────────────────────   │
│  Statut : en_attente_livraison                                  │
│  Action : Valider livraison au demandeur                        │
│  Notification → Employé (Demandeur)                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  ÉTAPE 7 : CONFIRMATION RÉCEPTION (Employé - Demandeur)         │
│  ────────────────────────────────────────────────────────────   │
│  Statut : en_attente_validation_finale_demandeur                │
│  Action : Confirmer réception                                   │
│  Statut : confirmee_demandeur                                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│  ÉTAPE 8 : CLÔTURE FINALE (Employé - Demandeur)                 │
│  ────────────────────────────────────────────────────────────   │
│  Statut : confirmee_demandeur                                   │
│  Action : Clôturer la demande                                   │
│  Statut final : cloturee                                        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                    ✅ DEMANDE TERMINÉE
```

**⚠️ DIFFÉRENCES CLÉS avec le flow Matériel** :
1. **Logistique au lieu de Conducteur** : Responsable Logistique valide en premier pour outillage
2. **Logistique au lieu d'Appro** : Responsable Logistique prépare les sorties d'outillage
3. **Appro exclu** : Le Responsable Appro ne voit que les demandes de matériel
4. **Nouveau statut** : `en_attente_validation_qhse` et `en_attente_preparation_logistique`

---

### ⚡ Auto-Validation Intelligente

L'application détecte automatiquement si le **demandeur a un rôle de valideur** et **saute son étape de validation** :

#### Exemples d'auto-validation

**Cas 1 : Conducteur crée une demande matériel**
```
Création → ⏭️ SAUTE Conducteur → Resp. Travaux → ...
✅ Étape Conducteur sautée automatiquement
✅ Signature créée automatiquement
✅ Gain de temps : 1 étape en moins
```

**Cas 2 : Responsable Travaux crée une demande**
```
Création → ⏭️ SAUTE Conducteur → ⏭️ SAUTE Resp. Travaux → Chargé Affaire → ...
✅ 2 étapes sautées automatiquement
✅ Gain de temps : 2 jours
```

**Cas 3 : Responsable Logistique crée une demande outillage**
```
Création → ⏭️ SAUTE Logistique 1ère → Resp. Travaux → ... → ⏭️ SAUTE Préparation Logistique → Livreur
✅ 2 étapes Logistique sautées automatiquement (validation + préparation)
```

#### Règles d'auto-validation

| Demandeur | Type | Étapes sautées | Statut initial |
|-----------|------|----------------|----------------|
| Conducteur Travaux | Matériel | 1 (Conducteur) | `en_attente_validation_responsable_travaux` |
| Responsable Logistique | Outillage | 2 (Logistique 1ère + Préparation) | `en_attente_validation_responsable_travaux` |
| Responsable Travaux | Matériel | 2 (Conducteur + Resp. Travaux) | `en_attente_validation_charge_affaire` |
| Chargé Affaire | Matériel | 3 (Conducteur + Resp. Travaux + Chargé) | `en_attente_preparation_appro` |
| Responsable Appro | Matériel | 4 (toutes validations) | `en_attente_reception_livreur` |

---

### 🔄 Workflow de Rejet avec Retour Arrière

À **n'importe quelle étape**, un valideur peut **rejeter** une demande. **NOUVEAU** : La demande retourne au **statut précédent** pour modification :

```
[Demande en validation]
    ↓
[Valideur clique "Rejeter"]
    ↓
⚠️ COMMENTAIRE OBLIGATOIRE
(ex: "Stock insuffisant", "Budget dépassé")
    ↓
↩️ RETOUR AU STATUT PRÉCÉDENT
    ↓
Notification → Valideur précédent
    ↓
[Valideur précédent modifie]
    ↓
↗️ RENVOI pour validation
    ↓
✅ Workflow continue
```

**Points importants** :
- ✅ Commentaire **obligatoire** pour expliquer le rejet
- ✅ Notification au **valideur précédent** (pas le demandeur)
- 🔄 **Compteur de rejets** incrémenté (max 5)
- ✏️ Le **valideur précédent peut modifier** et renvoyer
- 🔁 **Cycle itératif** jusqu'à validation ou abandon
- 📊 **Traçabilité complète** de tous les rejets

#### Exemple de cycle de rejet

**Cas : Demande Matériel avec 2 rejets**
```
1. Employé crée → Conducteur
2. Conducteur VALIDE ✅ → Resp. Travaux
3. Resp. Travaux REJETTE ❌ "Quantités trop élevées"
   └─> RETOUR → Conducteur (nombreRejets: 1)
4. Conducteur MODIFIE (réduit quantités) → Resp. Travaux
5. Resp. Travaux VALIDE ✅ → Chargé Affaire
6. Chargé Affaire REJETTE ❌ "Budget dépassé"
   └─> RETOUR → Resp. Travaux (nombreRejets: 2)
7. Resp. Travaux MODIFIE (articles moins chers) → Chargé Affaire
8. Chargé Affaire VALIDE ✅ → Suite du workflow
```

#### Permissions de modification par niveau

| Niveau | Rôles | Quantités | Articles | Commentaires | Date besoin |
|--------|-------|-----------|----------|--------------|-------------|
| **Niveau 1** | Conducteur, QHSE, Resp. Travaux | ✅ | ✅ | ✅ | ✅ |
| **Niveau 2** | Chargé Affaire | ✅ | ✅ | ✅ | ❌ |
| **Niveau 3** | Resp. Appro | ✅ | ✅ | ✅ | ❌ |
| **Niveau 4** | Livreur | ✅ | ❌ | ✅ | ❌ |

---

### 📊 Tableau Comparatif des Workflows

| Critère | Matériel | Outillage |
|---------|----------|-----------|
| **Première validation** | Conducteur de Travaux | Responsable Logistique |
| **Notification initiale** | → Conducteur | → Logistique |
| **Nombre d'étapes** | 7 étapes | 8 étapes |
| **Préparation** | Responsable Appro | Responsable Logistique |
| **Rôles Logistique** | 0 | 2 (1ère validation + préparation) |
| **Auto-validation** | ✅ Supportée | ✅ Supportée (double pour Logistique) |
| **Rejet possible** | ✅ À chaque étape | ✅ À chaque étape |
| **Clôture** | Demandeur uniquement | Demandeur uniquement |
| **Durée moyenne** | 3 jours | 3 jours |

### Statuts des Demandes

| Statut | Description |
|--------|-------------|
| `brouillon` | En cours de création |
| `soumise` | Soumise pour validation |
| `en_attente_validation_conducteur` | Attente validation conducteur (matériel) |
| `en_attente_validation_logistique` | Attente validation logistique (1ère - outillage) |
| `en_attente_validation_responsable_travaux` | Attente validation resp. travaux |
| `en_attente_validation_charge_affaire` | Attente validation chargé affaire |
| `en_attente_preparation_appro` | Attente préparation appro (matériel uniquement) |
| `en_attente_preparation_logistique` | Préparation logistique (outillage uniquement) |
| `en_attente_reception_livreur` | Attente réception par le livreur |
| `en_attente_livraison` | Attente livraison au demandeur |
| `en_attente_validation_finale_demandeur` | Attente confirmation demandeur |
| `confirmee_demandeur` | Confirmée par le demandeur |
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

## ✨ Fonctionnalités Principales

### 🔐 Authentification & Sécurité
- 📱 **Connexion par téléphone** (format camerounais - 9 chiffres)
- 🔒 **JWT sécurisé** avec tokens cryptés
- 🛡️ **Permissions granulaires** basées sur les rôles
- 🔑 **Mots de passe hashés** (bcryptjs - 12 rounds)
- ✅ **Validation Zod** sur toutes les entrées

### 📋 Gestion des Demandes
- 📄 **Création de demandes** matériel et outillage
- ✅ **Workflow de validation** multi-niveaux automatisé
- 🔄 **Auto-validation intelligente** (si demandeur = valideur)
- 📝 **Brouillons** avec sauvegarde automatique
- 🎯 **Filtrage par projet** pour chaque utilisateur
- 📊 **Suivi en temps réel** de l'état des demandes
- 🔔 **Notifications** à chaque étape de validation
- 📦 **Gestion des articles** avec quantités et références
- ✏️ **Modification/Suppression** des demandes (selon statut)
- 🔒 **Clôture finale** par le demandeur

### 👥 Gestion des Utilisateurs
- 👤 **8 rôles distincts** avec permissions spécifiques
- 🔧 **Création/Modification** d'utilisateurs (Admin)
- 🏗️ **Assignation aux projets** avec rôles personnalisés
- 📊 **Tableaux de bord personnalisés** par rôle
- 🔄 **Rechargement automatique** des données
- 📱 **Interface responsive** optimisée mobile

### 🏗️ Gestion des Projets
- ➕ **Création de projets** avec informations complètes
- 👥 **Assignation d'utilisateurs** avec sélection intuitive
- 🎭 **Gestion des rôles** par projet
- 📊 **Historique des demandes** par projet
- ✏️ **Modification** des détails et équipes
- 📈 **Statistiques** par projet

### 📊 Tableaux de Bord
- 📈 **Statistiques en temps réel** par rôle
- 📉 **Graphiques interactifs** (Recharts)
- 🎯 **Cartes de synthèse** avec compteurs dynamiques
- 📋 **Listes filtrables** de demandes
- 🔄 **Actualisation manuelle** disponible
- 📱 **Design responsive** pour tous les écrans

### 🎨 Interface Utilisateur
- 🎨 **Palette de couleurs cohérente** (#015fc4, #b8d1df, #fc2d1f)
- 📱 **100% responsive** (mobile, tablette, desktop)
- 🌓 **Support dark mode** (prévu)
- ♿ **Accessibilité** (WCAG 2.1)
- 🎯 **Zones tactiles optimisées** (44px minimum)
- ⚡ **Transitions fluides** et animations optimisées
- 🔍 **Modales détaillées** pour chaque action

### 📦 Catalogue & Stock
- 📦 **Gestion des articles** avec références
- 📊 **Suivi des stocks** en temps réel
- 🔍 **Recherche et filtrage** avancés
- 📝 **Descriptions détaillées** des articles

### 🔔 Notifications
- 📬 **Notifications en temps réel** pour chaque action
- ✉️ **Emails automatiques** (optionnel)
- 🔔 **Alertes de validation** pour les valideurs
- 📊 **Historique complet** des notifications

### 📈 Reporting & Analytics
- 📊 **Graphiques de flux** matériel/outillage
- 📉 **Statistiques par période** (jour, semaine, mois)
- 🎯 **Répartition par statut** (pie charts)
- 📈 **Tendances** et évolutions
- 📋 **Export de données** (prévu)

---

## 🎯 Palette de Couleurs

L'application utilise une palette cohérente :
- **Bleu principal** : `#015fc4` (boutons, liens, éléments actifs)
- **Bleu clair** : `#b8d1df` (backgrounds, cartes secondaires)
- **Rouge accent** : `#fc2d1f` (alertes, suppressions, rejets)
- **Vert succès** : `#22c55e` (validations, confirmations)
- **Orange attention** : `#f97316` (en attente, avertissements)

---

## 🔧 Améliorations Récentes

### ✅ Corrections Majeures
- ✅ **Filtrage par projet** corrigé pour tous les valideurs
- ✅ **Transformation des données API** pour compatibilité
- ✅ **Rechargement automatique** avec système de cache
- ✅ **Permissions read_users** pour les valideurs
- ✅ **Validation outillage** ajoutée au responsable travaux
- ✅ **Flow de validation** complet matériel + outillage
- ✅ **Carte "En cours"** corrigée (demandes du demandeur uniquement)
- ✅ **Modale de clôture** avec boutons d'action
- ✅ **Sélection utilisateurs** dans création projet (checkboxes)
- ✅ **NOUVEAU FLOW OUTILLAGE** : Double validation Logistique
- ✅ **Nouveau statut** : `en_attente_validation_logistique_finale`
- ✅ **Appro filtré** : Ne voit plus les demandes d'outillage
- ✅ **Composant PreparationOutillageList** pour Responsable Logistique

### 🎨 Améliorations UI/UX
- ✅ **Login 100% responsive** pour tous les mobiles
- ✅ **Tableaux scrollables** avec en-têtes fixes
- ✅ **Barre de progression** pour sélection utilisateurs
- ✅ **Badges colorés** par rôle et statut
- ✅ **Avatars avec initiales** pour utilisateurs
- ✅ **Modales personnalisées** avec actions contextuelles
- ✅ **Boutons d'action** (voir, modifier, supprimer)

### 🚀 Fonctionnalités Ajoutées
- ✅ **Hook useAutoReload** pour tous les dashboards
- ✅ **Composant SharedDemandesSection** réutilisable
- ✅ **Modale d'historique** des demandes par projet
- ✅ **Modification de projet** avec gestion utilisateurs
- ✅ **Logs de debug** détaillés pour troubleshooting
- ✅ **Système de cache** pour optimiser les appels API

---

## 📝 Notes de Développement

### Problèmes Résolus
1. **Demandes invisibles pour valideurs** → Transformation format projets API
2. **Erreurs 401 répétées** → Système de cache et verrous
3. **Double déclenchement toggleUser** → stopPropagation sur événements
4. **Carte "En cours" incorrecte** → Filtrage par technicienId
5. **Permissions insuffisantes** → Nouvelle permission read_users

### Bonnes Pratiques
- ✅ Utiliser le hook `useAutoReload` pour les dashboards
- ✅ Filtrer par projet avec `currentUser.projets.includes(d.projetId)`
- ✅ Vérifier les permissions avec `hasPermission(user, permission)`
- ✅ Utiliser le système de cache pour éviter appels multiples
- ✅ Respecter la palette de couleurs définie
- ✅ Tester sur mobile (iPhone SE minimum - 320px)

---

---

## 📚 Documentation Complémentaire

- 📄 **[UTILISATEURS_TEST.md](./UTILISATEURS_TEST.md)** - Comptes de test et guide de test du nouveau flow
- 🚀 **[README-DEPLOYMENT.md](./README-DEPLOYMENT.md)** - Guide de déploiement
- 📧 **[README-NOTIFICATIONS.md](./README-NOTIFICATIONS.md)** - Configuration des notifications
- 🌲 **[README-ARBORESCENCE.md](./README-ARBORESCENCE.md)** - Structure du projet

---

**Version** : 4.0 - Nouveau Flow Outillage  
**Dernière mise à jour** : Janvier 2026  
**Développé par** : InstrumElec Team

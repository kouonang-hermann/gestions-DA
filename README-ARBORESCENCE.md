# 🌳 Arborescence du Projet - Gestion Demandes Matériel

## 📁 Structure Générale du Projet

```
gestion-demandes-materiel/
├── 📁 app/                          # Application Next.js 13+ (App Router)
│   ├── 📁 api/                      # Routes API Backend
│   ├── 📁 dashboard/                # Pages des tableaux de bord
│   ├── 📁 login/                    # Page de connexion
│   ├── 📄 globals.css               # Styles globaux
│   ├── 📄 layout.tsx                # Layout principal
│   └── 📄 page.tsx                  # Page d'accueil
├── 📁 components/                   # Composants React réutilisables
├── 📁 lib/                          # Utilitaires et configurations
├── 📁 prisma/                       # Base de données et migrations
├── 📁 scripts/                      # Scripts de test et maintenance
├── 📁 stores/                       # Gestion d'état (Zustand)
├── 📁 types/                        # Types TypeScript
├── 📄 package.json                  # Dépendances et scripts
├── 📄 next.config.mjs              # Configuration Next.js
├── 📄 tailwind.config.ts           # Configuration Tailwind CSS
├── 📄 vercel.json                  # Configuration Vercel
└── 📄 README-DEPLOYMENT.md         # Guide de déploiement
```

---

## 🎯 **Détail par Dossier**

### 📁 `/app` - Application Next.js (App Router)

```
app/
├── 📁 api/                          # Backend API Routes
│   ├── 📁 auth/                     # Authentification
│   │   ├── 📄 login/route.ts        # Connexion utilisateur
│   │   ├── 📄 logout/route.ts       # Déconnexion
│   │   └── 📄 me/route.ts           # Profil utilisateur
│   ├── 📁 demandes/                 # Gestion des demandes
│   │   ├── 📄 route.ts              # CRUD demandes
│   │   ├── 📁 [id]/                 # Demande spécifique
│   │   │   ├── 📄 route.ts          # GET/PUT/DELETE demande
│   │   │   ├── 📁 actions/          # Actions sur demande
│   │   │   │   └── 📄 route.ts      # Validation/Rejet
│   │   │   └── 📁 remove-item/      # Suppression d'articles
│   │   │       └── 📄 route.ts      # DELETE article
│   │   └── 📁 validated-history/    # Historique validé
│   │       └── 📄 route.ts          # GET demandes terminées
│   ├── 📁 projets/                  # Gestion des projets
│   │   ├── 📄 route.ts              # CRUD projets
│   │   └── 📁 [id]/                 # Projet spécifique
│   │       └── 📁 remove-user/      # Retrait utilisateur
│   │           └── 📄 route.ts      # DELETE utilisateur
│   ├── 📁 articles/                 # Gestion des articles
│   │   └── 📄 route.ts              # CRUD articles
│   ├── 📁 users/                    # Gestion des utilisateurs
│   │   └── 📄 route.ts              # CRUD utilisateurs
│   └── 📁 notifications/            # Système de notifications
│       └── 📄 route.ts              # GET/PUT notifications
├── 📁 dashboard/                    # Pages des tableaux de bord
│   ├── 📄 page.tsx                  # Dashboard principal
│   ├── 📁 admin/                    # Interface admin
│   │   └── 📄 page.tsx              # Gestion utilisateurs/projets
│   ├── 📁 demandes/                 # Gestion des demandes
│   │   ├── 📄 page.tsx              # Liste des demandes
│   │   ├── 📁 nouvelle/             # Nouvelle demande
│   │   │   └── 📄 page.tsx          # Formulaire création
│   │   └── 📁 validation/           # Validation des demandes
│   │       └── 📄 page.tsx          # Interface validation
│   └── 📁 historique/               # Historique
│       └── 📄 page.tsx              # Demandes terminées
├── 📁 login/                        # Authentification
│   └── 📄 page.tsx                  # Page de connexion
├── 📄 globals.css                   # Styles CSS globaux
├── 📄 layout.tsx                    # Layout principal (navbar, etc.)
└── 📄 page.tsx                      # Page d'accueil (redirection)
```

### 📁 `/components` - Composants React

```
components/
├── 📁 ui/                           # Composants UI de base (shadcn/ui)
│   ├── 📄 button.tsx                # Boutons
│   ├── 📄 dialog.tsx                # Modals/Dialogs
│   ├── 📄 input.tsx                 # Champs de saisie
│   ├── 📄 table.tsx                 # Tableaux
│   ├── 📄 badge.tsx                 # Badges/Labels
│   └── 📄 ...                       # Autres composants UI
├── 📁 dashboard/                    # Dashboards par rôle
│   ├── 📄 super-admin-dashboard.tsx # Dashboard SuperAdmin
│   ├── 📄 employe-dashboard.tsx     # Dashboard Employé
│   ├── 📄 conducteur-dashboard.tsx  # Dashboard Conducteur
│   ├── 📄 responsable-dashboard.tsx # Dashboard Responsable
│   └── 📄 ...                       # Autres dashboards
├── 📁 charts/                       # Graphiques et statistiques
│   ├── 📄 requests-flow-chart.tsx   # Graphique flux demandes
│   └── 📄 user-requests-chart.tsx   # Graphique utilisateur
├── 📁 modals/                       # Modals/Popups
│   ├── 📄 demande-details-modal.tsx # Détails demande
│   ├── 📄 details-modal.tsx         # Modal générique
│   ├── 📄 remove-item-confirmation-modal.tsx # Suppression article
│   └── 📄 user-role-modal.tsx       # Changement rôle
├── 📁 demandes/                     # Composants demandes
│   ├── 📄 demande-form.tsx          # Formulaire demande
│   ├── 📄 demande-list.tsx          # Liste demandes
│   └── 📄 purchase-request-card.tsx # Carte demande
├── 📁 validation/                   # Composants validation
│   ├── 📄 validation-demandes-list.tsx # Liste validation
│   └── 📄 validation-actions.tsx    # Actions validation
├── 📁 admin/                        # Composants admin
│   ├── 📄 user-management.tsx       # Gestion utilisateurs
│   ├── 📄 project-management.tsx    # Gestion projets
│   ├── 📄 change-user-role-modal.tsx # Changement rôle
│   └── 📄 remove-user-from-project-modal.tsx # Retrait utilisateur
├── 📁 logistique/                   # Composants logistique
│   └── 📄 validation-logistique-list.tsx # Validation logistique
├── 📁 charge-affaire/               # Composants chargé affaire
│   └── 📄 validation-preparation-list.tsx # Validation préparation
├── 📁 technicien/                   # Composants technicien
│   └── 📄 validation-finale-list.tsx # Validation finale
└── 📄 navbar.tsx                    # Barre de navigation
```

### 📁 `/lib` - Utilitaires et Configurations

```
lib/
├── 📄 prisma.ts                     # Configuration Prisma Client
├── 📄 auth.ts                       # Utilitaires authentification
├── 📄 utils.ts                      # Fonctions utilitaires
└── 📄 validations.ts                # Schémas de validation
```

### 📁 `/prisma` - Base de Données

```
prisma/
├── 📄 schema.prisma                 # Schéma de base de données
├── 📄 seed.ts                       # Données initiales
├── 📁 migrations/                   # Migrations de BDD
│   └── 📄 ...                       # Fichiers de migration
└── 📄 dev.db                        # Base SQLite (dev local)
```

### 📁 `/scripts` - Scripts de Test et Maintenance

```
scripts/
├── 📄 test-complete-validation-flow.js # Test flow validation complet
├── 📄 test-simple-validation-flow.js   # Test flow validation simple
├── 📄 test-remove-user-from-project.js # Test retrait utilisateur
├── 📄 test-remove-item-functionality.js # Test suppression article
└── 📄 reset-database.js             # Réinitialisation BDD
```

### 📁 `/stores` - Gestion d'État

```
stores/
└── 📄 useStore.ts                   # Store Zustand principal
```

### 📁 `/types` - Types TypeScript

```
types/
└── 📄 index.ts                      # Définitions de types
```

---

## 🎯 **Architecture et Patterns**

### **🏗️ Architecture Générale**
- **Frontend** : Next.js 15+ avec App Router
- **Backend** : API Routes Next.js (serverless)
- **Base de données** : PostgreSQL avec Prisma ORM
- **État** : Zustand pour la gestion d'état client
- **UI** : shadcn/ui + Tailwind CSS
- **Authentification** : JWT personnalisé

### **📊 Patterns Utilisés**

#### **1. App Router Next.js**
```
app/
├── layout.tsx          # Layout partagé
├── page.tsx           # Page route
├── loading.tsx        # Loading UI
├── error.tsx          # Error UI
└── api/
    └── route.ts       # API endpoint
```

#### **2. Composants par Domaine**
```
components/
├── dashboard/         # Dashboards par rôle
├── demandes/         # Logique métier demandes
├── validation/       # Processus validation
├── admin/           # Administration
└── ui/              # Composants UI génériques
```

#### **3. API RESTful**
```
/api/demandes/
├── GET    /           # Liste demandes
├── POST   /           # Créer demande
├── GET    /[id]       # Détail demande
├── PUT    /[id]       # Modifier demande
├── DELETE /[id]       # Supprimer demande
└── POST   /[id]/actions # Actions (valider/rejeter)
```

### **🔐 Sécurité et Permissions**

#### **Niveaux d'Accès**
1. **SuperAdmin** : Accès total (gestion utilisateurs/projets)
2. **Admin** : Gestion projets et utilisateurs
3. **Responsables** : Validation selon domaine
4. **Employés** : Création et suivi demandes

#### **Protection des Routes**
- **Middleware** : Vérification JWT sur toutes les routes
- **API Guards** : Contrôle permissions par endpoint
- **Client Guards** : Protection côté interface

---

## 🚀 **Flux de Données**

### **📋 Cycle de Vie d'une Demande**

```
1. Création (Employé)
   ↓
2. Validation Métier (Conducteur/Logistique)
   ↓
3. Validation Responsable Travaux
   ↓
4. Validation Chargé Affaires
   ↓
5. Préparation Appro
   ↓
6. Validation Logistique
   ↓
7. Validation Finale Demandeur
   ↓
8. Clôture
```

### **🔄 Gestion d'État**

```
Zustand Store
├── currentUser        # Utilisateur connecté
├── demandes          # Liste des demandes
├── projets           # Liste des projets
├── articles          # Catalogue articles
├── notifications     # Notifications utilisateur
└── actions           # Actions asynchrones
```

---

## 📚 **Technologies et Dépendances**

### **🎯 Stack Principal**
- **Next.js 15+** : Framework React full-stack
- **TypeScript** : Typage statique
- **Prisma** : ORM base de données
- **PostgreSQL** : Base de données production
- **Tailwind CSS** : Framework CSS utilitaire
- **shadcn/ui** : Composants UI modernes

### **📦 Dépendances Clés**
- **@prisma/client** : Client Prisma
- **zustand** : Gestion d'état
- **lucide-react** : Icônes
- **recharts** : Graphiques
- **bcryptjs** : Hachage mots de passe
- **jsonwebtoken** : Authentification JWT

---

## 🎉 **Conclusion**

Cette architecture modulaire et bien structurée permet :

- ✅ **Maintenabilité** : Code organisé par domaine
- ✅ **Scalabilité** : Composants réutilisables
- ✅ **Sécurité** : Permissions granulaires
- ✅ **Performance** : Optimisations Next.js
- ✅ **Développement** : Types TypeScript complets
- ✅ **Déploiement** : Compatible Vercel/serverless

**L'application est prête pour la production et peut facilement évoluer selon les besoins métier !** 🚀

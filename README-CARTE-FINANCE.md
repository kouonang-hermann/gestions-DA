# 💰 CARTE FINANCE - GUIDE COMPLET

## 📋 Vue d'ensemble

La **Carte Finance** est un module de suivi financier intégré dans les dashboards du **Chargé d'Affaires** et du **Super Admin**. Elle permet de visualiser, analyser et suivre les coûts des demandes de matériel et d'outillage par projet.

## 🎯 Objectifs

- **Suivi budgétaire** : Visualiser les coûts réels des demandes
- **Analyse par projet** : Comparer les dépenses entre projets
- **Répartition par type** : Distinguer matériel vs outillage
- **Indicateurs de performance** : Suivre les KPIs financiers
- **Aide à la décision** : Fournir des données pour la gestion budgétaire

---

## 🔑 Accès à la Carte Finance

### **Qui peut y accéder ?**

| Rôle | Accès | Fonctionnalités |
|------|-------|-----------------|
| **Chargé d'Affaires** | ✅ Oui | Vue complète avec filtres |
| **Super Admin** | ✅ Oui | Vue complète + dashboard détaillé |
| Autres rôles | ❌ Non | Pas d'accès |

### **Où la trouver ?**

1. **Dashboard Chargé d'Affaires** :
   - Connexion → Dashboard → Section "Finance" (colonne de droite)

2. **Dashboard Super Admin** :
   - Connexion → Dashboard → Section "Finance"
   - Bouton "Voir détails complets" pour le dashboard financier avancé

---

## 📊 Composants de la Carte Finance

### **1. Filtres Financiers**

Trois filtres permettent d'affiner l'analyse :

#### **A. Filtre Période**
```
Options disponibles :
- Tout : Toutes les demandes
- Ce mois : Demandes du mois en cours
- Ce trimestre : 3 derniers mois
- Cette année : Année en cours
```

**Base de calcul** :
- Utilise `dateEngagement` si disponible (date où les prix sont validés)
- Sinon utilise `dateCreation` (date de création de la demande)

#### **B. Filtre Type**
```
Options disponibles :
- Tout : Matériel + Outillage
- Matériel : Uniquement demandes matériel
- Outillage : Uniquement demandes outillage
```

#### **C. Filtre Statut**
```
Options disponibles :
- Tout : Toutes les demandes
- Chiffrées : Demandes avec coût total > 0
- Non chiffrées : Demandes sans coût (coût = 0 ou null)
```

**Exemple d'utilisation** :
```
Période: Ce trimestre
Type: Matériel
Statut: Chiffrées
→ Affiche uniquement les demandes matériel chiffrées des 3 derniers mois
```

---

### **2. Tableau des Coûts par Projet**

Tableau récapitulatif avec les colonnes suivantes :

| Colonne | Description | Format |
|---------|-------------|--------|
| **Projet** | Nom du projet | Texte + icône 📁 |
| **Demandes** | Nombre de demandes | Badge numérique |
| **Matériel** | Coût total matériel | `X XXX €` |
| **Outillage** | Coût total outillage | `X XXX €` |
| **Coût Total** | Somme matériel + outillage | `X XXX €` (gras) |

**Fonctionnalités** :
- ✅ Scroll vertical si nombreux projets (max-height: 192px)
- ✅ En-têtes fixes (sticky)
- ✅ Ligne de total en bas (fond vert)
- ✅ Hover effect sur les lignes
- ✅ Affiche uniquement les projets avec demandes filtrées

**Exemple de ligne** :
```
Projet Alpha | 12 | 45 000 € | 8 500 € | 53 500 €
```

---

### **3. Graphique - Répartition par Type**

Visualisation de la répartition des coûts entre matériel et outillage.

#### **Format** :
- Barres de progression horizontales
- Pourcentages calculés automatiquement
- Montants affichés en euros

#### **Couleurs** :
- **Matériel** : Bleu (#015fc4)
- **Outillage** : Cyan clair (#b8d1df)

#### **Calcul** :
```javascript
Coût Matériel = Σ (demandes.type === "materiel").coutTotal
Coût Outillage = Σ (demandes.type === "outillage").coutTotal
Total = Coût Matériel + Coût Outillage

% Matériel = (Coût Matériel / Total) × 100
% Outillage = (Coût Outillage / Total) × 100
```

**Exemple** :
```
Matériel:   ████████████████░░░░  75% (150 000 €)
Outillage:  █████░░░░░░░░░░░░░░░  25% (50 000 €)
Total:      200 000 €
```

---

### **4. Graphique - Top 5 Projets**

Classement des 5 projets les plus coûteux.

#### **Affichage** :
- Médailles pour le top 3 (🥇🥈🥉)
- Barres de progression proportionnelles
- Nombre de demandes par projet
- Coût total par projet

#### **Couleurs des barres** :
- **1er** : Vert foncé (#22c55e)
- **2ème** : Vert moyen (#4ade80)
- **3ème+** : Vert clair (#86efac)

#### **Calcul** :
```javascript
Pour chaque projet:
  - Coût = Σ demandes du projet
  - Nb demandes = Count demandes du projet
  
Trier par coût décroissant
Prendre les 5 premiers
```

**Exemple** :
```
🥇 Projet Alpha    (24 demandes)  ████████████████████  250 000 €
🥈 Projet Beta     (18 demandes)  ███████████████░░░░░  180 000 €
🥉 Projet Gamma    (15 demandes)  ████████████░░░░░░░░  140 000 €
4  Projet Delta    (12 demandes)  ████████░░░░░░░░░░░░   95 000 €
5  Projet Epsilon  (8 demandes)   █████░░░░░░░░░░░░░░░   60 000 €
```

---

### **5. Indicateurs de Performance (KPIs)**

Quatre indicateurs clés affichés sous forme de cartes :

#### **A. Délai Moyen**
```
Calcul: Moyenne des jours entre création et clôture
Formule: Σ (dateClôture - dateCreation) / nb demandes clôturées
Unité: jours
Couleur: Bleu
```

#### **B. Taux d'Approbation**
```
Calcul: % de demandes validées (non brouillon/rejetée/archivée)
Formule: (nb demandes validées / nb total demandes) × 100
Unité: %
Couleur: Vert
```

#### **C. Coût Moyen Matériel**
```
Calcul: Coût moyen par demande matériel chiffrée
Formule: Σ coutTotal (type=matériel) / nb demandes matériel
Unité: € par demande
Couleur: Violet
```

#### **D. Coût Moyen Outillage**
```
Calcul: Coût moyen par demande outillage chiffrée
Formule: Σ coutTotal (type=outillage) / nb demandes outillage
Unité: € par demande
Couleur: Cyan
```

**Exemple d'affichage** :
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│ Délai Moyen     │  │ Taux Approbation│  │ Coût Moy. Mat.  │  │ Coût Moy. Out.  │
│      12         │  │      87%        │  │    4 500 €      │  │    1 200 €      │
│    jours        │  │   145/167       │  │  par demande    │  │  par demande    │
└─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

### **6. Évolution Temporelle (Super Admin uniquement)**

Graphique montrant l'évolution des coûts sur les 6 derniers mois.

#### **Données affichées** :
- Coût matériel par mois
- Coût outillage par mois
- Coût total par mois
- Nombre de demandes par mois

#### **Calcul de l'évolution** :
```javascript
Évolution = ((Mois actuel - Mois précédent) / Mois précédent) × 100

Si évolution > 0 : 📈 Hausse de X%
Si évolution < 0 : 📉 Baisse de X%
Si évolution = 0 : ➡️ Stable
```

---

## 💰 Gestion des Prix et Coûts

### **Workflow Financier**

```
1. Création demande → coutTotal = null
2. Validation conducteur/logistique → coutTotal = null
3. Validation responsable travaux → coutTotal = null
4. Validation chargé d'affaires → budgetPrevisionnel renseigné (optionnel)
5. Préparation appro → prixUnitaires renseignés
6. Calcul automatique → coutTotal = Σ (prixUnitaire × quantité)
7. Engagement financier → dateEngagement = maintenant
```

### **Rôles et Responsabilités**

| Rôle | Action | API | Champ modifié |
|------|--------|-----|---------------|
| **Chargé d'Affaires** | Renseigner budget prévisionnel | `/api/demandes/[id]/update-budget` | `budgetPrevisionnel` |
| **Responsable Appro** | Renseigner prix unitaires | `/api/demandes/[id]/update-prices` | `prixUnitaire` (items) |
| **Système** | Calculer coût total | Automatique | `coutTotal` |
| **Système** | Enregistrer date engagement | Automatique | `dateEngagement` |

---

## 🔧 APIs Financières

### **1. Mise à jour du Budget Prévisionnel**

**Endpoint** : `PUT /api/demandes/[id]/update-budget`

**Accès** : Chargé d'Affaires, Super Admin

**Body** :
```json
{
  "budgetPrevisionnel": 50000
}
```

**Statuts autorisés** :
- `en_attente_validation_charge_affaire`
- `en_attente_preparation_appro`
- `en_attente_validation_logistique`
- `en_attente_validation_finale_demandeur`
- `confirmee_demandeur`
- `cloturee`

**Réponse** :
```json
{
  "success": true,
  "message": "Budget prévisionnel mis à jour avec succès",
  "data": {
    "demandeId": "xxx",
    "budgetPrevisionnel": 50000
  }
}
```

---

### **2. Mise à jour des Prix Unitaires**

**Endpoint** : `PUT /api/demandes/[id]/update-prices`

**Accès** : Responsable Appro uniquement

**Body** :
```json
{
  "items": [
    { "itemId": "item-1", "prixUnitaire": 125.50 },
    { "itemId": "item-2", "prixUnitaire": 89.99 }
  ]
}
```

**Logique de calcul** :
```javascript
Pour chaque item:
  quantité = quantiteSortie || quantiteValidee || quantiteDemandee
  coût item = prixUnitaire × quantité

coutTotal = Σ (coût de tous les items)
dateEngagement = Date actuelle
```

**Statuts autorisés** :
- `en_attente_preparation_appro`
- `en_attente_validation_logistique`
- `en_attente_validation_finale_demandeur`
- `confirmee_demandeur`
- `cloturee`

**Réponse** :
```json
{
  "success": true,
  "message": "Prix mis à jour avec succès",
  "data": {
    "demandeId": "xxx",
    "coutTotal": 2150.47,
    "itemsUpdated": 2
  }
}
```

---

## 📱 Interface Utilisateur

### **Saisie des Prix (Responsable Appro)**

Dans la modale de détails d'une demande :

```
┌─────────────────────────────────────────────────────┐
│ Demande DEM-2026-0042                               │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 💰 Renseigner les Prix                             │
│                                                     │
│ Article                    Qté    Prix Unitaire    │
│ ─────────────────────────────────────────────────── │
│ Ciment 50kg                10     [125.50 €]       │
│ Sable fin (m³)             5      [89.99 €]        │
│ Gravier (m³)               3      [95.00 €]        │
│                                                     │
│ 💰 Coût total estimé: 1 940.45 €                   │
│                                                     │
│ [Enregistrer les prix]                             │
└─────────────────────────────────────────────────────┘
```

**Validation** :
- ✅ Tous les prix doivent être renseignés
- ✅ Prix > 0
- ✅ Format numérique valide

---

### **Saisie du Budget (Chargé d'Affaires)**

Dans la modale de détails d'une demande :

```
┌─────────────────────────────────────────────────────┐
│ Demande DEM-2026-0042                               │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 📊 Budget Prévisionnel                             │
│                                                     │
│ Montant: [50 000 €]                                │
│                                                     │
│ [Enregistrer le budget]                            │
└─────────────────────────────────────────────────────┘
```

---

## 📈 Cas d'Usage

### **Cas 1 : Suivi Mensuel des Dépenses**

**Objectif** : Voir les dépenses du mois en cours

**Actions** :
1. Aller dans la Carte Finance
2. Sélectionner "Période: Ce mois"
3. Sélectionner "Statut: Chiffrées"
4. Consulter le tableau par projet

**Résultat** :
```
Total du mois: 125 000 €
- Projet Alpha: 45 000 €
- Projet Beta: 38 000 €
- Projet Gamma: 42 000 €
```

---

### **Cas 2 : Comparaison Matériel vs Outillage**

**Objectif** : Analyser la répartition des coûts

**Actions** :
1. Aller dans la Carte Finance
2. Consulter le graphique "Répartition par type"

**Résultat** :
```
Matériel:   75% (150 000 €)
Outillage:  25% (50 000 €)
→ Budget matériel 3× supérieur à l'outillage
```

---

### **Cas 3 : Identification des Projets Coûteux**

**Objectif** : Trouver les projets qui consomment le plus de budget

**Actions** :
1. Aller dans la Carte Finance
2. Consulter le graphique "Top 5 projets"

**Résultat** :
```
🥇 Projet Alpha: 250 000 € (24 demandes)
→ Projet le plus coûteux, nécessite une attention particulière
```

---

### **Cas 4 : Analyse Trimestrielle**

**Objectif** : Bilan financier du trimestre

**Actions** :
1. Sélectionner "Période: Ce trimestre"
2. Consulter tous les indicateurs
3. Exporter les données (si disponible)

**Résultat** :
```
Trimestre Q1 2026:
- Total dépensé: 450 000 €
- Délai moyen: 12 jours
- Taux approbation: 87%
- Coût moyen matériel: 4 500 €
- Coût moyen outillage: 1 200 €
```

---

## 🎨 Codes Couleurs

| Élément | Couleur | Code | Usage |
|---------|---------|------|-------|
| Matériel | Bleu | #015fc4 | Graphiques, badges |
| Outillage | Cyan | #b8d1df | Graphiques, badges |
| Total | Vert | #22c55e | Totaux, KPIs |
| Budget | Violet | #7c3aed | Budget prévisionnel |
| Alerte | Rouge | #ef4444 | Dépassements |
| Neutre | Gris | #6b7280 | Textes secondaires |

---

## 🔒 Sécurité et Permissions

### **Contrôles d'Accès**

```typescript
// Vérification rôle pour carte finance
if (currentUser.role !== "charge_affaire" && currentUser.role !== "superadmin") {
  return <AccessDenied />
}

// Vérification projet pour mise à jour budget
const isAssigned = projet.utilisateurs.some(u => u.userId === currentUser.id)
if (!isAssigned && currentUser.role !== "superadmin") {
  return 403 Forbidden
}
```

### **Validation des Données**

```typescript
// Validation prix unitaire
if (isNaN(prix) || prix < 0) {
  throw new Error("Prix invalide")
}

// Validation budget prévisionnel
if (isNaN(budget) || budget < 0) {
  throw new Error("Budget invalide")
}
```

---

## 📊 Formules de Calcul

### **Coût Total d'une Demande**
```
coutTotal = Σ (prixUnitaire × quantité) pour tous les items

où quantité = quantiteSortie || quantiteValidee || quantiteDemandee
```

### **Coût Total d'un Projet**
```
coutProjet = Σ coutTotal de toutes les demandes du projet
```

### **Coût Moyen par Type**
```
coutMoyenMateriel = Σ coutTotal (type=matériel) / nb demandes matériel
coutMoyenOutillage = Σ coutTotal (type=outillage) / nb demandes outillage
```

### **Taux d'Approbation**
```
tauxApprobation = (nb demandes validées / nb total demandes) × 100

demandes validées = demandes NOT IN (brouillon, rejetee, archivee)
```

### **Délai Moyen**
```
delaiMoyen = Σ (dateClôture - dateCreation) / nb demandes clôturées

résultat en jours
```

---

## 🚀 Fonctionnalités Avancées (Super Admin)

### **Dashboard Financier Complet**

Accessible via le bouton "Voir détails complets" :

**Fonctionnalités supplémentaires** :
- ✅ Graphiques interactifs (recharts)
- ✅ Export des données (CSV, Excel)
- ✅ Filtres avancés
- ✅ Recherche par numéro/projet/demandeur
- ✅ Vue détaillée par demande
- ✅ Comparaisons temporelles
- ✅ Prévisions budgétaires

---

## 🐛 Dépannage

### **Problème : Coûts à 0 ou null**

**Cause** : Prix unitaires non renseignés

**Solution** :
1. Vérifier que le responsable appro a renseigné les prix
2. Vérifier le statut de la demande (doit être ≥ `en_attente_preparation_appro`)
3. Consulter l'historique de la demande

---

### **Problème : Projet n'apparaît pas dans le tableau**

**Cause** : Aucune demande ne correspond aux filtres

**Solution** :
1. Vérifier les filtres (période, type, statut)
2. Sélectionner "Tout" pour tous les filtres
3. Vérifier que le projet a des demandes

---

### **Problème : Graphiques vides**

**Cause** : Aucune demande chiffrée dans la période

**Solution** :
1. Élargir la période (sélectionner "Tout")
2. Vérifier le filtre statut (sélectionner "Tout")
3. Attendre que les demandes soient chiffrées

---

## 📝 Bonnes Pratiques

### **Pour le Chargé d'Affaires**

1. ✅ Renseigner le budget prévisionnel dès la validation
2. ✅ Comparer budget prévisionnel vs coût réel
3. ✅ Analyser les écarts régulièrement
4. ✅ Identifier les projets en dépassement

### **Pour le Responsable Appro**

1. ✅ Renseigner les prix dès réception des devis
2. ✅ Vérifier la cohérence des prix
3. ✅ Mettre à jour si changement de fournisseur
4. ✅ Documenter les sources de prix

### **Pour le Super Admin**

1. ✅ Surveiller les KPIs mensuellement
2. ✅ Analyser les tendances trimestriellement
3. ✅ Identifier les projets problématiques
4. ✅ Optimiser les processus coûteux

---

## 📞 Support

**Questions fréquentes** :

**Q : Qui peut voir les données financières ?**
R : Uniquement le Chargé d'Affaires et le Super Admin.

**Q : Comment sont calculés les coûts ?**
R : Coût = Σ (prix unitaire × quantité) pour tous les articles de la demande.

**Q : Peut-on modifier les prix après validation ?**
R : Oui, le responsable appro peut modifier les prix tant que la demande n'est pas clôturée.

**Q : Quelle est la différence entre budget prévisionnel et coût total ?**
R : Budget prévisionnel = estimation du chargé d'affaires. Coût total = coût réel calculé avec les prix fournisseurs.

---

## 🎯 Résumé

La **Carte Finance** est un outil puissant pour :
- ✅ Suivre les dépenses par projet
- ✅ Analyser la répartition des coûts
- ✅ Identifier les projets coûteux
- ✅ Calculer les KPIs financiers
- ✅ Prendre des décisions budgétaires éclairées

**Accès** : Chargé d'Affaires et Super Admin uniquement

**Mise à jour** : Automatique dès que les prix sont renseignés

**Fiabilité** : Données en temps réel depuis la base de données

---

**Version** : 1.0  
**Dernière mise à jour** : 7 janvier 2026  
**Auteur** : Équipe Technique Gestion DA

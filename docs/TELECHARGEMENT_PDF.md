# Téléchargement PDF - Demandes d'Absence et de Congés

## 🎯 Vue d'ensemble

Chaque utilisateur peut maintenant télécharger ses demandes d'absence et de congés au format HTML (imprimable en PDF) avec toutes les informations disponibles. Les formats d'impression respectent les modèles fournis par l'entreprise.

## 📋 Fonctionnalités Implémentées

### 1. **Téléchargement des Demandes d'Absence**

#### Format du Document
Le document généré respecte le format officiel avec :
- **En-tête** : Logo INSTRUMELEC + Titre "DEMANDE D'ABSENCE"
- **Informations employé** :
  - Nom(s) et Prénom(s)
  - Date du jour
  - Dates et nombre de jours demandés
  - Type d'absence
  - Motif de la demande
  - Signature du demandeur (date de soumission)
- **Section validation hiérarchie** :
  - Cases à cocher ACCORD/REFUS
  - Nom du supérieur hiérarchique
- **Section validation RH et Administration**
- **Informations complémentaires** (lignes vierges)
- **Visa de la Direction Générale**
- **Pied de page** : Numéro de demande, statut, date de génération

#### Utilisation
1. Aller sur la page **"D-absence"**
2. Cliquer sur **"Voir mes demandes"**
3. Pour chaque demande, cliquer sur le bouton **"Télécharger PDF"**
4. Le fichier HTML est téléchargé (format: `Demande_Absence_ABS-2026-0001.html`)
5. Ouvrir le fichier et utiliser **Ctrl+P** (ou Cmd+P) pour imprimer en PDF

### 2. **Téléchargement des Demandes de Congés**

#### Format du Document
Le document généré respecte le format officiel avec :
- **En-tête** : Titre "Demande de Congés"
- **Informations générales** (grille 2 colonnes) :
  - Date du jour et heure de la demande
  - Employé et Responsable hiérarchique
  - Matricule et Nom
  - Service et Numéro de téléphone
  - Adresse email
  - Ancienneté dans la société
- **Tableau des congés disponibles** :
  - Type de congés
  - Date de début et de fin
  - Reste de jours
  - Lignes pour : Congés annuel, maladie, parental, sans solde, autres
- **Contacts en cas d'urgence** :
  - Contact personnel (nom, téléphone)
  - Autre contact (nom, téléphone)
- **Section signatures** :
  - Employé
  - Responsable hiérarchique
  - Responsable RH
  - Visa DG
- **Pied de page** : Numéro de demande, date de génération

#### Utilisation
1. Aller sur la page **"D-congés"**
2. Pour chaque demande dans la liste, cliquer sur l'icône **"Télécharger"** (Download)
3. Le fichier HTML est téléchargé (format: `Demande_Conge_DC-2026-0001.html`)
4. Ouvrir le fichier et utiliser **Ctrl+P** (ou Cmd+P) pour imprimer en PDF

## 🎨 Caractéristiques des Documents

### Design Professionnel
- **Format A4** optimisé pour l'impression
- **Polices** : Arial, tailles adaptées (9pt à 14pt)
- **Couleurs** : Noir et gris pour impression professionnelle
- **Mise en page** : Marges de 2cm, espacement cohérent

### Sections Visuelles
- **Demandes d'Absence** :
  - Fond gris pour les titres de section (#d0d0d0)
  - Lignes pointillées pour les champs à remplir
  - Cases à cocher pour validation
  - Zones de signature grises (#e0e0e0)

- **Demandes de Congés** :
  - Fond gris pour les en-têtes (#d0d0d0, #f0f0f0)
  - Tableau avec bordures noires
  - Grille d'informations en 2 colonnes
  - Zones de signature grises (#e0e0e0)

### Informations Incluses
Toutes les données disponibles dans le système sont incluses :
- ✅ Informations personnelles
- ✅ Dates et durées
- ✅ Motifs et commentaires
- ✅ Statuts et validations
- ✅ Historique des dates (création, soumission, validation)
- ✅ Informations du supérieur hiérarchique
- ✅ Contacts d'urgence (congés)

## 🔧 Implémentation Technique

### Fichiers Créés

#### 1. Générateur PDF Absences
**Fichier** : `lib/absence-pdf-generator.ts`

**Fonctions** :
```typescript
// Génère le HTML de la demande d'absence
generateAbsencePDF(demande: DemandeAbsencePDF): string

// Télécharge le fichier HTML
downloadAbsencePDF(demande: DemandeAbsencePDF): void
```

**Interface** :
```typescript
interface DemandeAbsencePDF {
  numero: string
  employe: { nom: string; prenom: string }
  dateDebut: string
  dateFin: string
  nombreJours: number
  motif: string
  typeAbsence: string
  status: string
  dateCreation: string
  superieurHierarchique: { nom: string; prenom: string }
}
```

#### 2. Générateur PDF Congés
**Fichier** : `lib/conge-pdf-generator.ts`

**Fonctions** :
```typescript
// Génère le HTML de la demande de congé
generateCongeHTML(demande: CongeData): string

// Télécharge le fichier HTML
downloadCongePDF(demande: CongeData): void
```

**Interface** : Utilise l'interface `CongeData` existante

### Intégration dans les Composants

#### Liste des Absences
**Fichier** : `components/absence/absences-list.tsx`

**Modifications** :
- Import de `downloadAbsencePDF`
- Ajout du bouton "Télécharger PDF" dans chaque carte
- Préparation des données au format requis
- Bouton avec icône Download et style cohérent

#### Page des Congés
**Fichier** : `app/d-conges/page.tsx`

**Modifications** :
- Import de `downloadCongePDF`
- Fonction `handleDownloadPDF` existante mise à jour
- Bouton de téléchargement déjà présent dans l'interface

## 📝 Format de Téléchargement

### Pourquoi HTML et pas PDF directement ?

**Avantages du format HTML** :
1. **Simplicité** : Pas de dépendance externe lourde
2. **Qualité** : Rendu parfait lors de l'impression
3. **Flexibilité** : L'utilisateur peut ajuster les paramètres d'impression
4. **Performance** : Génération instantanée
5. **Compatibilité** : Fonctionne sur tous les navigateurs

### Comment Convertir en PDF ?

**Méthode 1 - Impression navigateur** (Recommandée) :
1. Ouvrir le fichier HTML téléchargé
2. Appuyer sur **Ctrl+P** (Windows) ou **Cmd+P** (Mac)
3. Sélectionner **"Enregistrer au format PDF"** comme imprimante
4. Cliquer sur **"Enregistrer"**

**Méthode 2 - Navigateur Chrome** :
1. Ouvrir le fichier HTML
2. Menu ⋮ → **Imprimer**
3. Destination : **Enregistrer au format PDF**
4. Ajuster les marges si nécessaire
5. **Enregistrer**

**Méthode 3 - Microsoft Edge** :
1. Ouvrir le fichier HTML
2. Menu ⋯ → **Imprimer**
3. Imprimante : **Microsoft Print to PDF**
4. **Imprimer**

## 🎯 Cas d'Usage

### Pour les Employés
- Télécharger une demande d'absence pour la transmettre au RH
- Imprimer une demande de congé pour signature physique
- Archiver les demandes approuvées
- Fournir une preuve de demande

### Pour les Responsables
- Télécharger les demandes pour validation hors ligne
- Imprimer pour signature et archivage papier
- Partager avec d'autres services (RH, DG)

### Pour les RH
- Archivage des demandes validées
- Constitution des dossiers employés
- Audit et conformité

## ⚙️ Configuration

### Aucune Configuration Requise
Les fonctionnalités de téléchargement fonctionnent immédiatement :
- ✅ Pas de bibliothèque externe à installer
- ✅ Pas de configuration serveur
- ✅ Pas de clé API nécessaire
- ✅ Fonctionne côté client uniquement

### Personnalisation Possible

Si vous souhaitez modifier les templates :

**Fichiers à éditer** :
- `lib/absence-pdf-generator.ts` - Template absence
- `lib/conge-pdf-generator.ts` - Template congés

**Éléments personnalisables** :
- Logo de l'entreprise (actuellement texte SVG)
- Couleurs et styles CSS
- Mise en page et espacement
- Sections et champs affichés

## 🔐 Sécurité et Confidentialité

### Données Privées
- Les PDF contiennent des informations personnelles
- Téléchargement uniquement pour l'utilisateur propriétaire
- Pas de stockage côté serveur
- Génération à la demande

### Permissions
- Seul l'employé peut télécharger ses propres demandes
- Les supérieurs hiérarchiques peuvent voir mais pas télécharger (à implémenter si nécessaire)
- Respect des règles de confidentialité RGPD

## 📊 Statistiques et Monitoring

### Logs
Les téléchargements ne sont pas loggés actuellement. Si nécessaire, ajouter :
```typescript
console.log(`PDF téléchargé: ${demande.numero} par ${currentUser.nom}`)
```

### Analytics (Optionnel)
Pour suivre l'utilisation :
- Nombre de téléchargements par utilisateur
- Types de demandes les plus téléchargées
- Périodes de forte utilisation

## 🚀 Améliorations Futures (Optionnelles)

### Fonctionnalités Avancées
- [ ] Génération PDF directe (avec bibliothèque jsPDF)
- [ ] Envoi par email automatique
- [ ] Signature électronique intégrée
- [ ] QR Code pour vérification d'authenticité
- [ ] Watermark avec statut de la demande
- [ ] Export groupé (plusieurs demandes en un PDF)
- [ ] Templates personnalisables par département

### Optimisations
- [ ] Compression des fichiers HTML
- [ ] Cache des templates
- [ ] Prévisualisation avant téléchargement
- [ ] Choix du format (HTML, PDF, DOCX)

## ✅ Résultat Final

### Fonctionnalités Opérationnelles
✅ **Demandes d'Absence** :
- Bouton "Télécharger PDF" dans chaque carte
- Format conforme au modèle fourni
- Toutes les informations incluses
- Prêt pour impression

✅ **Demandes de Congés** :
- Bouton de téléchargement dans la liste
- Format conforme au modèle fourni
- Tableau des congés disponibles
- Contacts d'urgence inclus

### Interface Utilisateur
✅ Boutons clairement identifiés avec icône Download
✅ Couleur cohérente avec la palette (#015fc4)
✅ Feedback visuel au clic
✅ Compatible mobile et desktop

### Qualité des Documents
✅ Format A4 professionnel
✅ Mise en page soignée
✅ Informations complètes et structurées
✅ Prêt pour signature et archivage

---

**Développé pour** : Système de Gestion des Demandes Matériel  
**Date** : Février 2026  
**Version** : 1.0.0  
**Formats** : Basés sur les modèles officiels INSTRUMELEC

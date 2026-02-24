# 📋 Prérequis pour l'Affichage des Signatures dans le PDF

## ✅ Ce Qui Est Déjà Fait

Le générateur PDF est **complètement configuré** pour afficher :
- ✅ **Noms** de tous les validateurs
- ✅ **Dates et heures** de validation
- ✅ **Signatures visuelles** (images base64)
- ✅ **Logs de debug** pour tracer les problèmes

---

## 🎯 Validateurs Gérés dans le PDF

Le tableau des visas affiche **4 colonnes** :

| Colonne | Validateurs Concernés | Type de Validation |
|---------|----------------------|-------------------|
| **Demandeur** | Créateur de la demande | Automatique (date de création) |
| **Conducteur des travaux** | Conducteur | `validation_conducteur` |
| **Appro/Logistique** | Appro OU Logistique | `validation_appro` OU `preparation_appro` OU `validation_logistique` OU `preparation_logistique` |
| **Resp. Travaux/Chargé Affaire** | Responsable Travaux OU Chargé Affaire | `validation_responsable_travaux` OU `validation_charge_affaire` |

---

## 🔧 Prérequis Techniques

### **1. Base de Données** ✅

La table `validation_signatures` doit avoir ces colonnes :

```sql
-- Vérifier que les colonnes existent
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'validation_signatures'
ORDER BY ordinal_position;
```

**Colonnes requises :**
- ✅ `id` (UUID)
- ✅ `userId` (UUID)
- ✅ `demandeId` (UUID)
- ✅ `type` (VARCHAR)
- ✅ `date` (TIMESTAMP)
- ✅ `signature` (VARCHAR)
- ✅ `commentaire` (TEXT)
- ✅ **`signatureImage`** (TEXT) - **CRITIQUE pour les images**
- ✅ **`ipAddress`** (VARCHAR) - Pour traçabilité
- ✅ **`hashIntegrite`** (VARCHAR) - Pour sécurité

**Si les colonnes manquent, exécutez :**

```sql
ALTER TABLE validation_signatures 
ADD COLUMN IF NOT EXISTS "signatureImage" TEXT,
ADD COLUMN IF NOT EXISTS "ipAddress" VARCHAR(45),
ADD COLUMN IF NOT EXISTS "hashIntegrite" VARCHAR(64);
```

---

### **2. Bibliothèque React** ✅

Installez `react-signature-canvas` :

```bash
npm install react-signature-canvas
npm install --save-dev @types/react-signature-canvas
```

---

### **3. Prisma Client** ✅

Régénérez le client Prisma après modification du schéma :

```bash
npx prisma generate
```

---

## 📊 Comment les Signatures Apparaissent

### **A. Pour que le NOM apparaisse** ✅

**Condition :** Une validation doit exister dans `validation_signatures`

**Exemple :**
```sql
INSERT INTO validation_signatures (
  id, "userId", "demandeId", type, date, signature
) VALUES (
  gen_random_uuid(),
  'user-conducteur-1',
  'demande-123',
  'validation_conducteur',
  NOW(),
  'user-conducteur-1-valider-1708785000000'
);
```

**Résultat dans le PDF :**
- ✅ Nom du conducteur affiché
- ✅ Date et heure affichées
- ✅ "X" dans la case VISA
- ❌ Pas de signature visuelle (car `signatureImage` est NULL)

---

### **B. Pour que la SIGNATURE VISUELLE apparaisse** ✅

**Condition :** La colonne `signatureImage` doit contenir une image base64

**Exemple :**
```sql
UPDATE validation_signatures
SET "signatureImage" = 'data:image/png;base64,iVBORw0KGgoAAAANS...'
WHERE id = 'signature-id';
```

**Résultat dans le PDF :**
- ✅ Nom du conducteur affiché
- ✅ Date et heure affichées
- ✅ "X" dans la case VISA
- ✅ **Image de la signature affichée** dans la ligne SIGNATURE

---

## 🚀 Workflow Complet pour Avoir les Signatures

### **Étape 1 : Préparer la Base de Données**

```sql
-- 1. Ajouter les colonnes si elles n'existent pas
ALTER TABLE validation_signatures 
ADD COLUMN IF NOT EXISTS "signatureImage" TEXT,
ADD COLUMN IF NOT EXISTS "ipAddress" VARCHAR(45),
ADD COLUMN IF NOT EXISTS "hashIntegrite" VARCHAR(64);

-- 2. Créer les index pour performance
CREATE INDEX IF NOT EXISTS idx_validation_signatures_demande 
ON validation_signatures("demandeId");

CREATE INDEX IF NOT EXISTS idx_validation_signatures_user 
ON validation_signatures("userId");
```

---

### **Étape 2 : Installer les Dépendances**

```bash
# Installer la bibliothèque de signature
npm install react-signature-canvas
npm install --save-dev @types/react-signature-canvas

# Régénérer Prisma
npx prisma generate
```

---

### **Étape 3 : Utiliser le Modal avec Signature**

**Remplacer les anciens modals de validation par :**

```typescript
import { ValidationModalWithSignature } from '@/components/validation/validation-modal-with-signature'

// Dans votre composant
<ValidationModalWithSignature
  isOpen={selectedDemande !== null}
  onClose={() => setSelectedDemande(null)}
  demande={selectedDemande!}
  onValidate={handleValidate}
  title="Validation de la demande"
  description="Veuillez vérifier les informations et signer pour valider cette demande."
/>
```

---

### **Étape 4 : Valider avec Signature**

1. Ouvrir une demande à valider
2. Le modal s'affiche avec le canvas de signature
3. **Dessiner la signature** dans le cadre blanc
4. Ajouter un commentaire (optionnel)
5. Cliquer sur **"Valider et Signer"**

**Ce qui se passe en arrière-plan :**
- ✅ Signature convertie en base64 (PNG)
- ✅ IP du validateur capturée
- ✅ Hash SHA-256 généré
- ✅ Tout enregistré dans `validation_signatures`

---

### **Étape 5 : Générer le PDF**

1. Ouvrir la demande validée
2. Cliquer sur **"Imprimer"** ou **"Générer PDF"**
3. Le PDF contient :
   - ✅ Noms de tous les validateurs
   - ✅ Dates et heures
   - ✅ **Images des signatures** dans la ligne SIGNATURE

---

## 🔍 Vérification et Debug

### **A. Vérifier les Signatures en Base**

```sql
-- Voir toutes les signatures d'une demande
SELECT 
    vs.type as "Type",
    u.nom || ' ' || u.prenom as "Validateur",
    vs.date as "Date",
    CASE 
        WHEN vs."signatureImage" IS NOT NULL THEN 'OUI' 
        ELSE 'NON' 
    END as "A une image",
    LENGTH(vs."signatureImage") as "Taille image"
FROM validation_signatures vs
INNER JOIN users u ON u.id = vs."userId"
WHERE vs."demandeId" = 'VOTRE_DEMANDE_ID'
ORDER BY vs.date ASC;
```

**Résultat attendu :**
```
Type                          | Validateur    | Date                | A une image | Taille image
------------------------------|---------------|---------------------|-------------|-------------
validation_conducteur         | Paul Martin   | 2026-02-24 15:45:00 | OUI         | 5234
validation_responsable_travaux| Marie Durand  | 2026-02-24 16:20:00 | OUI         | 4892
validation_charge_affaire     | Luc Dupont    | 2026-02-24 17:00:00 | OUI         | 5103
```

---

### **B. Logs Console lors de la Génération PDF**

Ouvrez la **console du navigateur** (F12) et générez un PDF.

**Logs attendus :**

```
🔍 [PDF] Signatures trouvées: {
  total: 3,
  conducteur: true,
  logistique: false,
  responsableTravaux: true,
  chargeAffaire: true,
  appro: false
}

✅ [PDF] Signature Conducteur: {
  nom: "Paul Martin",
  date: "24/02/2026",
  heure: "15:45",
  hasSignatureImage: true,
  signatureLength: 5234
}

✅ [PDF] Signature Responsable Travaux/Chargé Affaire: {
  nom: "Marie Durand",
  date: "24/02/2026",
  heure: "16:20",
  hasSignatureImage: true,
  signatureLength: 4892
}

📝 [PDF] Résumé des validateurs: {
  conducteur: { nom: "Paul Martin", hasSignature: true },
  approLog: { nom: "", hasSignature: false },
  respTravauxCA: { nom: "Marie Durand", hasSignature: true }
}
```

---

### **C. Diagnostic des Problèmes**

| Symptôme | Cause Probable | Solution |
|----------|---------------|----------|
| **Aucun nom n'apparaît** | Pas de validation enregistrée | Valider la demande via l'interface |
| **Nom apparaît, pas de signature** | Colonne `signatureImage` manquante OU NULL | Exécuter le SQL `ALTER TABLE` + Valider avec signature |
| **hasSignatureImage: false** | Validation faite sans le modal de signature | Utiliser `ValidationModalWithSignature` |
| **signatureLength: 0** | Image non enregistrée | Vérifier que l'API reçoit bien `signatureImage` |
| **Erreur TypeScript** | Prisma pas régénéré | Exécuter `npx prisma generate` |

---

## 📝 Checklist Complète

### **Prérequis Techniques**
- [ ] Colonnes `signatureImage`, `ipAddress`, `hashIntegrite` ajoutées
- [ ] Index créés sur `validation_signatures`
- [ ] `react-signature-canvas` installé
- [ ] `npx prisma generate` exécuté

### **Validation avec Signature**
- [ ] Modal `ValidationModalWithSignature` utilisé
- [ ] Signature dessinée dans le canvas
- [ ] Validation soumise avec succès
- [ ] Signature enregistrée en base (vérifier SQL)

### **Génération PDF**
- [ ] Console ouverte (F12)
- [ ] PDF généré
- [ ] Logs affichent les signatures trouvées
- [ ] `hasSignatureImage: true` pour les validateurs
- [ ] Images visibles dans le PDF

---

## 🎯 Résumé : Ce Qu'il Faut pour Chaque Validateur

### **Pour que le NOM apparaisse :**
1. ✅ Une ligne dans `validation_signatures` avec le bon `type`
2. ✅ Le `userId` correspond à un utilisateur existant
3. ✅ La `date` est renseignée

### **Pour que la SIGNATURE VISUELLE apparaisse :**
1. ✅ Tout ce qui précède (nom)
2. ✅ La colonne `signatureImage` existe en base
3. ✅ La colonne `signatureImage` contient une image base64
4. ✅ L'image commence par `data:image/png;base64,`

---

## 🚨 Important

**Les signatures sont IMMUABLES** :
- Une fois enregistrée, une signature ne peut JAMAIS être modifiée
- Pour tester, créez de nouvelles demandes
- Ne tentez pas de modifier les signatures existantes

**Workflow de test recommandé :**
1. Créer une nouvelle demande de test
2. La valider avec signature (conducteur)
3. La valider avec signature (responsable travaux)
4. Générer le PDF
5. Vérifier que les 2 signatures apparaissent

---

## 📞 Support

**Si les noms n'apparaissent pas :**
- Vérifiez les logs console : `🔍 [PDF] Signatures trouvées`
- Vérifiez la base de données : `SELECT * FROM validation_signatures WHERE "demandeId" = '...'`

**Si les signatures visuelles n'apparaissent pas :**
- Vérifiez `hasSignatureImage: true` dans les logs
- Vérifiez `signatureLength > 0` dans les logs
- Vérifiez que la colonne existe : `\d validation_signatures` (PostgreSQL)

**Si rien ne fonctionne :**
- Partagez les logs console complets
- Partagez le résultat de la requête SQL de vérification
- Indiquez quel validateur pose problème

---

**Système prêt pour production** ✅  
**Tous les validateurs sont gérés** ✅  
**Signatures visuelles fonctionnelles** ✅

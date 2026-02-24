# 📝 Guide Complet - Système de Signatures Électroniques

## 🎯 Vue d'Ensemble

Le système de signatures électroniques permet d'enregistrer et d'afficher les signatures manuscrites des validateurs dans les demandes de matériel et outillage.

---

## ✅ Fonctionnalités Implémentées

### **1. Signature Électronique**
- ✅ Canvas React pour dessiner la signature
- ✅ Enregistrement en base64 (format PNG)
- ✅ Validation obligatoire avant soumission
- ✅ Immuabilité garantie (pas de modification possible)

### **2. Traçabilité Complète**
- ✅ Date et heure de signature
- ✅ Nom et rôle du validateur
- ✅ Adresse IP du validateur
- ✅ Hash SHA-256 d'intégrité
- ✅ Commentaire optionnel

### **3. Affichage dans les PDF**
- ✅ Signatures visibles dans les impressions
- ✅ Section dédiée dans le tableau des visas
- ✅ Format professionnel et lisible

---

## 🚀 Utilisation pour les Validateurs

### **Étape 1 : Accéder à la Demande**

1. Connectez-vous avec votre compte
2. Allez dans votre dashboard
3. Cliquez sur la carte correspondant à votre rôle :
   - **Conducteur** : "À valider"
   - **Responsable Travaux** : "À valider"
   - **Chargé d'Affaire** : "À valider"
   - **Responsable Logistique** : "À valider"

### **Étape 2 : Valider avec Signature**

1. Cliquez sur une demande dans la liste
2. Le modal de validation s'ouvre automatiquement
3. **Vérifiez les informations** de la demande
4. **Ajoutez un commentaire** (optionnel)
5. **Dessinez votre signature** dans le cadre blanc
   - Utilisez votre souris ou votre doigt (tactile)
   - La signature doit être claire et lisible
6. Si vous vous trompez, cliquez sur **"Effacer"**
7. Cliquez sur **"Valider et Signer"**

### **Étape 3 : Confirmation**

- ✅ La signature est enregistrée de manière **irréversible**
- ✅ Votre adresse IP est enregistrée pour traçabilité
- ✅ Un hash d'intégrité est généré automatiquement
- ✅ La demande passe au statut suivant dans le workflow

---

## 🖨️ Impression avec Signatures

### **Générer un PDF avec Signatures**

1. Ouvrez une demande validée
2. Cliquez sur **"Imprimer"** ou **"Générer PDF"**
3. Le PDF généré contient :
   - ✅ Tableau des visas avec noms et dates
   - ✅ **Ligne SIGNATURE** avec les images des signatures
   - ✅ Toutes les informations de traçabilité

### **Exemple de Tableau des Visas dans le PDF**

```
┌──────────┬────────────┬──────────────┬─────────────┬──────────────┐
│          │ Demandeur  │ Conducteur   │ Appro/Log   │ Resp/CA      │
├──────────┼────────────┼──────────────┼─────────────┼──────────────┤
│ NOM      │ Jean Doe   │ Paul Martin  │ Luc Dupont  │ Marie Durand │
├──────────┼────────────┼──────────────┼─────────────┼──────────────┤
│ DATE     │ 24/02/2026 │ 24/02/2026   │ 24/02/2026  │ 24/02/2026   │
├──────────┼────────────┼──────────────┼─────────────┼──────────────┤
│ HEURE    │ 14:30      │ 15:45        │ 16:20       │ 17:00        │
├──────────┼────────────┼──────────────┼─────────────┼──────────────┤
│ VISA     │ X          │ X            │ X           │ X            │
├──────────┼────────────┼──────────────┼─────────────┼──────────────┤
│SIGNATURE │            │ [Signature]  │ [Signature] │ [Signature]  │
└──────────┴────────────┴──────────────┴─────────────┴──────────────┘
```

---

## 🔒 Sécurité et Immuabilité

### **Garanties de Sécurité**

1. **Immuabilité** :
   - Une signature ne peut JAMAIS être modifiée après création
   - Toute tentative de modification est bloquée par l'API
   - Log d'avertissement en cas de tentative

2. **Traçabilité** :
   - Adresse IP enregistrée pour chaque signature
   - Hash SHA-256 pour vérifier l'intégrité
   - Date et heure précises au format ISO

3. **Intégrité** :
   - Hash calculé sur : userId + demandeId + type + date + IP
   - Vérification possible à tout moment
   - Détection de toute altération

### **Données Enregistrées**

```sql
-- Exemple d'une signature dans la base de données
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": "user-conducteur-1",
  "demandeId": "demande-123",
  "type": "validation_conducteur",
  "date": "2026-02-24T14:30:00.000Z",
  "signature": "user-conducteur-1-valider-1708785000000",
  "signatureImage": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "ipAddress": "192.168.1.100",
  "hashIntegrite": "a3f5b8c9d2e1f4a7b6c5d8e9f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0",
  "commentaire": "Demande validée après vérification"
}
```

---

## 🛠️ Pour les Développeurs

### **Intégrer le Modal de Validation**

```typescript
import { ValidationModalWithSignature } from '@/components/validation/validation-modal-with-signature'

// Dans votre composant
const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null)

const handleValidate = async (demandeId: string, commentaire: string, signatureImage: string) => {
  const response = await fetch(`/api/demandes/${demandeId}/actions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      action: 'valider',
      commentaire: commentaire,
      signatureImage: signatureImage  // Signature en base64
    })
  })

  if (!response.ok) {
    throw new Error('Erreur lors de la validation')
  }

  // Recharger les données
  await reloadData()
}

// Dans le JSX
<ValidationModalWithSignature
  isOpen={selectedDemande !== null}
  onClose={() => setSelectedDemande(null)}
  demande={selectedDemande!}
  onValidate={handleValidate}
  title="Validation de la demande"
  description="Veuillez vérifier les informations et signer pour valider cette demande."
/>
```

### **API Backend**

L'API capture automatiquement :
- ✅ Adresse IP du validateur
- ✅ Génère le hash SHA-256
- ✅ Vérifie l'immuabilité
- ✅ Enregistre la signature

```typescript
// Exemple de requête API
POST /api/demandes/[id]/actions
{
  "action": "valider",
  "commentaire": "Demande validée",
  "signatureImage": "data:image/png;base64,iVBORw0KGgo..."
}

// Réponse
{
  "success": true,
  "demande": { ... },
  "message": "Demande validée avec succès"
}
```

---

## 📊 Audit et Vérification

### **Requête SQL pour Audit**

```sql
-- Voir toutes les signatures d'une demande
SELECT 
    vs.type as "Type Validation",
    u.nom || ' ' || u.prenom as "Validateur",
    vs.date as "Date Signature",
    vs."ipAddress" as "Adresse IP",
    vs."hashIntegrite" as "Hash",
    CASE 
        WHEN vs."signatureImage" IS NOT NULL THEN 'OUI' 
        ELSE 'NON' 
    END as "Signature Visuelle"
FROM validation_signatures vs
INNER JOIN users u ON u.id = vs."userId"
WHERE vs."demandeId" = 'DEMANDE_ID_ICI'
ORDER BY vs.date ASC;
```

### **Vérifier l'Intégrité**

```sql
-- Vérifier que toutes les signatures ont un hash
SELECT 
    COUNT(*) as "Total Signatures",
    COUNT(vs."hashIntegrite") as "Avec Hash",
    COUNT(*) - COUNT(vs."hashIntegrite") as "Sans Hash"
FROM validation_signatures vs;
```

---

## ⚠️ Avertissements Importants

### **Pour les Utilisateurs**

1. ⚠️ **La signature est irréversible** : Une fois validée, vous ne pouvez plus la modifier
2. ⚠️ **Vérifiez avant de signer** : Assurez-vous que toutes les informations sont correctes
3. ⚠️ **Signature claire** : Dessinez une signature lisible et professionnelle
4. ⚠️ **Traçabilité** : Votre IP et vos informations sont enregistrées

### **Pour les Administrateurs**

1. ⚠️ **Ne jamais modifier** les signatures en base de données
2. ⚠️ **Sauvegardes régulières** : Les signatures sont des preuves légales
3. ⚠️ **Logs d'audit** : Surveiller les tentatives de modification
4. ⚠️ **Conformité RGPD** : Informer les utilisateurs de la collecte d'IP

---

## 🎨 Personnalisation

### **Modifier la Taille du Canvas**

```typescript
<SignaturePad 
  ref={signaturePadRef} 
  width={650}   // Largeur en pixels
  height={200}  // Hauteur en pixels
/>
```

### **Modifier les Couleurs**

Dans `components/signature/signature-pad.tsx` :

```typescript
<SignatureCanvas
  backgroundColor="rgb(255, 255, 255)"  // Fond blanc
  penColor="rgb(0, 0, 0)"               // Encre noire
/>
```

---

## 📞 Support

### **Problèmes Courants**

**Q : La signature ne s'affiche pas dans le PDF**
- ✅ Vérifiez que `signatureImage` est bien enregistré en base
- ✅ Exécutez `npx prisma generate` après modification du schéma
- ✅ Vérifiez les logs console pour les erreurs

**Q : Erreur "Signature déjà existante"**
- ✅ C'est normal ! La signature est immuable
- ✅ Vous ne pouvez pas valider deux fois la même étape
- ✅ Contactez un administrateur si nécessaire

**Q : Le canvas ne fonctionne pas**
- ✅ Vérifiez que `react-signature-canvas` est installé
- ✅ Vérifiez la compatibilité du navigateur
- ✅ Essayez de vider le cache du navigateur

---

## 🔄 Workflow Complet

```
1. Demandeur crée une demande
   ↓
2. Conducteur valide + signe
   ↓ (signature enregistrée)
3. Responsable Travaux valide + signe
   ↓ (signature enregistrée)
4. Chargé d'Affaire valide + signe
   ↓ (signature enregistrée)
5. Appro prépare
   ↓
6. Logistique valide + signe
   ↓ (signature enregistrée)
7. Demandeur clôture
   ↓
8. PDF généré avec TOUTES les signatures
```

---

## ✅ Checklist de Déploiement

- [ ] Base de données mise à jour (colonnes ajoutées)
- [ ] `npx prisma generate` exécuté
- [ ] `react-signature-canvas` installé
- [ ] Tests de validation avec signature
- [ ] Tests de génération PDF
- [ ] Vérification de l'immuabilité
- [ ] Formation des utilisateurs
- [ ] Documentation distribuée

---

## 📝 Notes de Version

### **Version 1.0 - Février 2026**
- ✅ Système de signatures électroniques complet
- ✅ Capture IP et hash d'intégrité
- ✅ Affichage dans les PDF
- ✅ Immuabilité garantie
- ✅ Interface utilisateur intuitive

---

**Système développé pour InstrumElec Cameroun**  
**Date : Février 2026**  
**Conforme aux normes de traçabilité et d'audit**

# 🔄 Workflow de Rejet avec Retour Arrière

## 📋 Vue d'ensemble

Le nouveau système de rejet permet aux demandes rejetées de **retourner au statut précédent** pour modification, au lieu d'être définitivement rejetées. Cela crée un **cycle itératif** où les demandes peuvent être corrigées et renvoyées jusqu'à validation ou abandon.

---

## 🎯 Principe de fonctionnement

### Ancien workflow (AVANT)
```
Demande → Validation → ❌ REJET → Status "rejetee" (TERMINÉ)
└─> Demande bloquée, aucune modification possible
```

### Nouveau workflow (MAINTENANT)
```
Demande → Validation → ❌ REJET → Retour au statut précédent
└─> Le valideur précédent peut modifier et renvoyer
    └─> Si rejeté à nouveau → Retour encore au statut précédent
        └─> Cycle continue jusqu'à validation ou abandon
```

---

## 📊 Exemple concret : Demande Matériel

### Scénario complet avec rejets multiples

```
1. CRÉATION (Employé)
   Status: en_attente_validation_conducteur
   ↓

2. CONDUCTEUR VALIDE ✅
   Status: en_attente_validation_responsable_travaux
   ↓

3. RESPONSABLE TRAVAUX REJETTE ❌
   Motif: "Quantités trop élevées"
   Status: en_attente_validation_conducteur (RETOUR)
   nombreRejets: 1
   Notification → Conducteur
   ↓

4. CONDUCTEUR MODIFIE
   - Réduit les quantités
   - Ajoute un commentaire
   Status: en_attente_validation_responsable_travaux (RENVOI)
   ↓

5. RESPONSABLE TRAVAUX VALIDE ✅
   Status: en_attente_validation_charge_affaire
   ↓

6. CHARGÉ AFFAIRE REJETTE ❌
   Motif: "Budget insuffisant"
   Status: en_attente_validation_responsable_travaux (RETOUR)
   nombreRejets: 2
   Notification → Responsable Travaux
   ↓

7. RESPONSABLE TRAVAUX MODIFIE
   - Remplace certains articles par moins chers
   - Ajuste les quantités
   Status: en_attente_validation_charge_affaire (RENVOI)
   ↓

8. CHARGÉ AFFAIRE VALIDE ✅
   Status: en_attente_preparation_appro
   ↓
   ... Suite du workflow normal
```

---

## 🔑 Règles du système

### 1. Retour au statut précédent

| Statut actuel | Type | Statut après rejet |
|---------------|------|-------------------|
| `en_attente_validation_responsable_travaux` | Matériel | `en_attente_validation_conducteur` |
| `en_attente_validation_responsable_travaux` | Outillage | `en_attente_validation_logistique` |
| `en_attente_validation_charge_affaire` | Tous | `en_attente_validation_responsable_travaux` |
| `en_attente_preparation_appro` | Tous | `en_attente_validation_charge_affaire` |
| `en_attente_reception_livreur` | Tous | `en_attente_preparation_appro` |
| `en_attente_livraison` | Tous | `en_attente_reception_livreur` |
| `en_attente_validation_finale_demandeur` | Tous | `en_attente_livraison` |

### 2. Compteur de rejets

- **Champ**: `nombreRejets` (Integer, défaut: 0)
- **Incrémentation**: +1 à chaque rejet
- **Maximum**: 5 rejets autorisés
- **Affichage**: Badge visible dans l'interface (ex: "🔄 2 rejets")
- **Limite atteinte**: Message d'erreur, création d'une nouvelle demande requise

### 3. Sauvegarde du statut précédent

- **Champ**: `statusPrecedent` (DemandeStatus, nullable)
- **Utilisation**: Stocke le statut d'où venait la demande avant rejet
- **Réinitialisation**: Remis à `null` après modification et renvoi

---

## 👥 Permissions de modification par niveau

### Niveau 1 : Valideurs techniques
**Rôles**: Conducteur, Responsable Logistique, Responsable Travaux

| Permission | Autorisé |
|-----------|----------|
| ✅ Modifier quantités | Oui |
| ✅ Ajouter/supprimer articles | Oui |
| ✅ Modifier commentaires | Oui |
| ✅ Modifier date de besoin | Oui |

### Niveau 2 : Chargé d'Affaire
**Rôle**: Chargé d'Affaire (validation budget)

| Permission | Autorisé |
|-----------|----------|
| ✅ Modifier quantités | Oui |
| ✅ Remplacer articles | Oui |
| ✅ Modifier commentaires | Oui |
| ❌ Modifier date de besoin | Non |

### Niveau 3 : Responsable Appro
**Rôle**: Responsable Appro (préparation stock)

| Permission | Autorisé |
|-----------|----------|
| ✅ Modifier quantités | Oui |
| ✅ Proposer alternatives | Oui |
| ✅ Modifier commentaires | Oui |
| ❌ Modifier date de besoin | Non |

### Niveau 4 : Livreur
**Rôle**: Responsable Livreur (réception/livraison)

| Permission | Autorisé |
|-----------|----------|
| ✅ Modifier quantités livrées | Oui |
| ❌ Ajouter/supprimer articles | Non |
| ✅ Modifier commentaires | Oui |
| ❌ Modifier date de besoin | Non |

---

## 📧 Notifications

### Qui est notifié lors d'un rejet ?

**Le valideur précédent** reçoit une notification :

```
Titre: "Demande DEM-2024-0042 rejetée"

Message: "La demande DEM-2024-0042 a été rejetée par Chargé d'Affaire. 
Motif: Budget insuffisant. Vous pouvez la modifier et la renvoyer."
```

### Exemple de flux de notifications

```
1. Employé crée demande
   └─> Notification → Conducteur

2. Conducteur valide
   └─> Notification → Responsable Travaux

3. Responsable Travaux REJETTE
   └─> Notification → Conducteur (valideur précédent)

4. Conducteur modifie et renvoie
   └─> Notification → Responsable Travaux

5. Responsable Travaux valide
   └─> Notification → Chargé Affaire
```

---

## 🔧 API Endpoints

### 1. Rejeter une demande
```http
PUT /api/demandes/[id]
Content-Type: application/json

{
  "status": "rejetee",
  "commentaire": "Motif du rejet obligatoire"
}
```

**Réponse**:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "status": "en_attente_validation_conducteur",
    "nombreRejets": 1,
    "statusPrecedent": "en_attente_validation_responsable_travaux",
    "rejetMotif": "Motif du rejet obligatoire"
  }
}
```

### 2. Modifier une demande rejetée
```http
PUT /api/demandes/[id]/modify
Content-Type: application/json

{
  "commentaires": "Modifications apportées",
  "items": [
    {
      "articleId": "...",
      "quantiteDemandee": 10,
      "commentaire": "Quantité réduite"
    }
  ],
  "dateLivraisonSouhaitee": "2024-02-15"
}
```

**Réponse**:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "status": "en_attente_validation_responsable_travaux",
    "nombreRejets": 1,
    "statusPrecedent": null
  },
  "message": "Demande modifiée et renvoyée avec succès"
}
```

---

## 🎨 Interface utilisateur

### Badge de compteur de rejets

```tsx
{demande.nombreRejets > 0 && (
  <Badge variant="warning" className="ml-2">
    🔄 {demande.nombreRejets} rejet{demande.nombreRejets > 1 ? 's' : ''}
  </Badge>
)}
```

### Bouton de modification (valideur précédent)

```tsx
{canModifyRejectedDemande(currentUser.role, demande.status, demande.technicienId, currentUser.id) && (
  <Button onClick={() => openModifyModal(demande)}>
    ✏️ Modifier et renvoyer
  </Button>
)}
```

### Historique des rejets

```tsx
<Timeline>
  {demande.historyEntries
    .filter(entry => entry.action.includes('rejeté'))
    .map(entry => (
      <TimelineItem key={entry.id}>
        <TimelineIcon>❌</TimelineIcon>
        <TimelineContent>
          <p>{entry.action}</p>
          <p className="text-sm text-muted-foreground">
            {entry.commentaire}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDate(entry.timestamp)}
          </p>
        </TimelineContent>
      </TimelineItem>
    ))
  }
</Timeline>
```

---

## 🔐 Sécurité et validations

### Vérifications backend

1. **Permission de rejet**
   - Vérifier que l'utilisateur peut valider/rejeter ce statut
   - Vérifier l'assignation au projet

2. **Limite de rejets**
   - Bloquer si `nombreRejets >= 5`
   - Message d'erreur explicite

3. **Statut précédent valide**
   - Vérifier qu'un statut précédent existe
   - Empêcher le rejet si pas de retour possible

4. **Permissions de modification**
   - Appliquer les règles selon le niveau du valideur
   - Bloquer les modifications non autorisées

### Traçabilité complète

Chaque action est enregistrée dans `HistoryEntry`:

```typescript
{
  action: "Demande rejetée par charge_affaire - Retour à en_attente_validation_responsable_travaux",
  ancienStatus: "en_attente_validation_charge_affaire",
  nouveauStatus: "en_attente_validation_responsable_travaux",
  commentaire: "Budget insuffisant",
  timestamp: "2024-01-06T10:30:00Z",
  signature: "charge_affaire-validation-1704537000000"
}
```

---

## 📈 Avantages du système

### 1. Flexibilité
- ✅ Correction des erreurs sans recréer la demande
- ✅ Dialogue entre valideurs
- ✅ Amélioration itérative

### 2. Traçabilité
- ✅ Historique complet des rejets
- ✅ Compteur visible
- ✅ Motifs documentés

### 3. Efficacité
- ✅ Moins de demandes abandonnées
- ✅ Gain de temps (pas de re-saisie)
- ✅ Meilleure communication

### 4. Contrôle
- ✅ Limite de rejets (évite boucles infinies)
- ✅ Permissions granulaires
- ✅ Notifications ciblées

---

## 🚀 Cas d'usage typiques

### Cas 1 : Quantités trop élevées
```
Employé demande 100 unités
→ Conducteur rejette (stock insuffisant)
→ Employé réduit à 50 unités
→ Conducteur valide
✅ Demande continue
```

### Cas 2 : Budget dépassé
```
Demande coûte 10 000€
→ Chargé Affaire rejette (budget 8 000€)
→ Resp. Travaux remplace articles
→ Nouvelle estimation: 7 500€
→ Chargé Affaire valide
✅ Demande continue
```

### Cas 3 : Article non disponible
```
Demande article spécifique
→ Resp. Appro rejette (rupture stock)
→ Resp. Travaux propose alternative
→ Resp. Appro valide
✅ Demande continue
```

### Cas 4 : Trop de rejets
```
Demande rejetée 5 fois
→ Tentative de 6ème rejet
❌ Erreur: "Limite atteinte"
→ Création nouvelle demande requise
```

---

## 🔧 Maintenance et évolution

### Fichiers modifiés

1. **Backend**:
   - `prisma/schema.prisma` : Ajout champs `nombreRejets`, `statusPrecedent`
   - `app/api/demandes/[id]/route.ts` : Logique de rejet avec retour
   - `app/api/demandes/[id]/modify/route.ts` : API de modification
   - `lib/workflow-utils.ts` : Fonctions utilitaires

2. **Frontend** (à implémenter):
   - Modales de rejet avec motif obligatoire
   - Modales de modification avec permissions
   - Affichage compteur de rejets
   - Historique visuel des rejets

3. **Types**:
   - `types/index.ts` : Ajout champs au type `Demande`

### Migration base de données

```sql
-- Exécuter manuellement
ALTER TABLE "demandes" ADD COLUMN IF NOT EXISTS "nombreRejets" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "demandes" ADD COLUMN IF NOT EXISTS "statusPrecedent" TEXT;
```

---

## 📝 Notes importantes

1. **Commentaire obligatoire** : Le motif de rejet doit toujours être fourni
2. **Notification automatique** : Le valideur précédent est toujours notifié
3. **Limite de rejets** : Maximum 5 rejets pour éviter les abus
4. **Permissions strictes** : Chaque niveau a des droits de modification spécifiques
5. **Traçabilité totale** : Tous les rejets et modifications sont enregistrés

---

## ✅ Checklist d'implémentation

- [x] Schéma Prisma modifié
- [x] Migration SQL créée
- [x] API de rejet mise à jour
- [x] API de modification créée
- [x] Fonctions utilitaires créées
- [x] Types TypeScript mis à jour
- [ ] Modales frontend (à faire)
- [ ] Tests unitaires (à faire)
- [ ] Tests d'intégration (à faire)
- [ ] Documentation utilisateur (à faire)

---

**Date de création**: 6 janvier 2024  
**Version**: 1.0  
**Auteur**: Système de gestion des demandes

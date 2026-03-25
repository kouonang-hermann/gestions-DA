# 📊 STATUTS COMPLETS DE L'APPLICATION

## 🎯 **STATUTS DES DEMANDES**

### **📝 PHASE DE CRÉATION**
| Statut Technique | Libellé Utilisateur | Couleur | Description |
|----------------|-------------------|-----------|-------------|
| `brouillon` | Brouillon | 🔘 Gris | Demande en cours de rédaction, non soumise |
| `soumise` | Soumise | 🔵 Bleu | Demande soumise et en attente de premier traitement |

---

### **🔄 PHASE DE VALIDATION**

#### **🚧 FLOW MATÉRIEL**
| Statut Technique | Libellé Utilisateur | Couleur | Validateur | Description |
|----------------|-------------------|-----------|-------------|-------------|
| `en_attente_validation_conducteur` | En attente conducteur | 🟡 Jaune | Conducteur Travaux | Validation technique de la demande |
| `en_attente_validation_responsable_travaux` | En attente responsable travaux | 🟡 Jaune Clair | Responsable Travaux | Validation hiérarchique des travaux |
| `en_attente_validation_charge_affaire` | En attente chargé affaire | 🔵 Bleu Foncé | Chargé d'Affaire | Validation budgétaire et commerciale |

#### **🔧 FLOW OUTILLAGE**
| Statut Technique | Libellé Utilisateur | Couleur | Validateur | Description |
|----------------|-------------------|-----------|-------------|-------------|
| `en_attente_validation_logistique` | En attente Logistique | 🟡 Jaune Foncé | Responsable QHSE/Logistique | Validation des besoins d'outillage |
| `en_attente_validation_responsable_travaux` | En attente responsable travaux | 🟡 Jaune Clair | Responsable Travaux | Validation hiérarchique des travaux |
| `en_attente_validation_charge_affaire` | En attente chargé affaire | 🔵 Bleu Foncé | Chargé d'Affaire | Validation budgétaire et commerciale |

---

### **📦 PHASE DE PRÉPARATION**

| Statut Technique | Libellé Utilisateur | Couleur | Acteur | Description |
|----------------|-------------------|-----------|----------|-------------|
| `en_attente_preparation_appro` | En attente préparation appro | 🟠 Orange | Approvisionnement | Préparation du matériel pour sortie |
| `en_attente_preparation_logistique` | À préparer (Logistique) | 🟣 Violet | Logistique | Préparation de l'outillage pour sortie |
| `en_attente_validation_logistique_finale` | Validation finale logistique | 🟠 Orange | Logistique | Validation finale avant expédition |

---

### **🚚 PHASE DE LIVRAISON**

| Statut Technique | Libellé Utilisateur | Couleur | Acteur | Description |
|----------------|-------------------|-----------|----------|-------------|
| `en_attente_reception_livreur` | En attente réception livreur | 🟦 Indigo Clair | Livreur | Prise en charge par le livreur |
| `en_attente_livraison` | En attente livraison | 🟦 Indigo | Livreur | En cours de livraison |
| `en_attente_validation_finale_demandeur` | En attente validation finale demandeur | 🟦 Indigo Foncé | Demandeur | Validation de réception par le demandeur |
| `en_attente_validation_reception_demandeur` | En attente validation réception | 🔵 Bleu | Demandeur | Validation de réception des articles |

---

### **✅ PHASE DE CLÔTURE**

| Statut Technique | Libellé Utilisateur | Couleur | Description |
|----------------|-------------------|-----------|-------------|
| `confirmee_demandeur` | Confirmée demandeur | 🟩 Vert Foncé | Réception validée par le demandeur |
| `cloturee` | Clôturée | 🟩 Vert | Demande terminée et archivée |
| `cloturee_partiellement` | Clôturée partiellement | 🟩 Vert Clair | Livraison partielle acceptée |

---

### **🔄 STATUTS SPÉCIAUX**

| Statut Technique | Libellé Utilisateur | Couleur | Description |
|----------------|-------------------|-----------|-------------|
| `renvoyee_vers_appro` | Renvoyée vers appro | 🟠 Orange Foncé | Demande retournée pour modification |
| `rejetee` | Rejetée | 🔴 Rouge | Demande refusée (motif obligatoire) |
| `archivee` | Archivée | 🔘 Gris Foncé | Demande archivée manuellement |

---

## 🚚 **STATUTS DES LIVRAISONS**

### **📦 Cycle de Vie**
| Statut Technique | Libellé Utilisateur | Description |
|----------------|-------------------|-------------|
| `en_preparation` | En préparation | Préparation de la livraison |
| `prete` | Prête à livrer | Livraison prête, en attente de prise en charge |
| `en_cours` | En cours de livraison | Livraison en cours d'acheminement |
| `livree` | Livrée | Livraison terminée avec succès |
| `annulee` | Annulée | Livraison annulée |

---

## 👥 **RÔLES UTILISATEURS**

| Rôle Technique | Libellé Utilisateur | Description |
|----------------|-------------------|-------------|
| `superadmin` | Super Administrateur | Accès complet à l'application |
| `employe` | Employé | Utilisateur standard, peut créer des demandes |
| `conducteur_travaux` | Conducteur Travaux | Valide les demandes de matériel |
| `responsable_travaux` | Responsable Travaux | Valide hiérarchiquement les demandes |
| `responsable_logistique` | Responsable Logistique | Gère la logistique et les livraisons |
| `responsable_appro` | Responsable Approvisionnement | Gère l'approvisionnement en matériel |
| `charge_affaire` | Chargé d'Affaire | Valide budgétairement les demandes |
| `responsable_livreur` | Responsable Livreur | Gère les livreurs et les livraisons |
| `responsable_rh` | Responsable RH | Gère les ressources humaines |
| `directeur_general` | Directeur Général | Direction générale de l'entreprise |

---

## 📋 **TYPES DE DEMANDES**

| Type Technique | Libellé Utilisateur | Description |
|----------------|-------------------|-------------|
| `materiel` | Matériel | Demande de matériel pour projets |
| `outillage` | Outillage | Demande d'outillage pour interventions |

---

## 🔄 **WORKFLOW COMPLET**

### **📦 MATÉRIEL**
```
Brouillon → Soumise → 
Validation Conducteur → 
Validation Resp. Travaux → 
Validation Chargé Affaire → 
Préparation Appro → 
Réception Livreur → 
Livraison → 
Validation Finale Demandeur → 
Confirmée → Clôturée
```

### **🔧 OUTILLAGE**
```
Brouillon → Soumise → 
Validation Logistique → 
Validation Resp. Travaux → 
Validation Chargé Affaire → 
Préparation Logistique → 
Réception Livreur → 
Livraison → 
Validation Finale Demandeur → 
Confirmée → Clôturée
```

---

## 🎨 **CODES COULEURS**

| Couleur | Code Tailwind | Usage |
|----------|---------------|--------|
| Gris | `bg-gray-500` | Brouillon, Archivé |
| Bleu | `bg-blue-500` | Soumis, Validation réception |
| Jaune | `bg-yellow-500` | Validation conducteur |
| Jaune Clair | `bg-yellow-400` | Validation resp. travaux |
| Jaune Foncé | `bg-yellow-600` | Validation logistique |
| Bleu Foncé | `bg-blue-600` | Validation chargé affaire |
| Orange | `bg-orange-400` | Préparation appro |
| Orange Foncé | `bg-orange-600` | Renvoyée vers appro |
| Violet | `bg-purple-500` | Préparation logistique |
| Indigo Clair | `bg-indigo-400` | Réception livreur |
| Indigo | `bg-indigo-500` | En attente livraison |
| Indigo Foncé | `bg-indigo-600` | Validation finale demandeur |
| Vert Clair | `bg-green-500` | Clôturée partiellement |
| Vert Foncé | `bg-green-700` | Confirmée demandeur |
| Vert | `bg-green-600` | Clôturée |
| Rouge | `bg-red-500` | Rejetée |

---

## 📊 **RÈGLES MÉTIER**

### **✅ EST CONSIDÉRÉ COMME LIVRÉ**
- `livraison.statut === "livree"`
- `demande.dateLivraison` renseignée
- `quantiteLivreeTotal >= quantiteValidee`

### **❌ EST CONSIDÉRÉ COMME NON LIVRÉ**
- `livraison.statut` ≠ "livree"
- `demande.dateLivraison` non renseignée
- `quantiteRestante > 0`

### **✅ EST CONSIDÉRÉ COMME VALORISÉ**
- `item.prixUnitaire !== null`

### **❌ EST CONSIDÉRÉ COMME NON VALORISÉ**
- `item.quantiteValidee !== null` (article validé)
- `quantiteRestante > 0` (quantités restantes)
- `item.prixUnitaire === null` (pas de prix)
- `status` avancé (après validation charge_affaire)

---

*Document généré automatiquement depuis le code source - Date: 24/03/2026*

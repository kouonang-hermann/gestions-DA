# 🧪 Scripts de Test - Flows de Validation

Ce dossier contient des scripts de test pour valider les nouveaux flows de validation matériel et outillage avec auto-skip intelligent.

## 📋 Prérequis

1. **Base de données initialisée** avec les données de test :
   ```bash
   npm run seed
   ```

2. **Serveur de développement** en cours d'exécution :
   ```bash
   npm run dev
   ```

## 🎯 Scripts Disponibles

### 1. Test Flow Matériel (`test-flow-materiel.ts`)

Teste le flow de validation matériel avec différents rôles de demandeurs.

**Exécution :**
```bash
npx tsx scripts/test-flow-materiel.ts
```

**Ce que le script fait :**
- Crée 4 demandes matériel avec différents demandeurs
- Vérifie que le statut initial correspond aux règles d'auto-skip
- Affiche un résumé des tests et les prochaines étapes

**Flows testés :**
| Demandeur | Statut Initial | Étapes Sautées |
|-----------|----------------|----------------|
| Employé | `en_attente_validation_conducteur` | Aucune |
| Conducteur | `en_attente_validation_responsable_travaux` | Conducteur |
| Resp. Travaux | `en_attente_validation_charge_affaire` | Conducteur + Resp. Travaux |
| Chargé Affaire | `en_attente_preparation_appro` | Conducteur + Resp. Travaux + Chargé Affaire |

### 2. Test Flow Outillage (`test-flow-outillage.ts`)

Teste le flow de validation outillage avec différents rôles de demandeurs.

**Exécution :**
```bash
npx tsx scripts/test-flow-outillage.ts
```

**Ce que le script fait :**
- Crée 4 demandes outillage avec différents demandeurs
- Vérifie que le statut initial correspond aux règles d'auto-skip
- Affiche un résumé des tests et les prochaines étapes

**Flows testés :**
| Demandeur | Statut Initial | Étapes Sautées |
|-----------|----------------|----------------|
| Employé | `en_attente_validation_logistique` | Aucune |
| Resp. Logistique | `en_attente_validation_logistique` | Aucune (2 interventions) |
| Resp. Travaux | `en_attente_validation_logistique` | Aucune |
| Chargé Affaire | `en_attente_validation_logistique` | Resp. Travaux |

## 👥 Comptes Utilisateurs Test

Tous les utilisateurs test sont assignés au projet **"Projet de Construction Alpha"** (`projet-test-1`).

| Email | Mot de passe | Rôle |
|-------|--------------|------|
| `employe@test.com` | `employe123` | Employé |
| `conducteur@test.com` | `conducteur123` | Conducteur des Travaux |
| `responsable-travaux@test.com` | `responsable123` | Responsable des Travaux |
| `logistique@test.com` | `logistique123` | Responsable Logistique |
| `charge@test.com` | `charge123` | Chargé d'Affaire |
| `appro@test.com` | `appro123` | Responsable Appro |
| `livreur@test.com` | `livreur123` | Responsable Livreur |

## 🔍 Validation Manuelle des Flows

Après avoir exécuté les scripts, suivez ces étapes pour valider manuellement les flows :

### Flow Matériel

1. **Connectez-vous avec `conducteur@test.com`**
   - Vous devriez voir la demande créée par l'employé
   - Validez-la pour la faire passer au Resp. Travaux

2. **Connectez-vous avec `responsable-travaux@test.com`**
   - Vous devriez voir 2 demandes (employé + conducteur)
   - Validez-les pour les faire passer au Chargé Affaire

3. **Connectez-vous avec `charge@test.com`**
   - Vous devriez voir 3 demandes (employé + conducteur + resp. travaux)
   - Validez-les pour les faire passer à l'Appro

4. **Connectez-vous avec `appro@test.com`**
   - Vous devriez voir toutes les 4 demandes
   - Préparez les sorties pour les faire passer au Livreur

### Flow Outillage

1. **Connectez-vous avec `logistique@test.com`**
   - Vous devriez voir toutes les 4 demandes (1ère validation)
   - Validez-les pour les faire passer au Resp. Travaux

2. **Connectez-vous avec `responsable-travaux@test.com`**
   - Vous devriez voir 3 demandes (employé + logistique + resp. travaux)
   - Vous ne devriez PAS voir la demande du Chargé Affaire
   - Validez-les pour les faire passer au Chargé Affaire

3. **Connectez-vous avec `charge@test.com`**
   - Vous devriez voir toutes les 4 demandes
   - Validez-les pour les faire passer à la préparation logistique

4. **Connectez-vous avec `logistique@test.com`**
   - Vous devriez voir toutes les 4 demandes (2ème intervention - préparation)
   - Renseignez les prix si nécessaire
   - Préparez les sorties pour les faire passer au Livreur

## ✅ Points de Vérification

### Auto-Skip Matériel
- [ ] Conducteur ne voit pas sa propre demande à l'étape conducteur
- [ ] Resp. Travaux ne voit pas sa propre demande à l'étape resp. travaux
- [ ] Chargé Affaire ne voit pas sa propre demande à l'étape chargé affaire
- [ ] Toutes les demandes arrivent bien chez l'Appro

### Auto-Skip Outillage
- [ ] Resp. Logistique voit toutes les demandes à l'étape validation logistique
- [ ] Resp. Travaux ne voit PAS la demande du Chargé Affaire
- [ ] Resp. Logistique voit toutes les demandes à l'étape préparation logistique
- [ ] Le Resp. Logistique peut renseigner les prix lors de la préparation

### Filtrage par Projet
- [ ] Chaque valideur ne voit QUE les demandes du projet auquel il est assigné
- [ ] Les demandes sans projet assigné ne sont pas visibles
- [ ] Les super-admins voient toutes les demandes

## 🧹 Nettoyage

Pour supprimer les demandes de test créées :

```bash
# Supprimer toutes les demandes de test (commence par TEST-)
npx prisma studio
# Puis supprimer manuellement les demandes dans l'interface Prisma Studio
```

Ou via SQL :
```sql
DELETE FROM "ItemDemande" WHERE "demandeId" IN (
  SELECT id FROM "Demande" WHERE numero LIKE 'TEST-%'
);
DELETE FROM "Demande" WHERE numero LIKE 'TEST-%';
```

## 📊 Logs et Debugging

Les scripts affichent des logs détaillés :
- ✅ Succès des opérations
- 📋 Informations sur les demandes créées
- 🎯 Prochaines étapes à suivre
- 📊 Résumé des tests

Consultez la console pour suivre l'exécution des scripts.

## 🐛 Dépannage

### Erreur "Utilisateurs test non trouvés"
```bash
npm run seed
```

### Erreur "Projet test non trouvé"
```bash
npm run seed
```

### Erreur "Aucun article trouvé"
```bash
npm run seed
```

### Les demandes ne s'affichent pas dans les dashboards
1. Vérifiez que vous êtes connecté avec le bon compte
2. Vérifiez que l'utilisateur est assigné au projet-test-1
3. Actualisez la page (bouton "Actualiser" dans le dashboard)
4. Vérifiez les logs de la console du navigateur

## 📝 Notes

- Les scripts créent des demandes avec des numéros uniques basés sur le timestamp
- Les demandes sont créées directement dans la base de données (pas via l'API)
- Les statuts initiaux sont définis selon les règles d'auto-skip
- Tous les utilisateurs test sont assignés au même projet pour faciliter les tests

## 🎉 Résultat Attendu

Après avoir exécuté les scripts et validé manuellement les flows :
- Toutes les demandes matériel doivent passer par le flow complet
- Toutes les demandes outillage doivent passer par le flow complet
- Les étapes sont sautées correctement selon le rôle du demandeur
- Le Resp. Logistique intervient 2 fois dans le flow outillage
- Chaque valideur ne voit que les demandes de son étape

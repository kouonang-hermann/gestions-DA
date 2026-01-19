-- Script SQL pour faire passer une demande à son statut précédent
-- Basé sur la logique de workflow de l'application

-- ========================================
-- SCRIPT DE RETOUR ARRIÈRE DE DEMANDE
-- ========================================

-- ÉTAPE 1: Identifier la demande et son statut actuel
-- ========================================
-- Remplacer 'ID_DE_LA_DEMANDE' par l'ID réel de la demande
-- Exemple: '82f381d6-fbc3-4c28-9bc4-70ddc61b9389'

-- Vérifier la demande actuelle
SELECT 
    d.id,
    d.numero,
    d.type,
    d.status as statut_actuel,
    d.technicienId,
    d.projetId,
    t.nom as technicien_nom,
    p.nom as projet_nom
FROM "Demande" d
LEFT JOIN "User" t ON d.technicienId = t.id
LEFT JOIN "Projet" p ON d.projetId = p.id
WHERE d.id = 'ID_DE_LA_DEMANDE';

-- ========================================
-- ÉTAPE 2: Déterminer le statut précédent selon le type
-- ========================================

-- Pour une demande de MATÉRIEL
-- ========================================
-- Si statut actuel = en_attente_validation_responsable_travaux
-- → statut précédent = en_attente_validation_conducteur

-- Si statut actuel = en_attente_validation_charge_affaire
-- → statut précédent = en_attente_validation_responsable_travaux

-- Si statut actuel = en_attente_preparation_appro
-- → statut précédent = en_attente_validation_charge_affaire

-- Si statut actuel = en_attente_reception_livreur
-- → statut précédent = en_attente_preparation_appro

-- Si statut actuel = en_attente_livraison
-- → statut précédent = en_attente_reception_livreur

-- Si statut actuel = en_attente_validation_finale_demandeur
-- → statut précédent = en_attente_livraison

-- Pour une demande d'OUTILLAGE
-- ========================================
-- Si statut actuel = en_attente_validation_responsable_travaux
-- → statut précédent = en_attente_validation_logistique

-- Si statut actuel = en_attente_validation_charge_affaire
-- → statut précédent = en_attente_validation_responsable_travaux

-- Si statut actuel = en_attente_preparation_logistique
-- → statut précédent = en_attente_validation_charge_affaire

-- Si statut actuel = en_attente_reception_livreur
-- → statut précédent = en_attente_preparation_logistique

-- Si statut actuel = en_attente_livraison
-- → statut précédent = en_attente_reception_livreur

-- Si statut actuel = en_attente_validation_finale_demandeur
-- → statut précédent = en_attente_livraison

-- ========================================
-- ÉTAPE 3: Script de mise à jour (MATÉRIEL)
-- ========================================

-- Cas 1: Retour de "en_attente_validation_responsable_travaux" vers "en_attente_validation_conducteur"
UPDATE "Demande" 
SET 
    status = 'en_attente_validation_conducteur',
    dateModification = NOW(),
    "validationResponsableTravauxId" = NULL,
    "validationResponsableTravauxDate" = NULL
WHERE id = 'ID_DELA_DEMANDE' 
AND type = 'materiel' 
AND status = 'en_attente_validation_responsable_travaux';

-- Cas 2: Retour de "en_attente_validation_charge_affaire" vers "en_attente_validation_responsable_travaux"
UPDATE "Demande" 
SET 
    status = 'en_attente_validation_responsable_travaux',
    dateModification = NOW(),
    "validationChargeAffaireId" = NULL,
    "validationChargeAffaireDate" = NULL
WHERE id = 'ID_DELA_DEMANDE' 
AND type = 'materiel' 
AND status = 'en_attente_validation_charge_affaire';

-- Cas 3: Retour de "en_attente_preparation_appro" vers "en_attente_validation_charge_affaire"
UPDATE "Demande" 
SET 
    status = 'en_attente_validation_charge_affaire',
    dateModification = NOW(),
    "sortieApproId" = NULL,
    "sortieApproDate" = NULL,
    "livreurAssigneId" = NULL,
    dateSortie = NULL,
    coutTotal = NULL,
    dateEngagement = NULL
WHERE id = 'ID_DELA_DEMANDE' 
AND type = 'materiel' 
AND status = 'en_attente_preparation_appro';

-- Cas 4: Retour de "en_attente_reception_livreur" vers "en_attente_preparation_appro"
UPDATE "Demande" 
SET 
    status = 'en_attente_preparation_appro',
    dateModification = NOW(),
    "validationLogistiqueId" = NULL,
    "validationLogistiqueDate" = NULL
WHERE id = 'ID_DELA_DEMANDE' 
AND type = 'materiel' 
AND status = 'en_attente_reception_livreur';

-- Cas 5: Retour de "en_attente_livraison" vers "en_attente_reception_livreur"
UPDATE "Demande" 
SET 
    status = 'en_attente_reception_livreur',
    dateModification = NOW(),
    "validationLivreurId" = NULL,
    "validationLivreurDate" = NULL
WHERE id = 'ID_DELA_DEMANDE' 
AND type = 'materiel' 
AND status = 'en_attente_livraison';

-- Cas 6: Retour de "en_attente_validation_finale_demandeur" vers "en_attente_livraison"
UPDATE "Demande" 
SET 
    status = 'en_attente_livraison',
    dateModification = NOW(),
    "validationFinaleId" = NULL,
    "validationFinaleDate" = NULL,
    dateCloture = NULL
WHERE id = 'ID_DELA_DEMANDE' 
AND type = 'materiel' 
AND status = 'en_attente_validation_finale_demandeur';

-- ========================================
-- ÉTAPE 4: Script de mise à jour (OUTILLAGE)
-- ========================================

-- Cas 1: Retour de "en_attente_validation_responsable_travaux" vers "en_attente_validation_logistique"
UPDATE "Demande" 
SET 
    status = 'en_attente_validation_logistique',
    dateModification = NOW(),
    "validationResponsableTravauxId" = NULL,
    "validationResponsableTravauxDate" = NULL
WHERE id = 'ID_DELA_DEMANDE' 
AND type = 'outillage' 
AND status = 'en_attente_validation_responsable_travaux';

-- Cas 2: Retour de "en_attente_validation_charge_affaire" vers "en_attente_validation_responsable_travaux"
UPDATE "Demande" 
SET 
    status = 'en_attente_validation_responsable_travaux',
    dateModification = NOW(),
    "validationChargeAffaireId" = NULL,
    "validationChargeAffaireDate" = NULL
WHERE id = 'ID_DELA_DEMANDE' 
AND type = 'outillage' 
AND status = 'en_attente_validation_charge_affaire';

-- Cas 3: Retour de "en_attente_preparation_logistique" vers "en_attente_validation_charge_affaire"
UPDATE "Demande" 
SET 
    status = 'en_attente_validation_charge_affaire',
    dateModification = NOW(),
    "sortieApproId" = NULL,
    "sortieApproDate" = NULL,
    "livreurAssigneId" = NULL,
    dateSortie = NULL,
    coutTotal = NULL,
    dateEngagement = NULL
WHERE id = 'ID_DELA_DEMANDE' 
AND type = 'outillage' 
AND status = 'en_attente_preparation_logistique';

-- Cas 4: Retour de "en_attente_reception_livreur" vers "en_attente_preparation_logistique"
UPDATE "Demande" 
SET 
    status = 'en_attente_preparation_logistique',
    dateModification = NOW(),
    "validationLogistiqueId" = NULL,
    "validationLogistiqueDate" = NULL
WHERE id = 'ID_DELA_DEMANDE' 
AND type = 'outillage' 
AND status = 'en_attente_reception_livreur';

-- Cas 5: Retour de "en_attente_livraison" vers "en_attente_reception_livreur"
UPDATE "Demande" 
SET 
    status = 'en_attente_reception_livreur',
    dateModification = NOW(),
    "validationLivreurId" = NULL,
    "validationLivreurDate" = NULL
WHERE id = 'ID_DELA_DEMANDE' 
AND type = 'outillage' 
AND status = 'en_attente_livraison';

-- Cas 6: Retour de "en_attente_validation_finale_demandeur" vers "en_attente_livraison"
UPDATE "Demande" 
SET 
    status = 'en_attente_livraison',
    dateModification = NOW(),
    "validationFinaleId" = NULL,
    "validationFinaleDate" = NULL,
    dateCloture = NULL
WHERE id = 'ID_DELA_DEMANDE' 
AND type = 'outillage' 
AND status = 'en_attente_validation_finale_demandeur';

-- ========================================
-- ÉTAPE 5: Nettoyage des signatures de validation
-- ========================================

-- Supprimer la signature de validation correspondante au retour arrière
-- Cela dépend du statut actuel et du type

-- Pour retour vers en_attente_validation_conducteur (matériel)
DELETE FROM "ValidationSignature" 
WHERE demandeId = 'ID_DELA_DEMANDE' 
AND type = 'validation_responsable_travaux';

-- Pour retour vers en_attente_validation_logistique (outillage)
DELETE FROM "ValidationSignature" 
WHERE demandeId = 'ID_DELA_DEMANDE' 
AND type = 'validation_responsable_travaux';

-- Pour retour vers en_attente_validation_responsable_travaux (matériel et outillage)
DELETE FROM "ValidationSignature" 
WHERE demandeId = 'ID_DELA_DEMANDE' 
AND type = 'validation_charge_affaire';

-- Pour retour vers en_attente_validation_charge_affaire (matériel et outillage)
DELETE FROM "ValidationSignature" 
WHERE demandeId = 'ID_DELA_DEMANDE' 
AND type IN ('preparation_appro', 'preparation_logistique');

-- Pour retour vers en_attente_preparation_appro (matériel) ou en_attente_preparation_logistique (outillage)
DELETE FROM "ValidationSignature" 
WHERE demandeId = 'ID_DELA_DEMANDE' 
AND type = 'validation_logistique';

-- Pour retour vers en_attente_reception_livreur (matériel et outillage)
DELETE FROM "ValidationSignature" 
WHERE demandeId = 'ID_DELA_DEMANDE' 
AND type = 'validation_livreur';

-- Pour retour vers en_attente_livraison (matériel et outillage)
DELETE FROM "ValidationSignature" 
WHERE demandeId = 'ID_DELA_DEMANDE' 
AND type = 'validation_finale';

-- ========================================
-- ÉTAPE 6: Créer une entrée d'historique
-- ========================================

-- Ajouter une entrée dans l'historique pour tracer le retour arrière
INSERT INTO "HistoryEntry" (
    id,
    demandeId,
    userId,
    action,
    commentaire,
    signature,
    date
) VALUES (
    gen_random_uuid(), -- ou UUID() selon votre base de données
    'ID_DELA_DEMANDE',
    'ID_UTILISATEUR_ADMIN', -- ID de l'administrateur qui fait le retour arrière
    'Retour arrière workflow',
    'Retour au statut précédent suite à correction',
    'rollback-' || NOW(),
    NOW()
);

-- ========================================
-- ÉTAPE 7: Vérification après mise à jour
-- ========================================

-- Vérifier que la demande a bien été mise à jour
SELECT 
    d.id,
    d.numero,
    d.type,
    d.status as nouveau_statut,
    d.dateModification,
    d."validationResponsableTravauxId",
    d."validationChargeAffaireId",
    d."sortieApproId",
    d."validationLogistiqueId",
    d."validationLivreurId",
    d."validationFinaleId"
FROM "Demande" d
WHERE d.id = 'ID_DELA_DEMANDE';

-- ========================================
-- UTILISATION RAPIDE
-- ========================================

/*
PROCÉDURE D'UTILISATION:

1. Remplacer 'ID_DELA_DEMANDE' par l'ID réel de votre demande
2. Remplacer 'ID_UTILISATEUR_ADMIN' par l'ID de l'administrateur
3. Identifier le type de demande (materiel ou outillage)
4. Identifier le statut actuel
5. Exécuter SEULEMENT le cas correspondant dans les sections 3 ou 4
6. Exécuter le nettoyage des signatures (section 5) correspondant
7. Exécuter la création d'historique (section 6)
8. Vérifier le résultat (section 7)

EXEMPLE CONCRET:
Pour une demande d'outillage (ID: 'abc-123') au statut 'en_attente_validation_charge_affaire':

1. UPDATE "Demande" SET status = 'en_attente_validation_responsable_travaux', dateModification = NOW() WHERE id = 'abc-123' AND type = 'outillage' AND status = 'en_attente_validation_charge_affaire';
2. DELETE FROM "ValidationSignature" WHERE demandeId = 'abc-123' AND type = 'validation_charge_affaire';
3. INSERT INTO "HistoryEntry" (...) VALUES (...);
4. SELECT pour vérifier

ATTENTION:
- Faire une sauvegarde avant d'exécuter
- Vérifier les noms de colonnes exacts dans votre base
- Adapter les UUID selon votre système (gen_random_uuid() vs uuid_generate_v4())
*/

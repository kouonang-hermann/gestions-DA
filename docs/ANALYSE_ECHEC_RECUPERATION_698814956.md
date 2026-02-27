# 🔍 Analyse - Échec récupération mot de passe 698814956

## 📋 Problème observé

**Utilisateur** : 698814956  
**Nom saisi** : `FOUTSAP KONLACK Aristide`  
**Téléphone saisi** : `698814956`  
**Résultat** : 404 - "Aucun utilisateur trouvé avec ces informations"

## 🔎 Logs Prisma analysés

```sql
SELECT ... FROM "public"."users" 
WHERE (
  "public"."users"."phone" = '698814956' 
  AND (
    "public"."users"."nom" ILIKE 'FOUTSAP KONLACK Aristide' 
    OR "public"."users"."prenom" ILIKE 'FOUTSAP KONLACK Aristide' 
    OR ("public"."users"."nom" ILIKE 'FOUTSAP' AND "public"."users"."prenom" ILIKE 'KONLACK Aristide') 
    OR ("public"."users"."prenom" ILIKE 'FOUTSAP' AND "public"."users"."nom" ILIKE 'KONLACK Aristide')
  )
) 
LIMIT 1
```

**Résultat** : Aucune ligne retournée → 404

## 🧩 Hypothèses

### Hypothèse 1 : Le téléphone ne correspond pas exactement
- BDD : `+237698814956` ou `237698814956` ou `0698814956`
- Saisi : `698814956`
- **Solution** : Normaliser le numéro de téléphone

### Hypothèse 2 : Le nom ne correspond pas au format
- BDD : `nom = "FOUTSAP"` + `prenom = "KONLACK Aristide"`
- Saisi : `FOUTSAP KONLACK Aristide`
- Requête cherche : `nom ILIKE 'FOUTSAP'` AND `prenom ILIKE 'KONLACK Aristide'`
- **Problème** : Utilise `ILIKE` au lieu de `contains`

### Hypothèse 3 : L'utilisateur n'existe pas
- Aucun utilisateur avec le téléphone `698814956` dans la BDD
- **Solution** : Créer l'utilisateur ou corriger le numéro

## 🔧 Problème identifié dans l'API

**Fichier** : `app/api/auth/forgot-password/route.ts`

### Code actuel (problématique)

```typescript
{
  AND: [
    { nom: { contains: nomTrimmed.split(' ')[0], mode: 'insensitive' } },
    { prenom: { contains: nomTrimmed.split(' ').slice(1).join(' '), mode: 'insensitive' } },
  ],
}
```

**Problème** : Prisma traduit `contains` en `ILIKE` avec le pattern exact, pas en `ILIKE '%pattern%'`

### Ce que Prisma génère

```sql
nom ILIKE 'FOUTSAP'  -- Au lieu de: nom ILIKE '%FOUTSAP%'
prenom ILIKE 'KONLACK Aristide'  -- Au lieu de: prenom ILIKE '%KONLACK Aristide%'
```

## ✅ Solution à appliquer

### Option 1 : Améliorer la recherche Prisma (RECOMMANDÉ)

Utiliser `contains` correctement ou simplifier la logique :

```typescript
const user = await prisma.user.findFirst({
  where: {
    phone: {
      contains: telephone.trim(), // Recherche flexible sur le téléphone
    },
    OR: [
      // Format 1 : Nom complet dans "nom"
      {
        nom: {
          contains: nomTrimmed,
          mode: 'insensitive',
        },
      },
      // Format 2 : Nom complet dans "prenom"
      {
        prenom: {
          contains: nomTrimmed,
          mode: 'insensitive',
        },
      },
      // Format 3 : Nom contient une partie du nom saisi
      {
        AND: [
          {
            nom: {
              contains: nomTrimmed.split(' ')[0],
              mode: 'insensitive',
            },
          },
        ],
      },
    ],
  },
});
```

### Option 2 : Exécuter le script SQL de diagnostic

**Fichier** : `scripts/sql/debug-user-698814956-exact.sql`

Ce script va révéler :
1. Si l'utilisateur existe avec le téléphone `698814956`
2. Le format EXACT du nom et prénom dans la BDD
3. Pourquoi la requête Prisma ne trouve pas l'utilisateur

### Option 3 : Créer l'utilisateur manuellement

Si l'utilisateur n'existe pas, le créer avec les bonnes informations :

```sql
INSERT INTO users (
  id,
  nom,
  prenom,
  phone,
  email,
  password,
  role,
  "createdAt",
  "updatedAt"
)
VALUES (
  gen_random_uuid()::text,
  'FOUTSAP KONLACK',
  'Aristide',
  '698814956',
  'foutsap.aristide@example.com',
  '$2a$10$HASH_BCRYPT_ICI',
  'employe',
  NOW(),
  NOW()
);
```

## 📝 Prochaines étapes

### Étape 1 : Exécuter le script de diagnostic

```bash
# Exécuter dans votre outil SQL
scripts/sql/debug-user-698814956-exact.sql
```

### Étape 2 : Analyser les résultats

Le script va montrer :
- ✅ Si l'utilisateur existe
- ✅ Le format exact du nom/prénom
- ✅ Pourquoi la requête échoue

### Étape 3 : Appliquer la correction appropriée

**Si l'utilisateur existe** :
- Corriger l'API pour utiliser une recherche plus flexible
- Ou corriger le nom/téléphone dans la BDD

**Si l'utilisateur n'existe pas** :
- Créer l'utilisateur avec les bonnes informations
- Ou vérifier que le numéro de téléphone est correct

## 🎯 Correction immédiate de l'API

Je vais améliorer l'API pour qu'elle fonctionne même si le format n'est pas exact.

### Changement à appliquer

Remplacer la logique complexe par une recherche plus simple et flexible :

```typescript
// Recherche plus flexible
const user = await prisma.user.findFirst({
  where: {
    phone: telephone.trim(),
    OR: [
      // Nom complet correspond
      { nom: { contains: nomTrimmed, mode: 'insensitive' } },
      { prenom: { contains: nomTrimmed, mode: 'insensitive' } },
      // Première partie du nom correspond
      { nom: { contains: nomTrimmed.split(' ')[0], mode: 'insensitive' } },
      { prenom: { contains: nomTrimmed.split(' ')[0], mode: 'insensitive' } },
    ],
  },
});
```

## 📊 Résultat attendu

Après correction :
1. L'API trouve l'utilisateur même si le format n'est pas exact
2. La récupération de mot de passe fonctionne
3. L'utilisateur reçoit son nouveau mot de passe temporaire

---

**Créé le** : 27 février 2026  
**Statut** : En attente de diagnostic SQL  
**Priorité** : Haute

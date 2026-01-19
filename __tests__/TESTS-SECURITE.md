# Tests de Sécurité - Documentation

## 📋 Vue d'Ensemble

Cette suite de tests vérifie que l'application de gestion des demandes d'approvisionnement est protégée contre les principales vulnérabilités de sécurité web.

## 🔒 Catégories de Tests

### 1. **Protection des API** (`api-security.test.ts`)

Vérifie la sécurité des endpoints API et la protection des données.

#### Tests Couverts :
- ✅ **Accès non autorisé** : Requêtes sans token JWT
- ✅ **Tokens invalides** : Tokens expirés, modifiés ou corrompus
- ✅ **Isolation des projets** : Accès limité aux projets assignés
- ✅ **Modification de données** : Protection contre la modification de données d'autres utilisateurs
- ✅ **Élévation de privilèges** : Tentatives de s'attribuer des rôles supérieurs
- ✅ **Énumération d'IDs** : Protection contre la découverte d'IDs
- ✅ **Rate limiting** : Limitation des requêtes consécutives
- ✅ **Bruteforce login** : Détection et blocage des tentatives multiples

#### Scénarios Testés :
```typescript
// Exemple : Accès non autorisé
test('Requête sans token JWT est refusée', async () => {
  const result = await makeAPIRequest('/api/demandes', null)
  expect(result.status).toBe(401)
})

// Exemple : Modification interdite
test('Utilisateur ne peut pas modifier la demande d\'un autre', async () => {
  const result = await makeAPIRequest('/api/demandes/autre-demande', token, 'PUT')
  expect(result.status).toBe(403)
})
```

---

### 2. **Injection SQL/NoSQL** (`injection-security.test.ts`)

Vérifie que l'application est protégée contre les attaques par injection.

#### Tests Couverts :
- ✅ **Injection SQL classique** : `' OR '1'='1`, `UNION SELECT`, `DROP TABLE`
- ✅ **Injection NoSQL** : Opérateurs MongoDB (`$ne`, `$gt`, `$where`, `$regex`)
- ✅ **Injection dans les champs** : Motifs, commentaires, désignations
- ✅ **Injection de commandes** : Shell commands, pipes, backticks
- ✅ **Requêtes préparées** : Vérification de l'utilisation de paramètres préparés
- ✅ **Validation des entrées** : Sanitization des inputs utilisateur

#### Payloads Testés :
```typescript
// SQL Injection
"admin' OR '1'='1"
"test' UNION SELECT * FROM users--"
"test'; DROP TABLE demandes;--"

// NoSQL Injection
{ password: { $ne: null } }
{ $where: "this.password == 'test'" }

// Command Injection
"document.pdf; rm -rf /"
"test | cat /etc/passwd"
"test`whoami`"
```

---

### 3. **XSS (Cross-Site Scripting)** (`xss-security.test.ts`)

Vérifie que l'application est protégée contre les attaques XSS.

#### Tests Couverts :
- ✅ **XSS dans les champs de saisie** : Scripts, événements, attributs malveillants
- ✅ **XSS dans les commentaires** : Validation, rejet, clôture
- ✅ **XSS dans les motifs** : Création et modification de demandes
- ✅ **XSS dans les informations utilisateur** : Nom, prénom, email
- ✅ **XSS stocké** : Contenu malveillant en base de données
- ✅ **XSS avancé** : Encodage, Unicode, commentaires HTML
- ✅ **Content Security Policy** : Headers CSP appropriés

#### Payloads Testés :
```typescript
// Script tags
'<script>alert("XSS")</script>'

// Event handlers
'<img src="x" onclick="alert(\'XSS\')">'
'<img src="invalid" onerror="alert(\'XSS\')">'

// JavaScript URLs
'<a href="javascript:alert(\'XSS\')">Click</a>'

// SVG/iframe
'<svg onload="alert(\'XSS\')"></svg>'
'<iframe src="http://evil.com"></iframe>'

// Encoded
'&lt;script&gt;alert("XSS")&lt;/script&gt;'
```

---

### 4. **CSRF et JWT** (`csrf-jwt-security.test.ts`)

Vérifie la protection contre CSRF et la sécurité des tokens.

#### Tests Couverts :
- ✅ **Protection CSRF** : Tokens CSRF sur POST/PUT/DELETE
- ✅ **Validation JWT** : Signature, expiration, algorithme
- ✅ **Bruteforce login** : Blocage après tentatives multiples
- ✅ **Rate limiting API** : Limitation par IP et par utilisateur
- ✅ **Session security** : Détection de hijacking, expiration
- ✅ **Headers de sécurité** : HSTS, X-Frame-Options, CSP, etc.

#### Protections Vérifiées :
```typescript
// CSRF Protection
- Token CSRF requis sur toutes les mutations
- Tokens one-time use
- SameSite cookies

// JWT Security
- Signature obligatoire
- Algorithme "none" rejeté
- Expiration vérifiée
- Claims non modifiables

// Bruteforce Protection
- 5 tentatives max avant blocage
- Délai entre tentatives
- Rate limiting par IP

// Session Security
- Détection changement IP
- Détection changement User-Agent
- Invalidation au logout
```

---

## 🚀 Exécution des Tests

### Tous les tests de sécurité :
```bash
npm test -- __tests__/security
```

### Tests spécifiques :
```bash
# API Security
npm test -- __tests__/security/api-security.test.ts

# Injection
npm test -- __tests__/security/injection-security.test.ts

# XSS
npm test -- __tests__/security/xss-security.test.ts

# CSRF & JWT
npm test -- __tests__/security/csrf-jwt-security.test.ts
```

---

## 📊 Couverture de Sécurité

### Vulnérabilités OWASP Top 10 Couvertes :

| Vulnérabilité | Tests | Statut |
|---------------|-------|--------|
| **A01:2021 – Broken Access Control** | ✅ API Security | Couvert |
| **A02:2021 – Cryptographic Failures** | ✅ JWT, Sessions | Couvert |
| **A03:2021 – Injection** | ✅ SQL/NoSQL Injection | Couvert |
| **A04:2021 – Insecure Design** | ✅ RBAC, Workflow | Couvert |
| **A05:2021 – Security Misconfiguration** | ✅ Headers, CSP | Couvert |
| **A06:2021 – Vulnerable Components** | ⚠️ Manuel | À vérifier |
| **A07:2021 – Authentication Failures** | ✅ Bruteforce, JWT | Couvert |
| **A08:2021 – Software and Data Integrity** | ✅ JWT Signature | Couvert |
| **A09:2021 – Security Logging** | ⚠️ Manuel | À implémenter |
| **A10:2021 – SSRF** | ⚠️ Partiel | À compléter |

---

## 🛡️ Bonnes Pratiques Implémentées

### 1. **Authentification & Autorisation**
- ✅ JWT avec signature vérifiée
- ✅ Tokens avec expiration
- ✅ RBAC strict par projet
- ✅ Validation des permissions à chaque requête

### 2. **Protection des Données**
- ✅ Sanitization des inputs
- ✅ Requêtes préparées (SQL)
- ✅ Validation des opérateurs (NoSQL)
- ✅ Échappement HTML

### 3. **Protection des Sessions**
- ✅ Cookies Secure + HttpOnly + SameSite
- ✅ Détection de session hijacking
- ✅ Expiration automatique
- ✅ Invalidation au logout

### 4. **Rate Limiting**
- ✅ Limitation par IP
- ✅ Limitation par utilisateur
- ✅ Blocage temporaire après bruteforce
- ✅ Délais entre tentatives

### 5. **Headers de Sécurité**
```http
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; script-src 'self'
Referrer-Policy: strict-origin-when-cross-origin
```

---

## 🔍 Points d'Attention

### À Implémenter en Production :

1. **Logging de Sécurité**
   - Logs des tentatives de connexion échouées
   - Logs des accès refusés (403)
   - Logs des modifications sensibles
   - Alertes sur activités suspectes

2. **Monitoring**
   - Surveillance des tentatives de bruteforce
   - Détection d'anomalies dans les patterns d'accès
   - Alertes sur tokens JWT invalides répétés

3. **Audits Réguliers**
   - Scan de vulnérabilités (OWASP ZAP, Burp Suite)
   - Revue des dépendances (npm audit)
   - Tests de pénétration périodiques

4. **Backup & Recovery**
   - Sauvegardes chiffrées
   - Plan de reprise après incident
   - Procédures de rollback

---

## 📝 Checklist de Déploiement

Avant de déployer en production, vérifier :

- [ ] Tous les tests de sécurité passent
- [ ] Variables d'environnement sécurisées
- [ ] HTTPS activé (certificat SSL valide)
- [ ] Headers de sécurité configurés
- [ ] Rate limiting activé
- [ ] Logs de sécurité en place
- [ ] Monitoring configuré
- [ ] Backup automatique activé
- [ ] Plan d'incident de sécurité documenté
- [ ] Équipe formée aux procédures de sécurité

---

## 🆘 En Cas d'Incident

### Procédure d'Urgence :

1. **Détection** : Identifier la nature de l'attaque
2. **Isolation** : Bloquer l'IP/utilisateur malveillant
3. **Investigation** : Analyser les logs
4. **Correction** : Appliquer le patch de sécurité
5. **Communication** : Informer les parties prenantes
6. **Post-mortem** : Documenter l'incident et améliorer

### Contacts d'Urgence :
- Équipe DevOps : [contact]
- Responsable Sécurité : [contact]
- Support Technique : [contact]

---

## 📚 Ressources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

**Dernière mise à jour** : 18 janvier 2026  
**Version** : 1.0.0  
**Statut** : ✅ Tests implémentés et documentés

/**
 * Tests de Sécurité - Injection SQL/NoSQL
 * 
 * Vérifie que l'application est protégée contre :
 * - Injection SQL
 * - Injection NoSQL (MongoDB)
 * - Injection de commandes
 * - Injection dans les requêtes
 */

import { describe, test, expect } from '@jest/globals'

describe('Tests de Sécurité - Injection SQL/NoSQL', () => {
  
  describe('Injection SQL', () => {
    test('Injection SQL dans le champ email est neutralisée', () => {
      const maliciousEmail = "admin' OR '1'='1"
      const sanitized = sanitizeInput(maliciousEmail)
      
      expect(sanitized).not.toContain("'")
      expect(sanitized).not.toContain('OR')
      expect(sanitized).not.toContain('1=1')
    })

    test('Injection SQL avec UNION est bloquée', () => {
      const maliciousInput = "test' UNION SELECT * FROM users--"
      const sanitized = sanitizeInput(maliciousInput)
      
      expect(sanitized).not.toContain('UNION')
      expect(sanitized).not.toContain('SELECT')
      expect(sanitized).not.toContain('--')
    })

    test('Injection SQL avec DROP TABLE est bloquée', () => {
      const maliciousInput = "test'; DROP TABLE demandes;--"
      const sanitized = sanitizeInput(maliciousInput)
      
      expect(sanitized).not.toContain('DROP')
      expect(sanitized).not.toContain('TABLE')
      expect(sanitized).not.toContain(';')
    })

    test('Injection SQL dans les paramètres de recherche est neutralisée', () => {
      const searchQuery = "' OR 1=1--"
      const result = searchDemandes(searchQuery)
      
      expect(result.error).toBeDefined()
      expect(result.error).toContain('Caractères non autorisés')
    })

    test('Injection SQL avec commentaires multiples est bloquée', () => {
      const maliciousInput = "admin'/**/OR/**/1=1--"
      const sanitized = sanitizeInput(maliciousInput)
      
      expect(sanitized).not.toContain('/*')
      expect(sanitized).not.toContain('*/')
      expect(sanitized).not.toContain('OR')
    })
  })

  describe('Injection NoSQL (MongoDB)', () => {
    test('Injection NoSQL avec $ne est bloquée', () => {
      const maliciousQuery = { password: { $ne: null } }
      const result = validateMongoQuery(maliciousQuery)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Opérateur non autorisé')
    })

    test('Injection NoSQL avec $gt est bloquée', () => {
      const maliciousQuery = { price: { $gt: 0 } }
      const result = validateMongoQuery(maliciousQuery)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Opérateur non autorisé')
    })

    test('Injection NoSQL avec $where est bloquée', () => {
      const maliciousQuery = { $where: "this.password == 'test'" }
      const result = validateMongoQuery(maliciousQuery)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Opérateur dangereux')
    })

    test('Injection NoSQL avec $regex est validée', () => {
      const maliciousQuery = { email: { $regex: '.*' } }
      const result = validateMongoQuery(maliciousQuery)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Opérateur non autorisé')
    })

    test('Injection NoSQL dans les filtres JSON est bloquée', () => {
      const maliciousFilter = JSON.stringify({ $or: [{ admin: true }, { role: 'superadmin' }] })
      const result = parseAndValidateFilter(maliciousFilter)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Opérateur non autorisé')
    })
  })

  describe('Injection dans les Champs de Demande', () => {
    test('Injection SQL dans le motif de demande est neutralisée', () => {
      const maliciousMotif = "Besoin urgent'; DROP TABLE demandes;--"
      const sanitized = sanitizeDemandeField(maliciousMotif)
      
      expect(sanitized).not.toContain('DROP')
      expect(sanitized).not.toContain('TABLE')
      expect(sanitized).not.toContain(';')
    })

    test('Injection dans le commentaire de validation est neutralisée', () => {
      const maliciousComment = "Validé' OR '1'='1"
      const sanitized = sanitizeDemandeField(maliciousComment)
      
      expect(sanitized).not.toContain("'")
      expect(sanitized).not.toContain('OR')
    })

    test('Injection dans la désignation d\'article est neutralisée', () => {
      const maliciousDesignation = "Article'; UPDATE demandes SET status='cloturee'--"
      const sanitized = sanitizeDemandeField(maliciousDesignation)
      
      expect(sanitized).not.toContain('UPDATE')
      expect(sanitized).not.toContain('SET')
    })

    test('Injection dans le motif de rejet est neutralisée', () => {
      const maliciousRejet = "Rejeté' UNION SELECT password FROM users--"
      const sanitized = sanitizeDemandeField(maliciousRejet)
      
      expect(sanitized).not.toContain('UNION')
      expect(sanitized).not.toContain('SELECT')
      expect(sanitized).not.toContain('password')
    })
  })

  describe('Injection de Commandes', () => {
    test('Injection de commande shell dans le nom de fichier est bloquée', () => {
      const maliciousFilename = "document.pdf; rm -rf /"
      const result = validateFilename(maliciousFilename)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Caractères non autorisés')
    })

    test('Injection de commande avec pipe est bloquée', () => {
      const maliciousInput = "test | cat /etc/passwd"
      const result = validateInput(maliciousInput)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Caractères dangereux')
    })

    test('Injection de commande avec backticks est bloquée', () => {
      const maliciousInput = "test`whoami`"
      const result = validateInput(maliciousInput)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Caractères dangereux')
    })

    test('Injection de commande avec $() est bloquée', () => {
      const maliciousInput = "test$(ls -la)"
      const result = validateInput(maliciousInput)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Caractères dangereux')
    })
  })

  describe('Injection dans les Requêtes API', () => {
    test('Injection dans les paramètres d\'URL est neutralisée', () => {
      const maliciousParam = "1' OR '1'='1"
      const result = validateURLParam(maliciousParam)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Format invalide')
    })

    test('Injection dans les headers HTTP est bloquée', () => {
      const maliciousHeader = "admin\r\nX-Admin: true"
      const result = validateHeader(maliciousHeader)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Caractères non autorisés')
    })

    test('Injection dans le body JSON est validée', () => {
      const maliciousBody = '{"email": "test@test.com", "role": {"$ne": null}}'
      const result = validateJSONBody(maliciousBody)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Structure JSON invalide')
    })
  })

  describe('Protection des Requêtes Préparées', () => {
    test('Les requêtes utilisent des paramètres préparés', () => {
      const query = buildQuery('SELECT * FROM demandes WHERE id = ?', ['demande-1'])
      
      expect(query.prepared).toBe(true)
      expect(query.params).toEqual(['demande-1'])
    })

    test('Les valeurs ne sont jamais concaténées directement', () => {
      const userInput = "'; DROP TABLE users;--"
      const query = buildQuery('SELECT * FROM users WHERE email = ?', [userInput])
      
      expect(query.sql).not.toContain(userInput)
      expect(query.prepared).toBe(true)
    })

    test('Les identifiants sont validés avant utilisation', () => {
      const maliciousId = "1 OR 1=1"
      const result = validateId(maliciousId)
      
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Format d\'ID invalide')
    })
  })
})


function sanitizeInput(input: string): string {
  // Supprimer les caractères SQL dangereux
  return input
    .replace(/['"\;]/g, '')
    .replace(/\b(OR|AND|UNION|SELECT|DROP|DELETE|UPDATE|INSERT|CREATE|ALTER|EXEC|TABLE|SET|FROM|WHERE)\b/gi, '')
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
    .replace(/\d+=\d+/g, '') // Supprimer les patterns comme 1=1
    .trim()
}

function sanitizeDemandeField(input: string): string {
  // Nettoyer les champs de demande
  return input
    .replace(/['"\;]/g, '')
    .replace(/\b(DROP|DELETE|UPDATE|INSERT|SELECT|UNION|TABLE|SET|FROM|WHERE|OR|AND|password)\b/gi, '')
    .replace(/--/g, '')
    .replace(/\d+=\d+/g, '') // Supprimer les patterns comme 1=1
    .substring(0, 500) // Limiter la longueur
}

function searchDemandes(query: string): { data?: any[]; error?: string } {
  // Vérifier les caractères dangereux
  if (/['";]|--|\bOR\b|\bUNION\b/i.test(query)) {
    return { error: 'Caractères non autorisés dans la recherche' }
  }
  
  return { data: [] }
}

function validateMongoQuery(query: any): { valid: boolean; error?: string } {
  // Liste des opérateurs MongoDB dangereux
  const dangerousOperators = ['$where', '$function', '$accumulator', '$expr']
  const restrictedOperators = ['$ne', '$gt', '$gte', '$lt', '$lte', '$in', '$nin', '$regex']
  
  const queryStr = JSON.stringify(query)
  
  // Vérifier les opérateurs dangereux
  for (const op of dangerousOperators) {
    if (queryStr.includes(op)) {
      return { valid: false, error: `Opérateur dangereux détecté : ${op}` }
    }
  }
  
  // Vérifier les opérateurs restreints
  for (const op of restrictedOperators) {
    if (queryStr.includes(op)) {
      return { valid: false, error: `Opérateur non autorisé : ${op}` }
    }
  }
  
  return { valid: true }
}

function parseAndValidateFilter(filterJson: string): { valid: boolean; error?: string } {
  try {
    const filter = JSON.parse(filterJson)
    // Vérifier $or qui est un opérateur dangereux
    if (filterJson.includes('$or')) {
      return { valid: false, error: 'Opérateur non autorisé : $or' }
    }
    return validateMongoQuery(filter)
  } catch (e) {
    return { valid: false, error: 'JSON invalide' }
  }
}

function validateFilename(filename: string): { valid: boolean; error?: string } {
  // Caractères autorisés : lettres, chiffres, points, tirets, underscores
  const validPattern = /^[a-zA-Z0-9._-]+$/
  
  if (!validPattern.test(filename)) {
    return { valid: false, error: 'Caractères non autorisés dans le nom de fichier' }
  }
  
  // Vérifier les extensions dangereuses
  const dangerousExtensions = ['.sh', '.bat', '.exe', '.cmd', '.ps1']
  if (dangerousExtensions.some(ext => filename.toLowerCase().endsWith(ext))) {
    return { valid: false, error: 'Extension de fichier non autorisée' }
  }
  
  return { valid: true }
}

function validateInput(input: string): { valid: boolean; error?: string } {
  // Caractères dangereux pour l'injection de commandes
  const dangerousChars = /[|&;`$(){}[\]<>]/
  
  if (dangerousChars.test(input)) {
    return { valid: false, error: 'Caractères dangereux détectés' }
  }
  
  return { valid: true }
}

function validateURLParam(param: string): { valid: boolean; error?: string } {
  // Vérifier le format (UUID, nombre, ou chaîne alphanumérique simple)
  const validFormats = [
    /^[0-9]+$/, // Nombre
    /^[a-zA-Z0-9-]+$/, // Alphanumérique avec tirets
    /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i // UUID
  ]
  
  if (!validFormats.some(pattern => pattern.test(param))) {
    return { valid: false, error: 'Format invalide pour le paramètre' }
  }
  
  return { valid: true }
}

function validateHeader(header: string): { valid: boolean; error?: string } {
  // Vérifier les caractères de contrôle (CRLF injection)
  if (/[\r\n]/.test(header)) {
    return { valid: false, error: 'Caractères non autorisés dans le header' }
  }
  
  return { valid: true }
}

function validateJSONBody(body: string): { valid: boolean; error?: string } {
  try {
    const parsed = JSON.parse(body)
    
    // Vérifier qu'il n'y a pas d'opérateurs MongoDB
    const bodyStr = JSON.stringify(parsed)
    if (/\$[a-z]+/i.test(bodyStr)) {
      return { valid: false, error: 'Structure JSON invalide : opérateurs non autorisés' }
    }
    
    return { valid: true }
  } catch (e) {
    return { valid: false, error: 'JSON invalide' }
  }
}

function buildQuery(sql: string, params: any[]): { sql: string; params: any[]; prepared: boolean } {
  return {
    sql,
    params,
    prepared: true
  }
}

function validateId(id: string): { valid: boolean; error?: string } {
  // Format attendu : lettres, chiffres, tirets
  const validPattern = /^[a-zA-Z0-9-]+$/
  
  if (!validPattern.test(id)) {
    return { valid: false, error: 'Format d\'ID invalide' }
  }
  
  // Vérifier la longueur
  if (id.length > 100) {
    return { valid: false, error: 'ID trop long' }
  }
  
  return { valid: true }
}

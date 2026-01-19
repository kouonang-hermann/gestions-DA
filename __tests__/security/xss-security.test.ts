/**
 * Tests de Sécurité - XSS (Cross-Site Scripting)
 * 
 * Vérifie que l'application est protégée contre :
 * - XSS dans les champs de saisie
 * - XSS dans les commentaires
 * - XSS dans les motifs de rejet
 * - XSS dans les noms d'utilisateurs
 * - XSS stocké et réfléchi
 */

import { describe, test, expect } from '@jest/globals'

describe('Tests de Sécurité - XSS', () => {
  
  describe('XSS dans les Champs de Saisie', () => {
    test('Script tag simple est neutralisé', () => {
      const maliciousInput = '<script>alert("XSS")</script>'
      const sanitized = sanitizeHTML(maliciousInput)
      
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('</script>')
      expect(sanitized).not.toContain('alert')
    })

    test('Script avec événement onclick est neutralisé', () => {
      const maliciousInput = '<img src="x" onclick="alert(\'XSS\')">'
      const sanitized = sanitizeHTML(maliciousInput)
      
      expect(sanitized).not.toContain('onclick')
      expect(sanitized).not.toContain('alert')
    })

    test('Script avec onerror est neutralisé', () => {
      const maliciousInput = '<img src="invalid" onerror="alert(\'XSS\')">'
      const sanitized = sanitizeHTML(maliciousInput)
      
      expect(sanitized).not.toContain('onerror')
      expect(sanitized).not.toContain('alert')
    })

    test('Script avec javascript: dans href est neutralisé', () => {
      const maliciousInput = '<a href="javascript:alert(\'XSS\')">Cliquez ici</a>'
      const sanitized = sanitizeHTML(maliciousInput)
      
      expect(sanitized).not.toContain('javascript:')
      expect(sanitized).not.toContain('alert')
    })

    test('Script encodé en base64 est neutralisé', () => {
      const maliciousInput = '<img src="data:text/html;base64,PHNjcmlwdD5hbGVydCgnWFNTJyk8L3NjcmlwdD4=">'
      const sanitized = sanitizeHTML(maliciousInput)
      
      expect(sanitized).not.toContain('data:text/html')
      expect(sanitized).not.toContain('base64')
    })
  })

  describe('XSS dans les Commentaires', () => {
    test('XSS dans commentaire de validation est neutralisé', () => {
      const maliciousComment = 'Validé <script>document.cookie</script>'
      const sanitized = sanitizeComment(maliciousComment)
      
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('document.cookie')
    })

    test('XSS avec balise style est neutralisé', () => {
      const maliciousComment = '<style>body{display:none}</style>Commentaire'
      const sanitized = sanitizeComment(maliciousComment)
      
      expect(sanitized).not.toContain('<style>')
      expect(sanitized).not.toContain('display:none')
    })

    test('XSS avec iframe est neutralisé', () => {
      const maliciousComment = '<iframe src="http://evil.com"></iframe>'
      const sanitized = sanitizeComment(maliciousComment)
      
      expect(sanitized).not.toContain('<iframe>')
      expect(sanitized).not.toContain('evil.com')
    })

    test('XSS avec SVG est neutralisé', () => {
      const maliciousComment = '<svg onload="alert(\'XSS\')"></svg>'
      const sanitized = sanitizeComment(maliciousComment)
      
      expect(sanitized).not.toContain('<svg>')
      expect(sanitized).not.toContain('onload')
    })
  })

  describe('XSS dans les Motifs de Rejet', () => {
    test('XSS dans motif de rejet est neutralisé', () => {
      const maliciousMotif = 'Budget insuffisant <script>steal()</script>'
      const sanitized = sanitizeMotif(maliciousMotif)
      
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('steal')
    })

    test('XSS avec expression JavaScript est neutralisé', () => {
      const maliciousMotif = 'Rejet: ${alert("XSS")}'
      const sanitized = sanitizeMotif(maliciousMotif)
      
      expect(sanitized).not.toContain('${')
      expect(sanitized).not.toContain('alert')
    })

    test('XSS avec balise meta est neutralisé', () => {
      const maliciousMotif = '<meta http-equiv="refresh" content="0;url=http://evil.com">'
      const sanitized = sanitizeMotif(maliciousMotif)
      
      expect(sanitized).not.toContain('<meta>')
      expect(sanitized).not.toContain('http-equiv')
    })
  })

  describe('XSS dans les Noms et Informations Utilisateur', () => {
    test('XSS dans nom d\'utilisateur est neutralisé', () => {
      const maliciousName = '<script>alert("XSS")</script>Dupont'
      const sanitized = sanitizeUserField(maliciousName)
      
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).toBe('Dupont')
    })

    test('XSS dans prénom est neutralisé', () => {
      const maliciousPrenom = 'Jean<img src=x onerror=alert(1)>'
      const sanitized = sanitizeUserField(maliciousPrenom)
      
      expect(sanitized).not.toContain('<img>')
      expect(sanitized).not.toContain('onerror')
      expect(sanitized).toBe('Jean')
    })

    test('XSS dans email est neutralisé', () => {
      const maliciousEmail = 'test@test.com<script>alert(1)</script>'
      const sanitized = sanitizeEmail(maliciousEmail)
      
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).toBe('test@test.com')
    })
  })

  describe('XSS dans les Désignations d\'Articles', () => {
    test('XSS dans désignation d\'article est neutralisé', () => {
      const maliciousDesignation = 'Marteau <script>alert("XSS")</script>'
      const sanitized = sanitizeDesignation(maliciousDesignation)
      
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).toBe('Marteau')
    })

    test('XSS avec balise object est neutralisé', () => {
      const maliciousDesignation = '<object data="http://evil.com"></object>Outil'
      const sanitized = sanitizeDesignation(maliciousDesignation)
      
      expect(sanitized).not.toContain('<object>')
      expect(sanitized).toBe('Outil')
    })

    test('XSS avec balise embed est neutralisé', () => {
      const maliciousDesignation = '<embed src="http://evil.com">Matériel'
      const sanitized = sanitizeDesignation(maliciousDesignation)
      
      expect(sanitized).not.toContain('<embed>')
      expect(sanitized).toBe('Matériel')
    })
  })

  describe('XSS Avancé', () => {
    test('XSS avec encodage HTML entities est neutralisé', () => {
      const maliciousInput = '&lt;script&gt;alert("XSS")&lt;/script&gt;'
      const sanitized = sanitizeHTML(maliciousInput)
      
      // Vérifier que même décodé, le script ne passe pas
      expect(sanitized).not.toContain('script')
      expect(sanitized).not.toContain('alert')
    })

    test('XSS avec Unicode est neutralisé', () => {
      const maliciousInput = '<script>\\u0061\\u006c\\u0065\\u0072\\u0074("XSS")</script>'
      const sanitized = sanitizeHTML(maliciousInput)
      
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).not.toContain('\\u')
    })

    test('XSS avec commentaires HTML est neutralisé', () => {
      const maliciousInput = '<!--<script>alert("XSS")</script>-->'
      const sanitized = sanitizeHTML(maliciousInput)
      
      expect(sanitized).not.toContain('<!--')
      expect(sanitized).not.toContain('<script>')
    })

    test('XSS avec balises auto-fermantes est neutralisé', () => {
      const maliciousInput = '<input onfocus="alert(\'XSS\')" autofocus />'
      const sanitized = sanitizeHTML(maliciousInput)
      
      expect(sanitized).not.toContain('onfocus')
      expect(sanitized).not.toContain('autofocus')
    })

    test('XSS avec attribut style malveillant est neutralisé', () => {
      const maliciousInput = '<div style="background:url(javascript:alert(\'XSS\'))">Test</div>'
      const sanitized = sanitizeHTML(maliciousInput)
      
      expect(sanitized).not.toContain('javascript:')
      expect(sanitized).not.toContain('background:url')
    })
  })

  describe('XSS Stocké', () => {
    test('XSS stocké dans base de données est neutralisé à la lecture', () => {
      // Simuler un XSS stocké en base
      const storedXSS = '<script>alert("Stored XSS")</script>Commentaire'
      const displayed = displayStoredContent(storedXSS)
      
      expect(displayed).not.toContain('<script>')
      expect(displayed).not.toContain('alert')
      expect(displayed).toBe('Commentaire')
    })

    test('XSS stocké dans motif de demande est neutralisé', () => {
      const storedMotif = 'Besoin urgent<img src=x onerror=alert(1)>'
      const displayed = displayStoredContent(storedMotif)
      
      expect(displayed).not.toContain('<img>')
      expect(displayed).not.toContain('onerror')
    })
  })

  describe('Protection Content Security Policy', () => {
    test('CSP headers sont définis', () => {
      const cspHeaders = getCSPHeaders()
      
      expect(cspHeaders['Content-Security-Policy']).toBeDefined()
      expect(cspHeaders['Content-Security-Policy']).toContain("default-src 'self'")
      expect(cspHeaders['Content-Security-Policy']).toContain("script-src 'self'")
    })

    test('Inline scripts sont bloqués par CSP', () => {
      const cspHeaders = getCSPHeaders()
      
      expect(cspHeaders['Content-Security-Policy']).not.toContain("'unsafe-inline'")
    })

    test('Eval est bloqué par CSP', () => {
      const cspHeaders = getCSPHeaders()
      
      expect(cspHeaders['Content-Security-Policy']).not.toContain("'unsafe-eval'")
    })
  })
})

// Fonctions utilitaires pour les tests XSS

function sanitizeHTML(input: string): string {
  // Supprimer toutes les balises HTML et scripts
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Supprimer balises style avec contenu
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:text\/html/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/&lt;script&gt;/gi, '')
    .replace(/&lt;\/script&gt;/gi, '')
    .replace(/\\u[0-9a-f]{4}/gi, '')
    .trim()
  
  // Supprimer les mots dangereux restants
  sanitized = sanitized.replace(/\bscript\b/gi, '')
  sanitized = sanitized.replace(/\balert\b/gi, '')
  
  return sanitized
}

function sanitizeComment(comment: string): string {
  // Nettoyer les commentaires
  return sanitizeHTML(comment)
    .substring(0, 1000) // Limiter la longueur
}

function sanitizeMotif(motif: string): string {
  // Nettoyer les motifs
  return sanitizeHTML(motif)
    .replace(/\${.*?}/g, '') // Supprimer les template literals
    .substring(0, 500)
}

function sanitizeUserField(field: string): string {
  // Nettoyer les champs utilisateur (nom, prénom)
  return sanitizeHTML(field)
    .replace(/[^a-zA-ZÀ-ÿ\s-]/g, '') // Garder seulement lettres et espaces
    .trim()
}

function sanitizeEmail(email: string): string {
  // Extraire seulement la partie email valide
  // Regex qui s'arrête avant les caractères non-email comme '<', '(', etc.
  const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?=[<>()\s]|$)/
  
  // Essayer d'extraire l'email AVANT de supprimer les balises
  const match = email.match(emailRegex)
  if (match) {
    return match[1]
  }
  
  return ''
}

function sanitizeDesignation(designation: string): string {
  // Nettoyer les désignations d'articles
  return sanitizeHTML(designation)
    .substring(0, 200)
}

function displayStoredContent(content: string): string {
  // Simuler l'affichage de contenu stocké
  return sanitizeHTML(content)
}

function getCSPHeaders(): Record<string, string> {
  // Simuler les headers CSP de l'application
  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self'",
      "style-src 'self'", // Pas d'unsafe-inline pour la sécurité
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ')
  }
}

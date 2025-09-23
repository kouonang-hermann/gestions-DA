const fs = require('fs')
const path = require('path')

// Fonction pour analyser récursivement les fichiers API
function analyzeApiEndpoints(dir, basePath = '') {
  const endpoints = []
  
  try {
    const items = fs.readdirSync(dir)
    
    for (const item of items) {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        // Récursion dans les sous-dossiers
        const subEndpoints = analyzeApiEndpoints(fullPath, `${basePath}/${item}`)
        endpoints.push(...subEndpoints)
      } else if (item === 'route.ts' || item === 'route.js') {
        // Analyser le fichier route
        const content = fs.readFileSync(fullPath, 'utf8')
        const methods = extractHttpMethods(content)
        
        endpoints.push({
          path: basePath || '/',
          file: fullPath,
          methods: methods,
          exists: true
        })
      }
    }
  } catch (error) {
    console.error(`Erreur lors de l'analyse de ${dir}:`, error.message)
  }
  
  return endpoints
}

function extractHttpMethods(content) {
  const methods = []
  
  // Rechercher les exports de méthodes HTTP
  const httpMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
  
  for (const method of httpMethods) {
    const regex = new RegExp(`export\\s+(?:const|async\\s+function)\\s+${method}`, 'i')
    if (regex.test(content)) {
      methods.push(method)
    }
  }
  
  return methods
}

function generateApiReport() {
  console.log('🔍 ANALYSE DES ENDPOINTS API')
  console.log('=' .repeat(60))
  
  const apiDir = path.join(__dirname, '..', 'app', 'api')
  const endpoints = analyzeApiEndpoints(apiDir)
  
  console.log(`\n📊 RÉSUMÉ:`)
  console.log(`   Total endpoints trouvés: ${endpoints.length}`)
  
  console.log(`\n📋 ENDPOINTS DÉTECTÉS:`)
  endpoints.forEach(endpoint => {
    console.log(`   🔗 ${endpoint.path}`)
    console.log(`      Méthodes: ${endpoint.methods.join(', ') || 'Aucune détectée'}`)
    console.log(`      Fichier: ${path.relative(process.cwd(), endpoint.file)}`)
    console.log('')
  })
  
  // Endpoints attendus selon la documentation
  const expectedEndpoints = [
    { path: '/auth/login', methods: ['POST'] },
    { path: '/auth/logout', methods: ['POST'] },
    { path: '/auth/me', methods: ['GET'] },
    { path: '/users', methods: ['GET', 'POST'] },
    { path: '/users/[id]', methods: ['PUT', 'DELETE'] },
    { path: '/projets', methods: ['GET', 'POST'] },
    { path: '/projets/[id]', methods: ['PUT'] },
    { path: '/projets/[id]/remove-user', methods: ['DELETE'] },
    { path: '/articles', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
    { path: '/demandes', methods: ['GET', 'POST'] },
    { path: '/demandes/[id]', methods: ['GET', 'PUT'] },
    { path: '/demandes/[id]/actions', methods: ['POST'] },
    { path: '/demandes/[id]/remove-item', methods: ['DELETE'] },
    { path: '/notifications', methods: ['GET'] },
    { path: '/notifications/[id]', methods: ['PUT'] }
  ]
  
  console.log(`\n✅ VÉRIFICATION DE COUVERTURE:`)
  let foundCount = 0
  let missingCount = 0
  
  expectedEndpoints.forEach(expected => {
    const found = endpoints.find(e => 
      e.path === expected.path || 
      e.path.replace(/\[id\]/g, '[id]') === expected.path
    )
    
    if (found) {
      const missingMethods = expected.methods.filter(m => !found.methods.includes(m))
      if (missingMethods.length === 0) {
        console.log(`   ✅ ${expected.path} - ${expected.methods.join(', ')}`)
        foundCount++
      } else {
        console.log(`   ⚠️ ${expected.path} - Manque: ${missingMethods.join(', ')}`)
        foundCount++
      }
    } else {
      console.log(`   ❌ ${expected.path} - MANQUANT`)
      missingCount++
    }
  })
  
  const coverageRate = ((foundCount / expectedEndpoints.length) * 100).toFixed(1)
  console.log(`\n📈 TAUX DE COUVERTURE: ${coverageRate}%`)
  
  return {
    endpoints,
    expectedEndpoints,
    foundCount,
    missingCount,
    coverageRate: parseFloat(coverageRate)
  }
}

// Exécution de l'analyse
if (require.main === module) {
  generateApiReport()
}

module.exports = { generateApiReport, analyzeApiEndpoints }

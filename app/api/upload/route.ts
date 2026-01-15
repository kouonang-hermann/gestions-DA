import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { withAuth } from '@/lib/middleware'

/**
 * API pour téléverser des fichiers Excel lors de la création de demandes
 * 
 * POST /api/upload
 * - Accepte des fichiers Excel (.xlsx, .xls)
 * - Stocke les fichiers dans public/uploads
 * - Retourne les URLs des fichiers téléversés
 */

// Configuration pour accepter les fichiers
export const config = {
  api: {
    bodyParser: false,
  },
}

async function handler(request: NextRequest, currentUser: any) {
  try {
    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Aucun fichier fourni' },
        { status: 400 }
      )
    }

    // Vérifier que tous les fichiers sont des Excel
    const allowedExtensions = ['.xlsx', '.xls', '.csv']
    for (const file of files) {
      const ext = path.extname(file.name).toLowerCase()
      if (!allowedExtensions.includes(ext)) {
        return NextResponse.json(
          { 
            success: false, 
            error: `Format de fichier non autorisé: ${file.name}. Seuls les fichiers Excel (.xlsx, .xls) et CSV sont acceptés.` 
          },
          { status: 400 }
        )
      }
    }

    // Créer le dossier uploads s'il n'existe pas
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Téléverser les fichiers
    const uploadedFiles: string[] = []
    
    for (const file of files) {
      // Générer un nom de fichier unique
      const timestamp = Date.now()
      const randomString = Math.random().toString(36).substring(2, 8)
      const ext = path.extname(file.name)
      const baseName = path.basename(file.name, ext)
        .replace(/[^a-zA-Z0-9]/g, '_') // Remplacer les caractères spéciaux
        .substring(0, 50) // Limiter la longueur
      
      const fileName = `${baseName}_${timestamp}_${randomString}${ext}`
      const filePath = path.join(uploadsDir, fileName)

      // Convertir le fichier en buffer et l'écrire
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filePath, buffer)

      // Ajouter l'URL du fichier à la liste
      uploadedFiles.push(`/uploads/${fileName}`)
      
      console.log(`✅ [UPLOAD] Fichier téléversé: ${fileName} (${(buffer.length / 1024).toFixed(2)} KB)`)
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      message: `${uploadedFiles.length} fichier(s) téléversé(s) avec succès`
    })

  } catch (error) {
    console.error('❌ [UPLOAD] Erreur lors du téléversement:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Erreur lors du téléversement des fichiers',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}

export const POST = withAuth(handler)

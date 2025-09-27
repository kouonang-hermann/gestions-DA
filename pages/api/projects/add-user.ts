import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId, projectId, role } = req.body

    if (!userId || !projectId) {
      return res.status(400).json({ 
        success: false, 
        error: 'userId et projectId sont requis' 
      })
    }

    // Simuler l'ajout en base de données
    // Dans une vraie application, vous feriez quelque chose comme :
    // await db.users.update({
    //   where: { id: userId },
    //   data: { 
    //     projets: { push: projectId },
    //     role: role || 'employe'
    //   }
    // })

    console.log(`✅ Utilisateur ${userId} ajouté au projet ${projectId} avec le rôle ${role || 'employe'}`)

    // Simuler une réponse de succès
    res.status(200).json({
      success: true,
      message: 'Utilisateur ajouté au projet avec succès',
      data: {
        userId,
        projectId,
        role: role || 'employe'
      }
    })

  } catch (error) {
    console.error('Erreur lors de l\'ajout de l\'utilisateur au projet:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    })
  }
}

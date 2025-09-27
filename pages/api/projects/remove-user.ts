import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userId, projectId } = req.body

    if (!userId || !projectId) {
      return res.status(400).json({ 
        success: false, 
        error: 'userId et projectId sont requis' 
      })
    }

    // Simuler la suppression en base de données
    // Dans une vraie application, vous feriez quelque chose comme :
    // await db.users.update({
    //   where: { id: userId },
    //   data: { 
    //     projets: { 
    //       set: user.projets.filter(id => id !== projectId)
    //     }
    //   }
    // })

    console.log(`✅ Utilisateur ${userId} retiré du projet ${projectId}`)

    // Simuler une réponse de succès
    res.status(200).json({
      success: true,
      message: 'Utilisateur retiré du projet avec succès',
      data: {
        userId,
        projectId
      }
    })

  } catch (error) {
    console.error('Erreur lors de la suppression de l\'utilisateur du projet:', error)
    res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    })
  }
}

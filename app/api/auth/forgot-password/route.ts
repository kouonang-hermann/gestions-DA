import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { nom, telephone } = await req.json();


    // Validation des données
    if (!nom || !telephone) {
      return NextResponse.json(
        { success: false, error: 'Le nom et le numéro de téléphone sont requis' },
        { status: 400 }
      );
    }

    // Rechercher l'utilisateur par nom et téléphone
    const user = await prisma.user.findFirst({
      where: {
        nom: {
          equals: nom.trim(),
          mode: 'insensitive', // Recherche insensible à la casse
        },
        phone: telephone.trim(),
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Aucun utilisateur trouvé avec ces informations' },
        { status: 404 }
      );
    }


    // Générer un nouveau mot de passe temporaire
    const newPassword = generateTemporaryPassword();
    
    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe dans la base de données
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        password: hashedPassword,
        // Optionnel : ajouter un flag pour forcer le changement de mot de passe
        // requirePasswordChange: true 
      },
    });


    // Retourner le nouveau mot de passe
    return NextResponse.json({
      success: true,
      newPassword: newPassword,
      message: 'Mot de passe réinitialisé avec succès',
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Une erreur est survenue lors de la récupération du mot de passe' },
      { status: 500 }
    );
  }
}

// Fonction pour générer un mot de passe temporaire sécurisé
function generateTemporaryPassword(): string {
  const length = 10;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
  let password = '';
  
  // S'assurer qu'il y a au moins une majuscule, une minuscule, un chiffre et un caractère spécial
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  password += '0123456789'[Math.floor(Math.random() * 10)];
  password += '!@#$%'[Math.floor(Math.random() * 5)];
  
  // Compléter avec des caractères aléatoires
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Mélanger les caractères
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

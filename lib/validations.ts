import { z } from "zod"

// Schémas de validation pour l'authentification
export const loginSchema = z.object({
  // Numéro de téléphone (format: 6XXXXXXXX - 9 chiffres)
  identifier: z.string().min(1, "Numéro de téléphone requis"),
  password: z.string().min(1, "Mot de passe requis"),
})

export const registerSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  prenom: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide").optional().or(z.literal('')),
  phone: z
    .string()
    .length(9, "Le numéro de téléphone doit contenir exactement 9 chiffres")
    .regex(/^6\d{8}$/, "Le numéro de téléphone doit commencer par 6 et contenir 9 chiffres"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  role: z.enum([
    "superadmin",
    "employe", 
    "conducteur_travaux",
    "responsable_travaux",
    "responsable_logistique",
    "responsable_appro",
    "charge_affaire",
    "responsable_livreur"
  ]),
  isAdmin: z.boolean().optional(),
  projets: z.array(z.string()).optional(),
})

// Schémas pour les projets
export const createProjetSchema = z.object({
  nom: z.string().min(2, "Le nom du projet doit contenir au moins 2 caractères"),
  description: z.string().min(10, "La description doit contenir au moins 10 caractères"),
  dateDebut: z.string().min(1, "Date de début requise"),
  dateFin: z.string().optional(),
  utilisateurs: z.array(z.string()).optional(),
})

// Schémas pour les articles
export const createArticleSchema = z.object({
  nom: z.string().min(2, "Le nom de l'article doit contenir au moins 2 caractères"),
  description: z.string().min(5, "La description doit contenir au moins 5 caractères"),
  reference: z.string().min(3, "La référence doit contenir au moins 3 caractères"),
  unite: z.string().min(1, "L'unité est requise"),
  type: z.enum(["materiel", "outillage"]),
  stock: z.number().int().min(0).optional(),
  prixUnitaire: z.number().min(0).optional(),
})

// Schémas pour les demandes
export const createDemandeSchema = z.object({
  projetId: z.string().min(1, "Projet requis"),
  type: z.enum(["materiel", "outillage"]),
  items: z.array(z.object({
    articleId: z.string().min(1, "Article requis"),
    quantiteDemandee: z.number().int().min(1, "Quantité doit être supérieure à 0"),
    commentaire: z.string().optional(),
    article: z.object({
      nom: z.string(),
      description: z.string().optional(),
      reference: z.string(),
      unite: z.string(),
      type: z.enum(["materiel", "outillage"]),
    }).optional(),
  })).min(1, "Au moins un article est requis"),
  commentaires: z.string().optional(),
  dateLivraisonSouhaitee: z.string().min(1, "Date de livraison requise"),
})

export const updateDemandeStatusSchema = z.object({
  status: z.enum([
    "brouillon",
    "soumise",
    "en_attente_validation_conducteur",
    "en_attente_validation_logistique",
    "en_attente_validation_responsable_travaux",
    "en_attente_validation_charge_affaire",
    "en_attente_preparation_appro",
    "en_attente_reception_livreur",
    "en_attente_livraison",
    "en_attente_validation_finale_demandeur",
    "confirmee_demandeur",
    "cloturee",
    "rejetee",
    "archivee"
  ]),
  commentaire: z.string().optional(),
  rejetMotif: z.string().optional(),
})

// Types dérivés des schémas
export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type CreateProjetInput = z.infer<typeof createProjetSchema>
export type CreateArticleInput = z.infer<typeof createArticleSchema>
export type CreateDemandeInput = z.infer<typeof createDemandeSchema>
export type UpdateDemandeStatusInput = z.infer<typeof updateDemandeStatusSchema>

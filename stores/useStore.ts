import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User, Projet, Demande, Article, DemandeStatus } from '@/types'

// Interface pour l'historique
interface HistoryEntry {
  id: string
  action: string
  timestamp: Date
  userId: string
  details: any
}

// Interface pour les notifications
interface AppNotification {
  id: string
  title: string
  titre: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  lu: boolean
  timestamp: Date
  createdAt: Date
  demande?: {
    numero: string
    id: string
  }
  projet?: {
    nom: string
    id: string
  }
}

interface AppState {
  // Auth
  currentUser: User | null
  isAuthenticated: boolean
  token: string | null

  // Data
  users: User[]
  projets: Projet[]
  demandes: Demande[]
  articles: Article[]
  notifications: AppNotification[]
  history: HistoryEntry[]

  // UI State
  isLoading: boolean
  error: string | null
  
  // Cache pour éviter les appels multiples
  lastDemandesLoad: number
  isLoadingDemandes: boolean

  // Actions
  login: (phone: string, password: string) => Promise<boolean>
  logout: () => void
  loadUsers: () => Promise<void>
  loadProjets: () => Promise<void>
  loadDemandes: (filters?: any) => Promise<void>
  loadArticles: (filters?: any) => Promise<void>
  loadNotifications: () => Promise<void>
  startNotificationPolling: () => NodeJS.Timeout | undefined
  stopNotificationPolling: (intervalId: NodeJS.Timeout) => void
  loadHistory: (filters?: any) => Promise<void>
  createUser: (userData: any) => Promise<boolean>
  createProjet: (projetData: any) => Promise<boolean>
  createDemande: (demandeData: any) => Promise<boolean>
  executeAction: (demandeId: string, action: string, data?: any) => Promise<boolean>
  markNotificationAsRead: (id: string) => Promise<void>
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setDemandes: (demandes: Demande[]) => void
  setArticles: (articles: Article[]) => void
  addDemande: (demande: Demande) => void
  updateDemande: (id: string, demande: Demande) => void
  addNotification: (notification: AppNotification) => void
  addHistoryEntry: (entry: HistoryEntry) => void
  updateDemandeContent: (id: string, demandeData: any) => Promise<boolean>
  
  // Project Management Actions
  addUserToProject: (userId: string, projectId: string, role?: string) => Promise<boolean>
  removeUserFromProject: (userId: string, projectId: string) => Promise<boolean>
  updateUserRole: (userId: string, newRole: string) => Promise<boolean>
  updateProject: (projectId: string, projectData: any) => Promise<boolean>
  
  // Auto-validation et flow intelligent
  getNextStatusWithAutoValidation: (demande: Demande, currentStatus: DemandeStatus, action: string) => DemandeStatus | null
  canUserValidateStep: (userRole: string, demandeType: string, status: DemandeStatus) => boolean
  getValidationFlow: (demandeType: string) => DemandeStatus[]
  
  // Validation des demandes
  validateDemande: (demandeId: string, userId: string, commentaire?: string) => Promise<boolean>
  
  // Gestion des demandes orphelines
  transferOrphanedDemandes: (deletedUserId: string, deletedUserRole: string) => Promise<boolean>
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      token: null,
      users: [],
      projets: [],
      demandes: [],
      articles: [],
      notifications: [],
      history: [],
      isLoading: false,
      error: null,
      lastDemandesLoad: 0,
      isLoadingDemandes: false,

      login: async (identifier: string, password: string) => {
        set({ isLoading: true, error: null })

        try {
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ identifier, password }),
          })

          const result = await response.json()

          if (result.success) {
            set({
              currentUser: result.data.user,
              token: result.data.token,
              isAuthenticated: true,
              isLoading: false,
            })
            return true
          } else {
            set({ error: result.error, isLoading: false })
            return false
          }
        } catch (error) {
          console.error("Erreur de connexion:", error)
          set({ error: "Erreur de connexion", isLoading: false })
          return false
        }
      },

      logout: () => {
        set({
          currentUser: null,
          isAuthenticated: false,
          token: null,
          users: [],
          projets: [],
          demandes: [],
          notifications: [],
          history: [],
        })
      },

      loadUsers: async () => {
        const { token } = get()
        if (!token) return

        try {
          const response = await fetch("/api/users", {
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          })

          const result = await response.json()
          if (result.success) {
            // Transformer les données pour compatibilité frontend
            const transformedUsers = result.data.map((user: any) => ({
              ...user,
              // Transformer les projets du format API vers le format attendu
              projets: user.projets ? user.projets.map((p: any) => p.projet.id) : []
            }))
            
            console.log("🔧 [STORE] Transformation des projets utilisateurs:")
            transformedUsers.forEach((user: any) => {
              if (user.projets && user.projets.length > 0) {
                console.log(`  - ${user.nom}: projets = [${user.projets.join(', ')}]`)
              }
            })
            
            set({ users: transformedUsers })
          } else {
            // Si l'erreur est "Accès non autorisé", c'est normal pour certains rôles (employé)
            if (result.error === "Accès non autorisé") {
              console.log("⚠️ [STORE] Chargement utilisateurs non autorisé pour ce rôle (normal)")
              
              // Ajouter des utilisateurs de test pour le développement
              console.log("🔄 [STORE] Ajout des utilisateurs de test pour le développement")
              const testUsers = [
                {
                  id: "user-superadmin-1",
                  nom: "Admin",
                  prenom: "Super",
                  email: "superadmin@test.com",
                  telephone: "123456789",
                  role: "superadmin" as const,
                  statut: "actif",
                  projets: [],
                  isAdmin: true,
                  createdAt: new Date(),
                  updatedAt: new Date()
                },
                {
                  id: "user-appro-1",
                  nom: "Appro",
                  prenom: "Responsable",
                  email: "appro@test.com",
                  telephone: "123456789",
                  role: "responsable_appro" as const,
                  statut: "actif",
                  projets: ["projet-demo-1"],
                  isAdmin: false,
                  createdAt: new Date(),
                  updatedAt: new Date()
                },
                {
                  id: "user-livreur-1",
                  nom: "Livreur",
                  prenom: "Responsable",
                  email: "livreur@test.com",
                  telephone: "123456789",
                  role: "responsable_livreur" as const,
                  statut: "actif",
                  projets: ["projet-demo-1"],
                  isAdmin: false,
                  createdAt: new Date(),
                  updatedAt: new Date()
                },
                {
                  id: "user-conducteur-1",
                  nom: "Conducteur",
                  prenom: "Travaux",
                  email: "conducteur@test.com",
                  telephone: "123456789",
                  role: "conducteur_travaux" as const,
                  statut: "actif",
                  projets: ["projet-demo-1"],
                  isAdmin: false,
                  createdAt: new Date(),
                  updatedAt: new Date()
                },
                {
                  id: "user-employe-1",
                  nom: "Employé",
                  prenom: "Test",
                  email: "employe@test.com",
                  telephone: "123456789",
                  role: "employe" as const,
                  statut: "actif",
                  projets: ["projet-demo-1"],
                  isAdmin: false,
                  createdAt: new Date(),
                  updatedAt: new Date()
                }
              ]
              
              set({ users: testUsers })
              return
            }
            // Seulement logger les vraies erreurs
            console.error("Erreur API users:", result.error)
            set({ error: result.error })
          }
        } catch (error) {
          console.error("Erreur lors du chargement des utilisateurs:", error)
          set({ error: "Erreur lors du chargement des utilisateurs" })
        }
      },

      loadProjets: async () => {
        const { token, currentUser } = get()
        if (!token || !currentUser) {
          console.log("⏳ [STORE] Token ou utilisateur manquant pour charger les projets")
          return
        }

        try {
          console.log(`🔄 [STORE] Chargement des projets pour ${currentUser.nom} (${currentUser.role})`)
          
          const response = await fetch("/api/projets", {
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          })

          const result = await response.json()
          if (result.success) {
            console.log(`✅ [STORE] Projets chargés: ${result.data.length}`)
            set({ projets: result.data })
          } else {
            // Si l'erreur est liée à l'authentification, ne pas la traiter comme une erreur critique
            if (result.error === "Utilisateur non trouvé" || result.error === "Token invalide") {
              console.log("⚠️ [STORE] Problème d'authentification temporaire, rechargement des projets ignoré")
              return
            }
            
            // Logger l'erreur avec plus de détails
            console.error("❌ [STORE] Erreur API projets:", result.error)
            if (result.details) {
              console.error("📋 [STORE] Détails de l'erreur:", result.details)
            }
            
            // Ne pas bloquer l'application si les projets ne se chargent pas
            // Initialiser avec un tableau vide pour éviter les erreurs
            set({ projets: [], error: result.error })
          }
        } catch (error) {
          console.error("❌ [STORE] Erreur lors du chargement des projets:", error)
          // Initialiser avec un tableau vide en cas d'erreur
          set({ projets: [], error: "Erreur lors du chargement des projets" })
        }
      },

      loadDemandes: async (filters = {}) => {
        const { currentUser, token, isLoadingDemandes, lastDemandesLoad } = get()

        
        // Vérifier si un chargement est déjà en cours
        if (isLoadingDemandes) {
          console.log("⏳ [STORE] Chargement des demandes déjà en cours, abandon")
          return
        }
        
        // Éviter les appels trop fréquents (moins de 2 secondes)
        const now = Date.now()
        if (now - lastDemandesLoad < 2000) {
          console.log("⚡ [STORE] Chargement récent, utilisation du cache")
          return
        }
        
        console.log("🔄 [STORE] loadDemandes appelé - Connexion à l'API")
        
        if (!currentUser) {
          console.log("⚠️ [STORE] Aucun utilisateur connecté, abandon du chargement des demandes")
          return
        }

        if (!token) {
          console.log("⚠️ [STORE] Aucun token d'authentification, abandon du chargement des demandes")
          return
        }

        set({ isLoading: true, error: null, isLoadingDemandes: true })

        try {
          const response = await fetch('/api/demandes', {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
          })

          if (!response.ok) {
            if (response.status === 401) {
              throw new Error(`Non authentifié - Veuillez vous reconnecter`)
            }
            throw new Error(`Erreur HTTP: ${response.status}`)
          }

          const data = await response.json()
          
          if (data.success) {
            set({ 
              demandes: data.data || [], 
              isLoading: false, 
              error: null,
              isLoadingDemandes: false,
              lastDemandesLoad: Date.now()
            })
            console.log(`✅ [STORE] ${data.data?.length || 0} demandes chargées depuis l'API`)
          } else {
            throw new Error(data.error || 'Erreur lors du chargement des demandes')
          }
        } catch (error) {
          console.error("❌ [STORE] Erreur lors du chargement des demandes:", error)
          
          // Fallback vers des demandes de test pour le debug
          console.log("🔄 [STORE] Fallback vers demandes de test pour debug")
          
          const testDemandes: Demande[] = [
            // Demande 1 : À valider par le conducteur
            {
              id: "demande-test-a-valider",
              numero: "DA-DEBUG-001",
              projetId: "projet-demo-1",
              technicienId: "user-employe-1", // Créée par l'employé
              type: "materiel" as const,
              status: "en_attente_validation_conducteur" as const,
              dateCreation: new Date(),
              dateModification: new Date(),
              commentaires: "Demande matériel à valider par conducteur",
              items: [],
              validationLogistique: undefined,
              validationResponsableTravaux: undefined,
              validationConducteur: undefined,
              validationChargeAffaire: undefined,
              sortieAppro: undefined,
              validationLivreur: undefined,
              validationFinale: undefined,
              projet: undefined,
              technicien: undefined,
              nombreRejets: 0,
              statusPrecedent: undefined
            },
            // Demande 2 : Déjà validée par le conducteur (statut avancé)
            {
              id: "demande-test-validee",
              numero: "DA-DEBUG-002",
              projetId: "projet-demo-1",
              technicienId: "user-employe-2", // Créée par un autre employé
              type: "materiel" as const,
              status: "en_attente_validation_responsable_travaux" as const,
              dateCreation: new Date(Date.now() - 86400000), // Hier
              dateModification: new Date(),
              commentaires: "Demande matériel déjà validée par conducteur",
              items: [],
              validationLogistique: undefined,
              validationResponsableTravaux: undefined,
              validationConducteur: undefined, // Sera détectée par la logique de statut
              validationLivreur: undefined,
              validationChargeAffaire: undefined,
              sortieAppro: undefined,
              validationFinale: undefined,
              projet: undefined,
              technicien: undefined,
              nombreRejets: 0,
              statusPrecedent: undefined
            },
            // Demande 3 : Demande personnelle du conducteur en cours
            {
              id: "demande-test-personnelle",
              numero: "DA-DEBUG-003",
              projetId: "projet-demo-1",
              technicienId: "user-conducteur-1", // Créée par le conducteur lui-même
              type: "outillage" as const,
              status: "soumise" as const,
              dateCreation: new Date(),
              dateModification: new Date(),
              commentaires: "Ma demande personnelle d'outillage",
              items: [],
              validationLogistique: undefined,
              validationResponsableTravaux: undefined,
              validationConducteur: undefined,
              validationChargeAffaire: undefined,
              sortieAppro: undefined,
              validationLivreur: undefined,
              validationFinale: undefined,
              projet: undefined,
              technicien: undefined,
              nombreRejets: 0,
              statusPrecedent: undefined
            },
            // Demande 4 : Demande clôturée (validée complètement)
            {
              id: "demande-test-cloturee",
              numero: "DA-DEBUG-004",
              projetId: "projet-demo-1",
              technicienId: "user-employe-3", // Créée par un autre employé
              type: "materiel" as const,
              status: "cloturee" as const,
              dateCreation: new Date(Date.now() - 172800000), // Il y a 2 jours
              dateModification: new Date(),
              commentaires: "Demande matériel complètement traitée",
              items: [],
              validationLogistique: undefined,
              validationResponsableTravaux: undefined,
              validationConducteur: undefined, // Sera détectée par la logique de statut
              validationLivreur: undefined,
              validationChargeAffaire: undefined,
              sortieAppro: undefined,
              validationFinale: undefined,
              projet: undefined,
              technicien: undefined,
              nombreRejets: 0,
              statusPrecedent: undefined
            }
          ]

          set({ 
            demandes: testDemandes, 
            isLoading: false, 
            error: "Connexion à la base de données échouée - Mode debug activé",
            isLoadingDemandes: false,
            lastDemandesLoad: Date.now()
          })
        }
      },

      loadArticles: async (filters = {}) => {
        const { currentUser } = get()
        if (!currentUser) {
          console.warn("Tentative de chargement des articles sans utilisateur connecté")
          return
        }

        try {
          const params = new URLSearchParams()
          Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, String(value))
          })

          const response = await fetch(`/api/articles?${params}`, {
            headers: {
              "x-user-id": currentUser.id,
            },
          })

          const result = await response.json()
          if (result.success) {
            set({ articles: result.data })
          } else {
            console.error("Erreur API articles:", result.error)
            set({ error: result.error })
          }
        } catch (error) {
          console.error("Erreur lors du chargement des articles:", error)
          set({ error: "Erreur lors du chargement des articles" })
        }
      },

      loadNotifications: async () => {
    const { currentUser, token } = get()
    if (!currentUser || !token) return

    try {
      const response = await fetch("/api/notifications", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      })

      const result = await response.json()
      if (result.success) {
        set({ notifications: result.data })
      }
    } catch (error) {
      console.error("Erreur lors du chargement des notifications:", error)
    }
  },

  // Polling automatique des notifications (toutes les 30 secondes)
  startNotificationPolling: () => {
    const { currentUser, loadNotifications } = get()
    if (!currentUser) return

    // Charger immédiatement
    loadNotifications()

    // Puis toutes les 30 secondes
    const intervalId = setInterval(() => {
      const { currentUser } = get()
      if (currentUser) {
        loadNotifications()
      } else {
        clearInterval(intervalId)
      }
    }, 30000) // 30 secondes

    return intervalId
  },

  stopNotificationPolling: (intervalId: NodeJS.Timeout) => {
    clearInterval(intervalId)
  },

      loadHistory: async (filters = {}) => {
        const { currentUser } = get()
        if (!currentUser) return

        try {
          const params = new URLSearchParams()
          Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, String(value))
          })

          const response = await fetch(`/api/historique?${params}`, {
            headers: {
              "x-user-id": currentUser.id,
            },
          })

          const result = await response.json()
          if (result.success) {
            set({ history: result.data })
          }
        } catch (error) {
          console.error("Erreur lors du chargement de l'historique:", error)
        }
      },

      createUser: async (userData: any) => {
        const { currentUser, token } = get()
        if (!currentUser || !token) return false

        set({ isLoading: true, error: null })

        try {
          const response = await fetch("/api/users", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(userData),
          })

          const result = await response.json()
          if (result.success) {
            set((state) => ({
              users: [...state.users, result.data],
              isLoading: false,
            }))
            return true
          } else {
            set({ error: result.error, isLoading: false })
            return false
          }
        } catch (error) {
          console.error("Erreur création utilisateur:", error)
          set({ error: "Erreur lors de la création de l'utilisateur", isLoading: false })
          return false
        }
      },

      createProjet: async (projetData: any) => {
        const { currentUser, token } = get()
        if (!currentUser || !token) return false

        set({ isLoading: true, error: null })

        try {
          const response = await fetch("/api/projets", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(projetData),
          })

          const result = await response.json()
          if (result.success) {
            set((state) => ({
              projets: [...state.projets, result.data],
              isLoading: false,
            }))
            return true
          } else {
            set({ error: result.error, isLoading: false })
            return false
          }
        } catch (error) {
          console.error("Erreur création projet:", error)
          set({ error: "Erreur lors de la création du projet", isLoading: false })
          return false
        }
      },

      createDemande: async (demandeData: any) => {
        const { currentUser, token } = get()
        if (!currentUser || !token) return false

        set({ isLoading: true, error: null })

        try {
          const response = await fetch("/api/demandes", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(demandeData),
          })

          const result = await response.json()
          if (result.success) {
            set((state) => ({
              demandes: [...state.demandes, result.data],
              isLoading: false,
            }))
            return true
          } else {
            set({ error: result.error, isLoading: false })
            return false
          }
        } catch (error) {
          console.error("Erreur création demande:", error)
          set({ error: "Erreur lors de la création de la demande", isLoading: false })
          return false
        }
      },

      executeAction: async (demandeId: string, action: string, data = {}) => {
        const { currentUser, token, demandes } = get()
        if (!currentUser || !token) return false

        console.log(`[EXECUTE-ACTION] ${currentUser.nom} (${currentUser.role}) exécute "${action}" sur ${demandeId}`)

        // Trouver la demande concernée
        const demande = demandes.find(d => d.id === demandeId)
        if (!demande) {
          console.error("[EXECUTE-ACTION] Demande non trouvée:", demandeId)
          return false
        }

        console.log(`[EXECUTE-ACTION] Demande ${demande.numero}: statut=${demande.status}, demandeur=${demande.technicienId}`)

        // Calculer le prochain statut avec auto-validation
        let targetStatus = null
        if (action === "valider") {
          targetStatus = get().getNextStatusWithAutoValidation(demande, demande.status, action)
          console.log(`[AUTO-VALIDATION] Statut cible calculé: ${demande.status} → ${targetStatus}`)
        }

        try {
          const payload = {
            action,
            targetStatus, // Envoyer le statut cible au backend
            ...data
          }

          console.log("📤 [EXECUTE-ACTION] Payload:", JSON.stringify(payload, null, 2))

          const response = await fetch(`/api/demandes/${demandeId}/actions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          })

          console.log("📥 [EXECUTE-ACTION] Response status:", response.status)

          const result = await response.json()
          console.log("📥 [EXECUTE-ACTION] Response:", JSON.stringify(result, null, 2))

          if (result.success) {
            // Mettre à jour la demande dans le store
            set((state) => ({
              demandes: state.demandes.map((d) => (d.id === demandeId ? result.data.demande : d)),
              notifications: result.data.notification
                ? [result.data.notification, ...state.notifications]
                : state.notifications,
              history: result.data.historyEntry
                ? [result.data.historyEntry, ...state.history]
                : state.history,
            }))
            
            // Recharger automatiquement toutes les demandes pour s'assurer de la cohérence
            await get().loadDemandes()
            
            return true
          } else {
            set({ error: result.error })
            return false
          }
        } catch (error) {
          console.error("Erreur lors de l'exécution de l'action:", error)
          set({ error: "Erreur lors de l'exécution de l'action" })
          return false
        }
      },

      markNotificationAsRead: async (id: string) => {
        const { currentUser } = get()
        if (!currentUser) return

        try {
          const response = await fetch(`/api/notifications/${id}/read`, {
            method: "PUT",
            headers: {
              "x-user-id": currentUser.id,
            },
          })

          const result = await response.json()
          if (result.success) {
            set((state) => ({
              notifications: state.notifications.map((n) => (n.id === id ? { ...n, lu: true } : n)),
            }))
          }
        } catch (error) {
          console.error("Erreur lors de la mise à jour de la notification:", error)
        }
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),
      setError: (error: string | null) => set({ error }),
      setDemandes: (demandes: Demande[]) => set({ demandes }),
      setArticles: (articles: Article[]) => set({ articles }),
      addDemande: (demande: Demande) => set((state) => ({ demandes: [...state.demandes, demande] })),
      updateDemande: (id: string, demande: Demande) =>
        set((state) => ({
          demandes: state.demandes.map((d) => (d.id === id ? demande : d)),
        })),
      addNotification: (notification: AppNotification) =>
        set((state) => ({
          notifications: [notification, ...state.notifications],
        })),
      addHistoryEntry: (entry: HistoryEntry) =>
        set((state) => ({
          history: [entry, ...state.history],
        })),
      updateDemandeContent: async (id: string, demandeData: any) => {
        const { currentUser, token } = get()
        if (!currentUser || !token) return false

        set({ isLoading: true, error: null })

        try {
          const response = await fetch(`/api/demandes/${id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(demandeData),
          })

          const result = await response.json()
          if (result.success) {
            set((state) => ({
              demandes: state.demandes.map((d) => (d.id === id ? result.data : d)),
              isLoading: false,
            }))
            return true
          } else {
            set({ error: result.error, isLoading: false })
            return false
          }
        } catch (error) {
          console.error("Erreur mise à jour demande:", error)
          set({ error: "Erreur lors de la mise à jour de la demande", isLoading: false })
          return false
        }
      },

      // Project Management Functions
      addUserToProject: async (userId: string, projectId: string, role?: string) => {
        set({ isLoading: true, error: null })
        try {
          const token = get().token
          
          const response = await fetch(`/api/projets/${projectId}/add-user`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ userId }),
          })

          const result = await response.json()

          if (result.success) {
            // Mettre à jour localement après succès API
            set((state) => ({
              users: state.users.map((user) =>
                user.id === userId
                  ? { ...user, projets: [...(user.projets || []), projectId] }
                  : user
              ),
              isLoading: false,
            }))
            
            console.log(`✅ [API] Utilisateur ${userId} ajouté au projet ${projectId}`)
            return true
          } else {
            throw new Error(result.error || "Erreur lors de l'ajout")
          }
        } catch (error) {
          console.error("Erreur ajout utilisateur au projet:", error)
          set({ error: "Erreur lors de l'ajout de l'utilisateur au projet", isLoading: false })
          return false
        }
      },

      removeUserFromProject: async (userId: string, projectId: string) => {
        set({ isLoading: true, error: null })
        try {
          const token = get().token
          
          console.log(`🔄 [STORE] Retrait utilisateur ${userId} du projet ${projectId}`)
          
          const response = await fetch(`/api/projets/${projectId}/remove-user`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ userId }),
          })

          console.log(`📡 [STORE] Réponse HTTP status: ${response.status}`)
          
          const result = await response.json()
          console.log(`📦 [STORE] Résultat API:`, result)

          if (result.success) {
            // Mettre à jour localement après succès API
            set((state) => ({
              users: state.users.map((user) =>
                user.id === userId
                  ? { ...user, projets: (user.projets || []).filter(id => id !== projectId) }
                  : user
              ),
              isLoading: false,
            }))
            
            console.log(`✅ [STORE] Utilisateur ${userId} retiré du projet ${projectId}`)
            return true
          } else {
            console.error(`❌ [STORE] Échec API:`, result.error)
            console.error(`❌ [STORE] Détails:`, result.details)
            throw new Error(result.error || "Erreur lors de la suppression")
          }
        } catch (error) {
          console.error("❌ [STORE] Erreur suppression utilisateur du projet:", error)
          console.error("❌ [STORE] Type d'erreur:", error instanceof Error ? error.constructor.name : typeof error)
          console.error("❌ [STORE] Message:", error instanceof Error ? error.message : String(error))
          
          const errorMessage = error instanceof Error ? error.message : "Erreur lors de la suppression de l'utilisateur du projet"
          set({ error: errorMessage, isLoading: false })
          return false
        }
      },

      updateUserRole: async (userId: string, newRole: string) => {
        set({ isLoading: true, error: null })
        try {
          const token = get().token
          
          const response = await fetch(`/api/users/${userId}/update-role`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ newRole }),
          })

          const result = await response.json()

          if (result.success) {
            // Mettre à jour localement après succès API
            set((state) => ({
              users: state.users.map((user) =>
                user.id === userId ? { ...user, role: newRole as any } : user
              ),
              isLoading: false,
            }))
            
            console.log(`✅ [API] Rôle de l'utilisateur ${userId} mis à jour vers ${newRole}`)
            return true
          } else {
            throw new Error(result.error || "Erreur lors de la mise à jour du rôle")
          }
        } catch (error) {
          console.error("Erreur mise à jour rôle utilisateur:", error)
          set({ error: "Erreur lors de la mise à jour du rôle", isLoading: false })
          return false
        }
      },

      updateProject: async (projectId: string, projectData: any) => {
        set({ isLoading: true, error: null })
        try {
          const token = get().token
          
          const response = await fetch(`/api/projets/${projectId}/update`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(projectData),
          })

          const result = await response.json()

          if (result.success) {
            // Mettre à jour le projet localement
            set((state) => ({
              projets: state.projets.map((projet) =>
                projet.id === projectId ? { ...projet, ...projectData } : projet
              ),
              isLoading: false,
            }))
            
            console.log(`✅ [API] Projet ${projectId} mis à jour:`, projectData)
            return true
          } else {
            throw new Error(result.error || "Erreur lors de la mise à jour du projet")
          }
        } catch (error) {
          console.error("Erreur mise à jour projet:", error)
          set({ error: "Erreur lors de la mise à jour du projet", isLoading: false })
          return false
        }
      },

      // ===== SYSTÈME D'AUTO-VALIDATION INTELLIGENT =====
      
      getValidationFlow: (demandeType: string): DemandeStatus[] => {
        const flows: Record<string, DemandeStatus[]> = {
          "materiel": [
            "soumise",
            "en_attente_validation_conducteur",
            "en_attente_validation_responsable_travaux",
            "en_attente_validation_charge_affaire",
            "en_attente_preparation_appro",
            "en_attente_reception_livreur",
            "en_attente_livraison",
            "en_attente_validation_finale_demandeur",
            "cloturee"
          ],
          "outillage": [
            "soumise",
            "en_attente_validation_logistique",
            "en_attente_validation_responsable_travaux",
            "en_attente_validation_charge_affaire",
            "en_attente_preparation_appro",
            "en_attente_reception_livreur",
            "en_attente_livraison",
            "en_attente_validation_finale_demandeur",
            "cloturee"
          ]
        }
        return flows[demandeType] || []
      },

      canUserValidateStep: (userRole: string, demandeType: string, status: DemandeStatus): boolean => {
        const roleToStatusMap = {
          "conducteur_travaux": "en_attente_validation_conducteur",
          "responsable_logistique": "en_attente_validation_logistique",
          "responsable_travaux": "en_attente_validation_responsable_travaux",
          "charge_affaire": "en_attente_validation_charge_affaire",
          "responsable_appro": "en_attente_preparation_appro",
          "responsable_livreur": "en_attente_validation_livreur"
        }
        
        const statusForRole = roleToStatusMap[userRole as keyof typeof roleToStatusMap]
        if (!statusForRole) return false
        
        const flow = get().getValidationFlow(demandeType)
        return status === statusForRole && flow.includes(statusForRole)
      },

      getNextStatusWithAutoValidation: (demande: Demande, currentStatus: DemandeStatus, action: string): DemandeStatus | null => {
        if (action !== "valider") return null
        
        const flow = get().getValidationFlow(demande.type)
        const currentIndex = flow.indexOf(currentStatus)
        
        if (currentIndex === -1 || currentIndex >= flow.length - 1) return null
        
        let nextIndex = currentIndex + 1
        let nextStatus = flow[nextIndex]
        
        // Vérifier les auto-validations successives
        while (nextIndex < flow.length - 1) {
          const canAutoValidate = get().canUserValidateStep(
            demande.technicien?.role || "", 
            demande.type, 
            nextStatus
          )
          
          if (canAutoValidate) {
            console.log(`🔄 [AUTO-VALIDATION] ${demande.technicien?.nom} peut auto-valider l'étape: ${nextStatus}`)
            nextIndex++
            nextStatus = flow[nextIndex]
          } else {
            break
          }
        }
        
        return nextStatus
      },

      // ===== VALIDATION DES DEMANDES =====
      
      validateDemande: async (demandeId: string, userId: string, commentaire?: string): Promise<boolean> => {
        set({ isLoading: true, error: null })
        try {
          const { demandes, currentUser } = get()
          const demande = demandes.find(d => d.id === demandeId)
          
          if (!demande) {
            throw new Error("Demande non trouvée")
          }
          
          if (!currentUser) {
            throw new Error("Utilisateur non connecté")
          }
          
          // Vérifier si l'utilisateur peut valider cette étape
          const canValidate = get().canUserValidateStep(currentUser.role, demande.type, demande.status)
          if (!canValidate) {
            throw new Error("Vous n'êtes pas autorisé à valider cette étape")
          }
          
          // Créer la signature de validation
          const validationSignature = {
            userId: currentUser.id,
            user: currentUser,
            date: new Date(),
            commentaire: commentaire || "",
            signature: `validation_${currentUser.id}_${Date.now()}`
          }
          
          // Déterminer le prochain statut
          const nextStatus = get().getNextStatusWithAutoValidation(demande, demande.status, "valider")
          if (!nextStatus) {
            throw new Error("Impossible de déterminer le prochain statut")
          }
          
          // Mettre à jour la demande avec la validation
          const updatedDemande = { ...demande }
          updatedDemande.status = nextStatus
          updatedDemande.dateModification = new Date()
          
          // Ajouter la signature selon le rôle
          switch (currentUser.role) {
            case "conducteur_travaux":
              updatedDemande.validationConducteur = validationSignature
              break
            case "responsable_logistique":
              updatedDemande.validationLogistique = validationSignature
              break
            case "responsable_travaux":
              updatedDemande.validationResponsableTravaux = validationSignature
              break
            case "charge_affaire":
              updatedDemande.validationChargeAffaire = validationSignature
              break
            case "responsable_livreur":
              updatedDemande.validationLivreur = validationSignature
              break
          }
          
          // Mettre à jour le store
          set((state) => ({
            demandes: state.demandes.map((d) =>
              d.id === demandeId ? updatedDemande : d
            ),
            isLoading: false,
          }))
          
          // TODO: Ajouter une entrée dans l'historique (à implémenter avec la bonne structure)
          // const historyEntry = { ... }
          // get().addHistoryEntry(historyEntry)
          
          console.log(`✅ [VALIDATION] Demande ${demande.numero} validée par ${currentUser.prenom} ${currentUser.nom}`)
          console.log(`📊 [VALIDATION] Statut: ${demande.status} → ${nextStatus}`)
          
          return true
          
        } catch (error) {
          console.error("❌ [VALIDATION] Erreur lors de la validation:", error)
          set({ error: error instanceof Error ? error.message : "Erreur lors de la validation", isLoading: false })
          return false
        }
      },

      // ===== GESTION DES DEMANDES ORPHELINES =====
      
      transferOrphanedDemandes: async (deletedUserId: string, deletedUserRole: string): Promise<boolean> => {
        const { users, demandes } = get()
        
        try {
          // Trouver un utilisateur de remplacement avec le même rôle
          const replacementUser = users.find(u => 
            u.role === deletedUserRole && 
            u.id !== deletedUserId &&
            u.isAdmin !== true // Éviter les admins pour les remplacements
          )
          
          if (!replacementUser) {
            console.warn(`⚠️ [STORE] Aucun utilisateur de remplacement trouvé pour le rôle: ${deletedUserRole}`)
            return false
          }
          
          // Trouver les demandes créées par l'utilisateur supprimé
          const orphanedDemandes = demandes.filter(d => d.technicienId === deletedUserId)
          
          if (orphanedDemandes.length > 0) {
            console.log(`🔄 [STORE] Transfert de ${orphanedDemandes.length} demandes orphelines vers ${replacementUser.nom}`)
            
            // Mettre à jour les demandes localement
            set((state) => ({
              demandes: state.demandes.map(d => 
                d.technicienId === deletedUserId 
                  ? { ...d, technicienId: replacementUser.id, technicien: replacementUser }
                  : d
              )
            }))
            
            console.log(`✅ [STORE] ${orphanedDemandes.length} demandes transférées avec succès`)
          }
          
          // TODO: En production, appeler l'API pour persister le transfert
          // await fetch('/api/demandes/transfer-orphaned', {
          //   method: 'POST',
          //   body: JSON.stringify({ deletedUserId, replacementUserId: replacementUser.id })
          // })
          
          return true
          
        } catch (error) {
          console.error("❌ [STORE] Erreur lors du transfert des demandes orphelines:", error)
          return false
        }
      },
    }),
    {
      name: "gestion-demandes-achat-storage",
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        token: state.token,
      }),
    },
  ),
)

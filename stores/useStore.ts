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
  
  // Hydratation - pour résoudre le problème de mismatch SSR/Client
  _hasHydrated: boolean
  setHasHydrated: (state: boolean) => void

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
  deleteDemande: (id: string) => Promise<boolean>
  
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
      
      // État d'hydratation
      _hasHydrated: false,
      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),

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
            
            set({ users: transformedUsers })
          } else {
            if (result.error === "Accès non autorisé" || result.error === "Utilisateur non trouvé") {
              return
            }
            set({ error: result.error })
          }
        } catch (error) {
          set({ error: "Erreur lors du chargement des utilisateurs" })
        }
      },

      loadProjets: async () => {
        const { token, currentUser } = get()
        if (!token || !currentUser) {
          return
        }

        try {
          const response = await fetch("/api/projets", {
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          })

          const result = await response.json()
          if (result.success) {
            set({ projets: result.data })
          } else {
            // Si l'erreur est liée à l'authentification, ne pas la traiter comme une erreur critique
            if (result.error === "Utilisateur non trouvé" || result.error === "Token invalide") {
              return
            }
            
            set({ projets: [], error: result.error })
          }
        } catch (error) {
          set({ projets: [], error: "Erreur lors du chargement des projets" })
        }
      },

      loadDemandes: async (filters = {}) => {
        const { currentUser, token, isLoadingDemandes, lastDemandesLoad } = get()

        
        // Vérifier si un chargement est déjà en cours
        if (isLoadingDemandes) {
          return
        }
        
        // Éviter les appels trop fréquents (moins de 10 secondes)
        // OPTIMISÉ: Augmenté de 2s à 10s pour réduire les appels API sur Vercel
        const now = Date.now()
        if (now - lastDemandesLoad < 10000) {
          return
        }
        
        if (!currentUser || !token) {
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
              set({ 
                currentUser: null, 
                token: null, 
                isLoading: false,
                isLoadingDemandes: false,
                error: "Session expirée - Veuillez vous reconnecter"
              })
              
              // Rediriger vers la page d'accueil (qui affiche le formulaire de connexion)
              if (typeof window !== 'undefined') {
                window.location.href = '/'
              }
              
              return
            }
            
            // Pour les erreurs 500, essayer de lire les détails
            if (response.status === 500) {
              try {
                const errorData = await response.json()
                throw new Error(`Erreur serveur: ${errorData.details || errorData.error || 'Erreur inconnue'}`)
              } catch (parseError) {
                throw new Error(`Erreur HTTP: ${response.status}`)
              }
            }
            
            throw new Error(`Erreur HTTP: ${response.status}`)
          }

          const data = await response.json()
          
          if (data.success) {
            const demandes = data.data || []
            set({ 
              demandes: demandes, 
              isLoading: false, 
              error: null,
              isLoadingDemandes: false,
              lastDemandesLoad: Date.now()
            })
          } else {
            throw new Error(data.error || 'Erreur lors du chargement des demandes')
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
          
          set({ 
            isLoading: false, 
            isLoadingDemandes: false,
            error: errorMessage
          })
        }
      },

      loadArticles: async (filters = {}) => {
        const { currentUser, token } = get()
        if (!currentUser) return

        try {
          const params = new URLSearchParams()
          Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, String(value))
          })

          const response = await fetch(`/api/articles?${params}`, {
            headers: {
              "Authorization": token ? `Bearer ${token}` : "",
              "x-user-id": currentUser.id,
            },
          })

          const contentType = response.headers.get('content-type')
          if (!contentType || !contentType.includes('application/json')) return

          const result = await response.json()
          if (result.success) {
            set({ articles: result.data })
          }
        } catch (error) {
          // Ignorer silencieusement
        }
      },

      loadNotifications: async () => {
    const { currentUser, token } = get()
    if (!currentUser) return

    try {
      const response = await fetch("/api/notifications", {
        headers: {
          "Authorization": token ? `Bearer ${token}` : "",
          "x-user-id": currentUser.id,
        },
      })

      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) return

      const result = await response.json()
      if (result.success) {
        set({ notifications: result.data })
      }
    } catch (error) {
      // Ignorer silencieusement
    }
  },

  // Polling automatique des notifications
  // OPTIMISÉ: Intervalle augmenté à 120s pour réduire les appels API sur Vercel
  startNotificationPolling: () => {
    const { currentUser, loadNotifications } = get()
    if (!currentUser?.id) return

    // Charger immédiatement
    loadNotifications()

    // Puis toutes les 120 secondes (optimisé pour réduire les appels API)
    const intervalId = setInterval(() => {
      const { currentUser } = get()
      if (currentUser?.id) {
        loadNotifications()
      } else {
        clearInterval(intervalId)
      }
    }, 120000) // 120 secondes (2 minutes)

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
          // Ignorer silencieusement
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
          set({ error: "Erreur lors de la création de la demande", isLoading: false })
          return false
        }
      },

      executeAction: async (demandeId: string, action: string, data = {}) => {
        const { currentUser, token, demandes } = get()
        if (!currentUser || !token) return false

        const demande = demandes.find(d => d.id === demandeId)
        if (!demande) return false

        // Calculer le prochain statut avec auto-validation
        let targetStatus = null
        if (action === "valider") {
          targetStatus = get().getNextStatusWithAutoValidation(demande, demande.status, action)
        }

        try {
          const payload = {
            action,
            targetStatus,
            ...data
          }

          const response = await fetch(`/api/demandes/${demandeId}/actions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
          })

          const result = await response.json()

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
          // Ignorer silencieusement
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
          set({ error: "Erreur lors de la mise à jour de la demande", isLoading: false })
          return false
        }
      },

      deleteDemande: async (id: string) => {
        const { currentUser, token } = get()
        if (!currentUser || !token) return false

        set({ isLoading: true, error: null })

        try {
          const response = await fetch(`/api/demandes/${id}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
          })

          const result = await response.json()
          if (result.success) {
            set((state) => ({
              demandes: state.demandes.filter((d) => d.id !== id),
              isLoading: false,
            }))
            return true
          } else {
            set({ error: result.error, isLoading: false })
            return false
          }
        } catch (error) {
          set({ error: "Erreur lors de la suppression de la demande", isLoading: false })
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
            
            return true
          } else {
            throw new Error(result.error || "Erreur lors de l'ajout")
          }
        } catch (error) {
          set({ error: "Erreur lors de l'ajout de l'utilisateur au projet", isLoading: false })
          return false
        }
      },

      removeUserFromProject: async (userId: string, projectId: string) => {
        set({ isLoading: true, error: null })
        try {
          const token = get().token
          
          const response = await fetch(`/api/projets/${projectId}/remove-user`, {
            method: "DELETE",
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
                  ? { ...user, projets: (user.projets || []).filter((id) => id !== projectId) }
                  : user
              ),
              isLoading: false,
            }))
            
            return true
          } else {
            throw new Error(result.error || "Erreur lors de la suppression")
          }
        } catch (error) {
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
            
            return true
          } else {
            throw new Error(result.error || "Erreur lors de la mise à jour du rôle")
          }
        } catch (error) {
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
            
            return true
          } else {
            throw new Error(result.error || "Erreur lors de la mise à jour du projet")
          }
        } catch (error) {
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
            "en_attente_preparation_logistique",
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
          
          return true
          
        } catch (error) {
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
            return false
          }
          
          // Trouver les demandes créées par l'utilisateur supprimé
          const orphanedDemandes = demandes.filter(d => d.technicienId === deletedUserId)
          
          if (orphanedDemandes.length > 0) {
            
            // Mettre à jour les demandes localement
            set((state) => ({
              demandes: state.demandes.map(d => 
                d.technicienId === deletedUserId 
                  ? { ...d, technicienId: replacementUser.id, technicien: replacementUser }
                  : d
              )
            }))
            
          }
          
          // TODO: En production, appeler l'API pour persister le transfert
          // await fetch('/api/demandes/transfer-orphaned', {
          //   method: 'POST',
          //   body: JSON.stringify({ deletedUserId, replacementUserId: replacementUser.id })
          // })
          
          return true
          
        } catch (error) {
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
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Validation: si currentUser est null, forcer isAuthenticated à false
          if (!state.currentUser && state.isAuthenticated) {
            state.isAuthenticated = false
            state.token = null
          }
          state.setHasHydrated(true)
        }
      },
    },
  ),
)

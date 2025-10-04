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
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  timestamp: Date
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

  // Actions
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  loadUsers: () => Promise<void>
  loadProjets: () => Promise<void>
  loadDemandes: (filters?: any) => Promise<void>
  loadArticles: (filters?: any) => Promise<void>
  loadNotifications: () => Promise<void>
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

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null })

        try {
          const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
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
        const { currentUser, token } = get()
        if (!currentUser || !token) {
          console.warn("Tentative de chargement des utilisateurs sans utilisateur connecté")
          return
        }

        try {
          const response = await fetch("/api/users", {
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          })

          const result = await response.json()
          if (result.success) {
            set({ users: result.data })
          } else {
            console.error("Erreur API users:", result.error)
            set({ error: result.error })
          }
        } catch (error) {
          console.error("Erreur lors du chargement des utilisateurs:", error)
          set({ error: "Erreur lors du chargement des utilisateurs" })
        }
      },

      loadProjets: async () => {
        const { currentUser, token } = get()
        if (!currentUser || !token) {
          console.warn("Tentative de chargement des projets sans utilisateur connecté")
          return
        }

        try {
          console.log("Chargement des projets pour l'utilisateur:", currentUser.id)
          const response = await fetch("/api/projets", {
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          })

          const result = await response.json()
          if (result.success) {
            console.log("Projets chargés:", result.data.length)
            set({ projets: result.data })
          } else {
            console.error("Erreur API projets:", result.error)
            set({ error: result.error })
          }
        } catch (error) {
          console.error("Erreur lors du chargement des projets:", error)
          set({ error: "Erreur lors du chargement des projets" })
        }
      },

      loadDemandes: async (filters = {}) => {
        const { currentUser, token } = get()
        if (!currentUser || !token) {
          console.warn("Tentative de chargement des demandes sans utilisateur connecté")
          return
        }

        try {
          console.log("🔄 [LOCAL MODE] Chargement des demandes pour l'utilisateur:", currentUser.nom, currentUser.prenom)
          
          // Mode local - Simulation des demandes
          const localDemandes = [
            {
              id: "demande-1",
              numero: "DA-2024-001",
              projetId: "projet-1",
              projet: {
                id: "projet-1",
                nom: "Rénovation Bâtiment A",
                description: "Rénovation complète du bâtiment A",
                dateDebut: new Date("2024-01-01"),
                dateFin: new Date("2024-12-31"),
                createdBy: "user-1",
                utilisateurs: ["user-1", "user-2", "user-3"],
                actif: true,
                createdAt: new Date("2024-01-01")
              },
              technicienId: currentUser.id, // Assigné à l'utilisateur actuel
              type: "materiel" as const,
              items: [
                {
                  id: "item-1",
                  articleId: "article-1",
                  quantiteDemandee: 10,
                  quantiteValidee: 10,
                  quantiteSortie: 10,
                  quantiteRecue: 10,
                  commentaire: "Livré complet"
                }
              ],
              status: "confirmee_demandeur" as const,
              dateCreation: new Date("2024-01-15"),
              dateModification: new Date("2024-01-20"),
              commentaires: "Demande de matériel pour rénovation",
              validationLogistique: undefined,
              validationResponsableTravaux: undefined
            },
            {
              id: "demande-2", 
              numero: "DA-2024-002",
              projetId: "projet-1",
              projet: {
                id: "projet-1",
                nom: "Rénovation Bâtiment A",
                description: "Rénovation complète du bâtiment A",
                dateDebut: new Date("2024-01-01"),
                dateFin: new Date("2024-12-31"),
                createdBy: "user-1",
                utilisateurs: ["user-1", "user-2", "user-3"],
                actif: true,
                createdAt: new Date("2024-01-01")
              },
              technicienId: currentUser.id, // Assigné à l'utilisateur actuel
              type: "outillage" as const,
              items: [
                {
                  id: "item-2",
                  articleId: "article-2", 
                  quantiteDemandee: 5,
                  quantiteValidee: 5,
                  quantiteSortie: 5,
                  commentaire: "En cours de livraison"
                }
              ],
              status: "en_attente_validation_finale_demandeur" as const,
              dateCreation: new Date("2024-01-16"),
              dateModification: new Date("2024-01-21"),
              commentaires: "Demande d'outillage spécialisé",
              validationLogistique: undefined,
              validationResponsableTravaux: undefined
            }
          ]

          // Filtrer selon le rôle et les permissions
          let filteredDemandes = [...localDemandes]

          switch (currentUser.role) {
            case "superadmin":
              // Voit toutes les demandes
              break
            case "employe":
              // Voit ses propres demandes
              filteredDemandes = localDemandes.filter(d => d.technicienId === currentUser.id)
              break
            default:
              // Autres rôles voient les demandes de leurs projets
              filteredDemandes = localDemandes.filter(d => 
                currentUser.projets && currentUser.projets.includes(d.projetId)
              )
          }

          // Appliquer les filtres
          if (filters.status) {
            filteredDemandes = filteredDemandes.filter(d => d.status === filters.status)
          }
          if (filters.type) {
            filteredDemandes = filteredDemandes.filter(d => d.type === filters.type)
          }

          console.log(`✅ [LOCAL MODE] ${filteredDemandes.length} demandes chargées pour ${currentUser.role}`)
          set({ demandes: filteredDemandes })

        } catch (error) {
          console.error("❌ [LOCAL MODE] Erreur lors du chargement des demandes:", error)
          set({ error: "Erreur lors du chargement des demandes" })
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
        const { currentUser } = get()
        if (!currentUser) return

        try {
          const response = await fetch("/api/notifications", {
            headers: {
              "x-user-id": currentUser.id,
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
        const { currentUser, token } = get()
        if (!currentUser || !token) return false

        try {
          const response = await fetch(`/api/demandes/${demandeId}/actions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ action, ...data }),
          })

          const result = await response.json()
          if (result.success) {
            // Mettre à jour la demande dans le store ET recharger toutes les demandes
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
          // Pour l'instant, fonctionnement en mode local
          // TODO: Implémenter l'API /api/projects/add-user
          
          // Simulation d'un délai API
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Mettre à jour l'utilisateur localement
          set((state) => ({
            users: state.users.map((user) =>
              user.id === userId
                ? { ...user, projets: [...(user.projets || []), projectId], role: (role as any) || user.role }
                : user
            ),
            isLoading: false,
          }))
          
          console.log(`✅ [LOCAL] Utilisateur ${userId} ajouté au projet ${projectId} avec le rôle ${role || 'employe'}`)
          return true
          
        } catch (error) {
          console.error("Erreur ajout utilisateur au projet:", error)
          set({ error: "Erreur lors de l'ajout de l'utilisateur au projet", isLoading: false })
          return false
        }
      },

      removeUserFromProject: async (userId: string, projectId: string) => {
        set({ isLoading: true, error: null })
        try {
          // Pour l'instant, fonctionnement en mode local
          // TODO: Implémenter l'API /api/projects/remove-user
          
          // Simulation d'un délai API
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Mettre à jour l'utilisateur localement
          set((state) => ({
            users: state.users.map((user) =>
              user.id === userId
                ? { ...user, projets: (user.projets || []).filter(id => id !== projectId) }
                : user
            ),
            isLoading: false,
          }))
          
          console.log(`✅ [LOCAL] Utilisateur ${userId} retiré du projet ${projectId}`)
          return true
          
        } catch (error) {
          console.error("Erreur suppression utilisateur du projet:", error)
          set({ error: "Erreur lors de la suppression de l'utilisateur du projet", isLoading: false })
          return false
        }
      },

      updateUserRole: async (userId: string, newRole: string) => {
        set({ isLoading: true, error: null })
        try {
          // Pour l'instant, fonctionnement en mode local
          // TODO: Implémenter l'API /api/users/update-role
          
          // Simulation d'un délai API
          await new Promise(resolve => setTimeout(resolve, 300))
          
          // Mettre à jour l'utilisateur localement
          set((state) => ({
            users: state.users.map((user) =>
              user.id === userId ? { ...user, role: newRole as any } : user
            ),
            isLoading: false,
          }))
          
          console.log(`✅ [LOCAL] Rôle de l'utilisateur ${userId} mis à jour vers ${newRole}`)
          return true
          
        } catch (error) {
          console.error("Erreur mise à jour rôle utilisateur:", error)
          set({ error: "Erreur lors de la mise à jour du rôle", isLoading: false })
          return false
        }
      },

      updateProject: async (projectId: string, projectData: any) => {
        set({ isLoading: true, error: null })
        try {
          // Pour l'instant, fonctionnement en mode local
          // TODO: Implémenter l'API /api/projects/update
          
          // Simulation d'un délai API
          await new Promise(resolve => setTimeout(resolve, 400))
          
          // Mettre à jour le projet localement
          set((state) => ({
            projets: state.projets.map((projet) =>
              projet.id === projectId ? { ...projet, ...projectData } : projet
            ),
            isLoading: false,
          }))
          
          console.log(`✅ [LOCAL] Projet ${projectId} mis à jour:`, projectData)
          return true
          
        } catch (error) {
          console.error("Erreur mise à jour projet:", error)
          set({ error: "Erreur lors de la mise à jour du projet", isLoading: false })
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

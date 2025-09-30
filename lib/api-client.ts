import { useStore } from "@/stores/useStore"

/**
 * Client API avec authentification automatique
 */
export class ApiClient {
  private static getAuthHeaders(): HeadersInit {
    const { token } = useStore.getState()
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    }
  }

  static async get(url: string): Promise<Response> {
    return fetch(url, {
      method: 'GET',
      headers: this.getAuthHeaders()
    })
  }

  static async post(url: string, data?: any): Promise<Response> {
    return fetch(url, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined
    })
  }

  static async put(url: string, data?: any): Promise<Response> {
    return fetch(url, {
      method: 'PUT',
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined
    })
  }

  static async delete(url: string, data?: any): Promise<Response> {
    return fetch(url, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined
    })
  }

  static async patch(url: string, data?: any): Promise<Response> {
    return fetch(url, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: data ? JSON.stringify(data) : undefined
    })
  }
}

/**
 * Hook pour faire des requêtes authentifiées
 */
export function useAuthenticatedFetch() {
  const { token } = useStore()

  const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token && { 'Authorization': `Bearer ${token}` })
    }

    return fetch(url, {
      ...options,
      headers
    })
  }

  return authenticatedFetch
}

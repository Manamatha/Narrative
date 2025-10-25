import { useEffect } from 'react'
import { getMemoryManager } from '@/app/utils/memoryManager'

/**
 * Hook pour synchroniser l'authentification avec le MemoryManager
 * Récupère l'userId depuis le serveur et le définit dans le MemoryManager
 * @param {boolean} isAuthenticated - État d'authentification de l'utilisateur
 */
export function useSyncSessions(isAuthenticated) {
  useEffect(() => {
    if (!isAuthenticated) {
      // L'utilisateur s'est déconnecté
      const manager = getMemoryManager()
      manager.setUserId(null)
      return
    }

    // L'utilisateur est authentifié, récupérer son userId depuis le serveur
    async function syncUserId() {
      try {
        const response = await fetch('/api/auth/pin', {
          method: 'GET',
          credentials: 'include'
        })

        if (!response.ok) {
          console.warn('Impossible de récupérer l\'userId')
          return
        }

        const data = await response.json()
        if (data.ok && data.userId) {
          const manager = getMemoryManager()
          manager.setUserId(data.userId)
          console.log(`✅ userId synchronisé: ${data.userId}`)
        }
      } catch (err) {
        console.error('Erreur sync userId:', err)
      }
    }

    syncUserId()
  }, [isAuthenticated])
}

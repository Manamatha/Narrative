import { useEffect, useRef } from 'react'
import { getMemoryManager } from '@/app/utils/memoryManager'

/**
 * Hook pour synchroniser les sessions entre appareils
 * Synchronise seulement quand il y a un changement
 *
 * @param {boolean} enabled - Activer/désactiver la synchronisation
 */
export function useSyncSessions(enabled = true) {
  const syncTimeoutRef = useRef(null)
  const lastSyncRef = useRef(new Date(0))

  useEffect(() => {
    if (!enabled) return

    // Écouter les changements de sessions
    const handleSessionChange = async () => {
      // Attendre 500ms avant de synchroniser (debounce)
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }

      syncTimeoutRef.current = setTimeout(async () => {
        try {
          const memoryManager = getMemoryManager()
          await memoryManager.syncFromServer()
          lastSyncRef.current = new Date()
        } catch (err) {
          console.error('Erreur synchronisation sessions:', err)
        }
      }, 500)
    }

    // Synchroniser immédiatement au chargement
    handleSessionChange()

    // Écouter les changements dans memoryManager
    const memoryManager = getMemoryManager()
    const originalSave = memoryManager.saveSessionToServer.bind(memoryManager)

    memoryManager.saveSessionToServer = async function(sessionId) {
      const result = await originalSave(sessionId)
      // Après sauvegarde, synchroniser les autres appareils
      handleSessionChange()
      return result
    }

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current)
      }
    }
  }, [enabled])

  return {
    lastSync: lastSyncRef.current,
    isEnabled: enabled
  }
}


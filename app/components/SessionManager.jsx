'use client'
import { useState, useEffect } from 'react'
import { getMemoryManager } from '@/app/utils/memoryManager'

export default function SessionManager({ isOpen, onClose, onSessionChange }) {
  const [sessions, setSessions] = useState([])
  const [newSessionName, setNewSessionName] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadSessions()
    }
  }, [isOpen])

  const loadSessions = () => {
    const memoryManager = getMemoryManager()
    setSessions(memoryManager.getSessionsList())
  }

  const createNewSession = async () => { // ← ajouter async
  if (!newSessionName.trim()) return
  
  const memoryManager = getMemoryManager()
  const sessionId = memoryManager.createNewSession(newSessionName)

  // ✅ sauvegarde immédiate sur le serveur
  await memoryManager.saveToServer()

  setNewSessionName('')
  loadSessions()
  onSessionChange(sessionId)
  onClose()
}


  const switchToSession = async (sessionId) => {
  const memoryManager = getMemoryManager()

  // 1️⃣ sauvegarde les messages de la session actuelle
  if (memoryManager.currentSessionId) {
    memoryManager.sessions[memoryManager.currentSessionId].campaign.messages = messages
    await memoryManager.saveToServer()
  }

  // 2️⃣ changer de session
  memoryManager.switchSession(sessionId)

  // 3️⃣ charger les messages de la nouvelle session
  setMessages(memoryManager.sessions[sessionId]?.campaign?.messages || [])

  // 4️⃣ notifier le parent
  onSessionChange(sessionId)

  // 5️⃣ fermer le modal
  onClose()
}


  const deleteSession = async (sessionId, e) => {
    e.stopPropagation()
    const memoryManager = getMemoryManager()
    const currentSessionId = memoryManager.currentSessionId

    // ✅ Demande de confirmation avant suppression
    if (!confirm('Supprimer cette session ? Les données seront perdues.')) return

    // Supprimer la session
    memoryManager.deleteSession(sessionId)
    await memoryManager.saveToServer()

    // Recharger la liste mise à jour
    const updatedSessions = memoryManager.getSessionsList()
    setSessions(updatedSessions)

    // ⚠️ Si la session supprimée était celle en cours
    if (sessionId === currentSessionId) {
      if (updatedSessions.length > 0) {
        // 👉 Bascule sur la première session restante
        const newSessionId = updatedSessions[0].id
        memoryManager.switchSession(newSessionId)
        onSessionChange(newSessionId)
      } else {
        // 🔥 Plus aucune session → création d'une nouvelle
        const defaultId = memoryManager.createNewSession('Nouvelle Aventure')
        onSessionChange(defaultId)
      }
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="bg-gray-900 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">📁 Gestion des Sessions</h2>
          <button onClick={onClose} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded">
            Fermer
          </button>
        </div>

        <div className="p-4">
          <div className="mb-6 p-4 bg-gray-700 rounded">
            <h3 className="text-lg font-bold mb-2">Créer une nouvelle session</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSessionName}
                onChange={(e) => setNewSessionName(e.target.value)}
                placeholder="Nom de la nouvelle aventure..."
                className="flex-1 p-2 bg-gray-600 rounded"
                onKeyPress={(e) => e.key === 'Enter' && createNewSession()}
              />
              <button 
                onClick={createNewSession}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
              >
                Créer
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-bold mb-2">Sessions existantes</h3>
            {sessions.length === 0 ? (
              <p className="text-gray-400 text-center py-4">Aucune session</p>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={async () => await switchToSession(session.id)}
                  className="p-3 bg-gray-700 rounded hover:bg-gray-600 cursor-pointer flex justify-between items-center"
                >
                  <div className="flex-1">
                    <div className="font-medium">{session.name}</div>
                    <div className="text-sm text-gray-400">
                      Créé le {new Date(session.createdAt).toLocaleDateString()} • 
                      Dernier accès: {new Date(session.lastAccessed).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-xs bg-purple-600 px-2 py-1 rounded">
                      {session.campaign.chapitres.length} chapitres
                    </span>
                    {sessions.length > 1 && (
                      <button
                        onClick={(e) => deleteSession(session.id, e)}
                        className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-sm"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

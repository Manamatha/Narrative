'use client'
import { useState, useEffect, useRef } from 'react'
import MemoryManager from './components/MemoryManager'
import SessionManager from './components/SessionManager'
import PINLogin from './components/PINLogin'
import { getMemoryManager } from './utils/memoryManager'
import { useSyncSessions } from './hooks/useSyncSessions'

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isMemoryOpen, setIsMemoryOpen] = useState(false)
  const [isSessionsOpen, setIsSessionsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [currentSession, setCurrentSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState(null)
  const chatRef = useRef(null)

  // Synchroniser les sessions entre appareils (seulement quand il y a un changement)
  useSyncSessions(isAuthenticated)

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages])

  // Vérifier l'authentification au chargement via cookie session
  useEffect(() => {
    async function check() {
      try {
        const res = await fetch('/api/auth/pin')
        if (res.ok) {
          const data = await res.json()
          if (data.ok) {
            setIsAuthenticated(true)
          } else {
            setIsAuthenticated(false)
          }
        } else {
          setIsAuthenticated(false)
        }
      } catch (err) {
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }
    check()
  }, [])

  // Charger les données une fois authentifié
  useEffect(() => {
    if (!isAuthenticated) return
    const memoryManager = getMemoryManager()
    async function init() {
      try {
        // server-side will determine user via cookie
        await memoryManager.loadFromServer() // adapted to load without explicit userId
      } catch (err) {
        console.warn('Échec chargement serveur, utilisation du local:', err)
      }
      setCurrentSession(memoryManager.currentSessionId)
      setMessages(memoryManager.getSessionMessages() || [])
      setIsLoading(false)
    }
    init()
  }, [isAuthenticated])



const handleLoginSuccess = () => {
  // server has set cookie on login
  setIsAuthenticated(true)
}

const handleLogout = async () => {
  // Appeler le serveur pour supprimer le token
  try {
    await fetch('/api/auth/logout', { method: 'POST' })
  } catch (err) {
    console.error('Erreur déconnexion:', err)
  }

  // Nettoyer l'état client
  setIsAuthenticated(false)
  setMessages([])
  setCurrentSession(null)
}

const handleSessionChange = (sessionId) => {
  const memoryManager = getMemoryManager()

  // 💾 Sauvegarde les messages actuels dans la session en cours
  if (currentSession) {
    memoryManager.setSessionMessages(messages, currentSession)
  }

  // 🔁 Bascule vers la nouvelle session
  memoryManager.switchSession(sessionId)
  setCurrentSession(sessionId)

  // 📥 Charge les messages de la nouvelle session
  const newMessages = memoryManager.getSessionMessages(sessionId)
  setMessages(newMessages)
}


  const sendMessage = async () => {
    if (!inputMessage.trim() || isSending) return
    setIsSending(true)
    setError(null)
    const memoryManager = getMemoryManager()
    const newMessages = [...messages, { role: 'user', content: inputMessage }]
    setMessages(newMessages)
    if (currentSession) {
      memoryManager.sessions[currentSession].campaign.messages = newMessages
    }
    const backup = inputMessage
    setInputMessage('')

    try {
      const token = localStorage.getItem('authToken')

      const response = await fetch('/api/chat-ai-memory', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
        body: JSON.stringify({
          messages: newMessages,
          allowMemoryWrite: true,
          sessionId: currentSession,
        }),
      })

      if (!response.ok) throw new Error(`Erreur serveur: ${response.status}`)
      const data = await response.json()
      if (data.error) throw new Error(data.error)

      if (data.response) {
  const finalMessages = [...newMessages, { role: 'assistant', content: data.response }]
  setMessages(finalMessages)
  if (currentSession) {
    memoryManager.setSessionMessages(finalMessages, currentSession)
    await memoryManager.saveSessionToServer(currentSession) // ☁️ sauvegarde sur le serveur
  }
}

    } catch (err) {
      console.error(err)
      setError(err.message || 'Erreur de connexion')
      setInputMessage(backup)
    } finally {
      setIsSending(false)
    }
  }

  const getCurrentSessionName = () => {
    const memoryManager = getMemoryManager()
    return memoryManager.sessions[currentSession]?.name || 'Aventure'
  }

  // Afficher le login si pas authentifié
  if (!isAuthenticated) {
    return <PINLogin onLoginSuccess={handleLoginSuccess} />
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Chargement...
      </div>
    )
  }

  return (
    <div
      className="min-h-screen w-full text-white relative bg-center bg-cover"
      style={{ backgroundImage: "url('/images/fond-donjon.jpg')" }}
    >
      {/* Contenu principal */}
      <div className="relative z-20 w-full max-w-full sm:max-w-4xl mx-auto p-4 sm:p-8 pt-16">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-yellow-400 drop-shadow-lg">
              ⚔️ Aventure JDR
            </h1>
            <div className="text-sm text-gray-300">
              Session: <strong>{getCurrentSessionName()}</strong>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => setIsSessionsOpen(true)}
              className="bg-yellow-700 hover:bg-yellow-800 border border-yellow-400 px-4 py-2 rounded shadow-md transition w-full sm:w-auto"
            >
              📁 Sessions
            </button>
            <button
              onClick={() => setIsMemoryOpen(true)}
              className="bg-purple-700 hover:bg-purple-800 border border-purple-400 px-4 py-2 rounded shadow-md transition w-full sm:w-auto"
            >
              🧠 Mémoire
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-700 hover:bg-red-800 border border-red-400 px-4 py-2 rounded shadow-md transition w-full sm:w-auto text-xs sm:text-sm"
            >
              🚪 Déconnexion
            </button>
          </div>
        </header>

        {/* Parchemin */}
        <div className="rounded-2xl border border-yellow-900 shadow-inner relative w-full bg-black/50 min-h-[50vh] sm:min-h-[60vh] p-4 sm:p-6">
          <div
            ref={chatRef}
            className="space-y-4 mb-4 overflow-auto max-h-[50vh] sm:max-h-[60vh]"
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg break-words ${
                  msg.role === 'user'
                    ? 'bg-yellow-800/80 text-white ml-2 sm:ml-8'
                    : 'bg-gray-800/80 text-gray-200 mr-2 sm:mr-8'
                }`}
              >
                {msg.content}
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-800 p-3 rounded-lg mx-2 sm:mx-4 mb-4 border border-red-400">
              ❌ {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 p-2 sm:p-4">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Votre action..."
              className="flex-1 p-3 bg-gray-900/60 border border-yellow-900 rounded-lg text-white placeholder-gray-400 w-full"
            />
            <button
              onClick={sendMessage}
              disabled={isSending}
              className="bg-green-700 hover:bg-green-800 border border-green-400 px-6 py-3 rounded-lg disabled:opacity-50 shadow-lg transition w-full sm:w-auto"
            >
              {isSending ? '⏳...' : 'Envoyer'}
            </button>
          </div>
        </div>
      </div>

      <MemoryManager isOpen={isMemoryOpen} onClose={() => setIsMemoryOpen(false)} />
      <SessionManager
        isOpen={isSessionsOpen}
        onClose={() => setIsSessionsOpen(false)}
        onSessionChange={handleSessionChange}
      />
    </div>
  )
}

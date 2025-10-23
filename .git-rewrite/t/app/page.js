'use client'
import { useState, useEffect, useRef } from 'react'
import MemoryManager from './components/MemoryManager'
import SessionManager from './components/SessionManager'
import { getMemoryManager } from './utils/memoryManager'

export default function Home() {
  const [isMemoryOpen, setIsMemoryOpen] = useState(false)
  const [isSessionsOpen, setIsSessionsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [currentSession, setCurrentSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState(null)
  const chatRef = useRef(null)

  // ✅ Scroll automatique
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    const memoryManager = getMemoryManager()
    setCurrentSession(memoryManager.currentSessionId)
    const sessionMessages = memoryManager.getSessionMessages(memoryManager.currentSessionId)
    setMessages(sessionMessages)
    setIsLoading(false)
  }, [])

  const handleSessionChange = (sessionId) => {
    const memoryManager = getMemoryManager()
    memoryManager.setSessionMessages(messages, memoryManager.currentSessionId)
    memoryManager.switchSession(sessionId)
    setCurrentSession(sessionId)
    const newSessionMessages = memoryManager.getSessionMessages(sessionId)
    setMessages(newSessionMessages)
  }

  const sendMessage = async () => {
    if (!inputMessage.trim() || isSending) return

    setIsSending(true)
    setError(null)
    const memoryManager = getMemoryManager()
    const newMessages = [...messages, { role: 'user', content: inputMessage }]
    setMessages(newMessages)
    memoryManager.setSessionMessages(newMessages, memoryManager.currentSessionId)
    const messageBackup = inputMessage
    setInputMessage('')

    try {
      const response = await fetch('/api/chat-ai-memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          allowMemoryWrite: true,
          sessionId: memoryManager.currentSessionId
        }),
      })

      if (!response.ok) throw new Error(`Erreur serveur: ${response.status}`)
      const data = await response.json()
      if (data.error) throw new Error(data.error)

      if (data.response) {
        const finalMessages = [...newMessages, { role: 'assistant', content: data.response }]
        setMessages(finalMessages)
        memoryManager.setSessionMessages(finalMessages, memoryManager.currentSessionId)
      }
    } catch (error) {
      console.error('Erreur:', error)
      setError(error.message || "Erreur de connexion")
      setInputMessage(messageBackup)
    } finally {
      setIsSending(false)
    }
  }

  const getCurrentSessionName = () => {
    const memoryManager = getMemoryManager()
    const session = memoryManager.sessions[memoryManager.currentSessionId]
    return session?.name || "Aventure"
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div>Chargement...</div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen text-white bg-cover bg-center relative"
      style={{ backgroundImage: "url('/images/fond-donjon.png')" }}
    >
      {/* Ombre globale */}
      <div className="absolute inset-0 bg-black bg-opacity-60"></div>

      {/* Maître du Donjon */}
      <div className="absolute left-4 bottom-0 flex flex-col items-center z-10">
        <img
          src="/images/md-ombre.png"
          alt="Maître du donjon"
          className="w-48 opacity-90"
        />
        <div className="relative">
          <img
            src="/images/cristal.png"
            alt="Cristal"
            className="w-12 animate-pulse-smooth absolute bottom-10 left-1/2 -translate-x-1/2"
          />
        </div>
      </div>

      {/* Contenu principal */}
      <div className="relative z-20 max-w-4xl mx-auto p-8 pt-16">
        <header className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-yellow-400 drop-shadow-lg">
              ⚔️ Aventure JDR
            </h1>
            <div className="text-sm text-gray-300">
              Session: <strong>{getCurrentSessionName()}</strong>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsSessionsOpen(true)}
              className="bg-yellow-700 hover:bg-yellow-800 border border-yellow-400 px-4 py-2 rounded shadow-md transition"
            >
              📁 Sessions
            </button>
            <button
              onClick={() => setIsMemoryOpen(true)}
              className="bg-purple-700 hover:bg-purple-800 border border-purple-400 px-4 py-2 rounded shadow-md transition"
            >
              🧠 Mémoire
            </button>
          </div>
        </header>

        {/* Parchemin */}
        <div
          className="rounded-2xl border border-yellow-900 bg-cover bg-center shadow-inner relative"
          style={{
            backgroundImage: "url('/images/parchemin.png')",
            backgroundSize: 'cover',
          }}
        >
          <div ref={chatRef} className="space-y-4 mb-4 overflow-auto max-h-[60vh] p-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-yellow-800/80 text-white ml-8'
                    : 'bg-gray-800/80 text-gray-200 mr-8'
                }`}
              >
                {message.content}
              </div>
            ))}
          </div>

          {error && (
            <div className="bg-red-800 p-3 rounded-lg mx-4 mb-4 border border-red-400">
              ❌ {error}
            </div>
          )}

          <div className="flex gap-2 p-4">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Votre action..."
              className="flex-1 p-3 bg-gray-900/60 border border-yellow-900 rounded-lg text-white placeholder-gray-400"
            />
            <button
              onClick={sendMessage}
              disabled={isSending}
              className="bg-green-700 hover:bg-green-800 border border-green-400 px-6 py-3 rounded-lg disabled:opacity-50 shadow-lg transition"
            >
              {isSending ? '⏳...' : 'Envoyer'}
            </button>
          </div>

          {/* Bougie décorative */}
          <img
            src="/images/bougie.gif"
            alt="Bougie"
            className="absolute top-2 right-4 w-10"
          />
        </div>
      </div>

      <MemoryManager isOpen={isMemoryOpen} onClose={() => setIsMemoryOpen(false)} />
      <SessionManager isOpen={isSessionsOpen} onClose={() => setIsSessionsOpen(false)} onSessionChange={handleSessionChange} />
    </div>
  )
}

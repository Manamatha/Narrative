'use client'
import { useState } from 'react'

export default function JDRNarrative() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const sendMessage = async () => {
    if (!input.trim()) return

    setIsLoading(true)
    const userMessage = { role: 'user', content: input }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: newMessages }),
      })

      const data = await response.json()
      
      if (data.response) {
        setMessages([...newMessages, { role: 'assistant', content: data.response }])
      }
    } catch (error) {
      console.error('Erreur:', error)
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: 'Désolé, une erreur est survenue.' 
      }])
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          🐉 Votre Maître de JDR IA
        </h1>

        {/* Zone de chat */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4 h-96 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 mt-16">
              Commencez votre aventure ! Décrivez votre personnage ou une situation.
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`mb-4 p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-600 ml-8'
                    : 'bg-green-600 mr-8'
                }`}
              >
                <strong>
                  {message.role === 'user' ? '👤 Vous' : '🧙 Maître du Jeu'}
                </strong>
                : {message.content}
              </div>
            ))
          )}
          {isLoading && (
            <div className="text-center text-gray-400">
              Le Maître du Jeu réfléchit...
            </div>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Que faites-vous ?"
            className="flex-1 p-3 rounded-lg bg-gray-700 text-white"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-bold"
          >
            {isLoading ? '...' : 'Envoyer'}
          </button>
        </div>
      </div>
    </div>
  )
}
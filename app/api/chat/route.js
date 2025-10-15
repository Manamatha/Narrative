import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    console.log('🚀 Début requête OpenAI')
    
    const body = await request.json()
    const { messages } = body

    const lastUserMessage = messages[messages.length - 1]?.content
    if (!lastUserMessage) {
      return NextResponse.json({ error: 'Aucun message utilisateur' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Clé API manquante' }, { status: 500 })
    }

    // Message système pour le MJ
    const systemMessage = {
      role: "system",
      content: `Tu es un Maître de Jeu expérimenté pour un jeu de rôle narratif fantasy.
      
      TES QUALITÉS :
      - Créatif et immersif
      - Descriptions vivantes mais concises
      - Adaptatif aux choix des joueurs
      - Style engageant et mystérieux
      
      RÈGLES STRICTES :
      - Réponds TOUJOURS en français
      - 2-3 phrases maximum par réponse
      - Ne brise jamais l'immersion
      - Fais avancer l'histoire
      - Laisse des opportunités au joueur
      
      Ton rôle : Créer une aventure mémorable !`
    }

    // Préparer la conversation
    const conversation = [systemMessage, ...messages.slice(-6)]

    console.log('📤 Envoi à OpenAI...')
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',  // Modèle économique et rapide
        messages: conversation,
        max_tokens: 200,
        temperature: 0.8,
      }),
    })

    console.log('📥 Statut OpenAI:', response.status)
    
    const responseData = await response.json()
    console.log('📦 Réponse OpenAI reçue')

    if (!response.ok) {
      console.error('❌ Erreur OpenAI:', responseData)
      return NextResponse.json(
        { error: `Erreur OpenAI: ${responseData.error?.message || 'Unknown error'}` },
        { status: 500 }
      )
    }

    if (responseData.choices && responseData.choices[0] && responseData.choices[0].message) {
      const aiText = responseData.choices[0].message.content
      console.log('✅ Réponse générée avec succès!')
      
      return NextResponse.json({ 
        response: aiText 
      })
    } else {
      console.error('❌ Structure de réponse invalide:', responseData)
      return NextResponse.json(
        { error: 'Structure de réponse invalide' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('💥 Erreur catch:', error)
    return NextResponse.json(
      { error: `Erreur interne: ${error.message}` }, 
      { status: 500 }
    )
  }
}
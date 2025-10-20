import { NextResponse } from 'next/server'
import { getMemoryManager } from '@/app/utils/memoryManager'

export async function POST(request) {
  try {
    const body = await request.json()
    const { messages, forceSave = false } = body

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Clé API manquante' }, { status: 500 })
    }

    const memoryManager = getMemoryManager()
    const dernierMessage = messages[messages.length - 1]?.content || ""

    // Sauvegarde automatique tous les 10 messages
    if (messages.length % 10 === 0 || forceSave) {
      await memoryManager.forceResumeSave(messages.slice(-8), apiKey)
    }

    // Contexte optimisé avec mémoire
    const contexteCampagne = memoryManager.generateOptimizedContext(dernierMessage)

    const systemMessage = {
      role: "system",
      content: `TU ES LE MAÎTRE DE JEU expert en narration.

MÉMOIRE DE LA CAMPAGNE:
${contexteCampagne}

DIRECTIVES CRÉATIVES:
- Utilise ta mémoire pour être cohérent avec l'histoire
- Fais référence aux événements et personnages passés
- Avance l'histoire naturellement
- Réponds en 2-3 phrases maximum
- Sois immersif et mystérieux`
    }

    // Conversation récente (8 derniers messages)
    const conversationRecente = messages.slice(-8)
    const conversation = [systemMessage, ...conversationRecente]

    console.log(`🧠 Mémoire: ${memoryManager.campaign.chapitres.length} chapitres | Contexte: ${contexteCampagne.length} chars`)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: conversation,
        max_tokens: 250,
        temperature: 0.8,
      }),
    })

    const responseData = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: `Erreur: ${responseData.error?.message}` },
        { status: 500 }
      )
    }

    if (responseData.choices?.[0]?.message) {
      // Sauvegarder après une réponse importante
      const reponseMJ = responseData.choices[0].message.content
      if (reponseMJ.length > 100) { // Réponse substantielle
        memoryManager.saveCampaign()
      }

      return NextResponse.json({ 
        response: reponseMJ,
        memory_stats: {
          chapitres: memoryManager.campaign.chapitres.length,
          pnj: memoryManager.campaign.pnj_importants.length
        }
      })
    }

    return NextResponse.json({ error: 'Réponse invalide' }, { status: 500 })

  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: `Erreur interne: ${error.message}` }, 
      { status: 500 }
    )
  }
}
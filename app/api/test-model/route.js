// Créez app/api/test-model/route.js
import { NextResponse } from 'next/server'

export async function GET() {
  const models = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo']
  
  for (const model of models) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: 'Réponds "ok"' }],
          max_tokens: 5,
        }),
      })
      
      if (response.ok) {
        return NextResponse.json({ model_disponible: model })
      }
    } catch (error) {
      continue
    }
  }
  
  return NextResponse.json({ error: 'Aucun modèle trouvé' }, { status: 500 })
}
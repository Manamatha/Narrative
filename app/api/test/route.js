import { NextResponse } from 'next/server'

export async function GET() {
  console.log('🧪 Test API avec le bon modèle')
  
  const apiKey = process.env.OPENAI_API_KEY

  try {
    // Utiliser le modèle gemini-flash-latest qui est dans la liste
    const testResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: "Dis moi simplement 'Bonjour, test réussi!' en français"
            }]
          }],
          generationConfig: {
            maxOutputTokens: 100,
          }
        }),
      }
    )

    console.log('📊 Statut test:', testResponse.status)
    const testData = await testResponse.json()
    console.log('📊 Données test:', JSON.stringify(testData, null, 2))

    if (testResponse.ok) {
      const text = testData.candidates[0].content.parts[0].text
      return NextResponse.json({ 
        message: '✅ API fonctionne!', 
        response: text,
        model: 'gemini-flash-latest'
      })
    } else {
      return NextResponse.json({ 
        error: testData.error,
        details: `Statut: ${testResponse.status}` 
      }, { status: 500 })
    }

  } catch (error) {
    console.error('❌ Erreur test:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
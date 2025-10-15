import { NextResponse } from 'next/server'

export async function GET() {
  console.log('🔍 Liste des modèles demandée')
  
  const apiKey = process.env.OPENAI_API_KEY
  console.log('🔑 Clé API:', apiKey ? 'PRÉSENTE' : 'MANQUANTE')

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    )
    
    console.log('📊 Statut de la réponse modèles:', response.status)
    
    const data = await response.json()
    console.log('📦 Données modèles reçues')
    
    if (!response.ok) {
      console.error('❌ Erreur:', data)
      return NextResponse.json({ error: data }, { status: 500 })
    }

    // Filtrer seulement les modèles qui supportent generateContent
    const supportedModels = data.models?.filter(model => 
      model.supportedGenerationMethods?.includes('generateContent')
    ) || []

    console.log('✅ Modèles supportés:', supportedModels.map(m => m.name))

    return NextResponse.json({
      all_models: data.models,
      supported_models: supportedModels,
      supported_model_names: supportedModels.map(m => m.name)
    })

  } catch (error) {
    console.error('💥 Erreur:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
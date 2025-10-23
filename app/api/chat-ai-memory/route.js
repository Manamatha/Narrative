import { NextResponse } from 'next/server'
import { getMemoryManager } from '@/app/utils/memoryManager'
import { getUserIdFromRequest } from '@/app/utils/auth'

export async function POST(request) {
  try {
    const body = await request.json()
    const { messages, allowMemoryWrite = false, sessionId = null } = body
    const userId = await getUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: 'Utilisateur non identifié' }, { status: 401 })

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Clé API manquante' }, { status: 500 })
    }

    const memoryManager = getMemoryManager()
    
    // Initialiser le memoryManager avec l'userId
    if (memoryManager.userId !== userId) {
      await memoryManager.loadFromServer(userId)
    }
    
    if (sessionId && memoryManager.currentSessionId !== sessionId) {
      memoryManager.switchSession(sessionId)
    }
    
    const dernierMessage = messages[messages.length - 1]?.content || ""

    // 🧠 TRACKER: Enregistrer les éléments mentionnés dans le message avec TOUTES leurs données
    const tagsDetectes = memoryManager.findTagsInMessage(dernierMessage)
    tagsDetectes.forEach(tag => {
      const campaign = memoryManager.getCurrentCampaign()
      if (campaign) {
        // Track PNJ avec données complètes
        const pnj = campaign.pnj_importants?.find(p => p.nom.toLowerCase() === tag.toLowerCase())
        if (pnj) {
          memoryManager.trackImportantElement('pnj', pnj.nom, {
            role: pnj.role,
            description: pnj.description,
            emotion: pnj.emotion,
            caractere: pnj.caractere,
            valeurs: pnj.valeurs,
            peurs: pnj.peurs,
            desirs: pnj.desirs,
            histoire: pnj.histoire,
            tags: pnj.tags
          })
        }

        // Track Lieux avec données complètes
        const lieu = campaign.lieux_importants?.find(l => l.nom.toLowerCase() === tag.toLowerCase())
        if (lieu) {
          memoryManager.trackImportantElement('lieux', lieu.nom, {
            description: lieu.description,
            tags: lieu.tags
          })
        }

        // Track Événements avec données complètes
        const evt = campaign.evenements_cles?.find(e => e.titre.toLowerCase() === tag.toLowerCase())
        if (evt) {
          memoryManager.trackImportantElement('evenements', evt.titre, {
            description: evt.description,
            consequences: evt.consequences,
            personnages_impliques: evt.personnages_impliques,
            lieux_impliques: evt.lieux_impliques,
            tags: evt.tags
          })
        }
      }
    })

    const contexteCampagne = memoryManager.generateOptimizedContext(dernierMessage, messages.length)

    const systemMessage = {
      role: "system",
      content: `TU ES LE MAÎTRE DE JEU.

MÉMOIRE CAMPAGNE:
${contexteCampagne}

DIRECTIVES:
- Réponds en 2-3 phrases maximum
- Sois immersif et cohérent
- Avance la narration naturellement
- Sois créatif: crée des éléments UNIQUES et VARIÉS
- Réutilise les éléments existants quand c'est pertinent

${allowMemoryWrite ? `
MISE À JOUR PNJ:
[UPDATE:PNJ|Nom|émotion|+/-valeur|raison]
Ex: [UPDATE:PNJ|Lyna|confiance|+30|sauvetage]
Règles: Événements TRÈS importants seulement. Max 1-2 par réponse.

SAUVEGARDE:
[SAVE:LIEU|Nom|Description|tags]
[SAVE:PNJ|Nom|Rôle|Description|tags]
[SAVE:EVENT|Titre|Description|Conséquences|tags]
[SAVE:CHAPTER|Titre|Résumé|tags]
` : ''}`
    }

    const dernierMessageSeulement = messages[messages.length - 1]
    const conversation = [systemMessage, dernierMessageSeulement]

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: conversation,
        max_tokens: 400,
        temperature: 0.7,
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
      const reponseComplete = responseData.choices[0].message.content
      
      let reponseMJ = reponseComplete
      const sauvegardes = []
      const misesAJourPNJ = []

      if (allowMemoryWrite) {
        const updatePNJPattern = /\[UPDATE:PNJ\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/g
        let match
        while ((match = updatePNJPattern.exec(reponseComplete)) !== null) {
          const nom = match[1].trim()
          const emotion = match[2].trim()
          const changement = match[3].trim()
          const raison = match[4].trim()
          
          misesAJourPNJ.push({
            nom,
            emotion,
            changement,
            raison
          })
          reponseMJ = reponseMJ.replace(match[0], '')
        }

        const savePatterns = [
          {
            regex: /\[SAVE:LIEU\|([^|]+)\|([^|]+)\|([^\]]+)\]/g,
            type: 'LIEU',
            processor: (match) => ({
              nom: match[1].trim(),
              description: match[2].trim(),
              tags: match[3].split(',').map(t => t.trim()).filter(t => t)
            })
          },
          {
            regex: /\[SAVE:PNJ\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/g,
            type: 'PNJ', 
            processor: (match) => ({
              nom: match[1].trim(),
              role: match[2].trim(),
              description: match[3].trim(),
              tags: match[4].split(',').map(t => t.trim()).filter(t => t)
            })
          },
          {
            regex: /\[SAVE:EVENT\|([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]/g,
            type: 'EVENEMENT',
            processor: (match) => ({
              titre: match[1].trim(),
              description: match[2].trim(),
              consequences: match[3].trim(),
              tags: match[4].split(',').map(t => t.trim()).filter(t => t)
            })
          },
          {
            regex: /\[SAVE:CHAPTER\|([^|]+)\|([^|]+)\|([^\]]+)\]/g,
            type: 'CHAPITRE',
            processor: (match) => ({
              titre: match[1].trim(),
              resume: match[2].trim(),
              tags: match[3].split(',').map(t => t.trim()).filter(t => t)
            })
          }
        ]

        savePatterns.forEach(({ regex, type, processor }) => {
          while ((match = regex.exec(reponseComplete)) !== null) {
            sauvegardes.push({
              type,
              ...processor(match)
            })
            reponseMJ = reponseMJ.replace(match[0], '')
          }
        })

        if (misesAJourPNJ.length > 0) {
          memoryManager.processPNJUpdates(misesAJourPNJ)
        }

        if (sauvegardes.length > 0) {
          memoryManager.processAISaves(sauvegardes)
        }
      }

      return NextResponse.json({ 
        response: reponseMJ.trim(),
        saved_items: sauvegardes.length,
        pnj_updated: misesAJourPNJ.length,
        memory_updated: sauvegardes.length > 0 || misesAJourPNJ.length > 0,
        saved_details: sauvegardes,
        pnj_updates: misesAJourPNJ,
        current_session: memoryManager.currentSessionId
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
// app/api/sessions/route.js
import fs from 'fs/promises'
import path from 'path'

const DATA_FILE = path.resolve('./sessionsData.json')

// Lecture asynchrone
const readData = async () => {
  try {
    // Si le fichier n'existe pas, on le crée avec des données vides
    await fs.access(DATA_FILE).catch(async () => {
      await fs.writeFile(
        DATA_FILE,
        JSON.stringify({ sessions: {}, sessionChats: {}, currentSessionId: null }, null, 2)
      )
    })

    const raw = await fs.readFile(DATA_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch (err) {
    console.error('Erreur lecture sessions:', err)
    return { sessions: {}, sessionChats: {}, currentSessionId: null }
  }
}

// Écriture asynchrone
const saveData = async (data) => {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2))
  } catch (err) {
    console.error('Erreur sauvegarde sessions:', err)
  }
}

// Sauvegarde partielle : ne met à jour que les sessions reçues
const savePartial = async (partial) => {
  const currentData = await readData()

  if (partial.sessions) {
    currentData.sessions = { ...currentData.sessions, ...partial.sessions }
  }
  if (partial.sessionChats) {
    currentData.sessionChats = { ...currentData.sessionChats, ...partial.sessionChats }
  }
  if (partial.currentSessionId) {
    currentData.currentSessionId = partial.currentSessionId
  }

  await saveData(currentData)
  return currentData
}

// GET /api/sessions → renvoie toutes les sessions
export async function GET(req) {
  const data = await readData()
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

// POST /api/sessions → sauvegarde partielle ou complète
export async function POST(req) {
  try {
    const body = await req.json()
    const updatedData = await savePartial(body)

    return new Response(JSON.stringify({ ok: true, data: updatedData }), { status: 200 })
  } catch (err) {
    console.error('Erreur POST sessions:', err)
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 })
  }
}

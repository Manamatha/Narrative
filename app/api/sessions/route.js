// app/api/sessions/route.js
import fs from 'fs'
import path from 'path'

const DATA_FILE = path.resolve('./sessionsData.json')

// Fonction pour lire les données
const readData = () => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return { sessions: {}, sessionChats: {}, currentSessionId: null }
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch (err) {
    console.error('Erreur lecture sessions:', err)
    return { sessions: {}, sessionChats: {}, currentSessionId: null }
  }
}

// Fonction pour sauvegarder les données
const saveData = (data) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))
  } catch (err) {
    console.error('Erreur sauvegarde sessions:', err)
  }
}

// GET /api/sessions → renvoie toutes les sessions
export async function GET(req) {
  const data = readData()
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

// POST /api/sessions → sauvegarde toutes les sessions envoyées
export async function POST(req) {
  try {
    const body = await req.json()
    const { sessions, sessionChats, currentSessionId } = body
    saveData({ sessions, sessionChats, currentSessionId })
    return new Response(JSON.stringify({ ok: true }), { status: 200 })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ ok: false, error: err.message }), { status: 500 })
  }
}

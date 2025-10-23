/**
 * MemoryManager - Isomorphic session & campaign memory system
 * Works on both client (fetch) and server (Prisma)
 * Export: default MemoryManager + named getMemoryManager() singleton
 */

const isServer = typeof window === 'undefined'

class MemoryManager {
  constructor() {
    this.userId = null
    this.sessions = {}
    this.sessionChats = {}
    this.currentSessionId = null
  }

  async _getPrismaClient() {
    if (!isServer) throw new Error('Prisma is server-side only')
    const { PrismaClient } = await import('@prisma/client')
    return new PrismaClient()
  }

  async loadFromServer(userId) {
    this.userId = userId
    try {
      if (isServer) {
        const prisma = await this._getPrismaClient()
        const rows = await prisma.session.findMany({
          where: { userId },
          orderBy: { lastAccessed: 'desc' }
        })

        rows.forEach((row) => {
          try {
            const campaign = typeof row.campaign === 'string' ? JSON.parse(row.campaign) : row.campaign
            this.sessions[row.id] = {
              id: row.id,
              name: row.name,
              campaign,
              createdAt: row.createdAt,
              lastAccessed: row.lastAccessed
            }
            this.sessionChats[row.id] = []
          } catch (e) {
            console.warn('Failed to parse campaign for session', row.id)
          }
        })
      } else {
        const res = await fetch('/api/sessions')
        const data = await res.json()

        if (data.ok && Array.isArray(data.sessions)) {
          data.sessions.forEach((session) => {
            try {
              const campaign = typeof session.campaign === 'string' 
                ? JSON.parse(session.campaign) 
                : session.campaign
              this.sessions[session.id] = {
                id: session.id,
                name: session.name,
                campaign,
                createdAt: session.createdAt,
                lastAccessed: session.lastAccessed
              }
              this.sessionChats[session.id] = []
            } catch (e) {
              console.warn('Failed to parse campaign for session', session.id)
            }
          })
        }
      }

      const sessionIds = Object.keys(this.sessions)
      if (sessionIds.length === 0) {
        this.currentSessionId = this.createNewSession('Aventure sans titre')
      } else {
        this.currentSessionId = sessionIds[0]
      }
    } catch (err) {
      console.error('loadFromServer error:', err)
    }
  }

  createNewSession(name = 'Nouvelle Aventure') {
    const sessionId = 'session_' + (
      typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : Math.random().toString(36).slice(2, 11)
    )

    const now = new Date().toISOString()
    this.sessions[sessionId] = {
      id: sessionId,
      name,
      campaign: {
        meta: {
          titre: name,
          resume_global: '',
          date_creation: now,
          date_derniere_sauvegarde: now
        },
        style_narration: '',
        chapitres: [],
        pnj_importants: [],
        lieux_importants: [],
        evenements_cles: [],
        tags_globaux: [],
        memory_enabled: true
      },
      createdAt: now,
      lastAccessed: now
    }
    this.sessionChats[sessionId] = []
    this.currentSessionId = sessionId

    this.saveSessionToServer(sessionId).catch((e) => {
      console.error('Failed to save new session to server:', e)
    })

    return sessionId
  }

  switchSession(sessionId) {
    if (this.sessions[sessionId]) {
      this.currentSessionId = sessionId
      this.sessions[sessionId].lastAccessed = new Date().toISOString()
      this.saveSessionToServer(sessionId).catch(() => {})
    }
  }

  getSessionMessages(sessionId = this.currentSessionId) {
    return this.sessionChats[sessionId] || []
  }

  setSessionMessages(messages, sessionId = this.currentSessionId) {
    this.sessionChats[sessionId] = messages
  }

  getCurrentCampaign() {
    return this.sessions[this.currentSessionId]?.campaign || null
  }

  getSessionsList() {
    return Object.values(this.sessions).sort((a, b) => 
      new Date(b.lastAccessed) - new Date(a.lastAccessed)
    )
  }

  async saveSessionToServer(sessionId) {
    try {
      const payload = this.sessions[sessionId]
      if (!payload) return

      if (isServer) {
        const prisma = await this._getPrismaClient()
        await prisma.session.upsert({
          where: { id: sessionId },
          update: {
            name: payload.name,
            lastAccessed: new Date(),
            campaign: JSON.stringify(payload.campaign)
          },
          create: {
            id: sessionId,
            userId: this.userId,
            name: payload.name,
            campaign: JSON.stringify(payload.campaign)
          }
        })
      } else {
        const response = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: sessionId,
            name: payload.name,
            campaign: payload.campaign
          })
        })
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`)
        }
      }
    } catch (e) {
      console.error('saveSessionToServer error:', e)
    }
  }

  saveCampaign() {
    if (this.currentSessionId) {
      this.saveSessionToServer(this.currentSessionId).catch(() => {})
    }
  }

  updateCampaign(updatedCampaign) {
    if (this.currentSessionId && this.sessions[this.currentSessionId]) {
      this.sessions[this.currentSessionId].campaign = updatedCampaign
      this.saveCampaign()
    }
  }

  addChapitre() {
    const c = this.getCurrentCampaign()
    if (!c) return null
    const newId = Math.max(0, ...(c.chapitres || []).map((x) => x.id || 0)) + 1
    c.chapitres = c.chapitres || []
    c.chapitres.push({
      id: newId,
      titre: 'Nouveau chapitre',
      resume: '',
      tags: [],
      date: new Date().toISOString(),
      priorite: 5
    })
    this.saveCampaign()
    return newId
  }

  updateChapitre(id, field, value) {
    const c = this.getCurrentCampaign()
    if (!c) return false
    const ch = (c.chapitres || []).find((x) => x.id === id)
    if (!ch) return false
    ch[field] = value
    this.saveCampaign()
    return true
  }

  addTagToChapitre(chapitreId, tag) {
    const c = this.getCurrentCampaign()
    if (!c) return false
    const ch = (c.chapitres || []).find((x) => x.id === chapitreId)
    if (!ch) return false
    ch.tags = ch.tags || []
    if (!ch.tags.includes(tag)) {
      ch.tags.push(tag)
      this.saveCampaign()
      return true
    }
    return false
  }

  removeTagFromChapitre(chapitreId, tag) {
    const c = this.getCurrentCampaign()
    if (!c) return false
    const ch = (c.chapitres || []).find((x) => x.id === chapitreId)
    if (!ch) return false
    ch.tags = (ch.tags || []).filter((t) => t !== tag)
    this.saveCampaign()
    return true
  }

  deleteChapitre(id) {
    const c = this.getCurrentCampaign()
    if (!c) return false
    c.chapitres = (c.chapitres || []).filter((x) => x.id !== id)
    this.saveCampaign()
    return true
  }

  addPNJ() {
    const c = this.getCurrentCampaign()
    if (!c) return false
    c.pnj_importants = c.pnj_importants || []
    c.pnj_importants.push({
      nom: 'Nouveau PNJ',
      role: '',
      description: '',
      emotion: 'C50-A30-P50-H10-R50-J10',
      caractere: '',
      valeurs: '',
      peurs: '',
      desirs: '',
      histoire: '',
      vitesse_evolution: 1.0,
      tags: [],
      priorite: 5
    })
    this.saveCampaign()
    return true
  }

  updatePNJ(index, field, value) {
    const c = this.getCurrentCampaign()
    if (!c || !(c.pnj_importants || [])[index]) return false
    c.pnj_importants[index][field] = value
    this.saveCampaign()
    return true
  }

  addTagToPNJ(pnjIndex, tag) {
    const c = this.getCurrentCampaign()
    if (!c || !(c.pnj_importants || [])[pnjIndex]) return false
    const p = c.pnj_importants[pnjIndex]
    p.tags = p.tags || []
    if (!p.tags.includes(tag)) {
      p.tags.push(tag)
      this.saveCampaign()
      return true
    }
    return false
  }

  removeTagFromPNJ(pnjIndex, tag) {
    const c = this.getCurrentCampaign()
    if (!c || !(c.pnj_importants || [])[pnjIndex]) return false
    c.pnj_importants[pnjIndex].tags = (c.pnj_importants[pnjIndex].tags || []).filter((t) => t !== tag)
    this.saveCampaign()
    return true
  }

  deletePNJ(index) {
    const c = this.getCurrentCampaign()
    if (!c || !(c.pnj_importants || [])[index]) return false
    c.pnj_importants.splice(index, 1)
    this.saveCampaign()
    return true
  }

  addLieu() {
    const c = this.getCurrentCampaign()
    if (!c) return false
    c.lieux_importants = c.lieux_importants || []
    c.lieux_importants.push({
      nom: 'Nouveau lieu',
      description: '',
      tags: [],
      priorite: 5
    })
    this.saveCampaign()
    return true
  }

  updateLieu(index, field, value) {
    const c = this.getCurrentCampaign()
    if (!c || !(c.lieux_importants || [])[index]) return false
    c.lieux_importants[index][field] = value
    this.saveCampaign()
    return true
  }

  addTagToLieu(lieuIndex, tag) {
    const c = this.getCurrentCampaign()
    if (!c || !(c.lieux_importants || [])[lieuIndex]) return false
    const l = c.lieux_importants[lieuIndex]
    l.tags = l.tags || []
    if (!l.tags.includes(tag)) {
      l.tags.push(tag)
      this.saveCampaign()
      return true
    }
    return false
  }

  removeTagFromLieu(lieuIndex, tag) {
    const c = this.getCurrentCampaign()
    if (!c || !(c.lieux_importants || [])[lieuIndex]) return false
    c.lieux_importants[lieuIndex].tags = (c.lieux_importants[lieuIndex].tags || []).filter((t) => t !== tag)
    this.saveCampaign()
    return true
  }

  deleteLieu(index) {
    const c = this.getCurrentCampaign()
    if (!c || !(c.lieux_importants || [])[index]) return false
    c.lieux_importants.splice(index, 1)
    this.saveCampaign()
    return true
  }

  addEvenement() {
    const c = this.getCurrentCampaign()
    if (!c) return false
    c.evenements_cles = c.evenements_cles || []
    c.evenements_cles.push({
      titre: 'Nouvel événement',
      description: '',
      consequences: '',
      personnages_impliques: [],
      lieux_impliques: [],
      tags: [],
      date: new Date().toISOString(),
      priorite: 5
    })
    this.saveCampaign()
    return true
  }

  updateEvenement(index, field, value) {
    const c = this.getCurrentCampaign()
    if (!c || !(c.evenements_cles || [])[index]) return false
    c.evenements_cles[index][field] = value
    this.saveCampaign()
    return true
  }

  addTagToEvenement(index, tag) {
    const c = this.getCurrentCampaign()
    if (!c || !(c.evenements_cles || [])[index]) return false
    const e = c.evenements_cles[index]
    e.tags = e.tags || []
    if (!e.tags.includes(tag)) {
      e.tags.push(tag)
      this.saveCampaign()
      return true
    }
    return false
  }

  removeTagFromEvenement(index, tag) {
    const c = this.getCurrentCampaign()
    if (!c || !(c.evenements_cles || [])[index]) return false
    c.evenements_cles[index].tags = (c.evenements_cles[index].tags || []).filter((t) => t !== tag)
    this.saveCampaign()
    return true
  }

  deleteEvenement(index) {
    const c = this.getCurrentCampaign()
    if (!c || !(c.evenements_cles || [])[index]) return false
    c.evenements_cles.splice(index, 1)
    this.saveCampaign()
    return true
  }

  getAvailableTags() {
    const c = this.getCurrentCampaign()
    if (!c) return []
    const allTags = [
      ...(c.tags_globaux || []),
      ...(c.pnj_importants || []).flatMap((p) => p.tags || []),
      ...(c.lieux_importants || []).flatMap((l) => l.tags || []),
      ...(c.chapitres || []).flatMap((ch) => ch.tags || []),
      ...(c.evenements_cles || []).flatMap((e) => e.tags || [])
    ]
    return [...new Set(allTags)]
  }

  setAvailableTags(tags) {
    const c = this.getCurrentCampaign()
    if (!c) return false
    c.tags_globaux = tags
    this.saveCampaign()
    return true
  }

  findTagsInMessage(message) {
    if (!message) return []
    const c = this.getCurrentCampaign()
    if (!c) return []

    const m = message.toLowerCase()
    const found = new Set()

    if (Array.isArray(c.tags_globaux)) {
      c.tags_globaux.forEach((t) => {
        if (m.includes(String(t).toLowerCase())) found.add(t)
      })
    }

    if (Array.isArray(c.pnj_importants)) {
      c.pnj_importants.forEach((p) => {
        if (p.nom && m.includes(p.nom.toLowerCase())) {
          found.add(p.nom)
          if (Array.isArray(p.tags)) {
            p.tags.forEach((t) => found.add(t))
          }
        }
      })
    }

    if (Array.isArray(c.lieux_importants)) {
      c.lieux_importants.forEach((l) => {
        if (l.nom && m.includes(l.nom.toLowerCase())) {
          found.add(l.nom)
          if (Array.isArray(l.tags)) {
            l.tags.forEach((t) => found.add(t))
          }
        }
      })
    }

    return Array.from(found).slice(0, 5)
  }

  getElementsByTags(tags) {
    const c = this.getCurrentCampaign()
    if (!c || !tags || tags.length === 0) return ''

    let output = '\n// CONTEXTE RÉCENT:\n'

    tags.forEach((tag) => {
      const lieux = (c.lieux_importants || []).filter(
        (l) => (l.tags || []).includes(tag) || (l.nom || '').toLowerCase().includes(String(tag).toLowerCase())
      )
      if (lieux.length) {
        output += `LIEUX[${tag}]: ${lieux.map((l) => l.nom).join(', ')}\n`
      }

      const pnj = (c.pnj_importants || []).filter(
        (p) => (p.tags || []).includes(tag) || (p.nom || '').toLowerCase().includes(String(tag).toLowerCase())
      )
      if (pnj.length) {
        output += `PNJ[${tag}]: ${pnj.map((p) => p.nom).join(', ')}\n`
      }
    })

    return output
  }

  decoderEmotions(code) {
    const defaults = {
      confiance: 50,
      amour: 30,
      peur: 50,
      haine: 10,
      respect: 50,
      jalousie: 10
    }

    if (!code) return defaults

    const out = { ...defaults }
    const emotionMap = {
      C: 'confiance',
      A: 'amour',
      P: 'peur',
      H: 'haine',
      R: 'respect',
      J: 'jalousie'
    }

    code.split('-').forEach((part) => {
      const key = part[0]
      const value = parseInt(part.slice(1), 10)
      if (emotionMap[key] && !Number.isNaN(value)) {
        out[emotionMap[key]] = Math.max(0, Math.min(100, value))
      }
    })

    return out
  }

  encoderEmotions(obj) {
    const keyMap = {
      confiance: 'C',
      amour: 'A',
      peur: 'P',
      haine: 'H',
      respect: 'R',
      jalousie: 'J'
    }
    return Object.entries(obj)
      .map(([k, v]) => `${keyMap[k]}${v}`)
      .join('-')
  }

  getEmotionDescription(v) {
    if (v >= 80) return 'Très élevé'
    if (v >= 60) return 'Élevé'
    if (v >= 40) return 'Moyen'
    if (v >= 20) return 'Faible'
    return 'Très faible'
  }

  getEmotionColor(v) {
    if (v >= 75) return 'text-green-300'
    if (v >= 50) return 'text-yellow-300'
    if (v >= 25) return 'text-orange-300'
    return 'text-red-300'
  }

  getVitesseDescription(v) {
    if (v >= 1.5) return 'Rapide'
    if (v >= 1.0) return 'Normal'
    return 'Lent'
  }

  processPNJUpdates(updates) {
    const c = this.getCurrentCampaign()
    if (!c) return

    updates.forEach(({ nom, emotion, changement, raison }) => {
      const pnj = (c.pnj_importants || []).find((p) => p.nom === nom)
      if (pnj) {
        if (emotion) {
          pnj.emotion = emotion
        }
        if (changement) {
          pnj.histoire = (pnj.histoire || '') + `\n[${new Date().toISOString()}] ${raison}: ${changement}`
        }
      }
    })

    this.saveCampaign()
  }

  processAISaves(saves) {
    const c = this.getCurrentCampaign()
    if (!c) return

    saves.forEach(({ type, ...data }) => {
      if (type === 'CHAPITRE') {
        c.chapitres = c.chapitres || []
        const id = Math.max(0, ...(c.chapitres || []).map((x) => x.id || 0)) + 1
        c.chapitres.push({
          id,
          titre: data.titre,
          resume: data.resume,
          tags: data.tags || [],
          date: new Date().toISOString(),
          priorite: 5
        })
      } else if (type === 'PNJ') {
        c.pnj_importants = c.pnj_importants || []
        const existing = (c.pnj_importants || []).find((p) => p.nom === data.nom)
        if (existing) {
          existing.description = data.description
          existing.tags = data.tags || existing.tags
        } else {
          c.pnj_importants.push({
            nom: data.nom,
            role: data.role,
            description: data.description,
            emotion: 'C50-A30-P50-H10-R50-J10',
            caractere: '',
            valeurs: '',
            peurs: '',
            desirs: '',
            histoire: '',
            vitesse_evolution: 1.0,
            tags: data.tags || [],
            priorite: 5
          })
        }
      } else if (type === 'LIEU') {
        c.lieux_importants = c.lieux_importants || []
        const existing = (c.lieux_importants || []).find((l) => l.nom === data.nom)
        if (existing) {
          existing.description = data.description
          existing.tags = data.tags || existing.tags
        } else {
          c.lieux_importants.push({
            nom: data.nom,
            description: data.description,
            tags: data.tags || [],
            priorite: 5
          })
        }
      } else if (type === 'EVENEMENT') {
        c.evenements_cles = c.evenements_cles || []
        c.evenements_cles.push({
          titre: data.titre,
          description: data.description,
          consequences: data.consequences,
          personnages_impliques: [],
          lieux_impliques: [],
          tags: data.tags || [],
          date: new Date().toISOString(),
          priorite: 5
        })
      }
    })

    this.saveCampaign()
  }

  generateOptimizedContext(userMessage, messageCount) {
    const c = this.getCurrentCampaign()
    if (!c) return 'Aucun contexte de campagne.'

    const tagsInMessage = this.findTagsInMessage(userMessage)
    const context = this.getElementsByTags(tagsInMessage)

    let output = `CAMPAGNE: ${c.meta?.titre || 'Sans titre'}\n\n`

    if (c.meta?.resume_global) {
      output += `RÉSUMÉ: ${c.meta.resume_global}\n\n`
    }

    if (c.chapitres && c.chapitres.length > 0) {
      output += `CHAPITRES (${c.chapitres.length}):\n`
      c.chapitres.slice(0, 3).forEach((ch) => {
        output += `- ${ch.titre}: ${ch.resume}\n`
      })
      output += '\n'
    }

    if (c.pnj_importants && c.pnj_importants.length > 0) {
      output += `PNJ IMPORTANTS (${c.pnj_importants.length}):\n`
      c.pnj_importants.slice(0, 3).forEach((pnj) => {
        output += `- ${pnj.nom} (${pnj.role}): ${pnj.description}\n`
      })
      output += '\n'
    }

    if (c.lieux_importants && c.lieux_importants.length > 0) {
      output += `LIEUX (${c.lieux_importants.length}):\n`
      c.lieux_importants.slice(0, 3).forEach((lieu) => {
        output += `- ${lieu.nom}: ${lieu.description}\n`
      })
      output += '\n'
    }

    if (context) {
      output += context
    }

    return output
  }
}

let memoryManagerInstance = null

export function getMemoryManager() {
  if (!memoryManagerInstance) {
    memoryManagerInstance = new MemoryManager()
  }
  return memoryManagerInstance
}

export default MemoryManager
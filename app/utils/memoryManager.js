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
    this.currentSessionId = null

    // 🧠 CACHE ET MÉMOIRE
    this.tagsCacheTimestamp = 0
    this.tagsCache = {}
    this.importantMemory = {} // Stocke les éléments importants par sessionId

    // 🔄 THROTTLING DES TAGS - Évite de relire les mêmes tags trop souvent
    this.tagThrottleMap = {} // { sessionId: { tagName: { lastReadAt, readCount } } }
    this.tagThrottleInterval = 8 // Lire les infos tous les 8 échanges
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
            // Initialiser messages s'il n'existe pas
            if (!campaign.messages) {
              campaign.messages = []
            }
          } catch (e) {
            console.warn('Failed to parse campaign for session', row.id)
          }
        })
      } else {
        // Client-side: charger depuis l'API
        const res = await fetch('/api/sessions', {
          credentials: 'include'
        })
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
              // Initialiser messages s'il n'existe pas
              if (!campaign.messages) {
                campaign.messages = []
              }
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

  // Synchroniser les sessions depuis le serveur (pour multi-appareils)
  async syncFromServer() {
    if (isServer) return
    try {
      const res = await fetch('/api/sessions', {
        credentials: 'include'
      })
      const data = await res.json()

      if (data.ok && Array.isArray(data.sessions)) {
        // Mettre à jour les sessions existantes et ajouter les nouvelles
        data.sessions.forEach((session) => {
          try {
            const campaign = typeof session.campaign === 'string'
              ? JSON.parse(session.campaign)
              : session.campaign

            // Vérifier si la session a changé
            const existing = this.sessions[session.id]
            if (!existing || new Date(session.lastAccessed) > new Date(existing.lastAccessed)) {
              this.sessions[session.id] = {
                id: session.id,
                name: session.name,
                campaign,
                createdAt: session.createdAt,
                lastAccessed: session.lastAccessed
              }
              // Initialiser messages s'il n'existe pas
              if (!campaign.messages) {
                campaign.messages = []
              }
            }
          } catch (e) {
            console.warn('Failed to parse campaign for session', session.id)
          }
        })

        // Supprimer les sessions qui n'existent plus sur le serveur
        const serverIds = new Set(data.sessions.map(s => s.id))
        Object.keys(this.sessions).forEach(id => {
          if (!serverIds.has(id)) {
            delete this.sessions[id]
          }
        })
      }
    } catch (err) {
      console.error('syncFromServer error:', err)
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
        memory_enabled: true,
        messages: []
      },
      createdAt: now,
      lastAccessed: now
    }
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
    const session = this.sessions[sessionId]
    if (!session || !session.campaign) return []
    // Initialiser messages s'il n'existe pas
    if (!session.campaign.messages) {
      session.campaign.messages = []
    }
    return session.campaign.messages
  }

  setSessionMessages(messages, sessionId = this.currentSessionId) {
    const session = this.sessions[sessionId]
    if (!session || !session.campaign) return
    session.campaign.messages = messages
    // Auto-sauvegarder pour ne pas perdre les messages
    this.saveSessionToServer(sessionId).catch(() => {})
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
        // Client-side: utiliser la nouvelle API PUT /api/sessions/[id]
        const response = await fetch(`/api/sessions/${sessionId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            name: payload.name,
            campaign: JSON.stringify(payload.campaign)
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
    // Sauvegarder immédiatement (pas d'attente)
    if (this.currentSessionId) {
      this.saveSessionToServer(this.currentSessionId).catch((err) => {
        console.error('Erreur sauvegarde:', err)
      })
    }
  }

  updateCampaign(updatedCampaign) {
    if (this.currentSessionId && this.sessions[this.currentSessionId]) {
      this.sessions[this.currentSessionId].campaign = updatedCampaign
      // Sauvegarder immédiatement
      this.saveSessionToServer(this.currentSessionId).catch(() => {})
    }
  }

  deleteSession(sessionId) {
    delete this.sessions[sessionId]
    // Si on supprime la session actuelle, basculer sur une autre
    if (this.currentSessionId === sessionId) {
      const remaining = Object.keys(this.sessions)
      if (remaining.length > 0) {
        this.currentSessionId = remaining[0]
      } else {
        this.currentSessionId = null
      }
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

    // 🧠 Track la modification du chapitre
    this.trackImportantElement('chapitres', ch.titre, {
      resume: ch.resume,
      tags: ch.tags
    })

    // 🔓 Forcer la lecture des tags du chapitre modifié
    this.forceReadElementTags('chapitre', ch.titre)

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

      // 🧠 Track la modification du chapitre (ajout de tag)
      this.trackImportantElement('chapitres', ch.titre, {
        resume: ch.resume,
        tags: ch.tags
      })

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

    // 🧠 Track la modification du chapitre (suppression de tag)
    this.trackImportantElement('chapitres', ch.titre, {
      resume: ch.resume,
      tags: ch.tags
    })

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
    const pnj = c.pnj_importants[index]
    pnj[field] = value

    // 🧠 Track la modification du PNJ
    this.trackImportantElement('pnj', pnj.nom, {
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

    // 🔓 Forcer la lecture des tags du PNJ modifié
    this.forceReadElementTags('pnj', pnj.nom)

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

      // 🧠 Track la modification du PNJ (ajout de tag)
      this.trackImportantElement('pnj', p.nom, {
        role: p.role,
        description: p.description,
        emotion: p.emotion,
        caractere: p.caractere,
        valeurs: p.valeurs,
        peurs: p.peurs,
        desirs: p.desirs,
        histoire: p.histoire,
        tags: p.tags
      })

      this.saveCampaign()
      return true
    }
    return false
  }

  removeTagFromPNJ(pnjIndex, tag) {
    const c = this.getCurrentCampaign()
    if (!c || !(c.pnj_importants || [])[pnjIndex]) return false
    const p = c.pnj_importants[pnjIndex]
    p.tags = (p.tags || []).filter((t) => t !== tag)

    // 🧠 Track la modification du PNJ (suppression de tag)
    this.trackImportantElement('pnj', p.nom, {
      role: p.role,
      description: p.description,
      emotion: p.emotion,
      caractere: p.caractere,
      valeurs: p.valeurs,
      peurs: p.peurs,
      desirs: p.desirs,
      histoire: p.histoire,
      tags: p.tags
    })

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
    const lieu = c.lieux_importants[index]
    lieu[field] = value

    // 🧠 Track la modification du lieu
    this.trackImportantElement('lieux', lieu.nom, {
      description: lieu.description,
      tags: lieu.tags
    })

    // 🔓 Forcer la lecture des tags du lieu modifié
    this.forceReadElementTags('lieu', lieu.nom)

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

      // 🧠 Track la modification du lieu (ajout de tag)
      this.trackImportantElement('lieux', l.nom, {
        description: l.description,
        tags: l.tags
      })

      this.saveCampaign()
      return true
    }
    return false
  }

  removeTagFromLieu(lieuIndex, tag) {
    const c = this.getCurrentCampaign()
    if (!c || !(c.lieux_importants || [])[lieuIndex]) return false
    const l = c.lieux_importants[lieuIndex]
    l.tags = (l.tags || []).filter((t) => t !== tag)

    // 🧠 Track la modification du lieu (suppression de tag)
    this.trackImportantElement('lieux', l.nom, {
      description: l.description,
      tags: l.tags
    })

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
    const evt = c.evenements_cles[index]
    evt[field] = value

    // 🧠 Track la modification de l'événement
    this.trackImportantElement('evenements', evt.titre, {
      description: evt.description,
      consequences: evt.consequences,
      personnages_impliques: evt.personnages_impliques,
      lieux_impliques: evt.lieux_impliques,
      tags: evt.tags
    })

    // 🔓 Forcer la lecture des tags de l'événement modifié
    this.forceReadElementTags('evenement', evt.titre)

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

      // 🧠 Track la modification de l'événement (ajout de tag)
      this.trackImportantElement('evenements', e.titre, {
        description: e.description,
        consequences: e.consequences,
        personnages_impliques: e.personnages_impliques,
        lieux_impliques: e.lieux_impliques,
        tags: e.tags
      })

      this.saveCampaign()
      return true
    }
    return false
  }

  removeTagFromEvenement(index, tag) {
    const c = this.getCurrentCampaign()
    if (!c || !(c.evenements_cles || [])[index]) return false
    const e = c.evenements_cles[index]
    e.tags = (e.tags || []).filter((t) => t !== tag)

    // 🧠 Track la modification de l'événement (suppression de tag)
    this.trackImportantElement('evenements', e.titre, {
      description: e.description,
      consequences: e.consequences,
      personnages_impliques: e.personnages_impliques,
      lieux_impliques: e.lieux_impliques,
      tags: e.tags
    })

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

  // 🔄 Vérifier si un tag doit être lu (throttling)
  shouldReadTag(tagName) {
    if (!this.currentSessionId) return true

    if (!this.tagThrottleMap[this.currentSessionId]) {
      this.tagThrottleMap[this.currentSessionId] = {}
    }

    const tagInfo = this.tagThrottleMap[this.currentSessionId][tagName]

    // Si jamais lu, lire maintenant
    if (!tagInfo) {
      this.tagThrottleMap[this.currentSessionId][tagName] = {
        lastReadAt: Date.now(),
        readCount: 1
      }
      return true
    }

    // Si lu récemment (moins de 8 échanges), ne pas relire
    if (tagInfo.readCount < this.tagThrottleInterval) {
      tagInfo.readCount++
      return false
    }

    // Après 8 échanges, relire et réinitialiser le compteur
    tagInfo.readCount = 1
    tagInfo.lastReadAt = Date.now()
    return true
  }

  // 🧹 Nettoyer les tags: supprimer les vides et les espaces
  cleanTags(tags) {
    if (!Array.isArray(tags)) return []

    return tags
      .map((tag) => String(tag).trim())
      .filter((tag) => tag.length > 0)
  }

  // 🔓 Forcer la lecture d'un tag (pour les modifications)
  // Quand on modifie un élément, on veut que l'IA relise ses infos
  forceReadTag(tagName) {
    if (!this.currentSessionId) return

    if (!this.tagThrottleMap[this.currentSessionId]) {
      this.tagThrottleMap[this.currentSessionId] = {}
    }

    // Réinitialiser le compteur pour forcer la lecture au prochain échange
    this.tagThrottleMap[this.currentSessionId][tagName] = {
      lastReadAt: Date.now(),
      readCount: 0 // Forcer la lecture
    }
  }

  // 🔓 Forcer la lecture de tous les tags d'un élément
  forceReadElementTags(elementType, elementName) {
    const c = this.getCurrentCampaign()
    if (!c) return

    let tags = []
    if (elementType === 'pnj') {
      const pnj = (c.pnj_importants || []).find((p) => p.nom === elementName)
      tags = pnj?.tags || []
    } else if (elementType === 'lieu') {
      const lieu = (c.lieux_importants || []).find((l) => l.nom === elementName)
      tags = lieu?.tags || []
    } else if (elementType === 'evenement') {
      const evt = (c.evenements_cles || []).find((e) => e.titre === elementName)
      tags = evt?.tags || []
    } else if (elementType === 'chapitre') {
      const ch = (c.chapitres || []).find((x) => x.titre === elementName)
      tags = ch?.tags || []
    }

    // Forcer la lecture de tous les tags
    tags.forEach((tag) => this.forceReadTag(tag))
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
      // 🔄 Vérifier si ce tag doit être lu maintenant (throttling)
      if (!this.shouldReadTag(tag)) {
        return // Sauter ce tag, il a été lu récemment
      }

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

        // 🧠 Track la modification du PNJ par l'IA
        this.trackImportantElement('pnj', pnj.nom, {
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

        // 🔓 Forcer la lecture des tags du PNJ modifié par l'IA
        this.forceReadElementTags('pnj', pnj.nom)
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

        // 🧹 Nettoyer les tags
        const cleanedTags = this.cleanTags(data.tags || [])

        const newChapitre = {
          id,
          titre: data.titre,
          resume: data.resume,
          tags: cleanedTags,
          date: new Date().toISOString(),
          priorite: 5
        }
        c.chapitres.push(newChapitre)

        // 🧠 Track le chapitre dans la mémoire importante
        this.trackImportantElement('chapitres', data.titre, {
          resume: data.resume,
          tags: cleanedTags
        })
      } else if (type === 'PNJ') {
        c.pnj_importants = c.pnj_importants || []
        const existing = (c.pnj_importants || []).find((p) => p.nom === data.nom)

        // 🧹 Nettoyer les tags
        const cleanedTags = this.cleanTags(data.tags || [])

        if (existing) {
          existing.description = data.description
          existing.tags = cleanedTags
        } else {
          const newPNJ = {
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
            tags: cleanedTags,
            priorite: 5
          }
          c.pnj_importants.push(newPNJ)

          // 🧠 Track le PNJ dans la mémoire importante
          this.trackImportantElement('pnj', data.nom, {
            role: data.role,
            description: data.description,
            emotion: 'C50-A30-P50-H10-R50-J10',
            caractere: '',
            valeurs: '',
            peurs: '',
            desirs: '',
            histoire: '',
            tags: data.tags || []
          })
        }
      } else if (type === 'LIEU') {
        c.lieux_importants = c.lieux_importants || []
        const existing = (c.lieux_importants || []).find((l) => l.nom === data.nom)

        // 🧹 Nettoyer les tags
        const cleanedTags = this.cleanTags(data.tags || [])

        if (existing) {
          existing.description = data.description
          existing.tags = cleanedTags
        } else {
          c.lieux_importants.push({
            nom: data.nom,
            description: data.description,
            tags: cleanedTags,
            priorite: 5
          })

          // 🧠 Track le lieu dans la mémoire importante
          this.trackImportantElement('lieux', data.nom, {
            description: data.description,
            tags: cleanedTags
          })
        }
      } else if (type === 'EVENEMENT') {
        // 🧹 Nettoyer les tags
        const cleanedTags = this.cleanTags(data.tags || [])

        const newEvenement = {
          titre: data.titre,
          description: data.description,
          consequences: data.consequences,
          personnages_impliques: [],
          lieux_impliques: [],
          tags: cleanedTags,
          date: new Date().toISOString(),
          priorite: 5
        }
        c.evenements_cles = c.evenements_cles || []
        c.evenements_cles.push(newEvenement)

        // 🧠 Track l'événement dans la mémoire importante
        this.trackImportantElement('evenements', data.titre, {
          description: data.description,
          consequences: data.consequences,
          personnages_impliques: [],
          lieux_impliques: [],
          tags: cleanedTags
        })
      }
    })

    this.saveCampaign()
  }

  // 🧠 TRACKER D'ÉLÉMENTS IMPORTANTS
  // Enregistre les éléments clés avec TOUTES leurs données pour les retrouver même s'ils sont vieux
  trackImportantElement(type, name, data = {}) {
    if (!this.currentSessionId) return

    if (!this.importantMemory[this.currentSessionId]) {
      this.importantMemory[this.currentSessionId] = {
        pnj: {},
        lieux: {},
        evenements: {},
        chapitres: {}
      }
    }

    const memory = this.importantMemory[this.currentSessionId]
    const typeKey = type.toLowerCase()

    if (memory[typeKey]) {
      // Stocker les données complètes de l'élément
      memory[typeKey][name] = {
        ...data,
        lastSeen: new Date().toISOString(),
        frequency: (memory[typeKey][name]?.frequency || 0) + 1
      }
    }
  }

  // 🔍 RÉCUPÉRER LES ÉLÉMENTS IMPORTANTS
  getImportantElements(limit = 10) {
    if (!this.currentSessionId || !this.importantMemory[this.currentSessionId]) {
      return []
    }

    const memory = this.importantMemory[this.currentSessionId]
    const allElements = []

    // Collecter tous les éléments avec leur fréquence
    Object.entries(memory).forEach(([type, items]) => {
      Object.entries(items).forEach(([name, data]) => {
        allElements.push({
          type,
          name,
          frequency: data.frequency || 0,
          lastSeen: data.lastSeen,
          ...data
        })
      })
    })

    // Trier par fréquence (décroissant) puis par date
    return allElements
      .sort((a, b) => {
        if (b.frequency !== a.frequency) return b.frequency - a.frequency
        return new Date(b.lastSeen) - new Date(a.lastSeen)
      })
      .slice(0, limit)
  }

  generateOptimizedContext(userMessage, messageCount) {
    const c = this.getCurrentCampaign()
    if (!c) return 'Aucun contexte de campagne.'

    // 🔍 CACHE DES TAGS: Éviter de rechercher les tags trop souvent
    if (!this.tagsCacheTimestamp) {
      this.tagsCacheTimestamp = 0
      this.tagsCache = {}
    }

    const now = Date.now()
    const cacheExpiry = 30000 // 30 secondes

    let tagsInMessage = []
    if (now - this.tagsCacheTimestamp < cacheExpiry && this.tagsCache[userMessage]) {
      // Utiliser le cache
      tagsInMessage = this.tagsCache[userMessage]
    } else {
      // Recalculer et mettre en cache
      tagsInMessage = this.findTagsInMessage(userMessage)
      this.tagsCache[userMessage] = tagsInMessage
      this.tagsCacheTimestamp = now
    }

    const context = this.getElementsByTags(tagsInMessage)

    let output = `CAMPAGNE: ${c.meta?.titre || 'Sans titre'}\n\n`

    if (c.meta?.resume_global) {
      output += `RÉSUMÉ: ${c.meta.resume_global}\n\n`
    }

    // 📌 PRIORITÉ: Afficher les éléments par priorité (pas juste les 3 premiers)
    if (c.chapitres && c.chapitres.length > 0) {
      output += `CHAPITRES (${c.chapitres.length}):\n`
      // Trier par priorité (décroissant) puis par date
      const chapitresTries = [...c.chapitres]
        .sort((a, b) => (b.priorite || 5) - (a.priorite || 5))
        .slice(0, 5)
      chapitresTries.forEach((ch) => {
        output += `- ${ch.titre} [P${ch.priorite || 5}]: ${ch.resume}\n`
      })
      output += '\n'
    }

    if (c.pnj_importants && c.pnj_importants.length > 0) {
      output += `PNJ IMPORTANTS (${c.pnj_importants.length}):\n`
      // Trier par priorité (décroissant)
      const pnjTries = [...c.pnj_importants]
        .sort((a, b) => (b.priorite || 5) - (a.priorite || 5))
        .slice(0, 5)
      pnjTries.forEach((pnj) => {
        const emotions = pnj.emotion ? ` [${pnj.emotion}]` : ''
        output += `- ${pnj.nom} (${pnj.role})${emotions}: ${pnj.description}\n`
      })
      output += '\n'
    }

    if (c.lieux_importants && c.lieux_importants.length > 0) {
      output += `LIEUX (${c.lieux_importants.length}):\n`
      // Trier par priorité (décroissant)
      const lieuTries = [...c.lieux_importants]
        .sort((a, b) => (b.priorite || 5) - (a.priorite || 5))
        .slice(0, 5)
      lieuTries.forEach((lieu) => {
        output += `- ${lieu.nom} [P${lieu.priorite || 5}]: ${lieu.description}\n`
      })
      output += '\n'
    }

    // 🎯 CONTEXTE PERTINENT: Éléments liés aux tags du message
    if (context) {
      output += `CONTEXTE PERTINENT (tags détectés: ${tagsInMessage.join(', ')}):\n`
      output += context
    }

    // 🧠 MÉMOIRE IMPORTANTE: Éléments clés même s'ils sont vieux
    const importantElements = this.getImportantElements(10)
    if (importantElements.length > 0) {
      output += `\nMÉMOIRE IMPORTANTE (éléments clés):\n`
      importantElements.forEach((elem) => {
        if (elem.type === 'pnj') {
          // Format PNJ complet
          const emotions = elem.emotion ? ` [${elem.emotion}]` : ''
          output += `- [PNJ] ${elem.name} (${elem.role})${emotions}: ${elem.description}\n`
          if (elem.desirs) output += `  Désirs: ${elem.desirs}\n`
          if (elem.peurs) output += `  Peurs: ${elem.peurs}\n`
        } else if (elem.type === 'lieux') {
          // Format Lieu
          output += `- [LIEU] ${elem.name}: ${elem.description}\n`
        } else if (elem.type === 'evenements') {
          // Format Événement
          output += `- [ÉVÉNEMENT] ${elem.name}: ${elem.description}\n`
          if (elem.consequences) output += `  Conséquences: ${elem.consequences}\n`
        } else if (elem.type === 'chapitres') {
          // Format Chapitre - résumé court d'un arc narratif
          output += `- [CHAPITRE] ${elem.name}: ${elem.resume}\n`
        }
      })
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
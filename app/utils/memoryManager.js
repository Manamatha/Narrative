import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Récupère la clé utilisateur unique depuis l'API
async function getUserId() {
  if (typeof window === 'undefined') return null;
  
  try {
    const res = await fetch('/api/config');
    const { USER_KEY } = await res.json();
    return USER_KEY;
  } catch (err) {
    console.warn('⚠️ Impossible de charger USER_KEY:', err);
    return 'user_default';
  }
}

// Crée l'utilisateur s'il n'existe pas
async function ensureUserExists(userId) {
  try {
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId }
    });
  } catch (err) {
    console.warn("⚠️ Erreur création utilisateur:", err);
  }
}

async function loadSessionsFromDB(userId) {
  if (!userId) return { sessions: {}, sessionChats: {} };
  
  try {
    const sessionsRaw = await prisma.session.findMany({
      where: { userId }
    });
    const sessions = {};
    const sessionChats = {};

    sessionsRaw.forEach(s => {
      const campaign = JSON.parse(s.campaign || '{}');
      sessions[s.id] = {
        id: s.id,
        name: s.name,
        campaign: campaign,
        createdAt: s.createdAt,
        lastAccessed: s.lastAccessed
      };
      sessionChats[s.id] = campaign.chats || [];
    });

    return { sessions, sessionChats };
  } catch (err) {
    console.warn("⚠️ Erreur chargement sessions:", err);
    return { sessions: {}, sessionChats: {} };
  }
}

async function saveSessionToDB(userId, sessionId, sessionData, chatData) {
  if (!userId) return;
  
  try {
    await ensureUserExists(userId);
    
    const campaignWithChats = { ...sessionData.campaign, chats: chatData };

    await prisma.session.upsert({
      where: { id: sessionId },
      update: {
        name: sessionData.name,
        campaign: JSON.stringify(campaignWithChats),
        lastAccessed: new Date()
      },
      create: {
        id: sessionId,
        userId,
        name: sessionData.name,
        campaign: JSON.stringify(campaignWithChats),
        createdAt: new Date(),
        lastAccessed: new Date()
      }
    });
  } catch (err) {
    console.error("❌ Erreur sauvegarde session:", err);
  }
}

class MemoryManager {
  constructor() {
    this.userId = null // sera initialisé dans loadFromServer()
    this.sessions = {}
    this.currentSessionId = null
    this.sessionChats = {}
    
    // Cache des tags pour contexte intelligent
    this.tagsRecherchesRecent = {}
    this.messageCountGlobal = 0

    // Timeout / batch pour éviter surcharge Vercel
    this.saveTimeout = null
    this.saveDelay = 1000 // 1s de délai pour batcher les sauvegardes

    this.loadSessions()
  }

  async loadFromServer() {
    try {
      // 1. Charger l'USER_KEY depuis le serveur
      if (!this.userId) {
        this.userId = await getUserId();
      }
      
      // 2. Charger les sessions depuis la BD
      const { sessions, sessionChats } = await loadSessionsFromDB(this.userId);
      this.sessions = sessions;
      this.sessionChats = sessionChats;
      this.currentSessionId = Object.keys(this.sessions)[0] || this.createNewSession();
    } catch (err) {
      console.warn("⚠️ Impossible de charger les sessions depuis la BD:", err);
    }
  }

  loadSessions() {
    if (typeof window !== 'undefined') {
      const savedSessions = localStorage.getItem('jdr_sessions')
      if (savedSessions) {
        const sessionsData = JSON.parse(savedSessions)
        this.sessions = sessionsData.sessions || {}
        this.currentSessionId = sessionsData.currentSessionId || this.createNewSession()
      } else {
        this.currentSessionId = this.createNewSession()
      }

      const savedChats = localStorage.getItem('jdr_session_chats')
      if (savedChats) {
        this.sessionChats = JSON.parse(savedChats)
      }
    }
  }

  // Sauvegarde batchée pour éviter timeouts Vercel
  saveAllData() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('jdr_sessions', JSON.stringify({
          sessions: this.sessions,
          currentSessionId: this.currentSessionId
        }))
        localStorage.setItem('jdr_session_chats', JSON.stringify(this.sessionChats))
        
        if (this.saveTimeout) clearTimeout(this.saveTimeout)
        this.saveTimeout = setTimeout(() => this.saveToServer(), this.saveDelay)
      } catch (error) {
        console.error("❌ Erreur sauvegarde:", error)
      }
    }
  }

  saveCampaign() {
    if (this.currentSessionId && this.sessions[this.currentSessionId]) {
      this.sessions[this.currentSessionId].campaign.meta.date_derniere_sauvegarde = new Date().toISOString()
      this.sessions[this.currentSessionId].lastAccessed = new Date().toISOString()
      this.saveAllData()
    }
  }

  async saveToServer() {
  if (!this.userId) return;
  try {
    // Sauvegarder TOUTES les sessions, pas juste l'actuelle
    const sessionIds = Object.keys(this.sessions);
    for (const sessionId of sessionIds) {
      await saveSessionToDB(
        this.userId,
        sessionId,
        this.sessions[sessionId],
        this.sessionChats[sessionId]
      );
    }
  } catch (err) {
    console.error("❌ Erreur sauvegarde session:", err);
  }
}


  createNewSession(name = "Nouvelle Aventure") {
    const sessionId = 'session_' + (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substr(2, 9))
    
    this.sessions[sessionId] = {
      id: sessionId,
      name: name,
      campaign: {
        meta: {
          titre: name,
          resume_global: "",
          date_creation: new Date().toISOString(),
          date_derniere_sauvegarde: new Date().toISOString()
        },
        style_narration: "Monde immersif et réactif. Rythme lent, agence joueur totale. Terminer par Que faites-vous ? PNJ uniques et cohérents, jamais automatiquement amicaux. Nuances contextuelles pour éviter la monotonie Intrigues diverses : politique, social, mystères, survie. Conséquences réalistes Contenu adulte maximal : vulgarité crédible, gore comme épice, érotisme avec fade-to-black. Tous joueurs consentants.",
        chapitres: [],
        pnj_importants: [],
        lieux_importants: [],
        evenements_cles: [],
        tags_globaux: [],
        memory_enabled: true
      },
      createdAt: new Date().toISOString(),
      lastAccessed: new Date().toISOString()
    }

    this.sessionChats[sessionId] = []
    this.saveAllData()
    return sessionId
  }

  switchSession(sessionId) {
    if (this.sessions[sessionId]) {
      this.currentSessionId = sessionId
      this.sessions[sessionId].lastAccessed = new Date().toISOString()
      this.saveAllData()
    }
  }

  getSessionMessages(sessionId = this.currentSessionId) {
    return this.sessionChats[sessionId] || []
  }

  setSessionMessages(messages, sessionId = this.currentSessionId) {
    this.sessionChats[sessionId] = messages
    this.saveAllData()
  }

  renameSession(sessionId, newName) {
    if (this.sessions[sessionId]) {
      this.sessions[sessionId].name = newName
      this.sessions[sessionId].campaign.meta.titre = newName
      this.saveAllData()
    }
  }

  deleteSession(sessionId) {
    if (Object.keys(this.sessions).length > 1) {
      delete this.sessions[sessionId]
      delete this.sessionChats[sessionId]
      if (this.currentSessionId === sessionId) {
        this.currentSessionId = Object.keys(this.sessions)[0]
      }
      this.saveAllData()
      // Supprimer aussi du serveur
      this.deleteSessionFromServer(sessionId)
    }
  }

  async deleteSessionFromServer(sessionId) {
    if (!this.userId) return
    try {
      await fetch('/api/sessions', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': this.userId
        },
        body: JSON.stringify({ id: sessionId })
      })
    } catch (err) {
      console.error("❌ Erreur suppression session serveur:", err)
    }
  }

  getCurrentCampaign() {
    return this.sessions[this.currentSessionId]?.campaign || null
  }

  getSessionsList() {
    return Object.values(this.sessions).sort((a, b) => 
      new Date(b.lastAccessed) - new Date(a.lastAccessed)
    )
  }

  loadCampaign() {
    return this.getCurrentCampaign()
  }
  generateOptimizedContext(dernierMessage, messageCount) {
    const campaign = this.getCurrentCampaign()
    if (!campaign) return ""

    let contexte = ""
    contexte += `AVENTURE: ${campaign.meta.titre}\n`
    if (campaign.meta.resume_global) {
      contexte += `RÉSUMÉ: ${campaign.meta.resume_global}\n`
    }

    if (messageCount % 8 === 0 && campaign.style_narration) {
      contexte += `STYLE: ${campaign.style_narration}\n`
    }

    const contexteTags = this.searchTagsIntelligent(dernierMessage)
    if (contexteTags) {
      contexte += contexteTags
    }

    return contexte
  }

  searchTagsIntelligent(dernierMessage) {
    if (!dernierMessage) return ""

    this.messageCountGlobal++

    Object.keys(this.tagsRecherchesRecent).forEach(tag => {
      if (this.messageCountGlobal - this.tagsRecherchesRecent[tag] > 8) {
        delete this.tagsRecherchesRecent[tag]
      }
    })

    const tagsTrouves = this.findTagsInMessage(dernierMessage)
    if (tagsTrouves.length === 0) return ""

    const tagsAFiltrer = tagsTrouves.filter(tag => !this.tagsRecherchesRecent[tag])
    if (tagsAFiltrer.length === 0) return ""

    tagsAFiltrer.forEach(tag => {
      this.tagsRecherchesRecent[tag] = this.messageCountGlobal
    })

    return this.getElementsByTags(tagsAFiltrer)
  }

  findTagsInMessage(message) {
    if (!message || typeof message !== 'string') return []

    const messageMinuscule = message.toLowerCase()
    const campaign = this.getCurrentCampaign()
    if (!campaign) return []

    const tagsTrouves = new Set()

    campaign.tags_globaux.forEach(tag => {
      if (messageMinuscule.includes(tag.toLowerCase())) tagsTrouves.add(tag)
    })

    campaign.pnj_importants.forEach(pnj => {
      if (messageMinuscule.includes(pnj.nom.toLowerCase())) {
        tagsTrouves.add(pnj.nom)
        pnj.tags.forEach(tag => tagsTrouves.add(tag))
      }
    })

    campaign.lieux_importants.forEach(lieu => {
      if (messageMinuscule.includes(lieu.nom.toLowerCase())) {
        tagsTrouves.add(lieu.nom)
        lieu.tags.forEach(tag => tagsTrouves.add(tag))
      }
    })

    return Array.from(tagsTrouves).slice(0, 5)
  }

  getElementsByTags(tags) {
    const campaign = this.getCurrentCampaign()
    if (!campaign || tags.length === 0) return ""

    let resultat = "\n// CONTEXTE RÉCENT:\n"

    tags.forEach(tag => {
      const lieux = campaign.lieux_importants.filter(lieu =>
        lieu.tags.includes(tag) || lieu.nom.toLowerCase().includes(tag.toLowerCase())
      )
      if (lieux.length > 0) resultat += `LIEUX[${tag}]: ${lieux.map(l => l.nom).join(', ')}\n`

      const pnj = campaign.pnj_importants.filter(p =>
        p.tags.includes(tag) || p.nom.toLowerCase().includes(tag.toLowerCase())
      )
      if (pnj.length > 0) resultat += `PNJ[${tag}]: ${pnj.map(p => p.nom).join(', ')}\n`
    })

    return resultat
  }

  processAISaves(sauvegardes) {
    const campaign = this.getCurrentCampaign()
    if (!campaign) return 0

    let savedCount = 0
    sauvegardes.forEach(save => {
      switch (save.type) {
        case 'LIEU':
          campaign.lieux_importants.push({
            nom: save.nom,
            description: save.description,
            tags: save.tags,
            priorite: 5
          })
          savedCount++
          break
        case 'PNJ':
          campaign.pnj_importants.push({
            nom: save.nom,
            role: save.role,
            description: save.description,
            emotion: "C50-A30-P50-H10-R50-J10",
            caractere: "",
            valeurs: "",
            peurs: "",
            desirs: "",
            histoire: "",
            vitesse_evolution: 1.0,
            tags: save.tags,
            priorite: 5
          })
          savedCount++
          break
        case 'EVENEMENT':
          campaign.evenements_cles.push({
            titre: save.titre || "Événement important",
            description: save.description || "",
            consequences: save.consequences || "",
            personnages_impliques: [],
            lieux_impliques: [],
            tags: save.tags,
            date: new Date().toISOString(),
            priorite: 5
          })
          savedCount++
          break
        case 'CHAPITRE':
          campaign.chapitres.push({
            id: campaign.chapitres.length + 1,
            titre: save.titre,
            resume: save.resume,
            tags: save.tags,
            date: new Date().toISOString(),
            priorite: 5
          })
          savedCount++
          break
      }
    })

    if (savedCount > 0) this.saveCampaign()
    return savedCount
  }
  processPNJUpdates(updates) {
    const campaign = this.getCurrentCampaign()
    if (!campaign) return 0

    let updatedCount = 0
    const maintenant = new Date().toISOString().split('T')[0]

    updates.forEach(update => {
      const pnj = campaign.pnj_importants.find(p =>
        p.nom.toLowerCase() === update.nom.toLowerCase()
      )

      if (pnj) {
        const emotions = this.decoderEmotions(pnj.emotion)
        const vitesse = pnj.vitesse_evolution || 1.0
        const changementBase = parseInt(update.changement)
        const changementFinal = Math.round(changementBase * vitesse)

        if (emotions[update.emotion] !== undefined) {
          const ancienneValeur = emotions[update.emotion]
          emotions[update.emotion] = Math.max(0, Math.min(100, ancienneValeur + changementFinal))
          pnj.emotion = this.encoderEmotions(emotions)

          const evenement = `${maintenant}: ${update.raison} → ${update.emotion}${changementFinal >= 0 ? '+' : ''}${changementFinal}`
          if (pnj.histoire) {
            pnj.histoire += ` | ${evenement}`
          } else {
            pnj.histoire = evenement
          }

          updatedCount++
        }
      }
    })

    if (updatedCount > 0) this.saveCampaign()
    return updatedCount
  }

  decoderEmotions(emotionCode) {
    if (!emotionCode) return { confiance:50, amour:30, peur:50, haine:10, respect:50, jalousie:10 }
    const emotions = { confiance:50, amour:30, peur:50, haine:10, respect:50, jalousie:10 }
    emotionCode.split('-').forEach(part => {
      const code = part[0]
      const valeur = parseInt(part.slice(1))
      const map = { 'C':'confiance','A':'amour','P':'peur','H':'haine','R':'respect','J':'jalousie' }
      if(map[code] && !isNaN(valeur)) emotions[map[code]] = valeur
    })
    return emotions
  }

  encoderEmotions(emotions) {
    const map = { 'confiance':'C','amour':'A','peur':'P','haine':'H','respect':'R','jalousie':'J' }
    return Object.entries(emotions).map(([emotion,valeur])=>`${map[emotion]}${valeur}`).join('-')
  }

  getCampaign() { return this.getCurrentCampaign() }

  updateCampaign(updatedCampaign) {
    if(this.currentSessionId && this.sessions[this.currentSessionId]){
      this.sessions[this.currentSessionId].campaign = updatedCampaign
      this.saveCampaign()
    }
  }

  addGlobalTag(tag){
    const campaign = this.getCurrentCampaign()
    if(campaign && tag && !campaign.tags_globaux.includes(tag)){
      campaign.tags_globaux.push(tag.trim())
      this.saveCampaign()
      return true
    }
    return false
  }

  removeGlobalTag(tag){
    const campaign = this.getCurrentCampaign()
    if(campaign){
      campaign.tags_globaux = campaign.tags_globaux.filter(t=>t!==tag)
      this.saveCampaign()
      return true
    }
    return false
  }

  updateStyleNarration(newStyle){
    if(this.currentSessionId && this.sessions[this.currentSessionId]){
      this.sessions[this.currentSessionId].campaign.style_narration = newStyle
      this.saveCampaign()
      return true
    }
    return false
  }

  updateMeta(field,value){
    if(this.currentSessionId && this.sessions[this.currentSessionId]){
      this.sessions[this.currentSessionId].campaign.meta[field] = value
      this.saveCampaign()
      return true
    }
    return false
  }

  // === Chapitres ===
  addChapitre(){
    const campaign = this.getCurrentCampaign()
    if(campaign){
      const newId = Math.max(0,...campaign.chapitres.map(c=>c.id))+1
      campaign.chapitres.push({id:newId,titre:"Nouveau chapitre",resume:"",tags:[],date:new Date().toISOString(),priorite:5})
      this.saveCampaign()
      return newId
    }
    return null
  }

  updateChapitre(id,field,value){
    const campaign = this.getCurrentCampaign()
    if(campaign){
      const chapitre = campaign.chapitres.find(c=>c.id===id)
      if(chapitre && chapitre[field]!==undefined){
        chapitre[field]=value
        this.saveCampaign()
        return true
      }
    }
    return false
  }

  addTagToChapitre(chapitreId,tag){
    const campaign=this.getCurrentCampaign()
    if(campaign){
      const chapitre=campaign.chapitres.find(c=>c.id===chapitreId)
      if(chapitre && !chapitre.tags.includes(tag)){
        chapitre.tags.push(tag)
        this.saveCampaign()
        return true
      }
    }
    return false
  }

  removeTagFromChapitre(chapitreId,tag){
    const campaign=this.getCurrentCampaign()
    if(campaign){
      const chapitre=campaign.chapitres.find(c=>c.id===chapitreId)
      if(chapitre){
        chapitre.tags=chapitre.tags.filter(t=>t!==tag)
        this.saveCampaign()
        return true
      }
    }
    return false
  }

  deleteChapitre(id){
    const campaign=this.getCurrentCampaign()
    if(campaign){
      campaign.chapitres=campaign.chapitres.filter(c=>c.id!==id)
      this.saveCampaign()
      return true
    }
    return false
  }
  // === PNJ ===
  addPNJ(){
    const campaign=this.getCurrentCampaign()
    if(campaign){
      campaign.pnj_importants.push({nom:"Nouveau PNJ",role:"",description:"",emotion:"C50-A30-P50-H10-R50-J10",caractere:"",valeurs:"",peurs:"",desirs:"",histoire:"",vitesse_evolution:1.0,tags:[],priorite:5})
      this.saveCampaign()
      return true
    }
    return false
  }

  updatePNJ(index,field,value){
    const campaign=this.getCurrentCampaign()
    if(campaign && campaign.pnj_importants[index]){
      campaign.pnj_importants[index][field]=value
      this.saveCampaign()
      return true
    }
    return false
  }

  addTagToPNJ(pnjIndex,tag){
    const campaign=this.getCurrentCampaign()
    if(campaign && campaign.pnj_importants[pnjIndex]){
      if(!campaign.pnj_importants[pnjIndex].tags.includes(tag)){
        campaign.pnj_importants[pnjIndex].tags.push(tag)
        this.saveCampaign()
        return true
      }
    }
    return false
  }

  removeTagFromPNJ(pnjIndex,tag){
    const campaign=this.getCurrentCampaign()
    if(campaign && campaign.pnj_importants[pnjIndex]){
      campaign.pnj_importants[pnjIndex].tags=campaign.pnj_importants[pnjIndex].tags.filter(t=>t!==tag)
      this.saveCampaign()
      return true
    }
    return false
  }

  deletePNJ(index){
    const campaign=this.getCurrentCampaign()
    if(campaign && campaign.pnj_importants[index]){
      campaign.pnj_importants.splice(index,1)
      this.saveCampaign()
      return true
    }
    return false
  }

  // === Lieux ===
  addLieu(){
    const campaign=this.getCurrentCampaign()
    if(campaign){
      campaign.lieux_importants.push({nom:"Nouveau lieu",description:"",tags:[],priorite:5})
      this.saveCampaign()
      return true
    }
    return false
  }

  updateLieu(index,field,value){
    const campaign=this.getCurrentCampaign()
    if(campaign && campaign.lieux_importants[index]){
      campaign.lieux_importants[index][field]=value
      this.saveCampaign()
      return true
    }
    return false
  }

  addTagToLieu(lieuIndex,tag){
    const campaign=this.getCurrentCampaign()
    if(campaign && campaign.lieux_importants[lieuIndex]){
      if(!campaign.lieux_importants[lieuIndex].tags.includes(tag)){
        campaign.lieux_importants[lieuIndex].tags.push(tag)
        this.saveCampaign()
        return true
      }
    }
    return false
  }

  removeTagFromLieu(lieuIndex,tag){
    const campaign=this.getCurrentCampaign()
    if(campaign && campaign.lieux_importants[lieuIndex]){
      campaign.lieux_importants[lieuIndex].tags=campaign.lieux_importants[lieuIndex].tags.filter(t=>t!==tag)
      this.saveCampaign()
      return true
    }
    return false
  }

  deleteLieu(index){
    const campaign=this.getCurrentCampaign()
    if(campaign && campaign.lieux_importants[index]){
      campaign.lieux_importants.splice(index,1)
      this.saveCampaign()
      return true
    }
    return false
  }

  // === Événements ===
  addEvenement(){
    const campaign=this.getCurrentCampaign()
    if(campaign){
      campaign.evenements_cles.push({titre:"Nouvel événement",description:"",consequences:"",personnages_impliques:[],lieux_impliques:[],tags:[],date:new Date().toISOString(),priorite:5})
      this.saveCampaign()
      return true
    }
    return false
  }

  updateEvenement(index,field,value){
    const campaign=this.getCurrentCampaign()
    if(campaign && campaign.evenements_cles[index]){
      campaign.evenements_cles[index][field]=value
      this.saveCampaign()
      return true
    }
    return false
  }

  addTagToEvenement(index,tag){
    const campaign=this.getCurrentCampaign()
    if(campaign && campaign.evenements_cles[index]){
      if(!campaign.evenements_cles[index].tags.includes(tag)){
        campaign.evenements_cles[index].tags.push(tag)
        this.saveCampaign()
        return true
      }
    }
    return false
  }

  removeTagFromEvenement(index,tag){
    const campaign=this.getCurrentCampaign()
    if(campaign && campaign.evenements_cles[index]){
      campaign.evenements_cles[index].tags=campaign.evenements_cles[index].tags.filter(t=>t!==tag)
      this.saveCampaign()
      return true
    }
    return false
  }

  deleteEvenement(index){
    const campaign=this.getCurrentCampaign()
    if(campaign && campaign.evenements_cles[index]){
      campaign.evenements_cles.splice(index,1)
      this.saveCampaign()
      return true
    }
    return false
  }

  // === Gestion tags globaux ===
  getAvailableTags(){
    const campaign=this.getCurrentCampaign()
    if(!campaign) return []
    return [...new Set([...campaign.tags_globaux,
      ...campaign.pnj_importants.flatMap(p=>p.tags),
      ...campaign.lieux_importants.flatMap(l=>l.tags),
      ...campaign.chapitres.flatMap(c=>c.tags),
      ...campaign.evenements_cles.flatMap(e=>e.tags)
    ])]
  }

  setAvailableTags(tags){
    const campaign=this.getCurrentCampaign()
    if(!campaign) return false
    campaign.tags_globaux=tags
    this.saveCampaign()
    return true
  }
}

let memoryManagerInstance=null
export function getMemoryManager(){
  if(!memoryManagerInstance) memoryManagerInstance=new MemoryManager()
  return memoryManagerInstance
}
export default MemoryManager
# 🔧 CORRECTIONS À APPORTER

## 1. SessionManager.jsx - Erreurs de méthodes

### Erreur 1 (Ligne 27): `saveToServer()` n'existe pas
```javascript
// ❌ INCORRECT
await memoryManager.saveToServer()

// ✅ CORRECT
await memoryManager.saveSessionToServer(sessionId)
```

### Erreur 2 (Ligne 41): Variable `messages` non définie
```javascript
// ❌ INCORRECT (dans switchToSession)
memoryManager.sessions[memoryManager.currentSessionId].campaign.messages = messages

// ✅ CORRECT - Supprimer cette ligne ou utiliser les messages du state
// Cette ligne n'est pas nécessaire car les messages sont gérés dans app/page.js
```

### Erreur 3 (Ligne 68): `deleteSession()` n'existe pas
```javascript
// ❌ INCORRECT
memoryManager.deleteSession(sessionId)

// ✅ CORRECT - Implémenter la suppression via API
const response = await fetch('/api/sessions', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id: sessionId })
})
```

---

## 2. MemoryManager.jsx - Erreur de méthode

### Erreur (Ligne 57): `getCampaign()` n'existe pas
```javascript
// ❌ INCORRECT
const currentCampaign = memoryManager.getCampaign()

// ✅ CORRECT
const currentCampaign = memoryManager.getCurrentCampaign()
```

---

## 3. app/api/auth/pin/route.js - Vérifier la casse

### Ligne 53: Vérifier le modèle Prisma
```javascript
// Vérifier que le modèle est bien "PINLog" (avec majuscules)
// Dans prisma/schema.prisma, le modèle est défini comme:
// model PINLog { ... }

// Donc l'appel devrait être:
await prisma.pINLog.create({ ... })  // ✅ Correct (Prisma utilise camelCase)
```

---

## 4. .env.example - Nettoyer le contenu dupliqué

**Problème:** Lignes 1-17 et 18-33 sont dupliquées

**Solution:** Garder une seule version:
```env
# PostgreSQL - connection string
DATABASE_URL="postgresql://user:password@host:5432/database"

# OpenAI API key
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# User key for multi-device sync (optional)
USER_KEY=user_moi
```

---

## 5. Implémenter la route de déconnexion

**Créer:** `app/api/auth/logout/route.js`

```javascript
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request) {
  try {
    const cookieHeader = request.headers.get('cookie') || ''
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [k, v] = c.split('=') || ['', '']
        return [k.trim(), v ? v.trim() : '']
      })
    )
    const token = cookies['sessionToken']
    
    if (token) {
      await prisma.authToken.delete({ where: { token } })
    }
    
    const setCookie = 'sessionToken=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0'
    return new Response(
      JSON.stringify({ ok: true, message: 'Déconnecté' }),
      { 
        status: 200, 
        headers: { 
          'Set-Cookie': setCookie,
          'Content-Type': 'application/json'
        }
      }
    )
  } catch (error) {
    console.error('Erreur déconnexion:', error)
    return NextResponse.json(
      { error: `Erreur: ${error.message}` },
      { status: 500 }
    )
  }
}
```

---

## 6. Ajouter la méthode `saveToServer()` dans MemoryManager.js

**Ajouter après la méthode `saveSessionToServer()`:**

```javascript
async saveToServer() {
  try {
    if (this.currentSessionId) {
      await this.saveSessionToServer(this.currentSessionId)
    }
  } catch (e) {
    console.error('saveToServer error:', e)
  }
}
```

---

## 7. Ajouter la méthode `deleteSession()` dans MemoryManager.js

**Ajouter dans la classe:**

```javascript
deleteSession(sessionId) {
  if (this.sessions[sessionId]) {
    delete this.sessions[sessionId]
    delete this.sessionChats[sessionId]
    
    // Si c'était la session courante, basculer sur une autre
    if (this.currentSessionId === sessionId) {
      const remaining = Object.keys(this.sessions)
      this.currentSessionId = remaining.length > 0 ? remaining[0] : null
    }
    return true
  }
  return false
}
```

---

## 📋 ORDRE DE PRIORITÉ

1. **URGENT:** Configurer `.env` (DATABASE_URL, OPENAI_API_KEY)
2. **URGENT:** Corriger SessionManager.jsx (3 erreurs)
3. **URGENT:** Corriger MemoryManager.jsx (1 erreur)
4. **HAUTE:** Ajouter les méthodes manquantes dans MemoryManager.js
5. **HAUTE:** Implémenter `/api/auth/logout`
6. **MOYENNE:** Nettoyer `.env.example`
7. **BASSE:** Tester l'ensemble du flux


# 📝 FICHIERS À CRÉER/MODIFIER

## 1️⃣ FICHIERS À CRÉER

### 1.1 `.env` (Créer depuis `.env.example`)
**Chemin:** `e:\Narrative IA\jdr-ia-narrative\.env`

```env
# PostgreSQL - connection string
DATABASE_URL="postgresql://user:password@host:5432/database"

# OpenAI API key
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# User key for multi-device sync (optional)
USER_KEY=user_moi
```

**Actions:**
1. Copier `.env.example` en `.env`
2. Remplir les valeurs réelles
3. Vérifier avec `npm run check-env`
4. NE PAS commiter ce fichier

---

### 1.2 `app/api/auth/logout/route.js` (Nouvelle route)
**Chemin:** `e:\Narrative IA\jdr-ia-narrative\app\api\auth\logout\route.js`

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

## 2️⃣ FICHIERS À MODIFIER

### 2.1 `app/components/SessionManager.jsx`
**Chemin:** `e:\Narrative IA\jdr-ia-narrative\app\components\SessionManager.jsx`

**Modifications:**

#### Ligne 27 - Corriger saveToServer()
```diff
- await memoryManager.saveToServer()
+ await memoryManager.saveSessionToServer(sessionId)
```

#### Ligne 41 - Supprimer la ligne invalide
```diff
  const switchToSession = async (sessionId) => {
  const memoryManager = getMemoryManager()

  // 1️⃣ sauvegarde les messages de la session actuelle
  if (memoryManager.currentSessionId) {
-   memoryManager.sessions[memoryManager.currentSessionId].campaign.messages = messages
    await memoryManager.saveToServer()
  }
```

#### Ligne 68 - Corriger deleteSession()
```diff
- memoryManager.deleteSession(sessionId)
- await memoryManager.saveToServer()
+ const res = await fetch('/api/sessions', {
+   method: 'DELETE',
+   headers: { 'Content-Type': 'application/json' },
+   body: JSON.stringify({ id: sessionId })
+ })
+ if (!res.ok) {
+   console.error('Erreur suppression session')
+   return
+ }
```

---

### 2.2 `app/components/MemoryManager.jsx`
**Chemin:** `e:\Narrative IA\jdr-ia-narrative\app\components\MemoryManager.jsx`

**Modification:**

#### Ligne 57 - Corriger getCampaign()
```diff
  const loadCampaign = () => {
    const memoryManager = getMemoryManager()
-   const currentCampaign = memoryManager.getCampaign()
+   const currentCampaign = memoryManager.getCurrentCampaign()
    if (currentCampaign) {
      setCampaign(currentCampaign)
      setMemoryEnabled(currentCampaign.memory_enabled !== false)
    }
  }
```

---

### 2.3 `app/utils/memoryManager.js`
**Chemin:** `e:\Narrative IA\jdr-ia-narrative\app\utils\memoryManager.js`

**Ajouter après la méthode `saveSessionToServer()` (après ligne 187):**

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

### 2.4 `app/page.js`
**Chemin:** `e:\Narrative IA\jdr-ia-narrative\app\page.js`

**Modification:**

#### Ligne 73-78 - Mettre à jour handleLogout()
```diff
const handleLogout = () => {
-  // to logout, call server to clear cookie (not implemented) and clear client state
+  // Appeler le serveur pour supprimer le token
+  fetch('/api/auth/logout', { method: 'POST' })
+    .catch(err => console.error('Erreur déconnexion:', err))
+  
+  // Nettoyer l'état client
  setIsAuthenticated(false)
  setMessages([])
  setCurrentSession(null)
}
```

---

### 2.5 `.env.example`
**Chemin:** `e:\Narrative IA\jdr-ia-narrative\.env.example`

**Remplacer le contenu par:**

```env
# PostgreSQL - connection string
# Ex: postgresql://user:password@host:5432/database
DATABASE_URL="postgresql://user:password@host:5432/database"

# OpenAI API key
# Ex: sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# User key for multi-device sync (optional)
USER_KEY=user_moi
```

---

## 3️⃣ FICHIERS À VÉRIFIER

### 3.1 `app/api/auth/pin/route.js`
**Chemin:** `e:\Narrative IA\jdr-ia-narrative\app\api\auth\pin\route.js`

**À vérifier (Ligne 53):**
```javascript
// Vérifier que le modèle Prisma est bien "PINLog"
// et que l'appel utilise la bonne casse
await prisma.pINLog.create({ data: { userId: user.id, ipAddress, userAgent } })
```

**Vérifier dans `prisma/schema.prisma`:**
```prisma
model PINLog {  // ← Vérifier la casse
  id        Int      @id @default(autoincrement())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  ipAddress String?
  userAgent String?
  
  @@index([userId])
  @@index([createdAt])
}
```

---

## 📊 Résumé des Modifications

| Fichier | Action | Priorité |
|---------|--------|----------|
| `.env` | Créer | 🔴 URGENT |
| `app/api/auth/logout/route.js` | Créer | 🟡 HAUTE |
| `app/components/SessionManager.jsx` | Modifier (3 lignes) | 🔴 URGENT |
| `app/components/MemoryManager.jsx` | Modifier (1 ligne) | 🔴 URGENT |
| `app/utils/memoryManager.js` | Ajouter (2 méthodes) | 🟡 HAUTE |
| `app/page.js` | Modifier (1 fonction) | 🟡 HAUTE |
| `.env.example` | Nettoyer | 🟢 MOYENNE |
| `app/api/auth/pin/route.js` | Vérifier | 🟡 HAUTE |

---

## ✅ Ordre d'Exécution Recommandé

1. Créer `.env`
2. Modifier `SessionManager.jsx` (3 erreurs)
3. Modifier `MemoryManager.jsx` (1 erreur)
4. Ajouter méthodes dans `MemoryManager.js`
5. Créer `app/api/auth/logout/route.js`
6. Modifier `app/page.js`
7. Vérifier `app/api/auth/pin/route.js`
8. Nettoyer `.env.example`
9. Tester avec `npm run dev`

---

**Généré le:** 23 octobre 2025


# 🏗️ Architecture Prisma - Synchronisation Multi-Appareils

## Vue d'ensemble

L'application utilise maintenant **Prisma comme source de vérité** pour toutes les données de session. Cela permet une synchronisation transparente entre le PC et le téléphone.

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPABASE PostgreSQL                      │
│                   (Source de vérité)                        │
└─────────────────────────────────────────────────────────────┘
                            ↑
                            │ Prisma
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
    ┌───────┐           ┌───────┐          ┌───────┐
    │  PC   │           │ Phone │          │ Tablet│
    │ React │           │ React │          │ React │
    └───────┘           └───────┘          └───────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                    Polling (5s)
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
    ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
    │ /api/sessions│   │/api/sessions │   │/api/sessions │
    │              │   │    /sync     │   │    /[id]     │
    └──────────────┘   └──────────────┘   └──────────────┘
```

## Flux de données

### 1. Chargement initial (au login)
```
User login → /api/auth/pin → Cookie sessionToken
                                    ↓
                        app/page.js useEffect
                                    ↓
                    memoryManager.loadFromServer()
                                    ↓
                        GET /api/sessions
                                    ↓
                    Prisma: SELECT * FROM Session
                                    ↓
                    Charger en mémoire (client)
```

### 2. Création de session
```
User crée session → SessionManager.createNewSession()
                                    ↓
                    memoryManager.createNewSession()
                                    ↓
                    saveSessionToServer(sessionId)
                                    ↓
                    PUT /api/sessions/[id]
                                    ↓
                    Prisma: INSERT INTO Session
                                    ↓
                    Sauvegardé dans Supabase
```

### 3. Modification de session
```
User modifie campagne → MemoryManager.updateCampaign()
                                    ↓
                        saveCampaign()
                                    ↓
                    saveSessionToServer(sessionId)
                                    ↓
                    PUT /api/sessions/[id]
                                    ↓
                    Prisma: UPDATE Session
                                    ↓
                    Sauvegardé dans Supabase
```

### 4. Synchronisation multi-appareils (polling)
```
useSyncSessions hook (5s interval)
                                    ↓
                    memoryManager.syncFromServer()
                                    ↓
                    GET /api/sessions
                                    ↓
                    Prisma: SELECT * FROM Session
                                    ↓
                    Comparer timestamps (lastAccessed)
                                    ↓
                    Mettre à jour sessions modifiées
                                    ↓
                    Supprimer sessions supprimées
```

## Structure des données

### Session (Prisma)
```prisma
model Session {
  id             String   @id
  userId         String
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name           String
  campaign       String   // JSON stringifiée
  createdAt      DateTime @default(now())
  lastAccessed   DateTime @default(now())

  @@index([userId])
}
```

### Campaign (JSON dans Session.campaign)
```javascript
{
  meta: {
    titre: "Aventure",
    resume_global: "...",
    date_creation: "2024-01-01T00:00:00Z",
    date_derniere_sauvegarde: "2024-01-01T00:00:00Z"
  },
  chapitres: [],
  pnj_importants: [],
  lieux_importants: [],
  evenements_cles: [],
  tags_globaux: [],
  memory_enabled: true,
  messages: []
}
```

## API Endpoints

### GET /api/sessions
Récupère toutes les sessions de l'utilisateur
```bash
curl -H "Cookie: sessionToken=..." http://localhost:3000/api/sessions
```

### POST /api/sessions
Crée une nouvelle session (legacy, utiliser PUT /api/sessions/[id])
```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"name":"Nouvelle","campaign":"{}"}' \
  http://localhost:3000/api/sessions
```

### GET /api/sessions/[id]
Récupère une session spécifique
```bash
curl -H "Cookie: sessionToken=..." \
  http://localhost:3000/api/sessions/session_abc123
```

### PUT /api/sessions/[id]
Met à jour une session
```bash
curl -X PUT -H "Content-Type: application/json" \
  -d '{"name":"Nouveau nom","campaign":"{}"}' \
  http://localhost:3000/api/sessions/session_abc123
```

### DELETE /api/sessions/[id]
Supprime une session
```bash
curl -X DELETE -H "Cookie: sessionToken=..." \
  http://localhost:3000/api/sessions/session_abc123
```

### GET /api/sessions/sync?since=2024-01-01T00:00:00Z
Récupère les sessions modifiées depuis une date
```bash
curl -H "Cookie: sessionToken=..." \
  "http://localhost:3000/api/sessions/sync?since=2024-01-01T00:00:00Z"
```

## Synchronisation multi-appareils

### Comment ça marche?

1. **Polling**: Chaque appareil interroge le serveur toutes les 5 secondes
2. **Comparaison**: On compare les timestamps `lastAccessed`
3. **Mise à jour**: Si une session est plus récente sur le serveur, on la charge
4. **Suppression**: Si une session n'existe plus sur le serveur, on la supprime localement

### Configuration

Dans `app/page.js`:
```javascript
// Synchroniser toutes les 5 secondes
useSyncSessions(5000, isAuthenticated)

// Ou désactiver la synchronisation
useSyncSessions(5000, false)
```

### Avantages
- ✅ Simple à implémenter
- ✅ Fonctionne sur tous les navigateurs
- ✅ Pas de dépendance WebSocket
- ✅ Fonctionne derrière les proxies

### Limitations
- ⚠️ Délai de 5 secondes avant synchronisation
- ⚠️ Plus de requêtes réseau
- ⚠️ Pas de synchronisation en temps réel

### Améliorations futures
- WebSocket pour synchronisation en temps réel
- Server-Sent Events (SSE)
- Conflict resolution pour les modifications simultanées

## Mémoire isolée par session

Chaque session a sa propre `campaign` JSON:

```javascript
// Charger la campagne de la session actuelle
const campaign = memoryManager.getCurrentCampaign()

// Modifier la campagne
campaign.chapitres.push({ titre: "Nouveau chapitre" })

// Sauvegarder
memoryManager.updateCampaign(campaign)
// → Appelle saveSessionToServer()
// → PUT /api/sessions/[id]
// → Prisma: UPDATE Session SET campaign = ...
```

Les données ne se mélangent jamais entre sessions car chaque session a son propre enregistrement Prisma.

## Authentification

L'authentification utilise des **cookies HttpOnly**:

```javascript
// Login
POST /api/auth/pin
→ Crée AuthToken dans Prisma
→ Set-Cookie: sessionToken=...

// Vérification
GET /api/auth/pin
→ Lit le cookie sessionToken
→ Vérifie dans Prisma
→ Retourne userId

// Logout
POST /api/auth/logout
→ Supprime AuthToken de Prisma
→ Set-Cookie: sessionToken=; Max-Age=0
```

## Prochaines étapes

1. ✅ Refactoriser memoryManager.js
2. ✅ Créer API endpoints
3. ✅ Ajouter synchronisation
4. ⏳ Tester sur PC et téléphone
5. ⏳ Ajouter WebSocket pour temps réel
6. ⏳ Ajouter conflict resolution

## Déploiement

### Supabase
1. Créer un projet Supabase
2. Récupérer DATABASE_URL
3. Exécuter migrations: `npm run prisma:migrate`
4. Déployer sur Vercel

### Vercel
1. Connecter le repo GitHub
2. Ajouter DATABASE_URL en variable d'environnement
3. Déployer

L'app sera accessible sur `https://votre-app.vercel.app` depuis n'importe quel appareil!


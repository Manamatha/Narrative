# 🔬 DÉTAILS TECHNIQUES - JDR-IA-NARRATIVE

## Architecture du Projet

```
jdr-ia-narrative/
├── app/
│   ├── api/                          # Routes API Next.js
│   │   ├── auth/pin/route.js        # Authentification PIN
│   │   ├── chat-ai-memory/route.js  # Chat avec IA + mémoire
│   │   ├── sessions/route.js        # Gestion des sessions
│   │   └── ...
│   ├── components/                   # Composants React
│   │   ├── PINLogin.jsx             # Écran de connexion
│   │   ├── SessionManager.jsx       # Gestion des sessions ❌
│   │   ├── MemoryManager.jsx        # Gestion de la mémoire ❌
│   │   └── ...
│   ├── utils/                        # Utilitaires
│   │   ├── auth.js                  # Fonctions d'authentification
│   │   └── memoryManager.js         # Gestion de la mémoire ⚠️
│   ├── page.js                       # Page principale
│   └── layout.js                     # Layout
├── prisma/
│   ├── schema.prisma                # Schéma de base de données
│   └── migrations/                   # Migrations
├── public/                           # Fichiers statiques
├── scripts/
│   └── check-env.js                 # Vérification des variables d'env
├── package.json                      # Dépendances
└── .env.example                      # Template d'env ⚠️
```

---

## Stack Technologique

| Composant | Version | Statut |
|-----------|---------|--------|
| Next.js | 15.5.5 | ✅ |
| React | 19.1.0 | ✅ |
| Prisma | 6.17.1 | ✅ |
| PostgreSQL | - | ✅ |
| Tailwind CSS | 4 | ✅ |
| bcryptjs | 2.4.3 | ✅ |
| axios | 1.12.2 | ✅ |
| ESLint | 9 | ✅ |

---

## Flux d'Authentification

```
1. Utilisateur accède à /
   ↓
2. PINLogin.jsx affiche le formulaire
   ↓
3. POST /api/auth/pin { action: 'login', pin: 'XXXX' }
   ↓
4. Route vérifie le PIN avec bcrypt
   ↓
5. Crée un AuthToken et le retourne via Set-Cookie
   ↓
6. Client stocke le cookie (HttpOnly)
   ↓
7. Accès à la page principale
```

---

## Flux de Session

```
1. Utilisateur authentifié
   ↓
2. MemoryManager.loadFromServer(userId)
   ↓
3. Récupère les sessions depuis Prisma
   ↓
4. Affiche SessionManager
   ↓
5. Utilisateur crée/change de session
   ↓
6. SessionManager appelle memoryManager.createNewSession()
   ↓
7. Sauvegarde via saveSessionToServer()
   ↓
8. Prisma.session.upsert()
```

---

## Modèle de Données Prisma

```prisma
model User {
  id        String   @id @default(cuid())
  pin       String?  @unique              // Legacy
  pinHash   String?                       // bcrypt hash
  sessions  Session[]
  pinLogs   PINLog[]
  createdAt DateTime @default(now())
  lastUsed  DateTime @default(now())
}

model Session {
  id           String   @id
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name         String
  campaign     String   // JSON stringifiée
  createdAt    DateTime @default(now())
  lastAccessed DateTime @default(now())
  @@index([userId])
}

model AuthToken {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  token     String   @unique
  expiresAt DateTime?
  createdAt DateTime @default(now())
  @@index([userId])
}

model PINLog {
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

## Erreurs Détectées - Code

### SessionManager.jsx - Ligne 27
```javascript
// ❌ ERREUR: saveToServer() n'existe pas
await memoryManager.saveToServer()

// ✅ CORRECTION: Utiliser saveSessionToServer()
await memoryManager.saveSessionToServer(sessionId)
```

### SessionManager.jsx - Ligne 41
```javascript
// ❌ ERREUR: 'messages' n'est pas défini dans ce scope
memoryManager.sessions[memoryManager.currentSessionId].campaign.messages = messages

// ✅ CORRECTION: Supprimer cette ligne (les messages sont gérés dans page.js)
```

### SessionManager.jsx - Ligne 68
```javascript
// ❌ ERREUR: deleteSession() n'existe pas
memoryManager.deleteSession(sessionId)

// ✅ CORRECTION: Appeler l'API DELETE
const res = await fetch('/api/sessions', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ id: sessionId })
})
```

### MemoryManager.jsx - Ligne 57
```javascript
// ❌ ERREUR: getCampaign() n'existe pas
const currentCampaign = memoryManager.getCampaign()

// ✅ CORRECTION: Utiliser getCurrentCampaign()
const currentCampaign = memoryManager.getCurrentCampaign()
```

---

## Variables d'Environnement Requises

```env
# Base de données PostgreSQL
DATABASE_URL="postgresql://user:password@host:5432/database"

# Clé API OpenAI
OPENAI_API_KEY="sk-..."

# Optionnel
USER_KEY="user_moi"
```

---

## Commandes Utiles

```bash
# Vérifier les variables d'env
npm run check-env

# Générer le client Prisma
npm run prisma:generate

# Appliquer les migrations
npm run prisma:migrate

# Démarrer en développement
npm run dev

# Build pour production
npm run build

# Démarrer en production
npm start

# Linter
npm run lint
```

---

## Points de Sécurité

✅ Authentification par PIN avec bcrypt (salt 8)  
✅ Cookies HttpOnly pour les tokens  
✅ SameSite=Strict sur les cookies  
✅ Vérification userId sur les routes protégées  
✅ Suppression en cascade des données utilisateur  

⚠️ À améliorer:
- Ajouter CSRF protection
- Implémenter rate limiting sur /api/auth/pin
- Ajouter expiration des tokens
- Valider les entrées utilisateur

---

## Performance

- Turbopack activé (Next.js 15)
- Lazy loading des composants
- Optimisation des images
- Caching des sessions
- Pagination possible pour les sessions

---

## Dépendances Critiques

- `@prisma/client`: ORM pour PostgreSQL
- `bcryptjs`: Hachage sécurisé des PINs
- `next`: Framework web
- `react`: Bibliothèque UI
- `tailwindcss`: Styling CSS

---

## Fichiers à Créer/Modifier

1. ✅ Créer `.env` (depuis `.env.example`)
2. ✅ Corriger `SessionManager.jsx` (3 erreurs)
3. ✅ Corriger `MemoryManager.jsx` (1 erreur)
4. ✅ Ajouter méthodes dans `MemoryManager.js`
5. ✅ Créer `app/api/auth/logout/route.js`
6. ✅ Nettoyer `.env.example`


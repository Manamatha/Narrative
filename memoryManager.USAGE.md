# MemoryManager - Documentation d'utilisation

## Vue d'ensemble
Le `MemoryManager` est une classe isomorphe (fonctionne côté client ET serveur) qui gère les sessions de campagne, leur persistance, et toutes les métadonnées associées (chapitres, PNJ, lieux, événements, tags, émotions).

### Points clés
- **Export unique**: `export default MemoryManager` + `export function getMemoryManager()`
- **Isomorphe**: Utilise Prisma côté serveur, fetch côté client
- **Aucun import Prisma côté client**: Erreur lancée si tentative sur client
- **Singleton**: `getMemoryManager()` retourne toujours la même instance

---

## API Publique Minimale

### 1. `async loadFromServer(userId)`
Charge les sessions depuis la BD (serveur) ou API (client).

```javascript
// Client
const manager = getMemoryManager()
await manager.loadFromServer('user_123')
console.log(manager.getSessionsList())  // Sessions chargées

// Serveur (dans un API route)
import { getMemoryManager } from '@/app/utils/memoryManager'
const manager = getMemoryManager()
await manager.loadFromServer(userId)
```

### 2. `createNewSession(name)`
Crée une session locale + sauvegarde async sur serveur.

```javascript
const sessionId = manager.createNewSession('Ma nouvelle aventure')
console.log(sessionId)  // 'session_abc123def'
// La session est sauvegardée automatiquement
```

### 3. `switchSession(sessionId)`
Change la session courante et met à jour `lastAccessed`.

```javascript
manager.switchSession('session_xyz789')
// manager.currentSessionId === 'session_xyz789'
```

### 4. `getSessionMessages(sessionId?)` / `setSessionMessages(messages, sessionId?)`
Gestion des messages en mémoire.

```javascript
const messages = manager.getSessionMessages()  // Session courante
manager.setSessionMessages([{ role: 'user', content: 'Bonjour' }])

// Avec session spécifique
manager.setSessionMessages([...], 'session_xyz789')
```

### 5. `getCurrentCampaign()`
Retourne l'objet campaign de la session courante.

```javascript
const campaign = manager.getCurrentCampaign()
console.log(campaign.meta.titre)          // Titre de la campagne
console.log(campaign.chapitres)           // Chapitres
console.log(campaign.pnj_importants)      // PNJ
console.log(campaign.lieux_importants)    // Lieux
console.log(campaign.evenements_cles)     // Événements
```

### 6. `getSessionsList()`
Liste triée par `lastAccessed` (plus récent en premier).

```javascript
const sessions = manager.getSessionsList()
sessions.forEach(s => {
  console.log(s.name, s.lastAccessed)
})
```

### 7. `async saveSessionToServer(sessionId)`
Sauvegarde une session vers BD (serveur) ou API (client).

```javascript
await manager.saveSessionToServer('session_xyz789')
// Sur client: POST /api/sessions
// Sur serveur: Prisma upsert
```

---

## Helpers Utiles

### Émotions (encoding/decoding)
```javascript
// Décoder une chaîne d'émotion
const emotions = manager.decoderEmotions('C50-A30-P50-H10-R50-J10')
// { confiance: 50, amour: 30, peur: 50, haine: 10, respect: 50, jalousie: 10 }

// Encoder un objet d'émotion
const code = manager.encoderEmotions({ confiance: 75, amour: 40, peur: 25 })
// 'C75-A40-P25-H10-R50-J10'

// Descriptions et couleurs
console.log(manager.getEmotionDescription(80))  // 'Très élevé'
console.log(manager.getEmotionColor(50))        // 'text-yellow-300'
```

### Tags
```javascript
// Obtenir tous les tags disponibles
const allTags = manager.getAvailableTags()

// Trouver tags dans un message
const foundTags = manager.findTagsInMessage("Lyna arrive dans le donjon")
// Cherche Lyna et dungeon dans les PNJ, tags, lieux, etc.

// Récupérer contexte par tags
const context = manager.getElementsByTags(['tag1', 'tag2'])
```

### Chapitres
```javascript
const chapId = manager.addChapitre()  // Crée et retourne l'ID
manager.updateChapitre(chapId, 'titre', 'Chapitre 1: L'Appel')
manager.addTagToChapitre(chapId, 'action')
manager.removeTagFromChapitre(chapId, 'action')
manager.deleteChapitre(chapId)
```

### PNJ
```javascript
manager.addPNJ()  // Crée un nouveau PNJ
manager.updatePNJ(0, 'nom', 'Lyna')  // Modifie par index
manager.addTagToPNJ(0, 'allié')
manager.removeTagFromPNJ(0, 'allié')
manager.deletePNJ(0)
```

### Lieux
```javascript
manager.addLieu()
manager.updateLieu(0, 'nom', 'Le Donjon')
manager.addTagToLieu(0, 'danger')
manager.removeTagFromLieu(0, 'danger')
manager.deleteLieu(0)
```

### Événements
```javascript
manager.addEvenement()
manager.updateEvenement(0, 'titre', 'L'Attaque')
manager.addTagToEvenement(0, 'dramatique')
manager.removeTagFromEvenement(0, 'dramatique')
manager.deleteEvenement(0)
```

### AI Memory Processing
```javascript
// Traiter les mises à jour IA de PNJ
manager.processPNJUpdates([
  { nom: 'Lyna', emotion: 'C75-A50-P20', changement: '+25', raison: 'Sauvetage' }
])

// Traiter les sauvegardes IA
manager.processAISaves([
  { type: 'PNJ', nom: 'Zora', role: 'Mage', description: 'Une mage ancienne', tags: ['magie'] },
  { type: 'LIEU', nom: 'Grotte', description: '...', tags: ['mystère'] }
])

// Générer contexte optimisé pour IA
const context = manager.generateOptimizedContext(userMessage, messageCount)
```

---

## Utilisation Côté Client (React)

```javascript
'use client'
import { useEffect, useState } from 'react'
import { getMemoryManager } from '@/app/utils/memoryManager'

export default function MyComponent() {
  const [campaign, setCampaign] = useState(null)

  useEffect(() => {
    const manager = getMemoryManager()
    // manager.userId est défini après loadFromServer
    setCampaign(manager.getCurrentCampaign())
  }, [])

  const handleCreateSession = async () => {
    const manager = getMemoryManager()
    const sessionId = manager.createNewSession('Nouvelle')
    // Enregistrement asynchrone automatique
  }

  return (
    <div>
      <h1>{campaign?.meta?.titre}</h1>
      <button onClick={handleCreateSession}>Créer session</button>
    </div>
  )
}
```

---

## Utilisation Côté Serveur

```javascript
// Dans /app/api/some-route.js (Server Component ou Route)
import { getMemoryManager } from '@/app/utils/memoryManager'

export async function POST(req) {
  const userId = await getUserIdFromRequest(req)
  const manager = getMemoryManager()
  
  await manager.loadFromServer(userId)  // Charge via Prisma
  const campaign = manager.getCurrentCampaign()
  
  // Prisma est utilisé automatiquement si isServer === true
  await manager.saveSessionToServer(manager.currentSessionId)
  
  return Response.json({ ok: true })
}
```

---

## Test Unitaire Simple (Jest)

```javascript
// test.js
import MemoryManager, { getMemoryManager } from '@/app/utils/memoryManager'

describe('MemoryManager', () => {
  let manager

  beforeEach(() => {
    manager = new MemoryManager()
  })

  test('createNewSession crée une session et l\'ajoute à getSessionsList', () => {
    const id = manager.createNewSession('Test')
    const sessions = manager.getSessionsList()
    
    expect(sessions.length).toBe(1)
    expect(sessions[0].id).toBe(id)
    expect(sessions[0].name).toBe('Test')
  })

  test('switchSession change la session courante', () => {
    const id1 = manager.createNewSession('Session 1')
    const id2 = manager.createNewSession('Session 2')
    
    manager.switchSession(id1)
    expect(manager.currentSessionId).toBe(id1)
    
    manager.switchSession(id2)
    expect(manager.currentSessionId).toBe(id2)
  })

  test('getCurrentCampaign retourne la campagne courante', () => {
    manager.createNewSession('Aventure')
    const campaign = manager.getCurrentCampaign()
    
    expect(campaign).toBeDefined()
    expect(campaign.meta.titre).toBe('Aventure')
  })

  test('getMemoryManager retourne un singleton', () => {
    const m1 = getMemoryManager()
    const m2 = getMemoryManager()
    expect(m1).toBe(m2)
  })

  test('addChapitre et deleteChapitre', () => {
    manager.createNewSession('Test')
    const id = manager.addChapitre()
    
    expect(manager.getCurrentCampaign().chapitres.length).toBe(1)
    
    manager.deleteChapitre(id)
    expect(manager.getCurrentCampaign().chapitres.length).toBe(0)
  })

  test('decoderEmotions et encoderEmotions', () => {
    const code = 'C75-A40-P25-H10-R50-J10'
    const decoded = manager.decoderEmotions(code)
    const reencoded = manager.encoderEmotions(decoded)
    
    expect(decoded.confiance).toBe(75)
    expect(decoded.amour).toBe(40)
    expect(reencoded).toBe(code)
  })

  test('findTagsInMessage détecte les tags et PNJ', () => {
    manager.createNewSession('Test')
    manager.addPNJ()
    manager.updatePNJ(0, 'nom', 'Lyna')
    
    const tags = manager.findTagsInMessage('Lyna revient au donjon')
    expect(tags).toContain('Lyna')
  })
})
```

---

## Test Node.js Simple

```javascript
// test-node.js
import MemoryManager, { getMemoryManager } from './app/utils/memoryManager.js'

const manager = new MemoryManager()

// Test 1: Création
console.log('Test 1: createNewSession')
const id = manager.createNewSession('Aventure Test')
console.log(`✓ Session créée: ${id}`)

// Test 2: Liste
console.log('\nTest 2: getSessionsList')
const sessions = manager.getSessionsList()
console.log(`✓ Sessions: ${sessions.length}`)

// Test 3: Campaign
console.log('\nTest 3: getCurrentCampaign')
const campaign = manager.getCurrentCampaign()
console.log(`✓ Titre: ${campaign.meta.titre}`)

// Test 4: PNJ
console.log('\nTest 4: PNJ operations')
manager.addPNJ()
manager.updatePNJ(0, 'nom', 'Lyna')
console.log(`✓ PNJ ajouté: ${manager.getCurrentCampaign().pnj_importants[0].nom}`)

// Test 5: Émotions
console.log('\nTest 5: Emotions')
const emotions = manager.decoderEmotions('C75-A50-P25')
console.log(`✓ Confiance: ${emotions.confiance}`)

console.log('\n✓ Tous les tests passent!')
```

---

## Points Importants

1. **Pas de Prisma côté client**: Le code lève une erreur si `_getPrismaClient()` est appelé côté client
2. **Sauvegarde asynchrone**: `createNewSession` et `switchSession` sauvegardent automatiquement sans bloquer
3. **Singleton**: `getMemoryManager()` retourne toujours la même instance
4. **userId**: Doit être défini via `loadFromServer()` pour les sauvegardes côté client
5. **Parsing JSON**: Les campaigns sont stockées en JSON dans BD, auto-parsées au chargement
6. **Erreur gratieuse**: Les erreurs sont loggées mais ne bloquent pas le code
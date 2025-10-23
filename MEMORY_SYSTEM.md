# 🧠 Système de Mémoire Narrative

## Vue d'ensemble

L'IA a 3 niveaux de mémoire pour retrouver les éléments importants:

```
┌─────────────────────────────────────────────────────────┐
│ 1. CONTEXTE IMMÉDIAT (derniers messages)                │
│    - Chargé dans la conversation OpenAI                 │
│    - Limité à 1 dernier message pour économiser tokens  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 2. CONTEXTE CAMPAGNE (éléments prioritaires)            │
│    - Titre, résumé, style de narration                  │
│    - Top 5 chapitres (par priorité)                     │
│    - Top 5 PNJ (par priorité + émotions)                │
│    - Top 5 lieux (par priorité)                         │
│    - Contexte pertinent (tags détectés)                 │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│ 3. MÉMOIRE IMPORTANTE (éléments clés)                   │
│    - Éléments mentionnés fréquemment                    │
│    - Même s'ils sont vieux dans l'historique            │
│    - Trié par fréquence + date                          │
└─────────────────────────────────────────────────────────┘
```

## 1️⃣ Contexte Immédiat

**Quoi**: Le dernier message de l'utilisateur
**Où**: Envoyé à OpenAI dans la conversation
**Durée**: Jusqu'au prochain message

```javascript
// Dans app/api/chat-ai-memory/route.js
const conversation = [systemMessage, dernierMessageSeulement]
```

## 2️⃣ Contexte Campagne

**Quoi**: Les éléments prioritaires de la campagne
**Où**: Dans le `systemMessage` envoyé à OpenAI
**Durée**: Permanent (rechargé à chaque message)

### Contenu

```
CAMPAGNE: Titre de l'aventure

RÉSUMÉ: Résumé global de la campagne

CHAPITRES (5 max, triés par priorité):
- Chapitre 1 [P8]: Résumé...
- Chapitre 2 [P7]: Résumé...

PNJ IMPORTANTS (5 max, triés par priorité):
- Lyna (Guerrière) [C75-A50-P25]: Description...
- Zora (Mage) [C60-A40-P30]: Description...

LIEUX (5 max, triés par priorité):
- Donjon [P9]: Description...
- Taverne [P7]: Description...

CONTEXTE PERTINENT (tags détectés: donjon, combat):
- LIEUX[donjon]: Donjon
- PNJ[combat]: Lyna
```

### Priorité

Chaque élément a une **priorité** (1-10):
- **9-10**: Éléments critiques (boss, lieux clés)
- **7-8**: Éléments importants (PNJ majeurs)
- **5-6**: Éléments normaux (par défaut)
- **1-4**: Éléments mineurs

**Comment utiliser**: Augmentez la priorité des éléments importants dans l'interface!

## 3️⃣ Mémoire Importante

**Quoi**: Éléments mentionnés fréquemment
**Où**: Stockés en mémoire (client-side)
**Durée**: Pendant la session

### Fonctionnement

```javascript
// Chaque fois que l'IA reçoit un message:
1. Détecter les tags (PNJ, lieux, événements)
2. Enregistrer dans importantMemory
3. Incrémenter la fréquence
4. Mettre à jour lastSeen

// Quand générer le contexte:
1. Récupérer les 5 éléments les plus fréquents
2. Les ajouter au contexte
3. L'IA les voit même s'ils sont vieux
```

### Exemple

```
Message 1: "Lyna arrive au donjon"
  → Track: PNJ "Lyna" (freq=1), LIEU "Donjon" (freq=1)

Message 2: "Lyna combat les gobelins"
  → Track: PNJ "Lyna" (freq=2)

Message 3: "Lyna trouve un trésor"
  → Track: PNJ "Lyna" (freq=3)

Message 4: "Zora arrive"
  → Track: PNJ "Zora" (freq=1)

Contexte généré:
MÉMOIRE IMPORTANTE:
- [PNJ] Lyna (mentionné 3x)
- [LIEU] Donjon (mentionné 1x)
- [PNJ] Zora (mentionné 1x)
```

## 🔍 Cache des Tags

**Problème**: Chercher les tags à chaque message = lent
**Solution**: Cache avec expiration

```javascript
// Cache: 30 secondes
if (now - tagsCacheTimestamp < 30000 && tagsCache[userMessage]) {
  // Utiliser le cache
  tagsInMessage = tagsCache[userMessage]
} else {
  // Recalculer et mettre en cache
  tagsInMessage = findTagsInMessage(userMessage)
  tagsCache[userMessage] = tagsInMessage
  tagsCacheTimestamp = now
}
```

**Avantage**: Pas de recherche répétée pour le même message

## 📊 Flux Complet

```
User écrit: "Lyna arrive au donjon"
    ↓
POST /api/chat-ai-memory
    ↓
1. Détecter tags: ["Lyna", "Donjon"]
    ↓
2. Track important elements:
   - PNJ "Lyna" (freq++)
   - LIEU "Donjon" (freq++)
    ↓
3. Générer contexte:
   - Contexte immédiat: "Lyna arrive au donjon"
   - Contexte campagne: Top 5 chapitres, PNJ, lieux
   - Mémoire importante: Lyna (freq=3), Donjon (freq=2)
    ↓
4. Envoyer à OpenAI:
   systemMessage + contexte complet + dernier message
    ↓
5. OpenAI répond avec contexte riche
    ↓
6. Réponse sauvegardée dans la session
```

## 💡 Bonnes pratiques

### Pour l'utilisateur

1. **Définir les priorités**
   - Augmentez la priorité des éléments importants
   - Baissez celle des éléments mineurs

2. **Utiliser les tags**
   - Taguez les éléments pour les retrouver
   - Les tags aident l'IA à faire des connexions

3. **Mettre à jour la mémoire**
   - Quand un PNJ change, mettez à jour ses émotions
   - Quand un lieu change, mettez à jour sa description

### Pour l'IA

L'IA peut:
- Utiliser les émotions des PNJ pour adapter ses réponses
- Utiliser les priorités pour savoir ce qui est important
- Utiliser la mémoire importante pour faire des rappels

## 🔧 Configuration

### Changer la taille du cache

```javascript
// Dans generateOptimizedContext()
const cacheExpiry = 30000 // 30 secondes
```

### Changer le nombre d'éléments affichés

```javascript
// Chapitres
.slice(0, 5)  // Afficher top 5

// Mémoire importante
getImportantElements(5)  // Top 5 éléments
```

### Changer la fréquence de tracking

```javascript
// Dans app/api/chat-ai-memory/route.js
tagsDetectes.forEach(tag => {
  // Tracker chaque tag détecté
})
```

## 📈 Améliorations futures

- [ ] Decay de la fréquence (oublier les vieux éléments)
- [ ] Clustering des éléments similaires
- [ ] Prédiction des éléments pertinents
- [ ] Apprentissage des préférences de l'IA
- [ ] Compression du contexte (résumé automatique)

## ✅ Résumé

L'IA a maintenant:
- ✅ Contexte immédiat (dernier message)
- ✅ Contexte campagne (éléments prioritaires)
- ✅ Mémoire importante (éléments fréquents)
- ✅ Cache des tags (pas de recherche répétée)
- ✅ Tracking automatique (fréquence + date)

**Résultat**: L'IA retrouve les éléments importants même s'ils sont vieux! 🧠


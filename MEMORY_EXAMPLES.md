# 📚 Exemples Concrets du Système de Mémoire

## Exemple 1: Campagne Simple

### Setup
```
Session: "Aventure au Donjon"
PNJ: Lyna (Guerrière)
Lieux: Donjon
```

### Conversation

```
Message 1: "Lyna arrive au donjon"
  ↓ Détecte: ["Lyna", "Donjon"]
  ↓ Track: Lyna (freq=1), Donjon (freq=1)

Message 2: "Elle voit des gobelins"
  ↓ Détecte: []
  ↓ Track: (rien)

Message 3: "Lyna combat les gobelins"
  ↓ Détecte: ["Lyna"]
  ↓ Track: Lyna (freq=2)

Message 4: "Elle gagne le combat"
  ↓ Détecte: []
  ↓ Track: (rien)

Message 5: "Lyna trouve un trésor"
  ↓ Détecte: ["Lyna"]
  ↓ Track: Lyna (freq=3)
```

### Mémoire Finale
```
importantMemory['session_1'] = {
  pnj: {
    'Lyna': {
      role: 'Guerrière',
      frequency: 3,
      lastSeen: '2024-01-01T10:05:00Z'
    }
  },
  lieux: {
    'Donjon': {
      description: 'Un donjon sombre',
      frequency: 1,
      lastSeen: '2024-01-01T10:01:00Z'
    }
  }
}
```

### Contexte envoyé à l'IA
```
MÉMOIRE IMPORTANTE (éléments clés):
- [PNJ] Lyna (mentionné 3x)
- [LIEUX] Donjon (mentionné 1x)
```

---

## Exemple 2: Campagne Complexe

### Setup
```
Session: "Guerre des Royaumes"
PNJ: Aragorn (Roi), Legolas (Archer), Gimli (Nain)
Lieux: Forêt, Montagne, Château
Événements: Bataille, Trahison
```

### Conversation (50 messages)

```
Message 1: "Aragorn arrive à la Forêt"
  → Track: Aragorn (1), Forêt (1)

Message 5: "Legolas rejoint Aragorn"
  → Track: Legolas (1), Aragorn (2)

Message 10: "Ils montent à la Montagne"
  → Track: Montagne (1)

Message 15: "Gimli les rejoint"
  → Track: Gimli (1)

Message 20: "Bataille commence"
  → Track: Bataille (1)

Message 25: "Aragorn combat vaillamment"
  → Track: Aragorn (3)

Message 30: "Legolas tire des flèches"
  → Track: Legolas (2)

Message 35: "Gimli se bat férocement"
  → Track: Gimli (2)

Message 40: "Trahison! Legolas disparaît"
  → Track: Legolas (3), Trahison (1)

Message 45: "Aragorn et Gimli continuent"
  → Track: Aragorn (4), Gimli (3)

Message 50: "Ils arrivent au Château"
  → Track: Château (1)
```

### Mémoire Finale
```
Éléments triés par fréquence:
1. Aragorn (freq=4)
2. Gimli (freq=3)
3. Legolas (freq=3)
4. Forêt (freq=1)
5. Montagne (freq=1)
6. Bataille (freq=1)
7. Trahison (freq=1)
8. Château (freq=1)
```

### Contexte envoyé à l'IA
```
MÉMOIRE IMPORTANTE (éléments clés):
- [PNJ] Aragorn (mentionné 4x)
- [PNJ] Gimli (mentionné 3x)
- [PNJ] Legolas (mentionné 3x)
- [LIEUX] Forêt (mentionné 1x)
- [LIEUX] Montagne (mentionné 1x)
```

---

## Exemple 3: Cas d'usage - L'IA oublie sans mémoire

### Sans Mémoire Importante

```
Message 1: "Vous rencontrez le Roi Aldric"
Message 2: "Il vous donne une quête"
...
Message 100: "Vous arrivez au château"

Contexte envoyé à l'IA:
- Dernier message: "Vous arrivez au château"
- Top 5 chapitres: (aucun)
- Top 5 PNJ: (Aldric n'est pas dans le top 5)
- Top 5 lieux: (Château n'est pas dans le top 5)

Résultat: L'IA oublie le Roi Aldric! ❌
```

### Avec Mémoire Importante

```
Message 1: "Vous rencontrez le Roi Aldric"
  → Track: Aldric (freq=1)

Message 2: "Il vous donne une quête"
  → Track: Aldric (freq=2)

...

Message 100: "Vous arrivez au château"

Contexte envoyé à l'IA:
- Dernier message: "Vous arrivez au château"
- Top 5 chapitres: (aucun)
- Top 5 PNJ: (aucun)
- Top 5 lieux: (aucun)
- MÉMOIRE IMPORTANTE: Aldric (freq=2)

Résultat: L'IA se souvient du Roi Aldric! ✅
```

---

## Exemple 4: Isolation par Session

### Session 1: "Aventure Sombre"
```
Message 1: "Vous rencontrez Lyna"
Message 2: "Lyna vous aide"
Message 3: "Lyna disparaît"

Mémoire Session 1:
- Lyna (freq=3)
```

### Session 2: "Aventure Lumineuse"
```
Message 1: "Vous rencontrez Aragorn"
Message 2: "Aragorn vous guide"

Mémoire Session 2:
- Aragorn (freq=2)
```

### Résultat
```
importantMemory = {
  'session_1': {
    pnj: { 'Lyna': {freq: 3} }
  },
  'session_2': {
    pnj: { 'Aragorn': {freq: 2} }
  }
}

Pas de mélange! ✅
```

---

## Exemple 5: Tri par Fréquence + Date

### Scénario
```
Message 1: "Vous rencontrez Lyna"
  → Lyna (freq=1, lastSeen=10:00)

Message 2: "Vous rencontrez Zora"
  → Zora (freq=1, lastSeen=10:01)

Message 3: "Lyna revient"
  → Lyna (freq=2, lastSeen=10:02)
```

### Tri
```
1. Lyna (freq=2) - Plus haute fréquence
2. Zora (freq=1) - Même fréquence, mais plus récent
```

### Résultat
```
MÉMOIRE IMPORTANTE:
- [PNJ] Lyna (mentionné 2x)
- [PNJ] Zora (mentionné 1x)
```

---

## Exemple 6: Cas Réel - Campagne RPG

### Setup
```
Campagne: "Les Chroniques de Midgard"
PNJ: Sigrid (Guerrière), Odin (Dieu), Loki (Trickster)
Lieux: Asgard, Midgard, Niflheim
Événements: Ragnarök, Trahison de Loki
```

### Conversation (100 messages)

```
Message 1: "Sigrid arrive à Asgard"
  → Track: Sigrid (1), Asgard (1)

Message 10: "Odin lui parle"
  → Track: Odin (1), Asgard (2)

Message 20: "Loki apparaît"
  → Track: Loki (1)

Message 30: "Sigrid combat Loki"
  → Track: Sigrid (2), Loki (2)

Message 40: "Odin intervient"
  → Track: Odin (2)

Message 50: "Ils vont à Midgard"
  → Track: Midgard (1)

Message 60: "Loki trahit Sigrid"
  → Track: Loki (3), Sigrid (3)

Message 70: "Odin sauve Sigrid"
  → Track: Odin (3), Sigrid (4)

Message 80: "Ils retournent à Asgard"
  → Track: Asgard (3)

Message 90: "Ragnarök commence"
  → Track: Ragnarök (1)

Message 100: "Sigrid doit choisir"
  → Track: Sigrid (5)
```

### Mémoire Finale
```
Triée par fréquence:
1. Sigrid (freq=5)
2. Odin (freq=3)
3. Loki (freq=3)
4. Asgard (freq=3)
5. Midgard (freq=1)
```

### Contexte à Message 100
```
MÉMOIRE IMPORTANTE (éléments clés):
- [PNJ] Sigrid (mentionné 5x)
- [PNJ] Odin (mentionné 3x)
- [PNJ] Loki (mentionné 3x)
- [LIEUX] Asgard (mentionné 3x)
- [LIEUX] Midgard (mentionné 1x)
```

**Résultat**: L'IA a une vue complète de la campagne! ✅

---

## Résumé

La mémoire importante:
- ✅ Enregistre les éléments mentionnés
- ✅ Compte la fréquence
- ✅ Trie par fréquence + date
- ✅ Isole par session
- ✅ Affiche dans le contexte

**Résultat**: L'IA ne oublie jamais les éléments clés! 🧠


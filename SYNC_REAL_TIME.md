# ⚡ Synchronisation en Temps Réel

## Changement

Au lieu d'attendre 5 secondes, les changements sont maintenant sauvegardés **immédiatement**.

## Comment ça marche

### Avant
```
User modifie → Attendre 5 secondes → Sauvegarder → Synchroniser sur autres appareils
```

### Maintenant
```
User modifie → Sauvegarder immédiatement → Synchroniser sur autres appareils (2s)
```

## Flux

1. **User modifie quelque chose** (ajoute un chapitre, change un PNJ, etc.)
2. **memoryManager.saveCampaign()** est appelé
3. **saveSessionToServer()** est appelé immédiatement
4. **PUT /api/sessions/[id]** envoie les données à Prisma
5. **Prisma** sauvegarde dans Supabase
6. **Autres appareils** reçoivent les changements dans les 2 secondes (polling)

## Avantages

- ✅ Pas d'attente
- ✅ Données toujours à jour
- ✅ Synchronisation rapide entre appareils
- ✅ Pas de perte de données

## Inconvénients

- ⚠️ Plus de requêtes réseau
- ⚠️ Peut être lent sur connexion faible

## Configuration

Si vous voulez changer l'intervalle de synchronisation (actuellement 2 secondes):

**Dans `app/page.js`:**
```javascript
// Changer 2000 (2 secondes) à votre valeur
useSyncSessions(2000, isAuthenticated)

// Exemples:
// 1000 = 1 seconde (très rapide, beaucoup de requêtes)
// 2000 = 2 secondes (rapide, équilibre)
// 5000 = 5 secondes (lent, peu de requêtes)
```

## Résultat

Quand vous modifiez quelque chose sur le PC, ça apparaît sur le téléphone en **moins de 2 secondes**! 🚀


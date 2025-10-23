# 🚀 Guide de Migration - Prisma & Synchronisation

## Résumé des changements

Votre app a été refactorisée pour:
- ✅ Utiliser **Prisma comme source de vérité**
- ✅ Synchroniser les sessions entre appareils
- ✅ Isoler la mémoire par session
- ✅ Supporter PC, téléphone, tablette

## Fichiers modifiés

### 1. `app/utils/memoryManager.js`
- ✅ Ajout de `syncFromServer()` pour synchronisation multi-appareils
- ✅ Mise à jour de `saveSessionToServer()` pour utiliser PUT /api/sessions/[id]
- ✅ Pas de changement dans l'API publique

### 2. `app/page.js`
- ✅ Import du hook `useSyncSessions`
- ✅ Appel du hook pour synchronisation automatique
- ✅ Mise à jour de `handleLogout()` pour appeler /api/auth/logout

### 3. `app/components/SessionManager.jsx`
- ✅ Correction de `switchToSession()` pour utiliser `saveSessionToServer()`
- ✅ Correction de `deleteSession()` pour appeler DELETE /api/sessions/[id]

### 4. `app/components/MemoryManager.jsx`
- ✅ Correction de `getCampaign()` → `getCurrentCampaign()`

## Fichiers créés

### 1. `app/api/auth/logout/route.js` ✨ NOUVEAU
Route de déconnexion qui supprime le token et le cookie

### 2. `app/api/sessions/[id]/route.js` ✨ NOUVEAU
Routes pour GET, PUT, DELETE une session spécifique

### 3. `app/api/sessions/sync/route.js` ✨ NOUVEAU
Route pour synchronisation multi-appareils

### 4. `app/hooks/useSyncSessions.js` ✨ NOUVEAU
Hook React pour synchronisation automatique

### 5. `.env` ✨ NOUVEAU
Variables d'environnement (à remplir)

## Étapes de déploiement

### Étape 1: Configuration locale

```bash
# 1. Remplir les variables d'environnement
cp .env.example .env
# Éditer .env avec vos valeurs Supabase et OpenAI

# 2. Vérifier l'environnement
npm run check-env

# 3. Générer le client Prisma
npm run prisma:generate

# 4. Appliquer les migrations
npm run prisma:migrate
```

### Étape 2: Tester localement

```bash
# 1. Démarrer l'app
npm run dev

# 2. Ouvrir http://localhost:3000

# 3. Tester le flux complet:
#    - Login avec PIN
#    - Créer une session
#    - Modifier la campagne
#    - Ouvrir sur un autre appareil
#    - Vérifier la synchronisation (5s)
```

### Étape 3: Déployer sur Vercel

```bash
# 1. Pousser sur GitHub
git add .
git commit -m "Refactor: Prisma architecture with multi-device sync"
git push origin main

# 2. Vercel déploiera automatiquement

# 3. Ajouter les variables d'environnement dans Vercel:
#    - DATABASE_URL
#    - OPENAI_API_KEY
#    - USER_KEY (optionnel)

# 4. Redéployer après ajout des variables
```

## Vérification post-migration

### Checklist

- [ ] `npm run check-env` ✅
- [ ] `npm run prisma:generate` ✅
- [ ] `npm run prisma:migrate` ✅
- [ ] `npm run dev` démarre sans erreur ✅
- [ ] Login fonctionne ✅
- [ ] Créer une session fonctionne ✅
- [ ] Modifier la campagne fonctionne ✅
- [ ] Sauvegarder fonctionne ✅
- [ ] Synchronisation fonctionne (ouvrir sur 2 appareils) ✅
- [ ] Déconnexion fonctionne ✅

### Tests manuels

#### Test 1: Création de session
1. Login
2. Créer une session "Test 1"
3. Vérifier dans Prisma Studio: `npx prisma studio`
4. La session doit être dans la DB

#### Test 2: Modification de campagne
1. Ouvrir une session
2. Ajouter un chapitre
3. Vérifier dans Prisma Studio
4. La campagne doit être mise à jour

#### Test 3: Synchronisation multi-appareils
1. Ouvrir l'app sur PC (http://localhost:3000)
2. Ouvrir l'app sur téléphone (http://[IP_PC]:3000)
3. Créer une session sur PC
4. Attendre 5 secondes
5. Vérifier que la session apparaît sur le téléphone
6. Modifier la campagne sur le téléphone
7. Attendre 5 secondes
8. Vérifier que les changements apparaissent sur le PC

#### Test 4: Suppression de session
1. Créer une session
2. Supprimer la session
3. Vérifier qu'elle disparaît de la DB
4. Vérifier qu'elle disparaît sur les autres appareils (5s)

## Dépannage

### Erreur: "DATABASE_URL manquant"
```bash
# Solution: Remplir .env
cp .env.example .env
# Éditer .env avec votre DATABASE_URL Supabase
```

### Erreur: "Prisma client not found"
```bash
# Solution: Générer le client
npm run prisma:generate
```

### Erreur: "Migration pending"
```bash
# Solution: Appliquer les migrations
npm run prisma:migrate
```

### Synchronisation ne fonctionne pas
```bash
# Vérifier:
# 1. Les cookies sont activés
# 2. L'authentification fonctionne
# 3. Les requêtes API réussissent (F12 → Network)
# 4. Les timestamps sont à jour dans Prisma Studio
```

### Données ne se synchronisent pas entre appareils
```bash
# Vérifier:
# 1. Les deux appareils sont connectés au même réseau
# 2. L'app est déployée sur Vercel (pas localhost)
# 3. Les cookies sont partagés (même domaine)
# 4. Attendre 5 secondes après modification
```

## Rollback (si nécessaire)

Si vous devez revenir à l'ancienne version:

```bash
# 1. Récupérer la version précédente
git revert HEAD

# 2. Redéployer
git push origin main
```

## Prochaines améliorations

### Court terme
- [ ] Ajouter WebSocket pour synchronisation temps réel
- [ ] Ajouter conflict resolution
- [ ] Ajouter versioning des sessions
- [ ] Ajouter backup automatique

### Moyen terme
- [ ] Ajouter partage de sessions
- [ ] Ajouter collaboration en temps réel
- [ ] Ajouter historique des modifications
- [ ] Ajouter undo/redo

### Long terme
- [ ] Ajouter offline mode
- [ ] Ajouter sync quand connexion revient
- [ ] Ajouter encryption end-to-end
- [ ] Ajouter export/import

## Support

Si vous avez des questions:
1. Vérifier ARCHITECTURE_PRISMA.md
2. Vérifier les logs: `npm run dev` (terminal)
3. Vérifier Prisma Studio: `npx prisma studio`
4. Vérifier les requêtes API: F12 → Network

## Résumé

Votre app est maintenant:
- ✅ Synchronisée entre appareils
- ✅ Utilise Prisma comme source de vérité
- ✅ Prête pour Vercel + Supabase
- ✅ Scalable et maintenable

Bon développement! 🚀


# ✅ CHECKLIST D'ACTIONS - JDR-IA-NARRATIVE

## 🔴 PHASE 1 - CRITIQUE (À faire IMMÉDIATEMENT)

### 1.1 Configurer les variables d'environnement
- [ ] Copier `.env.example` en `.env`
- [ ] Remplir `DATABASE_URL` avec votre PostgreSQL
- [ ] Remplir `OPENAI_API_KEY` avec votre clé OpenAI
- [ ] Exécuter `npm run check-env` pour vérifier
- [ ] Vérifier que `.env` est dans `.gitignore`

### 1.2 Gérer les clés exposées
- [ ] Révoquer la clé OpenAI exposée
- [ ] Révoquer les clés Supabase (si utilisées)
- [ ] Générer une nouvelle clé OpenAI
- [ ] Générer une nouvelle clé Supabase (si utilisée)
- [ ] Mettre à jour `.env` avec les nouvelles clés
- [ ] Exécuter: `git rm --cached .env`
- [ ] Exécuter: `git commit -m "Remove .env from tracking"`
- [ ] Exécuter: `git push`
- [ ] Considérer `git filter-repo` pour purger l'historique

### 1.3 Corriger SessionManager.jsx
- [ ] Ligne 27: Remplacer `saveToServer()` par `saveSessionToServer(sessionId)`
- [ ] Ligne 41: Supprimer la ligne `memoryManager.sessions[...].campaign.messages = messages`
- [ ] Ligne 68: Remplacer `deleteSession()` par un appel API DELETE

### 1.4 Corriger MemoryManager.jsx
- [ ] Ligne 57: Remplacer `getCampaign()` par `getCurrentCampaign()`

---

## 🟡 PHASE 2 - HAUTE PRIORITÉ (À faire avant le test)

### 2.1 Ajouter méthodes manquantes dans MemoryManager.js
- [ ] Ajouter méthode `saveToServer()` (après `saveSessionToServer()`)
- [ ] Ajouter méthode `deleteSession(sessionId)`
- [ ] Tester que les méthodes sont appelables

### 2.2 Implémenter la route de déconnexion
- [ ] Créer `app/api/auth/logout/route.js`
- [ ] Implémenter POST handler
- [ ] Supprimer le token de la base de données
- [ ] Retourner Set-Cookie avec Max-Age=0
- [ ] Tester la déconnexion

### 2.3 Mettre à jour handleLogout() dans page.js
- [ ] Appeler `/api/auth/logout` avant de nettoyer l'état
- [ ] Attendre la réponse du serveur
- [ ] Puis nettoyer l'état client

### 2.4 Vérifier la casse du modèle Prisma
- [ ] Vérifier que `prisma/schema.prisma` a `model PINLog`
- [ ] Vérifier que `app/api/auth/pin/route.js` ligne 53 utilise `prisma.pINLog`
- [ ] Corriger si nécessaire (Prisma utilise camelCase)

---

## 🟢 PHASE 3 - MOYENNE PRIORITÉ (À faire après le test)

### 3.1 Nettoyer .env.example
- [ ] Supprimer les lignes dupliquées (18-33)
- [ ] Garder une seule version claire
- [ ] Ajouter des commentaires explicatifs
- [ ] Vérifier que le fichier est lisible

### 3.2 Améliorer la sécurité
- [ ] Ajouter CSRF protection
- [ ] Implémenter rate limiting sur `/api/auth/pin`
- [ ] Ajouter expiration des tokens (expiresAt)
- [ ] Valider les entrées utilisateur
- [ ] Ajouter logging des tentatives échouées

### 3.3 Tester le flux complet
- [ ] Créer un compte (PIN généré)
- [ ] Se connecter avec le PIN
- [ ] Créer une session
- [ ] Envoyer un message
- [ ] Changer de session
- [ ] Supprimer une session
- [ ] Se déconnecter
- [ ] Vérifier que le cookie est supprimé

---

## 🔵 PHASE 4 - BASSE PRIORITÉ (Optimisations)

### 4.1 Performance
- [ ] Vérifier que Turbopack est activé
- [ ] Profiler les routes API
- [ ] Optimiser les requêtes Prisma
- [ ] Ajouter du caching si nécessaire

### 4.2 Documentation
- [ ] Documenter l'API
- [ ] Ajouter des commentaires au code
- [ ] Créer un guide de déploiement
- [ ] Documenter les variables d'env

### 4.3 Tests
- [ ] Écrire des tests unitaires
- [ ] Écrire des tests d'intégration
- [ ] Tester les cas d'erreur
- [ ] Tester les cas limites

---

## 📋 VÉRIFICATION FINALE

### Avant de déployer
- [ ] Toutes les phases 1-3 sont complètes
- [ ] `npm run check-env` passe
- [ ] `npm run lint` passe
- [ ] `npm run build` passe
- [ ] `npm run dev` démarre sans erreur
- [ ] Flux complet testé manuellement
- [ ] Pas de clés sensibles dans le code
- [ ] `.env` n'est pas commité
- [ ] `.gitignore` contient `.env`

### Avant la production
- [ ] Variables d'env configurées sur le serveur
- [ ] Base de données PostgreSQL accessible
- [ ] Clé OpenAI valide et active
- [ ] Certificats SSL configurés
- [ ] Backups de base de données en place
- [ ] Monitoring en place
- [ ] Logs configurés

---

## 🚀 COMMANDES À EXÉCUTER

```bash
# Phase 1
cp .env.example .env
# Éditer .env avec vos valeurs
npm run check-env

# Phase 2
npm run prisma:generate
npm run prisma:migrate

# Phase 3
npm run lint
npm run build

# Phase 4
npm run dev
# Tester manuellement

# Production
npm run build
npm start
```

---

## 📞 SUPPORT

Si vous rencontrez des problèmes:

1. Vérifier les logs: `npm run dev` affiche les erreurs
2. Vérifier `.env`: `npm run check-env`
3. Vérifier la base de données: `prisma studio`
4. Vérifier les routes API: Ouvrir dans le navigateur
5. Vérifier les cookies: DevTools → Application → Cookies

---

## 📝 NOTES

- Les corrections de code sont dans `CORRECTIONS_NEEDED.md`
- Les détails techniques sont dans `TECHNICAL_DETAILS.md`
- Le rapport complet est dans `DIAGNOSTIC_REPORT.md`
- Le résumé est dans `DIAGNOSTIC_SUMMARY.txt`

---

**Dernière mise à jour:** 23 octobre 2025


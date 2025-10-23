# 🎯 RÉFÉRENCE RAPIDE - JDR-IA-NARRATIVE

## 📊 Tableau de Synthèse

| Catégorie | Problème | Fichier | Ligne | Sévérité | Correction |
|-----------|----------|---------|-------|----------|-----------|
| Config | Variables d'env manquantes | `.env` | - | 🔴 CRITIQUE | Créer depuis `.env.example` |
| Sécurité | Clés exposées dans Git | `.env` | - | 🔴 CRITIQUE | Révoquer + purger historique |
| Code | `saveToServer()` n'existe pas | `SessionManager.jsx` | 27 | 🔴 CRITIQUE | Utiliser `saveSessionToServer()` |
| Code | Variable `messages` non définie | `SessionManager.jsx` | 41 | 🔴 CRITIQUE | Supprimer la ligne |
| Code | `deleteSession()` n'existe pas | `SessionManager.jsx` | 68 | 🔴 CRITIQUE | Appeler API DELETE |
| Code | `getCampaign()` n'existe pas | `MemoryManager.jsx` | 57 | 🔴 CRITIQUE | Utiliser `getCurrentCampaign()` |
| Code | Méthodes manquantes | `MemoryManager.js` | - | ⚠️ MAJEUR | Ajouter `saveToServer()` et `deleteSession()` |
| API | Route logout manquante | `app/api/auth/logout/` | - | ⚠️ MAJEUR | Créer la route |
| Config | Contenu dupliqué | `.env.example` | 1-33 | ℹ️ MINEUR | Nettoyer |
| DB | Vérifier casse Prisma | `route.js` | 53 | ⚠️ MAJEUR | Vérifier `pINLog` vs `PINLog` |

---

## 🔧 Corrections Rapides

### SessionManager.jsx - Ligne 27
```diff
- await memoryManager.saveToServer()
+ await memoryManager.saveSessionToServer(sessionId)
```

### SessionManager.jsx - Ligne 41
```diff
- memoryManager.sessions[memoryManager.currentSessionId].campaign.messages = messages
+ // Supprimer cette ligne
```

### SessionManager.jsx - Ligne 68
```diff
- memoryManager.deleteSession(sessionId)
+ const res = await fetch('/api/sessions', {
+   method: 'DELETE',
+   headers: { 'Content-Type': 'application/json' },
+   body: JSON.stringify({ id: sessionId })
+ })
```

### MemoryManager.jsx - Ligne 57
```diff
- const currentCampaign = memoryManager.getCampaign()
+ const currentCampaign = memoryManager.getCurrentCampaign()
```

---

## 📋 Checklist Rapide

```
PHASE 1 - URGENT (30 min)
☐ cp .env.example .env
☐ Remplir DATABASE_URL et OPENAI_API_KEY
☐ npm run check-env
☐ Corriger SessionManager.jsx (3 erreurs)
☐ Corriger MemoryManager.jsx (1 erreur)

PHASE 2 - HAUTE (1h)
☐ Ajouter saveToServer() dans MemoryManager.js
☐ Ajouter deleteSession() dans MemoryManager.js
☐ Créer app/api/auth/logout/route.js
☐ Vérifier casse Prisma (pINLog)

PHASE 3 - MOYENNE (30 min)
☐ Nettoyer .env.example
☐ Tester npm run dev
☐ Tester le flux complet

PHASE 4 - BASSE (1h+)
☐ Améliorer sécurité
☐ Ajouter tests
☐ Documenter
```

---

## 🚀 Commandes Essentielles

```bash
# Vérifier l'environnement
npm run check-env

# Générer Prisma
npm run prisma:generate

# Appliquer migrations
npm run prisma:migrate

# Démarrer en dev
npm run dev

# Build
npm run build

# Linter
npm run lint

# Prisma Studio (voir la DB)
npx prisma studio
```

---

## 📁 Fichiers Clés

| Fichier | Rôle | Statut |
|---------|------|--------|
| `.env` | Variables d'environnement | ❌ Manquant |
| `app/page.js` | Page principale | ✅ OK |
| `app/api/auth/pin/route.js` | Authentification | ⚠️ À vérifier |
| `app/components/SessionManager.jsx` | Gestion sessions | ❌ 3 erreurs |
| `app/components/MemoryManager.jsx` | Gestion mémoire | ❌ 1 erreur |
| `app/utils/memoryManager.js` | Logique mémoire | ⚠️ Méthodes manquantes |
| `prisma/schema.prisma` | Schéma DB | ✅ OK |

---

## 🔐 Sécurité - À Faire

1. **URGENT:** Révoquer les clés exposées
2. Purger l'historique Git
3. Ajouter rate limiting
4. Ajouter CSRF protection
5. Ajouter expiration des tokens
6. Valider les entrées

---

## 📞 Dépannage Rapide

| Problème | Solution |
|----------|----------|
| `npm run dev` échoue | Vérifier `.env` avec `npm run check-env` |
| Erreur Prisma | Exécuter `npm run prisma:generate` |
| Erreur de session | Vérifier les méthodes dans `MemoryManager.js` |
| Erreur de connexion | Vérifier la base de données |
| Erreur OpenAI | Vérifier `OPENAI_API_KEY` dans `.env` |

---

## 📚 Documentation Générée

- `DIAGNOSTIC_REPORT.md` - Rapport complet
- `CORRECTIONS_NEEDED.md` - Code des corrections
- `TECHNICAL_DETAILS.md` - Détails techniques
- `ACTION_CHECKLIST.md` - Checklist d'actions
- `DIAGNOSTIC_SUMMARY.txt` - Résumé ASCII
- `QUICK_REFERENCE.md` - Ce fichier

---

## ⏱️ Temps Estimé

| Phase | Durée | Priorité |
|-------|-------|----------|
| Phase 1 (Urgent) | 30 min | 🔴 CRITIQUE |
| Phase 2 (Haute) | 1h | 🟡 MAJEUR |
| Phase 3 (Moyenne) | 30 min | 🟢 NORMAL |
| Phase 4 (Basse) | 1h+ | 🔵 OPTIONNEL |
| **TOTAL** | **3h** | - |

---

## ✅ Validation Finale

Avant de déployer, vérifier:
- [ ] `npm run check-env` ✅
- [ ] `npm run lint` ✅
- [ ] `npm run build` ✅
- [ ] `npm run dev` ✅
- [ ] Flux complet testé ✅
- [ ] Pas de clés sensibles ✅
- [ ] `.env` dans `.gitignore` ✅

---

**Généré le:** 23 octobre 2025  
**Version:** 1.0


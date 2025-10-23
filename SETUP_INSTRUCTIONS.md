# 🎯 Instructions de Configuration

## Prérequis

- Node.js 18+ installé
- Compte Supabase (gratuit)
- Compte OpenAI (pour l'API)
- Compte Vercel (pour déploiement)
- Git installé

## 1️⃣ Configuration Supabase

### Créer un projet Supabase

1. Aller sur https://supabase.com
2. Cliquer "New Project"
3. Remplir les informations:
   - **Name**: jdr-ia-narrative
   - **Database Password**: Générer un mot de passe fort
   - **Region**: Choisir la région la plus proche
4. Cliquer "Create new project"
5. Attendre que le projet soit créé (2-3 min)

### Récupérer la DATABASE_URL

1. Aller dans "Settings" → "Database"
2. Copier la connection string sous "Connection string"
3. Remplacer `[YOUR-PASSWORD]` par le mot de passe que vous avez défini
4. Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

## 2️⃣ Configuration OpenAI

### Créer une clé API

1. Aller sur https://platform.openai.com/api-keys
2. Cliquer "Create new secret key"
3. Copier la clé (format: `sk-...`)
4. ⚠️ NE PAS la partager ou la commiter

## 3️⃣ Configuration locale

### Cloner et installer

```bash
# Cloner le repo (si pas déjà fait)
git clone https://github.com/votre-username/jdr-ia-narrative.git
cd jdr-ia-narrative

# Installer les dépendances
npm install
```

### Configurer les variables d'environnement

```bash
# Copier le fichier exemple
cp .env.example .env

# Éditer .env avec vos valeurs
# Ouvrir .env dans votre éditeur et remplir:
# DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@YOUR_HOST:5432/postgres
# OPENAI_API_KEY=sk-YOUR_API_KEY
# USER_KEY=user_moi
```

### Vérifier la configuration

```bash
# Vérifier que toutes les variables sont présentes
npm run check-env

# Vous devriez voir:
# ✅ DATABASE_URL présent
# ✅ OPENAI_API_KEY présent
# ✅ USER_KEY présent
```

### Générer le client Prisma

```bash
# Générer le client Prisma
npm run prisma:generate

# Vous devriez voir:
# ✅ Prisma Client generated
```

### Appliquer les migrations

```bash
# Appliquer les migrations à la base de données
npm run prisma:migrate

# Vous devriez voir:
# ✅ Migrations applied
```

## 4️⃣ Tester localement

### Démarrer l'app

```bash
# Démarrer le serveur de développement
npm run dev

# Vous devriez voir:
# ▲ Next.js 15.5.5
# - Local: http://localhost:3000
```

### Ouvrir dans le navigateur

1. Ouvrir http://localhost:3000
2. Vous devriez voir l'écran de login PIN
3. Créer un PIN (4 chiffres)
4. Cliquer "Créer"
5. Vous devriez être connecté

### Tester les fonctionnalités

```
1. Créer une session
   - Cliquer "📁 Sessions"
   - Entrer "Test Session"
   - Cliquer "Créer"

2. Modifier la campagne
   - Cliquer "🧠 Mémoire"
   - Ajouter un chapitre
   - Vérifier que c'est sauvegardé

3. Tester la synchronisation
   - Ouvrir http://localhost:3000 sur un autre appareil
   - Créer une session sur le premier
   - Attendre 5 secondes
   - Vérifier qu'elle apparaît sur le second

4. Tester la déconnexion
   - Cliquer "🚪 Déconnexion"
   - Vous devriez revenir au login
```

### Voir la base de données

```bash
# Ouvrir Prisma Studio
npx prisma studio

# Vous devriez voir:
# - Les utilisateurs
# - Les sessions
# - Les tokens d'authentification
```

## 5️⃣ Déployer sur Vercel

### Préparer le repo GitHub

```bash
# Ajouter les fichiers
git add .

# Commiter
git commit -m "feat: Prisma architecture with multi-device sync"

# Pousser
git push origin main
```

### Créer un projet Vercel

1. Aller sur https://vercel.com
2. Cliquer "New Project"
3. Sélectionner votre repo GitHub
4. Cliquer "Import"

### Ajouter les variables d'environnement

1. Dans Vercel, aller dans "Settings" → "Environment Variables"
2. Ajouter:
   - **DATABASE_URL**: Votre connection string Supabase
   - **OPENAI_API_KEY**: Votre clé API OpenAI
   - **USER_KEY**: user_moi

3. Cliquer "Save"

### Déployer

1. Cliquer "Deploy"
2. Attendre que le déploiement se termine (2-3 min)
3. Cliquer sur l'URL pour ouvrir l'app

## 6️⃣ Utiliser sur plusieurs appareils

### Sur PC

1. Ouvrir https://votre-app.vercel.app
2. Créer un PIN
3. Créer une session

### Sur téléphone

1. Ouvrir https://votre-app.vercel.app sur le téléphone
2. Utiliser le même PIN
3. Vous devriez voir la session créée sur le PC
4. Attendre 5 secondes pour la synchronisation

### Synchronisation

- Les changements se synchronisent automatiquement toutes les 5 secondes
- Vous pouvez modifier la campagne sur n'importe quel appareil
- Les changements apparaîtront sur tous les appareils

## 🔒 Sécurité

### À faire

- ✅ Ajouter `.env` à `.gitignore` (déjà fait)
- ✅ Ne jamais commiter `.env`
- ✅ Utiliser des variables d'environnement sur Vercel
- ✅ Utiliser des cookies HttpOnly
- ✅ Valider les entrées utilisateur

### À améliorer

- ⏳ Ajouter rate limiting
- ⏳ Ajouter CSRF protection
- ⏳ Ajouter validation des données
- ⏳ Ajouter logging des accès
- ⏳ Ajouter encryption end-to-end

## 📊 Monitoring

### Logs Vercel

```bash
# Voir les logs en temps réel
vercel logs
```

### Prisma Studio

```bash
# Voir la base de données
npx prisma studio
```

### Network (F12)

1. Ouvrir F12 dans le navigateur
2. Aller dans "Network"
3. Voir les requêtes API
4. Vérifier les réponses

## 🆘 Dépannage

### Erreur: "DATABASE_URL manquant"
```bash
# Vérifier que .env existe et est rempli
cat .env

# Vérifier que npm run check-env passe
npm run check-env
```

### Erreur: "Prisma migration failed"
```bash
# Réinitialiser la base de données
npm run prisma:migrate reset

# Attention: Cela supprime toutes les données!
```

### Erreur: "Cannot find module '@prisma/client'"
```bash
# Régénérer le client Prisma
npm run prisma:generate
```

### L'app ne démarre pas
```bash
# Vérifier les erreurs
npm run dev

# Vérifier les logs
npm run lint

# Vérifier les dépendances
npm install
```

## ✅ Checklist finale

- [ ] Supabase project créé
- [ ] DATABASE_URL récupérée
- [ ] OpenAI API key créée
- [ ] .env rempli localement
- [ ] npm run check-env ✅
- [ ] npm run prisma:generate ✅
- [ ] npm run prisma:migrate ✅
- [ ] npm run dev fonctionne
- [ ] Login fonctionne
- [ ] Créer session fonctionne
- [ ] Synchronisation fonctionne
- [ ] Repo GitHub prêt
- [ ] Vercel project créé
- [ ] Variables d'environnement ajoutées
- [ ] Déploiement réussi
- [ ] App accessible sur Vercel

## 🎉 Prêt!

Votre app est maintenant:
- ✅ Configurée localement
- ✅ Testée
- ✅ Déployée sur Vercel
- ✅ Accessible depuis n'importe quel appareil
- ✅ Synchronisée en temps réel

Bon jeu! 🎭


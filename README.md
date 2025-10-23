This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Gestion des secrets & variables d'environnement

Ne commitez jamais vos vraies clés (OpenAI, DB). Ce dépôt contient un fichier `.env.example` sans valeurs sensibles. Procédure recommandée :

> Remarque importante: une `.env` contenant des clés sensibles a été détectée dans le dépôt. Consultez `SAFE_KEYS_NOTICE.md` pour les actions immédiates recommandées (rotation des clés, suppression du fichier des commits).

1. Copiez `.env.example` en `.env` dans la racine du projet.
2. Remplissez `DATABASE_URL` et `OPENAI_API_KEY` localement.
3. Vérifiez que les variables sont présentes :

```bash
npm run check-env
```

4. Lancez le serveur en développement :

```bash
npm run dev
```

Si vous avez accidentellement commité un secret, révoquez/rotâez la clé immédiatement (OpenAI, Supabase) et remplacez-la dans votre projet.

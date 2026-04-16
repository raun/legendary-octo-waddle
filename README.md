# CI/CD Learning Platform — Prototype

Hands-on GitHub Actions exercises for Forward Deployed Engineers.

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

### Option A — Git push (recommended)

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import the repository
4. Vercel auto-detects Next.js — click **Deploy**
5. Done. You'll get a URL like `cicd-learning-platform.vercel.app`

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel
```

Follow the prompts. First deploy takes ~60 seconds.

## Chatbot

The AI tutor calls the Anthropic API directly from the browser. For production, proxy through a backend route to keep your API key secure.

## Project structure

```
app/
  layout.js      — root layout, metadata, global styles
  globals.css    — Tailwind directives, fonts, animations
  page.jsx       — the entire prototype (single-file for now)
```

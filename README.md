# CI/CD Learning Platform — Prototype

Hands-on GitHub Actions exercises for Forward Deployed Engineers.

## Local development

```bash
npm install
cp .env.local.example .env.local
# Edit .env.local and add your Anthropic API key
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

### Option A — Git push (recommended)

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import the repository
4. Add environment variable: `ANTHROPIC_API_KEY` = your key
5. Click **Deploy**
6. Done. You'll get a URL like `cicd-learning-platform.vercel.app`

### Option B — Vercel CLI

```bash
npm i -g vercel
vercel
# When prompted, add ANTHROPIC_API_KEY via the Vercel dashboard:
# Project Settings → Environment Variables
```

## Chatbot

The AI tutor and advisor call Claude via a server-side API route (`/api/chat`). Your Anthropic API key never reaches the browser — it stays on the server as an environment variable.

## Project structure

```
app/
  layout.js      — root layout, metadata, global styles
  globals.css    — Tailwind directives, fonts, animations
  page.jsx       — the entire prototype (single-file for now)
```

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A single-page interactive learning platform (Next.js 14) teaching GitHub Actions and CI/CD concepts through hands-on exercises. Target audience: Forward Deployed Engineers (FDEs). Built as a prototype with the entire UI in one large file.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Production build
npm run start        # Start production server
```

Requires `ANTHROPIC_API_KEY` in `.env.local` (copy from `.env.local.example`).

## Architecture

**Key files:**
- `app/page.jsx` (~1262 lines) — entire application UI in a single file
- `app/api/chat/route.js` — server-side Claude API proxy (keeps API key off client)
- `app/layout.js` — root layout with Google Fonts (Fraunces, JetBrains Mono, Inter)
- `app/globals.css` — custom scrollbar styles and fade/slide animations

**Two primary views toggled by state:**
- `ModuleBrowser` — module catalog + curriculum advisor chatbot
- `ExerciseView` — YAML editor + validation engine + exercise tutor chatbot

**Dual chatbot system:**
- Curriculum advisor: helps pick modules, answers conceptual questions
- Exercise tutor: gives hints based on failed validations, refuses to give full solutions

**Validation engine (`validateWorkflow`):** regex-based YAML checker with 20+ rules per exercise (push triggers, job names, secrets usage, matrix strategy, etc.). Runs client-side on the editor content.

**Simulation engine (`simulateRun`):** animates execution logs with staggered timing to simulate real CI/CD runs.

**Curriculum:** 6 modules (1 locked), each with 1 exercise. Exercise objects contain: `objective`, `framing`, `starterCode`, `solution`, `validations[]`, `pitfalls[]`, and optional video URL. All content is defined inline in `page.jsx`.

**API route** (`/app/api/chat/route.js`): proxies to Anthropic `claude-sonnet-4-20250514`, max 400 tokens, server-side only.

**State:** All managed with React `useState` hooks local to components — no Redux, Context, or external state library.

## Styling

- Tailwind CSS with stone-based palette; each module has a distinct accent color (emerald, sky, violet, rose, amber, teal, stone)
- Color classes are safelisted in `tailwind.config.js` so dynamic color strings work
- Custom animations defined in `globals.css`: `fadeIn`, `slideInUp`

## Deployment

Vercel is the recommended platform. Set `ANTHROPIC_API_KEY` as an environment variable in the Vercel dashboard.

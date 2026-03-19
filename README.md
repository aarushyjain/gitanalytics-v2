<div align="center">

# GitAnalytics v2

**Turn any GitHub username into a full developer intelligence report — powered by AI.**

[![Live Demo](https://img.shields.io/badge/Live-Demo-black?style=for-the-badge)](https://gitanalytics-v2.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=nextdotjs)](https://nextjs.org)
[![Claude AI](https://img.shields.io/badge/Claude-AI-orange?style=for-the-badge)](https://anthropic.com)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)

</div>

---

## What It Does

Enter any GitHub username → get an AI-powered breakdown:

- **Productivity Score** — commit frequency, contribution patterns, NLP analysis
- **Skill Fingerprint** — languages, repos, activity heatmap
- **Career Predictions** — linear regression on growth trajectory
- **AI Chat** — ask anything: *"Write a recruiter bio"*, *"Rate their open source work"*, *"What should they learn next?"*

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 · React 18 · Recharts · Tailwind |
| AI | Claude API (chat + insights) |
| Infra | Vercel · GitHub REST API |

**2-layer caching** (Redis → Supabase) cuts repeat API latency by ~95%.

---

## Setup 

### 1. Get API Keys

| Service | Where | What you need |
|---|---|---|
| GitHub | [settings/tokens](https://github.com/settings/tokens) → Classic → No scopes | `GITHUB_TOKEN` |
| Anthropic | [console.anthropic.com](https://console.anthropic.com) → API Keys | `ANTHROPIC_API_KEY` ($5 free credit) |

### 2. Run Locally

```bash
git clone https://github.com/aarushyjain/gitanalytics-v2
cd gitanalytics-v2
npm install
```

Create `.env.local` with all keys from above, then:

```bash
node scripts/setup-db.js   # prints SQL → paste in Supabase SQL Editor → Run
npm run dev                 # → http://localhost:3000
```

### 3. Deploy to Vercel

```bash
# Push to GitHub, then:
# vercel.com → New Project → Import repo → Add env vars → Deploy
```

Live in ~2 minutes.
---

<div align="center">
Built by <a href="https://github.com/aarushyjain">Aarush Jain</a>
</div>

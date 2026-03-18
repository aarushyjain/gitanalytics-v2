# GitAnalytics v2 — Full Stack AI Developer Dashboard

> Next.js · Redis Cache · Supabase DB · Claude AI · Vercel Deployment

---

## FREE Services Used (No Credit Card Needed)

| Service      | What it does              | Free Tier                    | Sign up |
|-------------|---------------------------|------------------------------|---------|
| GitHub Token | API access (no CORS)      | 5000 req/hr (60 without)     | github.com/settings/tokens |
| Anthropic   | AI insights + chatbot     | $5 free credit (~500 calls)  | console.anthropic.com |
| Supabase    | Postgres DB (search history, cached insights) | 500MB forever | supabase.com |
| Upstash     | Redis cache (1hr TTL)     | 10,000 req/day forever       | upstash.com |
| Vercel      | Hosting + serverless      | Unlimited hobby projects     | vercel.com |

---

## STEP 1 — Get Free API Keys

### A. GitHub Token (5 minutes)
1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Name it: `gitanalytics`
4. Select NO scopes (public data only)
5. Click Generate → Copy the token (starts with `ghp_`)

### B. Anthropic API Key (3 minutes)
1. Go to https://console.anthropic.com
2. Sign up (email only, no credit card)
3. You get $5 free credit automatically
4. Go to API Keys → Create Key
5. Copy the key (starts with `sk-ant-`)

### C. Supabase Database (5 minutes)
1. Go to https://supabase.com → Sign Up Free
2. New Project → Name: `gitanalytics` → Set a DB Password (save it!) → Free tier
3. Wait ~2 minutes for project to initialize
4. Go to: Project Settings → API
5. Copy these 3 values:
   - "Project URL" → SUPABASE_URL
   - "anon public" key → SUPABASE_ANON_KEY
   - "service_role secret" key → SUPABASE_SERVICE_KEY

### D. Upstash Redis Cache (3 minutes)
1. Go to https://upstash.com → Sign up (GitHub login works)
2. Create Database → Name: `gitanalytics` → Region: US-East-1 → Free tier
3. Click your database → "REST API" tab
4. Copy:
   - UPSTASH_REDIS_REST_URL
   - UPSTASH_REDIS_REST_TOKEN

---

## STEP 2 — Local Setup

```bash
# 1. Extract and enter project
cd D:\
unzip gitanalytics-v2.zip
cd gitanalytics-v2\gitanalytics-v2

# 2. Install dependencies
npm install

# 3. Fill in your keys
notepad .env.local
# Paste all 7 keys from Step 1 above

# 4. Set up Supabase tables
node scripts/setup-db.js
# This prints SQL → copy it → paste in Supabase SQL Editor → Run

# 5. Start development server
npm run dev
# Open: http://localhost:3000
```

---

## STEP 3 — Set Up Supabase Tables

After running `node scripts/setup-db.js`, you'll see SQL printed in the terminal.

1. Go to https://supabase.com/dashboard → Your Project
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"
4. Paste the SQL that was printed
5. Click "Run" (green button)
6. You should see "Success. No rows returned"

Your tables are now created:
- `searches` — stores every analyzed profile
- `insights` — caches AI insights for 24 hours

---

## STEP 4 — Run and Test

```bash
npm run dev
```

1. Open http://localhost:3000
2. Type `aarushyjain` → click Analyze
3. After analysis, click "◈ AI Chat" tab
4. Try these questions:
   - "What are their strongest technical skills?"
   - "Write a recruiter bio for this developer"
   - "What jobs would suit them?"
   - "Rate their open source contributions out of 10"
   - "What should they learn next?"

The chatbot has FULL access to all profile data and will answer specifically.

---

## STEP 5 — Deploy to Vercel (FREE)

```bash
# 1. Create GitHub repo
# Go to github.com/new → name: gitanalytics → Create

# 2. Push your code
git init
git add .
git commit -m "feat: GitAnalytics v2 with AI + DB"
git remote add origin https://github.com/YOUR_USERNAME/gitanalytics.git
git push -u origin main

# 3. Deploy on Vercel
# Go to vercel.com → New Project → Import your repo
# Framework: Next.js (auto-detected)
# Add Environment Variables (all 7 from .env.local)
# Click Deploy → live in ~2 minutes
```

Your live URL: `https://gitanalytics-yourname.vercel.app`

---

## Architecture

```
Browser
  │
  ├── GET /api/github?username=xxx
  │     ├── 1. Check Upstash Redis (1hr cache)
  │     ├── 2. If miss → fetch GitHub API (with token)
  │     ├── 3. Cache result in Redis
  │     └── 4. Save to Supabase DB (async)
  │
  ├── POST /api/insights
  │     ├── 1. Check Redis cache
  │     ├── 2. Check Supabase insights table (24hr)
  │     ├── 3. If miss → call Claude API
  │     ├── 4. Cache in Redis + save to Supabase
  │     └── 5. Return insights
  │
  ├── POST /api/chat
  │     ├── Full profile context injected into system prompt
  │     └── Claude answers with real data every time
  │
  └── GET /api/trending
        ├── Check Redis (5min cache)
        └── Query Supabase for recent + top searches
```

---

## Resume Bullet Points

```
GitAnalytics — AI Developer Analytics Dashboard
• Built full-stack Next.js dashboard analyzing GitHub profiles with AI-powered
  productivity scoring, commit NLP analysis, and linear regression predictions
• Integrated Claude AI chatbot with full profile context injection for
  data-driven developer Q&A (skills, career advice, recruiter summaries)
• Implemented 2-layer caching (Upstash Redis + Supabase Postgres) reducing
  API latency by ~95% on repeat queries
• Deployed on Vercel with server-side API proxying, eliminating CORS issues
  and securing all API keys from client exposure
Stack: Next.js 14 · React 18 · Recharts · Claude API · GitHub REST API ·
       Supabase · Upstash Redis · Vercel
```

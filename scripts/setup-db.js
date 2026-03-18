// scripts/setup-db.js
// Run with: node scripts/setup-db.js
// Creates all required Supabase tables automatically

require('dotenv').config({ path: '.env.local' })

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌  Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local')
  process.exit(1)
}

async function runSQL(sql, description) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify({ sql }),
  })
  const text = await res.text()
  if (res.ok) {
    console.log(`✅  ${description}`)
  } else {
    console.warn(`⚠️  ${description} — ${text} (may already exist, continuing)`)
  }
}

async function setup() {
  console.log('\n🚀  Setting up GitAnalytics database on Supabase...\n')

  // Instead of using RPC (which may not exist), use the Supabase SQL editor
  // Print the SQL for the user to run manually in Supabase dashboard
  const sql = `
-- ── Run this in: Supabase Dashboard → SQL Editor → New Query ─────────────────

-- 1. searches table (stores every analyzed profile)
CREATE TABLE IF NOT EXISTS searches (
  id            BIGSERIAL PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  display_name  TEXT,
  avatar_url    TEXT,
  bio           TEXT,
  followers     INTEGER DEFAULT 0,
  public_repos  INTEGER DEFAULT 0,
  total_stars   INTEGER DEFAULT 0,
  score         INTEGER DEFAULT 0,
  top_language  TEXT,
  languages     JSONB DEFAULT '[]',
  predicted_commits INTEGER DEFAULT 0,
  active_repos  INTEGER DEFAULT 0,
  raw_analytics JSONB DEFAULT '{}',
  search_count  INTEGER DEFAULT 1,
  searched_at   TIMESTAMPTZ DEFAULT NOW(),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. insights table (caches AI-generated insights for 24h)
CREATE TABLE IF NOT EXISTS insights (
  id           BIGSERIAL PRIMARY KEY,
  username     TEXT UNIQUE NOT NULL,
  insights     JSONB NOT NULL DEFAULT '[]',
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Increment search count function
CREATE OR REPLACE FUNCTION increment_search_count(uname TEXT)
RETURNS void AS $$
  UPDATE searches
  SET search_count = search_count + 1,
      searched_at  = NOW()
  WHERE username = uname;
$$ LANGUAGE sql;

-- 4. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_searches_username    ON searches(username);
CREATE INDEX IF NOT EXISTS idx_searches_searched_at ON searches(searched_at DESC);
CREATE INDEX IF NOT EXISTS idx_searches_score       ON searches(score DESC);
CREATE INDEX IF NOT EXISTS idx_insights_username    ON insights(username);

-- 5. Enable Row Level Security (RLS) — read-only for anon
ALTER TABLE searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read searches" ON searches FOR SELECT USING (true);
CREATE POLICY "Public read insights" ON insights FOR SELECT USING (true);

-- Done! ✅
`

  console.log('━'.repeat(60))
  console.log('\n📋  COPY AND RUN THIS SQL IN YOUR SUPABASE DASHBOARD:\n')
  console.log('   👉  https://supabase.com/dashboard → Your Project')
  console.log('   👉  SQL Editor → New Query → Paste → Run\n')
  console.log('━'.repeat(60))
  console.log(sql)
  console.log('━'.repeat(60))
  console.log('\n✅  Once you run the SQL above, your database is fully set up!')
  console.log('   Restart your dev server: npm run dev\n')
}

setup().catch(console.error)

// pages/api/insights.js — Gemini AI insights (gemini-2.5-flash-lite — FREE tier)

import { getCachedInsights, saveInsights } from '../../lib/supabase'
import { cacheGet, cacheSet, keys } from '../../lib/cache'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { user, analytics } = req.body
  if (!user || !analytics) return res.status(400).json({ error: 'Missing data' })

  const login = user.login?.toLowerCase()

  // 1. Redis cache
  const redisCached = await cacheGet(keys.insights(login))
  if (redisCached) return res.status(200).json({ insights: redisCached, fromCache: true })

  // 2. Supabase DB cache (24h)
  const dbCached = await getCachedInsights(login)
  if (dbCached) {
    await cacheSet(keys.insights(login), dbCached, 3600)
    return res.status(200).json({ insights: dbCached, fromCache: true })
  }

  // 3. No API key
  if (!process.env.GEMINI_API_KEY) return res.status(200).json({ insights: [] })

  const prompt = `Analyze this GitHub developer and return exactly 4 specific, data-driven insights that a recruiter would find valuable.

DEVELOPER DATA:
- Username: ${user.login} | Name: ${user.name || 'N/A'}
- Bio: ${user.bio || 'N/A'} | Location: ${user.location || 'N/A'}
- Account age: ${analytics.accountAgeDays} days
- Public repos: ${user.public_repos} | Active (90d): ${analytics.activeRepos}
- Total stars: ${analytics.totalStars} | Total forks: ${analytics.totalForks}
- Followers: ${user.followers} | Following: ${user.following}
- Productivity Score: ${analytics.score}/100
- Top languages: ${analytics.languages.slice(0,5).map(l=>`${l.name}(${l.pct}%)`).join(', ')}
- Commit skill signals: ${analytics.skills.slice(0,6).map(([s,c])=>`${s}(${c} commits)`).join(', ')}
- Predicted commits next week: ${analytics.predicted}
- Score breakdown: ${Object.entries(analytics.factors).map(([k,v])=>`${k}:${Math.round(v)}/20`).join(', ')}

Return ONLY a valid JSON object. Absolutely no markdown, no backticks, no extra text — just raw JSON:
{"insights":[{"title":"short title max 6 words","body":"2 specific sentences using real numbers from the data","type":"strength"},{"title":"short title max 6 words","body":"2 specific sentences using real numbers from the data","type":"tip"},{"title":"short title max 6 words","body":"2 specific sentences using real numbers from the data","type":"prediction"},{"title":"short title max 6 words","body":"2 specific sentences using real numbers from the data","type":"warning"}]}`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 800,
          }
        })
      }
    )

    const data = await response.json()
    if (data.error) throw new Error(data.error.message)
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    const insights = parsed.insights || []

    // Cache in Redis + Supabase
    await cacheSet(keys.insights(login), insights, 86400)
    saveInsights(login, insights).catch(() => {})

    res.status(200).json({ insights, fromCache: false })
  } catch (err) {
    console.error('Gemini insights error:', err.message)
    res.status(200).json({ insights: [] })
  }
}

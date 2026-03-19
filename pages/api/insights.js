// pages/api/insights.js — Gemini AI insights (no Redis/Supabase required)
 
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { user, analytics } = req.body
  if (!user || !analytics) return res.status(400).json({ error: 'Missing data' })
 
  if (!process.env.GEMINI_API_KEY) return res.status(200).json({ insights: [] })
 
  const prompt = `Analyze this GitHub developer and return exactly 4 specific, data-driven insights that a recruiter would find valuable.
 
DEVELOPER DATA:
- Username: ${user.login} | Name: ${user.name || 'N/A'}
- Bio: ${user.bio || 'N/A'} | Location: ${user.location || 'N/A'}
- Account age: ${analytics.accountAgeDays} days
- Public repos: ${user.public_repos} | Active (90d): ${analytics.activeRepos}
- Total stars: ${analytics.totalStars} | Total forks: ${analytics.totalForks}
- Followers: ${user.followers}
- Productivity Score: ${analytics.score}/100
- Top languages: ${analytics.languages.slice(0,5).map(l=>`${l.name}(${l.pct}%)`).join(', ')}
- Commit skill signals: ${analytics.skills.slice(0,6).map(([s,c])=>`${s}(${c} commits)`).join(', ')}
- Predicted commits next week: ${analytics.predicted}
- Score breakdown: ${Object.entries(analytics.factors).map(([k,v])=>`${k}:${Math.round(v)}/20`).join(', ')}
 
Return ONLY a valid JSON object. No markdown, no backticks, no explanation — raw JSON only:
{"insights":[{"title":"short title max 6 words","body":"2 specific sentences using real numbers","type":"strength"},{"title":"short title max 6 words","body":"2 specific sentences using real numbers","type":"tip"},{"title":"short title max 6 words","body":"2 specific sentences using real numbers","type":"prediction"},{"title":"short title max 6 words","body":"2 specific sentences using real numbers","type":"warning"}]}`
 
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 800 }
        })
      }
    )
    const data = await response.json()
    if (data.error) throw new Error(data.error.message)
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    res.status(200).json({ insights: parsed.insights || [] })
  } catch (err) {
    console.error('Gemini insights error:', err.message)
    res.status(500).json({ error: err.message })
  }
}
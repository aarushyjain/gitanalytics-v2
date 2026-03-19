// pages/api/insights.js — Gemini AI insights

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { user, analytics } = req.body
  if (!user || !analytics) return res.status(400).json({ error: 'Missing data' })
  if (!process.env.GEMINI_API_KEY) return res.status(200).json({ insights: [], error: 'No API key' })

  const prompt = `Analyze this GitHub developer and return exactly 4 insights a recruiter would value.

DATA:
- Username: ${user.login} | Name: ${user.name || 'N/A'}
- Bio: ${user.bio || 'N/A'}
- Account age: ${analytics.accountAgeDays} days
- Public repos: ${user.public_repos} | Active (90d): ${analytics.activeRepos}
- Stars: ${analytics.totalStars} | Forks: ${analytics.totalForks} | Followers: ${user.followers}
- Productivity Score: ${analytics.score}/100
- Languages: ${analytics.languages.slice(0,5).map(l=>`${l.name}(${l.pct}%)`).join(', ')}
- Commit skills: ${analytics.skills.slice(0,5).map(([s,c])=>`${s}(${c})`).join(', ')}
- Predicted commits next week: ${analytics.predicted}

You MUST return ONLY this exact JSON format, nothing else, no markdown, no backticks:
{"insights":[{"title":"title here","body":"2 sentences here","type":"strength"},{"title":"title here","body":"2 sentences here","type":"tip"},{"title":"title here","body":"2 sentences here","type":"prediction"},{"title":"title here","body":"2 sentences here","type":"warning"}]}`

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
            maxOutputTokens: 1000
          }
        })
      }
    )

    const data = await response.json()

    // Return actual error so frontend can show it
    if (data.error) {
      console.error('Gemini error:', data.error.message)
      return res.status(200).json({ insights: [], geminiError: data.error.message })
    }

    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
    const clean = raw.replace(/```json|```/g, '').trim()

    let parsed
    try {
      parsed = JSON.parse(clean)
    } catch {
      // Try to extract JSON from response
      const match = clean.match(/\{[\s\S]*\}/)
      parsed = match ? JSON.parse(match[0]) : { insights: [] }
    }

    res.status(200).json({ insights: parsed.insights || [] })
  } catch (err) {
    console.error('Insights fetch error:', err.message)
    res.status(200).json({ insights: [], geminiError: err.message })
  }
}
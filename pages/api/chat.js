// pages/api/chat.js — Gemini AI (gemini-2.5-flash-lite — FREE tier available)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { messages, context } = req.body
  if (!messages || !context) return res.status(400).json({ error: 'Missing data' })

  if (!process.env.GEMINI_API_KEY) {
    return res.status(200).json({
      reply: '⚠️ No GEMINI_API_KEY in .env.local\n\nGet a free key at:\nhttps://aistudio.google.com → Get API Key → Create API Key\n\nThen add GEMINI_API_KEY=AIza... to .env.local and restart.'
    })
  }

  const systemPrompt = `You are GitAnalytics AI — an expert GitHub developer analytics assistant.

You have COMPLETE access to this developer's profile:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
USERNAME:        @${context.login}
FULL NAME:       ${context.name || 'Not set'}
BIO:             ${context.bio || 'Not set'}
LOCATION:        ${context.location || 'Unknown'}
COMPANY:         ${context.company || 'Not set'}
FOLLOWERS:       ${context.followers}
FOLLOWING:       ${context.following}
PUBLIC REPOS:    ${context.repoCount}
TOTAL STARS:     ${context.totalStars}
TOTAL FORKS:     ${context.totalForks}
ACCOUNT AGE:     ${context.accountAgeDays} days (since ${context.createdAt?.slice(0,10)})
PRODUCTIVITY:    ${context.score}/100
ACTIVE REPOS:    ${context.activeRepos} (updated last 90 days)
TOP LANGUAGES:   ${context.topLanguages}
ALL LANGUAGES:   ${context.allLanguages}
PREDICTED COMMITS NEXT WEEK: ${context.predicted}
COMMIT SKILLS:   ${context.skills}
RECENT ACTIVITY: ${context.recentEvents}
TOP REPOS:       ${context.topRepos}
SCORE FACTORS:   ${context.scoreFactors}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

RULES:
1. ALWAYS answer using the real data above. Never say "I don't have access."
2. For skill questions → use commit signals + languages with exact numbers
3. For career questions → frame data positively with specific stats
4. For recruiter questions → generate professional summaries using real data
5. For improvement → give 3 specific steps based on weak score factors
6. Keep responses under 180 words unless asked for detail
7. Use bullet points for lists. Reference actual numbers from the profile.`

  // Build Gemini conversation — system prompt injected as first user/model exchange
  const contents = [
    {
      role: 'user',
      parts: [{ text: systemPrompt + '\n\nConfirm you have access to this profile and are ready.' }]
    },
    {
      role: 'model',
      parts: [{ text: `Confirmed. I have full access to @${context.login}'s GitHub profile and am ready to answer any questions accurately using their real data.` }]
    },
    ...messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))
  ]

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 600,
          }
        })
      }
    )

    const data = await response.json()
    if (data.error) throw new Error(data.error.message)
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!reply) throw new Error('No response from Gemini')
    res.status(200).json({ reply })
  } catch (err) {
    console.error('Gemini chat error:', err.message)
    res.status(500).json({ reply: `AI error: ${err.message}` })
  }
}

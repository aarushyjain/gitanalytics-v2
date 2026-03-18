// pages/api/github.js — GitHub proxy (works without Redis/Supabase)

const GH_BASE = 'https://api.github.com'

function ghHeaders() {
  const h = { Accept: 'application/vnd.github.v3+json' }
  if (process.env.GITHUB_TOKEN) h.Authorization = `token ${process.env.GITHUB_TOKEN}`
  return h
}

async function ghFetch(path) {
  const res = await fetch(`${GH_BASE}${path}`, { headers: ghHeaders() })
  if (!res.ok) {
    const msg = await res.text()
    throw new Error(`GitHub ${res.status}: ${res.status === 404 ? 'User not found' : msg}`)
  }
  return res.json()
}

async function fetchAllRepos(login) {
  const all = []
  for (let p = 1; p <= 3; p++) {
    const data = await ghFetch(`/users/${login}/repos?sort=updated&per_page=100&page=${p}`)
    all.push(...data)
    if (data.length < 100) break
  }
  return all
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const { username } = req.query
  if (!username?.trim()) return res.status(400).json({ error: 'username required' })

  try {
    const [user, repos, events] = await Promise.all([
      ghFetch(`/users/${username}`),
      fetchAllRepos(username),
      ghFetch(`/users/${username}/events?per_page=100`),
    ])
    res.status(200).json({ user, repos, events, fromCache: false })
  } catch (err) {
    const status = err.message.includes('not found') ? 404
                 : err.message.includes('403') ? 403 : 500
    res.status(status).json({ error: err.message })
  }
}

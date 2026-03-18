// pages/api/trending.js — returns recently searched + top scored profiles from DB

import { getRecentSearches, getTopSearched } from '../../lib/supabase'
import { cacheGet, cacheSet } from '../../lib/cache'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const cacheKey = 'trending:v1'
  const cached = await cacheGet(cacheKey)
  if (cached) return res.status(200).json(cached)

  const [recent, top] = await Promise.all([
    getRecentSearches(8),
    getTopSearched(5),
  ])

  const payload = { recent, top }
  await cacheSet(cacheKey, payload, 300) // 5 min cache
  res.status(200).json(payload)
}

// lib/cache.js — Upstash Redis cache (FREE: 10,000 req/day)
// Falls back gracefully to no-cache if keys not set

let redis = null

async function getRedis() {
  if (redis) return redis
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null
  try {
    const { Redis } = await import('@upstash/redis')
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    return redis
  } catch (e) {
    console.error('Redis init error:', e.message)
    return null
  }
}

const TTL = parseInt(process.env.CACHE_TTL_SECONDS || '3600') // 1 hour default

/** Get cached value — returns null if miss or cache unavailable */
export async function cacheGet(key) {
  const r = await getRedis()
  if (!r) return null
  try {
    const val = await r.get(key)
    return val ? (typeof val === 'string' ? JSON.parse(val) : val) : null
  } catch (e) {
    console.error('Cache GET error:', e.message)
    return null
  }
}

/** Set cache value with TTL */
export async function cacheSet(key, value, ttl = TTL) {
  const r = await getRedis()
  if (!r) return false
  try {
    await r.set(key, JSON.stringify(value), { ex: ttl })
    return true
  } catch (e) {
    console.error('Cache SET error:', e.message)
    return false
  }
}

/** Delete cache entry */
export async function cacheDel(key) {
  const r = await getRedis()
  if (!r) return
  try { await r.del(key) } catch (e) { /* silent */ }
}

/** Cache key generators */
export const keys = {
  github:   (username) => `gh:${username.toLowerCase()}`,
  insights: (username) => `ins:${username.toLowerCase()}`,
  compare:  (u1, u2)   => `cmp:${[u1,u2].sort().join(':')}`,
}

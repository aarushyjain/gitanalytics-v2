// lib/supabase.js — Supabase client (FREE tier: 500MB DB, unlimited reads)
import { createClient } from '@supabase/supabase-js'

// Public client — safe to use in browser
export const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
)

// Admin client — server-side only, never expose to browser
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
)

// ── DB Helper Functions ────────────────────────────────────────────────────

/** Save a profile search to DB */
export async function saveSearch({ username, userData, analyticsData }) {
  if (!process.env.SUPABASE_URL) return null
  try {
    const { data, error } = await supabaseAdmin
      .from('searches')
      .upsert({
        username: username.toLowerCase(),
        avatar_url: userData.avatar_url,
        display_name: userData.name || userData.login,
        bio: userData.bio,
        followers: userData.followers,
        public_repos: userData.public_repos,
        total_stars: analyticsData.totalStars,
        score: analyticsData.score,
        top_language: analyticsData.languages[0]?.name || null,
        languages: analyticsData.languages,
        predicted_commits: analyticsData.predicted,
        active_repos: analyticsData.activeRepos,
        raw_analytics: analyticsData,
        searched_at: new Date().toISOString(),
        search_count: 1,
      }, {
        onConflict: 'username',
        ignoreDuplicates: false,
      })
    if (error) throw error
    return data
  } catch (e) {
    console.error('Supabase saveSearch error:', e.message)
    return null
  }
}

/** Get recent searches for the homepage trending section */
export async function getRecentSearches(limit = 10) {
  if (!process.env.SUPABASE_URL) return []
  try {
    const { data, error } = await supabaseAdmin
      .from('searches')
      .select('username, display_name, avatar_url, score, top_language, total_stars, searched_at')
      .order('searched_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data || []
  } catch (e) {
    console.error('Supabase getRecentSearches error:', e.message)
    return []
  }
}

/** Get most searched profiles (leaderboard) */
export async function getTopSearched(limit = 5) {
  if (!process.env.SUPABASE_URL) return []
  try {
    const { data, error } = await supabaseAdmin
      .from('searches')
      .select('username, display_name, avatar_url, score, top_language, total_stars, search_count')
      .order('search_count', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data || []
  } catch (e) {
    console.error('Supabase getTopSearched error:', e.message)
    return []
  }
}

/** Increment search count */
export async function incrementSearchCount(username) {
  if (!process.env.SUPABASE_URL) return
  try {
    await supabaseAdmin.rpc('increment_search_count', { uname: username.toLowerCase() })
  } catch (e) {
    // Silently fail — not critical
  }
}

/** Save AI insights linked to a username */
export async function saveInsights(username, insights) {
  if (!process.env.SUPABASE_URL) return null
  try {
    const { data, error } = await supabaseAdmin
      .from('insights')
      .upsert({
        username: username.toLowerCase(),
        insights,
        generated_at: new Date().toISOString(),
      }, { onConflict: 'username' })
    if (error) throw error
    return data
  } catch (e) {
    console.error('Supabase saveInsights error:', e.message)
    return null
  }
}

/** Get saved insights (avoid re-generating) */
export async function getCachedInsights(username) {
  if (!process.env.SUPABASE_URL) return null
  try {
    const { data, error } = await supabaseAdmin
      .from('insights')
      .select('insights, generated_at')
      .eq('username', username.toLowerCase())
      .single()
    if (error || !data) return null
    // Re-use if generated within last 24 hours
    const age = Date.now() - new Date(data.generated_at).getTime()
    if (age < 24 * 60 * 60 * 1000) return data.insights
    return null
  } catch (e) {
    return null
  }
}

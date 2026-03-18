// pages/api/trending.js — returns empty (no DB required)
export default async function handler(req, res) {
  res.status(200).json({ recent: [], top: [] })
}

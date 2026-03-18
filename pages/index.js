import { useState, useRef, useEffect } from 'react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, RadialBarChart, RadialBar } from 'recharts'
import { computeAnalytics, LANG_COLORS } from '../lib/analytics'
import ScoreGauge  from '../components/ScoreGauge'
import Heatmap     from '../components/Heatmap'
import DonutChart  from '../components/DonutChart'
import HealthBadge from '../components/HealthBadge'
import Card        from '../components/Card'
import StatCard    from '../components/StatCard'
import LandingHero from '../components/LandingHero'
import ChatPanel   from '../components/ChatPanel'

/* ── Tooltip ─────────────────────────────────────────────────────── */
function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#1f2328', color:'#fff', borderRadius:8, padding:'8px 14px',
      fontSize:12, boxShadow:'0 4px 16px rgba(0,0,0,.25)', border:'1px solid rgba(255,255,255,.1)' }}>
      <div style={{ color:'rgba(255,255,255,.55)', marginBottom:3, fontSize:11 }}>{label}</div>
      <div style={{ fontWeight:700, fontSize:14 }}>{payload[0].value} commits</div>
    </div>
  )
}

/* ── Animated progress row ───────────────────────────────────────── */
function BarRow({ label, value, max, color = '#0969da', delay = '0s' }) {
  const pct = Math.min((value / Math.max(max, 1)) * 100, 100)
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:5 }}>
        <span style={{ color:'var(--text2)' }}>{label}</span>
        <span style={{ fontWeight:600, color:'var(--text)', fontVariantNumeric:'tabular-nums' }}>{value}</span>
      </div>
      <div className="progress-bg">
        <div className="progress-fill" style={{
          width:`${pct}%`, background:color,
          transition:'width 1s cubic-bezier(.16,1,.3,1)',
          animationDelay: delay,
          boxShadow:`0 0 6px ${color}55`,
        }}/>
      </div>
    </div>
  )
}

/* ── Insight configs ─────────────────────────────────────────────── */
const INSIGHT_CFG = {
  strength:   { bg:'var(--green-bg)',  border:'var(--green-bd)',  dot:'#1a7f37', label:'Strength',  icon:'💪' },
  tip:        { bg:'var(--blue-bg)',   border:'var(--blue-bd)',   dot:'#0969da', label:'Tip',       icon:'💡' },
  prediction: { bg:'var(--purple-bg)',border:'var(--purple-bd)', dot:'#6639ba', label:'Forecast',  icon:'🔮' },
  warning:    { bg:'var(--amber-bg)', border:'var(--amber-bd)',  dot:'#9a6700', label:'Warning',   icon:'⚠️' },
}

/* ══════════════════════════════════════════════════════════════════
   DASHBOARD
══════════════════════════════════════════════════════════════════ */
export default function Dashboard() {
  const [username,        setUsername]        = useState('')
  const [compareUsername, setCompareUsername] = useState('')
  const [loading,         setLoading]         = useState(false)
  const [step,            setStep]            = useState('')
  const [error,           setError]           = useState('')
  const [data,            setData]            = useState(null)
  const [analytics,       setAnalytics]       = useState(null)
  const [insights,        setInsights]        = useState([])
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [cData,           setCData]           = useState(null)
  const [cAnalytics,      setCAnalytics]      = useState(null)
  const [tab,             setTab]             = useState('overview')
  const [chatMsgs,        setChatMsgs]        = useState([])
  const [chatInput,       setChatInput]       = useState('')
  const [chatLoading,     setChatLoading]     = useState(false)
  const [trending,        setTrending]        = useState({ recent:[] })
  const chatEndRef = useRef(null)

  useEffect(() => {
    fetch('/api/trending').then(r=>r.json()).then(d=>setTrending(d)).catch(()=>{})
  }, [])
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:'smooth' }) }, [chatMsgs])

  async function fetchAndAnalyze(uname) {
    const res = await fetch(`/api/github?username=${encodeURIComponent(uname)}`)
    if (!res.ok) { const e = await res.json(); throw new Error(e.error||`Failed: ${uname}`) }
    const { user, repos, events } = await res.json()
    return { user, repos, events, analytics: computeAnalytics(user, repos, events) }
  }

  async function handleSearch() {
    if (!username.trim()) return
    setLoading(true); setError('')
    setData(null); setAnalytics(null); setCData(null); setCAnalytics(null)
    setInsights([]); setChatMsgs([]); setTab('overview')
    try {
      setStep(`Fetching @${username}…`)
      const r = await fetchAndAnalyze(username.trim())
      setData({ user:r.user, repos:r.repos, events:r.events })
      setAnalytics(r.analytics)
      if (compareUsername.trim()) {
        setStep(`Fetching @${compareUsername}…`)
        const cr = await fetchAndAnalyze(compareUsername.trim())
        setCData({ user:cr.user, repos:cr.repos }); setCAnalytics(cr.analytics)
      }
      setStep('Generating AI insights…'); setInsightsLoading(true)
      fetch('/api/insights', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ user:r.user, analytics:r.analytics }) })
        .then(res=>res.json()).then(({insights:ins})=>setInsights(ins||[]))
        .catch(()=>{}).finally(()=>setInsightsLoading(false))
    } catch(e) { setError(e.message) }
    finally { setLoading(false); setStep('') }
  }

  async function sendChat(overrideText) {
    const text = overrideText || chatInput
    if (!text.trim() || !data) return
    const userMsg = { role:'user', content:text }
    setChatMsgs(prev=>[...prev, userMsg])
    if (!overrideText) setChatInput('')
    setChatLoading(true)
    try {
      const context = {
        login:data.user.login, name:data.user.name, bio:data.user.bio,
        location:data.user.location, company:data.user.company,
        followers:data.user.followers, following:data.user.following,
        repoCount:analytics.repoCount, totalStars:analytics.totalStars,
        totalForks:analytics.totalForks, score:analytics.score,
        topLanguages:analytics.languages.slice(0,4).map(l=>`${l.name}(${l.pct}%)`).join(', '),
        allLanguages:analytics.languages.map(l=>l.name).join(', '),
        activeRepos:analytics.activeRepos, predicted:analytics.predicted,
        accountAgeDays:analytics.accountAgeDays, createdAt:data.user.created_at,
        skills:analytics.skills.length?analytics.skills.map(([s,c])=>`${s}(${c})`).join(', '):'None detected',
        recentEvents:data.events.slice(0,12).map(e=>`${e.type?.replace('Event','')}→${e.repo?.name?.split('/')[1]||e.repo?.name}`).join(', '),
        topRepos:analytics.topRepos.slice(0,5).map(r=>`${r.name}(★${r.stargazers_count})`).join(', '),
        scoreFactors:Object.entries(analytics.factors).map(([k,v])=>`${k}:${Math.round(v)}/20`).join(', '),
      }
      const res = await fetch('/api/chat', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ messages:[...chatMsgs, userMsg], context }) })
      const { reply } = await res.json()
      setChatMsgs(prev=>[...prev, { role:'assistant', content:reply }])
    } catch { setChatMsgs(prev=>[...prev, { role:'assistant', content:'Error reaching AI.' }]) }
    finally { setChatLoading(false) }
  }

  const TABS = [
    { id:'overview',     label:'Overview',      icon:'📊' },
    { id:'repositories', label:'Repositories',  icon:'📁' },
    { id:'activity',     label:'Activity',      icon:'⚡' },
    { id:'compare',      label:'Compare',       icon:'⇄'  },
    { id:'chatbot',      label:'AI Chat',       icon:'💬' },
  ]

  /* ── Loading ─────────────────────────────────────────────────────── */
  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', gap:20, background:'var(--bg)' }}>
      <div style={{ position:'relative', width:56, height:56 }}>
        <div style={{ position:'absolute', inset:0, border:'3px solid var(--bg3)',
          borderTopColor:'var(--blue)', borderRadius:'50%', animation:'spin .8s linear infinite' }}/>
        <div style={{ position:'absolute', inset:8, border:'2px solid var(--bg3)',
          borderTopColor:'#1a7f37', borderRadius:'50%', animation:'spin 1.2s linear infinite reverse' }}/>
      </div>
      <div style={{ textAlign:'center' }}>
        <p style={{ color:'var(--text)', fontSize:15, fontWeight:600, marginBottom:4 }}>Analyzing Profile</p>
        <p style={{ color:'var(--text3)', fontSize:13 }}>{step}</p>
      </div>
    </div>
  )

  /* ── Landing ─────────────────────────────────────────────────────── */
  if (!data) return (
    <LandingHero username={username} setUsername={setUsername}
      compareUsername={compareUsername} setCompareUsername={setCompareUsername}
      onSearch={handleSearch} loading={loading} step={step} error={error} trending={trending}/>
  )

  /* ── Dashboard ───────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg2)' }}>

      {/* ── Navbar ─────────────────────────────────────────────────── */}
      <nav className="navbar fade-in">
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 24px',
          height:52, display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginRight:8 }}>
            <div className="nav-logo" style={{ width:28, height:28, borderRadius:7,
              background:'linear-gradient(135deg,#1f2328,#32383f)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 1px 4px rgba(31,35,40,.2)', cursor:'default' }}>
              <svg width={14} height={14} viewBox="0 0 24 24" fill="#fff">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
              </svg>
            </div>
            <span style={{ fontWeight:700, fontSize:15, color:'var(--text)', letterSpacing:'-0.02em' }}>GitAnalytics</span>
          </div>
          <div style={{ width:1, height:18, background:'var(--border)' }}/>
          <img src={data.user.avatar_url} alt="" width={24} height={24}
            className="avatar-pulse"
            style={{ borderRadius:'50%', border:'2px solid var(--blue-bd)' }}/>
          <span style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{data.user.login}</span>
          {data.user.name && <span style={{ fontSize:13, color:'var(--text3)' }}>· {data.user.name}</span>}
          <div style={{ flex:1 }}/>
          <a href={`https://github.com/${data.user.login}`} target="_blank" rel="noreferrer"
            className="btn btn-secondary" style={{ fontSize:12, padding:'5px 12px', gap:5 }}>
            <svg width={13} height={13} viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            View on GitHub ↗
          </a>
          <button className="btn btn-ghost" style={{ fontSize:12 }}
            onClick={()=>{ setData(null); setAnalytics(null) }}>← New Search</button>
        </div>
      </nav>

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'24px 24px 56px' }}>

        {/* ── Profile card ────────────────────────────────────────────── */}
        <div className="card fade-up" style={{ padding:'22px 26px', marginBottom:18, overflow:'hidden', position:'relative' }}>
          {/* Subtle gradient top accent */}
          <div style={{ position:'absolute', top:0, left:0, right:0, height:3,
            background:'linear-gradient(90deg,#0969da,#1a7f37)', borderRadius:'var(--r-xl) var(--r-xl) 0 0' }}/>
          <div style={{ display:'flex', gap:20, alignItems:'flex-start', flexWrap:'wrap' }}>
            <div style={{ position:'relative' }}>
              <img src={data.user.avatar_url} alt="" width={76} height={76}
                className="avatar-pulse"
                style={{ borderRadius:'50%', border:'2px solid var(--border)', display:'block' }}/>
              <div style={{ position:'absolute', bottom:2, right:2, width:14, height:14,
                borderRadius:'50%', background:'var(--green)', border:'2px solid var(--bg)',
                animation:'pulse 2s infinite' }}/>
            </div>
            <div style={{ flex:1, minWidth:200 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:4 }}>
                <h1 style={{ fontSize:20, fontWeight:700, color:'var(--text)', letterSpacing:'-0.02em' }}>
                  {data.user.name || data.user.login}
                </h1>
                <span style={{ fontSize:14, color:'var(--text3)' }}>@{data.user.login}</span>
                {data.user.company && <span className="badge badge-neutral">{data.user.company}</span>}
                {data.user.location && (
                  <span style={{ fontSize:12, color:'var(--text3)', display:'flex', alignItems:'center', gap:3 }}>
                    📍 {data.user.location}
                  </span>
                )}
              </div>
              {data.user.bio && (
                <p style={{ fontSize:14, color:'var(--text2)', maxWidth:520, lineHeight:1.6, marginBottom:12 }}>
                  {data.user.bio}
                </p>
              )}
              <div style={{ display:'flex', gap:20, flexWrap:'wrap' }}>
                {[
                  ['⭐','Stars',    analytics.totalStars],
                  ['⑂', 'Forks',   analytics.totalForks],
                  ['📁','Repos',    data.user.public_repos],
                  ['👥','Followers',data.user.followers],
                  ['🗓️','Days',     analytics.accountAgeDays],
                ].map(([icon,label,val])=>(
                  <div key={label} style={{ display:'flex', alignItems:'center', gap:4, fontSize:13 }}>
                    <span style={{ fontSize:13 }}>{icon}</span>
                    <strong style={{ color:'var(--text)', letterSpacing:'-0.01em' }}>
                      {typeof val==='number'?val.toLocaleString():val}
                    </strong>
                    <span style={{ color:'var(--text3)' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <ScoreGauge score={analytics.score}/>
          </div>
        </div>

        {/* ── Stat cards ──────────────────────────────────────────────── */}
        <div className="stagger" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(155px,1fr))', gap:12, marginBottom:18 }}>
          <StatCard label="Total Stars"   value={analytics.totalStars.toLocaleString()} icon="⭐" accent="linear-gradient(90deg,#f6e05e,#ed8936)" delay=".04s"/>
          <StatCard label="Active Repos"  value={analytics.activeRepos} sub="updated in 90d" icon="📁" accent="linear-gradient(90deg,#48bb78,#38a169)" delay=".08s"/>
          <StatCard label="Top Language"  value={analytics.languages[0]?.name||'—'} icon="💻" color={LANG_COLORS[analytics.languages[0]?.name]||'var(--text)'} accent={`linear-gradient(90deg,${LANG_COLORS[analytics.languages[0]?.name]||'#ccc'},transparent)`} delay=".12s"/>
          <StatCard label="Predicted"     value={`+${analytics.predicted}`} sub="commits next week" icon="🔮" color="var(--blue)" accent="linear-gradient(90deg,#0969da,#58a6ff)" delay=".16s"/>
          <StatCard label="Followers"     value={data.user.followers.toLocaleString()} icon="👥" accent="linear-gradient(90deg,#6639ba,#a78bfa)" delay=".20s"/>
          <StatCard label="Total Forks"   value={analytics.totalForks.toLocaleString()} icon="⑂" accent="linear-gradient(90deg,#9a6700,#d4a72c)" delay=".24s"/>
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────── */}
        <div className="tab-bar fade-in" style={{ marginBottom:18, background:'var(--bg)',
          borderRadius:'var(--r-lg) var(--r-lg) 0 0', paddingInline:8, paddingTop:4 }}>
          {TABS.map(t=>(
            <button key={t.id} className={`tab-btn ${tab===t.id?'active':''}`} onClick={()=>setTab(t.id)}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ════════════════ OVERVIEW ════════════════ */}
        {tab==='overview' && (
          <div className="stagger" style={{ display:'grid', gap:14, gridTemplateColumns:'repeat(12,1fr)' }}>

            {/* Commit area chart */}
            <div className="fade-up" style={{ gridColumn:'span 8' }}>
              <Card title="Commit Activity" description="Last 12 weeks" accent="linear-gradient(90deg,#0969da55,transparent)">
                <ResponsiveContainer width="100%" height={170}>
                  <AreaChart data={analytics.commitTrend} margin={{ top:8, right:4, bottom:0, left:-24 }}>
                    <defs>
                      <linearGradient id="commitGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#0969da" stopOpacity=".2"/>
                        <stop offset="100%" stopColor="#0969da" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="week" tick={{ fill:'var(--text3)', fontSize:10 }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fill:'var(--text3)', fontSize:10 }} axisLine={false} tickLine={false}/>
                    <Tooltip content={<ChartTip/>}/>
                    <Area type="monotone" dataKey="commits" stroke="#0969da" strokeWidth={2.5}
                      fill="url(#commitGrad)" dot={false}
                      activeDot={{ r:5, fill:'#0969da', stroke:'#fff', strokeWidth:2 }}/>
                  </AreaChart>
                </ResponsiveContainer>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:6, fontSize:11, color:'var(--text3)' }}>
                  <span>12 weeks ago</span>
                  <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <span className="float-icon" style={{ animationDuration:'2s' }}>🔮</span>
                    Predicted: <strong style={{ color:'var(--green)' }}>+{analytics.predicted} commits</strong>
                  </span>
                  <span>this week</span>
                </div>
              </Card>
            </div>

            {/* Score breakdown */}
            <div className="fade-up" style={{ gridColumn:'span 4' }}>
              <Card title="Score Breakdown" description="5 weighted factors" accent="linear-gradient(90deg,#f6a62355,transparent)">
                {Object.entries(analytics.factors).map(([k,v],i)=>(
                  <BarRow key={k} label={k.charAt(0).toUpperCase()+k.slice(1)}
                    value={Math.round(v)} max={20} color="#0969da" delay={`${i*0.1}s`}/>
                ))}
              </Card>
            </div>

            {/* Language donut */}
            <div className="fade-up" style={{ gridColumn:'span 5' }}>
              <Card title="Language Distribution" accent="linear-gradient(90deg,#6639ba55,transparent)">
                {analytics.languages.length > 0
                  ? <DonutChart languages={analytics.languages}/>
                  : <p style={{ color:'var(--text3)', fontSize:13 }}>No language data available</p>}
              </Card>
            </div>

            {/* NLP Skill signals */}
            <div className="fade-up" style={{ gridColumn:'span 7' }}>
              <Card title="Skill Signals" description="Extracted from commit messages via NLP"
                accent="linear-gradient(90deg,#1a7f3755,transparent)">
                {analytics.skills.length === 0
                  ? <p style={{ color:'var(--text3)', fontSize:13 }}>No commit message data available</p>
                  : analytics.skills.map(([skill,count],i)=>(
                      <BarRow key={skill} label={skill} value={count}
                        max={analytics.skills[0][1]} color="#1a7f37" delay={`${i*0.08}s`}/>
                    ))
                }
              </Card>
            </div>

            {/* AI Insights */}
            <div className="fade-up" style={{ gridColumn:'span 12' }}>
              <Card title="AI Insights" description="Generated by Gemini AI — refreshed every 24 hours"
                accent="linear-gradient(90deg,#6639ba55,#0969da55,transparent)">
                {insightsLoading ? (
                  <div style={{ display:'flex', alignItems:'center', gap:12, color:'var(--text2)', fontSize:13, padding:'12px 0' }}>
                    <div style={{ position:'relative', width:20, height:20, flexShrink:0 }}>
                      <div style={{ position:'absolute', inset:0, border:'2px solid var(--bg3)',
                        borderTopColor:'var(--blue)', borderRadius:'50%', animation:'spin .7s linear infinite' }}/>
                      <div style={{ position:'absolute', inset:4, border:'1.5px solid var(--bg3)',
                        borderTopColor:'#1a7f37', borderRadius:'50%', animation:'spin 1s linear infinite reverse' }}/>
                    </div>
                    Generating insights with Gemini AI…
                  </div>
                ) : insights.length === 0 ? (
                  <div style={{ padding:'12px 14px', background:'var(--bg2)', border:'1px solid var(--border)',
                    borderRadius:'var(--r-md)', fontSize:13, color:'var(--text2)' }}>
                    Add <code style={{ background:'var(--bg3)', padding:'1px 6px', borderRadius:4, fontSize:12 }}>GEMINI_API_KEY</code> to{' '}
                    <code style={{ background:'var(--bg3)', padding:'1px 6px', borderRadius:4, fontSize:12 }}>.env.local</code> to enable AI insights.
                  </div>
                ) : (
                  <div className="stagger" style={{ display:'grid', gap:12, gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))' }}>
                    {insights.map((ins,i)=>{
                      const s = INSIGHT_CFG[ins.type]||INSIGHT_CFG.tip
                      return (
                        <div key={i} className="insight-card fade-up"
                          style={{ background:s.bg, border:`1px solid ${s.border}`,
                            borderRadius:'var(--r-lg)', padding:'16px 18px',
                            animationDelay:`${i*0.08}s` }}>
                          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                            <span className="float-icon" style={{ fontSize:16, animationDuration:'3s' }}>{s.icon}</span>
                            <span style={{ fontSize:11, fontWeight:700, color:s.dot,
                              textTransform:'uppercase', letterSpacing:'0.07em' }}>{s.label}</span>
                          </div>
                          <p style={{ fontWeight:600, fontSize:13, color:'var(--text)', marginBottom:5 }}>{ins.title}</p>
                          <p style={{ fontSize:12, color:'var(--text2)', lineHeight:1.65 }}>{ins.body}</p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            </div>

            {/* Contribution heatmap */}
            <div className="fade-up" style={{ gridColumn:'span 12' }}>
              <Card title="Contribution Heatmap" description="52 weeks of GitHub activity"
                accent="linear-gradient(90deg,#1a7f3755,transparent)">
                <Heatmap heatmap={analytics.heatmap}/>
              </Card>
            </div>
          </div>
        )}

        {/* ════════════════ REPOSITORIES ════════════════ */}
        {tab==='repositories' && (
          <div className="card fade-up" style={{ overflow:'hidden' }}>
            <div style={{ height:3, background:'linear-gradient(90deg,#0969da,#1a7f37)' }}/>
            <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)',
              display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <span style={{ fontWeight:600, fontSize:14 }}>{data.repos.length} repositories</span>
                <span style={{ fontSize:12, color:'var(--text3)', marginLeft:8 }}>sorted by last updated</span>
              </div>
              <div style={{ display:'flex', gap:6 }}>
                <span className="badge badge-green">
                  <span style={{ width:5, height:5, borderRadius:'50%', background:'currentColor', display:'inline-block' }}/>
                  {analytics.activeRepos} active
                </span>
                <span className="badge badge-amber">
                  {data.repos.filter(r=>{const a=(Date.now()-new Date(r.updated_at).getTime())/86400000;return a>=30&&a<90}).length} moderate
                </span>
                <span className="badge badge-red">
                  {data.repos.filter(r=>(Date.now()-new Date(r.updated_at).getTime())/86400000>=90).length} dormant
                </span>
              </div>
            </div>
            <div style={{ padding:'8px 14px' }}>
              {data.repos.slice(0,40).map((repo,i)=>(
                <div key={repo.id} className="repo-row fade-up"
                  style={{ padding:'10px 8px', display:'flex', alignItems:'center', gap:14,
                    flexWrap:'wrap', animationDelay:`${Math.min(i*0.02,0.4)}s`, borderLeft:'3px solid transparent',
                    transition:'background .12s, border-color .15s, padding-left .15s' }}
                  onMouseEnter={e=>{e.currentTarget.style.background='var(--bg2)';e.currentTarget.style.borderLeftColor='var(--blue)';e.currentTarget.style.paddingLeft='14px'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='';e.currentTarget.style.borderLeftColor='transparent';e.currentTarget.style.paddingLeft='8px'}}>
                  <div style={{ flex:1, minWidth:180 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:2 }}>
                      <a href={repo.html_url} target="_blank" rel="noreferrer"
                        style={{ fontWeight:600, fontSize:14, color:'var(--blue)' }}>{repo.name}</a>
                      <HealthBadge repo={repo}/>
                      {repo.fork && <span className="badge badge-neutral" style={{ fontSize:10 }}>Fork</span>}
                    </div>
                    {repo.description && (
                      <p style={{ fontSize:12, color:'var(--text2)', lineHeight:1.5 }}>
                        {repo.description.slice(0,90)}{repo.description.length>90?'…':''}
                      </p>
                    )}
                  </div>
                  <div style={{ display:'flex', gap:14, fontSize:12, color:'var(--text3)', flexWrap:'wrap', alignItems:'center' }}>
                    {repo.language && (
                      <span style={{ display:'flex', alignItems:'center', gap:5 }}>
                        <div style={{ width:10, height:10, borderRadius:'50%',
                          background:LANG_COLORS[repo.language]||'var(--text3)',
                          boxShadow:`0 0 6px ${LANG_COLORS[repo.language]||'transparent'}88` }}/>
                        <span style={{ color:'var(--text2)' }}>{repo.language}</span>
                      </span>
                    )}
                    <span>⭐ {repo.stargazers_count}</span>
                    <span>⑂ {repo.forks_count}</span>
                    <span>{Math.round((Date.now()-new Date(repo.updated_at).getTime())/86400000)}d ago</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════ ACTIVITY ════════════════ */}
        {tab==='activity' && (
          <div className="stagger" style={{ display:'grid', gap:14, gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))' }}>
            <Card title="Event Breakdown" description="Last 100 public events"
              accent="linear-gradient(90deg,#6639ba55,transparent)">
              {Object.entries(analytics.eventCounts).sort((a,b)=>b[1]-a[1]).map(([type,count],i)=>(
                <BarRow key={type} label={type.replace('Event','')} value={count}
                  max={Math.max(...Object.values(analytics.eventCounts))} color="#6639ba" delay={`${i*0.06}s`}/>
              ))}
            </Card>
            <Card title="Weekly Commits" accent="linear-gradient(90deg,#0969da55,transparent)">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={analytics.commitTrend} margin={{ top:4, right:4, bottom:0, left:-24 }}>
                  <XAxis dataKey="week" tick={{ fill:'var(--text3)', fontSize:9 }} axisLine={false} tickLine={false}/>
                  <YAxis tick={{ fill:'var(--text3)', fontSize:9 }} axisLine={false} tickLine={false}/>
                  <Tooltip content={<ChartTip/>}/>
                  <Bar dataKey="commits" radius={[4,4,0,0]}>
                    {analytics.commitTrend.map((d,i)=>(
                      <Cell key={i} fill="#0969da"
                        opacity={d.commits > 0 ? 0.6 + (i / analytics.commitTrend.length) * 0.4 : 0.2}/>
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card title="Recent Events" description="Live activity feed"
              accent="linear-gradient(90deg,#1a7f3755,transparent)">
              <div style={{ maxHeight:340, overflowY:'auto' }}>
                {data.events.slice(0,30).map((ev,i)=>{
                  const icons={PushEvent:'📤',PullRequestEvent:'🔀',IssuesEvent:'🐛',CreateEvent:'✨',WatchEvent:'⭐',ForkEvent:'⑂',DeleteEvent:'🗑️'}
                  return (
                    <div key={i} className="fade-in"
                      style={{ display:'flex', gap:10, padding:'7px 0',
                        borderBottom:i<29?'1px solid var(--border)':'none', fontSize:12,
                        animationDelay:`${Math.min(i*0.03,0.5)}s` }}>
                      <span style={{ fontSize:14, flexShrink:0 }}>{icons[ev.type]||'•'}</span>
                      <div>
                        <span style={{ color:'var(--text2)' }}>{ev.type?.replace('Event','')} </span>
                        <a href={`https://github.com/${ev.repo?.name}`} target="_blank" rel="noreferrer"
                          style={{ color:'var(--blue)', fontWeight:500 }}>
                          {ev.repo?.name?.split('/')[1]||ev.repo?.name}
                        </a>
                        <div style={{ color:'var(--text3)', fontSize:11, marginTop:1 }}>
                          {new Date(ev.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        )}

        {/* ════════════════ COMPARE ════════════════ */}
        {tab==='compare' && (
          <div>
            {!cData ? (
              <div className="card fade-up" style={{ padding:'56px', textAlign:'center' }}>
                <div style={{ fontSize:40, marginBottom:14, opacity:.3 }}>⇄</div>
                <p style={{ fontWeight:600, fontSize:16, marginBottom:8 }}>No comparison user</p>
                <p style={{ color:'var(--text3)', fontSize:13, marginBottom:20 }}>
                  Enter a second username in the search bar and re-analyze
                </p>
                <button className="btn btn-secondary" onClick={()=>{ setData(null); setAnalytics(null) }}>
                  ← Back to Search
                </button>
              </div>
            ) : (
              <div style={{ display:'grid', gap:14 }}>
                <div style={{ display:'grid', gap:14, gridTemplateColumns:'1fr 1fr' }}>
                  {[[data.user,analytics,'#0969da'],[cData.user,cAnalytics,'#1a7f37']].map(([u,an,color])=>(
                    <div key={u.login} className="card fade-up" style={{ padding:'22px', overflow:'hidden', position:'relative' }}>
                      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:color }}/>
                      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:18 }}>
                        <img src={u.avatar_url} alt="" width={48} height={48}
                          style={{ borderRadius:'50%', border:`2px solid ${color}` }}/>
                        <div>
                          <p style={{ fontWeight:700, fontSize:16 }}>{u.login}</p>
                          {u.name && <p style={{ fontSize:12, color:'var(--text3)' }}>{u.name}</p>}
                        </div>
                        <div style={{ marginLeft:'auto' }}><ScoreGauge score={an.score}/></div>
                      </div>
                      {[
                        ['Total Stars',       an.totalStars.toLocaleString()],
                        ['Total Forks',       an.totalForks.toLocaleString()],
                        ['Public Repos',      u.public_repos],
                        ['Followers',         u.followers.toLocaleString()],
                        ['Active Repos',      an.activeRepos],
                        ['Predicted Commits', `+${an.predicted}`],
                        ['Top Language',      an.languages[0]?.name||'—'],
                      ].map(([label,val])=>(
                        <div key={label} style={{ display:'flex', justifyContent:'space-between',
                          padding:'6px 0', borderBottom:'1px solid var(--border)', fontSize:13 }}>
                          <span style={{ color:'var(--text2)' }}>{label}</span>
                          <span style={{ fontWeight:600, color }}>{val}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
                <Card title="Head-to-Head Comparison" description="Productivity factor breakdown"
                  accent="linear-gradient(90deg,#0969da44,#1a7f3744,transparent)">
                  {Object.keys(analytics.factors).map(key=>{
                    const a=analytics.factors[key], b=cAnalytics.factors[key], total=a+b||1
                    return (
                      <div key={key} style={{ marginBottom:14 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, marginBottom:5 }}>
                          <span style={{ color:'#0969da', fontWeight:600 }}>{a.toFixed(0)}</span>
                          <span style={{ color:'var(--text2)', textTransform:'capitalize', fontWeight:500 }}>{key}</span>
                          <span style={{ color:'#1a7f37', fontWeight:600 }}>{b.toFixed(0)}</span>
                        </div>
                        <div style={{ height:10, borderRadius:5, overflow:'hidden', display:'flex', background:'var(--bg3)' }}>
                          <div className="compare-fill" style={{ width:`${(a/total)*100}%`,
                            background:'linear-gradient(90deg,#0969da,#58a6ff)' }}/>
                          <div className="compare-fill" style={{ width:`${(b/total)*100}%`,
                            background:'linear-gradient(90deg,#1a7f37,#4ade80)' }}/>
                        </div>
                      </div>
                    )
                  })}
                </Card>
              </div>
            )}
          </div>
        )}

        {/* ════════════════ CHATBOT ════════════════ */}
        {tab==='chatbot' && (
          <div className="fade-up">
            <ChatPanel data={data} analytics={analytics}
              chatMsgs={chatMsgs} setChatMsgs={setChatMsgs}
              chatInput={chatInput} setChatInput={setChatInput}
              chatLoading={chatLoading} sendChat={sendChat}
              chatEndRef={chatEndRef}/>
          </div>
        )}

      </div>
    </div>
  )
}

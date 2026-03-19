import { useEffect, useState } from 'react'

const TYPED_WORDS = ['aarushyjain', 'torvalds', 'gaearon', 'sindresorhus']

export default function LandingHero({ username, setUsername, compareUsername, setCompareUsername, onSearch, loading, step, error, trending={recent:[]} }) {
  const [typedIdx, setTypedIdx] = useState(0)
  const [typedChar, setTypedChar] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const [showCursor, setShowCursor] = useState(true)
  const current = TYPED_WORDS[typedIdx]

  // Typewriter effect on placeholder — visual only, doesn't set input value
  useEffect(() => {
    const speed = deleting ? 60 : 100
    const pause = !deleting && typedChar === current.length ? 1600
                : deleting && typedChar === 0 ? 400 : speed
    const t = setTimeout(() => {
      if (!deleting && typedChar < current.length) {
        setTypedChar(c => c + 1)
      } else if (!deleting && typedChar === current.length) {
        setDeleting(true)
      } else if (deleting && typedChar > 0) {
        setTypedChar(c => c - 1)
      } else {
        setDeleting(false)
        setTypedIdx(i => (i + 1) % TYPED_WORDS.length)
      }
    }, pause)
    return () => clearTimeout(t)
  }, [typedChar, deleting, current])

  // Cursor blink
  useEffect(() => {
    const t = setInterval(() => setShowCursor(c => !c), 530)
    return () => clearInterval(t)
  }, [])

  const placeholder = current.slice(0, typedChar) + (showCursor ? '|' : ' ')

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', padding:'48px 20px', background:'var(--bg)', position:'relative', overflow:'hidden' }}>

      {/* Subtle dot grid background */}
      <div style={{ position:'absolute', inset:0, zIndex:0, pointerEvents:'none',
        backgroundImage:'radial-gradient(circle, #d0d7de 1px, transparent 1px)',
        backgroundSize:'24px 24px',
        maskImage:'radial-gradient(ellipse 80% 80% at 50% 0%, black 20%, transparent 80%)',
        opacity:.5 }}/>

      {/* Soft top glow */}
      <div style={{ position:'absolute', top:-120, left:'50%', transform:'translateX(-50%)',
        width:600, height:300, borderRadius:'50%',
        background:'radial-gradient(ellipse, rgba(9,105,218,0.08) 0%, transparent 70%)',
        pointerEvents:'none', zIndex:0 }}/>

      <div style={{ position:'relative', zIndex:1, width:'100%', maxWidth:480, display:'flex', flexDirection:'column', alignItems:'center' }}>

        {/* Logo */}
        <div className="fade-up" style={{ display:'flex', alignItems:'center', gap:10, marginBottom:36 }}>
          <div className="nav-logo" style={{ width:36, height:36, borderRadius:10,
            background:'linear-gradient(135deg,#1f2328,#32383f)',
            display:'flex', alignItems:'center', justifyContent:'center',
            boxShadow:'0 2px 8px rgba(31,35,40,.2)', cursor:'default' }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="#fff">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
          </div>
          <span style={{ fontSize:18, fontWeight:700, color:'var(--text)', letterSpacing:'-0.02em' }}>GitAnalytics</span>
          <span className="badge badge-blue pop-in" style={{ fontSize:10, animationDelay:'.3s' }}>AI Powered</span>
        </div>

        {/* Headline */}
        <div className="fade-up" style={{ textAlign:'center', marginBottom:36, animationDelay:'0.06s' }}>
          <h1 style={{ fontSize:'clamp(26px,5vw,44px)', fontWeight:700, color:'var(--text)',
            letterSpacing:'-0.03em', lineHeight:1.1, marginBottom:12 }}>
            GitHub Developer
            <span style={{ display:'block', background:'linear-gradient(135deg,#0969da,#1a7f37)',
              WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
              backgroundClip:'text' }}> Analytics Platform</span>
          </h1>
          <p style={{ fontSize:15, color:'var(--text2)', maxWidth:380, margin:'0 auto', lineHeight:1.65 }}>
            AI-powered insights, productivity scoring, skill analysis, and a smart chatbot for any GitHub profile.
          </p>
        </div>

        {/* Stats ticker */}
        <div className="fade-up" style={{ display:'flex', gap:20, marginBottom:28, animationDelay:'0.09s' }}>
          {[['📊','Analytics'],['🤖','AI Insights'],['💬','Smart Chat'],['⚡','NLP Skills']].map(([icon,label])=>(
            <div key={label} style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'var(--text2)' }}>
              <span className="float-icon" style={{ animationDelay:`${Math.random()*2}s` }}>{icon}</span>
              {label}
            </div>
          ))}
        </div>

        {/* Search card */}
        <div className="fade-up card" style={{ width:'100%', padding:22,
          boxShadow:'0 8px 32px rgba(31,35,40,.12)', animationDelay:'0.12s' }}>
          {/* Animated top border */}
          <div style={{ height:3, margin:'-22px -22px 18px', borderRadius:'var(--r-xl) var(--r-xl) 0 0',
            background:'linear-gradient(90deg,#0969da,#1a7f37,#0969da)',
            backgroundSize:'200% 100%', animation:'gradMove 3s ease infinite' }}/>

          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:500, color:'var(--text2)', display:'block', marginBottom:5 }}>
                GitHub username
              </label>
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)',
                  color:'var(--text3)', fontSize:14, pointerEvents:'none' }}>@</span>
                <input className="input" value={username} onChange={e=>setUsername(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&onSearch()}
                  placeholder={placeholder}
                  style={{ paddingLeft:26, fontFamily:'var(--font)' }}/>
              </div>
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:500, color:'var(--text2)', display:'block', marginBottom:5 }}>
                Compare with <span style={{ fontWeight:400, color:'var(--text3)' }}>(optional)</span>
              </label>
              <input className="input" value={compareUsername} onChange={e=>setCompareUsername(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&onSearch()} placeholder="another username"/>
            </div>
            <button className="btn btn-primary" onClick={onSearch} disabled={loading}
              style={{ width:'100%', justifyContent:'center', padding:'10px', fontSize:14, position:'relative', overflow:'hidden' }}>
              {loading ? (
                <>
                  <span style={{ width:14, height:14, border:'2px solid rgba(255,255,255,.3)',
                    borderTopColor:'#fff', borderRadius:'50%', display:'inline-block',
                    animation:'spin .7s linear infinite' }}/>
                  {step||'Analyzing…'}
                </>
              ) : (
                <>
                  <span className="float-icon" style={{ animationDuration:'2s' }}>🔍</span>
                  Analyze Profile
                </>
              )}
            </button>
          </div>

          {error && (
            <div style={{ marginTop:12, padding:'9px 12px', borderRadius:'var(--r-md)',
              background:'var(--red-bg)', border:'1px solid var(--red-bd)', color:'var(--red)', fontSize:13 }}>
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Sample profiles */}
        <div className="fade-up" style={{ marginTop:18, textAlign:'center', animationDelay:'0.18s' }}>
          <p style={{ fontSize:11, color:'var(--text3)', marginBottom:8, fontWeight:500 }}>Try a sample profile</p>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', justifyContent:'center' }}>
            {['torvalds','gaearon','sindresorhus','aarushyjain'].map((u,i)=>(
              <button key={u} className="chip pop-in" onClick={()=>setUsername(u)}
                style={{ animationDelay:`${0.2+i*0.05}s` }}>
                @{u}
              </button>
            ))}
          </div>
        </div>

        {/* Recent from DB */}
        {trending.recent?.length > 0 && (
          <div className="fade-up" style={{ marginTop:24, width:'100%', animationDelay:'0.22s' }}>
            <p style={{ fontSize:11, fontWeight:600, color:'var(--text3)', textTransform:'uppercase',
              letterSpacing:'0.06em', marginBottom:10 }}>Recently analyzed</p>
            <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
              {trending.recent.map((p,i)=>(
                <button key={p.username} onClick={()=>setUsername(p.username)}
                  className="pop-in"
                  style={{ display:'flex', alignItems:'center', gap:7, padding:'5px 11px',
                    borderRadius:20, border:'1px solid var(--border)', background:'var(--bg)',
                    cursor:'pointer', fontSize:12, color:'var(--text2)', fontFamily:'var(--font)',
                    transition:'all .15s', animationDelay:`${0.24+i*0.04}s` }}
                  onMouseEnter={e=>{e.currentTarget.style.background='var(--bg2)';e.currentTarget.style.borderColor='var(--border2)'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='var(--bg)';e.currentTarget.style.borderColor='var(--border)'}}>
                  <img src={p.avatar_url} alt="" width={18} height={18} style={{ borderRadius:'50%' }}/>
                  {p.username}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Feature badges */}
        <div className="fade-up stagger" style={{ display:'flex', gap:6, flexWrap:'wrap',
          justifyContent:'center', marginTop:28, animationDelay:'0.26s' }}>
          {[['✨','AI Insights'],['🧠','NLP Skills'],['📊','Analytics'],['⇄','Compare'],['💬','Smart Chat'],['⚡','Live Data']].map
          (([icon,label])=>(
            <span key={label} className="badge badge-neutral">
              <span>{icon}</span> {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

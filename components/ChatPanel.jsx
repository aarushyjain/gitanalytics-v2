import { useRef } from 'react'

const CATEGORIES = [
  { label:'Skills', chips:[
    {icon:'⚡', text:'What are their strongest technical skills?'},
    {icon:'🔍', text:'What is their primary tech stack?'},
    {icon:'📊', text:'Break down their commit skill signals'},
    {icon:'🌐', text:'What languages do they specialise in?'},
  ]},
  { label:'Career', chips:[
    {icon:'📄', text:'Write a recruiter bio for this developer'},
    {icon:'💼', text:'What jobs would suit them best?'},
    {icon:'🏆', text:'Rate their GitHub profile for hiring (out of 10)'},
    {icon:'📝', text:'Write 3 resume bullet points for them'},
  ]},
  { label:'Productivity', chips:[
    {icon:'📈', text:'How active have they been in the last 3 months?'},
    {icon:'🔮', text:'Predict their activity for the next month'},
    {icon:'⚠️', text:'What are their biggest productivity gaps?'},
    {icon:'✅', text:'What are they doing really well?'},
  ]},
  { label:'Growth', chips:[
    {icon:'📚', text:'What should they learn next?'},
    {icon:'🚀', text:'How can they increase their GitHub visibility?'},
    {icon:'🛠️', text:'What open source project ideas suit them?'},
    {icon:'🎯', text:'Compare them to a senior developer'},
  ]},
]

const FOLLOWUPS = [
  'Elaborate further',
  'Give me bullet points',
  'Specific action steps',
  'Back it up with numbers',
]

export default function ChatPanel({ data, analytics, chatMsgs, setChatMsgs, chatInput, setChatInput, chatLoading, sendChat, chatEndRef }) {
  const inputRef = useRef(null)

  function fire(text) {
    setChatInput(text)
    setTimeout(() => sendChat(text), 30)
  }

  const lastIsAI = chatMsgs.length > 0 && chatMsgs[chatMsgs.length-1].role === 'assistant' && !chatLoading

  return (
    <div style={{ display:'grid', gridTemplateColumns:'240px 1fr', gap:16, alignItems:'start' }}>

      {/* ── Left panel ─────────────────────────────────────────────── */}
      <div style={{ display:'flex', flexDirection:'column', gap:10, position:'sticky', top:68 }}>

        {/* Mini profile card */}
        <div className="card" style={{ padding:'14px 16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
            <img src={data.user.avatar_url} alt="" width={34} height={34}
              style={{ borderRadius:'50%', border:'1px solid var(--border)' }}/>
            <div>
              <p style={{ fontWeight:600, fontSize:13 }}>{data.user.login}</p>
              <p style={{ fontSize:11, color:'var(--text3)' }}>
                Score: <strong style={{ color: analytics.score>=70?'var(--green)':analytics.score>=40?'var(--amber)':'var(--red)' }}>
                  {analytics.score}/100
                </strong>
              </p>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
            {[['Stars',analytics.totalStars],['Repos',data.user.public_repos],['Active',analytics.activeRepos],['Next wk',`+${analytics.predicted}`]].map(([l,v])=>(
              <div key={l} style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r-md)', padding:'7px 9px' }}>
                <p style={{ fontSize:10, color:'var(--text3)', fontWeight:500, marginBottom:2 }}>{l}</p>
                <p style={{ fontSize:14, fontWeight:700, color:'var(--text)', letterSpacing:'-0.02em' }}>{typeof v==='number'?v.toLocaleString():v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Chip categories */}
        {CATEGORIES.map((cat,ci)=>(
          <div key={ci} className="card" style={{ padding:'12px 14px' }}>
            <p style={{ fontSize:11, fontWeight:600, color:'var(--text2)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.05em' }}>{cat.label}</p>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              {cat.chips.map((chip,idx)=>(
                <button key={idx} onClick={()=>fire(chip.text)} disabled={chatLoading}
                  style={{ display:'flex', alignItems:'flex-start', gap:7, padding:'7px 9px', borderRadius:'var(--r-md)', border:'1px solid var(--border)', background:'var(--bg)', color:'var(--text2)', fontSize:12, textAlign:'left', cursor:chatLoading?'not-allowed':'pointer', transition:'all .12s', lineHeight:1.4, fontFamily:'var(--font)', opacity:chatLoading?.5:1, width:'100%' }}
                  onMouseEnter={e=>{if(!chatLoading){e.currentTarget.style.background='var(--bg2)';e.currentTarget.style.borderColor='var(--border2)';e.currentTarget.style.color='var(--text)'}}}
                  onMouseLeave={e=>{e.currentTarget.style.background='var(--bg)';e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text2)'}}>
                  <span style={{ flexShrink:0 }}>{chip.icon}</span>
                  <span>{chip.text}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* ── Right chat window ──────────────────────────────────────── */}
      <div className="card" style={{ display:'flex', flexDirection:'column', minHeight:580, overflow:'hidden' }}>

        {/* Header */}
        <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:'var(--green)', animation:'pulse 2s infinite' }}/>
          <span style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>
            AI Chat
          </span>
          <span style={{ fontSize:12, color:'var(--text3)' }}>
            — asking about <a href={`https://github.com/${data.user.login}`} target="_blank" rel="noreferrer" style={{ color:'var(--blue)' }}>@{data.user.login}</a>
          </span>
          <span style={{ marginLeft:'auto', fontSize:11, color:'var(--text3)' }}>Powered by Claude</span>
          {chatMsgs.length>0&&(
            <button onClick={()=>setChatMsgs([])} className="btn btn-ghost" style={{ fontSize:11, padding:'3px 8px' }}>Clear</button>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:14 }}>

          {chatMsgs.length===0 && (
            <div style={{ textAlign:'center', padding:'40px 16px', color:'var(--text3)' }}>
              <div style={{ fontSize:28, marginBottom:12 }}>💬</div>
              <p style={{ fontWeight:600, fontSize:14, color:'var(--text2)', marginBottom:6 }}>
                Ask me about <span style={{ color:'var(--blue)' }}>@{data.user.login}</span>
              </p>
              <p style={{ fontSize:13, lineHeight:1.6 }}>
                Pick a question from the left panel, or type your own.
                <br/>I have full access to their GitHub data.
              </p>
            </div>
          )}

          {chatMsgs.map((msg,i)=>(
            <div key={i} className="fade-in" style={{ display:'flex', flexDirection:'column', alignItems:msg.role==='user'?'flex-end':'flex-start', gap:4 }}>
              <span style={{ fontSize:11, color:'var(--text3)', paddingInline:4 }}>
                {msg.role==='user' ? 'You' : '🤖 GitAnalytics AI'}
              </span>
              <div className={msg.role==='user'?'bubble-user':'bubble-ai'} style={{ maxWidth:'80%' }}>
                {msg.content}
              </div>
            </div>
          ))}

          {chatLoading && (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', gap:4 }}>
              <span style={{ fontSize:11, color:'var(--text3)', paddingInline:4 }}>🤖 GitAnalytics AI</span>
              <div className="bubble-ai" style={{ maxWidth:80 }}>
                <div style={{ display:'flex', gap:4 }}>
                  {[0,1,2].map(i=>(
                    <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'var(--text3)', animation:`chatDot .9s ease-in-out ${i*.18}s infinite` }}/>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Follow-up chips */}
          {lastIsAI && (
            <div className="fade-in" style={{ display:'flex', gap:6, flexWrap:'wrap', paddingTop:4 }}>
              <span style={{ width:'100%', fontSize:11, color:'var(--text3)' }}>Follow up:</span>
              {FOLLOWUPS.map((t,i)=>(
                <button key={i} className="chip" style={{ fontSize:11 }} onClick={()=>fire(t)}>{t}</button>
              ))}
            </div>
          )}

          <div ref={chatEndRef}/>
        </div>

        {/* Input */}
        <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', display:'flex', gap:8 }}>
          <input ref={inputRef} className="input" value={chatInput}
            onChange={e=>setChatInput(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&sendChat()}
            placeholder={chatLoading?'Thinking…':`Ask about @${data.user.login}…`}
            disabled={chatLoading} style={{ flex:1 }}/>
          <button className="btn btn-primary" onClick={()=>sendChat()} disabled={chatLoading||!chatInput.trim()}
            style={{ flexShrink:0, padding:'8px 16px' }}>
            {chatLoading
              ? <span style={{ width:13, height:13, border:'2px solid rgba(255,255,255,.3)', borderTopColor:'#fff', borderRadius:'50%', display:'inline-block', animation:'spin .7s linear infinite' }}/>
              : 'Send'
            }
          </button>
        </div>
      </div>
    </div>
  )
}

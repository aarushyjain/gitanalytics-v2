export default function Card({ title, description, action, children, pad='18px 20px', style={}, accent }) {
  return (
    <div className="card" style={{ ...style, overflow:'hidden' }}>
      {accent && (
        <div style={{ height:3, background:accent,
          backgroundSize:'200% 100%', animation:'gradMove 3s ease infinite' }}/>
      )}
      {(title||action) && (
        <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)',
          display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <div>
            <p style={{ fontWeight:600, fontSize:14, color:'var(--text)' }}>{title}</p>
            {description && <p style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{description}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div style={{ padding: pad }}>{children}</div>
    </div>
  )
}

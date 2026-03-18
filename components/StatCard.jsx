export default function StatCard({ label, value, sub, icon, color, delay = '0s', accent }) {
  return (
    <div className="stat-card fade-up" style={{ animationDelay: delay, position:'relative', overflow:'hidden' }}>
      {/* Top accent line */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2,
        background: accent || 'transparent',
        borderRadius:'var(--r-xl) var(--r-xl) 0 0' }}/>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <span style={{ fontSize:12, fontWeight:500, color:'var(--text2)' }}>{label}</span>
        {icon && (
          <div style={{ width:28, height:28, borderRadius:'var(--r-md)', background:'var(--bg2)',
            border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:14, flexShrink:0 }} className="float-icon">
            {icon}
          </div>
        )}
      </div>
      <div className="stat-num" style={{ fontSize:24, fontWeight:700, color: color||'var(--text)',
        letterSpacing:'-0.02em', lineHeight:1, animationDelay: delay }}>
        {value}
      </div>
      {sub && <div style={{ fontSize:11, color:'var(--text3)', marginTop:5 }}>{sub}</div>}
    </div>
  )
}

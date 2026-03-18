export default function Heatmap({ heatmap }) {
  const today = new Date()
  const cells = []
  for (let i = 363; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    cells.push({ key, count: heatmap[key] || 0 })
  }
  const max = Math.max(...cells.map(c => c.count), 1)
  const color = n => {
    if (!n) return '#ebedf0'
    const t = n / max
    if (t < 0.25) return '#9be9a8'
    if (t < 0.5)  return '#40c463'
    if (t < 0.75) return '#30a14e'
    return '#216e39'
  }
  const weeks = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return (
    <div style={{ overflowX:'auto' }}>
      <div style={{ display:'inline-flex', gap:3, alignItems:'flex-start' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:2, paddingTop:20, marginRight:4 }}>
          {[['Mon',0],['Wed',13],['Fri',26]].map(([l,mt])=>(
            <div key={l} style={{ height:11, fontSize:9, color:'var(--text3)', lineHeight:'11px', marginTop:mt }}>{l}</div>
          ))}
        </div>
        <div>
          <div style={{ display:'flex', gap:3, marginBottom:4, height:14 }}>
            {weeks.map((w,wi)=>{
              const d = new Date(w[0].key)
              return <div key={wi} style={{ width:11, fontSize:9, color:'var(--text3)', whiteSpace:'nowrap', overflow:'visible' }}>
                {d.getDate()<=7 ? months[d.getMonth()] : ''}
              </div>
            })}
          </div>
          <div style={{ display:'flex', gap:3 }}>
            {weeks.map((week,wi)=>(
              <div key={wi} style={{ display:'flex', flexDirection:'column', gap:3 }}>
                {week.map(cell=>(
                  <div key={cell.key} className="heat-cell tooltip"
                    style={{ width:11, height:11, borderRadius:2, background:color(cell.count), border:'1px solid rgba(27,31,36,0.06)' }}>
                    <div className="tt">{cell.key}: {cell.count}</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:8, justifyContent:'flex-end' }}>
        <span style={{ fontSize:10, color:'var(--text3)' }}>Less</span>
        {['#ebedf0','#9be9a8','#40c463','#30a14e','#216e39'].map((c,i)=>(
          <div key={i} style={{ width:11, height:11, borderRadius:2, background:c, border:'1px solid rgba(27,31,36,0.06)' }}/>
        ))}
        <span style={{ fontSize:10, color:'var(--text3)' }}>More</span>
      </div>
    </div>
  )
}

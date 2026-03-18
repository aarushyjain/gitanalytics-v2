import { LANG_COLORS } from '../lib/analytics'
export default function DonutChart({ languages }) {
  const size=148, cx=74, cy=74, r=54, ir=35
  let angle=-90
  const slices = languages.map(lang=>{
    const sweep=(parseFloat(lang.pct)/100)*360
    const start=angle; angle+=sweep
    const rad=d=>(d*Math.PI)/180
    const x1=cx+r*Math.cos(rad(start)), y1=cy+r*Math.sin(rad(start))
    const x2=cx+r*Math.cos(rad(start+sweep)), y2=cy+r*Math.sin(rad(start+sweep))
    const ix1=cx+ir*Math.cos(rad(start)), iy1=cy+ir*Math.sin(rad(start))
    const ix2=cx+ir*Math.cos(rad(start+sweep)), iy2=cy+ir*Math.sin(rad(start+sweep))
    const lg=sweep>180?1:0
    return {...lang, color:LANG_COLORS[lang.name]||'#afb8c1',
      d:`M${x1},${y1} A${r},${r} 0 ${lg},1 ${x2},${y2} L${ix2},${iy2} A${ir},${ir} 0 ${lg},0 ${ix1},${iy1} Z`}
  })
  return (
    <div style={{ display:'flex', alignItems:'center', gap:20 }}>
      <svg width={size} height={size} style={{ flexShrink:0 }}>
        {slices.map((s,i)=><path key={i} d={s.d} fill={s.color}><title>{s.name}: {s.pct}%</title></path>)}
        <circle cx={cx} cy={cy} r={ir-1} fill="var(--bg)"/>
        <text x={cx} y={cx} textAnchor="middle" dominantBaseline="central"
          fontSize="13" fontWeight="600" fill="var(--text)" fontFamily="Inter,sans-serif">
          {slices.length} langs
        </text>
      </svg>
      <div style={{ flex:1, display:'flex', flexDirection:'column', gap:7 }}>
        {slices.slice(0,7).map((s,i)=>(
          <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:10, height:10, borderRadius:2, background:s.color, flexShrink:0 }}/>
            <span style={{ flex:1, fontSize:12, color:'var(--text2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.name}</span>
            <span style={{ fontWeight:600, fontSize:12, color:'var(--text)', fontVariantNumeric:'tabular-nums' }}>{s.pct}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

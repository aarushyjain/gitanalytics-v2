export default function ScoreGauge({ score }) {
  const r = 42, cx = 52, cy = 52
  const circ = Math.PI * r
  const dash  = (score / 100) * circ
  const color = score >= 70 ? '#1a7f37' : score >= 40 ? '#9a6700' : '#cf222e'
  const label = score >= 70 ? 'Excellent' : score >= 40 ? 'Good' : 'Needs work'
  const badgeCls = score >= 70 ? 'badge-green' : score >= 40 ? 'badge-amber' : 'badge-red'

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
      <svg width={104} height={68} viewBox="0 0 104 68">
        {/* Background track */}
        <path d={`M${cx-r},${cy} A${r},${r} 0 0,1 ${cx+r},${cy}`}
          fill="none" stroke="var(--bg3)" strokeWidth="8" strokeLinecap="round"/>
        {/* Animated fill arc */}
        <path d={`M${cx-r},${cy} A${r},${r} 0 0,1 ${cx+r},${cy}`}
          fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={circ - dash}
          style={{ transition:'stroke-dashoffset 1.2s cubic-bezier(.16,1,.3,1)', filter:`drop-shadow(0 0 4px ${color}66)` }}/>
        {/* Score number */}
        <text x={cx} y={cx-2} textAnchor="middle" fontSize="22" fontWeight="700"
          fill="var(--text)" fontFamily="Inter,sans-serif"
          style={{ animation:'countUp .5s cubic-bezier(.16,1,.3,1) .5s both' }}>{score}</text>
        <text x={cx} y={cx+14} textAnchor="middle" fontSize="9"
          fill="var(--text3)" fontFamily="Inter,sans-serif">/100</text>
      </svg>
      <span className={`badge ${badgeCls}`} style={{ animation:'popIn .4s cubic-bezier(.16,1,.3,1) .6s both' }}>
        {label}
      </span>
    </div>
  )
}

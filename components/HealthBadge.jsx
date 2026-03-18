export default function HealthBadge({ repo }) {
  const age = (Date.now() - new Date(repo.updated_at).getTime()) / 86400000
  const [label, cls] = age < 30 ? ['Active','badge-green'] : age < 90 ? ['Moderate','badge-amber'] : ['Dormant','badge-red']
  return <span className={`badge ${cls}`}><span style={{ width:5, height:5, borderRadius:'50%', background:'currentColor', display:'inline-block' }}/>{label}</span>
}

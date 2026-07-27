export type DonutSegment = {
  label: string
  value: number
  /** CSS color value, e.g. "var(--role-paje)" */
  color: string
}

export default function DonutChart({
  segments,
  centerValue,
  centerLabel,
}: {
  segments: DonutSegment[]
  centerValue?: string
  centerLabel?: string
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0)
  let acc = 0
  const stops = segments
    .filter((s) => s.value > 0)
    .map((s) => {
      const start = (acc / total) * 360
      acc += s.value
      const end = (acc / total) * 360
      return `${s.color} ${start}deg ${end}deg`
    })
    .join(', ')

  return (
    <div className="donut-chart-wrap">
      <div
        className="donut-chart"
        style={{ background: total ? `conic-gradient(${stops})` : 'var(--border)' }}
      >
        <div className="donut-chart-hole">
          {centerValue !== undefined && <span className="donut-chart-value">{centerValue}</span>}
          {centerLabel && <span className="donut-chart-label">{centerLabel}</span>}
        </div>
      </div>
      <ul className="donut-legend">
        {segments.map((s) => (
          <li key={s.label}>
            <span className="donut-legend-dot" style={{ background: s.color }} />
            <span className="donut-legend-text">{s.label}</span>
            <span className="donut-legend-value">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

import type {ReactNode} from 'react'
import type {AreaPage} from '@/types/area'

const W = 900
const r1 = (value: number) => Math.round(value * 10) / 10
const DISTRICT_FILLS = ['#223D9059', '#223D9038', '#66B14329', '#223D902E', '#66B1431F', '#FFFFFF0D']

/** Schematic dark map from the area's map data: streets, districts, water, parks, landmarks and permit blocks. */
export function DistrictMap({page}: {page: AreaPage}) {
  const map = page.map
  const frame = map?.bbox || page.bbox
  if (!map || !frame) return null
  const H = Math.round(map.height || 640)
  const {north: N, south: S, west: Wl, east: E} = frame
  const xy = (lat: number, lon: number): [number, number] => [r1(((lon - Wl) / (E - Wl)) * W), r1(((N - lat) / (N - S)) * H)]
  const out: ReactNode[] = []
  let k = 0
  const key = () => k++

  for (let x = 60; x < W; x += 60) out.push(<line key={key()} x1={x} y1={0} x2={x} y2={H} className="mp-grid" />)
  for (let y = 60; y < H; y += 60) out.push(<line key={key()} x1={0} y1={y} x2={W} y2={y} className="mp-grid" />)
  map.features?.forEach((f) => {
    if (f.kind === 'park' && f.north !== undefined && f.south !== undefined && f.west !== undefined && f.east !== undefined) {
      const [x0, y0] = xy(f.north, f.west)
      const [x1, y1] = xy(f.south, f.east)
      out.push(<rect key={key()} x={x0} y={y0} width={r1(x1 - x0)} height={r1(y1 - y0)} rx={6} className="mp-park" />)
    }
  })
  map.districts?.forEach((d, i) => {
    const [x0, y0] = xy(d.north, d.west)
    const [x1, y1] = xy(d.south, d.east)
    out.push(<rect key={key()} x={x0 + 2} y={y0 + 2} width={Math.max(0, r1(x1 - x0 - 4))} height={Math.max(0, r1(y1 - y0 - 4))} rx={6} fill={DISTRICT_FILLS[i % DISTRICT_FILLS.length]} />)
  })
  map.ewStreets?.forEach((s) => {
    const y = xy(s.lat, Wl)[1]
    out.push(<line key={key()} x1={0} y1={y} x2={W} y2={y} className="mp-street" />, <text key={key()} x={8} y={y - 5} className="mp-street-label">{s.label}</text>)
  })
  map.nsStreets?.forEach((s) => {
    const x = xy(S, s.lon)[0]
    out.push(<line key={key()} x1={x} y1={0} x2={x} y2={H} className="mp-street" />, <text key={key()} x={x + 5} y={H - 10} className="mp-street-label" transform={`rotate(-90 ${x + 5} ${H - 10})`}>{s.label}</text>)
  })
  map.features?.forEach((f) => {
    const label = (f.label || '').toUpperCase()
    if (f.kind === 'expressway_ns' && f.lon !== undefined) {
      const x = xy(S, f.lon)[0]
      out.push(<line key={key()} x1={x} y1={0} x2={x} y2={H} className="mp-road" />, <text key={key()} x={x + 8} y={170} className="mp-feature-label" transform={`rotate(-90 ${x + 8} 170)`}>{label}</text>)
    } else if (f.kind === 'expressway_ew' && f.lat !== undefined) {
      const y = xy(f.lat, Wl)[1]
      out.push(<line key={key()} x1={0} y1={y} x2={W} y2={y} className="mp-road" />, <text key={key()} x={W / 2} y={y - 10} className="mp-feature-label" textAnchor="middle">{label}</text>)
    } else if (f.kind === 'water_east' && f.lon !== undefined) {
      const x = xy(S, f.lon)[0]
      out.push(<rect key={key()} x={x} y={0} width={W - x} height={H} className="mp-water" />, <text key={key()} x={x + 10} y={H / 2} className="mp-feature-label" transform={`rotate(90 ${x + 10} ${H / 2})`} textAnchor="middle">{label}</text>)
    } else if (f.kind === 'water_west' && f.lon !== undefined) {
      const x = xy(S, f.lon)[0]
      out.push(<rect key={key()} x={0} y={0} width={x} height={H} className="mp-water" />, <text key={key()} x={x - 10} y={H / 2} className="mp-feature-label" transform={`rotate(-90 ${x - 10} ${H / 2})`} textAnchor="middle">{label}</text>)
    } else if (f.kind === 'water_north' && f.lat !== undefined) {
      const y = xy(f.lat, Wl)[1]
      out.push(<rect key={key()} x={0} y={0} width={W} height={y} className="mp-water" />, <text key={key()} x={20} y={y - 10} className="mp-feature-label">{label}</text>)
    } else if (f.kind === 'water_south' && f.lat !== undefined) {
      const y = xy(f.lat, Wl)[1]
      out.push(<rect key={key()} x={0} y={y} width={W} height={H - y} className="mp-water" />, <text key={key()} x={20} y={y + 20} className="mp-feature-label">{label}</text>)
    } else if (f.kind === 'park' && f.north !== undefined && f.south !== undefined && f.west !== undefined && f.east !== undefined) {
      const [x0, y0] = xy(f.north, f.west)
      const [x1, y1] = xy(f.south, f.east)
      out.push(<text key={key()} x={(x0 + x1) / 2} y={(y0 + y1) / 2} className="mp-landmark-label" textAnchor="middle">{f.label}</text>)
    }
  })
  map.districts?.forEach((d) => {
    const [x0, y0] = xy(d.north, d.west)
    const words = d.name.toUpperCase().split(' ')
    const lines = words.length > 2 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [words.join(' ')]
    out.push(<text key={key()} x={x0 + 14} y={y0 + 28} className="mp-district-label">{lines.map((line, i) => <tspan key={i} x={x0 + 14} dy={i ? 17 : 0}>{line}</tspan>)}</text>)
  })
  map.landmarks?.forEach((l) => {
    const [x, y] = xy(l.lat, l.lon)
    const right = x > W * 0.75
    out.push(<rect key={key()} x={x - 3.5} y={y - 3.5} width={7} height={7} className="mp-landmark" />, <text key={key()} x={right ? x - 8 : x + 8} y={y + 4} className="mp-landmark-label" textAnchor={right ? 'end' : 'start'}>{l.name}</text>)
  })
  page.permits?.highlights?.points?.forEach((p) => {
    if (p.lat < S || p.lat > N || p.lon < Wl || p.lon > E) return
    const [x, y] = xy(p.lat, p.lon)
    out.push(<circle key={key()} cx={x} cy={y} r={Math.min(11, 5 + p.count)} className="mp-dot"><title>{`${p.count} Highlights permit${p.count > 1 ? 's' : ''} on this block`}</title></circle>)
  })

  return (
    <svg viewBox={`0 0 ${W} ${H + 40}`} role="img" aria-labelledby="amap-t amap-d" className="ar-map">
      <title id="amap-t">{`Schematic map of ${page.areaThe}, Chicago`}</title>
      <desc id="amap-d">{page.mapDesc}</desc>
      <rect x={0} y={0} width={W} height={H} rx={8} className="mp-bg" />
      {out}
      <rect x={1} y={1} width={W - 2} height={H - 2} rx={8} className="mp-frame" />
      {Boolean(page.permits?.highlights?.points?.length) && <g><circle cx={12} cy={H + 22} r={6} className="mp-dot" /><text x={26} y={H + 26} className="mp-legend">Highlights permit block</text></g>}
    </svg>
  )
}

/** The district that holds the most Highlights permit blocks, so its card can be highlighted. */
export function busiestDistrict(page: AreaPage): string | undefined {
  const points = page.permits?.highlights?.points || []
  let best: {name: string; count: number} | undefined
  for (const d of page.map?.districts || []) {
    const count = points.filter((p) => p.lat <= d.north && p.lat >= d.south && p.lon >= d.west && p.lon <= d.east).reduce((sum, p) => sum + p.count, 0)
    if (count > 0 && (!best || count > best.count)) best = {name: d.name, count}
  }
  return best?.name
}

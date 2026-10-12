import type {ReactNode} from 'react'
import type {AreaPage} from '@/types/area'

const W = 900
const DISTRICT_TONES = 'frogku'
const r1 = (value: number) => Math.round(value * 10) / 10

/** Schematic SVG map: street grid, districts, landmarks, water, parks and Highlights' permit dots (block level). */
export function AreaMap({page}: {page: AreaPage}) {
  const map = page.map
  const frame = map?.bbox || page.bbox
  if (!map || !frame) return null
  const H = Math.round(map.height || 640)
  const {north: N, south: S, west: Wl, east: E} = frame
  const xy = (lat: number, lon: number): [number, number] => [r1(((lon - Wl) / (E - Wl)) * W), r1(((N - lat) / (N - S)) * H)]
  const parts: ReactNode[] = []
  const key = (() => {
    let n = 0
    return () => n++
  })()

  map.districts?.forEach((district, index) => {
    const [x0, y0] = xy(district.north, district.west)
    const [x1, y1] = xy(district.south, district.east)
    parts.push(<rect key={key()} x={x0} y={y0} width={r1(x1 - x0)} height={r1(y1 - y0)} className={`m-d m-${DISTRICT_TONES[index % DISTRICT_TONES.length]}`} />)
  })
  map.ewStreets?.forEach((street) => {
    const y = xy(street.lat, Wl)[1]
    parts.push(<line key={key()} x1={0} y1={y} x2={W} y2={y} className="m-st" />, <text key={key()} x={6} y={y - 4} className="m-sl">{street.label}</text>)
  })
  map.nsStreets?.forEach((street) => {
    const x = xy(S, street.lon)[0]
    parts.push(<line key={key()} x1={x} y1={0} x2={x} y2={H} className="m-st" />, <text key={key()} x={x + 4} y={H - 8} className="m-sl" transform={`rotate(-90 ${x + 4} ${H - 8})`}>{street.label}</text>)
  })
  map.features?.forEach((feature) => {
    const label = feature.label || ''
    switch (feature.kind) {
      case 'expressway_ns': {
        const x = xy(S, feature.lon ?? Wl)[0]
        parts.push(<line key={key()} x1={x} y1={0} x2={x} y2={H} className="m-xw" />, <text key={key()} x={x + 6} y={160} className="m-sl" transform={`rotate(-90 ${x + 6} 160)`}>{label}</text>)
        break
      }
      case 'expressway_ew': {
        const y = xy(feature.lat ?? S, Wl)[1]
        parts.push(<line key={key()} x1={0} y1={y} x2={W} y2={y} className="m-xw" />, <text key={key()} x={300} y={y - 8} className="m-sl m-w">{label}</text>)
        break
      }
      case 'water_east': {
        const x = xy(S, feature.lon ?? E)[0]
        parts.push(<rect key={key()} x={x} y={0} width={W - x} height={H} className="m-river" />, <text key={key()} x={x + 6} y={H / 2} className="m-rl" transform={`rotate(-90 ${x + 6} ${H / 2})`}>{label}</text>)
        break
      }
      case 'water_west': {
        const x = xy(S, feature.lon ?? Wl)[0]
        parts.push(<rect key={key()} x={0} y={0} width={x} height={H} className="m-river" />, <text key={key()} x={x - 8} y={H / 2} className="m-rl" transform={`rotate(-90 ${x - 8} ${H / 2})`}>{label}</text>)
        break
      }
      case 'water_north': {
        const y = xy(feature.lat ?? N, Wl)[1]
        parts.push(<rect key={key()} x={0} y={0} width={W} height={y} className="m-river" />, <text key={key()} x={20} y={y - 8} className="m-rl">{label}</text>)
        break
      }
      case 'water_south': {
        const y = xy(feature.lat ?? S, Wl)[1]
        parts.push(<rect key={key()} x={0} y={y} width={W} height={H - y} className="m-river" />, <text key={key()} x={20} y={y + 18} className="m-rl">{label}</text>)
        break
      }
      case 'park': {
        if ([feature.north, feature.south, feature.west, feature.east].some((v) => v === undefined)) break
        const [x0, y0] = xy(feature.north!, feature.west!)
        const [x1, y1] = xy(feature.south!, feature.east!)
        parts.push(<rect key={key()} x={x0} y={y0} width={r1(x1 - x0)} height={r1(y1 - y0)} className="m-park" />, <text key={key()} x={(x0 + x1) / 2} y={(y0 + y1) / 2} className="m-ll" textAnchor="middle">{label}</text>)
        break
      }
    }
  })
  map.districts?.forEach((district) => {
    const [x0, y0] = xy(district.north, district.west)
    const [x1, y1] = xy(district.south, district.east)
    parts.push(<text key={key()} x={r1((x0 + x1) / 2)} y={r1((y0 + y1) / 2 + 5)} className="m-dl">{district.name}</text>)
  })
  map.landmarks?.forEach((landmark) => {
    const [x, y] = xy(landmark.lat, landmark.lon)
    const right = x > W * 0.78 // keep labels near the right edge inside the map
    parts.push(<rect key={key()} x={x - 4} y={y - 4} width={8} height={8} className="m-lm" />, <text key={key()} x={right ? x - 8 : x + 8} y={y + 4} className="m-ll" textAnchor={right ? 'end' : 'start'}>{landmark.name}</text>)
  })
  page.permits?.highlights?.points?.forEach((point) => {
    if (point.lat < S || point.lat > N || point.lon < Wl || point.lon > E) return
    const [x, y] = xy(point.lat, point.lon)
    parts.push(<circle key={key()} cx={x} cy={y} r={5 + 2 * point.count} className="m-pt"><title>{`${point.count} Highlights permit${point.count > 1 ? 's' : ''} on this block`}</title></circle>)
  })

  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-labelledby="amap-t amap-d" className="nx-map">
      <title id="amap-t">{`Schematic map of ${page.areaThe}, Chicago`}</title>
      <desc id="amap-d">{page.mapDesc}</desc>
      <rect x={0} y={0} width={W} height={H} className="m-bg" />
      {parts}
    </svg>
  )
}

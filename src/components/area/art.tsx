import {GLYPHS, ILLUSTRATIONS} from '@/lib/area/library'

/** 24x24 line icon from the area-page icon set. Markup is static, from src/lib/area/icons.json. */
export function Icon({name, className = 'nx-ic'}: {name: string; className?: string}) {
  return <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{__html: GLYPHS[name] || ''}} />
}

/** Line-art illustration (viewBox 200x150). `id` keeps the title id unique on the page. */
export function Illustration({name, id}: {name: string; id: string}) {
  const art = ILLUSTRATIONS[name]
  if (!art) return null
  return (
    <svg viewBox="0 0 200 150" className="nx-ill" role="img" aria-labelledby={`${id}-t`}>
      <title id={`${id}-t`}>{art.title}</title>
      <g dangerouslySetInnerHTML={{__html: art.body}} />
    </svg>
  )
}

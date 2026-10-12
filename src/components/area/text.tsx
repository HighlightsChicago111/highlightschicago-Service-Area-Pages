const CONFIRM = /(\[CONFIRM:[^\]]*\])/g

export const hasConfirm = (value?: string) => Boolean(value && /\[CONFIRM:[^\]]*\]/.test(value))

/** Plain text in which "[CONFIRM: ...]" placeholders show as yellow review chips. */
export function T({children}: {children?: string}) {
  if (!children) return null
  if (!hasConfirm(children)) return <>{children}</>
  return <>{children.split(CONFIRM).map((part, index) => part.startsWith('[CONFIRM:') ? <span className="nx-ph" key={index}>{part}</span> : part)}</>
}

/** A placeholder chip for a fact the page cannot state yet. */
export function Ph({children}: {children: string}) {
  return <span className="nx-ph">[CONFIRM: {children}]</span>
}

export const capitalise = (value: string) => value.charAt(0).toUpperCase() + value.slice(1)

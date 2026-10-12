import catalogJson from './catalog.json'
import iconsJson from './icons.json'
import illustrationsJson from './illustrations.json'

export type CatalogItem = {name: string; slug: string | null; line: string}
export type Category = {id: string; title: string; intro: string; items: CatalogItem[]}

export const SERVICES_URL = catalogJson.servicesUrl
export const CATEGORIES = catalogJson.categories as Category[]
export const GLYPHS = iconsJson.glyphs as Record<string, string>
export const SERVICE_ICON = iconsJson.serviceIcon as Record<string, string>
export const CATEGORY_ICON = iconsJson.categoryIcon as Record<string, string>
export const CATEGORY_SHORT = iconsJson.short as Record<string, string>
export const ILLUSTRATIONS = illustrationsJson as Record<string, {title: string; body: string}>

/** The catalogue with this area's overrides applied (keyed by service name, or by category id for the intro). */
export function categoriesFor(overrides: Array<{target: string; line: string}> = []): Category[] {
  const byTarget = new Map(overrides.map((item) => [item.target, item.line]))
  return CATEGORIES.map((category) => ({
    ...category,
    intro: byTarget.get(category.id) ?? category.intro,
    items: category.items.map((item) => ({...item, line: byTarget.get(item.name) ?? item.line})),
  }))
}

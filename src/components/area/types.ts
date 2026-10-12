import type {Category} from '@/lib/area/library'
import type {Faq} from '@/lib/area/copy'
import type {AreaCard, AreaPage, AreaSettings} from '@/types/area'

/** Everything a block needs, resolved once per request by the page template. */
export type AreaCtx = {
  page: AreaPage
  co: AreaSettings
  areas: AreaCard[]
  cats: Category[]
  totalServices: number
  faqs: Faq[]
  /** Show "[CONFIRM: …]" chips: draft preview and development only, never on a published page. */
  editorial: boolean
  tel: string
}

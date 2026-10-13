/** Shapes of areaPage / areaSettings as the queries return them (and as data/area-documents.json stores them). */

export type Keyed = {_key?: string}
export type BBox = {north: number; south: number; west: number; east: number}

export type AreaMap = {
  bbox?: BBox
  height?: number
  ewStreets?: Array<Keyed & {label: string; lat: number}>
  nsStreets?: Array<Keyed & {label: string; lon: number}>
  districts?: Array<Keyed & {name: string} & BBox>
  landmarks?: Array<Keyed & {name: string; lat: number; lon: number}>
  features?: Array<Keyed & {kind: string; label?: string; lat?: number; lon?: number; north?: number; south?: number; west?: number; east?: number}>
}

export type AreaPermits = {
  source?: string
  windowFrom: string
  windowTo: string
  months: number
  electricalTotal: number
  contractors: number
  mix?: Array<Keyed & {label: string; count: number}>
  highlights?: {
    count: number
    addresses?: number
    firstYear?: string
    byType?: Array<Keyed & {type: string; count: number}>
    points?: Array<Keyed & {lat: number; lon: number; count: number}>
  }
}

export type AreaPage = {
  _id: string
  area: string
  areaThe: string
  areaIn: string
  /** Empty for a Chicago neighbourhood; the city for a suburb (e.g. Evanston). */
  city?: string
  cardSummary?: string
  cardRegion?: string
  cardImage?: {image?: unknown; src?: string; alt?: string; credit?: string; creditUrl?: string}
  slug: string
  title?: string
  metaDescription?: string
  eyebrow?: string
  h1?: string
  heroLede: string
  addressPlaceholder?: string
  formRulesQuestion?: string
  formDistricts?: string[]
  formBuildingTypes?: string[]
  teamPhoto?: {src?: string; resolvedUrl?: string; alt?: string; width?: number; height?: number}
  boundaryText: string
  bbox?: BBox
  bboxText?: string
  facts?: Array<Keyed & {label: string; value: string}>
  zips?: string[]
  mapDesc?: string
  map?: AreaMap
  districts?: Array<Keyed & {name: string; intro: string; work: string}>
  buildings?: Array<Keyed & {illus: string; title: string; where: string; changes: string; services?: Array<Keyed & {label: string; category: string}>}>
  scopeLede?: string
  scopeRows?: Array<Keyed & {factor: string; why: string; who: string}>
  hourlyAnswer?: string
  choosingBuildingWhy?: string
  choosingBuildingAnswer?: string
  choosingPaperworkWhy?: string
  whereWeFit?: string
  permits?: AreaPermits
  mixNotes?: Array<Keyed & {label: string; note: string}>
  recordBullets?: string[]
  noRecordText?: string
  honestContext?: string[]
  reviewsHeading?: string
  reviews?: Array<Keyed & {reviewer: string; label?: string; year?: string; link?: string; text: string}>
  nearby?: Array<Keyed & {name: string; note: string}>
  faq?: Array<Keyed & {key?: string; question: string; answer: string}>
  ctaReady?: string[]
  serviceOverrides?: Array<Keyed & {target: string; line: string}>
}

export type AreaSettings = {
  name: string
  short?: string
  phoneDisplay: string
  phoneTel: string
  phoneSchema?: string
  site: string
  address?: {street?: string; city?: string; region?: string; zip?: string}
  licence: string
  licence2?: string
  bbb?: string
  permitsCitywide: string
  permitsSince?: string
  permitsRank?: string
  topWards?: string
  googleRating: string
  googleReviews: string
  officeHours?: string
  founderShort?: string
  founderLine?: string
  founderConfirm?: string
  servicesUrl?: string
  reviewStats?: {total: number; fiveStar: number; owner: number; punctual: number; fairPrice: number; clean: number}
}

export type CardImage = {url?: string; alt?: string; credit?: string; creditUrl?: string}
export type AreaCard = {
  slug: string; area: string; areaIn: string; city?: string; eyebrow?: string; metaDescription?: string; permitCount?: number; illus?: string; districtCount?: number
  cardSummary?: string; cardRegion?: string; cardImage?: CardImage
}

export type AreaPageData = {page: AreaPage | null; settings: AreaSettings | null; areas: AreaCard[]}

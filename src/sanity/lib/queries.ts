import {defineQuery} from 'next-sanity'

const CARD = `"slug": slug.current, area, areaIn, eyebrow, metaDescription, "permitCount": permits.highlights.count, "illus": buildings[0].illus, "districtCount": count(districts)`

export const AREA_CARDS_QUERY = defineQuery(`
  *[_type == "areaPage" && defined(slug.current)] | order(area asc) {${CARD}}
`)

export const AREA_PAGE_QUERY = defineQuery(`
  {
    "page": *[_type == "areaPage" && slug.current == $slug][0] {
      ...,
      "slug": slug.current,
      teamPhoto{..., "resolvedUrl": coalesce(image.asset->url, src)}
    },
    "settings": *[_id == "area-settings"][0],
    "areas": *[_type == "areaPage" && defined(slug.current)] | order(area asc) {${CARD}}
  }
`)

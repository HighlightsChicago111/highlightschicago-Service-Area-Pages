import {defineArrayMember, defineField, defineType} from 'sanity'
import catalog from '@/lib/area/catalog.json'
import illustrations from '@/lib/area/illustrations.json'

/**
 * One document per service area. Fields mirror the area.json content file of the
 * highlights-chicago-service-area-page skill (references/area-config.md), so the skill's
 * output imports one to one. Write [CONFIRM: ...] anywhere a fact still needs checking.
 */

export const CATEGORY_OPTIONS = catalog.categories.map((category) => ({title: category.title, value: category.id}))
export const BUILDING_ILLUSTRATIONS = Object.keys(illustrations)
  .filter((key) => key.startsWith('b-'))
  .map((key) => ({title: (illustrations as Record<string, {title: string}>)[key].title, value: key}))
export const MAP_FEATURE_KINDS = ['expressway_ns', 'expressway_ew', 'water_east', 'water_west', 'water_north', 'water_south', 'park']

const str = (name: string, title: string, extra: Record<string, unknown> = {}) => defineField({name, title, type: 'string', ...extra})
const text = (name: string, title: string, rows = 3, extra: Record<string, unknown> = {}) => defineField({name, title, type: 'text', rows, ...extra})
const num = (name: string, title: string) => defineField({name, title, type: 'number'})
const strings = (name: string, title: string, extra: Record<string, unknown> = {}) =>
  defineField({name, title, type: 'array', of: [defineArrayMember({type: 'string'})], ...extra})
const objects = (name: string, title: string, fields: ReturnType<typeof defineField>[], preview: {title: string; subtitle?: string}, extra: Record<string, unknown> = {}) =>
  defineField({
    name, title, type: 'array', ...extra,
    of: [defineArrayMember({type: 'object', name: `${name}Item`, fields, preview: {select: preview}})],
  })
const box = (name: string, title: string, extra: Record<string, unknown> = {}) =>
  defineField({name, title, type: 'object', ...extra, options: {columns: 4}, fields: [num('north', 'North'), num('south', 'South'), num('west', 'West'), num('east', 'East')]})
const required = {validation: (rule: {required: () => unknown}) => rule.required()}

export const areaPage = defineType({
  name: 'areaPage',
  title: 'Service area pages',
  type: 'document',
  groups: [
    {name: 'basics', title: 'Naming, hero & SEO', default: true},
    {name: 'place', title: 'Facts & map'},
    {name: 'local', title: 'Districts & buildings'},
    {name: 'price', title: 'Price & choosing'},
    {name: 'permits', title: 'Permit record'},
    {name: 'reviews', title: 'Reviews'},
    {name: 'close', title: 'Nearby, FAQ & CTA'},
  ],
  fields: [
    // Naming, hero & SEO
    {...str('area', 'Area name', required), group: 'basics', description: 'As people search it, e.g. West Loop.'},
    {...str('areaThe', 'Area mid-sentence', required), group: 'basics', description: 'e.g. "the West Loop" or "Lincoln Park".'},
    {...str('areaIn', 'Area with "in"', required), group: 'basics', description: 'e.g. "in the West Loop".'},
    defineField({name: 'slug', title: 'URL slug', type: 'slug', group: 'basics', options: {source: 'area'}, description: 'Page URL is /service-areas/<slug>.', validation: (rule) => rule.required()}),
    {...str('title', 'Meta title'), group: 'basics', description: 'Leave empty for "Electricians <in area>, Chicago".'},
    {...text('metaDescription', 'Meta description', 3, required), group: 'basics'},
    {...str('eyebrow', 'Eyebrow (districts)', required), group: 'basics'},
    {...str('h1', 'H1 override'), group: 'basics', description: 'Leave empty for "Electricians <in area>, Chicago".'},
    {...text('heroLede', 'Hero lede', 4, required), group: 'basics'},
    {...str('addressPlaceholder', 'Form address placeholder'), group: 'basics'},
    {...str('formRulesQuestion', 'Form building-rules question'), group: 'basics'},
    {...strings('formDistricts', 'Form: "Where in …?" options'), group: 'basics', description: 'Leave empty to use the district names. "Not sure" is added automatically.'},
    {...strings('formBuildingTypes', 'Form: building type options'), group: 'basics', description: 'Leave empty to use the building type titles. "Not sure" is added automatically.'},
    defineField({
      name: 'teamPhoto', title: 'Team photo', type: 'object', group: 'basics', description: 'Leave empty to use the illustrative stock photo.',
      fields: [
        defineField({name: 'image', title: 'Upload', type: 'image'}),
        str('src', 'Or image URL'), str('alt', 'Alt text'), num('width', 'Width'), num('height', 'Height'),
      ],
    }),

    // Facts & map
    {...text('boundaryText', 'Boundary text', 3, required), group: 'place'},
    {...box('bbox', 'Bounding box (permit data)'), group: 'place'},
    {...str('bboxText', 'Bounding box in words'), group: 'place', description: 'e.g. "Grand Ave, I-290, Ashland Ave and the Chicago River".'},
    {...objects('facts', 'Fact strip', [str('label', 'Label'), str('value', 'Value')], {title: 'label', subtitle: 'value'}), group: 'place'},
    {...strings('zips', 'ZIP codes'), group: 'place'},
    {...text('mapDesc', 'Map description (screen readers)', 2), group: 'place'},
    defineField({
      name: 'map', title: 'Schematic map', type: 'object', group: 'place', options: {collapsible: true, collapsed: true},
      fields: [
        box('bbox', 'Map frame (defaults to the bounding box)'),
        num('height', 'Height (default 640)'),
        objects('ewStreets', 'East-west streets', [str('label', 'Street'), num('lat', 'Latitude')], {title: 'label'}),
        objects('nsStreets', 'North-south streets', [str('label', 'Street'), num('lon', 'Longitude')], {title: 'label'}),
        objects('districts', 'District rectangles', [str('name', 'Name'), num('north', 'North'), num('south', 'South'), num('west', 'West'), num('east', 'East')], {title: 'name'}),
        objects('landmarks', 'Landmarks', [str('name', 'Name'), num('lat', 'Latitude'), num('lon', 'Longitude')], {title: 'name'}),
        objects('features', 'Features', [
          str('kind', 'Kind', {options: {list: MAP_FEATURE_KINDS}}), str('label', 'Label'),
          num('lat', 'Latitude'), num('lon', 'Longitude'), num('north', 'North'), num('south', 'South'), num('west', 'West'), num('east', 'East'),
        ], {title: 'label', subtitle: 'kind'}),
      ],
    }),

    // Districts & buildings
    {...objects('districts', 'Districts (also the form options)', [str('name', 'Name'), text('intro', 'What the district is', 2), text('work', 'What the electrical work looks like', 2)], {title: 'name', subtitle: 'intro'}), group: 'local'},
    {...objects('buildings', 'Building types (also the form options)', [
      str('illus', 'Illustration', {options: {list: BUILDING_ILLUSTRATIONS}}), str('title', 'Title'), str('where', 'Where in the area'),
      text('changes', 'What changes the work', 3),
      objects('services', 'Most-asked services', [str('label', 'Link text'), str('category', 'Service category', {options: {list: CATEGORY_OPTIONS}})], {title: 'label', subtitle: 'category'}),
    ], {title: 'title', subtitle: 'where'}), group: 'local'},

    // Price & choosing
    {...text('scopeLede', 'Scope lede'), group: 'price'},
    {...objects('scopeRows', 'Scope and price factors', [str('factor', 'Factor'), text('why', 'Why it changes the work', 2), str('who', 'Who settles it')], {title: 'factor', subtitle: 'who'}), group: 'price'},
    {...text('hourlyAnswer', '"What\'s your hourly rate?" answer'), group: 'price'},
    {...text('choosingBuildingWhy', 'Why building-type experience matters', 2), group: 'price'},
    {...text('choosingBuildingAnswer', "Highlights' building-type answer", 2), group: 'price'},
    {...text('choosingPaperworkWhy', 'What paperwork buildings ask for', 2), group: 'price'},
    {...text('whereWeFit', 'Where we fit, honestly', 4), group: 'price'},

    // Permit record
    defineField({
      name: 'permits', title: 'City permit data (snapshot)', type: 'object', group: 'permits', options: {collapsible: true, collapsed: true},
      description: 'Imported from permits.py. Re-run the import to refresh; do not edit by hand.',
      fields: [
        str('source', 'Source'), str('windowFrom', 'Window from'), str('windowTo', 'Window to'), num('months', 'Months'),
        num('electricalTotal', 'Electrical permits in window'), num('contractors', 'Electrical contractors named'),
        objects('mix', 'Permit mix', [str('label', 'Type of work'), num('count', 'Permits')], {title: 'label'}),
        defineField({
          name: 'highlights', title: "Highlights' permits in the box", type: 'object',
          fields: [
            num('count', 'Permits'), num('addresses', 'Addresses'), str('firstYear', 'First year'),
            objects('byType', 'By permit type', [str('type', 'Type'), num('count', 'Permits')], {title: 'type'}),
            objects('points', 'Map dots (block level)', [num('lat', 'Latitude'), num('lon', 'Longitude'), num('count', 'Permits')], {title: 'count'}),
          ],
        }),
      ],
    }),
    {...objects('mixNotes', 'Permit mix notes', [str('label', 'Type of work'), str('note', 'What it tells you')], {title: 'label', subtitle: 'note'}), group: 'permits'},
    {...strings('recordBullets', 'Our record (block level only)'), group: 'permits'},
    {...text('noRecordText', 'Text when we have no permits here'), group: 'permits'},
    {...strings('honestContext', 'The honest context (paragraphs)'), group: 'permits'},

    // Reviews
    {...str('reviewsHeading', 'Reviews heading'), group: 'reviews'},
    {...objects('reviews', 'Reviews (6 to 8)', [
      str('reviewer', 'Reviewer'), str('label', 'Job label'), str('year', 'Year'), defineField({name: 'link', title: 'Google link', type: 'url'}),
      text('text', 'Review text (never edited, only cut at a sentence end)', 6),
    ], {title: 'reviewer', subtitle: 'label'}), group: 'reviews'},

    // Nearby, FAQ & CTA
    {...objects('nearby', 'Neighbouring areas', [str('name', 'Name'), str('note', 'How the building stock differs')], {title: 'name', subtitle: 'note'}), group: 'close'},
    {...objects('faq', 'Area FAQs (7 generic FAQs are added after these)', [str('key', 'Key (faq-...)'), str('question', 'Question'), text('answer', 'Answer', 4)], {title: 'question'}), group: 'close'},
    {...strings('ctaReady', 'Have these ready when you call'), group: 'close'},
    {...objects('serviceOverrides', 'Service line overrides', [str('target', 'Service name or category id'), text('line', 'Replacement line', 2)], {title: 'target', subtitle: 'line'}), group: 'close'},
    {...objects('researchSources', 'Research sources', [str('title', 'Title'), defineField({name: 'url', title: 'URL', type: 'url'}), str('type', 'Type')], {title: 'title', subtitle: 'type'}), group: 'close'},
  ],
  validation: (rule) => rule.custom((doc) => {
    const found = JSON.stringify(doc || {}).match(/\[CONFIRM:[^\]]*\]/g)
    return found ? `${found.length} [CONFIRM: ...] placeholder(s) still need an answer before publishing` : true
  }).warning(),
  preview: {select: {title: 'area', slug: 'slug.current'}, prepare: ({title, slug}) => ({title, subtitle: slug ? `/service-areas/${slug}` : 'No slug'})},
  orderings: [{title: 'Area name', name: 'areaAsc', by: [{field: 'area', direction: 'asc'}]}],
})

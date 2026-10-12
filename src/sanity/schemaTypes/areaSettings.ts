import {defineField, defineType} from 'sanity'

/** Company facts shared by every area page (the skill's assets/company.json) plus review-pack figures. */
export const AREA_SETTINGS_ID = 'area-settings'

const str = (name: string, title: string) => defineField({name, title, type: 'string'})
const num = (name: string, title: string) => defineField({name, title, type: 'number'})

export const areaSettings = defineType({
  name: 'areaSettings',
  title: 'Company facts (area pages)',
  type: 'document',
  fields: [
    defineField({name: 'name', title: 'Company name', type: 'string', validation: (rule) => rule.required()}),
    str('short', 'Short name'),
    str('phoneDisplay', 'Phone (display)'), str('phoneTel', 'Phone (tel: link)'), str('phoneSchema', 'Phone (schema)'),
    defineField({name: 'site', title: 'Site URL', type: 'url'}),
    defineField({name: 'address', title: 'Address', type: 'object', fields: [str('street', 'Street'), str('city', 'City'), str('region', 'State'), str('zip', 'ZIP')]}),
    str('licence', 'City licence'), str('licence2', 'Second City licence'), str('bbb', 'BBB line'),
    str('permitsCitywide', 'Citywide permit count'), str('permitsSince', 'Permits since'), str('permitsRank', 'Permit rank line'), str('topWards', 'Top wards'),
    str('googleRating', 'Google rating'), str('googleReviews', 'Google review count'), str('officeHours', 'Office hours'),
    str('founderShort', 'Founder (short)'), defineField({name: 'founderLine', title: 'Founder line', type: 'text', rows: 3}), str('founderConfirm', 'Founder: still to confirm'),
    defineField({name: 'servicesUrl', title: 'Services URL', type: 'url'}),
    defineField({
      name: 'reviewStats', title: 'Review pack figures', type: 'object', description: 'Counted from the review pack by the import. Approximate, keyword-matched.',
      fields: [num('total', 'Reviews analysed'), num('fiveStar', 'Five-star'), num('owner', 'Name the owner'), num('punctual', 'Mention punctuality'), num('fairPrice', 'Call the price fair'), num('clean', 'Mention cleanliness')],
    }),
  ],
  preview: {prepare: () => ({title: 'Company facts (area pages)'})},
})

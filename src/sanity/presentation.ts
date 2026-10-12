import {defineLocations, type PresentationPluginOptions} from 'sanity/presentation'

export const resolve: PresentationPluginOptions['resolve'] = {
  locations: {
    areaPage: defineLocations({
      select: {title: 'area', slug: 'slug.current'},
      resolve: (doc) => ({locations: doc?.slug ? [{title: doc.title || 'Service area page', href: `/service-areas/${doc.slug}`}] : []}),
    }),
  },
}

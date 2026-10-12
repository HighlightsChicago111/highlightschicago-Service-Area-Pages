import type {DefaultDocumentNodeResolver, StructureResolver} from 'sanity/structure'
import {LivePageView} from './live-page-view'
import {AREA_SETTINGS_ID} from './schemaTypes/areaSettings'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Service Areas')
    .items([
      S.documentTypeListItem('areaPage').title('Service area pages'),
      S.divider(),
      S.listItem().title('Company facts').child(S.document().schemaType('areaSettings').documentId(AREA_SETTINGS_ID)),
    ])

/** Area pages get a "Live page" tab next to the form. */
export const defaultDocumentNode: DefaultDocumentNodeResolver = (S, {schemaType}) =>
  schemaType === 'areaPage' ? S.document().views([S.view.form(), S.view.component(LivePageView).title('Live page')]) : S.document()

import type {StructureResolver} from 'sanity/structure'
import {AREA_SETTINGS_ID} from './schemaTypes/areaSettings'

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Service Areas')
    .items([
      S.documentTypeListItem('areaPage').title('Service area pages'),
      S.divider(),
      S.listItem().title('Company facts').child(S.document().schemaType('areaSettings').documentId(AREA_SETTINGS_ID)),
    ])

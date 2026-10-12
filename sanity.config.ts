'use client'

import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {presentationTool} from 'sanity/presentation'
import {structureTool} from 'sanity/structure'
import {resolve} from './src/sanity/presentation'
import {schemaTypes} from './src/sanity/schemaTypes'
import {defaultDocumentNode, structure} from './src/sanity/structure'

export default defineConfig({
  name: 'service-areas',
  title: 'Highlights Chicago Service Areas',
  projectId: process.env.NEXT_SANITY_PROJECT_ID || 'not-configured',
  dataset: process.env.NEXT_SANITY_DATASET || 'production',
  basePath: '/service-areas/studio',
  plugins: [
    structureTool({structure, defaultDocumentNode}),
    presentationTool({resolve, previewUrl: {initial: '/service-areas', previewMode: {enable: '/service-areas/api/draft-mode/enable'}}}),
    visionTool(),
  ],
  schema: {types: schemaTypes},
})

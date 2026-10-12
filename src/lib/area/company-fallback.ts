import documents from '../../../data/area-documents.json'
import type {AreaSettings} from '@/types/area'

/**
 * The company facts bundled with the build (from content/company.json via `pnpm content:build`).
 * Used when the Company facts document has not been published in Sanity yet, so publishing
 * an area page is enough to see it live.
 */
export const BUNDLED_SETTINGS = (documents as Array<{_type: string}>).find((doc) => doc._type === 'areaSettings') as unknown as AreaSettings

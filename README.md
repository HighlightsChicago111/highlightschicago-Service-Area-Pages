# Highlights Chicago Service Areas

Electrician service area pages ("Electricians in the West Loop, Chicago"), one per neighbourhood, at
`www.highlightschicago.com/service-areas/<slug>`, with a card collection at `/service-areas`. Content lives in Sanity;
the design is the approved service area page template.

## What is here

| Part | Where |
|---|---|
| Area page template | `src/components/area/area-landing-page.tsx` (folds), `area-map.tsx` (schematic map), `area-behaviours.tsx` (tabs, carousels, review slider), `src/app/area-page.css` |
| Collection page | `src/app/page.tsx`, `src/components/area/area-collection.tsx` |
| Sanity fields | `src/sanity/schemaTypes/areaPage.ts` (one document per area), `areaSettings.ts` (company facts, one document) |
| Service catalogue, icons, drawings | `src/lib/area/*.json`, exported from the area-page skill by `scripts/export_area_library.py` |
| Content (skill output) | `content/areas/<slug>/area.json` + `permits.json`, `content/company.json`, `content/highlights-reviews.csv` |
| Import pipeline | `scripts/build-area-documents.ts`, `scripts/push-area-documents.ts`, tests in `scripts/test-area-documents.ts` |
| Studio | `/service-areas/studio` |

The Sanity fields mirror the `area.json` content file of the `highlights-chicago-service-area-page` skill
(`references/area-config.md`), so the skill keeps writing content exactly as it does today.

## Adding or refreshing an area

1. Run the skill for the area. Put its `area.json` and `permits.json` in `content/areas/<slug>/` (folder name = slug).
2. `corepack pnpm content:build`: validates (illustrations, service categories, reviewers, required fields) and writes `data/area-documents.json`.
3. Preview without Sanity: start the dev server with `AREA_CONTENT_SOURCE=local` and open `http://localhost:3008/service-areas/<slug>`.
4. `corepack pnpm sanity:check`: read-only, shows which project/dataset `.env.local` points at.
5. `corepack pnpm content:push`: dry run. `--yes` writes drafts; `--publish --yes` publishes. `--only west-loop` limits pages.

`[CONFIRM: question]` in any text marks a fact still to confirm. It shows as a yellow chip, stays out of the FAQ schema,
and `content:build` lists every one.

## Checks

`corepack pnpm test:content`, `corepack pnpm typecheck`, `corepack pnpm lint`, `corepack pnpm build`.

## Deploying on Vercel

Environment variables: `NEXT_SANITY_PROJECT_ID`, `NEXT_SANITY_DATASET`, `NEXT_SANITY_API_VERSION`,
`NEXT_SANITY_STUDIO_URL=/service-areas/studio`, `NEXT_SITE_URL`, `SANITY_API_READ_TOKEN`. Never add the write token.
Add the Vercel domain to the Sanity project's CORS origins. Pages are `noindex` until they go live on the main domain.
